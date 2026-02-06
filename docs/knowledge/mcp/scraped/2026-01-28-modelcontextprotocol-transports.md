# MCP Transports

**Bron:** https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
**Datum:** 2026-01-28
**Gescraped door:** Claude Browser Extension

---

MCP uses JSON-RPC to encode messages. JSON-RPC messages MUST be UTF-8 encoded.

## Transport Mechanisms

### stdio

In the stdio transport:

- The client launches the MCP server as a subprocess
- The server reads JSON-RPC messages from stdin and sends messages to stdout
- Messages are delimited by newlines, and MUST NOT contain embedded newlines

### Streamable HTTP

This replaces the HTTP+SSE transport from protocol version 2024-11-05.

The server MUST provide a single HTTP endpoint path that supports both POST and GET methods.

## Security Warning

When implementing Streamable HTTP transport:

- Servers MUST validate the Origin header on all incoming connections to prevent DNS rebinding attacks
- When running locally, servers SHOULD bind only to localhost (127.0.0.1)
- Servers SHOULD implement proper authentication for all connections

## Sending Messages

- Every JSON-RPC message sent from the client MUST be a new HTTP POST request
- The client MUST include an Accept header, listing both application/json and text/event-stream

## Session Management

- A server using Streamable HTTP transport MAY assign a session ID at initialization time via MCP-Session-Id header
- The session ID MUST be globally unique and cryptographically secure
- Clients MUST include the session ID in all subsequent HTTP requests
