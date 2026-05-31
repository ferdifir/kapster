import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "@kapster/content-researcher", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "web_search",
      description: "Search the web for a given query. Returns up to 10 results with title, URL, and snippet.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          num_results: { type: "number", description: "Number of results (max 10)", default: 5 },
        },
        required: ["query"],
      },
    },
    {
      name: "fetch_page",
      description: "Fetch and extract readable text content from a URL.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to fetch" },
        },
        required: ["url"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "web_search") {
    const query = String(args?.query ?? "");
    const numResults = Math.min(Number(args?.num_results ?? 5), 10);
    const results = await webSearch(query, numResults);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }

  if (name === "fetch_page") {
    const url = String(args?.url ?? "");
    const content = await fetchPageContent(url);
    return { content: [{ type: "text", text: content }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function webSearch(query: string, numResults: number) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KapsterBot/1.0; +https://kapster.my.id)",
    },
  });

  const html = await res.text();
  const results: Array<{ title: string; url: string; snippet: string }> = [];

  const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]*)">([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < numResults) {
    results.push({
      url: match[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, "").replace(/&rut=.*$/, ""),
      title: match[2].replace(/<[^>]*>/g, "").trim(),
      snippet: match[3].replace(/<[^>]*>/g, "").trim(),
    });
  }

  if (results.length === 0) {
    const fallbackRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = fallbackRegex.exec(html)) !== null && results.length < numResults) {
      results.push({
        url: match[1],
        title: match[2].replace(/<[^>]*>/g, "").trim(),
        snippet: "",
      });
    }
  }

  return results;
}

async function fetchPageContent(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KapsterBot/1.0; +https://kapster.my.id)",
    },
  });

  const html = await res.text();

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyText = bodyMatch ? bodyMatch[1] : html;

  bodyText = bodyText
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  const lines = bodyText.split(/(?<=[.!?])\s+/).filter(l => l.trim().length > 30);
  const content = lines.slice(0, 100).join("\n");

  return `Title: ${title}\n\nContent:\n${content}`;
}

const transport = new StdioServerTransport();
await server.connect(transport);
