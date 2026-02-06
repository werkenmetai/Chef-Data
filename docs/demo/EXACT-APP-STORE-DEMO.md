# Exact App Store Demo Script

> **Duur:** 5 minuten
> **Demo Mode:** Bakkerij De Gouden Croissant B.V.
> **Platforms:** ChatGPT + Claude Desktop

---

## Pre-Demo Checklist

- [ ] ChatGPT tabblad open met Custom GPT "Praat met je Boekhouding"
- [ ] Claude Desktop open met MCP connector geconfigureerd
- [ ] Demo API key: `exa_demo` (Bakkerij De Gouden Croissant)
- [ ] Scherm delen klaar
- [ ] Backup browser tab met andere demo key: `exa_demo_it` (TechVision IT)

---

## Demo Flow (5 minuten)

### 1. Opening (30 seconden)

**Talking Points:**

> "Goedemiddag! Ik ben Matthijs van Praat met je Boekhouding."
>
> "Wij maken het mogelijk om in gewone taal vragen te stellen aan je Exact Online administratie. Geen rapporten bouwen, geen exports - gewoon vragen stellen alsof je met een collega praat."
>
> "Vandaag laat ik zien hoe dit werkt in zowel ChatGPT als Claude Desktop."

**Key Points:**
- Read-only - kan nooit data wijzigen
- Werkt met ChatGPT, Claude, en andere AI tools
- Binnen 5 minuten opgezet

---

### 2. ChatGPT Demo (2 minuten)

**[Open ChatGPT met Custom GPT]**

> "Laten we beginnen in ChatGPT. Ik gebruik hier onze demo bakkerij - De Gouden Croissant in Amsterdam."

#### Demo 2.1: Openstaande Facturen (30 sec)

**Type in ChatGPT:**
```
Welke facturen staan nog open?
```

**Verwacht resultaat:** Lijst met openstaande facturen, bedragen, vervaldatums

**Toelichting:**
> "Normaal moet je hiervoor naar de debiteurenlijst of een rapport draaien. Nu stel je gewoon de vraag."

---

#### Demo 2.2: Cashflow Forecast (45 sec)

**Type in ChatGPT:**
```
Geef me een cashflow forecast voor de komende 3 maanden
```

**Verwacht resultaat:** Liquiditeitsprognose met verwachte inkomsten/uitgaven

**Toelichting:**
> "Dit is een vraag waar je normaal een heel model voor moet bouwen. De AI combineert openstaande facturen, terugkerende kosten, en historische patronen."

---

#### Demo 2.3: Zoek Klant (45 sec)

**Type in ChatGPT:**
```
Zoek klant Hotel Amstel
```

**Verwacht resultaat:** Klantgegevens met contactinfo

**Toelichting:**
> "Snel even een klant opzoeken - ideaal als je iemand aan de telefoon hebt."

---

### 3. Claude Desktop Demo (2 minuten)

**[Switch naar Claude Desktop]**

> "Nu laten we hetzelfde zien in Claude Desktop. Claude is populair bij accountants omdat het langere documenten kan verwerken."

#### Demo 3.1: Omzetrapportage (45 sec)

**Type in Claude:**
```
Geef me de omzet van dit jaar, per maand uitgesplitst
```

**Verwacht resultaat:** Omzet per maand met totalen

**Toelichting:**
> "Claude haalt dit direct uit de winst- en verliesrekening. Je kunt ook vergelijken met vorig jaar als je wilt."

---

#### Demo 3.2: BTW Overzicht (45 sec)

**Type in Claude:**
```
Wat is het BTW overzicht van Q4?
```

**Verwacht resultaat:** BTW samenvatting met te betalen/vorderen BTW

**Toelichting:**
> "Perfect voor de kwartaalafsluiting. Direct inzicht in de BTW positie."

---

#### Demo 3.3: 360 Klantview (30 sec)

**Type in Claude:**
```
Geef me een compleet overzicht van klant Café De Tijd
```

**Verwacht resultaat:** 360-graden klantoverzicht met omzet, facturen, betalingsgedrag

**Toelichting:**
> "Dit combineert alles wat we weten over een klant in een overzicht. Ideaal voor sales of credit management."

---

### 4. Closing (30 seconden)

**Talking Points:**

> "Zoals u ziet werkt dit naadloos in beide platforms. Nog kort over privacy en security:"

**Security Highlights:**
- **Read-only** - technisch onmogelijk om data te wijzigen (OAuth scopes)
- **Geen data opslag** - data stroomt direct van Exact naar AI, wij slaan niets op
- **EU hosting** - Cloudflare Workers in Europa
- **Versleuteling** - AES-256 voor tokens, alles via HTTPS

> "De gebruiker houdt altijd controle en kan de verbinding op elk moment intrekken."

**Volgende Stappen:**

> "Wat zijn de volgende stappen voor de App Store goedkeuring?"

---

## Backup Plan

### Als ChatGPT traag is:
> "ChatGPT kan soms even laden bij piekuren. Laat me even de Claude demo eerst doen..."

**[Switch naar Claude Desktop]**

### Als een vraag niet werkt:
> "De AI interpreteert soms vragen anders. Laat me het anders formuleren..."

**Alternatieve vragen:**
- "Toon de openstaande debiteuren" (i.p.v. openstaande facturen)
- "Wat is de maandomzet?" (i.p.v. omzet per maand)
- "BTW dit kwartaal" (i.p.v. BTW overzicht Q4)

### Als de API een error geeft:
> "In demo mode kan er soms een timeout zijn. In productie hebben we caching voor snellere responses."

**[Switch naar andere demo key: `exa_demo_it`]**

### Als Claude Desktop niet verbindt:
> "Laat me even de configuratie checken... In de tussentijd kan ik de ChatGPT demo uitbreiden."

---

## Technische Details (Indien Gevraagd)

### Architectuur
```
[Gebruiker] --> [ChatGPT/Claude] --> [MCP Server] --> [Exact Online API]
                                          |
                                    [Geen opslag]
```

### Demo Endpoints
| Platform | Endpoint |
|----------|----------|
| Claude Desktop | `https://api.praatmetjeboekhouding.nl/demo/exa_demo` |
| Claude Code | `https://api.praatmetjeboekhouding.nl/mcp/exa_demo` |
| ChatGPT | Custom GPT met Actions |

### Demo Bedrijven
| API Key | Bedrijf | Branche |
|---------|---------|---------|
| `exa_demo` | Bakkerij De Gouden Croissant | Bakkerij |
| `exa_demo_it` | TechVision Consultancy | IT Services |
| `exa_demo_advocaat` | Van der Berg & Partners | Juridisch |
| `exa_demo_aannemer` | Bouwbedrijf De Fundatie | Bouw |

---

## Veelgestelde Vragen

**V: Wat als de AI foute antwoorden geeft?**
> "De AI baseert zich op werkelijke Exact data. We geven altijd aan dat het een AI-interpretatie is. Gebruikers kunnen de brondata verifiëren."

**V: Kunnen jullie ook schrijven naar Exact?**
> "Nee, bewust niet. Read-only is veiliger en voorkomt fouten. Dit is een design keuze."

**V: Hoe zit het met de API limieten?**
> "We respecteren de Exact limieten (60/min, 5000/dag). Rate limiting en caching zijn ingebouwd."

**V: Wat gebeurt er met data die naar de AI gaat?**
> "Dat is de verantwoordelijkheid van de gebruiker en hun AI-provider. Wij slaan niets op. We adviseren om de privacy policy van de AI-provider te checken."

---

*Demo Script v2.0 | Februari 2026*
