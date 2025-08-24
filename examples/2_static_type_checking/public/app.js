// src/example2Api.ts
var baseUrl = "http://127.0.0.1:8080";
async function getPosts() {
  const response = await fetch(baseUrl + "/api/example-2/get-posts", {
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
async function getUsers() {
  const response = await fetch(baseUrl + "/api/example-2/get-users", {
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

// src/app.ts
var app = document.getElementById("app");
function renderUserRow(user) {
  const row = document.createElement("tr");
  row.innerHTML = `
        <td>${user.userId}</td>
        <td>${user.username ?? "Anonymous"}</td>
        <td>${user.email ?? "N/A"}</td>
        <td>${user.active ? "✓" : "✗"}</td>
    `;
  return row;
}
function renderPost(post) {
  const article = document.createElement("article");
  article.className = "post";
  article.innerHTML = `
        <header><strong>${post.username ?? "Anonymous"}</strong></header>
        <p>${post.content ?? ""}</p>
        <footer><small>${post.createdAt ? new Date(post.createdAt).toLocaleString() : "Unknown date"}</small></footer>
    `;
  return article;
}
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
  for (const user of users) {
    tbody.appendChild(renderUserRow(user));
  }
  table.appendChild(tbody);
  app.appendChild(table);
}
async function loadPosts() {
  const { status, response: posts, error } = await getPosts();
  if (status !== 200) {
    app.innerHTML += `<p>Error loading posts. Here is what we know: ${error?.title}</p>`;
    return;
  }
  const postsSection = document.createElement("section");
  postsSection.innerHTML = "<h2>Posts</h2>";
  for (const post of posts) {
    postsSection.appendChild(renderPost(post));
  }
  app.appendChild(postsSection);
}
async function init() {
  app.innerHTML = "<h1>Users & Posts</h1>";
  await loadUsers();
  await loadPosts();
}
init();
