# Operations - Command Center

Dit is het **command center** van Praat met je Boekhouding. Alle strategische planning, weekplannen en AI agent aansturing gebeurt vanuit deze folder.

## Quick Start

```bash
# Start orchestratie (aanbevolen)
claude "Read operations/state/orchestrator-state.json and begin orchestration"

# Check systeem status
cat operations/state/orchestrator-state.json | jq '.systemStatus'

# Start specifieke agent
cat operations/agents/lisa-content-writer.md | claude
```

## Structuur

```
operations/
├── STRATEGY.md               # Hoofdstrategie, piketpaaltjes, metrics
├── README.md                 # Deze file
├── weeks/                    # Weekplannen met concrete acties
│   └── 2026-W05.md
├── agents/                   # AI Agent prompts
│   ├── orchestrator.md       # Piet - Centrale coördinator (START HIER)
│   ├── ceo-planner.md        # Matthijs - Strategische planning
│   ├── it-architect.md       # Henk - Technisch ontwerp en specs
│   ├── developer.md          # Kees - Feature implementatie
│   ├── code-auditor.md       # Codebase scanner voor losse eindjes
│   ├── content-writer.md     # SEO artikel schrijver
│   ├── security-expert.md    # Bas - Security vulnerability fixer
│   ├── support-system.md     # Sophie - Klantenservice systeem
│   └── legal-compliance.md   # Eva - Legal & privacy compliance
├── state/                    # Orchestratie state (git-tracked)
│   ├── orchestrator-state.json
│   ├── agents/               # Per-agent state
│   └── locks/                # Kortstondige locks
├── tasks/                    # Taken queue
│   ├── pending/              # Wachtend op uitvoering
│   ├── active/               # In uitvoering
│   ├── completed/            # Afgerond (archief)
│   └── failed/               # Gefaald (review nodig)
├── reports/                  # Rapportages
│   ├── progress/             # Tussentijdse voortgang
│   └── completions/          # Eindrapportages
├── logs/                     # Daily execution logs
├── workflows/                # Gedocumenteerde procedures
└── tasks/                    # Terugkerende taak templates
```

---

## Multi-Agent Orchestratie

### Hoe het werkt

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                              │
│  Leest state → Beslist → Delegeert → Update → Commit        │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ CEO      │    │ Code     │    │ Content  │
     │ Planner  │    │ Auditor  │    │ Writer   │
     └──────────┘    └──────────┘    └──────────┘
            │               │               │
            ▼               ▼               ▼
     ┌──────────────────────────────────────────┐
     │           STATE (Git-tracked)            │
     │  operations/state/orchestrator-state.json│
     └──────────────────────────────────────────┘
