//
// The Acme Store demo page. Two panels, one PostgreSQL source:
//
//  LEFT  — a storefront built on the GENERATED, typed REST client (./sqlApi.ts). It imports
//          searchProducts/getProduct/placeOrder/cancelOrder/listCategories/productCount as functions —
//          NpgsqlRest generated that file from the same .sql files, so the UI is fully typed and never
//          hand-writes a URL.
//  RIGHT — a live MCP client speaking JSON-RPC to /mcp (initialize → tools/list → tools/call): exactly
//          what an AI agent does. Tool call-forms are built from each tool's advertised inputSchema.
//
// Same routines, two interfaces.
//

import {
    searchProducts, placeOrder, cancelOrder, listCategories, productCount,
    type ISearchProductsResponse, type IPlaceOrderResponse,
} from "./sqlApi";

const el = (tag: string, props: Record<string, any> = {}, ...children: (Node | string)[]) => {
    const node = Object.assign(document.createElement(tag), props);
    for (const c of children) node.append(c);
    return node;
};
const money = (n: number | null) => `$${(n ?? 0).toFixed(2)}`;

// Staff auth state (the Authorization demo). Null until a successful POST /api/login.
let token: string | null = null;
let refreshStore: (() => Promise<void>) | null = null;

// ── LEFT: storefront on the generated typed REST client ────────────────────────────────────────────
async function storefront() {
    const root = document.getElementById("storefront")!;

    const search = el("input", { type: "search", placeholder: "Search products…" }) as HTMLInputElement;
    const maxPrice = el("input", { type: "number", placeholder: "Max $", step: "any", style: "width:80px" }) as HTMLInputElement;
    const category = el("select") as HTMLSelectElement;
    category.append(el("option", { value: "", textContent: "All categories" }));
    const grid = el("div", { className: "grid" });
    const ordersBox = el("div", { className: "orders" });

    root.append(
        el("div", { className: "controls" }, search, maxPrice, category),
        grid,
        ordersBox,
    );

    // Populate the category dropdown — listCategories() returns ApiResult<string[]>.
    const cats = await listCategories();
    for (const c of cats.response ?? []) category.append(el("option", { value: c, textContent: c }));

    async function render() {
        grid.replaceChildren(el("p", { className: "muted", textContent: "Loading…" }));
        const res = await searchProducts({
            query: search.value.trim() || category.value || null,
            maxPrice: maxPrice.value ? Number(maxPrice.value) : null,
        });
        const products = res.response ?? [];
        grid.replaceChildren();
        if (products.length === 0) {
            grid.append(el("p", { className: "muted", textContent: "No products match." }));
            return;
        }
        for (const p of products) grid.append(productCard(p));
    }

    function productCard(p: ISearchProductsResponse): HTMLElement {
        const buy = el("button", { textContent: "Buy", disabled: (p.stock ?? 0) <= 0 }) as HTMLButtonElement;
        buy.addEventListener("click", async () => {
            buy.disabled = true; buy.textContent = "…";
            const res = await placeOrder({ productId: p.id, quantity: 1 });
            if (res.error) { buy.textContent = res.error.title?.slice(0, 24) ?? "error"; return; }
            addOrder(res.response);
            await render(); // stock changed
        });
        return el("div", { className: "card" },
            el("span", { className: "name", textContent: p.name ?? "" }),
            el("span", { className: "meta", textContent: p.category ?? "" }),
            el("span", { className: "price" }, money(p.price),
                el("span", {
                    className: (p.stock ?? 0) <= 3 ? "meta stock-low" : "meta",
                    textContent: `  ·  ${p.stock} in stock`,
                })),
            buy,
        );
    }

    const orderList = el("div");
    ordersBox.append(el("h3", { textContent: "Your orders" }), orderList);
    const emptyNote = el("p", { className: "muted", textContent: "No orders yet." });
    orderList.append(emptyNote);

    function addOrder(o: IPlaceOrderResponse) {
        emptyNote.remove();
        const row = el("div", { className: "order" });
        const cancel = el("button", { textContent: "cancel" }) as HTMLButtonElement;
        cancel.addEventListener("click", async () => {
            cancel.disabled = true;
            await cancelOrder({ orderId: o.orderId });
            row.classList.add("cancelled");
            cancel.remove();
            await render(); // stock restored
        });
        row.append(
            el("span", { className: "grow", textContent: `#${o.orderId} · ${o.product} ×${o.quantity}` }),
            el("span", { textContent: money(o.total) }),
            cancel,
        );
        orderList.prepend(row);
    }

    search.addEventListener("input", debounce(render, 250));
    maxPrice.addEventListener("input", debounce(render, 250));
    category.addEventListener("change", render);
    refreshStore = render;
    authBar(root);
    await render();
}

