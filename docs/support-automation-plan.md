# Support System Automation Plan

## Huidige Staat vs Doel

### Huidige Staat (Manual)
```
User Error → User maakt ticket → AI keyword match → Template response → Admin bekijkt → Handmatig antwoord
```

**Problemen:**
- 80% van vragen zijn repetitief
- Admins besteden tijd aan eenvoudige issues
- Geen proactieve support
- Errors worden niet automatisch gedetecteerd
- Geen learning loop

### Doel (90% Geautomatiseerd)
```
                                    ┌─────────────────────────────────────┐
                                    │     PROACTIEVE DETECTIE            │
                                    │  (Errors, Token Expiry, Usage)     │
                                    └────────────────┬────────────────────┘
                                                     │
                                                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────────┐
│  User Error  │───▶│ Auto-Ticket  │───▶│     CLAUDE SUPPORT AGENT         │
│  or Question │    │  Creation    │    │  - Semantic understanding        │
└──────────────┘    └──────────────┘    │  - Context-aware responses       │
                                        │  - Pattern matching + learning   │
                                        └───────────────┬──────────────────┘
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        │                               │                               │
                        ▼                               ▼                               ▼
            ┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
            │   AUTO-RESOLVE    │         │   ESCALATE TO     │         │   ESCALATE TO     │
            │   (90% of issues) │         │   DEVOPS AGENT    │         │   HUMAN ADMIN     │
            │                   │         │   (Bugs/Infra)    │         │   (Complex)       │
            └───────────────────┘         └─────────┬─────────┘         └───────────────────┘
                                                    │
                                                    ▼
                                        ┌───────────────────┐
                                        │  AUTO-FIX + PR    │
                                        │  GitHub Integration│
                                        └───────────────────┘
```

---

## Fase 1: Foundation (Week 1-2)

### 1.1 Claude API Integratie voor Support Agent

**Doel:** Support Agent daadwerkelijk laten communiceren met Claude.

**Files te wijzigen:**
- `packages/ai-agents/src/support-agent/index.ts`
- `packages/ai-agents/src/lib/anthropic.ts` (nieuw)

**Implementatie:**
```typescript
// packages/ai-agents/src/lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

export async function runAgent(
  systemPrompt: string,
  tools: Tool[],
  messages: Message[],
  env: { ANTHROPIC_API_KEY: string }
): Promise<AgentResponse> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  // Tool loop - Claude calls tools until done
  while (true) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      })),
      messages,
    });

    // Handle tool calls
    if (response.stop_reason === 'tool_use') {
      const toolCalls = response.content.filter(c => c.type === 'tool_use');
      const results = await executeTools(toolCalls, tools);
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: results });
      continue;
    }

    return extractFinalResponse(response);
  }
}
```

### 1.2 Error Capture Pipeline

**Doel:** MCP server errors automatisch vastleggen.

**Nieuwe files:**
- `apps/mcp-server/src/middleware/error-capture.ts`
- `apps/auth-portal/src/pages/api/webhooks/mcp-error.ts`

**Database update:**
```sql
-- Migration: 0010_error_capture.sql
ALTER TABLE support_error_log ADD COLUMN auto_ticket_created BOOLEAN DEFAULT FALSE;
ALTER TABLE support_error_log ADD COLUMN ticket_id TEXT REFERENCES support_conversations(id);
ALTER TABLE support_error_log ADD COLUMN user_notified BOOLEAN DEFAULT FALSE;
```

**Flow:**
```
MCP Error → error-capture middleware → POST /api/webhooks/mcp-error →
  1. Log to support_error_log
  2. Check if user has recent similar error
  3. If new error type → Create auto-ticket
  4. If existing ticket → Add context
  5. Trigger Support Agent
```

### 1.3 Support Agent Tool Implementaties

**Implementeer de 7 stubbed tools:**

| Tool | Implementatie |
|------|---------------|
| `search_docs` | Query knowledge_articles met semantic search |
| `get_customer_status` | Query connections + api_usage |
| `get_customer_errors` | Query support_error_log |
| `check_known_issues` | Match tegen support_patterns |
| `trigger_reauth` | Send re-auth email via automation.ts |
| `escalate_to_devops` | Create DevOps agent task |
| `respond_to_customer` | Add message to conversation |

---

## Fase 2: Intelligent Triage (Week 3-4)

### 2.1 Semantic Search met Embeddings

