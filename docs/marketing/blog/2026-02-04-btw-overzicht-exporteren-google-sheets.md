# BTW Voorbereiding: Overzicht Exporteren naar Google Sheets

---
slug: "btw-overzicht-exporteren-google-sheets"
title: "BTW Overzicht Exact Online Exporteren naar Google Sheets | Workflow"
description: "Leer hoe je automatisch je BTW overzicht uit Exact Online exporteert naar Google Sheets met ChatGPT of Claude. Stap-voor-stap handleiding voor ondernemers en accountants."
keywords: ["btw overzicht exact online exporteren", "exact online google sheets koppelen", "btw voorbereiding automatiseren", "exact online btw export"]
category: "workflow-recipe"
difficulty: "Beginner"
platforms: ["ChatGPT", "Claude"]
tools: ["Exact Online", "Google Sheets", "Zapier MCP"]
author: "Lisa"
date: "2026-02-04"
---

# BTW Voorbereiding: Overzicht Exporteren naar Google Sheets

**Leestijd:** 8 minuten
**Moeilijkheid:** Beginner
**Platforms:** ChatGPT Plus | Claude Desktop
**Benodigde tools:** Exact Online, Google Sheets, Praat met je Boekhouding

---

> **TL;DR**
> - Exporteer je BTW overzicht uit Exact Online direct naar Google Sheets
> - Geen handmatig kopiëren of CSV-gedoe meer
> - Werkt met ChatGPT Plus (ingebouwde koppelingen) of Claude Desktop (via de beveiligde koppeling)
> - Setup duurt 15 minuten, daarna elk kwartaal 30 seconden

---

## Het Probleem: BTW Voorbereiding Kost Te Veel Tijd

Elk kwartaal hetzelfde ritueel. Je moet je BTW aangifte voorbereiden, dus je opent Exact Online, navigeert naar rapporten, stelt filters in, exporteert naar CSV, opent Google Sheets, importeert de data, maakt het op...

En een halfuur later ben je klaar met iets dat eigenlijk 2 minuten had moeten kosten.

**De realiteit:**
- 68% van ondernemers wacht tot de laatste week voor de BTW deadline
- Gemiddeld duurt BTW voorbereiding 45 minuten per kwartaal
- Handmatige exports leiden tot kopieerfouten en versieconflicten

En dan heb je je cijfers nog niet eens gecontroleerd of besproken met je accountant.

> **Belangrijk:** Deze workflow helpt bij de voorbereiding van je BTW overzicht. Controleer de cijfers altijd in Exact Online voordat je aangifte doet. Wij zijn een analyse tool, geen aangiftesoftware.

---

## Wat ga je maken?

Een workflow die:
1. **Je BTW data ophaalt** uit Exact Online via AI
2. **De cijfers structureert** per BTW-tarief (21%, 9%, 0%)
3. **Exporteert naar Google Sheets** in een overzichtelijke tabel
4. **Klaar is voor controle** door jou of je accountant

**Tijdsinvestering:** 15 minuten setup, daarna 30 seconden per kwartaal.

**Het eindresultaat:**

| Categorie | Bedrag | BTW |
|-----------|--------|-----|
| Verkopen 21% | EUR 45.000 | EUR 9.450 |
| Verkopen 9% | EUR 12.000 | EUR 1.080 |
| Verkopen 0% | EUR 5.000 | EUR 0 |
| Inkopen voorbelasting | EUR 18.000 | EUR 3.780 |
| **Per saldo af te dragen** | | **EUR 6.750** |

---

## Wat heb je nodig?

### Optie A: ChatGPT Plus (Aanbevolen)

