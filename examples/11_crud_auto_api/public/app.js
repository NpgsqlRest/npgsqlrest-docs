// src/example11Api.ts
var baseUrl = "http://127.0.0.1:8080";
var parseQuery = (query) => "?" + Object.keys(query ? query : {}).map((key) => {
  const value = query[key] != null ? query[key] : "";
  if (Array.isArray(value)) {
    return value.map((s) => s ? `${key}=${encodeURIComponent(s)}` : `${key}=`).join("&");
  }
  return `${key}=${encodeURIComponent(value)}`;
}).join("&");
async function contactsGet(request) {
  const response = await fetch(baseUrl + "/api/example-11/contacts" + parseQuery(request), {
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
async function contactsPost(request) {
  const response = await fetch(baseUrl + "/api/example-11/contacts", {
    method: "POST",
    body: JSON.stringify(request)
  });
  return {
    status: response.status,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function contactsDelete(request) {
  const response = await fetch(baseUrl + "/api/example-11/contacts" + parseQuery(request), {
    method: "DELETE"
  });
  return {
    status: response.status,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function contactsPut(request) {
  const response = await fetch(baseUrl + "/api/example-11/contacts/returning", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });
  return {
    status: response.status,
    response: response.ok ? await response.json() : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function login(request) {
  const response = await fetch(baseUrl + "/api/example-11/login", {
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
  const response = await fetch(baseUrl + "/api/example-11/logout", {
    method: "POST"
  });
  return {
    status: response.status,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}

// src/app.ts
var loginSection = document.getElementById("login-section");
var authSection = document.getElementById("auth-section");
var contactsSection = document.getElementById("contacts-section");
var apiInfo = document.getElementById("api-info");
var usernameSelect = document.getElementById("username");
var passwordInput = document.getElementById("password");
var loginBtn = document.getElementById("login-btn");
var logoutBtn = document.getElementById("logout-btn");
var currentUser = document.getElementById("current-user");
var contactsList = document.getElementById("contacts-list");
var messageDiv = document.getElementById("message");
var newName = document.getElementById("new-name");
var newEmail = document.getElementById("new-email");
var newPhone = document.getElementById("new-phone");
var addBtn = document.getElementById("add-btn");
var editForm = document.getElementById("edit-form");
var editId = document.getElementById("edit-id");
var editName = document.getElementById("edit-name");
var editEmail = document.getElementById("edit-email");
var editPhone = document.getElementById("edit-phone");
var saveBtn = document.getElementById("save-btn");
var cancelBtn = document.getElementById("cancel-btn");
function showMessage(text, isError = false) {
  messageDiv.className = `message ${isError ? "error" : "success"}`;
  messageDiv.textContent = text;
  messageDiv.classList.remove("hidden");
  setTimeout(() => messageDiv.classList.add("hidden"), 3000);
}
function showLoggedIn(username) {
  currentUser.textContent = username;
  loginSection.classList.add("hidden");
  authSection.classList.remove("hidden");
  contactsSection.classList.remove("hidden");
  apiInfo.classList.remove("hidden");
  loadContacts();
}
function showLoggedOut() {
  loginSection.classList.remove("hidden");
  authSection.classList.add("hidden");
  contactsSection.classList.add("hidden");
  apiInfo.classList.add("hidden");
  passwordInput.value = "";
}
var user = window.user;
if (user?.userId != null && !isNaN(user.userId)) {
  showLoggedIn(user.username);
} else {
  showLoggedOut();
}
loginBtn.addEventListener("click", async () => {
  const result = await login({
    username: usernameSelect.value,
    password: passwordInput.value
  });
  if (result.status === 200) {
    showLoggedIn(usernameSelect.value);
  } else {
    alert("Login failed. Try bob/bob123 or alice/alice123");
  }
});
logoutBtn.addEventListener("click", async () => {
  await logout();
  showLoggedOut();
});
async function loadContacts() {
  const result = await contactsGet({});
  if (result.status === 401) {
    loginSection.classList.remove("hidden");
    authSection.classList.add("hidden");
    contactsSection.classList.add("hidden");
    return;
  }
  if (result.status === 200) {
    renderContacts(result.response);
  } else {
    showMessage("Failed to load contacts", true);
  }
}
async function createContact(name, email, phone) {
  const result = await contactsPut({
    name,
    email: email || null,
    phone: phone || null
  });
  if (result.status === 200 && result.response.length > 0) {
    showMessage(`Contact "${result.response[0].name}" created!`);
    loadContacts();
    newName.value = "";
    newEmail.value = "";
    newPhone.value = "";
  } else {
    showMessage(result.error?.detail || "Failed to create contact", true);
  }
}
async function updateContact(id, name, email, phone) {
  const result = await contactsPost({
    id,
    name,
    email: email || null,
    phone: phone || null
  });
  if (result.status === 204) {
    showMessage("Contact updated!");
    loadContacts();
    editForm.classList.add("hidden");
  } else {
    showMessage(result.error?.detail || "Failed to update contact", true);
  }
}
async function deleteContact(id) {
  const result = await contactsDelete({ id });
  if (result.status === 204) {
    showMessage("Contact deleted!");
    loadContacts();
  } else {
    showMessage("Failed to delete contact", true);
  }
}
function renderContacts(contacts) {
  if (contacts.length === 0) {
    contactsList.innerHTML = '<div class="empty-state">No contacts yet. Add one above!</div>';
    return;
  }
  const html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${contacts.map((c) => `
                    <tr>
                        <td>${c.id}</td>
                        <td>${c.name}</td>
                        <td>${c.email || "-"}</td>
                        <td>${c.phone || "-"}</td>
                        <td class="actions-cell">
                            <button class="secondary" onclick="editContact(${c.id}, '${escapeHtml(c.name || "")}', '${escapeHtml(c.email || "")}', '${escapeHtml(c.phone || "")}')">Edit</button>
                            <button class="danger" onclick="confirmDelete(${c.id}, '${escapeHtml(c.name || "")}')">Delete</button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
  contactsList.innerHTML = html;
}
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char] || char);
}
window.editContact = (id, name, email, phone) => {
  editId.value = String(id);
  editName.value = name;
  editEmail.value = email;
  editPhone.value = phone;
  editForm.classList.remove("hidden");
  editName.focus();
};
window.confirmDelete = (id, name) => {
  if (confirm(`Delete contact "${name}"?`)) {
    deleteContact(id);
  }
};
addBtn.addEventListener("click", () => {
  if (!newName.value.trim()) {
    showMessage("Name is required", true);
    return;
  }
  createContact(newName.value.trim(), newEmail.value.trim(), newPhone.value.trim());
});
saveBtn.addEventListener("click", () => {
  if (!editName.value.trim()) {
    showMessage("Name is required", true);
    return;
  }
  updateContact(parseInt(editId.value), editName.value.trim(), editEmail.value.trim(), editPhone.value.trim());
});
cancelBtn.addEventListener("click", () => {
  editForm.classList.add("hidden");
});
newName.addEventListener("keypress", (e) => e.key === "Enter" && addBtn.click());
newEmail.addEventListener("keypress", (e) => e.key === "Enter" && addBtn.click());
newPhone.addEventListener("keypress", (e) => e.key === "Enter" && addBtn.click());
passwordInput.addEventListener("keypress", (e) => e.key === "Enter" && loginBtn.click());
