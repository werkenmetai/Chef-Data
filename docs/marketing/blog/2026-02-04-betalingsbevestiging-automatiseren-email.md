# Betalingsbevestigingen Automatisch Sturen na Ontvangst Betaling

---
slug: "betalingsbevestiging-automatiseren-email"
title: "Betalingsbevestiging Automatiseren | Exact Online + Gmail Workflow"
description: "Leer hoe je automatisch een bedankmail stuurt wanneer een klant betaalt. Koppel Exact Online aan Gmail via ChatGPT en verbeter je klantenservice zonder extra werk."
keywords: ["betalingsbevestiging automatiseren", "bedankmail na betaling", "exact online email automatisering", "klantcommunicatie automatiseren"]
category: "workflow-recipe"
difficulty: "Beginner"
platforms: ["ChatGPT"]
tools: ["Exact Online", "Gmail", "Praat met je Boekhouding"]
author: "Lisa"
date: "2026-02-04"
---

# Betalingsbevestigingen Automatisch Sturen na Ontvangst Betaling

**Leestijd:** 7 minuten
**Moeilijkheid:** Beginner
**Platform:** ChatGPT Plus
**Benodigde tools:** Exact Online, Gmail, Praat met je Boekhouding

---

> **TL;DR**
> - Stuur automatisch een bedankmail wanneer een klant een factuur betaalt
> - Combineer Exact Online met Gmail via ChatGPT Plus
> - Werkt met de ingebouwde Gmail koppeling van ChatGPT
> - Setup duurt 15 minuten, daarna volledig automatisch

---

## Het Probleem: Gemiste Kansen bij Klantencontact

Je factuur is betaald. Mooi. En dan? Bij de meeste ondernemers gebeurt er niets. De betaling komt binnen, Exact Online verwerkt het, en dat is het.

Maar je mist hiermee een waardevol contactmoment.

**Waarom een betalingsbevestiging sturen?**

- **Professionaliteit:** Het onderscheidt je van bedrijven die alleen contact opnemen als er iets fout gaat
- **Vertrouwen:** Klanten krijgen zekerheid dat hun betaling correct is verwerkt
- **Klantenrelatie:** Een kort bedankje houdt de relatie warm voor toekomstige opdrachten
- **Upsell kansen:** Je kunt nieuwe diensten of aanbiedingen subtiel meenemen

Accountantskantoren en consultants die dit doen, merken dat klanten vaker terugkomen. Het is een klein gebaar met groot effect.

Het probleem? Niemand heeft tijd om elke binnenkomende betaling handmatig te checken en een mailtje te sturen. Dat is waar automatisering van pas komt.

---

## Wat ga je maken?

Een workflow die:
1. **Checkt** welke facturen recent betaald zijn in Exact Online
2. **Genereert** een gepersonaliseerde bedankmail per klant
3. **Verstuurt** de email via jouw Gmail account

**Tijdsinvestering:** 15 minuten setup, daarna 0 minuten per week.

**Het resultaat:** Elke klant die betaalt, ontvangt binnen een werkdag een professionele bevestiging - zonder dat jij er iets voor hoeft te doen.

---

## Wat heb je nodig?

Je kunt nu direct aan de slag met ChatGPT Plus dankzij de ingebouwde Gmail koppeling. Je hebt geen technische kennis nodig.

