# Cross-Specialist Collaboration Protocol

**Betrokken specialisten:** Ruben (MCP), Joost (Exact)

---

## Wanneer Cross-Specialist Review?

### Trigger Scenarios

| Scenario | Lead Specialist | Support Specialist |
|----------|-----------------|-------------------|
| MCP OAuth error | Ruben | Joost |
| Exact token refresh in MCP context | Joost | Ruben |
| Data formatting issues | Beide | Beide |
| End-to-end auth flow | Ruben | Joost |
| Division scope + MCP tools | Joost | Ruben |

### Herkenning

Een issue vereist cross-specialist review wanneer:

1. **OAuth/Token problemen** - Beide systemen hebben eigen token management
2. **Data transformatie** - Exact data moet via MCP protocol
3. **Error propagation** - Errors moeten correct door beide lagen
4. **Timing issues** - Token refresh timing vs MCP session

## Samenwerking Workflow

### Stap 1: Issue Identificatie

```markdown
## Cross-Specialist Issue: [titel]

**Datum:** YYYY-MM-DD
**Gemeld door:** [naam]
**Raakt:** MCP + Exact

### Symptomen
[Wat zien we?]

### Hypothese
- MCP kant: [wat denkt Ruben?]
- Exact kant: [wat denkt Joost?]
```

### Stap 2: Parallelle Analyse

**Ruben checkt:**
- `docs/knowledge/mcp/LESSONS-LEARNED.md`
- `docs/knowledge/mcp/tests/TEST-SCENARIOS.md`
- MCP spec compliance

**Joost checkt:**
- `docs/knowledge/exact/LESSONS-LEARNED.md`
- `docs/knowledge/exact/tests/TEST-SCENARIOS.md`
- Exact API behavior

### Stap 3: Gezamenlijke Root Cause

```markdown
### Root Cause Analyse

**MCP component:**
- [bevindingen Ruben]

**Exact component:**
- [bevindingen Joost]

**Interface issue:**
- [waar gaat het mis tussen beide systemen?]
```

### Stap 4: Gezamenlijke Oplossing

```markdown
### Oplossing

**MCP fix:** [beschrijving]
**Exact fix:** [beschrijving]
**Interface fix:** [beschrijving]

### Implementatie volgorde
1. [eerste fix - welk systeem?]
2. [tweede fix - welk systeem?]
3. [test scenario]
```

### Stap 5: Dubbele Documentatie

Na de fix:

1. **Ruben** voegt lesson toe aan `docs/knowledge/mcp/LESSONS-LEARNED.md`
2. **Joost** voegt lesson toe aan `docs/knowledge/exact/LESSONS-LEARNED.md`
3. **Beide** verwijzen naar elkaar's documentatie
4. **Beide** updaten TEST-SCENARIOS.md

## Template voor Gedeelde Lesson

```markdown
## Lesson: [Titel] (Cross-Specialist)

**Datum:** YYYY-MM-DD
**Specialisten:** Ruben (MCP), Joost (Exact)
**Ernst:** High/Medium/Low

### Probleem
[Symptomen vanuit beide perspectieven]

### Root Cause
- **MCP kant:** [...]
- **Exact kant:** [...]
- **Interface:** [...]

### Oplossing
- **MCP fix:** [...]
- **Exact fix:** [...]

### Code Voorbeeld
```typescript
// MCP kant
...

// Exact kant
...
```

### Cross-Reference
- MCP: docs/knowledge/mcp/LESSONS-LEARNED.md#lesson-titel
- Exact: docs/knowledge/exact/LESSONS-LEARNED.md#lesson-titel

### Preventie
[Hoe voorkomen we dit in de toekomst?]
```

## Escalatie naar CTO

Escaleer naar Kees (CTO) wanneer:

1. **Architectuur beslissing nodig** - Fundamentele change in data flow
2. **Breaking change** - Impact op meerdere systemen
3. **Onenigheid** - Ruben en Joost komen niet tot consensus
4. **Security issue** - Potentiële kwetsbaarheden

## Communicatie Kanalen

### Binnen sessie
```
"Joost, ik heb jouw input nodig bij dit MCP OAuth issue..."
"Ruben, kun je checken of dit MCP-compliant is?"
```

### Via Piet (CEO)
```
"Piet, dit is een cross-specialist issue. Ik heb input nodig van zowel Ruben als Joost."
```

## Bekende Cross-System Issues

### 1. Token Refresh Timing

| System | Token Lifetime | Refresh Strategy |
|--------|----------------|------------------|
| MCP | 1 hour | Refresh 5 min before expiry |
| Exact | 10 minutes | Refresh 30 sec before expiry |

**Issue:** MCP session kan Exact token outlive
**Fix:** Check Exact token validity bij elke MCP tool call

### 2. Error Code Mapping

| Exact Error | MCP Error Code | Message |
|-------------|----------------|---------|
| 401 | -32003 | "Token expired" |
| 403 | -32003 | "Division not authorized" |
| 429 | -32005 | "Rate limited" |
| 500 | -32603 | "Exact API error" |

### 3. Division Scope

**Issue:** User authorizes MCP, maar niet alle Exact divisions
**Fix:** Check division scope voor elke tool, return helpful error

---

## Quick Reference

```bash
# Als Ruben hulp nodig heeft van Joost:
# 1. Check Joost's kennisbase eerst
cat docs/knowledge/exact/LESSONS-LEARNED.md
cat docs/knowledge/exact/tests/TEST-SCENARIOS.md

# Als Joost hulp nodig heeft van Ruben:
# 1. Check Ruben's kennisbase eerst
cat docs/knowledge/mcp/LESSONS-LEARNED.md
cat docs/knowledge/mcp/tests/TEST-SCENARIOS.md

# Bij gezamenlijk issue:
# 1. Check beide kennisbases
# 2. Check dit protocol
cat docs/knowledge/COLLABORATION-PROTOCOL.md
```
