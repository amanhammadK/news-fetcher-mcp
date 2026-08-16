# News Fetcher MCP

A Model Context Protocol server that pulls live news from [NewsAPI.org](https://newsapi.org) — top headlines, keyword search, and source discovery.

## Why this exists

Agents that summarize "what's happening in AI today" need a real news source. This server wraps NewsAPI with clean result shaping so the agent gets consistent article objects, not raw API soup.

## Install

```bash
npm install
```

## Configure

```env
NEWSAPI_KEY=your_newsapi_key
PORT=8080
```

Get a free key at `https://newsapi.org/register`.

## Run

```bash
npm run build
npm start
```

SSE endpoint: `http://localhost:8080/sse`.

## Tools

| Tool | Purpose |
|------|---------|
| `top_headlines` | Headlines by country/category |
| `search_news` | Everything endpoint with date filters |
| `list_sources` | Browse available publishers |

## Example

```json
{
  "tool": "search_news",
  "arguments": { "query": "large language models", "sortBy": "publishedAt", "pageSize": 5 }
}
```

## Notes

- Free NewsAPI keys are limited to non-production use.
- Each article is normalized to `{ title, description, url, source, publishedAt, author }`.
