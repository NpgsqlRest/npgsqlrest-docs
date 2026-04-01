// src/sqlApi.ts
var baseUrl = "";
var parseQuery = (query) => "?" + Object.keys(query ? query : {}).map((key) => {
  const value = query[key] != null ? query[key] : "";
  if (Array.isArray(value)) {
    return value.map((s) => s ? `${key}=${encodeURIComponent(s)}` : `${key}=`).join("&");
  }
  return `${key}=${encodeURIComponent(value)}`;
}).join("&");
async function financialDashboard(request) {
  const response = await fetch(baseUrl + "/financial-dashboard" + parseQuery(request), {
    method: "GET"
  });
  return {
    status: response.status,
    response: response.ok ? await response.json() : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function login(request) {
  const response = await fetch(baseUrl + "/api/login", {
    method: "POST",
    body: JSON.stringify(request)
  });
  return {
    status: response.status,
    response: response.ok ? await response.text() : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function logout() {
  const response = await fetch(baseUrl + "/api/logout", {
    method: "POST"
  });
  return {
    status: response.status,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}

// src/app.ts
var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var loginBtn = document.getElementById("login-btn");
var result = document.getElementById("result");
var loginSection = document.getElementById("login-section");
var dashboardSection = document.getElementById("dashboard-section");
var authStatus = document.getElementById("auth-status");
var fetchDashboardBtn = document.getElementById("fetch-dashboard-btn");
var baseCurrencyInput = document.getElementById("base-currency");
var targetCurrenciesInput = document.getElementById("target-currencies");
var cryptoIdsInput = document.getElementById("crypto-ids");
var vsCurrenciesInput = document.getElementById("vs-currencies");
var fiatRatesDiv = document.getElementById("fiat-rates");
var cryptoPricesDiv = document.getElementById("crypto-prices");
function showLoggedIn(username) {
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
var user = window.user;
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
  const targetCurrenciesCsv = targetCurrenciesInput.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).join(",");
  const cryptoIdsCsv = cryptoIdsInput.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).join(",");
  const vsCurrenciesCsv = vsCurrenciesInput.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).join(",");
  const response = await financialDashboard({
    _base_currency: baseCurrencyInput.value.toUpperCase(),
    _target_currencies_csv: targetCurrenciesCsv,
    _crypto_ids_csv: cryptoIdsCsv,
    _vs_currencies_csv: vsCurrenciesCsv
  });
  if (response.status === 200 && response.response) {
    const data = response.response.dashboard;
    if (!data.fiatSuccess) {
      fiatRatesDiv.innerHTML = `<p class="error">Error: ${data.fiatError}</p>`;
    } else {
      let ratesHtml = `<p><strong>Base:</strong> ${data.fiatBaseCurrency}</p>`;
      ratesHtml += `<p><strong>Last Updated:</strong> ${data.fiatLastUpdated}</p>`;
      ratesHtml += "<table><thead><tr><th>Currency</th><th>Rate</th></tr></thead><tbody>";
      for (const [currency, rate] of Object.entries(data.fiatRates)) {
        ratesHtml += `<tr><td>${currency}</td><td>${rate.toFixed(4)}</td></tr>`;
      }
      ratesHtml += "</tbody></table>";
      fiatRatesDiv.innerHTML = ratesHtml;
    }
    if (!data.cryptoSuccess) {
      cryptoPricesDiv.innerHTML = `<p class="error">Error: ${data.cryptoError}</p>`;
    } else {
      let cryptoHtml = "<table><thead><tr><th>Crypto</th><th>Prices</th></tr></thead><tbody>";
      for (const [crypto, prices] of Object.entries(data.cryptoPrices)) {
        const priceStr = Object.entries(prices).map(([cur, val]) => `${cur.toUpperCase()}: ${val.toLocaleString()}`).join(", ");
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
