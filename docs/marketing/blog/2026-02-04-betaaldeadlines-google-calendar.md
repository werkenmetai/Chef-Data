# Betaaldeadlines Automatisch in Google Calendar Zetten

---
slug: "betaaldeadlines-google-calendar"
title: "Betaaldeadlines Automatisch in Google Calendar | Exact Online Workflow"
description: "Nooit meer een betaaldeadline missen. Leer hoe je automatisch vervaldatums uit Exact Online in je Google Calendar zet met ChatGPT of Claude. Inclusief herinneringen."
keywords: ["factuur deadlines agenda", "betaalherinneringen google calendar", "exact online calendar koppelen", "vervaldatums automatiseren"]
category: "workflow-recipe"
difficulty: "Beginner"
platforms: ["ChatGPT", "Claude"]
tools: ["Exact Online", "Google Calendar", "Praat met je Boekhouding"]
author: "Lisa"
date: "2026-02-04"
---

# Betaaldeadlines Automatisch in Google Calendar Zetten

**Leestijd:** 7 minuten
**Moeilijkheid:** Beginner
**Platforms:** ChatGPT Plus | Claude Desktop
**Benodigde tools:** Exact Online, Google Calendar, Praat met je Boekhouding

---

> **TL;DR**
> - Haal openstaande facturen op uit Exact Online met hun vervaldatums
> - Zet betaaldeadlines automatisch als events in je Google Calendar
> - Krijg herinneringen 3 en 7 dagen voor de deadline
> - Werkt met ChatGPT Plus (ingebouwde Calendar koppeling) of Claude Desktop
> - Setup duurt 15 minuten, scheelt je wekelijks handmatig werk

---

## Het Probleem: Gemiste Deadlines Kosten Je Geld

Je kent het scenario. Je bent druk met je dagelijkse werk, schakelt tussen klanten, projecten en administratie. En dan komt die e-mail: "Uw factuur is 14 dagen over de vervaldatum. Bij uitblijven van betaling..."

Of erger: je leverancier stopt met leveren omdat jij vergeten bent te betalen.

**De harde cijfers:**

- 42% van ZZP'ers heeft minstens een keer een betaaldeadline gemist
- Gemiddelde boete voor te late betaling: EUR 40 plus rente
- Late betalingen van klanten zorgen bij 35% van ondernemers voor cashflowproblemen

Het probleem zit niet in onwil. Het probleem zit in overzicht. Vervaldatums staan verspreid over facturen in Exact Online, e-mails van leveranciers en papieren bonnetjes. En jouw agenda weet van niets.

Stel je voor dat elke belangrijke betaaldeadline automatisch in je agenda staat. Met een herinnering een week van tevoren. En eentje drie dagen ervoor. Zodat je nooit meer verrast wordt door een vervallen factuur.

Dat is precies wat je in dit artikel gaat maken.

---

## Wat ga je maken?

Een workflow die:

1. **Openstaande facturen ophaalt** uit Exact Online (zowel te betalen als te ontvangen)
2. **Vervaldatums extraheert** en omzet naar calendar events
3. **Events aanmaakt** in je Google Calendar met de juiste details
4. **Herinneringen instelt** zodat je op tijd actie kunt nemen

**Tijdsinvestering:** 15 minuten eenmalige setup. Daarna voer je de workflow uit wanneer je wilt - dat kost je 30 seconden.

**Het eindresultaat:**

Een Google Calendar event dat er zo uitziet:

```
Titel: Betaaldeadline: F2026-0142 - Bakkerij De Gouden Croissant (EUR 1.250)
Datum: 15 februari 2026
Tijd: 09:00 - 09:15 (hele dag optioneel)
Locatie: Exact Online
Beschrijving:
  Factuurnummer: F2026-0142
  Klant: Bakkerij De Gouden Croissant
  Bedrag: EUR 1.250,00
  Type: Te ontvangen (debiteur)
  Actie: Neem contact op als niet betaald

Herinneringen: 7 dagen, 3 dagen, 1 dag van tevoren
Kleur: Rood (prioriteit)
```