// ── Staff auth: log in for a JWT, then exercise the manager-only restock tool ─────────────────────
// All raw fetch (no generated client) so the bearer-header handling is explicit. The token shown here
// is the same one you paste into MCP Inspector (Authentication → Bearer) to call restock_product there.
function authBar(root: HTMLElement) {
    const user = el("input", { placeholder: "manager / clerk" }) as HTMLInputElement;
    const pass = el("input", { type: "password", placeholder: "password" }) as HTMLInputElement;
    const loginBtn = el("button", { textContent: "Log in", type: "button" }) as HTMLButtonElement;
    const status = el("span", { className: "muted" });

    const tokenText = el("code", { className: "token" });
    const copyBtn = el("button", { textContent: "Copy", type: "button" }) as HTMLButtonElement;
    const tokenRow = el("div", { className: "token-row", style: "display:none" },
        el("span", { className: "muted", textContent: "JWT (paste into MCP Inspector → Authentication): " }),
        tokenText, copyBtn);

    const pid = el("input", { type: "number", placeholder: "product id", style: "width:90px" }) as HTMLInputElement;
    const newStock = el("input", { type: "number", placeholder: "new stock", style: "width:90px" }) as HTMLInputElement;
    const restockBtn = el("button", { textContent: "Restock", type: "button" }) as HTMLButtonElement;
    const restockOut = el("span", { className: "muted" });
    const restockRow = el("div", { className: "controls", style: "display:none" }, pid, newStock, restockBtn, restockOut);

    loginBtn.addEventListener("click", async () => {
        status.textContent = "…";
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user.value, password: pass.value }),
        });
        if (!res.ok) {
            token = null; tokenRow.style.display = "none"; restockRow.style.display = "none";
            status.textContent = `login failed (${res.status})`;
            return;
        }
        token = (await res.json()).accessToken;
        tokenText.textContent = token!;
        tokenRow.style.display = "";
        restockRow.style.display = "flex";
        status.textContent = `signed in as ${user.value}`;
    });

    copyBtn.addEventListener("click", async () => {
        if (!token) return;
        await navigator.clipboard.writeText(token);
        copyBtn.textContent = "Copied"; setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
    });

    restockBtn.addEventListener("click", async () => {
        restockOut.textContent = "…";
        const res = await fetch("/api/restock-product", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ productId: Number(pid.value), newStock: Number(newStock.value) }),
        });
        if (res.status === 401) { restockOut.textContent = "401 — not authenticated"; return; }
        if (res.status === 403) { restockOut.textContent = "403 — needs the 'manager' role"; return; }
        if (!res.ok) { restockOut.textContent = `error ${res.status}`; return; }
        const p = await res.json();
        restockOut.textContent = `✓ ${p.name} stock → ${p.stock}`;
        await refreshStore?.();
    });

    root.prepend(el("details", { className: "auth", open: false },
        el("summary", { textContent: "🔐 Staff login (Authorization demo)" }),
        el("div", { className: "controls" }, user, pass, loginBtn, status),
        tokenRow,
        restockRow,
    ));
}

