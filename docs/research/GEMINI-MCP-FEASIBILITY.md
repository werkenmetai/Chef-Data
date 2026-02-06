# Gemini MCP Integratie Haalbaarheid

**Onderzoeksdatum:** 2 februari 2026
**Onderzoeker:** Ruben (MCP Protocol Specialist)
**Status:** GO

---

## Samenvatting

Google Gemini heeft **volledige native MCP ondersteuning**. Dit is geen experimentele feature meer, maar een kernonderdeel van het Gemini ecosysteem. Onze Exact Online MCP server kan direct worden gebruikt met Gemini CLI, Google AI Studio, en de Gemini SDKs.

---

## 1. Huidige Status: MCP Support

### 1.1 Officieel Ondersteund (December 2025)

Google heeft in december 2025 officieel volledige MCP ondersteuning aangekondigd:

- **Gemini CLI**: Native MCP client met volledige ondersteuning
- **Google AI Studio**: Ingebouwde MCP client functionaliteit
- **Gemini SDKs**: Python (v1.55.0+) en JavaScript (v1.33.0+) met MCP support
- **Managed MCP Servers**: Google biedt eigen managed MCP servers voor BigQuery, Maps, GCE, etc.

### 1.2 Protocol Ondersteuning

| Feature | Status |
|---------|--------|
| MCP stdio transport | Volledig ondersteund |
| MCP HTTP/SSE transport | Volledig ondersteund |
| Remote MCP servers | Ondersteund (behalve Gemini 3 - komt binnenkort) |
| OAuth 2.0 authenticatie | Volledig ondersteund |
| Function calling | Native ondersteuning |
| Automatic tool calling | Python SDK ondersteund |

---

## 2. Technische Haalbaarheid

### 2.1 Compatibiliteit met Onze MCP Server

Onze Exact Online MCP server is **direct compatibel** met Gemini:

1. **Transport**: Wij ondersteunen stdio en HTTP/SSE - beide door Gemini ondersteund
2. **Protocol versie**: Gemini ondersteunt het standaard MCP protocol
3. **Tool definitions**: Onze JSON Schema tool definities werken native
4. **Authenticatie**: OAuth 2.0 flow kan worden geintegreerd

### 2.2 Integratie Architectuur

```
┌─────────────────┐     MCP Protocol     ┌──────────────────────┐
│   Gemini CLI    │◄───────────────────►│  Exact Online MCP    │
│   AI Studio     │     (stdio/HTTP)     │      Server          │
│   Gemini SDK    │                      └──────────┬───────────┘
└─────────────────┘                                 │
                                                    ▼
                                          ┌──────────────────┐
                                          │  Exact Online    │
                                          │      API         │
                                          └──────────────────┘
```

### 2.3 Configuratie Voorbeeld (Gemini CLI)

```json
// ~/.gemini/settings.json
{
  "mcpServers": {
    "exact-online": {
      "command": "npx",
      "args": ["-y", "@exact-online/mcp-server"],
      "env": {
        "EXACT_CLIENT_ID": "your-client-id",
        "EXACT_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

Of voor HTTP transport:

```json
{
  "mcpServers": {
    "exact-online": {
      "url": "https://mcp.exact-online-mcp.werkenmet.ai/sse"
    }
  }
}
```

---

## 3. Wat is Nodig voor Integratie?

### 3.1 Minimaal Vereist (Werkt Nu)

- Niets extra's - onze server werkt al met Gemini CLI en SDKs
- Gebruikers kunnen direct configureren zoals hierboven

### 3.2 Aanbevolen Verbeteringen

| Item | Prioriteit | Inspanning |
|------|-----------|------------|
| Gemini-specifieke documentatie | Hoog | 2 uur |
| Gemini configuratie voorbeelden | Hoog | 1 uur |
| Google AI Studio tutorial | Medium | 4 uur |
| Gemini CLI installatie guide | Medium | 2 uur |
| Demo video met Gemini | Laag | 8 uur |

### 3.3 Optionele Features

1. **Gemini-specifieke optimalisaties**
   - Tool descriptions optimaliseren voor Gemini's function calling
   - Best practices: max 10-20 actieve tools per context

2. **Google Cloud integratie**
   - Publicatie via Apigee API Hub
   - Integration met Cloud API Registry

---

## 4. SDK Integratie Details

### 4.1 Python SDK

```python
from google import genai
from mcp import ClientSession, StdioServerParameters

# MCP server starten
server_params = StdioServerParameters(
    command="npx",
    args=["-y", "@exact-online/mcp-server"]
)

# Gemini client met MCP tools
client = genai.Client(api_key="your-key")
async with ClientSession(server_params) as session:
    response = await client.aio.models.generate_content(
        model="gemini-2.5-pro",
        contents="Geef mij de openstaande facturen",
        tools=[session]  # MCP session als tool
    )
```

### 4.2 JavaScript SDK

```javascript
import { GoogleGenerativeAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const mcp = new Client({ name: "exact-online-client" });
await mcp.connect(transport);

const genai = new GoogleGenerativeAI(API_KEY);
const model = genai.getGenerativeModel({
    model: "gemini-2.5-pro",
    tools: mcpToTool(mcp)
});
```

---

## 5. Tijdlijn Schatting

### Direct Beschikbaar (0 dagen)
- Basis integratie met Gemini CLI
- SDK integratie (Python/JavaScript)

### Week 1
- Documentatie voor Gemini gebruikers
- Configuratie voorbeelden toevoegen aan README
- Testen met Gemini 3 serie modellen

### Week 2-3
- Google AI Studio tutorial
- Marketing materiaal voor Gemini gebruikers
- Community outreach (Gemini forums)

### Maand 2+
- Google Cloud API Registry listing (indien gewenst)
- Apigee integratie onderzoeken

---

## 6. Risico's en Mitigatie

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Gemini 3 remote MCP nog niet klaar | Laag | Stdio transport werkt wel |
| Protocol wijzigingen | Laag | MCP is stabiel, Google committed |
| Authenticatie complexiteit | Medium | OAuth flow documenteren |

---

## 7. Conclusie en Aanbeveling

### Conclusie: **GO**

Google Gemini heeft uitstekende MCP ondersteuning die actief wordt doorontwikkeld. De integratie met onze Exact Online MCP server is:

1. **Technisch haalbaar** - Geen blokkerende issues
2. **Minimale inspanning** - Server werkt al, alleen documentatie nodig
3. **Strategisch waardevol** - Toegang tot Gemini gebruikersbase
4. **Laag risico** - Google is committed aan MCP standaard

### Aanbevolen Actie

1. Voeg Gemini configuratie toe aan onze documentatie (2-3 uur)
2. Test met Gemini CLI en AI Studio (2 uur)
3. Update marketing materiaal met "Gemini compatible" (1 uur)

**Totale investering voor basis Gemini support: ~6 uur**

---

## Bronnen

- [Google Cloud MCP Announcement](https://cloud.google.com/blog/products/ai-machine-learning/announcing-official-mcp-support-for-google-services)
- [Gemini CLI MCP Documentation](https://geminicli.com/docs/tools/mcp-server/)
- [Gemini API Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [MCP with Gemini Deep Dive](https://medium.com/google-cloud/model-context-protocol-mcp-with-google-gemini-llm-a-deep-dive-full-code-ea16e3fac9a3)
- [Gemini SDK + FastMCP Integration](https://gofastmcp.com/integrations/gemini)
- [Google Embraces MCP - The New Stack](https://thenewstack.io/google-embraces-mcp/)
- [Interactions API Documentation](https://ai.google.dev/gemini-api/docs/interactions)
