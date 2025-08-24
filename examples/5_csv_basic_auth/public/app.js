// src/example5PublicApi.ts
var baseUrl = "http://127.0.0.1:8080";
var parseQuery = (query) => "?" + Object.keys(query ? query : {}).map((key) => {
  const value = query[key] != null ? query[key] : "";
  if (Array.isArray(value)) {
    return value.map((s) => s ? `${key}=${encodeURIComponent(s)}` : `${key}=`).join("&");
  }
  return `${key}=${encodeURIComponent(value)}`;
}).join("&");
async function salesReport(request) {
  const response = await fetch(baseUrl + "/api/example-5-public/sales-report" + parseQuery(request), {
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
var downloadBtn = document.getElementById("downloadBtn");
var result = document.getElementById("result");
downloadBtn.addEventListener("click", async () => {
  const { status, response, error } = await salesReport({});
  if (error) {
    result.textContent = `Error: ${status} ${error.title}${error.detail ? ` - ${error.detail}` : ""}`;
    return;
  }
  if (response && response.length > 0) {
    const headers = Object.keys(response[0]).join(",");
    const rows = response.map((row) => Object.values(row).map((v) => v ?? "").join(",")).join(`
`);
    const csvText = headers + `
` + rows;
    result.textContent = `CSV Content:

` + csvText;
    const blob = new Blob([csvText], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  } else {
    result.textContent = "No data returned";
  }
});
