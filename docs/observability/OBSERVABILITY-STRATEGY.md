# Observability Strategy: Praat met je Boekhouding

> **Versie:** 1.0
> **Datum:** Januari 2026
> **Status:** Implementatie-klaar

## Executive Summary

Dit document beschrijft de complete observability strategie voor "Praat met je Boekhouding" - een MCP server die financiële boekhouddata verwerkt via Cloudflare Workers. De strategie is ontworpen voor:

- **Klein team** (1-2 developers)
- **Startup budget** (< €100/maand)
- **GDPR-compliant** (geen boekhouddata in externe logs)
- **Hoge betrouwbaarheid** (financiële applicatie)

---

## 1. Monitoring Stack Recommendation

### Gekozen Stack: Cloudflare-First + Targeted External Tools

| Component | Tool | Kosten | Rationale |
|-----------|------|--------|-----------|
| **Logs** | Cloudflare Workers Logs | Gratis | Native, real-time, geen setup |
| **Log Archive** | Cloudflare Logpush → R2 | ~€5/maand | Eigen bucket, GDPR-safe |
| **Error Tracking** | Sentry (Team plan) | €26/maand | Best-in-class, CF SDK |
| **Uptime** | Better Uptime (Free) | Gratis | 5 monitors, status page |
| **Metrics** | Cloudflare Workers Analytics | Gratis | Native, geen code changes |
| **Dashboards** | Grafana Cloud (Free) | Gratis | 10k metrics, 50GB logs |
| **Alerting** | Better Uptime + Sentry | Gratis | SMS/Email/Slack |

**Totaal: ~€31/maand**

### Vergelijking Alternatieven

| Tool | Free Tier | Paid Start | Pros | Cons |
|------|-----------|------------|------|------|
| **Grafana Cloud** | 10k series, 50GB logs | €49/mo | Alles-in-één, Prometheus | Complex voor klein team |
| **Datadog** | 5 hosts | €15/host/mo | Beste APM | Duur, vendor lock-in |
| **Better Uptime** | 5 monitors | €20/mo | Eenvoudig, status page | Beperkte metrics |
| **Checkly** | 5 checks | €30/mo | Beste synthetic | Duur voor basics |
| **Sentry** | 5k errors/mo | €26/mo | Beste error tracking | Alleen errors |
| **Cloudflare** | Alles basis | N/A | Native, geen latency | Beperkte retentie |

### Waarom Deze Keuze?

1. **Cloudflare Native First** - Geen extra latency, werkt out-of-the-box
2. **Sentry voor Errors** - Onmisbaar voor debugging, goede CF integratie
3. **Better Uptime Free** - Gratis status page voor klanten
4. **Grafana Cloud Free** - Schaalbaar naar betaald indien nodig
5. **R2 voor Log Archive** - GDPR-compliant, eigen data, goedkoop

---

## 2. Metrics Catalog

### 2.1 Beschikbaarheid Metrics

| Metric | Type | Beschrijving | Hoe te collecten | Target |
|--------|------|--------------|------------------|--------|
| `uptime_percentage` | Gauge | % tijd dat service beschikbaar is | Better Uptime synthetic | ≥99.9% |
| `error_rate_4xx` | Counter | Client errors per minuut | Workers Analytics | <5% |
| `error_rate_5xx` | Counter | Server errors per minuut | Workers Analytics | <0.5% |
| `exact_api_availability` | Gauge | Exact Online API status | Passive monitoring | N/A |
| `health_check_status` | Gauge | Health endpoint result (0/1) | Synthetic check | 1 |

### 2.2 Performance Metrics

| Metric | Type | Beschrijving | Hoe te collecten | Target |
|--------|------|--------------|------------------|--------|
| `request_duration_p50` | Histogram | 50th percentile latency | Workers Analytics | <500ms |
| `request_duration_p95` | Histogram | 95th percentile latency | Workers Analytics | <2000ms |
| `request_duration_p99` | Histogram | 99th percentile latency | Workers Analytics | <5000ms |
| `cold_start_count` | Counter | Aantal cold starts | Custom header tracking | <10% |
| `cold_start_duration` | Histogram | Cold start latency | Custom timing | <500ms |
| `d1_query_duration` | Histogram | Database query tijd | Custom instrumentation | <100ms |
| `exact_api_latency` | Histogram | Exact API response tijd | Custom instrumentation | <3000ms |
| `token_refresh_duration` | Histogram | OAuth refresh tijd | Custom instrumentation | <2000ms |

### 2.3 Business Metrics

| Metric | Type | Beschrijving | Hoe te collecten | Target |
|--------|------|--------------|------------------|--------|
| `requests_per_user` | Counter | Requests per user per dag | D1 api_usage | Tracking |
| `tool_usage_count` | Counter | Gebruik per tool | D1 api_usage | Tracking |
| `active_users_daily` | Gauge | DAU | D1 query | Growth |
| `active_users_weekly` | Gauge | WAU | D1 query | Growth |
| `active_users_monthly` | Gauge | MAU | D1 query | Growth |
| `api_key_usage` | Counter | Requests per API key | D1 api_usage | Tracking |
| `divisions_accessed` | Counter | Unieke divisies per dag | D1 api_usage | Tracking |

