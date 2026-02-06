# MCP Test Scenarios

**Beheerder:** Ruben (MCP Specialist)

Dit document bevat bekende edge cases en test scenarios om MCP problemen te herkennen en op te lossen.

---

## Scenario 1: OAuth "Invalid authorization" error

### Symptomen
- Client krijgt 401 Unauthorized
- WWW-Authenticate header aanwezig
- Error: "Invalid authorization"

### Checklist
1. [ ] Heeft WWW-Authenticate header `resource_metadata` parameter?
2. [ ] Is `/.well-known/oauth-protected-resource` bereikbaar?
3. [ ] Bevat Protected Resource Metadata `scopes_supported`?
4. [ ] Is de Bearer token geldig en niet expired?

### Verwachte WWW-Authenticate header
```
Bearer realm="https://example.com", resource="https://example.com", resource_metadata="https://example.com/.well-known/oauth-protected-resource"
```

### Verwachte Protected Resource Metadata
```json
{
  "resource": "https://example.com",
  "authorization_servers": ["https://example.com"],
  "scopes_supported": ["mcp:tools", "mcp:resources"],
  "bearer_methods_supported": ["header"]
}
```

---

## Scenario 2: CORS errors in browser

### Symptomen
- Browser console: "CORS policy: No 'Access-Control-Allow-Origin'"
- Requests werken in curl/Postman maar niet in browser

### Checklist
1. [ ] Is Origin header gevalideerd tegen whitelist?
2. [ ] Worden CORS headers dynamisch gegenereerd (niet statisch)?
3. [ ] Is preflight (OPTIONS) correct afgehandeld?
4. [ ] Staan credentials correct geconfigureerd?

### Verwachte CORS headers
```
Access-Control-Allow-Origin: https://allowed-origin.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, MCP-Session-Id
Access-Control-Allow-Credentials: true
```

---

## Scenario 3: Session management issues

### Symptomen
- "Session not found" errors
- Requests werken eerst, dan niet meer
- Inconsistent gedrag tussen requests

### Checklist
1. [ ] Wordt MCP-Session-Id header meegestuurd?
2. [ ] Is session ID cryptografisch secure?
3. [ ] Wordt session correct opgeslagen (KV/database)?
4. [ ] Is session timeout correct geconfigureerd?

### Test
```bash
# Check session header in response
curl -v POST https://example.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
# Look for: MCP-Session-Id header in response
```

---

## Scenario 4: Tool invocation fails

### Symptomen
- tools/call returns error
- Tool lijkt niet te bestaan
- Parameters worden niet herkend

### Checklist
1. [ ] Is tool geregistreerd in tools/list response?
2. [ ] Matcht inputSchema met aangeleverde arguments?
3. [ ] Zijn required parameters aanwezig?
4. [ ] Is tool capability gedeclareerd bij initialize?

### Test
```json
// First: list available tools
{"jsonrpc":"2.0","id":1,"method":"tools/list"}

// Then: call with correct parameters
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"tool_name","arguments":{}}}
```

---

## Scenario 5: Initialization handshake fails

### Symptomen
- Client kan geen verbinding maken
- "Protocol version mismatch"
- Capabilities niet beschikbaar

### Checklist
1. [ ] Stuurt client correcte protocolVersion?
2. [ ] Zijn server capabilities correct gedeclareerd?
3. [ ] Stuurt client `initialized` notification na init response?
4. [ ] Is JSON-RPC format correct (jsonrpc: "2.0")?

### Correcte handshake
```
Client -> Server: initialize request
Server -> Client: initialize response (with capabilities)
Client -> Server: notifications/initialized
-- Session is now active --
```

---

## Scenario 6: DNS Rebinding attack warning

### Symptomen
- Security scanner waarschuwt voor DNS rebinding
- Server accepteert requests van onverwachte origins

### Checklist
1. [ ] Wordt Origin header gevalideerd?
2. [ ] Bindt lokale server alleen aan 127.0.0.1?
3. [ ] Zijn alleen bekende origins toegestaan?

### Test
```bash
# Should be rejected if Origin doesn't match
curl -X POST http://localhost:3000/mcp \
  -H "Origin: http://evil.com" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Quick Diagnosis Commands

```bash
# Check OAuth metadata endpoint
curl https://example.com/.well-known/oauth-protected-resource

# Check authorization server metadata
curl https://example.com/.well-known/oauth-authorization-server

# Test MCP endpoint
curl -X POST https://example.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```
