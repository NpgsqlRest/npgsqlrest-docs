import { getPosts, getUsers } from "./sql2Api.ts";

const app = document.getElementById("app")!;


// Render a single user row - uses IGetUsersResponse properties
function renderUserRow(user: { userId: number | null; username: string | null; email: string | null; active: boolean | null }) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${user.userId}</td>
        <td>${user.username ?? "Anonymous"}</td>
        <td>${user.email ?? "N/A"}</td>
        <td>${user.active ? "✓" : "✗"}</td>
    `;
    return row;
}

// Render a single post - uses IGetPostsResponse properties
function renderPost(post: { username: string | null; content: string | null; createdAt: string | null }) {
    const article = document.createElement("article");
    article.className = "post";
    article.innerHTML = `
        <header><strong>${post.username ?? "Anonymous"}</strong></header>
        <p>${post.content ?? ""}</p>
        <footer><small>${post.createdAt ? new Date(post.createdAt).toLocaleString() : "Unknown date"}</small></footer>
    `;
    return article;
}

// Load and display users
async function loadUsers() {
    const { status, response: users, error } = await getUsers();

    if (status !== 200) {
        app.innerHTML = `<p>Error loading users. Here is what we know: ${error?.title}</p>`;
        return;
    }

    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Active</th>
            </tr>
        </thead>
    `;
    const tbody = document.createElement("tbody");

    // Static type checking happens here!
    // If IGetUsersResponse changes (e.g., "username" renamed to "name"),
    // TypeScript will fail the build with: Property 'username' does not exist
    for (const user of users) {
        tbody.appendChild(renderUserRow(user));
    }

    table.appendChild(tbody);
    app.appendChild(table);
}

// Load and display posts
async function loadPosts() {
    const { status, response: posts, error } = await getPosts();

    if (status !== 200) {
        app.innerHTML += `<p>Error loading posts. Here is what we know: ${error?.title}</p>`;
        return;
    }

    const postsSection = document.createElement("section");
    postsSection.innerHTML = "<h2>Posts</h2>";

    // Static type checking happens here!
    // If IGetPostsResponse changes (e.g., "content" renamed to "body"),
    // TypeScript will fail the build with: Property 'content' does not exist
    for (const post of posts) {
        postsSection.appendChild(renderPost(post));
    }

    app.appendChild(postsSection);
}

// Initialize the app
async function init() {
    app.innerHTML = "<h1>Users & Posts</h1>";
    await loadUsers();
    await loadPosts();
}

init();
