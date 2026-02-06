# MCP Tools

**Bron:** https://modelcontextprotocol.io/specification/2025-11-25/server/tools
**Datum:** 2026-01-28
**Gescraped door:** Claude Browser Extension

---

The Model Context Protocol (MCP) allows servers to expose tools that can be invoked by language models. Tools enable models to interact with external systems, such as querying databases, calling APIs, or performing computations.

## Capabilities

```json
{
  "capabilities": {
    "tools": {
      "listChanged": true
    }
  }
}
```

## Protocol Messages

### Listing Tools

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "cursor": "optional-cursor-value"
  }
}
```

### Calling Tools

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "location": "New York"
    }
  }
}
```

## Tool Definition

A tool definition includes:

- **name**: Unique identifier for the tool
- **title**: Optional human-readable name
- **description**: Human-readable description of functionality
- **inputSchema**: JSON Schema defining expected parameters
- **outputSchema**: Optional JSON Schema defining expected output structure
- **annotations**: Optional properties describing tool behavior

## Tool Result Content Types

### Text Content

```json
{
  "type": "text",
  "text": "Tool result text"
}
```

### Image Content

```json
{
  "type": "image",
  "data": "base64-encoded-data",
  "mimeType": "image/png"
}
```

### Resource Links

```json
{
  "type": "resource_link",
  "uri": "file:///project/src/main.rs",
  "name": "main.rs",
  "mimeType": "text/x-rust"
}
```

## Security Considerations

**Servers MUST:**
- Validate all tool inputs
- Implement proper access controls
- Rate limit tool invocations
- Sanitize tool outputs

**Clients SHOULD:**
- Prompt for user confirmation on sensitive operations
- Show tool inputs to the user before calling
- Validate tool results before passing to LLM
- Implement timeouts for tool calls