ChatGPT heeft Google Sheets als [ingebouwde koppeling](https://help.openai.com/en/articles/11487775-connectors-in-chatgpt). Dit maakt de setup het makkelijkst.

| Tool | Waarom | Kosten |
|------|--------|--------|
| [Praat met je Boekhouding](https://praatmetjeboekhouding.nl) | Koppelt Exact Online aan ChatGPT | Gratis (60 vragen per maand) |
| ChatGPT Plus/Team/Enterprise | Google Sheets koppeling ingebouwd | EUR 20/maand |
| Google Account | Voor Google Sheets toegang | Gratis |

**Voordeel:** Alles werkt out-of-the-box. Geen extra configuratie nodig voor Sheets.

### Optie B: Claude Desktop

Claude heeft geen ingebouwde Google Sheets integratie, maar je kunt dit oplossen via Zapier of een aparte koppeling.

| Tool | Waarom | Kosten |
|------|--------|--------|
| [Praat met je Boekhouding](https://praatmetjeboekhouding.nl) | Koppelt Exact Online aan Claude | Gratis (60 vragen per maand) |
| Claude Pro/Max/Team | Ondersteunt beveiligde koppelingen | EUR 20-25/maand |
| [Zapier](https://zapier.com/mcp) | Google Sheets schrijftoegang | Gratis (beperkt) |

**Alternatief:** Er zijn ook open-source [Google Sheets koppelingen](https://github.com/xing5/mcp-google-sheets) beschikbaar die je lokaal kunt draaien.

---

## Stap 1: Koppel Exact Online aan je AI

Eerst moet je AI toegang krijgen tot je boekhouddata.

### Via ChatGPT:

1. Ga naar [praatmetjeboekhouding.nl/connect](https://praatmetjeboekhouding.nl/connect)
2. Klik op "Verbinden met Exact Online"
3. Log in met je Exact Online gegevens
4. Geef toestemming voor leestoegang
5. Kopieer de koppeling-URL van je dashboard
6. In ChatGPT: **Settings** → **Connectors** → **Create**
7. Plak de URL en klik "Create"

### Via Claude Desktop:

1. Volg dezelfde stappen 1-5 voor de URL
2. Zie de setup handleiding op /docs/claude-desktop-setup

> **Tip:** Bij de eerste vraag word je gevraagd in te loggen met Exact Online. Daarna onthoudt de AI je verbinding.

---

## Stap 2: Koppel Google Sheets aan je AI

### Voor ChatGPT (Makkelijkst)

Google Sheets is een ingebouwde koppeling in ChatGPT:

1. Open ChatGPT → **Settings** → **Connectors**
2. Zoek "Google Drive" in de lijst (Sheets zit hierin)
3. Klik "Connect" en autoriseer je Google account
4. Klaar! ChatGPT kan nu spreadsheets lezen en maken

**Let op:** ChatGPT's Google Drive koppeling heeft beperkte Sheets functionaliteit. Voor geavanceerde bewerkingen gebruik je Zapier (zie hieronder).

### Voor Claude Desktop (via Zapier)

Claude heeft geen ingebouwde Sheets integratie. De makkelijkste oplossing is Zapier:

1. Ga naar [zapier.com/mcp](https://zapier.com/mcp)
2. Maak een account aan (of log in)
3. Klik "Add Action" en zoek naar "Google Sheets"
4. Voeg toe: **"Create Spreadsheet Row in Google Sheets"**
5. Autoriseer je Google account
6. Kopieer de Zapier koppeling-URL
7. Zie de setup handleiding op /docs/claude-desktop-setup

**Alternatief: Open-source koppeling**

Voor meer controle kun je de [mcp-google-sheets](https://github.com/xing5/mcp-google-sheets) koppeling lokaal draaien:

```bash
uvx mcp-google-sheets@latest
```

Dit vereist wel het instellen van een beveiligde inlogmethode via Google Cloud Console.

---

## Stap 3: Test de Workflow

Open een nieuwe chat en test eerst of beide koppelingen werken.

### Test 1: Exact Online verbinding

```
Wat is mijn BTW positie dit kwartaal?
```

Je zou een overzicht moeten krijgen met af te dragen BTW, voorbelasting, en het nettobedrag.

### Test 2: Google Sheets verbinding (ChatGPT)

```
Maak een nieuwe spreadsheet genaamd "BTW Test" met de tekst "Hello World" in cel A1
```

Als beide tests werken, ben je klaar voor de echte workflow.

---

## Stap 4: Exporteer je BTW Overzicht naar Sheets

Nu het magische gedeelte. Typ de volgende prompt:

### Basis prompt:

```
Haal mijn BTW overzicht op voor Q4 2025 uit Exact Online en exporteer dit naar een nieuwe Google Spreadsheet.

Maak een tabel met:
- Verkopen per BTW tarief (21%, 9%, 0%)
- Totaal verkopen
- Inkopen (voorbelasting)
- Per saldo af te dragen BTW

Noem de spreadsheet "BTW Overzicht Q4 2025"
```

### De AI zal:

1. Je BTW data ophalen uit Exact Online
2. De bedragen structureren per tarief
3. Een nieuwe Google Spreadsheet aanmaken
4. De data netjes in een tabel zetten
5. Je een link geven naar de spreadsheet

### Uitgebreide prompt (voor meer detail):

```
Haal mijn complete BTW overzicht op voor Q4 2025 en exporteer naar Google Sheets.

Ik wil graag:

Tabblad 1 - Samenvatting:
- Verkopen per BTW tarief met bedragen en BTW
- Inkopen voorbelasting
- Netto BTW positie
- Vergelijking met Q3 2025

Tabblad 2 - Detail Verkopen:
- Top 10 facturen op BTW bedrag
- Klant, factuurnummer, datum, bedrag, BTW

Tabblad 3 - Detail Inkopen:
- Top 10 inkoopfacturen
- Leverancier, factuurnummer, datum, bedrag, BTW

Noem het bestand "BTW Voorbereiding Q4 2025"
```

---

## Pro Tips

### Tip 1: Maak een Template Spreadsheet

Werk je elk kwartaal met dezelfde structuur? Maak een template spreadsheet en vraag de AI om de data daarin te plaatsen:

```
Haal mijn BTW overzicht op voor Q1 2026 en vul dit in op de spreadsheet "BTW Template 2026"
in tabblad "Q1" beginnend bij cel A2
```

### Tip 2: Voeg Validatie Toe

Laat de AI ook controleren of de cijfers kloppen:

```
Na het exporteren: check of de som van de BTW per tarief overeenkomt met het totaal.
Markeer afwijkingen groter dan EUR 1 in rood.
```

### Tip 3: Automatische Formatting

Vraag om professionele opmaak voor je accountant:

```
Maak de spreadsheet op met:
- Header in blauw met witte tekst
- Bedragen rechts uitgelijnd met EUR teken
- Negatieve bedragen in rood
- Totaalrijen vetgedrukt
```

### Tip 4: Deel Direct met je Accountant

```
Deel de spreadsheet direct met mijn accountant op accountant@kantoor.nl met "kan bekijken" rechten
```

---

## Veelgestelde Vragen

### Klopt de BTW berekening altijd?

De AI haalt de exacte data op uit je Exact Online administratie. De cijfers zijn dus zo accuraat als je boekhouding. Controleer altijd de cijfers in Exact Online voordat je aangifte doet.

### Kan ik dit ook met andere spreadsheet software?

Momenteel werkt deze workflow met Google Sheets. Microsoft Excel Online ondersteuning is in ontwikkeling. Je kunt de Google Sheet wel downloaden als .xlsx.

### Werkt dit ook met meerdere administraties?

Ja. Als je meerdere administraties hebt gekoppeld, specificeer dan welke:

```
Haal de BTW data op voor administratie "Holding BV" en exporteer naar Sheets
```

### Wat als mijn boekhouding niet up-to-date is?

De AI werkt met de data die in Exact Online staat. Nog niet geboekte facturen worden niet meegenomen. Je kunt wel vragen: "Zijn er nog onverwerkte facturen dit kwartaal?"

### Hoeveel kost dit?

- **Praat met je Boekhouding:** Gratis tot 60 vragen per maand
- **ChatGPT Plus:** EUR 20/maand (inclusief Sheets koppeling)
- **Claude Pro + Zapier:** EUR 20-25/maand + Zapier taken (2 taken per export)

### Is mijn data veilig?

Ja. Er wordt geen financiele data opgeslagen. Alle verzoeken gaan real-time naar Exact Online en Google. De verbinding is alleen-lezen naar Exact en versleuteld via HTTPS.

---

## Gerelateerde Workflows

Als je deze workflow nuttig vindt, bekijk dan ook:

| Workflow | Beschrijving |
|----------|--------------|
| [Automatische factuurherinneringen](/blog/automatische-factuurherinneringen-ai-workflow) | Stuur herinneringen via Gmail |
| [Maandelijkse P&L export](/workflows) | Winst & verlies naar Sheets |
| [Cashflow update in Slack](/workflows) | Dagelijkse financiele updates |
| [BTW deadline herinneringen](/workflows) | Nooit meer de deadline missen |

---

## Aan de Slag

1. **[Maak gratis account](/connect)** - Verbind je Exact Online
2. **Test de BTW vraag** - "Wat is mijn BTW positie dit kwartaal?"
3. **Koppel Google Sheets** - Via ChatGPT koppeling of Zapier
4. **Exporteer** - Gebruik de prompts uit dit artikel

Heb je vragen over de setup? [Stuur ons een bericht](/contact) of bekijk de [FAQ](/faq).

---

## Bronnen

- [ChatGPT Connectors Documentatie](https://help.openai.com/en/articles/11487775-connectors-in-chatgpt)
- [Zapier: Koppel 8.000 apps](https://zapier.com/mcp)
- [Google Sheets koppeling (GitHub)](https://github.com/xing5/mcp-google-sheets)
- [Claude Desktop setup handleiding](https://support.claude.com)
- [Onze setup handleiding](https://modelcontextprotocol.info/docs/best-practices/)

---

*Laatst bijgewerkt: 4 februari 2026*