### 2.4 Security Metrics

| Metric | Type | Beschrijving | Hoe te collecten | Target |
|--------|------|--------------|------------------|--------|
| `auth_failures` | Counter | Gefaalde authenticaties | D1 security_events | <100/hr |
| `rate_limit_hits` | Counter | Rate limit triggers | D1/Memory | Tracking |
| `suspicious_patterns` | Counter | Verdachte requests | D1 security_events | Alert on spike |
| `token_refresh_failures` | Counter | OAuth refresh failures | Custom tracking | <1% |

### 2.5 Cost Metrics

| Metric | Type | Beschrijving | Hoe te collecten | Target |
|--------|------|--------------|------------------|--------|
| `workers_requests` | Counter | Totaal Workers requests | CF Dashboard API | Budget |
| `d1_reads` | Counter | Database reads | CF Dashboard API | Budget |
| `d1_writes` | Counter | Database writes | CF Dashboard API | Budget |
| `d1_storage_gb` | Gauge | Database storage | CF Dashboard API | <1GB |

---

## 3. Alert Runbook

### 3.1 Critical Alerts (Pager-worthy)

#### CRIT-001: Error Rate > 5%

```yaml
Alert: error_rate_critical
Condition: error_rate_5xx > 5% for 5 minutes
Severity: Critical
Channel: SMS + Phone call
Escalation: Immediate
```

**Wat betekent het:**
- Meer dan 5% van requests falen met server errors
- Waarschijnlijk een deployment issue of externe dependency down

**Wat te doen:**
1. Check Cloudflare Workers dashboard voor error details
2. Check Sentry voor error stack traces
3. Verify recent deployments: `wrangler deployments list`
4. Check Exact Online status: https://status.exactonline.com
5. Als recent deployed: `wrangler rollback`
6. Check D1 database status

**Escalatie:**
- 0-5 min: On-call engineer
- 5-15 min: Backup engineer
- 15+ min: All hands

---

#### CRIT-002: Service Down

```yaml
Alert: service_down
Condition: health_check fails for 3 consecutive checks (3 min)
Severity: Critical
Channel: SMS + Phone call
Escalation: Immediate
```

**Wat betekent het:**
- /health endpoint geeft geen 200 response
- Complete service outage

**Wat te doen:**
1. Check Cloudflare Status: https://cloudflarestatus.com
2. Check Workers deployment status in dashboard
3. Run manual health check: `curl https://api.praatmetjeboekhouding.nl/health`
4. Check voor recent deployments
5. Review Cloudflare Workers logs
6. Contact Cloudflare support indien nodig

---

#### CRIT-003: D1 Database Unreachable

```yaml
Alert: database_down
Condition: health_check.database.status = "error" for 2 minutes
Severity: Critical
Channel: SMS + Phone call
Escalation: Immediate
```

**Wat betekent het:**
- D1 database queries falen
- Alle authenticated requests zullen falen

**Wat te doen:**
1. Check Cloudflare D1 dashboard
2. Test basic query: `wrangler d1 execute exact-mcp-db --command "SELECT 1"`
3. Check voor D1 outages op Cloudflare Status
4. Review recent schema migrations
5. Consider degraded mode (readonly/cached responses)

---

### 3.2 High Priority Alerts (Slack)

#### HIGH-001: Exact Online API Down

```yaml
Alert: exact_api_down
Condition: exact_api_error_rate > 50% for 5 minutes
Severity: High
Channel: Slack #alerts
Escalation: 30 min
```

**Wat betekent het:**
- Exact Online API is niet bereikbaar of geeft errors
- Klanten kunnen geen data ophalen, maar auth werkt nog

**Wat te doen:**
1. Check Exact Online status: https://status.exactonline.com
2. Verify met manual test call
3. **Niet onze schuld** - communiceer naar klanten via status page
4. Enable degraded mode messaging indien beschikbaar
5. Monitor voor recovery

**Klantcommunicatie template:**
> We ervaren momenteel problemen met het ophalen van data door een storing bij Exact Online. We monitoren de situatie en de service herstelt automatisch zodra Exact Online weer beschikbaar is.

---

#### HIGH-002: Token Refresh Failures Spike

```yaml
Alert: token_refresh_spike
Condition: token_refresh_failure_rate > 10% for 10 minutes
Severity: High
Channel: Slack #alerts
Escalation: 1 hour
```

**Wat betekent het:**
- OAuth tokens kunnen niet worden ververst
- Gebruikers moeten mogelijk opnieuw connecten

**Wat te doen:**
1. Check Exact Online OAuth endpoints
2. Verify EXACT_CLIENT_SECRET is correct
3. Check voor Exact Online OAuth changes/maintenance
4. Review affected connections in database
5. Manual token refresh test

---

#### HIGH-003: P95 Latency > 5 seconden

```yaml
Alert: latency_critical
Condition: request_duration_p95 > 5000ms for 10 minutes
Severity: High
Channel: Slack #alerts
Escalation: 2 hours
```

**Wat betekent het:**
- Response times zijn onacceptabel hoog
- Mogelijk D1 of Exact API performance issue

