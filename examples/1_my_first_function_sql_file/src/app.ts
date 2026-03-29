import { myFirstQuery } from "./publicApi";

const app = document.getElementById("app")!;

async function render() {
    const { status, response, error } = await myFirstQuery();

    if (error) {
        app.innerHTML = `<p style="color:red">Error ${status}: ${error.title}</p>`;
        return;
    }

    app.innerHTML = `
        <h2>First</h2>
        <ul>${response.first.map(r => `<li>${r}</li>`).join("")}</ul>

        <h2>Second</h2>
        <table border="1" cellpadding="6" cellspacing="0">
            <thead><tr><th>Query</th><th>User</th><th>Timestamp</th></tr></thead>
            <tbody>
                ${response.second.map(r => `<tr><td>${r.queryText}</td><td>${r.user}</td><td>${r.timestamp}</td></tr>`).join("")}
            </tbody>
        </table>
    `;
}

render();
