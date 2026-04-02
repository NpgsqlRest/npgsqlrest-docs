import { login, logout, getDataUrl } from "./sqlApi.ts";

const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const loginBtn = document.getElementById("login-btn")!;
const logoutBtn = document.getElementById("logout-btn")!;
const result = document.getElementById("result")!;
const excelLink = document.getElementById("excel-link") as HTMLAnchorElement;

const loginSection = document.getElementById("login-section")!;
const uploadSection = document.getElementById("upload-section")!;
const authStatus = document.getElementById("auth-status")!;


function showLoggedIn(username: string) {
    authStatus.innerHTML = "<p style=\"color: green;\">Logged in as <strong>" + username + "</strong></p>";
    loginSection.classList.add("hidden");
    uploadSection.classList.remove("hidden");
}

function showLoggedOut() {
    authStatus.innerHTML = `<p style="color: gray;">Not authenticated</p>`;
    loginSection.classList.remove("hidden");
    uploadSection.classList.add("hidden");
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