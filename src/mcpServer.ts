import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { topHeadlines, searchNews, listSources, generateSummary } from "./tools/news.js";

export const server = new Server(
  { name: "news-fetcher-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "top_headlines",
      description: "Get top news headlines by country/category with relevance scoring, sentiment analysis, and topic extraction",
      inputSchema: {
        type: "object",
        properties: {
          country: { type: "string", default: "us" },
          category: { type: "string", enum: ["business","entertainment","general","health","science","sports","technology"] },
          pageSize: { type: "number", default: 10 },
        },
      },
    },
    {
      name: "search_news",
      description: "Search news articles by keyword with relevance scoring, sentiment analysis, and deduplication",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          from: { type: "string" },
          to: { type: "string" },
          pageSize: { type: "number", default: 10 },
          sortBy: { type: "string", enum: ["relevancy","popularity","publishedAt"] },
        },
        required: ["query"],
      },
    },
    {
      name: "list_sources",
      description: "List available news sources",
      inputSchema: {
        type: "object",
        properties: {
          category: { type: "string" },
          language: { type: "string", default: "en" },
        },
      },
    },
    {
      name: "generate_summary",
      description: "Generate a bullet-point summary of top stories with sentiment breakdown and topic distribution from a set of articles",
      inputSchema: {
        type: "object",
        properties: {
          articles: { type: "array", description: "Array of article objects to summarize" },
        },
        required: ["articles"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  switch (name) {
    case "top_headlines":
      return { content: [{ type: "text", text: JSON.stringify(await topHeadlines(args.country, args.category, args.pageSize), null, 2) }] };
    case "search_news":
      return { content: [{ type: "text", text: JSON.stringify(await searchNews(args.query, args.from, args.to, args.pageSize, args.sortBy), null, 2) }] };
    case "list_sources":
      return { content: [{ type: "text", text: JSON.stringify(await listSources(args.category, args.language), null, 2) }] };
    case "generate_summary":
      return { content: [{ type: "text", text: JSON.stringify(await generateSummary(args.articles), null, 2) }] };
    default:
      throw new Error("Unknown tool");
  }
});
