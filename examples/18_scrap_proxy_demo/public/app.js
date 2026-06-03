// src/example18Api.ts
var baseUrl = "";
async function averageBookPrice() {
  const response = await fetch(baseUrl + "/average-book-price", {
    method: "POST",
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
var findBtn = document.getElementById("find-btn");
var resultCard = document.getElementById("result-card");
var resultBody = document.getElementById("result-body");
var status = document.getElementById("status");
findBtn.addEventListener("click", async () => {
  findBtn.disabled = true;
  status.innerHTML = `<p style="color:#666;">Fetching and averaging book prices… this calls the external site, give it a few seconds.</p>`;
  resultCard.classList.add("hidden");
  const result = await averageBookPrice();
  findBtn.disabled = false;
  if (result.status === 200 && result.response) {
    resultBody.textContent = `£${Number(result.response.avgPrice).toFixed(2)}`;
    resultCard.classList.remove("hidden");
    status.innerHTML = `<p style="color:green;">Done. Average computed across all books on the page.</p>`;
  } else {
    status.innerHTML = `<p style="color:#f44336;">Status: ${result.status}</p>
            <p style="color:#f44336;">Error: ${JSON.stringify(result.error)}</p>`;
  }
});
