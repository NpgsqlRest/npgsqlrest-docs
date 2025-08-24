import { login, logout, whoAmI, listPasskeyUsers, isPasskeyEnabled } from "./example13Api.ts";
import getDeviceName from "./getDeviceName.ts";
import getAnalytics from "./getAnalytics.ts";
import * as passkey from './passkey.ts';

const unauthorizedForm = document.getElementById("unauthorized-form")!;
const authorizedForm = document.getElementById("authorized-form")!;
const unauthorizedResult = document.getElementById("unauthorized-result")!;
const authorizedResult = document.getElementById("authorized-result")!;
const usersTableBody = document.getElementById("users-table-body")!;
const passkeyRegisterForm = document.getElementById("passkey-register-form")!;
const passkeyLoginForm = document.getElementById("passkey-login-form")!

const passkeyEnabledDiv = document.getElementById("passkey-enabled")!;
const passkeyDisabledDiv = document.getElementById("passkey-disabled")!;

let user = (window as any).user as { userId: string | null; username: string; email: string } | undefined;
let isAuthenticated = !!user?.userId;

function updateUsersTable() {
    listPasskeyUsers().then(response => {
        if (response.status === 200) {
            usersTableBody.innerHTML = "";
            for (const user of response.response) {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${user.userId}</td>
                    <td>${user.username}</td>
                    <td>${user.pass}</td>
                    <td>${user.email}</td>
                    <td>${user.passkeyEnabled}</td>
                `;
                usersTableBody.appendChild(row);
            }
        } else {
            unauthorizedResult.innerHTML = `
            <p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>`;
        }
    });
}

function showAuthorizedForm() {
    isAuthenticated = true;
    unauthorizedForm.style.display = "none";
    authorizedForm.style.display = "block";
    authorizedForm.querySelector("h2")!.textContent = `Logged in as ${user!.username}`;

    passkeyEnabledDiv.style.display = "none";
    passkeyDisabledDiv.style.display = "none";

    isPasskeyEnabled({}).then(response => {
        if (response.status === 200) {
            if (response.response === true) {
                passkeyEnabledDiv.style.display = "block";
            } else {
                passkeyDisabledDiv.style.display = "block";
            }
        } else {
            authorizedResult.innerHTML = `
            <p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>`;
        }
    });
}

function showUnauthorizedForm() {
    isAuthenticated = false;
    authorizedForm.style.display = "none";
    unauthorizedForm.style.display = "block";
    passkeyRegisterForm.style.display = "none";
    updateUsersTable();
}

document.getElementById("toggle-register-passkey-btn")!.addEventListener("click", () => {
    let isHidden = passkeyRegisterForm.style.display === "none";
    passkeyRegisterForm.style.display = isHidden ? "block" : "none";
    isHidden = !isHidden;
    if (!isHidden) {
        getDeviceName().then(name => {
            (document.getElementById("passkey-device") as HTMLInputElement).value = name;
        });
    }
});

document.getElementById("whoami-btn")!.addEventListener("click", async () => {
    const response = await whoAmI({});

    if (response.status === 200 && response.response.length > 0) {
        const user = response.response[0];
        authorizedResult.innerHTML = `
        <p><strong>User ID:</strong> ${user.userId}</p>
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        `;
    } else {
        authorizedResult.innerHTML = `
        <p style="color: red;">Status: ${response.status}</p>
        <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>
        `;
    }
});

document.getElementById("logout-btn")!.addEventListener("click", async () => {
    const response = await logout();

    if (response.status === 200) {
        showUnauthorizedForm();
    } else {
        authorizedResult.innerHTML = `
        <p style="color: red;">Status: ${response.status}</p>
        <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>`;
    }
});

// standard password login
document.getElementById("login-btn")!.addEventListener("click", async () => {
    const username = (document.getElementById("username") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;

    const response = await login({ username, password });

    if (response.status === 200) {
        user = JSON.parse(response.response);
        showAuthorizedForm();
    } else {
        unauthorizedResult.innerHTML = `
        <p style="color: red;">Status: ${response.status}</p>
        <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>`;
    }
});

// register passkey user
document.getElementById("register-passkey-btn")!.addEventListener("click", async () => {
    const username = (document.getElementById("passkey-username") as HTMLInputElement).value;
    const displayName = (document.getElementById("passkey-display") as HTMLInputElement).value;
    const email = (document.getElementById("passkey-email") as HTMLInputElement).value;
    const device = (document.getElementById("passkey-device") as HTMLInputElement).value;

    if (!username || !displayName || !email || !device) {
        unauthorizedResult.innerHTML = `<p style="color: red;">Please fill in all fields (username, email, and device name).</p>`;
        return;
    }
    unauthorizedResult.innerHTML = "<p style=\"color: blue;\">Registering passkey, please wait...</p>";

    const result = await passkey.register({
        userName: username,
        displayName: displayName,
        deviceName: device,
        email: email,
    }, getAnalytics());

    if (result.success) {
        unauthorizedResult.innerHTML = `<p style="color: green;">Passkey registered successfully! CredentialId: ${result.credentialId}</p>`;
        updateUsersTable();
    } else {
        unauthorizedResult.innerHTML = `
            <p style="color: red;">Error Code: ${result.error?.code}</p>
            <p style="color: red;">Error Message: ${JSON.stringify(result.error?.message)}</p>`;
    }
});

// login with passkey
document.getElementById("login-passkey-btn")!.addEventListener("click", async () => {
    if (await passkey.isConditionalMediationAvailable()) {
        // Discoverable credentials available - authenticate without username
        const result = await passkey.login({}, getAnalytics());

        if (result.success) {
            user = JSON.parse(result.response);
            showAuthorizedForm();
        } else {
            unauthorizedResult.innerHTML = `
            <p style="color: red;">Error Code: ${result.error?.code}</p>
            <p style="color: red;">Error Message: ${JSON.stringify(result.error?.message)}</p>`;
        }

    } else {
        // No discoverable credentials - show username input form
        // when credentials are not discoverable, we need to provide username
        passkeyLoginForm.style.display = "block";
    }
});

// login with passkey and username (for non-discoverable credentials)
document.getElementById("login-username-passkey-btn")!.addEventListener("click", async () => {
    const userName = (document.getElementById("passkey-login-username") as HTMLInputElement).value;

    if (!userName) {
        unauthorizedResult.innerHTML = `<p style="color: red;">Please enter a username.</p>`;
        return;
    }

    const result = await passkey.login({ userName }, getAnalytics());

    if (result.success) {
        user = JSON.parse(result.response);
        passkeyLoginForm.style.display = "none";
        showAuthorizedForm();
    } else {
        unauthorizedResult.innerHTML = `
            <p style="color: red;">Error Code: ${result.error?.code}</p>
            <p style="color: red;">Error Message: ${JSON.stringify(result.error?.message)}</p>`;
    }
});

// add passkey for authenticated user
// dont ask for device name, just get it automatically from browser
document.getElementById("add-passkey-btn")!.addEventListener("click", async () => { 
    getDeviceName().then(deviceName => {
        passkey.addPasskey({deviceName: deviceName}, getAnalytics()).then(result => {
            if (result.success) {
                authorizedResult.innerHTML = `<p style="color: green;">Passkey added successfully! CredentialId: ${result.credentialId}</p>`;
                showAuthorizedForm();
            } else {
                authorizedResult.innerHTML = `
                <p style="color: red;">Error Code: ${result.error?.code}</p>
                <p style="color: red;">Error Message: ${JSON.stringify(result.error?.message)}</p>`;
            }
        });
    });
});

if (isAuthenticated) {
    showAuthorizedForm();
} else {
    showUnauthorizedForm();
}