**Wat te doen:**
1. Check Workers Analytics voor slow requests
2. Identify welke endpoints/tools traag zijn
3. Check D1 query performance
4. Check Exact Online API latency
5. Review recent code changes
6. Consider caching improvements

---

### 3.3 Medium Priority Alerts (Slack)

#### MED-001: Error Rate > 1%

```yaml
Alert: error_rate_elevated
Condition: error_rate_5xx > 1% for 15 minutes
Severity: Medium
Channel: Slack #alerts
Escalation: Next business day
```

**Wat te doen:**
1. Review errors in Sentry
2. Identify common error patterns
3. Create fix ticket if needed
4. Monitor trend

---

#### MED-002: Rate Limit Hits Spike

```yaml
Alert: rate_limit_spike
Condition: rate_limit_hits > 100/hour (500% above baseline)
Severity: Medium
Channel: Slack #alerts
Escalation: Next business day
```

**Wat betekent het:**
- Mogelijk misbruik of misconfigured client
- Of legitiem hoog gebruik

**Wat te doen:**
1. Identify welke user/API key de hits veroorzaakt
2. Check of het legitiem gebruik is
3. Contact klant indien nodig
4. Consider plan upgrade aanbieden

---

### 3.4 Low Priority Alerts (Email)

#### LOW-001: D1 Storage > 80%

```yaml
Alert: d1_storage_warning
Condition: d1_storage_gb > 0.8 GB (80% of 1GB limit)
Severity: Low
Channel: Email
Escalation: Weekly review
```

**Wat te doen:**
1. Review oude data voor cleanup
2. Analyze growth rate
3. Plan for data archival
4. Consider Cloudflare plan upgrade

---

#### LOW-002: Workers Requests Near Limit

```yaml
Alert: workers_quota_warning
Condition: daily_requests > 80% of plan limit
Severity: Low
Channel: Email
Escalation: Weekly review
```

---

## 4. Dashboard Design

### 4.1 Executive Dashboard

**Doel:** Snel overzicht voor stakeholders, uptime focus

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRAAT MET JE BOEKHOUDING                          │
│                     System Health Dashboard                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   UPTIME     │  │  ERROR RATE  │  │ ACTIVE USERS │              │
│  │    99.95%    │  │    0.12%     │  │     127      │              │
│  │   ▲ 30 days  │  │   ✓ Normal   │  │   ▲ +12%     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ UPTIME HISTORY (30 dagen)                                      │  │
│  │ ████████████████████████████████████████████████ 99.95%       │  │
│  │ Jan 1 ────────────────────────────────────── Jan 30           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ REQUESTS TODAY      │  │ TOP TOOLS (24h)                      │  │
│  │ ████████░░  12,345  │  │ 1. get_sales_invoices    45%        │  │
│  │ vs gisteren: +8%    │  │ 2. get_accounts          23%        │  │
│  │                     │  │ 3. get_debtors           18%        │  │
│  │ This month: 342,891 │  │ 4. get_journal_entries   14%        │  │
│  └─────────────────────┘  └─────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ INCIDENTS (30 dagen)                                           │  │
│  │ ✓ Jan 15 - Exact API degraded (23 min) - External             │  │
│  │ ✓ Jan 8 - Elevated latency (12 min) - Resolved                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Technical Dashboard

