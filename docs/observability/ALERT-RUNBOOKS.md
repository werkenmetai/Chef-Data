# Alert Runbooks

Dit document bevat gedetailleerde runbooks voor alle gedefinieerde alerts.

## Quick Reference

| Alert | Severity | Response Time | Escalation |
|-------|----------|---------------|------------|
| Service Down | Critical | < 5 min | Immediate |
| Error Rate > 5% | Critical | < 5 min | Immediate |
| Database Unreachable | Critical | < 5 min | Immediate |
| Exact API Down | High | < 15 min | 30 min |
| Token Refresh Failures | High | < 15 min | 1 hour |
| P95 Latency > 5s | High | < 30 min | 2 hours |
| Error Rate > 1% | Medium | < 1 hour | Next day |
| Rate Limit Spike | Medium | < 1 hour | Next day |
| D1 Storage > 80% | Low | < 24 hours | Weekly |

---

## Critical Alerts

### CRIT-001: Service Down

**Alert Configuration:**
```yaml
name: service_down
condition: health_check_fails >= 3 consecutive (3 min)
severity: critical
channels: [sms, phone, slack]
```

**Symptomen:**
- `/health` endpoint geeft geen 200 response
- Cloudflare Workers dashboard toont errors
- Klanten melden dat service onbereikbaar is

**Diagnose Stappen:**

```bash
# 1. Quick health check
curl -I https://api.praatmetjeboekhouding.nl/health

# 2. Check Cloudflare status
open https://cloudflarestatus.com

# 3. Check recent deployments
wrangler deployments list --env production

# 4. Check Workers logs
wrangler tail --env production

# 5. Verify D1 database
wrangler d1 execute exact-mcp-db --command "SELECT 1"
```

**Mogelijke Oorzaken:**
1. **Cloudflare outage** → Check status page, wacht op recovery
2. **Deployment fout** → Rollback naar vorige versie
3. **D1 database issue** → Check Cloudflare D1 status
4. **Code bug** → Review recent changes in logs

**Oplossingen:**

```bash
# Rollback naar vorige deployment
wrangler rollback --env production

# Als D1 issue, check database
wrangler d1 execute exact-mcp-db --command "SELECT COUNT(*) FROM users"
```

**Communicatie:**
```
[Status Page - Investigating]
We onderzoeken momenteel een storing waardoor onze service niet bereikbaar is.
We verwachten binnen 15 minuten meer duidelijkheid.

[Status Page - Identified]
We hebben de oorzaak van de storing geïdentificeerd: [OORZAAK].
We werken aan een oplossing.

[Status Page - Resolved]
De storing is verholpen. Alle services functioneren weer normaal.
Onze excuses voor het ongemak.
```

---

### CRIT-002: Error Rate > 5%

**Alert Configuration:**
```yaml
name: error_rate_critical
condition: error_rate_5xx > 5% for 5 minutes
severity: critical
channels: [sms, slack]
```

**Diagnose Stappen:**

```bash
# 1. Check error logs in Cloudflare
wrangler tail --env production --format json | jq 'select(.level == "error")'

# 2. Check Sentry for error details
open https://sentry.io/organizations/YOUR_ORG/issues/

# 3. Check recent deployments
wrangler deployments list --env production
```

**Mogelijke Oorzaken:**
1. **Bug in recent deployment** → Rollback
2. **External API failure (Exact Online)** → Check Exact status
3. **Database issues** → Check D1 status
4. **Rate limiting issues** → Check rate limit config

**SQL Query voor Error Analysis:**
```sql
SELECT
  event_type,
  COUNT(*) as count,
  MAX(timestamp) as last_occurrence
FROM security_events
WHERE timestamp > datetime('now', '-1 hour')
GROUP BY event_type
ORDER BY count DESC;
```

---

### CRIT-003: Database Unreachable

**Alert Configuration:**
```yaml
name: database_down
condition: health_check.database.status = "error" for 2 minutes
severity: critical
channels: [sms, phone, slack]
```

**Diagnose Stappen:**