function debounce(fn: () => void, ms: number) {
    let t: ReturnType<typeof setTimeout>;
    return () => { clearTimeout(t); t = setTimeout(fn, ms); };
}

// ── RIGHT: live MCP client over JSON-RPC to /mcp ────────────────────────────────────────────────────
let rpcId = 1;
async function rpc(method: string, params: Record<string, unknown> = {}): Promise<any> {
    const res = await fetch("/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "MCP-Protocol-Version": "2025-11-25" },
        body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method, params }),
    });
    if (res.status === 202) return {};
    return res.json();
}

function isNumberType(t?: string | string[]): boolean {
    const v = Array.isArray(t) ? t[0] : t;
    return v === "integer" || v === "number";
}

function renderTool(tool: any): HTMLElement {
    const props: Record<string, any> = tool.inputSchema?.properties ?? {};
    const required = new Set<string>(tool.inputSchema?.required ?? []);
    const hints: string[] = [];
    if (tool.annotations?.readOnlyHint) hints.push("read-only");
    if (tool.annotations?.destructiveHint) hints.push("destructive");

    const form = el("form", { className: "args" }) as HTMLFormElement;
    const inputs: Record<string, HTMLInputElement> = {};
    for (const [name, schema] of Object.entries(props)) {
        const input = el("input", { name, placeholder: required.has(name) ? `${name} (required)` : name }) as HTMLInputElement;
        input.type = isNumberType((schema as any).type) ? "number" : "text";
        if (input.type === "number") input.step = "any";
        inputs[name] = input;
        form.append(el("label", {}, name, input));
    }

    const output = el("pre", { className: "output" });
    const call = async (e: Event) => {
        e.preventDefault();
        const args: Record<string, unknown> = {};
        for (const [name, input] of Object.entries(inputs)) {
            const raw = input.value.trim();
            if (raw !== "") args[name] = input.type === "number" ? Number(raw) : raw;
        }
        output.textContent = "Calling…";
        const { result, error } = await rpc("tools/call", { name: tool.name, arguments: args });
        if (error) { output.className = "output err"; output.textContent = `JSON-RPC ${error.code}: ${error.message}`; return; }
        output.className = result?.isError ? "output err" : "output";
        output.textContent = JSON.stringify(result?.structuredContent ?? result, null, 2);
    };
    const button = el("button", { textContent: "Call" });
    button.addEventListener("click", call);
    form.addEventListener("submit", call);

    return el("div", { className: "tool" },
        el("div", { className: "tool-head" },
            el("span", { className: "tool-name", textContent: tool.name }),
            ...hints.map(h => el("span", { className: `hint ${h}`, textContent: h })),
        ),
        el("p", { className: "tool-desc", textContent: tool.description ?? "" }),
        form, button, output,
    );
}

async function mcpPanel(): Promise<string> {
    const root = document.getElementById("mcp")!;
    const init = await rpc("initialize", {});
    if (init.error) { root.append(el("p", { className: "output err", textContent: init.error.message })); return "MCP error"; }
    if (init.result?.instructions) root.append(el("blockquote", { className: "instructions", textContent: init.result.instructions }));

    const list = await rpc("tools/list", {});
    const tools: any[] = list.result?.tools ?? [];
    for (const tool of tools) root.append(renderTool(tool));
    const info = init.result?.serverInfo;
    return `${info?.name} v${info?.version} · MCP ${init.result?.protocolVersion} · ${tools.length} tools`;
}

// ── boot both panels ────────────────────────────────────────────────────────────────────────────────
const status = document.getElementById("status")!;
Promise.all([storefront(), mcpPanel()])
    .then(([, mcpStatus]) => { status.textContent = `Connected — ${mcpStatus}`; })
    .catch((e) => { status.textContent = `Error: ${e.message}`; });
