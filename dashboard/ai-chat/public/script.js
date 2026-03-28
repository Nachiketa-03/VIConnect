// Use a suggested prompt
function useSuggestion(text) {
    document.getElementById('userInput').value = text;
    sendMessage();
}

// Get formatted time
function getTimeString() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Copy message text
function copyMessage(btn) {
    const msgEl = btn.closest('.message').querySelector('pre') || btn.closest('.message');
    const text = msgEl.textContent.replace('Copy', '').trim();
    navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i>'; }, 1500);
    });
}

async function sendMessage() {
    const userInput = document.getElementById("userInput").value.trim();
    if (userInput === "") return;

    // Hide welcome container
    const welcome = document.getElementById("welcomeContainer");
    if (welcome) welcome.style.display = 'none';

    const inputField = document.getElementById("userInput");
    const sendButton = document.getElementById("sendBtn");
    
    try {
        inputField.disabled = true;
        sendButton.disabled = true;

        // Display user's message
        appendMessage(userInput, 'user-message');
        inputField.value = "";

        // Show loading animation
        const loadingDiv = appendMessage('', 'bot-message loading-message');
        loadingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ message: userInput })
        });

        const responseData = await response.json();

        try {
            loadingDiv.remove();

            const botMessageDiv = appendMessage('', 'bot-message');
            
            // Add copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.onclick = function() { copyMessage(this); };
            botMessageDiv.appendChild(copyBtn);

            const preElement = document.createElement('pre');
            botMessageDiv.appendChild(preElement);
            
            await typeMessage(preElement, responseData.response, 30);

        } catch (error) {
            console.error('Error:', error);
            throw new Error('Error displaying response');
        }

    } catch (error) {
        console.error("Error details:", error);
        const errorDiv = appendMessage('', 'bot-message error-message');
        errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Connection error. Please try again.';
    } finally {
        inputField.disabled = false;
        sendButton.disabled = false;
        inputField.focus();
    }
}

function appendMessage(text, className) {
    const chatBox = document.getElementById("chatBox");
    const messageDiv = document.createElement("div");
    const classes = className.split(' ');
    messageDiv.classList.add('message', ...classes);
    messageDiv.innerText = text;

    // Add timestamp
    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = getTimeString();
    messageDiv.appendChild(timeSpan);

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageDiv;
}

document.getElementById("userInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function typeMessage(element, text, speed = 30) {
    const lines = text.split('\n');
    let lineIndex = 0;
    element.textContent = '';
    
    return new Promise(resolve => {
        function typeLine() {
            if (lineIndex < lines.length) {
                if (lines[lineIndex].trim() !== '') {
                    element.textContent += lines[lineIndex] + '\n';
                }
                lineIndex++;
                const chatBox = document.getElementById("chatBox");
                chatBox.scrollTop = chatBox.scrollHeight;
                setTimeout(typeLine, speed);
            } else {
                resolve();
            }
        }
        typeLine();
    });
}