**Doel:** Deep dive debugging, performance analysis

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TECHNICAL OPERATIONS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ LATENCY PERCENTILES (1 hour)          ERROR BREAKDOWN               │
│ ┌─────────────────────────┐          ┌─────────────────────┐        │
│ │  P50: ████░░░ 234ms     │          │ 401: ██████░ 45     │        │
│ │  P95: ████████░ 1.2s    │          │ 403: ██░░░░░ 12     │        │
│ │  P99: ██████████ 3.4s   │          │ 429: ███░░░░ 23     │        │
│ └─────────────────────────┘          │ 500: █░░░░░░  8     │        │
│                                       └─────────────────────┘        │
│                                                                      │
│ REQUEST TIMELINE (24h)                                               │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │     ╭──╮                    ╭────╮                             │  │
│ │    ╱    ╲                  ╱      ╲       ╭──╮                 │  │
│ │   ╱      ╲                ╱        ╲     ╱    ╲                │  │
│ │──╱        ╲──────────────╱          ╲───╱      ╲──────        │  │
│ │ 00:00      06:00        12:00       18:00      24:00          │  │
│ └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ COMPONENT HEALTH                       EXTERNAL DEPENDENCIES         │
│ ┌─────────────────────────┐          ┌─────────────────────────┐   │
│ │ Workers API    ✓ OK     │          │ Exact Online   ✓ 234ms  │   │
│ │ D1 Database    ✓ 12ms   │          │ Exact OAuth    ✓ 189ms  │   │
│ │ Auth Portal    ✓ OK     │          │ Cloudflare D1  ✓ 8ms    │   │
│ │ Rate Limiter   ✓ OK     │          │                         │   │
│ └─────────────────────────┘          └─────────────────────────┘   │
│                                                                      │
│ TOP ERRORS (24h)                       SLOW QUERIES (24h)           │
│ ┌─────────────────────────┐          ┌─────────────────────────┐   │
│ │ TokenExpiredError  34   │          │ getJournalEntries 2.3s  │   │
│ │ ExactAPIError      12   │          │ getSalesInvoices  1.8s  │   │
│ │ ValidationError     8   │          │ getDebtors        1.2s  │   │
│ └─────────────────────────┘          └─────────────────────────┘   │
│                                                                      │
│ RECENT DEPLOYMENTS                                                   │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │ Jan 26 14:32  v2.3.1  ✓ Healthy  "Fix token refresh timing"   │  │
│ │ Jan 25 09:15  v2.3.0  ✓ Healthy  "Add journal entries tool"   │  │
│ │ Jan 23 16:45  v2.2.9  ✓ Healthy  "Performance improvements"   │  │
│ └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 Database Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│                    D1 DATABASE METRICS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   STORAGE    │  │ READS/DAY    │  │ WRITES/DAY   │              │
│  │   456 MB     │  │   125,432    │  │    8,234     │              │
│  │   45% used   │  │   ✓ Normal   │  │   ✓ Normal   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│ QUERY LATENCY DISTRIBUTION                                          │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │ <10ms   ████████████████████████████████████  78%             │  │
│ │ 10-50ms ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  18%             │  │
│ │ 50-100ms ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   3%             │  │
│ │ >100ms  █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   1%             │  │
│ └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ TABLE SIZES                            SLOW QUERIES                  │
│ ┌─────────────────────────┐          ┌─────────────────────────┐   │
│ │ api_usage      234 MB   │          │ Auth JOIN query   45ms  │   │
│ │ security_events 89 MB   │          │ Usage count       23ms  │   │
│ │ connections     12 MB   │          │ Session lookup    12ms  │   │
│ │ users            8 MB   │          │                         │   │
│ └─────────────────────────┘          └─────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Guide

### Phase 1: Foundation (Week 1)

#### 5.1 Structured Logging Setup

```typescript
// apps/mcp-server/src/lib/logger.ts
interface LogContext {
  requestId: string;
  userId?: string;
  tool?: string;
  duration?: number;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  constructor(private context: Partial<LogContext> = {}) {}

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
    };

    // Cloudflare Workers logs als JSON
    console[level === 'error' ? 'error' : 'log'](JSON.stringify(logEntry));
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>) {
    this.log('error', message, {
      ...data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  child(context: Partial<LogContext>): Logger {
    return new Logger({ ...this.context, ...context });
  }
}
```

#### 5.2 Request ID Middleware

```typescript
// apps/mcp-server/src/middleware/request-id.ts
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

export function withRequestId(request: Request): { requestId: string; headers: Headers } {
  const requestId = request.headers.get('x-request-id') || generateRequestId();
  const headers = new Headers();
  headers.set('x-request-id', requestId);
  return { requestId, headers };
}
```

### Phase 2: Error Tracking (Week 1-2)

#### 5.3 Sentry Setup

```bash
# Install Sentry
cd apps/mcp-server
pnpm add @sentry/cloudflare
```

```typescript
// apps/mcp-server/src/monitoring/sentry.ts
import * as Sentry from '@sentry/cloudflare';
import { Env } from '../types';

export function initSentry(env: Env): void {
  if (!env.SENTRY_DSN) {
    console.warn('[Sentry] No DSN configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT || 'development',
    tracesSampleRate: 0.1, // 10% of requests for performance
    beforeSend(event) {
      // Remove any PII from error data
      if (event.request?.data) {
        event.request.data = '[REDACTED]';
      }
      return event;
    },
  });
}

export function captureException(
  error: Error,
  context?: Record<string, unknown>
): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function setUser(userId: string, email?: string): void {
  Sentry.setUser({
    id: userId,
    email: email ? maskEmail(email) : undefined,
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
}
```

#### 5.4 Sentry Integration in Main Handler

```typescript
// In apps/mcp-server/src/index.ts
import * as Sentry from '@sentry/cloudflare';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return Sentry.withMonitor(
      'mcp-request',
      async () => {
        // ... existing handler code
      },
      {
        // Cron monitor settings (optional)
        schedule: { type: 'crontab', value: '*/5 * * * *' },
      }
    );
  },
};
```

### Phase 3: Uptime Monitoring (Week 2)

#### 5.5 Better Uptime Setup

1. **Create account** op https://betteruptime.com (gratis)
2. **Add monitors:**

```yaml
Monitors:
  - name: "MCP API Health"
    url: "https://api.praatmetjeboekhouding.nl/health"
    method: GET
    expected_status: 200
    check_frequency: 60  # seconds
    regions:
      - eu-west  # Amsterdam
      - eu-central  # Frankfurt

  - name: "Auth Portal"
    url: "https://app.praatmetjeboekhouding.nl/api/health"
    method: GET
    expected_status: 200
    check_frequency: 60

  - name: "MCP Tools Endpoint"
    url: "https://api.praatmetjeboekhouding.nl/tools"
    method: GET
    expected_status: 200
    check_frequency: 300  # 5 min
```

