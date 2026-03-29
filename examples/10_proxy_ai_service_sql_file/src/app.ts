import {
    login,
    logout,
    aiHealth,
    aiSummarize,
    aiSentiment,
    aiAnalyze,
    cacheStats,
    cacheClear
} from "./example10Api.ts";

// DOM Elements
const loginSection = document.getElementById("login-section")!;
const authSection = document.getElementById("auth-section")!;
const analysisSection = document.getElementById("analysis-section")!;
const cacheSection = document.getElementById("cache-section")!;

const usernameSelect = document.getElementById("username") as HTMLSelectElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;
const currentUserSpan = document.getElementById("current-user")!;

const aiStatusSpan = document.getElementById("ai-status")!;
const checkHealthBtn = document.getElementById("check-health-btn") as HTMLButtonElement;
const healthResult = document.getElementById("health-result")!;

const textInput = document.getElementById("text-input") as HTMLTextAreaElement;
const summarizeBtn = document.getElementById("summarize-btn") as HTMLButtonElement;
const sentimentBtn = document.getElementById("sentiment-btn") as HTMLButtonElement;
const analyzeBtn = document.getElementById("analyze-btn") as HTMLButtonElement;
const analysisResult = document.getElementById("analysis-result")!;

const statTotal = document.getElementById("stat-total")!;
const statHits = document.getElementById("stat-hits")!;
const statMost = document.getElementById("stat-most")!;
const refreshStatsBtn = document.getElementById("refresh-stats-btn") as HTMLButtonElement;
const clearCacheBtn = document.getElementById("clear-cache-btn") as HTMLButtonElement;

// Utility functions
function showElement(el: HTMLElement) {
    el.classList.remove("hidden");
}

function hideElement(el: HTMLElement) {
    el.classList.add("hidden");
}

function setLoading(btn: HTMLButtonElement, loading: boolean, originalText: string) {
    btn.disabled = loading;
    if (loading) {
        btn.innerHTML = '<span class="loader"></span>Loading...';
    } else {
        btn.textContent = originalText;
    }
}

function formatResult(data: unknown): string {
    return JSON.stringify(data, null, 2);
}

// Check AI service health (passthrough proxy - no response field, just status)
async function checkHealth() {
    aiStatusSpan.className = "status checking";
    aiStatusSpan.textContent = "Checking...";

    const result = await aiHealth();

    if (result.status === 200) {
        aiStatusSpan.className = "status online";
        aiStatusSpan.textContent = "Online";
        showElement(healthResult);
        // Passthrough mode returns the upstream response directly
        // The generated client doesn't parse it, but we can fetch it manually for display
        healthResult.textContent = "AI Service is healthy (passthrough mode - no DB connection opened)";
    } else {
        aiStatusSpan.className = "status offline";
        aiStatusSpan.textContent = "Offline";
        showElement(healthResult);
        healthResult.textContent = `Error: ${result.status}\n${formatResult(result.error)}`;
    }
}

// Update UI based on auth state
function updateAuthUI(loggedIn: boolean, username?: string) {
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

// Login handler
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

    // Login returns status 200 on success
    if (result.status === 200) {
        updateAuthUI(true, username);
    } else {
        alert("Login failed: " + (result.error?.detail || result.error?.title || "Unknown error"));
    }
}

// Logout handler
async function handleLogout() {
    await logout();
    updateAuthUI(false);
}

// Summarize handler
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
        let output = `=== SUMMARY ===\n\n`;
        output += `${data.summary}\n\n`;
        output += `Original length: ${data.original_length} chars\n`;
        output += `Summary length: ${data.summary_length} chars\n`;
        if (data.cached) {
            output += `\n[CACHED - ${data.cache_hits} previous hits]`;
        }
        if (data.model) {
            output += `\nModel: ${data.model}`;
        }
        analysisResult.textContent = output;
        refreshCacheStats();
    } else {
        analysisResult.textContent = `Error: ${result.status}\n${formatResult(result.error || result.response)}`;
    }
}

// Sentiment handler
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
        let output = `=== SENTIMENT ANALYSIS ===\n\n`;
        output += `Sentiment: ${(data.sentiment || "").toUpperCase()}\n`;
        output += `Score: ${data.score}\n`;
        output += `Confidence: ${((data.confidence || 0) * 100).toFixed(0)}%\n`;
        if (data.cached) {
            output += `\n[CACHED - ${data.cache_hits} previous hits]`;
        }
        if (data.model) {
            output += `\nModel: ${data.model}`;
        }
        analysisResult.textContent = output;
        refreshCacheStats();
    } else {
        analysisResult.textContent = `Error: ${result.status}\n${formatResult(result.error || result.response)}`;
    }
}

// Full analysis handler
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
        let output = `=== FULL ANALYSIS ===\n\n`;

        if (data.summary) {
            output += `--- Summary ---\n${data.summary.text}\n`;
            output += `(${data.summary.original_length} -> ${data.summary.summary_length} chars)\n\n`;
        }

        if (data.sentiment) {
            output += `--- Sentiment ---\n`;
            output += `${(data.sentiment.sentiment || "").toUpperCase()} (score: ${data.sentiment.score}, confidence: ${((data.sentiment.confidence || 0) * 100).toFixed(0)}%)\n\n`;
        }

        if (data.keywords) {
            output += `--- Keywords ---\n`;
            output += (data.keywords.words || []).join(", ") + "\n\n";
        }

        if (data.cached) {
            output += `[CACHED - ${data.cache_hits} previous hits]\n`;
        }
        if (data.model) {
            output += `Model: ${data.model}\n`;
        }
        if (data.processed_at) {
            output += `Processed: ${data.processed_at}`;
        }

        analysisResult.textContent = output;
        refreshCacheStats();
    } else {
        analysisResult.textContent = `Error: ${result.status}\n${formatResult(result.error || result.response)}`;
    }
}

// Refresh cache stats
async function refreshCacheStats() {
    const result = await cacheStats();

    if (result.status === 200 && result.response?.[0]) {
        const stats = result.response[0];
        statTotal.textContent = String(stats.totalCached || 0);
        statHits.textContent = String(stats.totalCacheHits || 0);
        statMost.textContent = stats.mostAccessedHits ? String(stats.mostAccessedHits) : "-";
    }
}

// Clear cache
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

// Event listeners
loginBtn.addEventListener("click", handleLogin);
logoutBtn.addEventListener("click", handleLogout);
checkHealthBtn.addEventListener("click", checkHealth);
summarizeBtn.addEventListener("click", handleSummarize);
sentimentBtn.addEventListener("click", handleSentiment);
analyzeBtn.addEventListener("click", handleAnalyze);
refreshStatsBtn.addEventListener("click", refreshCacheStats);
clearCacheBtn.addEventListener("click", handleClearCache);

passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
});

// Check initial auth state from server-injected claims
const user = (window as any).user as { userId: number | null; username: string } | undefined;
if (user?.userId != null && !isNaN(user.userId)) {
    updateAuthUI(true, user.username);
} else {
    updateAuthUI(false);
}

// Initial health check
checkHealth();
