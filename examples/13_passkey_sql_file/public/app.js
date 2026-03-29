// src/example13Api.ts
var baseUrl = "http://localhost:8080";
var parseQuery = (query) => "?" + Object.keys(query ? query : {}).map((key) => {
  const value = query[key] != null ? query[key] : "";
  if (Array.isArray(value)) {
    return value.map((s) => s ? `${key}=${encodeURIComponent(s)}` : `${key}=`).join("&");
  }
  return `${key}=${encodeURIComponent(value)}`;
}).join("&");
async function isPasskeyEnabled(request) {
  const response = await fetch(baseUrl + "/api/example-13/is-passkey-enabled" + parseQuery(request), {
    method: "GET"
  });
  return {
    status: response.status,
    response: response.ok ? await response.text() == "t" : undefined,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function listPasskeyUsers() {
  const response = await fetch(baseUrl + "/api/example-13/list-passkey-users", {
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
  const response = await fetch(baseUrl + "/api/example-13/login", {
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
  const response = await fetch(baseUrl + "/api/example-13/logout", {
    method: "POST"
  });
  return {
    status: response.status,
    error: !response.ok && response.headers.get("content-length") !== "0" ? await response.json() : undefined
  };
}
async function whoAmI(request) {
  const response = await fetch(baseUrl + "/api/example-13/who-am-i" + parseQuery(request), {
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

// src/getDeviceName.ts
async function getDeviceName() {
  if (navigator.userAgentData) {
    try {
      const hints = await navigator.userAgentData.getHighEntropyValues([
        "platform",
        "platformVersion",
        "model"
      ]);
      const platform2 = hints.platform || "Unknown Device";
      const browser2 = navigator.userAgentData.brands?.find((b) => !["Chromium", "Not A(Brand", "Not(A:Brand"].some((x) => b.brand.includes(x)))?.brand || "";
      if (navigator.userAgentData.mobile && hints.model) {
        return browser2 ? `${hints.model} (${browser2})` : hints.model;
      }
      return browser2 ? `${platform2} (${browser2})` : platform2;
    } catch (e) {}
  }
  const ua = navigator.userAgent;
  let platform = "Unknown Device";
  if (/iPhone/.test(ua))
    platform = "iPhone";
  else if (/iPad/.test(ua))
    platform = "iPad";
  else if (/Android/.test(ua))
    platform = "Android";
  else if (/Macintosh/.test(ua))
    platform = "Mac";
  else if (/Windows/.test(ua))
    platform = "Windows PC";
  else if (/Linux/.test(ua))
    platform = "Linux";
  let browser = "";
  if (/Edg/.test(ua))
    browser = "Edge";
  else if (/Chrome/.test(ua))
    browser = "Chrome";
  else if (/Safari/.test(ua))
    browser = "Safari";
  else if (/Firefox/.test(ua))
    browser = "Firefox";
  return browser ? `${platform} (${browser})` : platform;
}

// src/getAnalytics.ts
var getAnalytics_default = () => ({
  timestamp: new Date().toISOString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  screen: {
    width: window.screen.width,
    height: window.screen.height,
    colorDepth: window.screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    orientation: screen.orientation.type
  },
  browser: {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    onLine: navigator.onLine
  },
  memory: {
    deviceMemory: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency
  },
  window: {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight
  },
  location: {
    href: window.location.href,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    protocol: window.location.protocol,
    referrer: document.referrer
  }
});

// src/passkey.ts
var config = {
  registrationOptionsPath: "/api/passkey/register/options",
  registrationPath: "/api/passkey/register",
  loginOptionsPath: "/api/passkey/login/options",
  loginPath: "/api/passkey/login",
  addPasskeyOptionsPath: "/api/passkey/add/options",
  addPasskeyPath: "/api/passkey/add"
};
async function extractError(response, fallback) {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return {
      code: json.type || json.error || "unknown",
      message: json.title || json.detail || json.errorDescription || fallback
    };
  } catch {
    return {
      code: "unknown",
      message: text || fallback
    };
  }
}
function createError(code, message) {
  return { code, message };
}
function base64UrlToBuffer(base64url) {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0;i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0;i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function isWebAuthnSupported() {
  return !!(window.PublicKeyCredential && typeof window.PublicKeyCredential === "function");
}
async function isConditionalMediationAvailable() {
  if (!isWebAuthnSupported())
    return false;
  try {
    return await PublicKeyCredential.isConditionalMediationAvailable?.() ?? false;
  } catch {
    return false;
  }
}
async function register(options, analyticsData) {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: createError("webauthn_not_supported", "WebAuthn is not supported in this browser")
    };
  }
  try {
    const optionsResponse = await fetch(config.registrationOptionsPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options)
    });
    if (!optionsResponse.ok) {
      return { success: false, error: await extractError(optionsResponse, "Failed to get registration options") };
    }
    const creationOptions = await optionsResponse.json();
    const publicKeyOptions = {
      challenge: base64UrlToBuffer(creationOptions.challenge),
      rp: {
        id: creationOptions.rp.id,
        name: creationOptions.rp.name
      },
      user: {
        id: base64UrlToBuffer(creationOptions.user.id),
        name: creationOptions.user.name,
        displayName: creationOptions.user.displayName
      },
      pubKeyCredParams: creationOptions.pubKeyCredParams,
      timeout: creationOptions.timeout,
      attestation: creationOptions.attestation,
      authenticatorSelection: creationOptions.authenticatorSelection ? {
        residentKey: creationOptions.authenticatorSelection.residentKey,
        userVerification: creationOptions.authenticatorSelection.userVerification,
        authenticatorAttachment: creationOptions.authenticatorSelection.authenticatorAttachment
      } : undefined,
      excludeCredentials: creationOptions.excludeCredentials?.map((cred) => ({
        type: cred.type,
        id: base64UrlToBuffer(cred.id),
        transports: cred.transports
      }))
    };
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions
    });
    if (!credential) {
      return {
        success: false,
        error: createError("unknown", "Failed to create credential")
      };
    }
    const attestationResponse = credential.response;
    const registerResponse = await fetch(config.registrationPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId: creationOptions.challengeId,
        credentialId: bufferToBase64Url(credential.rawId),
        attestationObject: bufferToBase64Url(attestationResponse.attestationObject),
        clientDataJSON: bufferToBase64Url(attestationResponse.clientDataJSON),
        transports: attestationResponse.getTransports?.() || [],
        userContext: creationOptions.userContext,
        analyticsData: analyticsData ? JSON.stringify(analyticsData) : undefined
      })
    });
    if (!registerResponse.ok) {
      return { success: false, error: await extractError(registerResponse, "Registration failed") };
    }
    const result = await registerResponse.json();
    return { success: true, credentialId: result.credentialId };
  } catch (error) {
    if (error.name === "NotAllowedError") {
      return {
        success: false,
        error: createError("cancelled", "Registration was cancelled or timed out")
      };
    }
    if (error.name === "InvalidStateError") {
      return {
        success: false,
        error: createError("already_registered", "This authenticator is already registered")
      };
    }
    return {
      success: false,
      error: createError("unknown", error.message || "Unknown error during registration")
    };
  }
}
async function login2(options = {}, analyticsData) {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      response: "",
      error: createError("webauthn_not_supported", "WebAuthn is not supported in this browser")
    };
  }
  try {
    const optionsResponse = await fetch(config.loginOptionsPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: options.userName || null
      })
    });
    if (!optionsResponse.ok) {
      return { success: false, response: "", error: await extractError(optionsResponse, "Failed to get login options") };
    }
    const requestOptions = await optionsResponse.json();
    const publicKeyOptions = {
      challenge: base64UrlToBuffer(requestOptions.challenge),
      rpId: requestOptions.rpId,
      timeout: requestOptions.timeout,
      userVerification: requestOptions.userVerification,
      allowCredentials: requestOptions.allowCredentials?.length > 0 ? requestOptions.allowCredentials.map((cred) => ({
        type: cred.type,
        id: base64UrlToBuffer(cred.id),
        transports: cred.transports
      })) : undefined
    };
    const credential = await navigator.credentials.get({
      publicKey: publicKeyOptions
    });
    if (!credential) {
      return {
        success: false,
        response: "",
        error: createError("unknown", "Failed to get credential")
      };
    }
    const assertionResponse = credential.response;
    const loginResponse = await fetch(config.loginPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId: requestOptions.challengeId,
        credentialId: bufferToBase64Url(credential.rawId),
        authenticatorData: bufferToBase64Url(assertionResponse.authenticatorData),
        clientDataJSON: bufferToBase64Url(assertionResponse.clientDataJSON),
        signature: bufferToBase64Url(assertionResponse.signature),
        userHandle: assertionResponse.userHandle ? bufferToBase64Url(assertionResponse.userHandle) : undefined,
        analyticsData: analyticsData ? JSON.stringify(analyticsData) : undefined
      })
    });
    if (!loginResponse.ok) {
      return { success: false, response: "", error: await extractError(loginResponse, "Login failed") };
    }
    return { success: true, response: await loginResponse.text() };
  } catch (error) {
    if (error.name === "NotAllowedError") {
      return {
        success: false,
        response: "",
        error: createError("cancelled", "Login was cancelled or timed out")
      };
    }
    return {
      success: false,
      response: "",
      error: createError("unknown", error.message || "Unknown error during login")
    };
  }
}
async function addPasskey(options = {}, analyticsData) {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: createError("webauthn_not_supported", "WebAuthn is not supported in this browser")
    };
  }
  try {
    const optionsResponse = await fetch(config.addPasskeyOptionsPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(options)
    });
    if (!optionsResponse.ok) {
      return { success: false, error: await extractError(optionsResponse, "Failed to get registration options") };
    }
    const creationOptions = await optionsResponse.json();
    const publicKeyOptions = {
      challenge: base64UrlToBuffer(creationOptions.challenge),
      rp: {
        id: creationOptions.rp.id,
        name: creationOptions.rp.name
      },
      user: {
        id: base64UrlToBuffer(creationOptions.user.id),
        name: creationOptions.user.name,
        displayName: creationOptions.user.displayName
      },
      pubKeyCredParams: creationOptions.pubKeyCredParams,
      timeout: creationOptions.timeout,
      attestation: creationOptions.attestation,
      authenticatorSelection: creationOptions.authenticatorSelection ? {
        residentKey: creationOptions.authenticatorSelection.residentKey,
        userVerification: creationOptions.authenticatorSelection.userVerification,
        authenticatorAttachment: creationOptions.authenticatorSelection.authenticatorAttachment
      } : undefined,
      excludeCredentials: creationOptions.excludeCredentials?.map((cred) => ({
        type: cred.type,
        id: base64UrlToBuffer(cred.id),
        transports: cred.transports
      }))
    };
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions
    });
    if (!credential) {
      return {
        success: false,
        error: createError("unknown", "Failed to create credential")
      };
    }
    const attestationResponse = credential.response;
    const addPasskeyResponse = await fetch(config.addPasskeyPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        challengeId: creationOptions.challengeId,
        credentialId: bufferToBase64Url(credential.rawId),
        attestationObject: bufferToBase64Url(attestationResponse.attestationObject),
        clientDataJSON: bufferToBase64Url(attestationResponse.clientDataJSON),
        transports: attestationResponse.getTransports?.() || [],
        userContext: creationOptions.userContext,
        analyticsData: analyticsData ? JSON.stringify(analyticsData) : undefined
      })
    });
    if (!addPasskeyResponse.ok) {
      return { success: false, error: await extractError(addPasskeyResponse, "Failed to add passkey") };
    }
    const result = await addPasskeyResponse.json();
    return { success: true, credentialId: result.credentialId };
  } catch (error) {
    if (error.name === "NotAllowedError") {
      return {
        success: false,
        error: createError("cancelled", "Registration was cancelled or timed out")
      };
    }
    if (error.name === "InvalidStateError") {
      return {
        success: false,
        error: createError("already_registered", "This authenticator is already registered")
      };
    }
    return {
      success: false,
      error: createError("unknown", error.message || "Unknown error adding passkey")
    };
  }
}

