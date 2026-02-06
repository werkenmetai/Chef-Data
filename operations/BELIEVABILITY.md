# Believability Matrix - [PROJECT_NAAM]

> **Believability = Track Record + Onderbouwingsvermogen**

Dit document houdt bij wie de meest believable experts zijn per domein.
Raadpleeg de juiste mensen bij beslissingen.

---

## Hoe Believability Werkt

### Wat Maakt Iemand Believable?

| Factor | Betekenis | Voorbeeld |
|--------|-----------|-----------|
| **Track Record** | Bewezen succes in dit domein | "Joost heeft 50+ Exact API issues opgelost" |
| **Onderbouwing** | Kan uitleggen waarom iets zo is | "Hij legt uit hoe de rate limiter werkt" |
| **Zelfkennis** | Kent eigen beperkingen | "Ik weet het antwoord niet, vraag Daan" |
| **Leervermogen** | Past inzichten aan op nieuwe info | "Na die bug begrijp ik OAuth beter" |

### Believability Is Domeinspecifiek

Iemand kan expert zijn in finance maar beginner in marketing.
Believability geldt per onderwerp, niet per persoon.

---

## Believability per Domein

### Tech Domeinen

#### MCP Protocol
| Persoon | Believability | Basis |
|---------|---------------|-------|
| **Ruben** | ★★★★★ Expert | MCP Specialist, officiële docs bestudeerd, meerdere tools gebouwd |
| Daan | ★★★☆☆ Gevorderd | Backend implementatie, OAuth integratie |
| Lars | ★★☆☆☆ Basis | Gebruikt MCP tools, geen protocolkennis |

**Raadpleeg Ruben bij:** Tool definities, protocol vragen, transport issues, SDK versies

#### Exact Online API
| Persoon | Believability | Basis |
|---------|---------------|-------|
| **Joost** | ★★★★★ Expert | Exact Specialist, API quirks gedocumenteerd, rate limit fixes |
| Daan | ★★★☆☆ Gevorderd | Token handling, OAuth flow |
| Lars | ★★☆☆☆ Basis | API calls maken, geen diepgaande kennis |

**Raadpleeg Joost bij:** API endpoints, rate limiting, OData queries, division issues

#### Backend/Infrastructuur
| Persoon | Believability | Basis |
|---------|---------------|-------|
| **Daan** | ★★★★★ Expert | Backend Specialist, database schema, Cloudflare expertise |
| Dirk | ★★★★☆ Gevorderd | DevOps, deployment, infrastructure |
| Lars | ★★★☆☆ Gevorderd | Backend development, minder infra |

**Raadpleeg Daan bij:** D1 database, Workers, KV storage, OAuth implementatie, Astro

#### Security
| Persoon | Believability | Basis |
|---------|---------------|-------|
| **Bas** | ★★★★★ Expert | Security Lead, audits uitgevoerd, OWASP kennis |
| Daan | ★★★☆☆ Gevorderd | Implementatie van security patterns |
| Eva | ★★★☆☆ Gevorderd | Compliance/privacy kant van security |

**Raadpleeg Bas bij:** Security audits, vulnerability assessment, auth patterns

---

### Business Domeinen

#### Marketing & Content
| Persoon | Believability | Basis |
|---------|---------------|-------|
| **Tom** | ★★★★★ Expert | Growth Lead, marketing specialist |
| Lisa | ★★★★☆ Gevorderd | CMO, strategie en brand |
| Anna | ★★★★☆ Gevorderd | Content creation, copywriting |
| Bram | ★★★★☆ Gevorderd | SEO specifiek |

**Raadpleeg Tom bij:** Growth strategie, content planning, campagnes

#### Customer Support
| Persoon | Believability | Basis |
|---------|---------------|-------|
| **Petra** | ★★★★★ Expert | CS Manager, support specialist |
| Emma | ★★★★☆ Gevorderd | Dagelijkse support, ticket patterns |
| Sophie | ★★★☆☆ Basis | CCO, strategisch niveau |

**Raadpleeg Petra bij:** Ticket escalatie, onboarding issues, customer patterns

#### Finance & Billing
| Persoon | Believability | Basis |
|---------|---------------|-------|
| **Jan** | ★★★★★ Expert | Finance Ops, billing specialist |
| Frans | ★★★★☆ Gevorderd | CFO, financiële strategie |
| Tim | ★★★★☆ Gevorderd | Data analyse, metrics |

**Raadpleeg Jan bij:** Stripe config, subscription issues, revenue metrics