**Doel:** Vragen matchen op betekenis, niet alleen keywords.

**Implementatie opties:**

**Optie A: Cloudflare Vectorize (Aanbevolen)**
```typescript
// Voordelen: Native D1 integratie, geen extra kosten
// Setup in wrangler.toml:
[[vectorize]]
binding = "VECTORIZE"
index_name = "support-embeddings"
```

**Optie B: Voyage AI (Alternatief)**
```typescript
// Voyage AI heeft de beste embeddings voor Q&A
// Cost: $0.10 per 1M tokens
```

**Database update:**
```sql
-- Migration: 0011_embeddings.sql
CREATE TABLE IF NOT EXISTS support_embeddings (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL, -- 'article', 'conversation', 'pattern'
  source_id TEXT NOT NULL,
  content_hash TEXT NOT NULL, -- For cache invalidation
  embedding_model TEXT DEFAULT 'voyage-3',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_embeddings_source ON support_embeddings(source_type, source_id);
```

**Flow voor nieuwe vraag:**
```
1. User vraag → Generate embedding
2. Vector search in Vectorize → Top 5 similar items
3. Pass to Claude met context:
   - Similar resolved conversations
   - Relevant articles
   - Matching patterns
4. Claude generates personalized response
```

### 2.2 Confidence Scoring 2.0

**Huidige state:** Simpele keyword match ratio (0-1)

**Nieuwe aanpak:**
```typescript
interface AdvancedConfidence {
  semantic_similarity: number;      // Embedding distance (0-1)
  pattern_match: number;            // Keyword/regex score (0-1)
  user_history_relevance: number;   // Past issues similarity (0-1)
  error_code_match: number;         // Exact error code hit (0 or 1)

  // Weighted final score
  final: number; // weighted average

  // Decision
  action: 'auto_respond' | 'suggest_articles' | 'escalate';
}

function calculateConfidence(analysis: TriageResult): AdvancedConfidence {
  const weights = {
    semantic: 0.4,
    pattern: 0.3,
    history: 0.2,
    error: 0.1,
  };

  const final =
    analysis.semantic_similarity * weights.semantic +
    analysis.pattern_match * weights.pattern +
    analysis.user_history_relevance * weights.history +
    analysis.error_code_match * weights.error;

  return {
    ...analysis,
    final,
    action: final >= 0.85 ? 'auto_respond' :
            final >= 0.6 ? 'suggest_articles' : 'escalate',
  };
}
```

### 2.3 Auto-Response Pipeline

**Wanneer auto-respond (confidence >= 0.85):**
```
1. Support Agent analyseert vraag
2. Agent roept tools aan:
   - search_docs → Relevante artikelen
   - get_customer_status → Account context
   - check_known_issues → Bekende problemen
3. Agent genereert gepersonaliseerd antwoord
4. Response wordt verstuurd met:
   - Antwoord op vraag
   - Links naar relevante artikelen
   - Specifieke stappen voor hun situatie
5. Follow-up na 24u: "Is je probleem opgelost?"
```

---

## Fase 3: Proactive Support (Week 5-6)

### 3.1 Token Expiry Monitoring

**Huidige state:** Check in daily cron, alert als al verlopen.

**Verbetering:**
```typescript
// automation.ts - nieuwe functie
async function proactiveTokenMonitoring(db: Database) {
  // Check tokens expiring in 7 days
  const expiringTokens = await db.all(`
    SELECT c.*, u.email, u.name
    FROM connections c
    JOIN users u ON c.user_id = u.id
    WHERE c.token_expires_at < datetime('now', '+7 days')
    AND c.token_expires_at > datetime('now')
    AND c.expiry_alert_sent = 0
  `);

  for (const conn of expiringTokens) {
    // Create proactive support conversation
    await db.createConversation({
      user_id: conn.user_id,
      subject: 'Je Exact Online verbinding verloopt binnenkort',
      category: 'connection',
      priority: 'high',
      handled_by: 'system',
    });

    // Add system message with re-auth link
    await db.addMessage(convId, {
      sender_type: 'system',
      content: `Je OAuth token verloopt op ${formatDate(conn.token_expires_at)}.

Klik hier om opnieuw te verbinden: ${reAuthUrl}

Dit voorkomt onderbrekingen in je AI assistent.`,
    });

    // Send email
    await sendProactiveEmail(conn);

    // Mark as alerted
    await db.run(`UPDATE connections SET expiry_alert_sent = 1 WHERE id = ?`, [conn.id]);
  }
}
```