3. **Create Status Page:**
   - URL: status.praatmetjeboekhouding.nl
   - Components: MCP API, Auth Portal, Exact Online Integration

### Phase 4: Metrics & Dashboards (Week 2-3)

#### 5.6 Custom Metrics Collection

```typescript
// apps/mcp-server/src/monitoring/metrics.ts
import { Env } from '../types';

interface MetricPoint {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

class MetricsCollector {
  private buffer: MetricPoint[] = [];

  record(name: string, value: number, tags: Record<string, string> = {}) {
    this.buffer.push({
      name,
      value,
      tags,
      timestamp: Date.now(),
    });
  }

  increment(name: string, tags: Record<string, string> = {}) {
    this.record(name, 1, tags);
  }

  timing(name: string, durationMs: number, tags: Record<string, string> = {}) {
    this.record(name, durationMs, { ...tags, unit: 'ms' });
  }

  // Flush to D1 for later export
  async flush(env: Env, ctx: ExecutionContext) {
    if (this.buffer.length === 0) return;

    const points = [...this.buffer];
    this.buffer = [];

    ctx.waitUntil(
      env.DB.prepare(`
        INSERT INTO metrics (name, value, tags, timestamp)
        VALUES ${points.map(() => '(?, ?, ?, ?)').join(',')}
      `).bind(
        ...points.flatMap(p => [p.name, p.value, JSON.stringify(p.tags), p.timestamp])
      ).run()
    );
  }
}

export const metrics = new MetricsCollector();
```

#### 5.7 Cloudflare Workers Analytics Engine (Native)

Cloudflare Workers Analytics Engine is gratis en native beschikbaar:

```toml
# wrangler.toml - Add analytics binding
[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "mcp_metrics"
```

```typescript
// Using Analytics Engine
export async function recordMetric(
  analytics: AnalyticsEngineDataset,
  event: string,
  data: Record<string, string | number>
) {
  analytics.writeDataPoint({
    blobs: [event],
    doubles: [typeof data.value === 'number' ? data.value : 0],
    indexes: [data.tool as string || 'unknown'],
  });
}
```

### Phase 5: Log Archive (Week 3)

#### 5.8 Cloudflare Logpush to R2

```bash
# Create R2 bucket for logs
wrangler r2 bucket create mcp-logs

# Enable Logpush via Cloudflare Dashboard:
# 1. Go to Analytics & Logs > Logs
# 2. Add destination: R2
# 3. Select bucket: mcp-logs
# 4. Select log fields: all
# 5. Filter: Workers only
```

**R2 Log Retention Policy:**
```json
{
  "rules": [
    {
      "id": "expire-old-logs",
      "enabled": true,
      "filter": { "prefix": "logs/" },
      "expiration": { "days": 90 }
    }
  ]
}
```

---

## 6. SLA Template

### 6.1 Service Level Agreement

```markdown
# Service Level Agreement (SLA)
## Praat met je Boekhouding - MCP API

**Versie:** 1.0
**Ingangsdatum:** [Datum]

### 1. Service Beschikbaarheid

| Plan | Uptime Target | Reactietijd Critical | Support Uren |
|------|---------------|---------------------|--------------|
| Free | 99.0% | Best effort | Geen |
| Pro | 99.5% | < 4 uur | Werkdagen 9-17 |
| Enterprise | 99.9% | < 1 uur | 24/7 |

**Uptime berekening:**
- Gemeten per kalendermaand
- Exclusief gepland onderhoud (met 48h vooraankondiging)
- Exclusief externe dependencies (Exact Online, Cloudflare outages)

### 2. Service Credits

Bij niet-halen van uptime target (Pro/Enterprise):

| Uptime | Credit |
|--------|--------|
| 99.0% - 99.5% | 10% |
| 95.0% - 99.0% | 25% |
| < 95.0% | 50% |

### 3. Externe Dependencies

**Exact Online:**
Wij zijn afhankelijk van Exact Online API beschikbaarheid.
Exact Online outages tellen niet mee voor onze SLA berekening.
Status: https://status.exactonline.com

**Cloudflare:**
Onze infrastructuur draait op Cloudflare Workers.
Cloudflare platform outages tellen niet mee voor onze SLA berekening.
Status: https://cloudflarestatus.com

### 4. Onderhoud

- **Gepland onderhoud:** Minimaal 48 uur vooraf aangekondigd
- **Onderhoudsvenster:** Zondag 02:00-06:00 CET (bij voorkeur)
- **Emergency onderhoud:** Direct, met notificatie achteraf

### 5. Incidentclassificatie

| Severity | Omschrijving | Response Target |
|----------|--------------|-----------------|
| Critical | Service volledig onbeschikbaar | 15 minuten |
| High | Belangrijke functionaliteit verstoord | 1 uur |
| Medium | Prestatievermindering | 4 uur |
| Low | Kleine issues, workaround beschikbaar | 24 uur |

### 6. Monitoring & Rapportage

- **Status Page:** status.praatmetjeboekhouding.nl
- **Incident History:** Publiek beschikbaar op status page
- **Maandrapport:** Beschikbaar voor Pro/Enterprise klanten
```

### 6.2 Realistische SLA Overwegingen

