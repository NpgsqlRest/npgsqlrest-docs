//
// A real AI agent that drives this MCP server.
//
// Run the server first (see README), then:
//   ANTHROPIC_API_KEY=sk-ant-... bun run agent "find peripherals under $100 and order one"
//
// It does the genuine agent loop: discover the tools over MCP (tools/list), hand them to Claude,
// and for every tool the model decides to call, execute it over MCP (tools/call) and feed the result
// back — until the model is done. This validates the whole pipeline end to end: your @mcp SQL files →
// inputSchema → Claude's tool selection → tools/call → PostgreSQL → result → Claude.
//
// (The Messages API has an `mcp_servers` connector, but Anthropic's servers do the connecting, so it
//  needs a PUBLIC url — a localhost MCP server requires this manual tools/list → tool-use loop.)
//

const MCP_URL = "http://127.0.0.1:8080/mcp";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-8";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
    console.error("Set ANTHROPIC_API_KEY (export ANTHROPIC_API_KEY=sk-ant-...).");
    process.exit(1);
}

const goal = process.argv.slice(2).join(" ").trim() ||
    "Find peripherals under $100, order one of the cheapest, then show me which products are low on stock.";

// --- MCP JSON-RPC over the single /mcp endpoint -----------------------------------------------------
let rpcId = 1;
async function mcp(method: string, params: Record<string, unknown> = {}): Promise<any> {
    const res = await fetch(MCP_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "MCP-Protocol-Version": "2025-11-25" },
        body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method, params }),
    });
    if (res.status === 202) return {}; // notification ack
    const body = await res.json();
    if (body.error) throw new Error(`${body.error.code}: ${body.error.message}`);
    return body.result;
}

// --- Claude Messages API ----------------------------------------------------------------------------
async function claude(system: string, tools: unknown[], messages: unknown[]): Promise<any> {
    const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-api-key": apiKey!,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: 16000,
            thinking: { type: "adaptive" },
            output_config: { effort: "low" }, // these tools are simple; keep the demo snappy
            system,
            tools,
            messages,
        }),
    });
    const body = await res.json();
    if (body.type === "error") throw new Error(`Anthropic ${body.error?.type}: ${body.error?.message}`);
    return body;
}

// --- Connect + discover -----------------------------------------------------------------------------
let init: any;
try {
    init = await mcp("initialize", {});
} catch (e) {
    console.error(`Could not reach the MCP server at ${MCP_URL}. Is it running? (bun run dev)\n  ${(e as Error).message}`);
    process.exit(1);
}
const { tools: mcpTools } = await mcp("tools/list", {});

// Map MCP tools → Anthropic tools: inputSchema → input_schema. (The server's `instructions` from the
// initialize handshake become the agent's system prompt — so the same guidance an agent reads is used here.)
const tools = mcpTools.map((t: any) => ({ name: t.name, description: t.description, input_schema: t.inputSchema }));
const system = (init.instructions ? init.instructions + "\n\n" : "") +
    "Work autonomously to accomplish the user's goal using the available tools. Don't ask follow-up questions; make reasonable choices and proceed.";

console.log(`\x1b[2m── connected to ${init.serverInfo?.name} v${init.serverInfo?.version} · ${tools.length} tools ──\x1b[0m`);
console.log(`\x1b[1m🧑 ${goal}\x1b[0m`);

// --- Agent loop -------------------------------------------------------------------------------------
const messages: any[] = [{ role: "user", content: goal }];

for (let turn = 0; turn < 25; turn++) {
    const res = await claude(system, tools, messages);
    messages.push({ role: "assistant", content: res.content });

    for (const block of res.content) {
        if (block.type === "text" && block.text.trim()) {
            console.log(`\n\x1b[36m🤖 ${block.text.trim()}\x1b[0m`);
        }
    }

    if (res.stop_reason !== "tool_use") break; // end_turn / refusal / max_tokens → done

    const toolResults: any[] = [];
    for (const block of res.content) {
        if (block.type !== "tool_use") continue;
        const args = JSON.stringify(block.input);
        process.stdout.write(`\n\x1b[33m🔧 ${block.name}(${args})\x1b[0m`);
        try {
            const result = await mcp("tools/call", { name: block.name, arguments: block.input });
            const text = result.content?.[0]?.text ?? JSON.stringify(result.structuredContent ?? result);
            console.log(`\n   \x1b[2m→ ${text}\x1b[0m`);
            toolResults.push({ type: "tool_result", tool_use_id: block.id, content: text, is_error: !!result.isError });
        } catch (e) {
            console.log(`\n   \x1b[31m✗ ${(e as Error).message}\x1b[0m`);
            toolResults.push({ type: "tool_result", tool_use_id: block.id, content: (e as Error).message, is_error: true });
        }
    }
    messages.push({ role: "user", content: toolResults });
}

console.log("\n\x1b[2m── done ──\x1b[0m");
