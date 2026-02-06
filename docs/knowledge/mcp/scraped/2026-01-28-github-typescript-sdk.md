# MCP TypeScript SDK

**Bron:** https://github.com/modelcontextprotocol/typescript-sdk
**Datum:** 2026-01-28
**Gescraped door:** Claude Browser Extension

---

> **IMPORTANT**: This is the main branch which contains v2 of the SDK (currently in development, pre-alpha). We anticipate a stable v2 release in Q1 2026. Until then, v1.x remains the recommended version for production use.

## Overview

The Model Context Protocol (MCP) allows applications to provide context for LLMs in a standardized way. This repository contains the TypeScript SDK implementation.

The SDK ships:

- MCP server libraries (tools/resources/prompts, Streamable HTTP, stdio, auth helpers)
- MCP client libraries (transports, high-level helpers, OAuth helpers)
- Optional middleware packages for specific runtimes/frameworks (Express, Hono, Node.js HTTP)
- Runnable examples

## Packages

### Core Packages

- `@modelcontextprotocol/server`: build MCP servers
- `@modelcontextprotocol/client`: build MCP clients

Both packages have a required peer dependency on `zod` for schema validation.

### Middleware Packages (optional)

- `@modelcontextprotocol/node`: Node.js Streamable HTTP transport wrapper
- `@modelcontextprotocol/express`: Express helpers
- `@modelcontextprotocol/hono`: Hono helpers

## Installation

### Server

```bash
npm install @modelcontextprotocol/server zod
```

### Client

```bash
npm install @modelcontextprotocol/client zod
```

### Optional Middleware

```bash
npm install @modelcontextprotocol/node
npm install @modelcontextprotocol/express express
npm install @modelcontextprotocol/hono hono
```

## Documentation

- `docs/server.md` – building MCP servers, transports, tools/resources/prompts, CORS, DNS rebinding, and deployment patterns
- `docs/client.md` – using the high-level client, transports, backwards compatibility, and OAuth helpers
- `docs/capabilities.md` – sampling, elicitation, and experimental task-based execution
- `docs/faq.md` – environment and troubleshooting FAQs
