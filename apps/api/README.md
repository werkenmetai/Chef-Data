# REST API

REST API for Exact Online MCP dashboard and AI agents.

## Status

**Not yet implemented** - This is a placeholder.

## Planned Endpoints

- `GET /health` - Health check
- `GET /customers` - List customers (admin)
- `GET /customers/:id` - Get customer details
- `GET /metrics` - Usage metrics
- `POST /webhooks/sentry` - Sentry webhook handler
- `POST /webhooks/linear` - Linear webhook handler

## Tech Stack (Planned)

- Cloudflare Workers
- Hono (web framework)
- TypeScript

## Development

```bash
pnpm --filter @exact-mcp/api dev
```
