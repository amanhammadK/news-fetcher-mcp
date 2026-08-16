import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const server = new Server({ name: 'News Fetcher Mcp', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'execute_task', description: 'Fetch real data for News Fetcher Mcp', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
    try {
        
        const response = await fetch(`https://hacker-news.firebaseio.com/v0/topstories.json`);
        const ids = await response.json();
        const top5 = await Promise.all(ids.slice(0, 5).map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())));
        return { content: [{ type: 'text', text: JSON.stringify(top5, null, 2) }] };
        
    } catch (e) {
        return { content: [{ type: 'text', text: 'Error executing tool: ' + e.message }] };
    }
});

async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('News Fetcher Mcp running on stdio');
}
run().catch(console.error);