import { bestLaptop } from "./example16Api.ts";

const findBtn = document.getElementById("find-btn") as HTMLButtonElement;
const resultCard = document.getElementById("result-card")!;
const resultBody = document.getElementById("result-body")!;
const status = document.getElementById("status")!;

findBtn.addEventListener("click", async () => {
    findBtn.disabled = true;
    status.innerHTML = `<p style="color:#666;">Fetching and scoring laptops… this calls the external site, give it a few seconds.</p>`;
    resultCard.classList.add("hidden");

    // The HTTP Custom Type fields are filled server-side from the live HTTP
    // call, so no request parameters are needed here.
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
