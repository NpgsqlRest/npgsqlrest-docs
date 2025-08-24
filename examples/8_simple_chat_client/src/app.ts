import { login, logout, sendMessage, createSendMessageEventSource, getMessages } from "./example8Api.ts";

const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const loginBtn = document.getElementById("login-btn")!;
const logoutBtn = document.getElementById("logout-btn")!;
const result = document.getElementById("result")!;

const loginSection = document.getElementById("login-section")!;
const chatSection = document.getElementById("chat-section")!;
const authStatus = document.getElementById("auth-status")!;

const messageInput = document.getElementById("message-input") as HTMLInputElement;
const sendBtn = document.getElementById("send-btn")!;
const chatMessages = document.getElementById("chat-messages")!;
const connectionStatus = document.getElementById("connection-status")!;

const channelName = "TEST_CHANNEL";

let eventSource: EventSource | null = null;

interface ChatMessage {
    message_id: number;
    user_id: number;
    username: string;
    message_text: string;
    created_at: string;
}

function formatTime(isoString: string): string {
    // Fix timezone offset format: +00 -> +00:00
    const fixedString = isoString.replace(/([+-]\d{2})$/, '$1:00');
    const date = new Date(fixedString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function appendMessage(msg: ChatMessage) {
    const messageEl = document.createElement("div");
    messageEl.className = "message";
    messageEl.innerHTML = `
        <div class="meta">
            <span class="username">${msg.username}</span>
            <span class="time">${formatTime(msg.created_at)}</span>
        </div>
        <div class="text">${msg.message_text}</div>
    `;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function connectEventSource() {
    if (eventSource) {
        eventSource.close();
    }

    eventSource = createSendMessageEventSource(channelName);
    connectionStatus.textContent = "Connected";
    connectionStatus.className = "status-connected";

    eventSource.onmessage = (event: MessageEvent) => {
        const msg: ChatMessage = JSON.parse(event.data);
        appendMessage(msg);
    };

    eventSource.onerror = () => {
        connectionStatus.textContent = "Disconnected";
        connectionStatus.className = "status-disconnected";
    };
}

function disconnectEventSource() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
    connectionStatus.textContent = "Disconnected";
    connectionStatus.className = "status-disconnected";
}

async function loadExistingMessages() {
    const response = await getMessages();
    if (response.status === 200 && response.response) {
        for (const msg of response.response) {
            appendMessage({
                message_id: msg.messageId!,
                user_id: msg.userId!,
                username: msg.username!,
                message_text: msg.messageText!,
                created_at: msg.createdAt!
            });
        }
    }
}

function showLoggedIn(username: string) {
    authStatus.innerHTML = `<p style="color: green;">Logged in as <strong>${username}</strong></p>`;
    loginSection.classList.add("hidden");
    chatSection.classList.remove("hidden");
    loadExistingMessages();
    connectEventSource();
}

function showLoggedOut() {
    authStatus.innerHTML = `<p style="color: gray;">Not authenticated</p>`;
    loginSection.classList.remove("hidden");
    chatSection.classList.add("hidden");
    chatMessages.innerHTML = "";
    disconnectEventSource();
}

// Check initial auth state
const user = (window as any).user as { userId: number | null; username: string } | undefined;
if (user?.userId != null && !isNaN(user.userId)) {
    showLoggedIn(user.username);
} else {
    showLoggedOut();
}

loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    const response = await login({ username, password });

    if (response.status === 200) {
        result.innerHTML = `<p style="color: green;">Login successful!</p>`;
        showLoggedIn(username);
    } else {
        result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
        <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
    }
});

logoutBtn.addEventListener("click", async () => {
    const response = await logout();

    if (response.status === 200) {
        result.innerHTML = `<p style="color: green;">Logged out successfully!</p>`;
        showLoggedOut();
    } else {
        result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
        <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
    }
});

async function sendChatMessage() {
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    messageInput.value = "";

    const response = await sendMessage(
        { messageText },
        undefined,
        channelName
    );

    if (response.status !== 204 && response.status !== 200) {
        result.innerHTML = `<p style="color: red;">Failed to send message: ${JSON.stringify(response.error)}</p>`;
    }
}

sendBtn.addEventListener("click", sendChatMessage);

messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendChatMessage();
    }
});