| Tool | Waarom | Kosten |
|------|--------|--------|
| [Praat met je Boekhouding](https://praatmetjeboekhouding.nl) | Koppelt Exact Online aan ChatGPT | Gratis (200 vragen per maand) |
| ChatGPT Plus/Team/Enterprise | Gmail koppeling ingebouwd | EUR 20/maand |
| Gmail | Voor het versturen van emails | Gratis |
| Exact Online | Je boekhoudpakket | Bestaand abonnement |

**Waarom ChatGPT Plus?**

ChatGPT heeft Gmail, Google Calendar en Google Drive als [ingebouwde koppelingen](https://help.openai.com/en/articles/11487775-connectors-in-chatgpt). Dit betekent dat je zonder extra configuratie emails kunt lezen en versturen.

Voor Claude Desktop zou je een aparte Gmail koppeling moeten installeren - dat is technisch complexer.

---

## Stap 1: Koppel Exact Online aan ChatGPT

Eerst moet ChatGPT toegang krijgen tot je boekhouddata om te zien welke facturen betaald zijn.

1. Ga naar [praatmetjeboekhouding.nl/connect](https://praatmetjeboekhouding.nl/connect)
2. Klik op "Verbinden met Exact Online"
3. Log in met je Exact Online gegevens
4. Geef toestemming voor leestoegang (er worden alleen leesrechten gevraagd)
5. Kopieer de koppeling-URL van je dashboard
6. Open ChatGPT: **Settings** → **Connectors** → **Create**
7. Plak de URL en klik "Create"

De eerste keer dat je een vraag stelt over je boekhouding, vraagt ChatGPT je om in te loggen bij Exact Online. Daarna onthoudt het systeem je verbinding.

> **Let op:** Praat met je Boekhouding heeft alleen leestoegang tot Exact Online. Er kunnen geen facturen worden aangemaakt of betalingen worden verwerkt - alleen data uitlezen.

---

## Stap 2: Koppel Gmail aan ChatGPT

Gmail is een standaard koppeling in ChatGPT Plus. De setup is simpel:

1. Open ChatGPT → **Settings** → **Connectors**
2. Zoek "Gmail" in de lijst met beschikbare koppelingen
3. Klik "Connect"
4. Autoriseer je Google account (kies het account waarmee je zakelijke mail stuurt)
5. Accepteer de permissions

ChatGPT kan nu:
- Je inbox lezen (om te checken of je al contact hebt gehad met een klant)
- Emails versturen namens jou
- Conceptmails opslaan als draft

**Privacy tip:** ChatGPT leest alleen emails die relevant zijn voor je vraag. Je hele inbox wordt niet geindexeerd of opgeslagen.

---

## Stap 3: Test de Workflow

Voordat je automatisch gaat versturen, test eerst of beide koppelingen werken.

### Test 1: Exact Online verbinding

Open een nieuwe chat en typ:

```
Welke facturen zijn de afgelopen 7 dagen betaald?
```

Je zou een overzicht moeten krijgen zoals:

| Klant | Factuurnr | Bedrag | Betaaldatum |
|-------|-----------|--------|-------------|
| Bakkerij De Gouden Croissant | F2026-0042 | EUR 1.250,00 | 2 feb 2026 |
| Hotel Amstel | F2026-0038 | EUR 3.400,00 | 1 feb 2026 |
| Drukkerij Snelpers | F2026-0051 | EUR 875,00 | 31 jan 2026 |

### Test 2: Gmail verbinding

Typ vervolgens:

```
Maak een concept email aan met onderwerp "Test" en inhoud "Dit is een test"
```

Check in je Gmail of de draft is aangemaakt. Als beide tests werken, ben je klaar voor de echte workflow.

---

## Stap 4: Stuur Betalingsbevestigingen

Nu het echte werk. Je kunt dit op twee manieren aanpakken:

### Optie A: Handmatig triggeren (aanbevolen om te starten)

Vraag dagelijks of wekelijks:

```
Check welke facturen de afgelopen 3 dagen betaald zijn en stuur elke klant een betalingsbevestiging via Gmail.

Gebruik deze template:

Onderwerp: Betalingsbevestiging [factuurnummer]

Beste [naam klant],

Bedankt voor je betaling van EUR [bedrag] voor factuur [nummer].

We hebben de betaling in goede orde ontvangen en verwerkt. Hierbij bevestigen we dat deze factuur volledig is voldaan.

Mocht je vragen hebben, neem gerust contact op.

Met vriendelijke groet,
[Mijn bedrijfsnaam]
[Mijn telefoonnummer]
```

### Optie B: Concept emails maken (voor controle)

Wil je de emails eerst zelf checken voordat ze de deur uit gaan?

```
Check betaalde facturen van de afgelopen week en maak concept emails aan in Gmail (niet versturen).

Ik wil ze eerst nakijken voordat ze verstuurd worden.
```

Je vindt de concepten daarna in je Gmail Drafts folder.

---

## Voorbeeld Email Template

Hier is een professionele template die je kunt aanpassen:

### Standaard bevestiging

```
Onderwerp: Betalingsbevestiging factuur [nummer]

Beste [naam],

Hartelijk dank voor je betaling.

We hebben EUR [bedrag] ontvangen voor factuur [nummer] van [datum factuur]. De betaling is verwerkt en de factuur is hiermee volledig voldaan.

Voor je administratie:
- Factuurnummer: [nummer]
- Factuurdatum: [datum]
- Betaald bedrag: EUR [bedrag]
- Betaaldatum: [datum betaling]

Heb je vragen? Neem gerust contact met ons op.

Met vriendelijke groet,

[Naam]
[Bedrijf]
[Telefoon]
```

### Informele variant (voor creatieve bedrijven)

```
Onderwerp: Thanks! Betaling ontvangen

Hi [naam],

Je betaling van EUR [bedrag] is binnen. Factuur [nummer] staat op voldaan.

Bedankt voor de snelle afhandeling. Mocht je nog iets nodig hebben, je weet me te vinden.

Groet,
[Naam]
```

### Met upsell (voor dienstverleners)

```
Onderwerp: Betaling ontvangen - Factuur [nummer]

Beste [naam],

Je betaling van EUR [bedrag] voor factuur [nummer] is in goede orde ontvangen. Bedankt!

Nu we dit project hebben afgerond: we hebben onlangs [nieuwe dienst/product] gelanceerd dat mogelijk interessant voor je is. Wil je er meer over weten? Laat het me weten.

Tot de volgende keer,

[Naam]
[Bedrijf]
```

---

## Pro Tips

### Tip 1: Personaliseer op Basis van Klanthistorie

Vraag ChatGPT om context mee te nemen:

```
Check betaalde facturen en stuur bevestigingen. Als dit de eerste factuur is van een klant, voeg dan toe: "Welkom als klant!" Als het een terugkerende klant is, noem dan hoelang ze al klant zijn.
```

### Tip 2: Timing is Belangrijk

Stuur de bevestiging binnen 24 uur na de betaling. Niet na 3 dagen - dan voelt het alsof je niet oplet. Niet binnen 5 minuten - dat kan spammerig overkomen.

Een goede routine: check elke ochtend om 9:00 de betalingen van de vorige dag.

### Tip 3: Segmenteer op Bedrag

Grote klanten verdienen extra aandacht:

```
Voor betalingen boven EUR 5.000: stuur een persoonlijke email en voeg toe dat ik graag even bel om te bedanken.

Voor betalingen onder EUR 5.000: stuur de standaard bevestiging.
```

### Tip 4: Houd een Log Bij

Vraag ChatGPT om bij te houden wie al een bevestiging heeft ontvangen:

```
Check betaalde facturen van deze week. Stuur alleen bevestigingen naar klanten die nog geen email hebben gehad (check mijn "Verzonden items" folder).
```

### Tip 5: Combineer met Factuurherinneringen

Je kunt deze workflow combineren met de [automatische factuurherinneringen workflow](/blog/automatische-factuurherinneringen-ai-workflow). Zo heb je beide kanten afgedekt: herinneringen voor te late betalers, bedankmails voor snelle betalers.

---

## Veelgestelde Vragen

### Werkt dit ook als ik meerdere administraties heb?

Ja. Specificeer welke administratie je wilt checken:

```
Check betaalde facturen in administratie "Holding BV" en stuur bevestigingen
```

### Kan ik dit ook voor creditfacturen gebruiken?

Absoluut. Je kunt de prompt aanpassen:

```
Check alle verwerkte creditfacturen en stuur een bevestiging dat het bedrag is teruggestort
```

### Wat als een klant meerdere facturen tegelijk betaalt?

ChatGPT bundelt dit automatisch als je vraagt:

```
Als een klant meerdere facturen heeft betaald, stuur dan een email met een overzicht van alle facturen in plaats van losse emails per factuur
```

### Wordt mijn boekhouddata opgeslagen?

Nee. Praat met je Boekhouding slaat geen financiele data op. Elk verzoek gaat real-time naar Exact Online. Na je sessie wordt niets bewaard.

### Kan ik dit ook in het Engels voor internationale klanten?

Ja. Voeg aan je prompt toe:

```
Stuur de bevestiging in het Engels als de klantnaam niet-Nederlands lijkt of als eerdere correspondentie in het Engels was
```

---

## Gerelateerde Workflows

Deze workflow past goed bij andere automatiseringen:

| Workflow | Beschrijving |
|----------|--------------|
| [Automatische factuurherinneringen](/blog/automatische-factuurherinneringen-ai-workflow) | Stuur herinneringen voor openstaande facturen |
| [BTW overzicht naar Sheets](/blog/btw-overzicht-exporteren-google-sheets) | Exporteer BTW data voor je accountant |
| Cashflow update in Slack | Dagelijks overzicht in je teamchat |
| Klant 360 rapport | Volledig overzicht per klant |

---

## Aan de Slag

1. **[Maak gratis account](/connect)** - Verbind je Exact Online
2. **Koppel Gmail** - Via ChatGPT's ingebouwde koppeling
3. **Test de basis** - "Welke facturen zijn deze week betaald?"
4. **Stuur je eerste bevestiging** - Begin met conceptmails

Na 15 minuten setup heb je een professionele workflow die je klantenrelaties versterkt zonder extra werk.

Heb je vragen over de setup? [Stuur ons een bericht](/contact) of bekijk de [FAQ](/faq).

---

## Bronnen

- [ChatGPT Connectors Documentatie](https://help.openai.com/en/articles/11487775-connectors-in-chatgpt)
- [Gmail koppeling in ChatGPT](https://help.openai.com/en/articles/11487775-connectors-in-chatgpt#h_48d01bb3d4)
- [Praat met je Boekhouding - Aan de slag](/connect)
- [Onze setup handleiding](https://modelcontextprotocol.info/docs/best-practices/)

---

*Laatst bijgewerkt: 4 februari 2026*
