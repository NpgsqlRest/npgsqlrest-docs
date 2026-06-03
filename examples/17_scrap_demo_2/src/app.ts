import { averageBookPrice } from "./example17Api.ts";

const findBtn = document.getElementById("find-btn") as HTMLButtonElement;
const resultCard = document.getElementById("result-card")!;
const resultBody = document.getElementById("result-body")!;
const status = document.getElementById("status")!;

findBtn.addEventListener("click", async () => {
    findBtn.disabled = true;
    status.innerHTML = `<p style="color:#666;">Fetching and averaging book prices… this calls the external site, give it a few seconds.</p>`;
    resultCard.classList.add("hidden");

    // The HTTP Custom Type fields are filled server-side from the live HTTP
    // call, so no request parameters are needed here.
    const result = await averageBookPrice({});

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
