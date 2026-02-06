# Task: DevOps Agent Implementation Audit

**TaskId**: TASK-W05-006
**Agent**: dirk-devops-lead
**Week**: 2026-W05
**Priority**: Should Do
**Created**: 2026-01-29
**Completed**: 2026-01-29
**Status**: SUCCESS

---

## Executive Summary

De DevOps Agent (`packages/ai-agents/src/devops-agent/`) is volledig scaffold-level code. **Alle 10 tools zijn placeholders** die enkel naar console loggen en `{ message: 'Not yet implemented' }` retourneren. Er is geen enkele werkende functionaliteit.

**Key Findings:**
- 0/10 tools werkend
- Geen externe integraties geconfigureerd
- GitHub Actions workflow ook placeholder
- Support Agent WEL functioneel (goede referentie)
- Estimated total effort: 8-12 dev-dagen

**Aanbeveling:** Implementeer incrementeel, start met read-only tools die waarde leveren zonder risico.

---

## Huidige Status per Tool

| # | Tool | Status | Dependencies | Effort | Prioriteit |
|---|------|--------|--------------|--------|------------|
| 1 | `get_sentry_issue` | PLACEHOLDER | Sentry API token | M (4h) | P1 |
| 2 | `read_file` | PLACEHOLDER | GitHub API (Octokit) | S (2h) | P1 |
| 3 | `search_code` | PLACEHOLDER | GitHub Code Search API | S (2h) | P1 |
| 4 | `create_branch` | PLACEHOLDER | GitHub API (Octokit) | M (3h) | P2 |
| 5 | `update_file` | PLACEHOLDER | GitHub API (Octokit) | M (4h) | P2 |
| 6 | `run_tests` | PLACEHOLDER | GitHub Actions API | L (6h) | P3 |
| 7 | `create_pr` | PLACEHOLDER | GitHub API (Octokit) | M (4h) | P2 |
| 8 | `add_known_issue` | PLACEHOLDER | Database (Supabase) | S (2h) | P2 |
| 9 | `deploy_staging` | PLACEHOLDER | GitHub Actions API | L (6h) | P4 |
| 10 | `notify_support_agent` | PLACEHOLDER | Inter-agent messaging | M (4h) | P3 |

**Status Legend:**
- PLACEHOLDER: Alleen console.log, geen functionaliteit
- PARTIAL: Deels werkend
- WORKING: Volledig functioneel

**Effort Legend:** S = 1-2h, M = 3-4h, L = 5-8h, XL = 8h+

---

## Code Analyse

### Huidige Implementatie (tools.ts)

```typescript
// Typisch voorbeeld - ALLE tools volgen dit patroon:
execute: async ({ issue_id }) => {
  // TODO: Implement Sentry API integration
  console.log(`[DevOps] Getting Sentry issue: ${issue_id}`);
  return { issue: null, message: 'Not yet implemented' };
}
```

### DevOpsAgent Class (index.ts)

```typescript
// Beide main methods zijn ook placeholders:
async handleSentryAlert(issueId: string, _context: DevOpsContext): Promise<DevOpsResult> {
  // TODO: Implement when we have integrations ready
  console.log(`[DevOps Agent] Handling Sentry issue: ${issueId}`);
  return { issueId, action: 'pending', message: 'DevOps agent not yet implemented' };
}
```

### Vergelijking met Support Agent

| Aspect | Support Agent | DevOps Agent |
|--------|---------------|--------------|
| Tools werkend | 7/7 (100%) | 0/10 (0%) |
| Context injection | Ja | Nee |
| Error handling | Ja | Nee |
| Database integratie | Ja | Nee |
| Factory pattern | `createSupportAgentTools(context)` | Direct export array |

**Conclusie:** Support Agent is een goede referentie voor de DevOps Agent implementatie.

---

## Benodigde Externe Integraties

### 1. Sentry API (Kritiek)

**Benodigd voor:** `get_sentry_issue`

**Setup:**
```typescript
// Benodigde package: @sentry/node of direct API calls
// Environment variable: SENTRY_AUTH_TOKEN
// API endpoint: https://sentry.io/api/0/issues/{issue_id}/
```

