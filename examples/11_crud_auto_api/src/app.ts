import {
    login,
    logout,
    contactsGet,
    contactsPut,      // INSERT with returning
    contactsPost,      // UPDATE
    contactsDelete     // DELETE
} from "./example11Api.ts";

// DOM Elements
const loginSection = document.getElementById("login-section")!;
const authSection = document.getElementById("auth-section")!;
const contactsSection = document.getElementById("contacts-section")!;
const apiInfo = document.getElementById("api-info")!;
const usernameSelect = document.getElementById("username") as HTMLSelectElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const loginBtn = document.getElementById("login-btn")!;
const logoutBtn = document.getElementById("logout-btn")!;
const currentUser = document.getElementById("current-user")!;
const contactsList = document.getElementById("contacts-list")!;
const messageDiv = document.getElementById("message")!;

// New contact inputs
const newName = document.getElementById("new-name") as HTMLInputElement;
const newEmail = document.getElementById("new-email") as HTMLInputElement;
const newPhone = document.getElementById("new-phone") as HTMLInputElement;
const addBtn = document.getElementById("add-btn")!;

// Edit form elements
const editForm = document.getElementById("edit-form")!;
const editId = document.getElementById("edit-id") as HTMLInputElement;
const editName = document.getElementById("edit-name") as HTMLInputElement;
const editEmail = document.getElementById("edit-email") as HTMLInputElement;
const editPhone = document.getElementById("edit-phone") as HTMLInputElement;
const saveBtn = document.getElementById("save-btn")!;
const cancelBtn = document.getElementById("cancel-btn")!;

// Contact type (from auto-generated API)
interface Contact {
    id: number | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string | null;
}

// Show message
function showMessage(text: string, isError = false) {
    messageDiv.className = `message ${isError ? "error" : "success"}`;
    messageDiv.textContent = text;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 3000);
}

// Show logged in state
function showLoggedIn(username: string) {
    currentUser.textContent = username;
    loginSection.classList.add("hidden");
    authSection.classList.remove("hidden");
    contactsSection.classList.remove("hidden");
    apiInfo.classList.remove("hidden");
    loadContacts();
}

// Show logged out state
function showLoggedOut() {
    loginSection.classList.remove("hidden");
    authSection.classList.add("hidden");
    contactsSection.classList.add("hidden");
    apiInfo.classList.add("hidden");
    passwordInput.value = "";
}

// Check initial auth state from server-injected claims
const user = (window as any).user as { userId: number | null; username: string } | undefined;
if (user?.userId != null && !isNaN(user.userId)) {
    showLoggedIn(user.username);
} else {
    showLoggedOut();
}

// Auth handlers
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

// CRUD Operations using auto-generated API client

// GET all contacts
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

// PUT - Create new contact (with returning)
async function createContact(name: string, email: string, phone: string) {
    const result = await contactsPut({
        name,
        email: email || null,
        phone: phone || null
    });

    if (result.status === 200 && result.response.length > 0) {
        showMessage(`Contact "${result.response[0].name}" created!`);
        loadContacts();
        // Clear form
        newName.value = "";
        newEmail.value = "";
        newPhone.value = "";
    } else {
        showMessage(result.error?.detail || "Failed to create contact", true);
    }
}

// POST - Update contact
async function updateContact(id: number, name: string, email: string, phone: string) {
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

// DELETE - Delete contact
async function deleteContact(id: number) {
    const result = await contactsDelete({ id });

    if (result.status === 204) {
        showMessage("Contact deleted!");
        loadContacts();
    } else {
        showMessage("Failed to delete contact", true);
    }
}

// Render contacts table
function renderContacts(contacts: Contact[]) {
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
                ${contacts.map(c => `
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

// Escape HTML for safe rendering
function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;"
    }[char] || char));
}

// Global functions for onclick handlers
(window as any).editContact = (id: number, name: string, email: string, phone: string) => {
    editId.value = String(id);
    editName.value = name;
    editEmail.value = email;
    editPhone.value = phone;
    editForm.classList.remove("hidden");
    editName.focus();
};

(window as any).confirmDelete = (id: number, name: string) => {
    if (confirm(`Delete contact "${name}"?`)) {
        deleteContact(id);
    }
};

// Add contact button
addBtn.addEventListener("click", () => {
    if (!newName.value.trim()) {
        showMessage("Name is required", true);
        return;
    }
    createContact(newName.value.trim(), newEmail.value.trim(), newPhone.value.trim());
});

// Save edit button
saveBtn.addEventListener("click", () => {
    if (!editName.value.trim()) {
        showMessage("Name is required", true);
        return;
    }
    updateContact(
        parseInt(editId.value),
        editName.value.trim(),
        editEmail.value.trim(),
        editPhone.value.trim()
    );
});

// Cancel edit button
cancelBtn.addEventListener("click", () => {
    editForm.classList.add("hidden");
});

// Allow Enter key to submit forms
newName.addEventListener("keypress", (e) => e.key === "Enter" && addBtn.click());
newEmail.addEventListener("keypress", (e) => e.key === "Enter" && addBtn.click());
newPhone.addEventListener("keypress", (e) => e.key === "Enter" && addBtn.click());
passwordInput.addEventListener("keypress", (e) => e.key === "Enter" && loginBtn.click());