```

### Drie Lagen

| Laag | Agent | Functie |
|------|-------|---------|
| **Strategisch** | ceo-planner | Doelen → Taken decompositie |
| **Tactisch** | orchestrator | State → Beslissen → Delegeren |
| **Uitvoerend** | code-auditor, content-writer, security-expert, support-system | Taak uitvoeren → Rapporteren |

### Start Flow

1. **Initieel**: Run `ceo-planner` om taken te creëren op basis van STRATEGY.md
2. **Orchestratie**: Run `orchestrator` om taken toe te wijzen aan agents
3. **Uitvoering**: Orchestrator delegeert naar worker agents
4. **Herhaal**: Na elke run, orchestrator update state en bepaalt volgende stap

---

## Agent Overzicht

| Agent | Wanneer Gebruiken | Output |
|-------|-------------------|--------|
| **orchestrator** | Start van elke sessie | State updates, delegatie |
| **ceo-planner** | Nieuwe taken nodig | Task files in `tasks/pending/` |
| **code-auditor** | Losse eindjes vinden | `ROADMAP.md` |
| **content-writer** | Blog posts schrijven | `docs/blog/*.md` |
| **security-expert** | Security fixes | Code changes + ROADMAP update |
| **support-system** | Support features bouwen | New components & APIs |

---

## Commands

### Orchestratie Starten

```bash
# Aanbevolen: interactief
claude "Read operations/state/orchestrator-state.json and begin orchestration"

# Status check
claude -p "Read operations/state/orchestrator-state.json and report:
           1. Current phase
           2. Number of pending tasks
           3. Any errors
           4. Recommended next action"
```

### Specifieke Agent Aanroepen

```bash
# Via orchestrator delegatie (aanbevolen)
claude "Use the code-auditor subagent to scan the codebase"

# Direct (voor testing)
cat operations/agents/wim-code-auditor.md | claude
```

### Planning Sessie

```bash
# Taken creëren voor deze week
claude "Use ceo-planner to analyze STRATEGY.md and create tasks for week 5"
```

---

## State Management

### orchestrator-state.json

```json
{
  "systemStatus": {
    "phase": "idle|executing|error",
    "isIdle": true,
    "message": "..."
  },
  "taskQueue": {
    "pending": [],
    "inProgress": [],
    "completed": [],
    "failed": []
  },
  "agents": {
    "code-auditor": {"status": "idle|busy", "lastRun": "..."}
  }
}
```

### Lifecycle

```
IDLE → ceo-planner creëert taken → PENDING
PENDING → orchestrator wijst toe → ASSIGNED
ASSIGNED → agent claimt → RUNNING
RUNNING → agent voltooit → COMPLETED/FAILED
```

---

## Weekritme

| Dag | Activiteit |
|-----|------------|
| **Maandag** | Review vorige week, update STRATEGY.md, run ceo-planner |
| **Di-Do** | Run orchestrator, agents voeren taken uit |
| **Vrijdag** | Review, commit alles, prep volgende week |

## Dagelijkse Acties

> **Doel:** Specialisten monitoren hun domein en voeden de knowledge database.
> Zo kan het hele team bijschakelen op basis van actuele kennis.

| Actie | Specialist | Knowledge Base | Bronnen |
|-------|-----------|----------------|---------|
| **MCP & Claude monitoren** | Ruben (MCP) | `docs/knowledge/mcp/` | Anthropic changelog, MCP spec, Claude Code releases |
| **Exact Online API checken** | Joost (Exact) | `docs/knowledge/exact/` | Exact API docs, developer portal, release notes |
| **Cloudflare updates checken** | Dirk (DevOps) | `docs/knowledge/backend/` | Cloudflare blog, Workers changelog, D1 updates |

### Wat vastleggen en waar

```
Bij nieuwe versie of update:
→ Update VERSION.md in het juiste kennisdomein
  docs/knowledge/mcp/VERSION.md       (Ruben)
  docs/knowledge/exact/VERSION.md     (Joost)
  docs/knowledge/backend/VERSION.md   (Dirk)

Bij bug fix, breaking change, of nieuw patroon:
→ Voeg toe aan LESSONS-LEARNED.md in het juiste domein
  docs/knowledge/mcp/LESSONS-LEARNED.md
  docs/knowledge/exact/LESSONS-LEARNED.md
  docs/knowledge/backend/LESSONS-LEARNED.md

Bij nieuwe documentatie of code voorbeelden:
→ Scrape en bewaar in scraped/ folder
  docs/knowledge/mcp/scraped/YYYY-MM-DD-onderwerp.md
  docs/knowledge/exact/scraped/YYYY-MM-DD-onderwerp.md
  docs/knowledge/backend/scraped/YYYY-MM-DD-onderwerp.md

Bij impact op onze code:
→ Maak ticket + informeer Piet (CEO)
```

### Bronnen per Specialist

```
Ruben (MCP):
- https://docs.anthropic.com/en/docs/changelog     → Claude API changelog
- https://github.com/modelcontextprotocol/spec      → MCP spec updates & issues
- https://github.com/modelcontextprotocol/servers    → Reference server changes
- https://status.anthropic.com                       → Service status
- https://github.com/anthropics/claude-code          → Claude Code releases

Joost (Exact):
- https://support.exactonline.com/community/s/       → Release notes & known issues
- https://start.exactonline.nl/docs/                 → API documentatie updates
- https://developers.exactonline.com/                → Developer portal

Dirk (DevOps):
- https://blog.cloudflare.com/tag/workers/           → Workers updates
- https://developers.cloudflare.com/d1/changelog/    → D1 database changes
- https://www.cloudflarestatus.com/                  → Service status
```

---

## Conventies

1. **State is truth** - `orchestrator-state.json` is de enige bron van waarheid
2. **Git-tracked** - Alle state, taken en logs in Git
3. **Atomic commits** - Elke state change wordt direct gecommit
4. **JSON output** - Agents rapporteren gestructureerd voor parsing
5. **One task per run** - Kostenbeheersing: max 1 taak per orchestratie cyclus

---

## Troubleshooting

### Systeem is idle maar er zijn taken
```bash
# Check dependencies
cat operations/state/orchestrator-state.json | jq '.taskQueue.pending[] | {id, dependsOn}'
```

### Agent faalt herhaaldelijk
```bash
# Check error state
cat operations/state/orchestrator-state.json | jq '.errorState'

# Bekijk dead letter queue
cat operations/state/orchestrator-state.json | jq '.errorState.deadLetterQueue'
```

### State corrupt
```bash
# Valideer JSON
jq . operations/state/orchestrator-state.json

# Reset naar clean state (alleen als nodig)
git checkout operations/state/orchestrator-state.json
```

---

*Laatst bijgewerkt: 2026-01-27*
