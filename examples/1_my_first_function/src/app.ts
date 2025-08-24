import { myFirstFunction } from "./example1Api.ts";

const app = document.getElementById("app")!;

myFirstFunction().then(greet => {
    if (greet.status === 200) {
        app.textContent = greet.response.join(", ");
    } else {
        app.innerHTML = `<p style="color: red;">Status: ${greet.status}</p>
        <p style="color: red;">Error response: ${JSON.stringify(greet.error)}</p>`;
    }
});
