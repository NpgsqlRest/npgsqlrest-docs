// src/sqlApi.ts
var baseUrl = "";
var parseQuery = (query) => "?" + Object.keys(query ? query : {}).map((key) => {
  const value = query[key] != null ? query[key] : "";
  if (Array.isArray(value)) {
    return value.map((s) => s ? `${key}=${encodeURIComponent(s)}` : `${key}=`).join("&");
  }
  return `${key}=${encodeURIComponent(value)}`;
}).join("&");
var getDataUrl = (request) => baseUrl + "/api/get-data" + parseQuery(request);
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

// src/app.ts
var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var loginBtn = document.getElementById("login-btn");
var logoutBtn = document.getElementById("logout-btn");
var result = document.getElementById("result");
var excelLink = document.getElementById("excel-link");
var loginSection = document.getElementById("login-section");
var uploadSection = document.getElementById("upload-section");
var authStatus = document.getElementById("auth-status");
function showLoggedIn(username) {
  authStatus.innerHTML = '<p style="color: green;">Logged in as <strong>' + username + "</strong></p>";
  loginSection.classList.add("hidden");
  uploadSection.classList.remove("hidden");
}
function showLoggedOut() {
  authStatus.innerHTML = `<p style="color: gray;">Not authenticated</p>`;
  loginSection.classList.remove("hidden");
  uploadSection.classList.add("hidden");
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
    result.innerHTML = `<p style="color: green;">Login successful!</p><pre>${response.response}</pre>`;
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
excelLink.addEventListener("click", (e) => {
  e.preventDefault();
  const dateStr = new Date().toISOString().slice(0, 19).replace(/[-:]/g, "");
  const fileName = `data-${dateStr}.xlsx`;
  const sheetName = `data-${dateStr}`;
  document.location.href = getDataUrl({
    format: "excel",
    excelFileName: fileName,
    excelSheet: sheetName
  });
});
