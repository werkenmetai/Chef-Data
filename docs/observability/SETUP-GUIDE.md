# Observability Setup Guide

Stap-voor-stap handleiding voor het opzetten van de monitoring stack.

## Prerequisites

- Cloudflare account met Workers
- Toegang tot `wrangler` CLI
- (Optional) Sentry account
- (Optional) Better Uptime account

---

## Phase 1: Sentry Error Tracking

### 1.1 Sentry Account Setup

1. Ga naar https://sentry.io en maak een account
2. Kies **Team plan** (€26/maand) of **Developer** (gratis, 5k errors)
3. Maak een nieuw project:
   - Platform: **Cloudflare Workers**
   - Project name: `praat-met-je-boekhouding`

### 1.2 Install Sentry SDK

```bash
cd apps/mcp-server
pnpm add @sentry/cloudflare
```

### 1.3 Configure Sentry DSN

```bash
# Set the Sentry DSN as a secret
wrangler secret put SENTRY_DSN --env production
# Paste your DSN when prompted: https://xxx@xxx.ingest.sentry.io/xxx
```

### 1.4 Verify Installation

Deploy en genereer een test error:

```bash
pnpm run deploy:production

# Check Sentry dashboard voor errors
```

---

## Phase 2: Better Uptime

### 2.1 Account Setup

1. Ga naar https://betteruptime.com
2. Maak een gratis account

### 2.2 Configure Monitors

Voeg deze monitors toe:

**Monitor 1: MCP API Health**
```
URL: https://api.praatmetjeboekhouding.nl/health
Method: GET
Check frequency: 1 minute
Expected status: 200
Expected keyword: "healthy"
Regions: EU (Amsterdam)
```

**Monitor 2: Deep Health Check**
```
URL: https://api.praatmetjeboekhouding.nl/health/deep
Method: GET
Check frequency: 5 minutes
Expected status: 200
Regions: EU (Amsterdam)
```

**Monitor 3: Auth Portal**
```
URL: https://app.praatmetjeboekhouding.nl/api/health
Method: GET
Check frequency: 1 minute
Expected status: 200
Regions: EU (Amsterdam)
```

### 2.3 Status Page Setup

1. Ga naar Status Pages → Create
2. Configureer:
   - Subdomain: `status.praatmetjeboekhouding.nl`
   - Company name: Praat met je Boekhouding
   - Add components: MCP API, Auth Portal

### 2.4 Alert Channels

1. Ga naar Integrations
2. Voeg toe:
   - **Email**: dev@praatmetjeboekhouding.nl
   - **Slack**: #alerts channel webhook
   - **SMS**: +31 6 xxx (voor critical alerts)

---

## Phase 3: Cloudflare Dashboard

### 3.1 Workers Analytics

Cloudflare Workers Analytics is automatisch beschikbaar:

1. Ga naar Cloudflare Dashboard → Workers & Pages
2. Selecteer `exact-mcp-api`
3. Klik op Analytics tab

**Key metrics om te monitoren:**
- Requests per second
- Error rate
- P50/P99 latency
- Geographic distribution

### 3.2 Enable Logpush (Optional)

Voor lange-termijn log opslag:

```bash
# Create R2 bucket for logs
wrangler r2 bucket create mcp-logs --location weur

# Enable via Cloudflare Dashboard:
# Analytics & Logs → Logs → Add destination
```

### 3.3 Real-time Logging

Voor debugging:

```bash
# Tail production logs
wrangler tail --env production

# Filter for errors only
wrangler tail --env production --format json | jq 'select(.level == "error")'
```

---

## Phase 4: Grafana Cloud (Optional)

### 4.1 Account Setup

1. Ga naar https://grafana.com/products/cloud/
2. Maak een gratis account (10k metrics, 50GB logs)

### 4.2 Configure Data Sources

**Prometheus (metrics):**
- De metrics endpoint `/metrics` kan worden gescraped
- Configureer remote write naar Grafana Cloud

**Logs:**
- Gebruik Cloudflare Logpush naar Grafana Loki
- Of log direct vanuit de Worker

### 4.3 Import Dashboards

We hebben dashboard templates klaar:
- Executive Dashboard
- Technical Operations
- Database Metrics

---

## Phase 5: Alerts Configuration

### 5.1 Better Uptime Alerts

Configureer escalation policies:

```yaml
Policy: Critical Alerts
- Immediately: SMS to on-call
- After 5 min: Phone call to on-call
- After 10 min: Alert backup engineer

Policy: High Alerts
- Immediately: Slack notification
- After 30 min: SMS to on-call

Policy: Medium Alerts
- Immediately: Slack notification
```

### 5.2 Sentry Alert Rules

Ga naar Sentry → Alerts → Create Alert Rule:

**Rule 1: High Error Volume**
```
When: Number of events in 1 hour > 100
Then: Notify Slack #alerts
```

**Rule 2: New Issue**
```
When: A new issue is created
Then: Notify Slack #alerts
```

**Rule 3: Regression**
```
When: An issue changes from resolved to unresolved
Then: Notify Email
```

---

## Verification Checklist

### After Setup

- [ ] Sentry DSN is configured and working
- [ ] Better Uptime monitors are green
- [ ] Status page is accessible
- [ ] Slack alerts are configured
- [ ] Can view real-time logs with `wrangler tail`

### Test Alerts

1. **Test Sentry:**
   - Trigger een error in development
   - Verify het verschijnt in Sentry

2. **Test Better Uptime:**
   - Pause een monitor
   - Verify alert wordt verzonden
   - Resume monitor

3. **Test Status Page:**
   - Create test incident
   - Verify het verschijnt op status page
   - Resolve incident

---

## Environment Variables

### Required Secrets

```bash
# Sentry DSN (error tracking)
wrangler secret put SENTRY_DSN --env production

# Already configured:
# EXACT_CLIENT_ID
# EXACT_CLIENT_SECRET
# TOKEN_ENCRYPTION_KEY
```

### Optional Environment Variables

```toml
# In wrangler.toml
[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"  # debug, info, warn, error
```

---

## Troubleshooting

### Sentry Not Receiving Errors

1. Verify DSN is correct: `wrangler secret list --env production`
2. Check Worker logs for Sentry init messages
3. Ensure errors are not in `ignoreErrors` list

### Better Uptime False Positives

1. Increase check interval to 2-3 minutes
2. Add more check locations
3. Verify health endpoint is fast enough (<5s)

### High Log Volume

1. Reduce LOG_LEVEL to "warn" in production
2. Sample debug logs (only log 10%)
3. Enable log aggregation

---

## Cost Summary

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Sentry | Team (50k errors) | €26 |
| Better Uptime | Free (5 monitors) | €0 |
| Grafana Cloud | Free (10k metrics) | €0 |
| Cloudflare R2 | ~5GB logs | €0.50 |
| **Total** | | **~€27** |

---

## Next Steps

1. Set up on-call rotation (if >1 person team)
2. Create custom dashboards for business metrics
3. Implement synthetic monitoring for critical flows
4. Document runbooks for all alert types
5. Schedule monthly SLA review meetings
