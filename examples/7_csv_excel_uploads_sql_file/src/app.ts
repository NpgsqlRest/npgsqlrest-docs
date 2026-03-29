import { login, logout, csvUpload, excelUpload, combinedUpload, getUploadData } from "./example7Api.ts";

const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const loginBtn = document.getElementById("login-btn")!;
const logoutBtn = document.getElementById("logout-btn")!;
const result = document.getElementById("result")!;

const loginSection = document.getElementById("login-section")!;
const uploadSection = document.getElementById("upload-section")!;
const authStatus = document.getElementById("auth-status")!;

// Progress bar elements
const progressContainer = document.getElementById("progress-container")!;
const progressBar = document.getElementById("progress-bar")!;
const progressText = document.getElementById("progress-text")!;

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

// Upload CSV
const fileCsvInput = document.getElementById("file-csv") as HTMLInputElement;
const uploadCsvBtn = document.getElementById("upload-csv-btn")!;

uploadCsvBtn.addEventListener("click", async () => {
    const files = fileCsvInput.files;

    if (!files || files.length === 0) {
        result.innerHTML = `<p style="color: red;">Please select a CSV file to upload</p>`;
        return;
    }

    // Show progress bar
    progressContainer.classList.remove("hidden");
    progressBar.style.width = "0%";
    progressText.textContent = "0%";
    result.innerHTML = "";

    try {
        const response = await csvUpload(
            files,
            {},
            (loaded, total) => {
                const percent = Math.round((loaded / total) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `${percent}%`;
            }
        );

        if (response.status === 200) {
            result.innerHTML = `<p style="color: green;">CSV Upload successful!</p>
            <pre>${JSON.stringify(response.response, null, 2)}</pre>`;
        } else {
            result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
        }
    } catch (error) {
        result.innerHTML = `<p style="color: red;">Upload error: ${error}</p>`;
    }
});

// Upload Excel
const fileExcelInput = document.getElementById("file-excel") as HTMLInputElement;
const uploadExcelBtn = document.getElementById("upload-excel-btn")!;

uploadExcelBtn.addEventListener("click", async () => {
    const files = fileExcelInput.files;

    if (!files || files.length === 0) {
        result.innerHTML = `<p style="color: red;">Please select an Excel file to upload</p>`;
        return;
    }

    // Show progress bar
    progressContainer.classList.remove("hidden");
    progressBar.style.width = "0%";
    progressText.textContent = "0%";
    result.innerHTML = "";

    try {
        const response = await excelUpload(
            files,
            {},
            (loaded, total) => {
                const percent = Math.round((loaded / total) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `${percent}%`;
            }
        );

        if (response.status === 200) {
            result.innerHTML = `<p style="color: green;">Excel Upload successful!</p>
            <pre>${JSON.stringify(response.response, null, 2)}</pre>`;
        } else {
            result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
        }
    } catch (error) {
        result.innerHTML = `<p style="color: red;">Upload error: ${error}</p>`;
    }
});

// Upload Combined
const fileCombinedInput = document.getElementById("file-combined") as HTMLInputElement;
const uploadCombinedBtn = document.getElementById("upload-combined-btn")!;

uploadCombinedBtn.addEventListener("click", async () => {
    const files = fileCombinedInput.files;

    if (!files || files.length === 0) {
        result.innerHTML = `<p style="color: red;">Please select a CSV or Excel file to upload</p>`;
        return;
    }

    // Show progress bar
    progressContainer.classList.remove("hidden");
    progressBar.style.width = "0%";
    progressText.textContent = "0%";
    result.innerHTML = "";

    try {
        const response = await combinedUpload(
            files,
            {},
            (loaded, total) => {
                const percent = Math.round((loaded / total) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `${percent}%`;
            }
        );

        if (response.status === 200) {
            result.innerHTML = `<p style="color: green;">Combined Upload successful!</p>
            <pre>${JSON.stringify(response.response, null, 2)}</pre>`;
        } else {
            result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
        }
    } catch (error) {
        result.innerHTML = `<p style="color: red;">Upload error: ${error}</p>`;
    }
});

// Show CSV Data
const showCsvBtn = document.getElementById("show-csv-btn")!;

showCsvBtn.addEventListener("click", async () => {
    result.innerHTML = `<p>Loading CSV data...</p>`;

    try {
        const response = await getUploadData({ type: "csv" });

        if (response.status === 200) {
            if (response.response.length === 0) {
                result.innerHTML = `<p>No CSV data found.</p>`;
            } else {
                let html = `<p style="color: green;">CSV Data (${response.response.length} rows):</p>`;
                html += `<table style="border-collapse: collapse; width: 100%;">`;
                for (const row of response.response) {
                    html += `<tr>`;
                    for (const cell of row) {
                        html += `<td style="border: 1px solid #ccc; padding: 4px;">${cell ?? ''}</td>`;
                    }
                    html += `</tr>`;
                }
                html += `</table>`;
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

// Show Excel Data
const showExcelBtn = document.getElementById("show-excel-btn")!;

showExcelBtn.addEventListener("click", async () => {
    result.innerHTML = `<p>Loading Excel data...</p>`;

    try {
        const response = await getUploadData({ type: "excel" });

        if (response.status === 200) {
            if (response.response.length === 0) {
                result.innerHTML = `<p>No Excel data found.</p>`;
            } else {
                let html = `<p style="color: green;">Excel Data (${response.response.length} rows):</p>`;
                html += `<table style="border-collapse: collapse; width: 100%;">`;
                for (const row of response.response) {
                    html += `<tr>`;
                    for (const cell of row) {
                        html += `<td style="border: 1px solid #ccc; padding: 4px;">${cell ?? ''}</td>`;
                    }
                    html += `</tr>`;
                }
                html += `</table>`;
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
