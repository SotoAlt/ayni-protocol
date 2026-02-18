#!/usr/bin/env node

/**
 * Ayni Protocol MCP Server — Streamable HTTP transport
 *
 * Exposes the same 22 MCP tools as the stdio server, but over HTTP.
 * Smithery and other HTTP-based MCP clients can connect to this.
 *
 * Usage:
 *   MCP_HTTP_PORT=3001 AYNI_SERVER_URL=https://ay-ni.org node dist/http-server.js
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server.js';

const PORT = parseInt(process.env.MCP_HTTP_PORT || '3001', 10);

// Map of session ID → transport (for stateful mode)
const sessions = new Map<string, StreamableHTTPServerTransport>();

function handleMcpRequest(req: IncomingMessage, res: ServerResponse): void {
  // Collect body for POST
  if (req.method === 'POST') {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        let transport: StreamableHTTPServerTransport;

        if (sessionId && sessions.has(sessionId)) {
          transport = sessions.get(sessionId)!;
        } else {
          // New session — create transport and connect a new MCP server
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
          });

          const server = createMcpServer();
          await server.connect(transport);

          // Store session after connect (sessionId is set after first request)
          transport.onclose = () => {
            if (transport.sessionId) sessions.delete(transport.sessionId);
          };

          // We need to handle the request first, then store the session
          await transport.handleRequest(req, res, body);

          if (transport.sessionId) {
            sessions.set(transport.sessionId, transport);
          }
          return;
        }

        await transport.handleRequest(req, res, body);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else if (req.method === 'GET') {
    // SSE stream for server-initiated messages
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (sessionId && sessions.has(sessionId)) {
      const transport = sessions.get(sessionId)!;
      transport.handleRequest(req, res);
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing or invalid session ID' }));
    }
  } else if (req.method === 'DELETE') {
    // Close session
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (sessionId && sessions.has(sessionId)) {
      const transport = sessions.get(sessionId)!;
      transport.close();
      sessions.delete(sessionId);
    }
    res.writeHead(200);
    res.end();
  } else if (req.method === 'OPTIONS') {
    // CORS preflight
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id',
    });
    res.end();
  } else {
    res.writeHead(405);
    res.end();
  }
}

const httpServer = createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (url.pathname === '/mcp') {
    handleMcpRequest(req, res);
  } else if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', transport: 'streamable-http', sessions: sessions.size }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Use /mcp for MCP protocol.' }));
  }
});

httpServer.listen(PORT, () => {
  console.error(`Ayni MCP HTTP server listening on port ${PORT}`);
  console.error(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
