# Auteur Protocol

**Versie:** 1.0
**Laatst bijgewerkt:** 2026-01-29
**Door:** Piet (CEO/Orchestrator)

---

## Waarom Auteur Attributie?

Bij een team van virtuele agents moet altijd duidelijk zijn:
1. **Wie** heeft dit geschreven/bewerkt
2. **Wanneer** is het voor het laatst aangepast
3. **Welke expertise** is toegepast

Dit voorkomt verwarring en maakt het makkelijk om de juiste specialist te raadplegen.

---

## Standaard Document Header

Elk document moet beginnen met:

```markdown
# [Document Titel]

**Beheerder:** [Naam] ([Rol])
**Laatste update:** YYYY-MM-DD
**Door:** [Naam Agent]
```

### Voorbeeld

```markdown
# Exact Online API Lessons Learned

**Beheerder:** Joost (Exact API Specialist)
**Laatste update:** 2026-01-29
**Door:** Piet (orchestrator)
```

---

## Commit Message Attributie

Bij git commits, voeg de agent toe:

```
[type]([scope]): [beschrijving]

[Agent: Naam]

https://claude.ai/code/session_XXX
```

### Voorbeeld

```
docs: add API verification lessons

Agent: Piet (orchestrator)
Reviewed: Joost (exact-specialist)

https://claude.ai/code/session_01Scr5x8e3wqQgH33HothuRr
```

---

## Lesson Entry Attributie

Bij nieuwe lessons in LESSONS-LEARNED.md:

```markdown
## Lesson: [Titel]

**Datum:** YYYY-MM-DD
**Gevonden door:** [Agent Naam]
**Geverifieerd door:** [Specialist Naam] (optioneel)
**Ernst:** High/Medium/Low
```

---

## Code Comment Attributie

Bij significante code wijzigingen:

```typescript
/**
 * [Beschrijving]
 *
 * @author [Agent Naam]
 * @date YYYY-MM-DD
 * @see [Gerelateerde docs/issues]
 */
```

---

## Agent Identificatie

| Agent | Naam | Domein | Identificatie |
|-------|------|--------|---------------|
| orchestrator | Piet | Operationeel | `Piet (orchestrator)` |
| ceo-planner | Matthijs | Strategisch | `Matthijs (CSO)` |
| exact-specialist | Joost | Exact API | `Joost (exact-specialist)` |
| mcp-specialist | Ruben | MCP Protocol | `Ruben (mcp-specialist)` |
| code-auditor | Wim | Code Quality | `Wim (code-auditor)` |
| backend-dev | Daan | Backend | `Daan (backend-dev)` |
| frontend-dev | Lars | Frontend | `Lars (frontend-dev)` |
| qa-engineer | Roos | Testing | `Roos (qa-engineer)` |
| devops-lead | Dirk | Infrastructure | `Dirk (devops-lead)` |
| support-agent | Emma | Support | `Emma (support-agent)` |

---

## Wie Schrijft Wat?

| Document Type | Primaire Auteur | Reviewer |
|---------------|-----------------|----------|
| LESSONS-LEARNED (exact) | Joost | Piet |
| LESSONS-LEARNED (mcp) | Ruben | Piet |
| LESSONS-LEARNED (backend) | Daan | Wim |
| ROADMAP.md | Piet | Matthijs |
| STRATEGY.md | Matthijs | Piet |
| Security audits | Bas | Wim |
| Tool documentatie | Joost/Ruben | Piet |
| Marketing content | Tom/Anna | Lisa |
| Support docs | Emma | Petra |

---

## Automatische Detectie

Als je niet zeker weet welke agent je bent, kijk naar:

1. **Je system prompt** - bevat agent naam en rol
2. **De opdracht context** - wie heeft je aangestuurd
3. **Het domein** - welk type werk doe je

Bij twijfel: schrijf als `Piet (orchestrator)` - de algemene coördinator.

---

## Implementatie in Bestaande Docs

### LESSONS-LEARNED.md bestanden

Voeg toe aan header:
```markdown
**Beheerder:** [Specialist]
**Bijdragers:** Piet, [andere agents die hebben bijgedragen]
```

### README bestanden

Voeg toe onderaan:
```markdown
---
*Onderhouden door: [Team/Agent]*
```

---

## Protocol Naleving

1. **Nieuwe documenten**: ALTIJD header met auteur
2. **Bestaande documenten**: Voeg auteur toe bij significante wijzigingen
3. **Commits**: Vermeld agent in extended commit message
4. **Lessons**: Altijd "Gevonden door" vermelden

---

## Quick Reference

```markdown
# Bij documentatie
**Door:** [Naam] ([rol])

# Bij commits
Agent: [Naam] ([rol])

# Bij lessons
**Gevonden door:** [Naam]

# Bij code
@author [Naam]
```