```bash
# 1. Test database connectivity
wrangler d1 execute exact-mcp-db --command "SELECT 1"

# 2. Check D1 quotas
wrangler d1 info exact-mcp-db

# 3. Check Cloudflare D1 status
open https://cloudflarestatus.com
```

**Mogelijke Oorzaken:**
1. **D1 service outage** → Wacht op Cloudflare
2. **Quota exceeded** → Upgrade plan of optimize queries
3. **Network issue** → Usually self-resolving

---

## High Priority Alerts

### HIGH-001: Exact Online API Down

**Alert Configuration:**
```yaml
name: exact_api_down
condition: exact_api_error_rate > 50% for 5 minutes
severity: high
channels: [slack]
escalation: 30 minutes
```

**Dit is NIET onze fout** - Exact Online is een externe dependency.

**Diagnose Stappen:**

```bash
# 1. Check Exact Online status
open https://status.exactonline.com

# 2. Test Exact API manually
curl -I https://start.exactonline.nl/api/v1/current/Me

# 3. Check our error logs for details
wrangler tail --env production | grep "ExactAPIError"
```

**Acties:**
1. Update status page naar "Degraded - External dependency"
2. Monitor Exact status page
3. Service herstelt automatisch wanneer Exact weer beschikbaar is

**Klantcommunicatie:**
```
We ervaren momenteel problemen met het ophalen van data door een storing
bij onze dataprovider Exact Online. Dit is een externe storing waar wij
geen invloed op hebben.

We monitoren de situatie actief. De service herstelt automatisch zodra
Exact Online weer volledig beschikbaar is.

Status Exact Online: https://status.exactonline.com
```

---

### HIGH-002: Token Refresh Failures

**Alert Configuration:**
```yaml
name: token_refresh_spike
condition: token_refresh_failure_rate > 10% for 10 minutes
severity: high
channels: [slack]
escalation: 1 hour
```

**Diagnose Stappen:**

```bash
# 1. Check refresh failure logs
wrangler tail --env production | grep "Token refresh failed"

# 2. Check affected connections
wrangler d1 execute exact-mcp-db --command "
  SELECT status, COUNT(*) as count
  FROM connections
  GROUP BY status
"

# 3. Test OAuth endpoint
curl -X POST https://start.exactonline.nl/api/oauth2/token \
  -d "grant_type=refresh_token&refresh_token=test"
```

**Mogelijke Oorzaken:**
1. **Exact OAuth maintenance** → Wacht op recovery
2. **Client secret gewijzigd** → Update secret
3. **User heeft toegang ingetrokken** → User moet opnieuw connecten

**Reset Affected Connections:**
```sql
-- Mark for retry
UPDATE connections
SET status = 'active'
WHERE status = 'refresh_failed'
AND updated_at > datetime('now', '-1 hour');
```

---

### HIGH-003: High Latency (P95 > 5s)

**Alert Configuration:**
```yaml
name: latency_critical
condition: request_duration_p95 > 5000ms for 10 minutes
severity: high
channels: [slack]
escalation: 2 hours
```

**Diagnose Stappen:**

```bash
# 1. Check slow requests in logs
wrangler tail --env production --format json | \
  jq 'select(.duration > 5000)'

# 2. Check database query times
wrangler d1 execute exact-mcp-db --command "
  SELECT endpoint, AVG(response_time_ms) as avg_time
  FROM api_usage
  WHERE timestamp > datetime('now', '-1 hour')
  GROUP BY endpoint
  ORDER BY avg_time DESC
  LIMIT 10
"
```

**Mogelijke Oorzaken:**
1. **Exact Online API traag** → Externe issue
2. **D1 database slow** → Check query optimization
3. **Cold starts** → Reduce bundle size, use keep-alive

---

## Medium Priority Alerts

### MED-001: Elevated Error Rate

**Alert Configuration:**
```yaml
name: error_rate_elevated
condition: error_rate_5xx > 1% for 15 minutes
severity: medium
channels: [slack]
escalation: next_business_day
```

**Acties:**
1. Review errors in Sentry
2. Identify patterns
3. Create ticket for fix if needed

---

### MED-002: Rate Limit Spike

