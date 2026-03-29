import { login, logout, whoAmI } from "./sqlSrcApi.ts";

const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const loginBtn = document.getElementById("login-btn")!;
const whoamiBtn = document.getElementById("whoami-btn")!;
const logoutBtn = document.getElementById("logout-btn")!;
const result = document.getElementById("result")!;

const user = (window as any).user as { userId: string | null; username: string; email: string } | undefined;
const isAuthenticated = !!user?.userId;
const authStatus = document.getElementById("auth-status")!;

if (isAuthenticated) {
  authStatus.innerHTML = `<p style="color: green;">Logged in as <strong>${user!.username}</strong></p>`;
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
    const user = response.response[0];
    result.innerHTML = `
      <p><strong>User ID:</strong> ${user.userId}</p>
      <p><strong>Username:</strong> ${user.username}</p>
      <p><strong>Email:</strong> ${user.email}</p>
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
