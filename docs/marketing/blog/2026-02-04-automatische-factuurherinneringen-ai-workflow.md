# Automatische Factuurherinneringen met AI: Exact Online + Gmail Workflow

---
title: "Automatische Factuurherinneringen met AI | Exact Online + Gmail"
description: "Leer hoe je automatisch factuurherinneringen stuurt met ChatGPT of Claude. Koppel Exact Online aan Gmail en bespaar uren per week. Stap-voor-stap uitleg."
keywords: ["factuurherinneringen automatiseren", "Exact Online automatisering", "AI boekhouding workflow", "MCP integratie"]
category: "guide"
author: "Lisa"
date: "2026-02-04"
---

# Automatische Factuurherinneringen met AI: Exact Online + Gmail Workflow

**Leestijd:** 6 minuten
**Moeilijkheid:** Beginner
**Benodigde tools:** ChatGPT Plus of Claude Desktop, Gmail, Exact Online

---

## Het Probleem: Openstaande Facturen Kosten Je Geld

Herkenbaar? Je bent druk met ondernemen, maar ondertussen staan er facturen open. Klanten vergeten te betalen, jij vergeet te herinneren, en voor je het weet loop je tegen cashflow problemen aan.

**De cijfers liegen niet:**
- 30% van ZZP'ers krijgt te maken met te late betalingen
- 55% van MKB-bedrijven heeft wanbetalers
- Gemiddeld staat een factuur 14 dagen langer open dan nodig

Het goede nieuws? Met AI kun je dit volledig automatiseren. In deze guide leer je hoe je ChatGPT of Claude koppelt aan je Exact Online en Gmail om automatisch vriendelijke herinneringen te sturen.

---

## Wat ga je maken?

Een workflow die:
1. **Checkt** welke facturen te laat zijn in Exact Online
2. **Opstelt** een persoonlijke herinneringsmail per klant
3. **Verstuurt** via jouw Gmail (of draft maakt ter goedkeuring)

**Tijdsinvestering:** 15 minuten setup, daarna 0 minuten per week.

---

## Wat heb je nodig?

### Optie A: ChatGPT (Aanbevolen voor beginners)