**Alert Configuration:**
```yaml
name: rate_limit_spike
condition: rate_limit_hits > 100/hour (500% above baseline)
severity: medium
channels: [slack]
```

**Diagnose:**
```sql
SELECT
  user_id,
  COUNT(*) as hits,
  MAX(timestamp) as last_hit
FROM security_events
WHERE event_type = 'rate_limit_exceeded'
AND timestamp > datetime('now', '-1 hour')
GROUP BY user_id
ORDER BY hits DESC;
```

**Acties:**
1. Identify user/API key causing hits
2. Determine if legitimate (upgrade suggestion) or abuse (block)

---

## Low Priority Alerts

### LOW-001: D1 Storage Warning

**Alert Configuration:**
```yaml
name: d1_storage_warning
condition: d1_storage_gb > 0.8
severity: low
channels: [email]
escalation: weekly_review
```

**Acties:**
1. Review table sizes
2. Archive/delete old data
3. Plan for growth

```sql
-- Check table sizes (approximate)
SELECT
  name,
  (SELECT COUNT(*) FROM users) as users_rows,
  (SELECT COUNT(*) FROM connections) as connections_rows,
  (SELECT COUNT(*) FROM api_usage) as api_usage_rows,
  (SELECT COUNT(*) FROM security_events) as security_rows
FROM sqlite_master WHERE type='table' AND name='users';
```

---

## Alert Configuration Examples

### Better Uptime Configuration

```json
{
  "monitors": [
    {
      "url": "https://api.praatmetjeboekhouding.nl/health",
      "monitor_type": "status",
      "required_keyword": "healthy",
      "check_frequency": 60,
      "regions": ["eu"],
      "escalation_policy": {
        "on_call": ["primary"],
        "after_minutes": 5,
        "escalate_to": ["secondary"]
      }
    }
  ],
  "on_call": {
    "primary": {
      "phone": "+31612345678",
      "email": "dev@praatmetjeboekhouding.nl"
    }
  }
}
```

### Sentry Alert Rules

```json
{
  "rules": [
    {
      "name": "High Error Volume",
      "conditions": [
        {
          "id": "sentry.rules.conditions.event_frequency.EventFrequencyCondition",
          "value": 100,
          "interval": "1h"
        }
      ],
      "actions": [
        {
          "id": "sentry.integrations.slack.notify_action.SlackNotifyServiceAction",
          "channel": "#alerts"
        }
      ]
    }
  ]
}
```

---

## On-Call Rotation

### 1-2 Person Team Setup

**Schedule:**
- Week 1: Developer A (primary)
- Week 2: Developer B (primary)
- Backup: Always the other developer

**Responsibilities:**
1. Monitor alerts during working hours
2. Respond to critical alerts within 15 minutes
3. Update status page when needed
4. Escalate if unable to resolve within 30 minutes

**Tools:**
- Better Uptime app for alerts
- Slack for team communication
- 1Password for credentials

---

## Post-Incident Process

### Template

```markdown
# Post-Incident Report: [TITLE]

**Date:** [DATE]
**Duration:** [START] - [END] ([MINUTES] minutes)
**Severity:** [Critical/High/Medium]
**Affected Users:** [NUMBER or PERCENTAGE]

## Summary
[1-2 sentence summary]

## Timeline
- HH:MM - Alert triggered
- HH:MM - On-call acknowledged
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Monitoring confirmed resolution

## Root Cause
[Detailed explanation]

## Resolution
[What was done to fix it]

## Action Items
- [ ] [Action 1] - Owner: [NAME] - Due: [DATE]
- [ ] [Action 2] - Owner: [NAME] - Due: [DATE]

## Lessons Learned
- What went well:
- What could improve:
```

---

## Contact Information

**Cloudflare Support:**
- Dashboard: https://dash.cloudflare.com
- Enterprise support: support@cloudflare.com

**Exact Online:**
- Status: https://status.exactonline.com
- Support: Via Exact Online portal

**Internal:**
- Primary: [EMAIL]
- Secondary: [EMAIL]
- Slack: #mcp-incidents