**Status:** Sentry client al aanwezig in `apps/mcp-server/src/monitoring/sentry.ts` maar dit is voor error tracking, niet API access. Aparte Sentry API client nodig.

**Effort:** 4 uur (API client + error handling)

### 2. GitHub API / Octokit (Kritiek)

**Benodigd voor:** `read_file`, `search_code`, `create_branch`, `update_file`, `create_pr`

**Setup:**
```typescript
// Package: @octokit/rest
// Environment variable: GITHUB_TOKEN
// Scopes needed: repo, workflow
```

**Status:** Geen Octokit package aanwezig in package.json.

**Effort:**
- Basis setup: 2 uur
- Per tool: 2-4 uur
- Totaal: ~16 uur

### 3. GitHub Actions API

**Benodigd voor:** `run_tests`, `deploy_staging`

**Setup:**
```typescript
// Via Octokit: octokit.actions.createWorkflowDispatch()
// Workflow polling voor resultaat
```

**Status:** `ai-devops-agent.yml` workflow bestaat maar is placeholder.

**Effort:** 6 uur per tool (workflow trigger + polling + result parsing)

### 4. Database (Supabase)

**Benodigd voor:** `add_known_issue`

**Setup:**
```typescript
// Package: @supabase/supabase-js (al aanwezig)
// Table: known_issues (te creeren)
```

**Status:** Supabase client al geconfigureerd, tabel moet aangemaakt worden.

**Effort:** 2 uur (schema + insert query)

### 5. Inter-Agent Messaging

**Benodigd voor:** `notify_support_agent`

**Setup:**
```typescript
// Optie A: Direct database (support_notifications table)
// Optie B: Event queue (Redis/BullMQ)
// Optie C: HTTP webhook naar support endpoint
```

**Status:** Geen messaging infrastructure.

**Effort:** 4 uur (database approach)

---

## Implementatie Volgorde

### Fase 1: Read-Only Tools (Quick Wins)

**Doel:** Waarde leveren zonder risico's

| Tool | Waarom eerst | Effort |
|------|--------------|--------|
| `get_sentry_issue` | Core functie, geen side effects | 4h |
| `read_file` | Basis voor code analyse | 2h |
| `search_code` | Nodig voor bug lokalisatie | 2h |

**Totaal Fase 1:** 8 uur (1 dag)

**Deliverable:** Agent kan errors analyseren en code doorzoeken.

### Fase 2: Write Tools (PR Creation)

**Doel:** Automatische bug fixes mogelijk maken

| Tool | Waarom | Effort |
|------|--------|--------|
| `create_branch` | Prerequisite voor changes | 3h |
| `update_file` | Core fix capability | 4h |
| `create_pr` | Deliverable voor human review | 4h |
| `add_known_issue` | Documentatie van issues | 2h |

**Totaal Fase 2:** 13 uur (2 dagen)

**Deliverable:** Agent kan PRs maken voor fixes.

### Fase 3: Automation (CI/CD Integration)

**Doel:** Volledige automation loop

| Tool | Waarom | Effort |
|------|--------|--------|
| `run_tests` | Validatie van fixes | 6h |
| `notify_support_agent` | Close the loop | 4h |

**Totaal Fase 3:** 10 uur (1.5 dagen)

**Deliverable:** Agent kan fixes valideren en support informeren.

### Fase 4: Deployment (Skip voor MVP)

| Tool | Waarom skippen | Effort |
|------|----------------|--------|
| `deploy_staging` | Hoog risico, weinig waarde voor MVP | 6h |

**Aanbeveling:** Skip tot na productie launch. Manual deploys via `pnpm deploy:staging` volstaan.

---

## Quick Wins vs Grote Inspanning

### Quick Wins (< 4 uur, weinig dependencies)

1. **`add_known_issue`** - Database insert, Supabase al beschikbaar
2. **`read_file`** - Simpele GitHub API call
3. **`search_code`** - GitHub Search API, goed gedocumenteerd

### Medium Effort (4-6 uur)

