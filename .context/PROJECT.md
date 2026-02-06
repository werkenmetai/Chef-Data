# [PROJECT_NAAM] - Project Context

> **Laatste update**: [DATUM]
> **Huidige fase**: [FASE]
> **Status**: [STATUS]

## Quick Start voor Claude

Als je dit leest, ben je aan het werk aan [PROJECT_NAAM].
Lees eerst dit document, dan de relevante operations/ documenten.

## Project Overzicht

### Wat bouwen we?
[Beschrijf het project hier]

### Voor wie?
- [Doelgroep 1]
- [Doelgroep 2]

### Kernwaarden
1. **AI-first operations** - Support en bugfixes door AI agents
2. **Minimal maintenance** - <2 uur/week menselijke interventie
3. **Self-service** - Klanten lossen 90% zelf op
4. **Modular** - Elke component isolated, makkelijk te fixen

## Belangrijke Links

| Resource | Link |
|----------|------|
| Repository | [URL] |
| Live URL | [URL] |

## Stakeholders & Rollen

| Wie | Rol | Contact |
|-----|-----|---------|
| [Naam] | Product Owner | - |
| Claude (AI) | Developer, Support Agent | - |

## Technische Stack

```yaml
Runtime: [Te bepalen]
Database: [Te bepalen]
CI/CD: GitHub Actions
Language: [Te bepalen]
```

## Repository Structuur

```
[PROJECT_NAAM]/
├── .context/           # Project brain - start hier
├── .claude/commands/   # Agent commands
├── .github/workflows/  # CI/CD
├── docs/
│   ├── knowledge/      # Kennisbank (lessons, scraped docs)
│   └── branding/       # Tone of voice, schrijver-prompt
└── operations/         # Team operations & agents
```

## Huidige Status

| Fase | Status | Notes |
|------|--------|-------|
| 1. Planning | [STATUS] | |
| 2. Setup | [STATUS] | |
| 3. Development | [STATUS] | |

## Belangrijke Beslissingen

Zie [DECISIONS.md](./DECISIONS.md) voor volledige historie.

## Voor de Volgende Sessie

Als je een nieuwe chat start:

1. Open dit bestand: `.context/PROJECT.md`
2. Lees de operations/ documenten
3. Ga verder waar je gebleven was
