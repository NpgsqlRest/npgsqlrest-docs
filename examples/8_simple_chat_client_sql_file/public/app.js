// src/sqlApi.ts
var baseUrl = "";
var createSendMessageEventSource = (id = "") => new EventSource(baseUrl + "/api/send-message/info?" + id);
async function getMessages() {
  const response = await fetch(baseUrl + "/api/get-messages", {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  return {
    status: response.status,
    response: response.ok ? await response.json() : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function login(request) {
  const response = await fetch(baseUrl + "/api/login", {
    method: "POST",
    body: JSON.stringify(request)
  });
  return {
    status: response.status,
    response: response.ok ? await response.text() : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function logout() {
  const response = await fetch(baseUrl + "/api/logout", {
    method: "POST"
  });
  return {
    status: response.status,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function sendMessage(request, onMessage, id = undefined, closeAfterMs = 1000, awaitConnectionMs = 0) {
  const executionId = id ? id : window.crypto.randomUUID();
  let eventSource;
  if (onMessage) {
    eventSource = createSendMessageEventSource(executionId);
    eventSource.onmessage = (event) => {
      onMessage(event.data);
    };
    if (awaitConnectionMs !== undefined) {
      await new Promise((resolve) => setTimeout(resolve, awaitConnectionMs));
    }
  }
  try {
    const response = await fetch(baseUrl + "/api/send-message", {
      method: "POST",
      headers: {
        "X-NpgsqlRest-ID": executionId
      },
      body: JSON.stringify(request)
    });
    return {
      status: response.status,
      response: response.ok ? await response.json() : undefined,
      error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
    };
  } finally {
    if (onMessage) {
      setTimeout(() => eventSource.close(), closeAfterMs);
    }
  }
}

// src/app.ts
var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var loginBtn = document.getElementById("login-btn");
var logoutBtn = document.getElementById("logout-btn");
var result = document.getElementById("result");
var loginSection = document.getElementById("login-section");
var chatSection = document.getElementById("chat-section");
var authStatus = document.getElementById("auth-status");
var messageInput = document.getElementById("message-input");
var sendBtn = document.getElementById("send-btn");
var chatMessages = document.getElementById("chat-messages");
var connectionStatus = document.getElementById("connection-status");
var channelName = "TEST_CHANNEL";
var eventSource = null;
function formatTime(isoString) {
  const fixedString = isoString.replace(/([+-]\d{2})$/, "$1:00");
  const date = new Date(fixedString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function appendMessage(msg) {
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
  eventSource.onmessage = (event) => {
    const msg = JSON.parse(event.data);
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
        message_id: msg.messageId,
        user_id: msg.userId,
        username: msg.username,
        message_text: msg.messageText,
        created_at: msg.createdAt
      });
    }
  }
}
function showLoggedIn(username) {
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
var user = window.user;
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
  if (!messageText)
    return;
  messageInput.value = "";
  const response = await sendMessage({ messageText }, undefined, channelName);
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
