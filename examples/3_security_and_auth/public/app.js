// src/example3PublicApi.ts
var baseUrl = "http://127.0.0.1:8080";
var parseQuery = (query) => "?" + Object.keys(query ? query : {}).map((key) => {
  const value = query[key] != null ? query[key] : "";
  if (Array.isArray(value)) {
    return value.map((s) => s ? `${key}=${encodeURIComponent(s)}` : `${key}=`).join("&");
  }
  return `${key}=${encodeURIComponent(value)}`;
}).join("&");
async function login(request) {
  const response = await fetch(baseUrl + "/api/example-3-public/login", {
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
  const response = await fetch(baseUrl + "/api/example-3-public/logout", {
    method: "POST"
  });
  return {
    status: response.status,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function whoAmI(request) {
  const response = await fetch(baseUrl + "/api/example-3-public/who-am-i" + parseQuery(request), {
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

// src/app.ts
var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var loginBtn = document.getElementById("login-btn");
var whoamiBtn = document.getElementById("whoami-btn");
var logoutBtn = document.getElementById("logout-btn");
var result = document.getElementById("result");
var user = window.user;
var isAuthenticated = !!user?.userId;
var authStatus = document.getElementById("auth-status");
if (isAuthenticated) {
  authStatus.innerHTML = `<p style="color: green;">Logged in as <strong>${user.username}</strong></p>`;
} else {
  authStatus.innerHTML = `<p style="color: gray;">Not authenticated</p>`;
}
loginBtn.addEventListener("click", async () => {
  const username = usernameInput.value;
  const password = passwordInput.value;
  const response = await login({ username, password });
  if (response.status === 200) {
    result.innerHTML = `<p style="color: green;">Login successful</p>`;
  } else {
    result.innerHTML = `
    <p style="color: red;">Status: ${response.status}</p>
    <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>`;
  }
});
whoamiBtn.addEventListener("click", async () => {
  const response = await whoAmI({});
  if (response.status === 200 && response.response.length > 0) {
    const user2 = response.response[0];
    result.innerHTML = `
      <p><strong>User ID:</strong> ${user2.userId}</p>
      <p><strong>Username:</strong> ${user2.username}</p>
      <p><strong>Email:</strong> ${user2.email}</p>
    `;
  } else {
    result.innerHTML = `
    <p style="color: red;">Status: ${response.status}</p>
    <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>
    `;
  }
});
logoutBtn.addEventListener("click", async () => {
  const response = await logout();
  if (response.status === 200) {
    result.innerHTML = `<p style="color: green;">Logged out successfully</p>`;
  } else {
    result.innerHTML = `
    <p style="color: red;">Status: ${response.status}</p>
    <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>`;
  }
});
