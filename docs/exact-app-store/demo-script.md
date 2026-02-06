# Demo Script - Exact Online Partnermanager

> Scenario voor de demonstratie aan de Exact Online partnermanager

---

## Demo Mode (Multi-Industry)

Sinds januari 2026 beschikken we over een **volledig functionerende demo mode** met 4 verschillende fictieve bedrijven. Geen echte Exact Online koppeling nodig - alles werkt met realistische nep data.

### Demo API Keys

| API Key | Bedrijf | Branche | Jaaromzet |
|---------|---------|---------|-----------|
| `exa_demo` | Bakkerij De Gouden Croissant B.V. | Bakkerij | €1.5M |
| `exa_demo_it` | TechVision Consultancy B.V. | IT Services | €2.8M |
| `exa_demo_advocaat` | Van der Berg & Partners Advocaten | Juridisch | €3.2M |
| `exa_demo_aannemer` | Bouwbedrijf De Fundatie B.V. | Bouw | €4.5M |

### Endpoints

**Claude Desktop (Custom Connector) - NIEUW:**
```
https://api.praatmetjeboekhouding.nl/demo/{demo_key}
```

**Claude Code CLI:**
```
https://api.praatmetjeboekhouding.nl/mcp/{demo_key}
```

**Legacy/Development:**
```
https://exact-mcp-api.matthijs-9b9.workers.dev/mcp/{demo_key}
```

### Snelle Test (curl)
```bash
curl -s -X POST "https://exact-mcp-api.matthijs-9b9.workers.dev/mcp/exa_demo_it" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_divisions","arguments":{}}}'
```

### Ondersteunde Tools (46 totaal)
Alle 46 MCP tools werken in demo mode met industry-specifieke data:
- Facturen, relaties, transacties
- Omzet, winst/verlies, BTW
- Cashflow, voorraad, projecten
- En meer...

---

## Voorbereiding (Alternatief: Echte Data)

### Benodigdheden
- [ ] Demo Exact Online administratie met realistische data
- [ ] Demo account op praatmetjeboekhouding.nl
- [ ] ChatGPT of Claude sessie klaar
- [ ] Scherm delen gereed

### Test vooraf
- [ ] Verbinding werkt
- [ ] API responses zijn snel (< 3 sec)
- [ ] Voorbeeldvragen geven goede antwoorden

---

## Demo Flow (15-20 minuten)

### 1. Introductie (2 min)

"Praat met je Boekhouding maakt het mogelijk om in gewone taal vragen te stellen aan je Exact Online administratie. Geen rapporten bouwen, geen exports maken - gewoon vragen stellen alsof je met een collega praat."

**Key points:**
- Read-only - kan nooit data aanpassen
- Werkt met ChatGPT, Claude en andere AI tools
- Binnen 5 minuten opgezet

---

### 2. Verbinden Demo (3 min)

**Actie:** Laat de verbindingsflow zien

1. "Ik log in op praatmetjeboekhouding.nl"
2. "Klik op 'Verbind Exact Online'"
3. "Je ziet het Exact Online consent scherm - hier geef je toestemming voor read-only toegang"
4. "Na toestemming ben je terug op het dashboard"
5. "Hier zie je je persoonlijke sleutel die je kopieert naar je AI-tool"

**Benadruk:**
- "Let op: wij vragen alleen READ rechten, geen write"
- "De gebruiker kan de verbinding altijd intrekken"

---

### 3. Live Vragen Stellen (8 min)

**Open ChatGPT/Claude en stel de volgende vragen:**

#### Vraag 1: Openstaande facturen
```
Welke facturen staan nog open?
```

**Verwacht antwoord:** Lijst met openstaande facturen, bedragen, vervaldatums

**Toelichting:** "Normaal moet je hiervoor een rapport draaien of naar de debiteurenlijst. Nu stel je gewoon de vraag."

---

#### Vraag 2: Vergelijking
```
Vergelijk de omzet van dit kwartaal met hetzelfde kwartaal vorig jaar
```

**Verwacht antwoord:** Vergelijkingstabel met percentages

**Toelichting:** "Dit soort analyses kosten normaal veel tijd. Nu heb je het in seconden."

---

