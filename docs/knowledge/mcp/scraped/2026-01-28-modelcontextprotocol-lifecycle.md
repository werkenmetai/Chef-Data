# MCP Lifecycle

**Bron:** https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
**Datum:** 2026-01-28
**Gescraped door:** Claude Browser Extension

---

## Lifecycle Phases

1. **Initialization**: Capability negotiation and protocol version agreement
2. **Operation**: Normal protocol communication
3. **Shutdown**: Graceful termination of the connection

## Initialization

The initialization phase MUST be the first interaction between client and server. During this phase, the client and server:

- Establish protocol version compatibility
- Exchange and negotiate capabilities
- Share implementation details

### Client Initialize Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {},
      "elicitation": { "form": {}, "url": {} }
    },
    "clientInfo": {
      "name": "ExampleClient",
      "version": "1.0.0"
    }
  }
}
```

### Server Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "logging": {},
      "prompts": { "listChanged": true },
      "resources": { "subscribe": true, "listChanged": true },
      "tools": { "listChanged": true }
    },
    "serverInfo": {
      "name": "ExampleServer",
      "version": "1.0.0"
    }
  }
}
```

## Capability Negotiation

| Category | Capability | Description |
|----------|------------|-------------|
| Client | roots | Ability to provide filesystem roots |
| Client | sampling | Support for LLM sampling requests |
| Client | elicitation | Support for server elicitation requests |
| Server | prompts | Offers prompt templates |
| Server | resources | Provides readable resources |
| Server | tools | Exposes callable tools |
| Server | logging | Emits structured log messages |
| Server | completions | Supports argument autocompletion |
