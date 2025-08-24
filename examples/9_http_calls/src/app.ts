import { login, logout, getFinancialDashboard } from "./example9Api.ts";

const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const loginBtn = document.getElementById("login-btn")!;
const result = document.getElementById("result")!;

const loginSection = document.getElementById("login-section")!;
const dashboardSection = document.getElementById("dashboard-section")!;
const authStatus = document.getElementById("auth-status")!;

const fetchDashboardBtn = document.getElementById("fetch-dashboard-btn")!;
const baseCurrencyInput = document.getElementById("base-currency") as HTMLInputElement;
const targetCurrenciesInput = document.getElementById("target-currencies") as HTMLInputElement;
const cryptoIdsInput = document.getElementById("crypto-ids") as HTMLInputElement;
const vsCurrenciesInput = document.getElementById("vs-currencies") as HTMLInputElement;

const fiatRatesDiv = document.getElementById("fiat-rates")!;
const cryptoPricesDiv = document.getElementById("crypto-prices")!;

function showLoggedIn(username: string) {
    authStatus.innerHTML = `<p style="color: green;">Logged in as <strong>${username}</strong> <button id="logout-btn" class="btn-logout">Logout</button></p>`;
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");

    document.getElementById("logout-btn")?.addEventListener("click", handleLogout);
}

function showLoggedOut() {
    authStatus.innerHTML = `<p style="color: gray;">Not authenticated</p>`;
    loginSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
}

async function handleLogout() {
    const response = await logout();

    if (response.status === 200) {
        result.innerHTML = `<p style="color: green;">Logged out successfully!</p>`;
        showLoggedOut();
    } else {
        result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
        <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
    }
}

// Check initial auth state
const user = (window as any).user as { userId: number | null; username: string } | undefined;
if (user?.userId != null && !isNaN(user.userId)) {
    showLoggedIn(user.username);
} else {
    showLoggedOut();
}

loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    const response = await login({ username, password });

    if (response.status === 200) {
        result.innerHTML = `<p style="color: green;">Login successful!</p>`;
        showLoggedIn(username);
    } else {
        result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
        <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
    }
});

fetchDashboardBtn.addEventListener("click", async () => {
    fiatRatesDiv.innerHTML = "<p>Loading exchange rates...</p>";
    cryptoPricesDiv.innerHTML = "<p>Loading crypto prices...</p>";

    // Clean up CSV inputs (trim whitespace, normalize case)
    const targetCurrenciesCsv = targetCurrenciesInput.value.split(",").map(s => s.trim().toUpperCase()).filter(Boolean).join(",");
    const cryptoIdsCsv = cryptoIdsInput.value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean).join(",");
    const vsCurrenciesCsv = vsCurrenciesInput.value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean).join(",");

    const response = await getFinancialDashboard({
        baseCurrency: baseCurrencyInput.value.toUpperCase(),
        targetCurrenciesCsv,
        cryptoIdsCsv,
        vsCurrenciesCsv
    });

    if (response.status === 200 && response.response) {
        const data = response.response;

        // Display fiat rates
        if (!data.fiatSuccess) {
            fiatRatesDiv.innerHTML = `<p class="error">Error: ${data.fiatError}</p>`;
        } else {
            let ratesHtml = `<p><strong>Base:</strong> ${data.fiatBaseCurrency}</p>`;
            ratesHtml += `<p><strong>Last Updated:</strong> ${data.fiatLastUpdated}</p>`;
            ratesHtml += "<table><thead><tr><th>Currency</th><th>Rate</th></tr></thead><tbody>";
            for (const [currency, rate] of Object.entries(data.fiatRates as Record<string, number>)) {
                ratesHtml += `<tr><td>${currency}</td><td>${rate.toFixed(4)}</td></tr>`;
            }
            ratesHtml += "</tbody></table>";
            fiatRatesDiv.innerHTML = ratesHtml;
        }

        // Display crypto prices
        if (!data.cryptoSuccess) {
            cryptoPricesDiv.innerHTML = `<p class="error">Error: ${data.cryptoError}</p>`;
        } else {
            let cryptoHtml = "<table><thead><tr><th>Crypto</th><th>Prices</th></tr></thead><tbody>";
            for (const [crypto, prices] of Object.entries(data.cryptoPrices as Record<string, Record<string, number>>)) {
                const priceStr = Object.entries(prices)
                    .map(([cur, val]) => `${cur.toUpperCase()}: ${val.toLocaleString()}`)
                    .join(", ");
                cryptoHtml += `<tr><td>${crypto}</td><td>${priceStr}</td></tr>`;
            }
            cryptoHtml += "</tbody></table>";
            cryptoPricesDiv.innerHTML = cryptoHtml;
        }

        result.innerHTML = `<p style="color: green;">Dashboard loaded successfully!</p>`;
    } else {
        result.innerHTML = `<p style="color: red;">Status: ${response.status}</p>
        <p style="color: red;">Error: ${JSON.stringify(response.error)}</p>`;
        fiatRatesDiv.innerHTML = "";
        cryptoPricesDiv.innerHTML = "";
    }
});
