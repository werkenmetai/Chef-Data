# [PROJECT_NAAM] - Team Template

> AI-first team template met agents, kennisbank, en operationele structuur.

## Wat is dit?

Dit is een **herbruikbaar team template** voor AI-first projecten. Het bevat:

- **25 AI agent specialisten** (developer, security, devops, content, etc.)
- **Operationele structuur** (principes, org-structuur, metrics, lessons learned)
- **Kennisbank** (scraped docs, lessons, best practices)
- **Branding framework** (tone of voice, schrijver-prompt)
- **GitHub workflows** (CI, Claude Code, code review)

## Quick Start

### 1. Kopieer deze repo

```bash
git clone [TEMPLATE_REPO_URL] [JOUW_PROJECT_NAAM]
cd [JOUW_PROJECT_NAAM]
rm -rf .git
git init
```

### 2. Personaliseer

Zoek en vervang `[PROJECT_NAAM]` door jouw projectnaam in:
- `.context/PROJECT.md`
- `.claude/commands/*.md` (alle agent commands)
- `operations/agents/*.md` (alle agent beschrijvingen)
- `operations/*.md` (root operations files)
- `docs/branding/*.md`

### 3. Vul project context in

- `.context/PROJECT.md` - Project overzicht, tech stack, stakeholders
- `.context/DECISIONS.md` - Architectuur beslissingen
- `operations/STRATEGY.md` - Bedrijfsstrategie
- `operations/ROADMAP.md` - Product roadmap

### 4. Configureer GitHub

- Voeg `CLAUDE_CODE_OAUTH_TOKEN` toe als repository secret
- Pas `.github/workflows/ci.yml` aan voor jouw tech stack

## Repository Structuur

```
[PROJECT_NAAM]/
├── .claude/
│   ├── commands/          # 25 agent slash commands
│   └── settings.local.json
├── .context/
│   ├── PROJECT.md         # Project brain (template)
│   └── DECISIONS.md       # ADR template
├── .github/
│   ├── workflows/
│   │   ├── ci.yml         # CI pipeline (pas aan)
│   │   ├── claude.yml     # Claude Code integration
│   │   └── claude-code-review.yml
│   └── PULL_REQUEST.md    # PR template
├── docs/
│   ├── knowledge/         # Kennisbank (lessons, scraped docs)
│   └── branding/          # Tone of voice, visual identity
├── operations/
│   ├── agents/            # 25 agent beschrijvingen
│   ├── audits/            # Audit tracker
│   ├── planning/          # Vision & quarterly plan templates
│   ├── tasks/             # Task tracking
│   ├── templates/         # Post-mortem template
│   ├── weeks/             # Weekplannen
│   ├── PRINCIPLES.md      # Bedrijfsprincipes
│   ├── ORG-STRUCTURE.md   # Team structuur
│   ├── STRATEGY.md        # Strategie (template)
│   ├── ROADMAP.md         # Roadmap (template)
│   └── ...
└── package.json           # Minimal project config
```

## Beschikbare Agents

| Agent | Rol | Command |
|-------|-----|---------|
| Piet | CEO / Orchestrator | `/piet` |
| Kees | Developer (CTO) | `/kees` |
| Henk | IT Architect (COO) | `/henk` |
| Dirk | DevOps Lead | `/dirk` |
| Lars | Backend Developer | `/lars` |
| Daan | Backend Infrastructure | `/daan` |
| Roos | QA Engineer | `/roos` |
| Wim | Code Auditor | `/wim` |
| Bas | Security Expert | `/bas` |
| Ruben | MCP Protocol Specialist | `/ruben` |
| Joost | Exact Online API Specialist | `/joost` |
| Eva | Legal & Compliance (CLO) | `/eva` |
| Frans | CFO | `/frans` |
| Jan | Finance Operations | `/jan` |
| Lisa | Content Writer (CMO) | `/lisa` |
| Anna | Content Creator | `/anna` |
| Bram | SEO Specialist | `/bram` |
| Tom | Growth Lead | `/tom` |
| Marie | Community Lead | `/marie` |
| Sophie | Customer Support (CCO) | `/sophie` |
| Emma | Support Agent | `/emma` |
| Petra | Customer Success | `/petra` |
| Tim | Data Analyst | `/tim` |
| Matthijs | Chief Strategy Officer | `/matthijs` |
| QA Finance | QA Finance Agent | `/qa-finance` |

## Hoe werken de agents?

Elke agent is een Claude Code slash command met:
- **Persoonlijkheid** en expertise
- **Vaste werkwijze** (lees eerst, dan plan, dan uitvoer)
- **Believability score** per domein
- **Escalatie protocol** (wanneer doorverwijzen)

Typ `/piet` in Claude Code om de orchestrator te starten, die verwijst je door naar de juiste specialist.

## License

MIT