### 3.2 Error Pattern Detection

**Doel:** Detecteer error spikes voordat users klagen.

```typescript
// automation.ts - nieuwe functie
async function detectErrorSpikes(db: Database) {
  // Get error counts per type in last hour vs last 24h average
  const spikes = await db.all(`
    WITH hourly AS (
      SELECT error_type, COUNT(*) as count_1h
      FROM support_error_log
      WHERE created_at > datetime('now', '-1 hour')
      GROUP BY error_type
    ),
    daily AS (
      SELECT error_type, COUNT(*) / 24.0 as avg_hourly
      FROM support_error_log
      WHERE created_at > datetime('now', '-24 hours')
      GROUP BY error_type
    )
    SELECT h.error_type, h.count_1h, d.avg_hourly,
           h.count_1h / NULLIF(d.avg_hourly, 0) as spike_ratio
    FROM hourly h
    JOIN daily d ON h.error_type = d.error_type
    WHERE h.count_1h > 5
    AND h.count_1h / NULLIF(d.avg_hourly, 0) > 3
  `);

  for (const spike of spikes) {
    // Alert admin
    await notifyAdmin('error_spike', {
      type: spike.error_type,
      current: spike.count_1h,
      normal: spike.avg_hourly,
      ratio: spike.spike_ratio,
    });

    // Check if known issue
    const pattern = await db.getPatternByErrorType(spike.error_type);
    if (!pattern) {
      // Escalate to DevOps
      await escalateToDevOps({
        type: 'error_spike',
        error_type: spike.error_type,
        count: spike.count_1h,
        sample_errors: await db.getRecentErrors(spike.error_type, 5),
      });
    }
  }
}
```

### 3.3 Usage Pattern Alerts

**Detecteer problemen gebaseerd op gebruikspatronen:**

```typescript
async function detectUsageAnomalies(db: Database) {
  // Users met plots geen activiteit (hadden normaal dagelijks)
  const inactiveUsers = await db.all(`
    SELECT u.*,
           MAX(au.created_at) as last_activity,
           COUNT(CASE WHEN au.created_at > datetime('now', '-30 days') THEN 1 END) as calls_30d
    FROM users u
    JOIN api_usage au ON u.id = au.user_id
    WHERE u.plan != 'free'
    GROUP BY u.id
    HAVING calls_30d > 100
    AND last_activity < datetime('now', '-3 days')
  `);

  for (const user of inactiveUsers) {
    // Check for recent errors
    const errors = await db.getRecentErrors({ user_id: user.id, limit: 5 });

    if (errors.length > 0) {
      // Create proactive support ticket
      await createProactiveTicket(user, 'activity_drop', errors);
    }
  }
}
```

---

## Fase 4: Learning System (Week 7-8)

### 4.1 Pattern Learning van Resolved Tickets

**Trigger:** Ticket marked as resolved met rating >= 4

```typescript
async function learnFromResolution(db: Database, conversationId: string) {
  const conv = await db.getConversation(conversationId);
  const messages = await db.getMessages(conversationId);

  // Only learn from successful resolutions
  if (conv.satisfaction_rating < 4) return;

  // Extract key information using Claude
  const analysis = await analyzeConversation(messages);

  // Check if this is a new pattern
  const existingPatterns = await db.getActivePatterns();
  const similarity = await findSimilarPattern(analysis, existingPatterns);

  if (similarity.best_match < 0.7) {
    // New pattern - suggest for review
    const suggestedPattern = await generatePattern(analysis);
    await db.createPatternSuggestion({
      ...suggestedPattern,
      source_conversation_id: conversationId,
      status: 'pending_review',
      confidence: analysis.pattern_confidence,
    });

    // Notify admin
    await notifyAdmin('new_pattern_suggestion', suggestedPattern);
  } else {
    // Existing pattern - update effectiveness
    await db.trackPatternUsage(similarity.pattern_id, {
      times_resolved: 1,
      avg_satisfaction: conv.satisfaction_rating,
    });
  }
}
```

### 4.2 Automatic Article Generation

**Trigger:** 3+ vergelijkbare resolved tickets zonder artikel

