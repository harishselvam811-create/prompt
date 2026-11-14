const API_URL = 'https://chatapprathnam.onrender.com/api/messages';

const userInput = document.getElementById('user');
const textInput = document.getElementById('text');
const sendButton = document.getElementById('sendMessage');
const chatBody = document.getElementById('chatBody');
const statusText = document.getElementById('status');

function showStatus(message) {
    statusText.textContent = message;
}

// Render's free tier sleeps when idle and can take up to ~60s to wake up,
// so use a long timeout instead of letting the request fail silently.
async function apiFetch(options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(function () {
        controller.abort();
    }, 60000);

    try {
        return await fetch(API_URL, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '' : date.toLocaleString();
}

function displayMessage(user, text, time = '') {
    const welcome = chatBody.querySelector('.welcome-message');

    if (welcome) {
        welcome.remove();
    }

    const messageBox = document.createElement('div');
    messageBox.className = 'message';

    const username = document.createElement('strong');
    username.textContent = user;

    const messageText = document.createElement('p');
    messageText.textContent = text;

    messageBox.appendChild(username);
    messageBox.appendChild(messageText);

    if (time) {
        const timeText = document.createElement('small');
        timeText.textContent = time;
        messageBox.appendChild(timeText);
    }

    chatBody.appendChild(messageBox);
    chatBody.scrollTop = chatBody.scrollHeight;
}

async function loadMessages() {
    try {
        const response = await apiFetch();

        if (!response.ok) {
            throw new Error('Server responded with ' + response.status);
        }

        const json = await response.json();
        const data = Array.isArray(json) ? json : (json.messages || []);

        chatBody.replaceChildren();

        if (!Array.isArray(data) || data.length === 0) {
            const welcome = document.createElement('div');
            welcome.className = 'welcome-message';

            const heading = document.createElement('h3');
            heading.textContent = 'Welcome to Chat! 👋';

            const paragraph = document.createElement('p');
            paragraph.textContent = 'No messages yet. Start a conversation!';

            welcome.append(heading, paragraph);
            chatBody.appendChild(welcome);
            return;
        }

        data.forEach(function (message) {
            displayMessage(
                message.user,
                message.text,
                formatTime(message.createdAt)
            );
        });

        if (statusText.textContent.startsWith('Unable to load')) {
            showStatus('');
        }

    } catch (error) {
        console.error('loadMessages failed:', error);
        showStatus('Unable to load messages. The server may be waking up, please try again in a moment.');
    }
}

async function sendMessage(user, text) {
    sendButton.disabled = true;
    showStatus('Sending message...');

    try {
        const response = await apiFetch({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: user,
                text: text
            })
        });

        if (!response.ok) {
            throw new Error('Server responded with ' + response.status);
        }

        textInput.value = '';
        showStatus('Message sent successfully!');

        await loadMessages();

    } catch (error) {
        console.error('sendMessage failed:', error);
        showStatus('Failed to send. Please check your connection and try again.');
    } finally {
        sendButton.disabled = false;
    }
}

sendButton.addEventListener('click', function () {
    const user = userInput.value.trim();
    const text = textInput.value.trim();

    if (!user || !text) {
        showStatus('Please enter both username and message.');
        return;
    }

    sendMessage(user, text);
});

textInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendButton.click();
    }
});

userInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        textInput.focus();
    }
});

showStatus('Loading messages...');
loadMessages().then(function () {
    if (statusText.textContent === 'Loading messages...') {
        showStatus('');
    }
});

// Refresh every 10 seconds to pick up other people's messages
setInterval(function () {
    if (!sendButton.disabled) {
        loadMessages();
    }
}, 10000);