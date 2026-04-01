import { login, logout, uploadToFileSystem, uploadToLargeObject, uploadToCombined, getMyUploads } from "./sqlApi.ts";

const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const loginBtn = document.getElementById("login-btn")!;
const logoutBtn = document.getElementById("logout-btn")!;
const result = document.getElementById("result")!;

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

// Upload to file system
const fileFsInput = document.getElementById("file-fs") as HTMLInputElement;
const uploadFsBtn = document.getElementById("upload-fs-btn")!;
const progressContainer = document.getElementById("progress-container")!;
const progressBar = document.getElementById("progress-bar")!;
const progressText = document.getElementById("progress-text")!;

uploadFsBtn.addEventListener("click", async () => {
    const files = fileFsInput.files;

    if (!files || files.length === 0) {
        result.innerHTML = `<p style="color: red;">Please select a file to upload</p>`;
        return;
    }

    // Show progress bar
    progressContainer.classList.remove("hidden");
    progressBar.style.width = "0%";
    progressText.textContent = "0%";
    result.innerHTML = "";

    try {
        const response = await uploadToFileSystem(
            files,
            { },
            (loaded, total) => {
                const percent = Math.round((loaded / total) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `${percent}%`;
            }
        );

        if (response.status === 200) {
            result.innerHTML = `<p style="color: green;">Upload successful!</p>
            <pre>${JSON.stringify(response.response, null, 2)}</pre>`;
        } else {
            result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
        }
    } catch (error) {
        result.innerHTML = `<p style="color: red;">Upload error: ${error}</p>`;
    }
});

// Get My Uploads
const myUploadsBtn = document.getElementById("my-uploads-btn")!;

myUploadsBtn.addEventListener("click", async () => {
    result.innerHTML = `<p>Loading uploads...</p>`;

    try {
        const response = await getMyUploads({});

        if (response.status === 200) {
            if (response.response.length === 0) {
                result.innerHTML = `<p>No uploads found.</p>`;
            } else {
                let html = `<p style="color: green;">My Uploads (${response.response.length}):</p>`;
                for (const upload of response.response) {
                    html += `<div style="margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                        <strong>#${upload.id}</strong> - ${upload.fileName} (${upload.contentType})`;
                    if (upload.filePath) {
                        const imgUrl = upload.filePath.split("/public")[1];
                        html += `<br><img src="${imgUrl}" style="max-width: 200px; max-height: 150px; margin-top: 8px;">`;
                    } else if (upload.oid) {
                        const imgUrl = `/api/get-image?oid=${upload.oid}&mimeType=${encodeURIComponent(upload.contentType || 'image/png')}`;
                        html += `<br><img src="${imgUrl}" style="max-width: 200px; max-height: 150px; margin-top: 8px;">`;
                    }
                    html += `</div>`;
                }
                result.innerHTML = html;
            }
        } else {
            result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
        }
    } catch (error) {
        result.innerHTML = `<p style="color: red;">Error: ${error}</p>`;
    }
});

// Upload to Large Object
const fileLoInput = document.getElementById("file-lo") as HTMLInputElement;
const uploadLoBtn = document.getElementById("upload-lo-btn")!;

uploadLoBtn.addEventListener("click", async () => {
    const files = fileLoInput.files;

    if (!files || files.length === 0) {
        result.innerHTML = `<p style="color: red;">Please select a file to upload</p>`;
        return;
    }

    progressContainer.classList.remove("hidden");
    progressBar.style.width = "0%";
    progressText.textContent = "0%";
    result.innerHTML = "";

    try {
        const response = await uploadToLargeObject(
            files,
            { },
            (loaded, total) => {
                const percent = Math.round((loaded / total) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `${percent}%`;
            }
        );

        if (response.status === 200) {
            result.innerHTML = `<p style="color: green;">Upload to Large Object successful!</p>
            <pre>${JSON.stringify(response.response, null, 2)}</pre>`;
        } else {
            result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
        }
    } catch (error) {
        result.innerHTML = `<p style="color: red;">Upload error: ${error}</p>`;
    }
});

// Upload to Both (Combined)
const fileCombinedInput = document.getElementById("file-combined") as HTMLInputElement;
const uploadCombinedBtn = document.getElementById("upload-combined-btn")!;

uploadCombinedBtn.addEventListener("click", async () => {
    const files = fileCombinedInput.files;

    if (!files || files.length === 0) {
        result.innerHTML = `<p style="color: red;">Please select a file to upload</p>`;
        return;
    }

    progressContainer.classList.remove("hidden");
    progressBar.style.width = "0%";
    progressText.textContent = "0%";
    result.innerHTML = "";

    try {
        const response = await uploadToCombined(
            files,
            { },
            (loaded, total) => {
                const percent = Math.round((loaded / total) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `${percent}%`;
            }
        );

        if (response.status === 200) {
            result.innerHTML = `<p style="color: green;">Upload to Both successful!</p>
            <pre>${JSON.stringify(response.response, null, 2)}</pre>`;
        } else {
            result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
        }
    } catch (error) {
        result.innerHTML = `<p style="color: red;">Upload error: ${error}</p>`;
    }
});
