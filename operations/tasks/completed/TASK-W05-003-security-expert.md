# Task: Fix Critical Security Issues (SEC-001, SEC-002)

**TaskId**: TASK-W05-003
**Agent**: security-expert
**Week**: 2026-W05
**Priority**: Could Do (maar kritiek voor demo)
**Created**: 2026-01-27

---

## Context

De code audit heeft 3 security issues geidentificeerd. Voor de demo met Exact Online (Piketpaal 2, Week 8) moeten de kritieke issues opgelost zijn.

Deze week focus op SEC-001 (XSS) en SEC-002 (CORS) - de meest kritieke issues.

## Issues uit ROADMAP.md

### SEC-001: XSS Risico via innerHTML (KRITIEK)
**Locaties** (17 instanties):
- `apps/auth-portal/src/pages/dashboard.astro:901,1163,1169,1175,1185,1199,1206,1213`
- `apps/auth-portal/src/pages/support/index.astro:295,303`
- `apps/auth-portal/src/pages/support/new.astro:221`
- `apps/auth-portal/src/pages/support/conversations/[id].astro:371`
- `apps/auth-portal/src/pages/support/articles/[slug].astro:202`
- `apps/auth-portal/src/pages/admin/feedback/index.astro:464,472,545`

**Fix strategie**: Gebruik `textContent` voor plain text, DOM API voor structured HTML, of escape HTML entities.

### SEC-002: CORS Wildcard (HOOG)
**Locaties** (3 instanties):
- `apps/mcp-server/src/index.ts:37`
- `apps/mcp-server/src/routes/health.ts:75`
- `apps/mcp-server/src/auth/oauth.ts:83`

**Fix strategie**: Beperk `Access-Control-Allow-Origin` tot bekende origins.

## Instructie

1. **SEC-001 Fix**:
   - Maak een `escapeHtml` utility in `apps/auth-portal/src/lib/security.ts`
   - Fix alle 17 innerHTML locaties
   - Gebruik `textContent` waar mogelijk, escape waar HTML nodig is

2. **SEC-002 Fix**:
   - Maak een `getCorsHeaders` helper in `apps/mcp-server/src/lib/cors.ts`
   - Whitelist: `praatmetjeboekhouding.nl`, `localhost:*` (dev only)
   - Update alle 3 locaties

3. **SEC-003** (optioneel deze week):
   - Verplaats Stripe placeholders naar environment variables
   - Update `.env.example`

## Acceptatiecriteria

- [ ] Geen `innerHTML` met user input zonder sanitization
- [ ] CORS beperkt tot bekende origins
- [ ] Alle fixes getest (geen broken functionaliteit)
- [ ] ROADMAP.md geupdate met resolved status

## Niet Doen

- Geen refactoring buiten security scope
- Geen nieuwe dependencies zonder noodzaak
- Geen breaking changes aan API

## Verwachte Output

```json
{
  "taskId": "TASK-W05-003",
  "status": "complete|partial|failed",
  "summary": "Security fixes applied: X issues resolved",
  "artifacts": [
    "apps/auth-portal/src/lib/security.ts",
    "apps/mcp-server/src/lib/cors.ts"
  ],
  "issuesFixed": [
    {"id": "SEC-001", "title": "XSS via innerHTML", "filesChanged": 5},
    {"id": "SEC-002", "title": "CORS wildcard", "filesChanged": 3}
  ],
  "verification": {
    "manualTestsNeeded": ["Test toast messages", "Test CORS headers"],
    "automatedTestsPass": true
  },
  "recommendations": []
}
```

---

*Gegenereerd door CEO Strategic Planner Agent*
