import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "./mcpServer.js";

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

let transport: SSEServerTransport;

app.get("/sse", async (_, res) => {
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

app.post("/message", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  }
});

app.get("/health", (_, res) => {
  res.json({ status: "ok", server: "news-fetcher-mcp", uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(\`news-fetcher-mcp MCP server running on port ${PORT}\`);
});