// src/app.ts
var unauthorizedForm = document.getElementById("unauthorized-form");
var authorizedForm = document.getElementById("authorized-form");
var unauthorizedResult = document.getElementById("unauthorized-result");
var authorizedResult = document.getElementById("authorized-result");
var usersTableBody = document.getElementById("users-table-body");
var passkeyRegisterForm = document.getElementById("passkey-register-form");
var passkeyLoginForm = document.getElementById("passkey-login-form");
var passkeyEnabledDiv = document.getElementById("passkey-enabled");
var passkeyDisabledDiv = document.getElementById("passkey-disabled");
var user = window.user;
var isAuthenticated = !!user?.userId;
function updateUsersTable() {
  listPasskeyUsers().then((response) => {
    if (response.status === 200) {
      usersTableBody.innerHTML = "";
      for (const user2 of response.response) {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${user2.userId}</td>
                    <td>${user2.username}</td>
                    <td>${user2.pass}</td>
                    <td>${user2.email}</td>
                    <td>${user2.passkeyEnabled}</td>
                `;
        usersTableBody.appendChild(row);
      }
    } else {
      unauthorizedResult.innerHTML = `
            <p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>`;
    }
  });
}
function showAuthorizedForm() {
  isAuthenticated = true;
  unauthorizedForm.style.display = "none";
  authorizedForm.style.display = "block";
  authorizedForm.querySelector("h2").textContent = `Logged in as ${user.username}`;
  passkeyEnabledDiv.style.display = "none";
  passkeyDisabledDiv.style.display = "none";
  isPasskeyEnabled({}).then((response) => {
    if (response.status === 200) {
      if (response.response === true) {
        passkeyEnabledDiv.style.display = "block";
      } else {
        passkeyDisabledDiv.style.display = "block";
      }
    } else {
      authorizedResult.innerHTML = `
            <p style="color: red;">Status: ${response.status}</p>
            <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>`;
    }
  });
}
function showUnauthorizedForm() {
  isAuthenticated = false;
  authorizedForm.style.display = "none";
  unauthorizedForm.style.display = "block";
  passkeyRegisterForm.style.display = "none";
  updateUsersTable();
}
document.getElementById("toggle-register-passkey-btn").addEventListener("click", () => {
  let isHidden = passkeyRegisterForm.style.display === "none";
  passkeyRegisterForm.style.display = isHidden ? "block" : "none";
  isHidden = !isHidden;
  if (!isHidden) {
    getDeviceName().then((name) => {
      document.getElementById("passkey-device").value = name;
    });
  }
});
document.getElementById("whoami-btn").addEventListener("click", async () => {
  const response = await whoAmI({});
  if (response.status === 200 && response.response.length > 0) {
    const user2 = response.response[0];
    authorizedResult.innerHTML = `
        <p><strong>User ID:</strong> ${user2.userId}</p>
        <p><strong>Username:</strong> ${user2.username}</p>
        <p><strong>Email:</strong> ${user2.email}</p>
        `;
  } else {
    authorizedResult.innerHTML = `
        <p style="color: red;">Status: ${response.status}</p>
        <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>
        `;
  }
});
document.getElementById("logout-btn").addEventListener("click", async () => {
  const response = await logout();
  if (response.status === 200) {
    showUnauthorizedForm();
  } else {
    authorizedResult.innerHTML = `
        <p style="color: red;">Status: ${response.status}</p>
        <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>`;
  }
});
document.getElementById("login-btn").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const response = await login({ username, password });
  if (response.status === 200) {
    user = JSON.parse(response.response);
    showAuthorizedForm();
  } else {
    unauthorizedResult.innerHTML = `
        <p style="color: red;">Status: ${response.status}</p>
        <p style="color: red;">Error response: ${JSON.stringify(response.error)}</p>`;
  }
});
document.getElementById("register-passkey-btn").addEventListener("click", async () => {
  const username = document.getElementById("passkey-username").value;
  const displayName = document.getElementById("passkey-display").value;
  const email = document.getElementById("passkey-email").value;
  const device = document.getElementById("passkey-device").value;
  if (!username || !displayName || !email || !device) {
    unauthorizedResult.innerHTML = `<p style="color: red;">Please fill in all fields (username, email, and device name).</p>`;
    return;
  }
  unauthorizedResult.innerHTML = '<p style="color: blue;">Registering passkey, please wait...</p>';
  const result = await register({
    userName: username,
    displayName,
    deviceName: device,
    email
  }, getAnalytics_default());
  if (result.success) {
    unauthorizedResult.innerHTML = `<p style="color: green;">Passkey registered successfully! CredentialId: ${result.credentialId}</p>`;
    updateUsersTable();
  } else {
    unauthorizedResult.innerHTML = `
            <p style="color: red;">Error Code: ${result.error?.code}</p>
            <p style="color: red;">Error Message: ${JSON.stringify(result.error?.message)}</p>`;
  }
});
document.getElementById("login-passkey-btn").addEventListener("click", async () => {
  if (await isConditionalMediationAvailable()) {
    const result = await login2({}, getAnalytics_default());
    if (result.success) {
      user = JSON.parse(result.response);
      showAuthorizedForm();
    } else {
      unauthorizedResult.innerHTML = `
            <p style="color: red;">Error Code: ${result.error?.code}</p>
            <p style="color: red;">Error Message: ${JSON.stringify(result.error?.message)}</p>`;
    }
  } else {
    passkeyLoginForm.style.display = "block";
  }
});
document.getElementById("login-username-passkey-btn").addEventListener("click", async () => {
  const userName = document.getElementById("passkey-login-username").value;
  if (!userName) {
    unauthorizedResult.innerHTML = `<p style="color: red;">Please enter a username.</p>`;
    return;
  }
  const result = await login2({ userName }, getAnalytics_default());
  if (result.success) {
    user = JSON.parse(result.response);
    passkeyLoginForm.style.display = "none";
    showAuthorizedForm();
  } else {
    unauthorizedResult.innerHTML = `
            <p style="color: red;">Error Code: ${result.error?.code}</p>
            <p style="color: red;">Error Message: ${JSON.stringify(result.error?.message)}</p>`;
  }
});
document.getElementById("add-passkey-btn").addEventListener("click", async () => {
  getDeviceName().then((deviceName) => {
    addPasskey({ deviceName }, getAnalytics_default()).then((result) => {
      if (result.success) {
        authorizedResult.innerHTML = `<p style="color: green;">Passkey added successfully! CredentialId: ${result.credentialId}</p>`;
        showAuthorizedForm();
      } else {
        authorizedResult.innerHTML = `
                <p style="color: red;">Error Code: ${result.error?.code}</p>
                <p style="color: red;">Error Message: ${JSON.stringify(result.error?.message)}</p>`;
      }
    });
  });
});
if (isAuthenticated) {
  showAuthorizedForm();
} else {
  showUnauthorizedForm();
}
