# MCP Authorization (Draft)

**Bron:** https://modelcontextprotocol.io/specification/draft/basic/authorization
**Datum:** 2026-01-28
**Gescraped door:** Claude Browser Extension

---

The Model Context Protocol provides authorization capabilities at the transport level, enabling MCP clients to make requests to restricted MCP servers on behalf of resource owners.

## Protocol Requirements

- Authorization is OPTIONAL for MCP implementations
- Implementations using HTTP-based transport SHOULD conform to this specification
- Implementations using STDIO transport SHOULD retrieve credentials from the environment

## Standards Compliance

Based on:

- OAuth 2.1 IETF DRAFT
- OAuth 2.0 Authorization Server Metadata (RFC8414)
- OAuth 2.0 Dynamic Client Registration Protocol (RFC7591)
- OAuth 2.0 Protected Resource Metadata (RFC9728)

## Roles

- **Protected MCP server**: OAuth 2.1 resource server
- **MCP client**: OAuth 2.1 client
- **Authorization server**: Issues access tokens

## Client Registration Approaches

1. **Client ID Metadata Documents**: When client and server have no prior relationship (most common)
2. **Pre-registration**: When client and server have an existing relationship
3. **Dynamic Client Registration**: For backwards compatibility

## Token Requirements

- MCP client MUST use the Authorization request header: `Authorization: Bearer <access-token>`
- Authorization MUST be included in every HTTP request
- Access tokens MUST NOT be included in the URI query string
