// src/example1Api.ts
var baseUrl = "http://127.0.0.1:8080";
async function myFirstFunction() {
  const response = await fetch(baseUrl + "/api/example-1/my-first-function", {
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
myFirstFunction().then((greet) => {
  if (greet.status === 200) {
    app.textContent = greet.response.join(", ");
  } else {
    app.innerHTML = `<p style="color: red;">Status: ${greet.status}</p>
        <p style="color: red;">Error response: ${JSON.stringify(greet.error)}</p>`;
  }
});