| Tool | Waarom | Kosten |
|------|--------|--------|
| [Praat met je Boekhouding](https://praatmetjeboekhouding.nl) | Koppelt Exact Online aan AI | Gratis (200 vragen per maand) |
| ChatGPT Plus/Team/Enterprise | Gmail connector ingebouwd | €20/maand |
| Gmail | Directe integratie via ChatGPT | Gratis |

**Voordeel:** ChatGPT heeft Gmail, Google Calendar en Google Drive als [ingebouwde koppelingen](https://help.openai.com/en/articles/11487775-connectors-in-chatgpt). Geen extra setup nodig.

### Optie B: Claude Desktop

| Tool | Waarom | Kosten |
|------|--------|--------|
| [Praat met je Boekhouding](https://praatmetjeboekhouding.nl) | Koppelt Exact Online aan AI | Gratis (200 vragen per maand) |
| Claude Pro/Max/Team | Ondersteunt beveiligde koppelingen | €20-25/maand |
| Gmail koppeling | Aparte koppeling voor Gmail | Gratis (open source) |

**Let op:** Claude heeft [Gmail en Calendar integraties](https://support.claude.com/en/articles/11088742-using-the-gmail-and-google-calendar-integrations) in beta, maar deze kunnen momenteel **alleen lezen** - niet versturen. Voor versturen heb je een aparte [Gmail koppeling](https://github.com/GongRzhe/Gmail-MCP-Server) nodig.

---

## Stap 1: Koppel Exact Online aan je AI

Eerst moet je AI toegang krijgen tot je boekhouddata.

### Via ChatGPT:
1. Ga naar [praatmetjeboekhouding.nl/connect](https://praatmetjeboekhouding.nl/connect)
2. Log in met je Exact Online account
3. Kopieer de koppeling-URL van je dashboard
4. In ChatGPT: Settings → Connectors → Create
5. Plak de URL en klik "Create"

### Via Claude Desktop:
1. Volg dezelfde stappen voor de URL
2. In Claude: Settings → Connectors → Add custom connector
3. Plak de URL

> **Tip:** Bij de eerste vraag word je gevraagd in te loggen met Exact Online. Daarna onthoudt de AI je verbinding.

---

## Stap 2: Koppel Gmail aan je AI

### Voor ChatGPT (Makkelijkst)

Gmail is een ingebouwde koppeling in ChatGPT:

1. Open ChatGPT → Settings → Connectors
2. Zoek "Gmail" in de lijst
3. Klik "Connect" en autoriseer je Google account
4. Klaar! ChatGPT kan nu emails lezen en versturen

### Voor Claude Desktop (Geavanceerd)

Claude's eigen Gmail integratie kan momenteel alleen lezen. Voor versturen:

**Optie 1: Via Zapier**
1. Ga naar [zapier.com/mcp](https://zapier.com/mcp)
2. Voeg "Gmail - Send Email" toe
3. Kopieer de koppeling-URL naar Claude

**Optie 2: Via een open-source Gmail koppeling**
1. Installeer de [Gmail koppeling](https://github.com/GongRzhe/Gmail-MCP-Server)
2. Configureer de beveiligde inlogmethode via Google Cloud Console
3. Zie de setup handleiding op /docs/claude-desktop-setup

> **Tip voor Claude gebruikers:** Begin met lezen van facturen + drafts maken. Je kunt de drafts handmatig versturen vanuit Gmail.

Je AI heeft nu toegang tot:
- Exact Online (lezen van facturen)
- Gmail (lezen + versturen, afhankelijk van setup)

---

## Stap 3: Test de Workflow

Open een nieuwe chat en typ:

```
Welke facturen staan meer dan 14 dagen open?
```

Je AI haalt nu de openstaande facturen op uit Exact Online. Je ziet iets als:

| Klant | Factuurnr | Bedrag | Dagen open |
|-------|-----------|--------|------------|
| Bakkerij De Gouden Croissant | F2026-0042 | €1.250,00 | 21 dagen |
| Hotel Amstel | F2026-0038 | €3.400,00 | 18 dagen |

---

## Stap 4: Genereer en Verstuur Herinneringen

Nu het magische gedeelte. Typ:

```
Stuur een vriendelijke betalingsherinnering naar alle klanten met facturen
ouder dan 14 dagen. Gebruik deze template:

Onderwerp: Herinnering factuur [nummer]

Beste [naam],

Graag herinneren wij u aan onderstaande factuur die nog openstaat:

Factuurnummer: [nummer]
Bedrag: [bedrag]
Vervaldatum: [datum]

Wij verzoeken u vriendelijk het bedrag binnen 7 dagen over te maken.

Met vriendelijke groet,
[Mijn bedrijfsnaam]
```

De AI zal:
1. De openstaande facturen ophalen
2. Per factuur een gepersonaliseerde email genereren
3. De emails versturen (of als draft opslaan, afhankelijk van je voorkeur)

---

## Pro Tips voor Betere Resultaten

### Tip 1: Maak Drafts Eerst
Wil je de emails eerst checken? Vraag:
```
Maak drafts aan in Gmail (niet versturen) voor alle herinneringen
```

### Tip 2: Segmenteer op Bedrag
Grote facturen verdienen extra aandacht:
```
Voor facturen boven €5.000: bel me eerst
Voor facturen €1.000-5.000: stuur formele herinnering
Voor facturen onder €1.000: stuur vriendelijke herinnering
```

### Tip 3: Voeg Betaallink Toe
Als je Mollie of een andere payment provider gebruikt:
```
Voeg aan elke herinnering een betaallink toe
```

### Tip 4: Wekelijks Schema
Vraag elke maandagochtend:
```
Check openstaande facturen en stuur herinneringen waar nodig
```

---

## Veelgestelde Vragen

### Is mijn data veilig?
Ja. Praat met je Boekhouding heeft alleen-lezen toegang tot Exact Online. We slaan geen boekhouddata op. Zie onze [privacy policy](/privacy).

### Kan de AI ook aanmaningen sturen?
Ja! Je kunt de template aanpassen voor verschillende tonen:
- Eerste herinnering: vriendelijk
- Tweede herinnering: zakelijk
- Aanmaning: formeel met consequenties

### Werkt dit ook met Moneybird/Jortt/andere software?
Momenteel ondersteunen we alleen Exact Online. Andere koppelingen staan op onze roadmap.

### Wat als een klant al betaald heeft?
De AI checkt altijd de actuele status in Exact Online. Als een factuur betaald is, wordt er geen herinnering gestuurd.

---

## Wat Kun Je Nog Meer Automatiseren?

Deze workflow is slechts het begin. Met dezelfde tools kun je ook:

| Workflow | Beschrijving |
|----------|--------------|
| **Cashflow naar Slack** | Wekelijks overzicht in je Slack kanaal |
| **Facturen naar Sheets** | Automatische export voor rapportages |
| **Agenda herinneringen** | BTW deadline in je kalender |
| **Klant 360 via email** | Vraag per email "Hoe staat het met klant X?" |

Bekijk al onze [workflow recepten](/workflows) voor meer inspiratie.

---

## Aan de Slag

1. **[Maak gratis account](/connect)** - Verbind je Exact Online
2. **Test de basis** - "Welke facturen staan open?"
3. **Voeg Gmail toe** - Via Zapier
4. **Automatiseer** - Stel je eerste workflow in

Heb je vragen? [Stuur ons een bericht](/contact) of bekijk de [FAQ](/faq).

---

## Bronnen

- [Zapier: Koppel 8.000 apps aan ChatGPT](https://zapier.com/mcp)
- [n8n Google Workspace koppeling](https://n8n.io/workflows/9635-integrate-google-workspace-with-chatgpt-and-openai-agent-builder-using-mcp-bridge/)
- [Teamleader: Herinnering versturen voor je factuur](https://www.teamleader.eu/nl/blog/herinnering-versturen-voor-je-factuur)
- [Onze setup handleiding](https://modelcontextprotocol.info/docs/best-practices/)

---

*Laatst bijgewerkt: 4 februari 2026*
