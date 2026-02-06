# Exact Online App Store Content

> Marketing content voor de Exact Online App Store listing

---

## App Naam

**Praat met je Boekhouding**

---

## Korte Beschrijving (max 150 karakters)

```
Stel vragen aan je Exact Online administratie in gewone taal. Werkt met ChatGPT, Claude en andere AI-assistenten.
```

(143 karakters)

---

## Lange Beschrijving

```
Praat met je Boekhouding verbindt je Exact Online administratie met AI-assistenten zoals ChatGPT en Claude. Stel vragen in gewone taal en krijg direct antwoord.

WAT KAN JE VRAGEN?

• "Welke facturen staan nog open?"
• "Vergelijk de omzet van dit kwartaal met vorig jaar"
• "Welke klanten betalen het vaakst te laat?"
• "Geef een overzicht van mijn crediteuren"
• "Hoeveel voorraad heb ik van product X?"

HOE WERKT HET?

1. Verbind je Exact Online in 2 minuten
2. Kopieer je persoonlijke sleutel naar je AI-assistent
3. Stel vragen in gewone taal

100% VEILIG

✓ Alleen lezen - nooit schrijven of aanpassen
✓ Jouw data blijft bij Exact Online
✓ OAuth 2.0 beveiliging
✓ Je kunt de verbinding altijd intrekken

WERKT MET

• ChatGPT (Plus, Team, Enterprise)
• Claude (Pro, Team)
• GitHub Copilot
• Elke MCP-compatible AI tool

PRIJZEN

• Gratis: €0/maand - ~60 vragen, 2 administraties
• Starter: €9/maand - ~250 vragen, 3 administraties
• Pro: €25/maand - ~800 vragen, 10 administraties
• Enterprise: Op aanvraag - onbeperkt

Geen technische kennis nodig. Binnen 5 minuten operationeel.
```

---

## Doel (voor Data & Security Review)

```
Praat met je Boekhouding is een MCP-server (Model Context Protocol) die Exact Online koppelt aan AI-assistenten. Gebruikers kunnen in natuurlijke taal vragen stellen over hun boekhouding. De app leest alleen data (read-only) en kan nooit boekingen aanpassen of verwijderen.
```

---

## Scopes Beschrijving (voor Data & Security Review)

```
De app vraagt READ-ONLY toegang tot de volgende Exact Online domeinen:

FINANCIAL
- Grootboekrekeningen (lezen)
- Journaalposten (lezen)
- Budgetten (lezen)

CRM
- Relaties/Accounts (lezen)
- Contactpersonen (lezen)

SALES
- Verkoopfacturen (lezen)
- Verkooporders (lezen)
- Offertes (lezen)

PURCHASE
- Inkoopfacturen (lezen)
- Inkooporders (lezen)
- Crediteuren (lezen)

LOGISTICS
- Artikelen (lezen)
- Voorraad (lezen)
- Magazijnen (lezen)

PROJECTS (indien beschikbaar)
- Projecten (lezen)
- Uren (lezen)

De app heeft GEEN write/manage rechten en kan dus nooit data aanpassen, verwijderen of nieuwe records aanmaken.
```

---

## Third-Party Connections (voor Data & Security Review)

```
ONZE INFRASTRUCTUUR (EU)
- Cloudflare Workers (EU region): Hosting van de applicatie
- Cloudflare D1 (EU region): Database voor gebruikersaccounts en sessies
- GEEN Exact Online boekhouddata wordt opgeslagen

DATA FLOW MODEL
Onze applicatie is een "pass-through" MCP-server:

  [Exact Online] → [Onze MCP Server] → [AI-assistent van gebruiker]
                         ↓
                  Geen opslag van
                  boekhouddata

AI PROVIDERS
- Gebruikers kiezen ZELF welke AI-assistent ze gebruiken
- Ondersteunde providers: OpenAI (ChatGPT), Anthropic (Claude), GitHub Copilot, of elke MCP-compatible tool
- Data stroomt van Exact Online via onze server naar de door de gebruiker gekozen AI
- Wij hebben GEEN controle over hoe de AI-provider de data verwerkt na ontvangst

GEBRUIKERSVERANTWOORDELIJKHEID
- Gebruikers worden geïnformeerd dat zij verantwoordelijk zijn voor hun AI-provider keuze
- Bij verbinden wordt een disclaimer getoond over data flow naar AI-providers
- Wij bieden documentatie over privacy-instellingen per AI-provider
- Wij adviseren zakelijke AI-abonnementen (Claude Team, ChatGPT Team, Copilot Business)

WAT WIJ NIET OPSLAAN
- Geen Exact Online boekhouddata
- Geen AI conversaties
- Geen queries van gebruikers
- Alleen: OAuth tokens (encrypted), user accounts, API usage statistics
```