**Waarom 99.9% moeilijk is:**
1. Exact Online API heeft eigen uptime (~99.5%)
2. Token refresh kan falen (1-2% failure rate)
3. Cloudflare Workers heeft SLA van 99.99%
4. D1 is nog relatief nieuw (geen officiële SLA)

**Aanbeveling:**
- **Free:** Geen SLA, best effort
- **Pro:** 99.5% met exclusies voor externe dependencies
- **Enterprise:** 99.9% met premium support

---

## 7. Cost Estimate

### 7.1 Maandelijkse Kosten (Startup Fase)

| Component | Tool | Gratis Tier | Verwacht Gebruik | Kosten |
|-----------|------|-------------|------------------|--------|
| **Error Tracking** | Sentry Team | 5k errors/mo | ~2k errors | €26/mo |
| **Uptime Monitoring** | Better Uptime | 5 monitors | 3 monitors | €0 |
| **Log Archive** | Cloudflare R2 | 10GB | ~5GB | €0.5/mo |
| **Dashboards** | Grafana Cloud | 10k series | ~1k series | €0 |
| **Workers** | Cloudflare | 100k req/day | ~50k req/day | €0 |
| **D1 Database** | Cloudflare | 5M reads/day | ~500k reads | €0 |
| **Status Page** | Better Uptime | 1 page | 1 page | €0 |
| **Alerting** | Sentry/Better | Included | - | €0 |

**Totaal: ~€27/maand**

### 7.2 Groei Scenario (1000+ users)

| Component | Tool | Kosten |
|-----------|------|--------|
| Sentry Team | 50k errors | €26/mo |
| Better Uptime Starter | 20 monitors | €20/mo |
| Cloudflare R2 | 50GB storage | €5/mo |
| Grafana Cloud | 50k series | €49/mo |
| Cloudflare Workers Paid | 10M req/mo | €5/mo |

**Totaal: ~€105/maand**

### 7.3 Cost Optimization Tips

1. **Sample Sentry transactions** - 10% is genoeg voor performance
2. **Aggregate logs before storing** - Niet elk request loggen
3. **Use Cloudflare Analytics Engine** - Gratis, native
4. **Archive old data** - R2 is goedkoper dan D1 voor archives
5. **Batch D1 writes** - Minder writes = minder kosten

---

## 8. Health Check Endpoints

### 8.1 MCP Server Health Check

```typescript
// GET /health
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  checks: {
    database: ComponentHealth;
    exact_api?: ComponentHealth;
    rate_limiter: ComponentHealth;
  };
  latency: {
    total_ms: number;
    database_ms?: number;
  };
}

interface ComponentHealth {
  status: 'ok' | 'degraded' | 'error';
  message?: string;
  latency_ms?: number;
}
```

**Implementation:**

