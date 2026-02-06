# MCP Base Protocol

**Bron:** https://modelcontextprotocol.io/specification/2025-11-25/basic
**Datum:** 2026-01-28
**Gescraped door:** Claude Browser Extension

---

## Protocol Components

- **Base Protocol**: Core JSON-RPC message types
- **Lifecycle Management**: Connection initialization, capability negotiation, and session control
- **Authorization**: Authentication and authorization framework for HTTP-based transports
- **Server Features**: Resources, prompts, and tools exposed by servers
- **Client Features**: Sampling and root directory lists provided by clients
- **Utilities**: Cross-cutting concerns like logging and argument completion

## Messages

All messages between MCP clients and servers MUST follow the JSON-RPC 2.0 specification.

### Requests

```json
{
  "jsonrpc": "2.0",
  "id": "string | number",
  "method": "string",
  "params": {
    "[key: string]": "unknown"
  }
}
```

### Result Responses

```json
{
  "jsonrpc": "2.0",
  "id": "string | number",
  "result": {
    "[key: string]": "unknown"
  }
}
```

### Error Responses

```json
{
  "jsonrpc": "2.0",
  "id": "string | number",
  "error": {
    "code": "number",
    "message": "string",
    "data": "unknown"
  }
}
```

### Notifications

```json
{
  "jsonrpc": "2.0",
  "method": "string",
  "params": {
    "[key: string]": "unknown"
  }
}
```

## JSON Schema Usage

- **Default dialect**: When a schema does not include a $schema field, it defaults to JSON Schema 2020-12
- **Supported dialects**: Implementations MUST support at least 2020-12