4. **`get_sentry_issue`** - API setup nodig, maar straightforward
5. **`create_branch`** - Octokit ref creation
6. **`create_pr`** - Octokit PR API

### Grote Inspanning (> 6 uur)

7. **`update_file`** - Moet base64 encoding, blob SHAs afhandelen
8. **`run_tests`** - Workflow dispatch + polling + result parsing
9. **`deploy_staging`** - Hoog risico, complexe state management
10. **`notify_support_agent`** - Nieuwe infrastructure nodig

---

## Effort Schatting Totaal

| Fase | Effort | Cumulatief |
|------|--------|------------|
| Fase 1 (Read-only) | 8h | 8h |
| Fase 2 (Write/PR) | 13h | 21h |
| Fase 3 (Automation) | 10h | 31h |
| Fase 4 (Deploy) | 6h | 37h |

**Totaal voor volledige implementatie:** 37 uur (~5 dev-dagen)

**MVP (Fase 1+2):** 21 uur (~3 dev-dagen)

---

## Dependencies Matrix

```
get_sentry_issue ─────────────────────────────┐
                                              │
read_file ────────────┬───────────────────────┤
                      │                       │
search_code ──────────┤                       │
                      │                       ▼
                      ├───> create_branch ───> update_file ───> create_pr
                      │           │                                  │
                      │           ▼                                  │
                      │      run_tests ◄────────────────────────────┘
                      │           │
                      │           ▼
                      └───> deploy_staging
                                  │
                                  ▼
                         notify_support_agent ───> add_known_issue
```

---

## Aanbevelingen

### Immediate Actions (Week 6)

1. **Voeg `@octokit/rest` toe aan package.json**
   ```bash
   pnpm --filter @exact-mcp/ai-agents add @octokit/rest
   ```

2. **Maak DevOpsToolContext interface**
   - Copy pattern van Support Agent
   - Inject GitHub client en Sentry client

3. **Implementeer Fase 1 tools**
   - `get_sentry_issue`, `read_file`, `search_code`
   - Test met manual workflow_dispatch

### Medium Term (Week 7-8)

4. **Implementeer Fase 2 tools** - PR creation flow
5. **Sentry webhook integratie** - Automatic triggers

### Skip for Now

- `deploy_staging` - Manual deploys volstaan
- Complex error recovery - Keep it simple

---

## Conclusie

De DevOps Agent is volledig scaffold code zonder werkende functionaliteit. De implementatie is straightforward maar vereist externe integraties (Sentry API, GitHub API).

**Recommended MVP scope:** Fase 1 + Fase 2 = 21 uur effort

Dit levert een agent die:
- Sentry errors kan analyseren
- Relevante code kan vinden
- Bug fix PRs kan maken
- Known issues kan documenteren

De automation loop (tests, deploy, notifications) kan later worden toegevoegd.

---

## Output

```json
{
  "taskId": "TASK-W05-006",
  "status": "complete",
  "summary": "DevOps Agent audit: 0/10 tools werkend, alle placeholders. MVP effort: 21h (3 dev-dagen)",
  "artifacts": ["TASK-W05-006-devops-agent-audit.md"],
  "findings": {
    "totalTools": 10,
    "workingTools": 0,
    "placeholderTools": 10,
    "mvpEffortHours": 21,
    "fullEffortHours": 37,
    "criticalDependencies": ["@octokit/rest", "SENTRY_AUTH_TOKEN", "GITHUB_TOKEN"]
  },
  "recommendations": [
    "Start met read-only tools (Fase 1) - laag risico, directe waarde",
    "Voeg @octokit/rest toe als dependency",
    "Copy context injection pattern van Support Agent",
    "Skip deploy_staging tot na productie launch"
  ],
  "priorityOrder": [
    "get_sentry_issue",
    "read_file",
    "search_code",
    "create_branch",
    "update_file",
    "create_pr",
    "add_known_issue",
    "run_tests",
    "notify_support_agent",
    "deploy_staging"
  ]
}
```

---

*Uitgevoerd door Dirk (DevOps Lead Agent) via Piet (Orchestrator)*