```typescript
// apps/mcp-server/src/routes/health.ts
export async function handleHealth(env: Env): Promise<Response> {
  const start = Date.now();
  const checks: HealthResponse['checks'] = {
    database: { status: 'ok' },
    rate_limiter: { status: 'ok' },
  };

  // Check D1
  const dbStart = Date.now();
  try {
    await env.DB.prepare('SELECT 1').first();
    checks.database = {
      status: 'ok',
      latency_ms: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: 'error',
      message: 'Database unreachable',
    };
  }

  // Determine overall status
  const hasError = Object.values(checks).some(c => c.status === 'error');
  const hasDegraded = Object.values(checks).some(c => c.status === 'degraded');

  const response: HealthResponse = {
    status: hasError ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy',
    version: '1.0.0', // From package.json or env
    timestamp: new Date().toISOString(),
    checks,
    latency: {
      total_ms: Date.now() - start,
      database_ms: checks.database.latency_ms,
    },
  };

  return new Response(JSON.stringify(response), {
    status: response.status === 'healthy' ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 8.2 Deep Health Check (Authenticated)

```typescript
// GET /health/deep (requires admin API key)
interface DeepHealthResponse extends HealthResponse {
  checks: {
    database: ComponentHealth;
    exact_api: ComponentHealth;
    oauth: ComponentHealth;
    rate_limiter: ComponentHealth;
    cache: ComponentHealth;
  };
  metrics: {
    active_connections: number;
    requests_today: number;
    error_rate_1h: number;
  };
}
```

### 8.3 Exact Online Status Probe

```typescript
// Internal function for monitoring Exact Online
async function checkExactOnlineHealth(): Promise<ComponentHealth> {
  try {
    const start = Date.now();
    // Use a lightweight endpoint
    const response = await fetch('https://start.exactonline.nl/api/v1/current/Me', {
      method: 'HEAD',
      headers: { 'Authorization': 'Bearer invalid' }, // Will get 401, but confirms API is up
    });

    if (response.status === 401 || response.status === 200) {
      return {
        status: 'ok',
        latency_ms: Date.now() - start,
      };
    }

    return {
      status: 'degraded',
      message: `Unexpected status: ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Exact Online API unreachable',
    };
  }
}
```

### 8.4 Synthetic Monitoring Endpoints

Voor externe monitoring tools (Better Uptime, Checkly):

```typescript
// GET /health/synthetic
// Simulates a real user flow (lightweight)
export async function handleSyntheticHealth(env: Env): Promise<Response> {
  const results = {
    auth_check: false,
    tools_list: false,
    database: false,
  };

  // 1. Check tools endpoint works
  try {
    const tools = getRegisteredTools(); // From tool registry
    results.tools_list = tools.length > 0;
  } catch {}

  // 2. Check database
  try {
    await env.DB.prepare('SELECT COUNT(*) FROM users').first();
    results.database = true;
  } catch {}

  // 3. Check auth system (with test key if configured)
  if (env.SYNTHETIC_TEST_KEY) {
    try {
      const auth = await validateApiKey(env.SYNTHETIC_TEST_KEY, env);
      results.auth_check = auth !== null;
    } catch {}
  } else {
    results.auth_check = true; // Skip if no test key
  }

  const allPassed = Object.values(results).every(v => v);

  return new Response(JSON.stringify({
    status: allPassed ? 'pass' : 'fail',
    timestamp: new Date().toISOString(),
    checks: results,
  }), {
    status: allPassed ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## 9. Log Management

### 9.1 Wat Loggen We?

| Level | Wat | Voorbeeld | Retentie |
|-------|-----|-----------|----------|
| **ERROR** | Alle exceptions, API fouten | `TokenExpiredError`, `ExactAPIError` | 90 dagen |
| **WARN** | Rate limits, degraded state | `Rate limited, retrying...` | 30 dagen |
| **INFO** | Request summary, tool execution | `Tool X executed in 234ms` | 7 dagen |
| **DEBUG** | Detailed flow (dev only) | Query parameters, response headers | 1 dag |

### 9.2 PII Handling

**NOOIT loggen:**
- Boekhoudkundige data (bedragen, facturen, etc.)
- Volledige email adressen
- Exact Online access tokens
- API keys (alleen laatste 4 karakters)

**Wel loggen (geanonimiseerd):**
- User ID (intern)
- Request ID
- Tool naam
- Response tijden
- Error types (zonder data)

```typescript
// PII Masking utilities
function maskApiKey(key: string): string {
  return `****${key.slice(-4)}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
}

function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };

  // Remove sensitive fields
  delete sanitized.accessToken;
  delete sanitized.refreshToken;
  delete sanitized.apiKey;

  // Mask if present
  if (sanitized.email) sanitized.email = maskEmail(sanitized.email as string);
  if (sanitized.key) sanitized.key = maskApiKey(sanitized.key as string);

  return sanitized;
}
```

### 9.3 Log Schema

```typescript
interface LogEntry {
  // Identification
  timestamp: string;        // ISO 8601
  requestId: string;        // req_xxx
  level: 'debug' | 'info' | 'warn' | 'error';

  // Context
  service: 'mcp-server' | 'auth-portal';
  environment: 'development' | 'production';

  // Request info
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;

  // User context (no PII)
  userId?: string;
  planType?: string;

  // Tool context
  tool?: string;
  divisionCode?: string;

  // Error context
  errorType?: string;
  errorMessage?: string;
  stackTrace?: string;       // Only in non-prod

  // Message
  message: string;
}
```

---

## 10. Incident Response

### 10.1 Runbook Template

```markdown
# Incident Runbook: [INCIDENT_TYPE]

## Classification
- **Severity:** Critical / High / Medium / Low
- **Impact:** [Beschrijving van impact]
- **Detection:** [Hoe gedetecteerd - alert, klant melding, etc.]

## Symptoms
- [ ] Symptoom 1
- [ ] Symptoom 2

## Initial Triage (< 5 min)
1. [ ] Bevestig incident via dashboards
2. [ ] Check Cloudflare Status
3. [ ] Check Exact Online Status
4. [ ] Bepaal scope (hoeveel users affected)

## Investigation Steps
1. [ ] Stap 1
2. [ ] Stap 2

## Resolution Options
### Option A: [Naam]
- Actie: ...
- Risico: ...
- Tijd: ...

### Option B: [Naam]
- Actie: ...

## Rollback Procedure
```bash
# If caused by recent deployment
wrangler rollback
```

## Communication
- **Internal:** Slack #incidents
- **External:** Status page update
- **Template:** [Zie onderstaand]

## Post-Incident
- [ ] Update status page to resolved
- [ ] Schedule post-mortem
- [ ] Create follow-up tickets
```

### 10.2 Common Incident Runbooks

#### Exact Online API Outage

```markdown
# Runbook: Exact Online API Outage

## Detection
- Alert: exact_api_error_rate > 50%
- Users report: "Kan geen data ophalen"

## Impact
- Alle data ophaal operaties falen
- Auth/connecties werken nog steeds

## Triage
1. Check https://status.exactonline.com
2. Verify met curl:
   ```bash
   curl -I https://start.exactonline.nl/api/v1/current/Me
   ```

## Actions
1. **Niet onze schuld** - geen code changes nodig
2. Update status page: "Degraded - External dependency"
3. Monitor Exact status page voor updates
4. Consider: enable cached/stale responses

## Communication
Status page update:
> We ervaren momenteel problemen met het ophalen van data door een storing bij Exact Online. We monitoren de situatie actief. De service herstelt automatisch zodra Exact Online weer beschikbaar is.

## Recovery
- Automatic once Exact Online recovers
- Verify with health check
- Update status page to "Operational"
```

#### Token Refresh Failures

```markdown
# Runbook: Mass Token Refresh Failures

## Detection
- Alert: token_refresh_failure_rate > 10%
- Sentry: TokenExpiredError spike

## Impact
- Users cannot access Exact data
- Must re-authenticate

## Triage
1. Check affected user count:
   ```sql
   SELECT COUNT(*) FROM connections WHERE status = 'refresh_failed';
   ```
2. Check Exact OAuth endpoint:
   ```bash
   curl -X POST https://start.exactonline.nl/api/oauth2/token
   ```
3. Verify EXACT_CLIENT_SECRET hasn't changed

## Common Causes
- Exact Online OAuth maintenance
- Client secret rotation
- User revoked access in Exact

## Actions
If Exact-side issue:
1. Wait for Exact resolution
2. Auto-retry will handle recovery

If our-side issue:
1. Check recent deployments
2. Verify secrets are correct
3. Rollback if necessary

## Recovery
```sql
-- Reset failed connections for retry
UPDATE connections SET status = 'pending_refresh'
WHERE status = 'refresh_failed' AND updated_at > datetime('now', '-1 hour');
```
```

### 10.3 Communication Templates

#### Status Page - Investigating

> **[Investigating] Verhoogde error rates**
>
> We onderzoeken momenteel verhoogde error rates in onze API. Sommige requests kunnen falen of langzamer zijn dan normaal. We houden u op de hoogte van updates.
>
> *Laatste update: [tijd]*

#### Status Page - Identified

> **[Identified] Problemen met data ophalen**
>
> We hebben de oorzaak van de verhoogde error rates geïdentificeerd: [oorzaak]. We werken aan een oplossing.
>
> **Impact:** Sommige gebruikers kunnen problemen ervaren met het ophalen van boekhouddata.
>
> *Laatste update: [tijd]*

#### Status Page - Resolved

> **[Resolved] Service hersteld**
>
> De problemen met [omschrijving] zijn opgelost. De service functioneert weer normaal. We bieden onze excuses aan voor het ongemak.
>
> **Duur:** [start] - [eind] ([X] minuten)
> **Impact:** [Y] gebruikers ondervonden [omschrijving]
>
> *Een post-mortem volgt binnen 48 uur.*

---

## 11. Implementation Roadmap

### Week 1: Foundation

- [ ] Implement structured Logger class
- [ ] Add request ID tracking
- [ ] Set up Sentry account and install SDK
- [ ] Deploy initial error tracking

### Week 2: Monitoring

- [ ] Set up Better Uptime account
- [ ] Configure 3 health check monitors
- [ ] Create status page
- [ ] Configure alert channels (Slack, Email)

### Week 3: Metrics & Dashboards

- [ ] Enable Cloudflare Workers Analytics
- [ ] Create metrics database table
- [ ] Build basic executive dashboard
- [ ] Set up Grafana Cloud (optional)

### Week 4: Documentation & Processes

- [ ] Document runbooks for common incidents
- [ ] Set up on-call rotation (if >1 person)
- [ ] Create SLA documentation
- [ ] Configure log retention policies

### Future (As Needed)

- [ ] R2 log archive setup
- [ ] Advanced Grafana dashboards
- [ ] Synthetic monitoring expansion
- [ ] Custom metrics export

---

## Appendix A: Tool Comparison Details

### Sentry vs Alternatives

| Feature | Sentry | Rollbar | Bugsnag |
|---------|--------|---------|---------|
| CF Workers SDK | ✅ Native | ❌ No | ❌ No |
| Free tier | 5k errors | 5k errors | 7.5k errors |
| Price (Team) | €26/mo | €31/mo | €25/mo |
| Performance monitoring | ✅ | ❌ | ✅ |
| Cloudflare integration | ✅ Best | ⚠️ Manual | ⚠️ Manual |

**Verdict:** Sentry - beste Cloudflare integratie

### Uptime Monitoring

| Feature | Better Uptime | UptimeRobot | Checkly |
|---------|---------------|-------------|---------|
| Free monitors | 5 | 50 | 5 |
| Status page (free) | ✅ | ✅ | ❌ |
| EU locations | ✅ | ✅ | ✅ |
| Min interval | 30s | 5min | 60s |
| Price (starter) | €20/mo | €8/mo | €30/mo |

**Verdict:** Better Uptime - beste free tier met status page

---

## Appendix B: Cloudflare Limits Reference

| Resource | Free | Paid | Our Usage |
|----------|------|------|-----------|
| Workers requests/day | 100k | 10M+ | ~50k |
| Workers CPU time | 10ms | 50ms | ~5ms avg |
| D1 reads/day | 5M | 25B | ~500k |
| D1 writes/day | 100k | 50M | ~10k |
| D1 storage | 5GB | 10GB | ~500MB |
| R2 storage | 10GB | Unlimited | ~5GB logs |

---

*Dit document wordt bijgewerkt naarmate de applicatie groeit en requirements veranderen.*
