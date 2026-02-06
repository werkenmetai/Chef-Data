# Kennisdatabase

**Beheerders:** Ruben (MCP), Joost (Exact)

## Structuur

```
docs/knowledge/
├── mcp/                    # MCP Protocol kennis
│   ├── LESSONS-LEARNED.md  # Lessen uit PRs en errors
│   ├── scraped/            # Gescrapete documentatie
│   └── examples/           # Code voorbeelden
│
├── exact/                  # Exact Online API kennis
│   ├── LESSONS-LEARNED.md  # Lessen uit PRs en errors
│   ├── scraped/            # Gescrapete documentatie
│   └── examples/           # Code voorbeelden
│
└── README.md               # Dit bestand
```

## Scraped Content Toevoegen

### Naamconventie
```
[YYYY-MM-DD]-[bron]-[onderwerp].md
```

Voorbeelden:
- `2026-01-28-mcp-spec-authorization.md`
- `2026-01-28-exact-api-endpoints.md`

### Content Format
```markdown
# [Titel van de pagina]

**Bron:** [URL]
**Datum:** YYYY-MM-DD
**Gescraped door:** [Chrome extension naam]

---

[Inhoud hier]
```

## URLs om te Scrapen

### MCP (voor Ruben)
| Prioriteit | URL |
|------------|-----|
| Hoog | https://spec.modelcontextprotocol.io |
| Hoog | https://modelcontextprotocol.io/specification/draft/basic/authorization |
| Hoog | https://github.com/modelcontextprotocol/typescript-sdk |
| Medium | https://modelcontextprotocol.io/docs |
| Medium | https://docs.anthropic.com/en/docs/build-with-claude/mcp |
| Medium | https://mcp-auth.dev/docs |

### Exact Online (voor Joost)
| Prioriteit | URL |
|------------|-----|
| Hoog | https://developers.exactonline.com |
| Hoog | https://start.exactonline.nl/docs/HlpRestAPIResources.aspx |
| Hoog | https://support.exactonline.com/community/s/knowledge-base#All-All-DNO-Content-restapi |
| Medium | https://support.exactonline.com/community/s/knowledge-base#All-All-DNO-Simulation-gettingstarted |

## Workflow

1. **Scrape** de pagina met Chrome extension
2. **Kopieer** de output naar mij (Claude/Piet)
3. **Ik sla het op** in de juiste `scraped/` folder
4. **Ruben/Joost** verwerken het naar de kennisdatabase
