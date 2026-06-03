// src/example16Api.ts
var baseUrl = "";
var parseQuery = (query) => "?" + Object.keys(query ? query : {}).map((key) => {
  const value = query[key] != null ? query[key] : "";
  if (Array.isArray(value)) {
    return value.map((s) => s ? `${key}=${encodeURIComponent(s)}` : `${key}=`).join("&");
  }
  return `${key}=${encodeURIComponent(value)}`;
}).join("&");
async function bestLaptop(request) {
  const response = await fetch(baseUrl + "/best-laptop" + parseQuery(request), {
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
var findBtn = document.getElementById("find-btn");
var resultCard = document.getElementById("result-card");
var resultBody = document.getElementById("result-body");
var status = document.getElementById("status");
findBtn.addEventListener("click", async () => {
  findBtn.disabled = true;
  status.innerHTML = `<p style="color:#666;">Fetching and scoring laptops… this calls the external site, give it a few seconds.</p>`;
  resultCard.classList.add("hidden");
  const result = await bestLaptop({});
  findBtn.disabled = false;
  if (result.status === 200 && result.response) {
    const r = result.response;
    resultBody.innerHTML = `
            <h3>${r.title}</h3>
            <table>
                <tbody>
                    <tr><th>Price</th><td>$${Number(r.price).toFixed(2)}</td></tr>
                    <tr><th>Rating</th><td>${r.rating} / 5</td></tr>
                    <tr><th>Score</th><td>${Number(r.score).toFixed(6)}</td></tr>
                </tbody>
            </table>`;
    resultCard.classList.remove("hidden");
    status.innerHTML = `<p style="color:green;">Done. Best value selected from the catalog.</p>`;
  } else {
    status.innerHTML = `<p style="color:#f44336;">Status: ${result.status}</p>
            <p style="color:#f44336;">Error: ${JSON.stringify(result.error)}</p>`;
  }
});
