const API_URL = 'https://chatapprathnam.onrender.com/api/messages';

const userInput = document.getElementById('user');
const textInput = document.getElementById('text');
const sendButton = document.getElementById('sendMessage');
const chatBody = document.getElementById('chatBody');
const statusText = document.getElementById('status');

function showStatus(message) {
    statusText.textContent = message;
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
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error('Unable to load messages');
        }

        const data = await response.json();

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
                message.createdAt
                    ? new Date(message.createdAt).toLocaleString()
                    : ''
            );
        });

    } catch (error) {
        showStatus('Unable to load messages. Please try again.');
    }
}

async function sendMessage(user, text) {
    sendButton.disabled = true;
    showStatus('Sending message...');

    try {
        const response = await fetch(API_URL, {
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
            throw new Error('Message could not be sent');
        }

        textInput.value = '';
        showStatus('Message sent successfully!');

        await loadMessages();

    } catch (error) {
        showStatus('Failed to send. Please check your connection.');
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
        sendButton.click();
    }
});

loadMessages();