#### Vraag 3: Klantanalyse
```
Welke 5 klanten betalen het vaakst te laat?
```

**Verwacht antwoord:** Top 5 klanten met betalingsgedrag

**Toelichting:** "Ideaal voor credit management - je ziet direct waar je actie moet ondernemen."

---

#### Vraag 4: Voorraad
```
Van welke artikelen is de voorraad onder het minimum?
```

**Verwacht antwoord:** Lijst met artikelen onder minimumvoorraad

**Toelichting:** "Handig voor inkoop - geen rapport nodig."

---

#### Vraag 5: Complexere vraag
```
Geef een overzicht van de top 10 leveranciers dit jaar op basis van inkoopbedrag, met het gemiddelde betalingstermijn
```

**Verwacht antwoord:** Leveranciersoverzicht met bedragen en termijnen

**Toelichting:** "Dit is normaal een complexe query. De AI combineert meerdere databronnen."

---

### 4. Veiligheid & Privacy (3 min)

**Laat het dashboard zien en leg uit:**

1. **Read-only toegang**
   "Wij kunnen nooit boekingen aanpassen. Dat is technisch onmogelijk gemaakt in de OAuth scopes."

2. **Geen data opslag**
   "Exact Online data wordt niet opgeslagen. Het stroomt direct van Exact naar de AI."

3. **Versleuteling**
   "Tokens zijn versleuteld met AES-256. Alle verbindingen via HTTPS."

4. **Gebruiker heeft controle**
   "Hier kan de gebruiker de verbinding intrekken. Direct effect."

---

### 5. Technische Architectuur (2 min)

**Kort overzicht:**

```
[Gebruiker] → [ChatGPT/Claude] → [Onze MCP Server] → [Exact Online API]
                                        ↓
                                 [Geen opslag]
```

- MCP = Model Context Protocol (open standaard)
- Cloudflare Workers (serverless, EU)
- API rate limiting gerespecteerd

---

### 6. Business Model (2 min)

**Prijzen:**
- Gratis: €0/maand (~60 vragen, 2 administraties)
- Starter: €9/maand (~250 vragen, 3 administraties)
- Pro: €25/maand (~800 vragen, 10 administraties)
- Enterprise: Op aanvraag (onbeperkt)

**Voor Exact:**
- Vergroot waarde van Exact Online platform
- Trekt AI-minded gebruikers aan
- Geen kannibalisatie - complementair aan Exact features

---

### 7. Vragen & Afsluiting

"Wat zijn jullie vragen?"

**Veel voorkomende vragen:**

**V: Wat als de AI foute antwoorden geeft?**
A: "De AI baseert zich op de werkelijke data uit Exact. We geven altijd aan dat het om een AI-interpretatie gaat. De gebruiker kan de brondata altijd verifiëren."

**V: Kunnen jullie ook schrijven naar Exact?**
A: "Nee, bewust niet. Read-only is veiliger en voorkomt fouten. Dit is een design keuze."

**V: Hoe zit het met de API limieten?**
A: "Wij respecteren de 60/min en 5000/dag limieten. We hebben rate limiting en caching ingebouwd."

**V: Wat gebeurt er met de data die naar de AI gaat?**
A: "Dat is de verantwoordelijkheid van de gebruiker en hun AI-provider. Wij slaan niets op. We adviseren gebruikers om hun AI-provider's privacy policy te checken."

---

## Na de Demo

### Actiepunten bespreken:
1. Data & Security Review formulier invullen
2. Partnerfee en facturatie bespreken
3. Timeline voor goedkeuring
4. Marketing samenwerking (case studies, etc.)

### Follow-up:
- Demo account achterlaten voor intern testen
- Contact gegevens uitwisselen
- Volgende meeting plannen

---

## Backup Scenarios

### Als de API traag is:
"De API kan soms even duren bij grote datasets. In productie hebben we caching voor veelvoorkomende queries."

### Als er een error is:
"Ik laat even zien hoe we met errors omgaan..." *Toon error handling*

### Als een vraag niet werkt:
"Niet elke vraag werkt perfect - de AI leert nog. Laat me een andere vraag proberen..."

---

*Versie 1.0 | Januari 2026*
