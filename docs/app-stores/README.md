# App Store Submissions

> Overzicht van alle app store/directory submissions voor "Praat met je Boekhouding"

---

## Platform Overzicht

| Platform | Status | Type | Documenten |
|----------|--------|------|------------|
| **Exact Online App Store** | ✅ Ingediend | Accounting Integration | Zie `operations/STRATEGY.md` |
| **Claude Connector Directory** | ✅ Ingediend | MCP Connector | [CLAUDE-CONNECTOR-SUBMISSION.md](./CLAUDE-CONNECTOR-SUBMISSION.md) |
| **ChatGPT App Directory** | 📋 Klaar | MCP App | [CHATGPT-SUBMISSION.md](./CHATGPT-SUBMISSION.md) |

---

## Quick Links

### ChatGPT
- **Submission Guide:** [CHATGPT-SUBMISSION.md](./CHATGPT-SUBMISSION.md)
- **Submit URL:** https://platform.openai.com/apps-manage
- **Docs:** https://developers.openai.com/apps-sdk/

### Claude
- **Submission Guide:** [CLAUDE-CONNECTOR-SUBMISSION.md](./CLAUDE-CONNECTOR-SUBMISSION.md)
- **Directory:** https://claude.com/connectors
- **MCP Spec:** https://modelcontextprotocol.io

### Exact Online
- **App Store:** https://apps.exactonline.com
- **Status:** Zie `operations/STRATEGY.md` en `operations/weeks/2026-W06.md`

---

## Shared Assets

### MCP Server URLs

| Endpoint | Beschrijving | Auth |
|----------|--------------|------|
| `https://api.praatmetjeboekhouding.nl/mcp` | Hoofdendpoint | OAuth 2.1 |
| `https://api.praatmetjeboekhouding.nl/mcp/{api_key}` | API Key auth | Bearer token |
| `https://api.praatmetjeboekhouding.nl/sse/{api_key}` | SSE transport | Bearer token |
| `https://api.praatmetjeboekhouding.nl/demo/exa_demo` | Demo (geen auth) | None |

### Demo Accounts

| Key | Company | Industry |
|-----|---------|----------|
| `exa_demo` | Bakkerij De Gouden Croissant B.V. | Bakery |
| `exa_demo_it` | TechVision Consultancy B.V. | IT |
| `exa_demo_advocaat` | Van der Berg & Partners | Legal |
| `exa_demo_aannemer` | Bouwbedrijf De Fundatie B.V. | Construction |

### Tool Annotations (47 tools)

Alle tools gebruiken:
```json
{
  "readOnlyHint": true,
  "destructiveHint": false,
  "idempotentHint": true,
  "openWorldHint": true
}
```

### Standaard Beschrijvingen

**Kort (150 tekens):**
> Vraag je Exact Online boekhouding in natuurlijke taal. Zie facturen, omzet, cashflow en meer. Privacy-first, read-only.

**Lang:**
> Praat met je Boekhouding verbindt AI assistants met je Exact Online administratie. Stel vragen in natuurlijke taal en krijg direct antwoord. 47 tools voor facturen, omzet, cashflow, debiteurenanalyse en meer. Read-only, privacy-first, GDPR compliant.

---

## Submission Timeline

| Week | Platform | Actie |
|------|----------|-------|
| W05 | Exact Online | Security review goedgekeurd |
| W05 | Exact Online | Toestemmingsverzoek goedgekeurd |
| W06 | Exact Online | Marketing beoordeling ingediend |
| W06 | Claude | Connector Directory ingediend |
| W06 | ChatGPT | Submission voorbereid (dit document) |
| W07 | ChatGPT | Submit naar App Directory |
| W07+ | Alle | Wachten op reviews |

---

## Checklist Nieuwe Platform

Bij toevoegen van nieuw platform:

1. [ ] Onderzoek platform vereisten
2. [ ] Creëer `[PLATFORM]-SUBMISSION.md` document
3. [ ] Verzamel platform-specifieke metadata
4. [ ] Maak test cases voor platform
5. [ ] Documenteer submission proces
6. [ ] Submit en track status
7. [ ] Update dit README

---

*Laatst bijgewerkt: 2 februari 2026*
