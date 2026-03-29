// src/example7Api.ts
var baseUrl = "http://127.0.0.1:8080";
var parseQuery = (query) => "?" + Object.keys(query ? query : {}).map((key) => {
  const value = query[key] != null ? query[key] : "";
  if (Array.isArray(value)) {
    return value.map((s) => s ? `${key}=${encodeURIComponent(s)}` : `${key}=`).join("&");
  }
  return `${key}=${encodeURIComponent(value)}`;
}).join("&");
async function combinedUpload(files, request, progress) {
  return new Promise((resolve, reject) => {
    if (!files || files.length === 0) {
      reject(new Error("No files to upload"));
      return;
    }
    var xhr = new XMLHttpRequest;
    if (progress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && progress) {
          progress(event.loaded, event.total);
        }
      }, false);
    }
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve({ status: this.status, response: JSON.parse(this.responseText), error: undefined });
      } else {
        resolve({ status: this.status, response: [], error: JSON.parse(this.responseText) });
      }
    };
    xhr.onerror = function() {
      reject({
        xhr: this,
        status: this.status,
        statusText: this.statusText || "Network error occurred",
        response: this.response
      });
    };
    xhr.open("POST", baseUrl + "/api/example-7/combined-upload" + parseQuery(request));
    const formData = new FormData;
    for (let i = 0;i < files.length; i++) {
      const file = files[i];
      formData.append("file", file, file.name);
    }
    xhr.send(formData);
  });
}
async function csvUpload(files, request, progress) {
  return new Promise((resolve, reject) => {
    if (!files || files.length === 0) {
      reject(new Error("No files to upload"));
      return;
    }
    var xhr = new XMLHttpRequest;
    if (progress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && progress) {
          progress(event.loaded, event.total);
        }
      }, false);
    }
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve({ status: this.status, response: JSON.parse(this.responseText), error: undefined });
      } else {
        resolve({ status: this.status, response: [], error: JSON.parse(this.responseText) });
      }
    };
    xhr.onerror = function() {
      reject({
        xhr: this,
        status: this.status,
        statusText: this.statusText || "Network error occurred",
        response: this.response
      });
    };
    xhr.open("POST", baseUrl + "/api/example-7/csv-upload" + parseQuery(request));
    const formData = new FormData;
    for (let i = 0;i < files.length; i++) {
      const file = files[i];
      formData.append("file", file, file.name);
    }
    xhr.send(formData);
  });
}
async function excelUpload(files, request, progress) {
  return new Promise((resolve, reject) => {
    if (!files || files.length === 0) {
      reject(new Error("No files to upload"));
      return;
    }
    var xhr = new XMLHttpRequest;
    if (progress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && progress) {
          progress(event.loaded, event.total);
        }
      }, false);
    }
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve({ status: this.status, response: JSON.parse(this.responseText), error: undefined });
      } else {
        resolve({ status: this.status, response: [], error: JSON.parse(this.responseText) });
      }
    };
    xhr.onerror = function() {
      reject({
        xhr: this,
        status: this.status,
        statusText: this.statusText || "Network error occurred",
        response: this.response
      });
    };
    xhr.open("POST", baseUrl + "/api/example-7/excel-upload" + parseQuery(request));
    const formData = new FormData;
    for (let i = 0;i < files.length; i++) {
      const file = files[i];
      formData.append("file", file, file.name);
    }
    xhr.send(formData);
  });
}
async function getUploadData(request) {
  const response = await fetch(baseUrl + "/api/example-7/get-upload-data" + parseQuery(request), {
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
  const response = await fetch(baseUrl + "/api/example-7/login", {
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
  const response = await fetch(baseUrl + "/api/example-7/logout", {
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
var loginSection = document.getElementById("login-section");
var uploadSection = document.getElementById("upload-section");
var authStatus = document.getElementById("auth-status");
var progressContainer = document.getElementById("progress-container");
var progressBar = document.getElementById("progress-bar");
var progressText = document.getElementById("progress-text");
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
var fileCsvInput = document.getElementById("file-csv");
var uploadCsvBtn = document.getElementById("upload-csv-btn");
uploadCsvBtn.addEventListener("click", async () => {
  const files = fileCsvInput.files;
  if (!files || files.length === 0) {
    result.innerHTML = `<p style="color: red;">Please select a CSV file to upload</p>`;
    return;
  }
  progressContainer.classList.remove("hidden");
  progressBar.style.width = "0%";
  progressText.textContent = "0%";
  result.innerHTML = "";
  try {
    const response = await csvUpload(files, {}, (loaded, total) => {
      const percent = Math.round(loaded / total * 100);
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;
    });
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
var fileExcelInput = document.getElementById("file-excel");
var uploadExcelBtn = document.getElementById("upload-excel-btn");
uploadExcelBtn.addEventListener("click", async () => {
  const files = fileExcelInput.files;
  if (!files || files.length === 0) {
    result.innerHTML = `<p style="color: red;">Please select an Excel file to upload</p>`;
    return;
  }
  progressContainer.classList.remove("hidden");
  progressBar.style.width = "0%";
  progressText.textContent = "0%";
  result.innerHTML = "";
  try {
    const response = await excelUpload(files, {}, (loaded, total) => {
      const percent = Math.round(loaded / total * 100);
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;
    });
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
var fileCombinedInput = document.getElementById("file-combined");
var uploadCombinedBtn = document.getElementById("upload-combined-btn");
uploadCombinedBtn.addEventListener("click", async () => {
  const files = fileCombinedInput.files;
  if (!files || files.length === 0) {
    result.innerHTML = `<p style="color: red;">Please select a CSV or Excel file to upload</p>`;
    return;
  }
  progressContainer.classList.remove("hidden");
  progressBar.style.width = "0%";
  progressText.textContent = "0%";
  result.innerHTML = "";
  try {
    const response = await combinedUpload(files, {}, (loaded, total) => {
      const percent = Math.round(loaded / total * 100);
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;
    });
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
var showCsvBtn = document.getElementById("show-csv-btn");
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
            html += `<td style="border: 1px solid #ccc; padding: 4px;">${cell ?? ""}</td>`;
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
var showExcelBtn = document.getElementById("show-excel-btn");
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
            html += `<td style="border: 1px solid #ccc; padding: 4px;">${cell ?? ""}</td>`;
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
