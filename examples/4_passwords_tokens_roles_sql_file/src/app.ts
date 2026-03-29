import { login, logout, whoAmI, getUsers } from "./example4Api.ts";

// DOM elements
const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const loginBtn = document.getElementById("login-btn")!;
const whoamiBtn = document.getElementById("whoami-btn")!;
const getUsersBtn = document.getElementById("getusers-btn")!;
const logoutBtn = document.getElementById("logout-btn")!;
const result = document.getElementById("result")!;
const authStatus = document.getElementById("auth-status")!;

type TokenResponse = { 
    accessToken: string; 
    refreshToken?: string; 
    tokenType: string;
    expiresIn: number; 
    refreshExpiresIn?: number; 
};

// Auth state
let currentScheme: string | null = null;
let authToken: string | null = null;

function getSelectedScheme(): string {
    const selected = document.querySelector('input[name="scheme"]:checked') as HTMLInputElement;
    return selected?.value || "cookies";
}

function updateAuthStatus(name: string | null, scheme: string | null) {
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

// Add Authorization header if we have a token
function parseRequest(request: RequestInit): RequestInit {
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

// Login handler - uses the generated login() function
loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    const scheme = getSelectedScheme();

    const response = await login({ scheme, username, password });

    if (response.status === 200) {
        currentScheme = scheme;

        if (scheme === "token" || scheme === "jwt") {
            // For token/jwt, the response body contains the token
            const responseData = JSON.parse(response.response) as TokenResponse;
            authToken = responseData.accessToken;
            result.innerHTML = `
                <p style="color: green;">Login successful (${scheme})</p>
                <p><strong>Response:</strong></p>
                <pre style="word-break: break-all; white-space: pre-wrap; font-size: 11px;">${JSON.stringify(responseData, null, 2)}</pre>
            `;
        } else {
            // For cookies, the cookie is set automatically
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

// Who Am I handler - uses the generated whoAmI() function
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

// Get Users handler (admin only) - uses the generated getUsers() function
getUsersBtn.addEventListener("click", async () => {
    const response = await getUsers(parseRequest);

    if (response.status === 200) {
        const users = response.response;
        let html = `<p><strong>Users (${users.length}):</strong></p><ul>`;
        for (const u of users) {
            const meTag = u.isThisMe ? ' <em>(this is you)</em>' : '';
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

// Logout handler - uses the generated logout() function
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


// Check initial auth status from server-injected user data
const user = (window as any).user as { userId: string | null; username: string; email: string } | undefined;
updateAuthStatus(user?.username || null, null);

