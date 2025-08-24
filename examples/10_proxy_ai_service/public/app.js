// src/example10Api.ts
var baseUrl = "http://127.0.0.1:8080";
async function aiAnalyze(request) {
  const response = await fetch(baseUrl + "/ai/analyze", {
    method: "POST",
    body: JSON.stringify(request)
  });
  return {
    status: response.status,
    response: response.ok ? await response.json() : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function aiHealth() {
  const response = await fetch(baseUrl + "/ai/health", {
    method: "GET"
  });
  return {
    status: response.status,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function aiSentiment(request) {
  const response = await fetch(baseUrl + "/ai/sentiment", {
    method: "POST",
    body: JSON.stringify(request)
  });
  return {
    status: response.status,
    response: response.ok ? await response.json() : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function aiSummarize(request) {
  const response = await fetch(baseUrl + "/ai/summarize", {
    method: "POST",
    body: JSON.stringify(request)
  });
  return {
    status: response.status,
    response: response.ok ? await response.json() : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function cacheClear() {
  const response = await fetch(baseUrl + "/cache/clear", {
    method: "DELETE"
  });
  return {
    status: response.status,
    response: response.ok ? await response.json() : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function cacheStats() {
  const response = await fetch(baseUrl + "/cache/stats", {
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
async function login(request) {
  const response = await fetch(baseUrl + "/api/example-10/login", {
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
  const response = await fetch(baseUrl + "/api/example-10/logout", {
    method: "POST"
  });
  return {
    status: response.status,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}

// src/app.ts
var loginSection = document.getElementById("login-section");
var authSection = document.getElementById("auth-section");
var analysisSection = document.getElementById("analysis-section");
var cacheSection = document.getElementById("cache-section");
var usernameSelect = document.getElementById("username");
var passwordInput = document.getElementById("password");
var loginBtn = document.getElementById("login-btn");
var logoutBtn = document.getElementById("logout-btn");
var currentUserSpan = document.getElementById("current-user");
var aiStatusSpan = document.getElementById("ai-status");
var checkHealthBtn = document.getElementById("check-health-btn");
var healthResult = document.getElementById("health-result");
var textInput = document.getElementById("text-input");
var summarizeBtn = document.getElementById("summarize-btn");
var sentimentBtn = document.getElementById("sentiment-btn");
var analyzeBtn = document.getElementById("analyze-btn");
var analysisResult = document.getElementById("analysis-result");
var statTotal = document.getElementById("stat-total");
var statHits = document.getElementById("stat-hits");
var statMost = document.getElementById("stat-most");
var refreshStatsBtn = document.getElementById("refresh-stats-btn");
var clearCacheBtn = document.getElementById("clear-cache-btn");
function showElement(el) {
  el.classList.remove("hidden");
}
function hideElement(el) {
  el.classList.add("hidden");
}
function setLoading(btn, loading, originalText) {
  btn.disabled = loading;
  if (loading) {
    btn.innerHTML = '<span class="loader"></span>Loading...';
  } else {
    btn.textContent = originalText;
  }
}
function formatResult(data) {
  return JSON.stringify(data, null, 2);
}
async function checkHealth() {
  aiStatusSpan.className = "status checking";
  aiStatusSpan.textContent = "Checking...";
  const result = await aiHealth();
  if (result.status === 200) {
    aiStatusSpan.className = "status online";
    aiStatusSpan.textContent = "Online";
    showElement(healthResult);
    healthResult.textContent = "AI Service is healthy (passthrough mode - no DB connection opened)";
  } else {
    aiStatusSpan.className = "status offline";
    aiStatusSpan.textContent = "Offline";
    showElement(healthResult);
    healthResult.textContent = `Error: ${result.status}
${formatResult(result.error)}`;
  }
}
function updateAuthUI(loggedIn, username) {
  if (loggedIn) {
    hideElement(loginSection);
    showElement(authSection);
    showElement(analysisSection);
    showElement(cacheSection);
    currentUserSpan.textContent = username || "";
    refreshCacheStats();
  } else {
    showElement(loginSection);
    hideElement(authSection);
    hideElement(analysisSection);
    hideElement(cacheSection);
  }
}
async function handleLogin() {
  const username = usernameSelect.value;
  const password = passwordInput.value;
  if (!password) {
    alert("Please enter a password");
    return;
  }
  setLoading(loginBtn, true, "Login");
  const result = await login({ username, password });
  setLoading(loginBtn, false, "Login");
  if (result.status === 200) {
    updateAuthUI(true, username);
  } else {
    alert("Login failed: " + (result.error?.detail || result.error?.title || "Unknown error"));
  }
}
async function handleLogout() {
  await logout();
  updateAuthUI(false);
}
async function handleSummarize() {
  const text = textInput.value.trim();
  if (!text) {
    alert("Please enter some text");
    return;
  }
  setLoading(summarizeBtn, true, "Summarize");
  const result = await aiSummarize({ text, maxLength: 150 });
  setLoading(summarizeBtn, false, "Summarize");
  showElement(analysisResult);
  if (result.status === 200) {
    const data = result.response;
    let output = `=== SUMMARY ===

`;
    output += `${data.summary}

`;
    output += `Original length: ${data.original_length} chars
`;
    output += `Summary length: ${data.summary_length} chars
`;
    if (data.cached) {
      output += `
[CACHED - ${data.cache_hits} previous hits]`;
    }
    if (data.model) {
      output += `
Model: ${data.model}`;
    }
    analysisResult.textContent = output;
    refreshCacheStats();
  } else {
    analysisResult.textContent = `Error: ${result.status}
${formatResult(result.error || result.response)}`;
  }
}
async function handleSentiment() {
  const text = textInput.value.trim();
  if (!text) {
    alert("Please enter some text");
    return;
  }
  setLoading(sentimentBtn, true, "Analyze Sentiment");
  const result = await aiSentiment({ text });
  setLoading(sentimentBtn, false, "Analyze Sentiment");
  showElement(analysisResult);
  if (result.status === 200) {
    const data = result.response;
    let output = `=== SENTIMENT ANALYSIS ===

`;
    output += `Sentiment: ${(data.sentiment || "").toUpperCase()}
`;
    output += `Score: ${data.score}
`;
    output += `Confidence: ${((data.confidence || 0) * 100).toFixed(0)}%
`;
    if (data.cached) {
      output += `
[CACHED - ${data.cache_hits} previous hits]`;
    }
    if (data.model) {
      output += `
Model: ${data.model}`;
    }
    analysisResult.textContent = output;
    refreshCacheStats();
  } else {
    analysisResult.textContent = `Error: ${result.status}
${formatResult(result.error || result.response)}`;
  }
}
async function handleAnalyze() {
  const text = textInput.value.trim();
  if (!text) {
    alert("Please enter some text");
    return;
  }
  setLoading(analyzeBtn, true, "Full Analysis");
  const result = await aiAnalyze({ text, maxLength: 150, maxKeywords: 5 });
  setLoading(analyzeBtn, false, "Full Analysis");
  showElement(analysisResult);
  if (result.status === 200) {
    const data = result.response;
    let output = `=== FULL ANALYSIS ===

`;
    if (data.summary) {
      output += `--- Summary ---
${data.summary.text}
`;
      output += `(${data.summary.original_length} -> ${data.summary.summary_length} chars)

`;
    }
    if (data.sentiment) {
      output += `--- Sentiment ---
`;
      output += `${(data.sentiment.sentiment || "").toUpperCase()} (score: ${data.sentiment.score}, confidence: ${((data.sentiment.confidence || 0) * 100).toFixed(0)}%)

`;
    }
    if (data.keywords) {
      output += `--- Keywords ---
`;
      output += (data.keywords.words || []).join(", ") + `

`;
    }
    if (data.cached) {
      output += `[CACHED - ${data.cache_hits} previous hits]
`;
    }
    if (data.model) {
      output += `Model: ${data.model}
`;
    }
    if (data.processed_at) {
      output += `Processed: ${data.processed_at}`;
    }
    analysisResult.textContent = output;
    refreshCacheStats();
  } else {
    analysisResult.textContent = `Error: ${result.status}
${formatResult(result.error || result.response)}`;
  }
}
async function refreshCacheStats() {
  const result = await cacheStats();
  if (result.status === 200 && result.response?.[0]) {
    const stats = result.response[0];
    statTotal.textContent = String(stats.totalCached || 0);
    statHits.textContent = String(stats.totalCacheHits || 0);
    statMost.textContent = stats.mostAccessedHits ? String(stats.mostAccessedHits) : "-";
  }
}
async function handleClearCache() {
  if (!confirm("Are you sure you want to clear the cache?")) {
    return;
  }
  const result = await cacheClear();
  if (result.status === 200) {
    alert(`Cache cleared: ${result.response?.deleted || 0} items deleted`);
    refreshCacheStats();
  } else {
    alert("Failed to clear cache");
  }
}
loginBtn.addEventListener("click", handleLogin);
logoutBtn.addEventListener("click", handleLogout);
checkHealthBtn.addEventListener("click", checkHealth);
summarizeBtn.addEventListener("click", handleSummarize);
sentimentBtn.addEventListener("click", handleSentiment);
analyzeBtn.addEventListener("click", handleAnalyze);
refreshStatsBtn.addEventListener("click", refreshCacheStats);
clearCacheBtn.addEventListener("click", handleClearCache);
passwordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter")
    handleLogin();
});
var user = window.user;
if (user?.userId != null && !isNaN(user.userId)) {
  updateAuthUI(true, user.username);
} else {
  updateAuthUI(false);
}
checkHealth();