#### Legal & Compliance
| Persoon | Believability | Basis |
|---------|---------------|-------|
| **Eva** | ★★★★★ Expert | CLO, legal specialist |
| Bas | ★★★☆☆ Gevorderd | Security compliance |
| Daan | ★★☆☆☆ Basis | Data handling implementatie |

**Raadpleeg Eva bij:** GDPR, privacy, terms of service, contracten

---

## Cross-Domain Expertise

Sommige vragen vereisen meerdere experts:

| Vraagtype | Raadpleeg | Waarom |
|-----------|-----------|--------|
| OAuth flow end-to-end | Daan + Joost | Backend + Exact API |
| Data privacy in product | Eva + Daan | Legal + Implementatie |
| Billing klachten | Jan + Petra | Finance + Support |
| Tech content voor marketing | Tom + (Ruben/Joost/Daan) | Marketing + Tech expertise |
| API errors in support | Petra → Joost/Daan | Support escalatie naar tech |
| Performance problemen | Daan + Dirk | Backend + DevOps |

---

## Believability-Weighted Besluitvorming

### Stap-voor-Stap

```
1. IDENTIFICEER
   Wat is het domein van deze beslissing?

2. RAADPLEEG
   Wie zijn de meest believable mensen?
   (Zie matrix hierboven)

3. VERZAMEL
   Vraag hun input + onderbouwing
   "Wat denk je en waarom?"

4. WEEG
   Expert mening telt zwaarder
   Maar: luister ook naar afwijkende stemmen

5. BESLIS
   Neem beslissing op basis van gewogen input

6. DOCUMENTEER
   Leg vast: beslissing + onderbouwing + wie wat adviseerde

7. EVALUEER
   Later: was dit een goede beslissing?
   Update believability scores indien nodig
```

### Voorbeeld

**Vraag:** "Moeten we de rate limit handling aanpassen?"

```
Domein: Exact API
Meest believable: Joost (★★★★★)
Ook relevant: Daan (★★★☆☆ voor backend impact)

Joost's advies: "Ja, Exact heeft rate limit verlaagd van 300 naar 60/min"
Onderbouwing: "Staat in hun changelog, we zien 429 errors"
Daan's advies: "Eens, we moeten ook caching toevoegen"
Onderbouwing: "Vermindert API calls met 40%"

Beslissing: Implementeer beide suggesties
Gewicht: Joost's advies was leidend voor de API kant
```

---

## Track Record Bijhouden

### Per Kwartaal Evalueren

Bij belangrijke beslissingen:
1. Wie gaf welk advies?
2. Wat was de uitkomst?
3. Wiens advies bleek correct?

### Believability Updates

| Wanneer Verhogen | Wanneer Verlagen |
|------------------|------------------|
| Advies leidde tot succes | Advies leidde tot problemen |
| Nieuwe expertise opgebouwd | Kennis verouderd |
| Track record uitgebreid | Herhaalde fouten in domein |
| Onderbouwing was solide | Conclusies zonder logica |

---

## Belangrijk: Grenzen van Believability

### Luister OOK naar Niet-Experts

- Beginners zien soms wat experts missen
- Verschillende perspectieven zijn waardevol
- Believability gaat over gewicht, niet over uitsluiting

### Believability ≠ Altijd Gelijk

- Experts kunnen fout zijn
- Track records zijn historisch, niet toekomstig
- Bij onzekerheid: verzamel meer data

### Vermijd Deze Valkuilen

| Valkuil | Probleem | Oplossing |
|---------|----------|-----------|
| Alleen experts horen | Mist frisse perspectieven | Iedereen mag input geven |
| Senioriteit = Believability | Titel zegt niets over expertise | Beoordeel op track record |
| Believability als wapen | "Jij bent niet believable" | Focus op onderbouwing, niet persoon |
| Nooit updaten | Verouderde assessments | Evalueer per kwartaal |

---

## Nieuwe Medewerker?

### Believability Opbouwen

```
Week 1-4:   ★☆☆☆☆ Beginner - Luister, leer, vraag
Maand 2-3:  ★★☆☆☆ Basis - Eerste bijdragen, bouw track record
Maand 4-6:  ★★★☆☆ Gevorderd - Zelfstandig bijdragen, eigen expertise
Maand 6+:   ★★★★☆ Expert - Track record bewezen, raadpleegbaar
```

### Versneld Opbouwen

- Documenteer wat je leert
- Deel inzichten proactief
- Onderbouw je standpunten
- Geef toe wanneer je iets niet weet
- Leer van fouten en documenteer

---

*Dit document wordt per kwartaal gereviewed en bijgewerkt.*

**Laatst bijgewerkt:** 2026-01-28
**Eigenaar:** Matthijs (CSO) + Piet (CEO)