---

## Privacy & Security Antwoorden

### Is data beschermd tegen ongeautoriseerde toegang?

Ja. Alle verbindingen gebruiken HTTPS met TLS 1.3. OAuth tokens worden versleuteld opgeslagen met AES-256-GCM. Session cookies zijn httpOnly en secure. Exact Online data wordt niet opgeslagen.

### Welke data wordt opgeslagen en voor hoe lang?

- Gebruikersaccount (email, naam): tot account verwijdering
- OAuth refresh tokens (encrypted): tot verbinding wordt ingetrokken
- Session data: 30 dagen
- Exact Online data: NIET opgeslagen

### Hoe kan een gebruiker zijn data verwijderen?

Gebruikers kunnen:
1. Verbinding intrekken via dashboard (direct)
2. Account verwijderen via support (binnen 24 uur)
Alle data wordt dan permanent verwijderd.

### Wordt data gedeeld met derden?

Onze app is een MCP-server (Model Context Protocol) die fungeert als "brug" tussen Exact Online en AI-assistenten. De data flow is als volgt:

1. Gebruiker stelt vraag via hun AI-assistent (bijv. ChatGPT, Claude)
2. AI-assistent vraagt data op via onze MCP-server
3. Wij halen de relevante data op bij Exact Online
4. Data wordt DIRECT doorgestuurd naar de AI-assistent van de gebruiker
5. Wij slaan GEEN Exact Online data op

**Belangrijke nuance:** De gebruiker kiest zelf welke AI-provider zij gebruiken. Dit kan zijn:
- OpenAI (ChatGPT)
- Anthropic (Claude)
- GitHub Copilot
- Andere MCP-compatible tools
- Zelf-gehoste modellen

Wij hebben geen controle over hoe de gekozen AI-provider de data verwerkt. Om dit risico te mitigeren:
- Tonen wij een disclaimer bij het verbinden
- Informeren wij gebruikers over privacy-instellingen per provider
- Adviseren wij zakelijke AI-abonnementen met betere privacy-garanties
- Bieden wij documentatie op /docs/ai-privacy

De gebruiker is verantwoordelijk voor hun keuze van AI-provider en de bijbehorende privacy-instellingen.

### Hoe wordt version control toegepast?

- Git repository op GitHub
- Branch protection op main branch
- Alle changes via pull requests met code review
- Automated tests (unit, integration)
- CI/CD pipeline via GitHub Actions

### Wat gebeurt er bij een data breach?

1. Incident response team wordt geactiveerd
2. Getroffen gebruikers worden binnen 72 uur geïnformeerd
3. Exact Online wordt geïnformeerd
4. Autoriteit Persoonsgegevens wordt gemeld indien nodig
5. Post-incident review en verbetermaatregelen

---

## Contact Informatie

**Bedrijfsnaam:** WerkenmetAI B.V.
**Website:** https://praatmetjeboekhouding.nl
**Support:** support@praatmetjeboekhouding.nl
**Privacy:** privacy@praatmetjeboekhouding.nl

---

## Categorieën

Aanbevolen categorieën voor de App Store:

1. **Rapportage & Analytics**
2. **Productiviteit**
3. **AI & Automatisering**

---

## Screenshots Specificaties

Aanbevolen screenshots (1280x800 pixels):

1. **Dashboard** - Overzicht met verbonden administraties
2. **Chat Interface** - Voorbeeld van een vraag en antwoord
3. **Verbindingsflow** - Exact Online koppelen stap
4. **Voorbeeldvragen** - Lijst met mogelijke vragen
5. **Pricing** - Overzicht van abonnementen

---

*Versie 1.0 | Januari 2026*