```typescript
async function suggestArticleGeneration(db: Database) {
  // Find conversation clusters without articles
  const clusters = await findConversationClusters(db, {
    min_conversations: 3,
    min_resolution_rate: 0.8,
    no_linked_article: true,
  });

  for (const cluster of clusters) {
    // Generate article draft using Claude
    const draft = await generateArticleDraft(cluster.conversations);

    // Create draft article
    await db.createArticle({
      slug: generateSlug(draft.title),
      title_nl: draft.title_nl,
      title_en: draft.title_en,
      content_nl: draft.content_nl,
      content_en: draft.content_en,
      category: cluster.category,
      tags: draft.extracted_tags,
      published: false, // Draft for review
      auto_generated: true,
      source_conversations: cluster.conversation_ids,
    });

    // Notify admin for review
    await notifyAdmin('article_draft_ready', draft);
  }
}
```

### 4.3 Pattern Effectiveness Optimization

```typescript
async function optimizePatterns(db: Database) {
  const patterns = await db.getAllPatterns();

  for (const pattern of patterns) {
    const effectiveness = pattern.times_resolved / pattern.times_triggered;

    if (effectiveness < 0.3 && pattern.times_triggered > 20) {
      // Low effectiveness - suggest deactivation
      await db.updatePattern(pattern.id, {
        active: false,
        deactivation_reason: 'low_effectiveness',
      });
      await notifyAdmin('pattern_deactivated', pattern);
    }

    if (effectiveness > 0.9 && pattern.times_triggered > 50) {
      // High effectiveness - lower confidence threshold
      const newThreshold = Math.max(0.5, pattern.min_confidence - 0.1);
      await db.updatePattern(pattern.id, {
        min_confidence: newThreshold,
      });
    }
  }
}
```

---

## Fase 5: DevOps Integration (Week 9-10)

### 5.1 Sentry Webhook Handler

```typescript
// apps/auth-portal/src/pages/api/webhooks/sentry.ts
export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;
  const payload = await request.json();

  // Validate Sentry signature
  if (!verifySentrySignature(request, env.SENTRY_SECRET)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const { event, project } = payload;

  // Log error
  await db.logError({
    error_type: event.exception?.values?.[0]?.type || 'unknown',
    error_message: event.exception?.values?.[0]?.value || '',
    error_context: JSON.stringify(event.contexts),
    stack_trace: event.exception?.values?.[0]?.stacktrace?.frames,
    sentry_event_id: event.event_id,
  });

  // Check severity
  if (event.level === 'fatal' || event.level === 'error') {
    // Trigger DevOps Agent
    await triggerDevOpsAgent({
      sentry_event_id: event.event_id,
      error_type: event.exception?.values?.[0]?.type,
      affected_users: event.tags?.user_count || 1,
    });
  }

  return new Response('OK');
};
```

### 5.2 DevOps Agent Tool Implementations

