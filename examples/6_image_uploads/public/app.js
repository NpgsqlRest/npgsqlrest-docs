// src/example6Api.ts
var baseUrl = "http://127.0.0.1:8080";
var parseQuery = (query) => "?" + Object.keys(query ? query : {}).map((key) => {
  const value = query[key] != null ? query[key] : "";
  if (Array.isArray(value)) {
    return value.map((s) => s ? `${key}=${encodeURIComponent(s)}` : `${key}=`).join("&");
  }
  return `${key}=${encodeURIComponent(value)}`;
}).join("&");
async function getMyUploads(request) {
  const response = await fetch(baseUrl + "/api/example-6/get-my-uploads" + parseQuery(request), {
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
  const response = await fetch(baseUrl + "/api/example-6/login", {
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
  const response = await fetch(baseUrl + "/api/example-6/logout", {
    method: "POST"
  });
  return {
    status: response.status,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function uploadToCombined(files, request, progress) {
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
    xhr.open("POST", baseUrl + "/api/example-6/upload-to-combined" + parseQuery(request));
    const formData = new FormData;
    for (let i = 0;i < files.length; i++) {
      const file = files[i];
      formData.append("file", file, file.name);
    }
    xhr.send(formData);
  });
}
async function uploadToFileSystem(files, request, progress) {
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
    xhr.open("POST", baseUrl + "/api/example-6/upload-to-file-system" + parseQuery(request));
    const formData = new FormData;
    for (let i = 0;i < files.length; i++) {
      const file = files[i];
      formData.append("file", file, file.name);
    }
    xhr.send(formData);
  });
}
async function uploadToLargeObject(files, request, progress) {
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
    xhr.open("POST", baseUrl + "/api/example-6/upload-to-large-object" + parseQuery(request));
    const formData = new FormData;
    for (let i = 0;i < files.length; i++) {
      const file = files[i];
      formData.append("file", file, file.name);
    }
    xhr.send(formData);
  });
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
var fileFsInput = document.getElementById("file-fs");
var uploadFsBtn = document.getElementById("upload-fs-btn");
var progressContainer = document.getElementById("progress-container");
var progressBar = document.getElementById("progress-bar");
var progressText = document.getElementById("progress-text");
uploadFsBtn.addEventListener("click", async () => {
  const files = fileFsInput.files;
  if (!files || files.length === 0) {
    result.innerHTML = `<p style="color: red;">Please select a file to upload</p>`;
    return;
  }
  progressContainer.classList.remove("hidden");
  progressBar.style.width = "0%";
  progressText.textContent = "0%";
  result.innerHTML = "";
  try {
    const response = await uploadToFileSystem(files, {}, (loaded, total) => {
      const percent = Math.round(loaded / total * 100);
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;
    });
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
var myUploadsBtn = document.getElementById("my-uploads-btn");
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
            const imgUrl = `/api/example-6/get-image?oid=${upload.oid}&mimeType=${encodeURIComponent(upload.contentType || "image/png")}`;
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
var fileLoInput = document.getElementById("file-lo");
var uploadLoBtn = document.getElementById("upload-lo-btn");
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
    const response = await uploadToLargeObject(files, {}, (loaded, total) => {
      const percent = Math.round(loaded / total * 100);
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;
    });
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
var fileCombinedInput = document.getElementById("file-combined");
var uploadCombinedBtn = document.getElementById("upload-combined-btn");
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
    const response = await uploadToCombined(files, {}, (loaded, total) => {
      const percent = Math.round(loaded / total * 100);
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;
    });
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
