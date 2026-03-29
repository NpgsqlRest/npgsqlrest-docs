// src/apiApi.ts
var baseUrl = "";
async function getUsers(parseRequest = (request) => request) {
  const response = await fetch(baseUrl + "/api/get-users", parseRequest({
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  }));
  return {
    status: response.status,
    response: response.ok ? await response.json() : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function login(request, parseRequest = (request2) => request2) {
  const response = await fetch(baseUrl + "/api/login", parseRequest({
    method: "POST",
    body: JSON.stringify(request)
  }));
  return {
    status: response.status,
    response: response.ok ? await response.text() : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function logout(parseRequest = (request) => request) {
  const response = await fetch(baseUrl + "/api/logout", parseRequest({
    method: "POST"
  }));
  return {
    status: response.status,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function whoAmI(parseRequest = (request) => request) {
  const response = await fetch(baseUrl + "/api/who-am-i", parseRequest({
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  }));
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
var getUsersBtn = document.getElementById("getusers-btn");
var logoutBtn = document.getElementById("logout-btn");
var result = document.getElementById("result");
var authStatus = document.getElementById("auth-status");
var currentScheme = null;
var authToken = null;
function getSelectedScheme() {
  const selected = document.querySelector('input[name="scheme"]:checked');
  return selected?.value || "cookies";
}
function updateAuthStatus(name, scheme) {
  if (name) {
    if (scheme) {
      authStatus.innerHTML = `<p style="color: green;">Logged in as <strong>${name}</strong> (${scheme})</p>`;
    } else {
      authStatus.innerHTML = `<p style="color: green;">Logged in as <strong>${name}</strong></p>`;
    }
  } else {
    authStatus.innerHTML = `<p style="color: gray;">Not authenticated</p>`;
  }
}
function parseRequest(request) {
  if (!authToken) {
    return request;
  }
  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${authToken}`);
  return {
    ...request,
    headers
  };
}
loginBtn.addEventListener("click", async () => {
  const username = usernameInput.value;
  const password = passwordInput.value;
  const scheme = getSelectedScheme();
  const response = await login({ scheme, username, password });
  if (response.status === 200) {
    currentScheme = scheme;
    if (scheme === "token" || scheme === "jwt") {
      const responseData = JSON.parse(response.response);
      authToken = responseData.accessToken;
      result.innerHTML = `
                <p style="color: green;">Login successful (${scheme})</p>
                <p><strong>Response:</strong></p>
                <pre style="word-break: break-all; white-space: pre-wrap; font-size: 11px;">${JSON.stringify(responseData, null, 2)}</pre>
            `;
    } else {
      authToken = null;
      result.innerHTML = `<p style="color: green;">Login successful (cookies)</p>`;
    }
    updateAuthStatus(username, scheme);
  } else {
    result.innerHTML = `
            <p style="color: red;">Login failed - Status: ${response.status}</p>
            <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>
        `;
  }
});
whoamiBtn.addEventListener("click", async () => {
  const response = await whoAmI(parseRequest);
  if (response.status === 200) {
    const userData = response.response;
    result.innerHTML = `
            <p><strong>User ID:</strong> ${userData.userId}</p>
            <p><strong>Username:</strong> ${userData.username}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Roles:</strong> ${userData.roles?.join(", ") || "none"}</p>
            <p><strong>Last Login:</strong> ${userData.lastLogin || "N/A"}</p>
            <p><strong>Last Login Provider:</strong> ${userData.lastLoginProvider || "N/A"}</p>
        `;
  } else {
    result.innerHTML = `
            <p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>
        `;
  }
});
getUsersBtn.addEventListener("click", async () => {
  const response = await getUsers(parseRequest);
  if (response.status === 200) {
    const users = response.response;
    let html = `<p><strong>Users (${users.length}):</strong></p><ul>`;
    for (const u of users) {
      const meTag = u.isThisMe ? " <em>(this is you)</em>" : "";
      html += `<li><strong>${u.username}</strong> (${u.email}) - roles: ${u.roles?.join(", ") || "none"}${meTag}</li>`;
    }
    html += "</ul>";
    result.innerHTML = html;
  } else {
    result.innerHTML = `
            <p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>
            <p style="color: gray;"><em>Note: This endpoint requires admin role (try logging in as bob)</em></p>
        `;
  }
});
logoutBtn.addEventListener("click", async () => {
  const response = await logout(parseRequest);
  if (response.status === 200) {
    result.innerHTML = `<p style="color: green;">Logged out successfully</p>`;
    currentScheme = null;
    authToken = null;
    updateAuthStatus(null, null);
  } else {
    result.innerHTML = `
            <p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>
        `;
  }
});
var user = window.user;
updateAuthStatus(user?.username || null, null);