---

## Wat heb je nodig?

### Optie A: ChatGPT Plus (Aanbevolen)

ChatGPT heeft Google Calendar als [ingebouwde koppeling](https://help.openai.com/en/articles/11487775-connectors-in-chatgpt). Dit maakt de setup het simpelst.

| Tool | Waarom | Kosten |
|------|--------|--------|
| [Praat met je Boekhouding](https://praatmetjeboekhouding.nl) | Koppelt Exact Online aan ChatGPT | Gratis (60 vragen per maand) |
| ChatGPT Plus/Team/Enterprise | Google Calendar koppeling ingebouwd | EUR 20/maand |
| Google Account | Voor Calendar toegang | Gratis |

**Voordeel:** Alles werkt out-of-the-box. Je kunt direct events aanmaken zonder extra configuratie.

### Optie B: Claude Desktop

Claude heeft [Google Calendar integratie](https://support.claude.com/en/articles/11088742-using-the-gmail-and-google-calendar-integrations) in beta. Deze kan agenda's lezen en events aanmaken.

| Tool | Waarom | Kosten |
|------|--------|--------|
| [Praat met je Boekhouding](https://praatmetjeboekhouding.nl) | Koppelt Exact Online aan Claude | Gratis (60 vragen per maand) |
| Claude Pro/Max/Team | Ondersteunt beveiligde koppelingen + Calendar beta | EUR 20-25/maand |
| Google Account | Voor Calendar toegang | Gratis |

**Let op:** Claude's Calendar integratie is in beta en kan wijzigen. Als alternatief kun je [Zapier](https://zapier.com/mcp) gebruiken voor meer betrouwbare Calendar toegang.

---

## Stap 1: Koppel Exact Online aan je AI

Eerst moet je AI toegang krijgen tot je factuurdata.

### Via ChatGPT:

1. Ga naar [praatmetjeboekhouding.nl/connect](https://praatmetjeboekhouding.nl/connect)
2. Klik op "Verbinden met Exact Online"
3. Log in met je Exact Online gegevens
4. Geef toestemming voor leestoegang
5. Kopieer de koppeling-URL van je dashboard
6. In ChatGPT: **Settings** > **Connectors** > **Create**
7. Plak de URL en klik "Create"

### Via Claude Desktop:

1. Volg dezelfde stappen 1-5 voor de URL
2. Zie de setup handleiding op /docs/claude-desktop-setup

> **Tip:** Bij de eerste vraag word je gevraagd in te loggen met Exact Online. Daarna onthoudt de AI je verbinding.

---

## Stap 2: Koppel Google Calendar aan je AI

### Voor ChatGPT (Makkelijkst)

Google Calendar is een ingebouwde koppeling:

1. Open ChatGPT > **Settings** > **Connectors**
2. Zoek "Google Calendar" in de lijst
3. Klik "Connect" en autoriseer je Google account
4. Selecteer welke agenda's ChatGPT mag gebruiken
5. Klaar. ChatGPT kan nu events lezen en aanmaken.

### Voor Claude Desktop

Activeer de ingebouwde Calendar integratie:

1. Open Claude Desktop > **Settings** > **Integrations**
2. Zoek "Google Calendar"
3. Klik "Connect" en autoriseer je Google account
4. Herstart Claude indien nodig

**Alternatief via Zapier:**

Als de ingebouwde integratie niet werkt of je meer controle wilt:

1. Ga naar [zapier.com/mcp](https://zapier.com/mcp)
2. Voeg toe: "Google Calendar - Create Detailed Event"
3. Autoriseer je Google account
4. Zie de setup handleiding op /docs/claude-desktop-setup

---

## Stap 3: Test de Verbindingen

Open een nieuwe chat en test beide koppelingen.

### Test 1: Exact Online

```
Welke facturen staan open met een vervaldatum in de komende 30 dagen?
```

Je zou een overzicht moeten krijgen met facturen, bedragen en vervaldatums.

### Test 2: Google Calendar

```
Wat staat er morgen in mijn agenda?
```

Als beide tests werken, ben je klaar voor de workflow.

---

## Stap 4: Maak de Calendar Events

Nu het werkende gedeelte. Gebruik onderstaande prompt om automatisch events aan te maken.

### Basis prompt:

```
Haal alle openstaande facturen op uit Exact Online (zowel te ontvangen als te betalen).

Voor elke factuur met een vervaldatum in de komende 60 dagen:
Maak een Google Calendar event aan met:
- Titel: "Betaaldeadline: [factuurnr] - [klant/leverancier] (EUR [bedrag])"
- Datum: de vervaldatum van de factuur
- Tijd: 09:00
- Beschrijving met: factuurnummer, relatie, bedrag, type (te ontvangen/te betalen)
- Herinneringen: 7 dagen en 3 dagen van tevoren

Geef een samenvatting van welke events zijn aangemaakt.
```

### Uitgebreide prompt (met prioriteit):

```
Haal alle openstaande facturen op uit Exact Online.

Maak Google Calendar events voor vervaldatums in de komende 60 dagen.

Gebruik deze regels:
- Facturen boven EUR 5.000: markeer als URGENT in titel, zet 3 herinneringen (14, 7, 3 dagen)
- Facturen EUR 1.000-5.000: standaard titel, 2 herinneringen (7, 3 dagen)
- Facturen onder EUR 1.000: prefix met "Klein:", 1 herinnering (3 dagen)

Event format:
- Titel: "[prioriteit] Betaaldeadline: [nr] - [naam] EUR [bedrag]"
- Hele dag event op de vervaldatum
- Beschrijving: factuurnummer, relatie, bedrag, dagen tot deadline, contactgegevens indien beschikbaar

Laat de crediteuren (te betalen) zien in de ochtend, debiteuren (te ontvangen) in de middag.
```

---

## Voorbeeld Calendar Event

Na het uitvoeren van de workflow zie je events zoals:

**URGENT Betaaldeadline: F2026-0089 - Hotel Amstel EUR 8.500**
- Datum: 20 februari 2026
- Tijd: Hele dag
- Beschrijving:
  ```
  Factuurnummer: F2026-0089
  Klant: Hotel Amstel
  Bedrag: EUR 8.500,00
  Type: Te ontvangen (debiteur)
  Dagen tot deadline: 16

  Actie: Neem 1 week van tevoren contact op als niet betaald
  ```
- Herinneringen: 14 dagen, 7 dagen, 3 dagen

**Betaaldeadline: INK-2026-0234 - Groothandel Jansen EUR 2.100**
- Datum: 18 februari 2026
- Tijd: 09:00
- Beschrijving:
  ```
  Factuurnummer: INK-2026-0234
  Leverancier: Groothandel Jansen
  Bedrag: EUR 2.100,00
  Type: Te betalen (crediteur)
  Dagen tot deadline: 14

  Actie: Betaling inplannen
  ```
- Herinneringen: 7 dagen, 3 dagen

---

## Pro Tips

### Tip 1: Gebruik Kleurtags

Vraag de AI om verschillende kleuren te gebruiken:

```
Gebruik kleur ROOD voor te betalen facturen (crediteuren)
Gebruik kleur GROEN voor te ontvangen facturen (debiteuren)
```

Zo zie je in een oogopslag of je geld moet uitgeven of kunt verwachten.

### Tip 2: Wekelijkse Refresh

Facturen veranderen. Sommige worden betaald, nieuwe komen erbij. Plan een wekelijkse check:

```
Check mijn openstaande facturen.
Verwijder calendar events voor facturen die inmiddels betaald zijn.
Voeg events toe voor nieuwe openstaande facturen.
```

### Tip 3: Gescheiden Agenda

Maak een aparte agenda "Financiele Deadlines" in Google Calendar. Zo kun je deze aan/uit zetten zonder je persoonlijke afspraken te vervuilen:

```
Maak alle betaaldeadline events aan in mijn agenda "Financiele Deadlines"
```

### Tip 4: Combineer met Actie

Voeg een concrete actie toe aan elk event:

```
Zet in de beschrijving ook:
- Voor debiteuren: "Check betaalstatus, stuur herinnering indien nodig"
- Voor crediteuren: "Controleer factuur, plan betaling via bank"
```

---

## Veelgestelde Vragen

### Worden events automatisch bijgewerkt als een factuur betaald wordt?

Nee, de workflow maakt eenmalig events aan. Je moet periodiek de workflow opnieuw draaien om betaalde facturen te verwijderen.

Je kunt dit oplossen door wekelijks te vragen: "Verwijder calendar events voor facturen die inmiddels betaald zijn."

### Kan ik dit ook voor een specifieke klant of leverancier doen?

Ja. Specificeer de naam in je prompt:

```
Maak calendar events voor alle openstaande facturen van Bakkerij De Gouden Croissant
```

### Werkt dit ook met meerdere administraties?

Ja. Als je meerdere administraties hebt gekoppeld, kun je specificeren welke:

```
Haal openstaande facturen op uit administratie "Holding BV" en maak calendar events
```

### Kan ik ook events maken voor facturen die ik moet versturen?

Deze workflow focust op bestaande facturen. Voor nog te versturen facturen kun je een reminder aanmaken op basis van projecten of urenregistratie. Dat is een aparte workflow.

### Hoeveel kost dit?

- **Praat met je Boekhouding:** Gratis tot 60 vragen per maand
- **ChatGPT Plus:** EUR 20/maand (Calendar koppeling inbegrepen)
- **Claude Pro:** EUR 20/maand (Calendar integratie in beta)

### Is mijn data veilig?

Ja. Er wordt geen financiele data opgeslagen. Alle verzoeken gaan real-time naar Exact Online. De verbinding naar Exact is alleen-lezen en versleuteld via HTTPS.

---

## Gerelateerde Workflows

Als je deze workflow nuttig vindt:

| Workflow | Beschrijving |
|----------|--------------|
| [Automatische factuurherinneringen](/blog/automatische-factuurherinneringen-ai-workflow) | Stuur herinneringen via Gmail |
| [BTW overzicht naar Sheets](/blog/btw-overzicht-exporteren-google-sheets) | Export voor je aangifte |
| [Cashflow forecast](/workflows) | Voorspel je liquiditeit |
| [Wekelijkse financiele samenvatting](/workflows) | Overzicht in je inbox |

---

## Aan de Slag

1. **[Maak gratis account](/connect)** - Verbind je Exact Online
2. **Test de factuurvraag** - "Welke facturen staan open?"
3. **Koppel Google Calendar** - Via ChatGPT koppeling of Claude integratie
4. **Maak je eerste events** - Gebruik de prompts uit dit artikel
5. **Plan een wekelijkse refresh** - Houd je agenda up-to-date

Nooit meer een betaaldeadline missen. Dat is het idee.

Heb je vragen over de setup? [Stuur ons een bericht](/contact) of bekijk de [FAQ](/faq).

---

## Bronnen

- [ChatGPT Connectors Documentatie](https://help.openai.com/en/articles/11487775-connectors-in-chatgpt)
- [Claude Calendar Integratie](https://support.claude.com/en/articles/11088742-using-the-gmail-and-google-calendar-integrations)
- [Zapier: Koppel 8.000 apps](https://zapier.com/mcp)
- [Google Calendar best practices](https://developers.google.com/calendar/api/guides/best-practices)

---

*Laatst bijgewerkt: 4 februari 2026*