```typescript
// packages/ai-agents/src/devops-agent/tools.ts

export const tools: Tool[] = [
  {
    name: 'get_sentry_issue',
    description: 'Fetch details about a Sentry error',
    async execute({ event_id }, env) {
      const response = await fetch(
        `https://sentry.io/api/0/issues/${event_id}/`,
        { headers: { Authorization: `Bearer ${env.SENTRY_TOKEN}` } }
      );
      return response.json();
    },
  },

  {
    name: 'search_code',
    description: 'Search the codebase for relevant code',
    async execute({ query, file_pattern }, env) {
      // Use GitHub code search API
      const response = await fetch(
        `https://api.github.com/search/code?q=${query}+repo:werkenmetai/Exact-online-MCP`,
        { headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}` } }
      );
      return response.json();
    },
  },

  {
    name: 'create_fix_pr',
    description: 'Create a pull request with a fix',
    async execute({ branch, title, body, files }, env) {
      const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

      // Create branch
      await octokit.git.createRef({
        owner: 'werkenmetai',
        repo: 'Exact-online-MCP',
        ref: `refs/heads/${branch}`,
        sha: await getMainSha(octokit),
      });

      // Update files
      for (const file of files) {
        await octokit.repos.createOrUpdateFileContents({
          owner: 'werkenmetai',
          repo: 'Exact-online-MCP',
          path: file.path,
          message: `fix: ${title}`,
          content: Buffer.from(file.content).toString('base64'),
          branch,
        });
      }

      // Create PR
      const pr = await octokit.pulls.create({
        owner: 'werkenmetai',
        repo: 'Exact-online-MCP',
        title: `fix: ${title}`,
        body,
        head: branch,
        base: 'main',
      });

      return { pr_url: pr.data.html_url, pr_number: pr.data.number };
    },
  },
];
```

### 5.3 Auto-Fix Pipeline

```
Sentry Error (fatal/error)
    │
    ▼
DevOps Agent Triggered
    │
    ├── get_sentry_issue → Error details
    │
    ├── search_code → Find affected code
    │
    ├── Analyze with Claude:
    │   - Root cause
    │   - Fix approach
    │   - Impact assessment
    │
    ├── If confidence >= 0.9:
    │   └── create_fix_pr → Auto-PR
    │
    └── If confidence < 0.9:
        └── notify_human → Slack alert with analysis
```

---

## Fase 6: Admin Automation Dashboard (Week 11-12)

### 6.1 Real-time Metrics

```typescript
// API: GET /api/admin/support/automation/metrics
interface AutomationMetrics {
  // Resolution rates
  auto_resolved_24h: number;
  human_resolved_24h: number;
  pending_24h: number;
  auto_resolution_rate: number; // target: 90%

  // Agent performance
  support_agent: {
    invocations_24h: number;
    avg_response_time_ms: number;
    success_rate: number;
  };
  devops_agent: {
    invocations_24h: number;
    prs_created: number;
    prs_merged: number;
  };

  // Pattern effectiveness
  patterns: {
    total: number;
    active: number;
    avg_effectiveness: number;
    top_performing: Pattern[];
    needs_attention: Pattern[];
  };

  // Learning
  suggestions: {
    pending_patterns: number;
    pending_articles: number;
    auto_approved_7d: number;
  };

  // Proactive support
  proactive: {
    token_warnings_sent: number;
    error_spikes_detected: number;
    issues_prevented: number; // estimated
  };
}
```

### 6.2 Automation Rules Interface

```typescript
// Database: automation_rules table
interface AutomationRule {
  id: string;
  name: string;
  trigger_type: 'error' | 'ticket' | 'pattern' | 'schedule';
  trigger_condition: JSONCondition;
  actions: AutomationAction[];
  enabled: boolean;
  created_by: string;
  last_triggered: string;
  trigger_count: number;
}

interface AutomationAction {
  type: 'create_ticket' | 'send_email' | 'trigger_agent' | 'escalate' | 'webhook';
  config: Record<string, any>;
}

// Voorbeeld regels:
const defaultRules: AutomationRule[] = [
  {
    name: 'Auto-ticket voor 5xx errors',
    trigger_type: 'error',
    trigger_condition: { status_code: { $gte: 500 } },
    actions: [
      { type: 'create_ticket', config: { priority: 'high', category: 'bug' } },
      { type: 'trigger_agent', config: { agent: 'support' } },
    ],
  },
  {
    name: 'Escalate na 4 uur zonder response',
    trigger_type: 'schedule',
    trigger_condition: {
      status: 'waiting_support',
      updated_at: { $lt: 'datetime("now", "-4 hours")' },
    },
    actions: [
      { type: 'escalate', config: { to: 'admin' } },
      { type: 'send_email', config: { template: 'escalation_alert' } },
    ],
  },
];
```

---

## Implementatie Prioriteit

### Must Have (Week 1-4)
1. ✅ Claude API integratie voor Support Agent
2. ✅ Error capture middleware
3. ✅ Support Agent tool implementaties
4. ✅ Basic semantic search

### Should Have (Week 5-8)
5. Proactive token monitoring
6. Error spike detection
7. Pattern learning
8. Auto-article suggestions

### Nice to Have (Week 9-12)
9. DevOps Agent integration
10. Sentry webhook
11. Auto-fix PRs
12. Full automation dashboard

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Auto-resolution rate | 0% | 80% |
| Avg first response time | >4h | <5min |
| Admin time per ticket | ~15min | <2min |
| Pattern coverage | 6 patterns | 50+ patterns |
| Proactive issues caught | 0% | 30% |
| Customer satisfaction | N/A | >4.5/5 |

---

## Risico's en Mitigatie

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| AI hallucinaties | Verkeerde antwoorden | Confidence threshold + review |
| Over-automation | Klant frustratie | Altijd optie voor menselijke hulp |
| Token costs | Budget | Caching + rate limiting |
| Sentry API limits | Gemiste errors | Batch processing + fallback |
| GitHub rate limits | Geen auto-PRs | Scheduled batching |
