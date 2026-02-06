# Bedrijfsprincipes - Praat met je Boekhouding

> **"Pijn + Reflectie = Vooruitgang"** - Ray Dalio

Gebaseerd op Ray Dalio's Principles, vertaald naar onze dagelijkse praktijk.

---

## Kernformule

```
Radicale Waarheid + Radicale Transparantie = Ideeënmeritocratie
```

In een ideeënmeritocratie winnen de beste ideeën, ongeacht van wie ze komen.

---

## DEEL 1: FUNDAMENTELE PRINCIPES

### Principe 1: Omarm de Realiteit

**Wees radicaal realistisch.** Zie de wereld zoals die is, niet zoals je hoopt dat die is.

| Situatie | Foute Reactie | Goede Reactie |
|----------|---------------|---------------|
| Klant klaagt | Direct verdedigen | Onderzoek of klacht gegrond is |
| Project loopt achter | Optimistisch blijven rapporteren | Erken achterstand, analyseer oorzaak |
| Concurrent presteert beter | Wegrationaliseren | Analyseer waarom, leer ervan |

**Praktijken:**
- Maandelijkse realiteitscheck: vergelijk aannames met data
- Bij elk project: "Wat kan er misgaan?" vóór "Hoe gaan we dit doen?"
- Dashboards tonen échte prestaties, niet alleen positieve metrics

**Valkuilen:**
- Wishful thinking: geloven omdat je wilt dat het waar is
- Alleen metrics bekijken die je goed doen lijken
- Kritiek negeren in plaats van onderzoeken

---

### Principe 2: Radicale Waarheid en Transparantie

**Alle informatie is toegankelijk. Iedereen is eerlijk.**

Dit elimineert politiek, versnelt besluitvorming, en zorgt dat problemen eerder boven water komen.

**Radicale Transparantie:**
- Beslissingen worden gedocumenteerd met onderbouwing
- Vergaderverslagen zijn toegankelijk
- Financiële cijfers zijn inzichtelijk voor het team

**Radicale Waarheid:**
- Zeg wat je denkt, ook als het ongemakkelijk is
- Als een collega slecht presteert, vertel dat direct en respectvol
- Als je het oneens bent met je leidinggevende, spreek dat uit

**Hoe we dit doen:**
```
docs/knowledge/                    # Alle kennis toegankelijk
├── KENNIS-TOEGANG.md              # Startpunt voor iedereen
├── mcp/LESSONS-LEARNED.md         # MCP fouten & fixes
├── exact/LESSONS-LEARNED.md       # API fouten & fixes
├── backend/LESSONS-LEARNED.md     # Infra fouten & fixes
├── marketing/LESSONS-LEARNED.md   # Marketing lessen
├── support/LESSONS-LEARNED.md     # Support patronen
├── finance/LESSONS-LEARNED.md     # Finance issues
└── legal/LESSONS-LEARNED.md       # Compliance lessen
```

---

### Principe 3: Pijn + Reflectie = Vooruitgang

**Elke mislukking bevat lessen. Vlieg er niet van weg, analyseer.**

```
PIJN (fout/conflict/tegenslag)
         ↓
    REFLECTIE
    - Wat gebeurde er?
    - Welke aannames waren verkeerd?
    - Wat doen we anders?
         ↓
    DOCUMENTEREN
    - Voeg toe aan LESSONS-LEARNED.md
         ↓
    VOORUITGANG
    - Organisatie wordt slimmer
```

**Post-Mortem Protocol:**
Na elk significant project of incident:
1. Wat ging er mis?
2. Wat was de root cause?
3. Welke signalen hebben we gemist?
4. Wat veranderen we om herhaling te voorkomen?

**Belangrijk:** Het doel is niet schuldigen aanwijzen, maar de organisatie slimmer maken.

Zie: `operations/templates/POST-MORTEM.md`

---

### Principe 4: Mensen Zijn Fundamenteel Verschillend

**Pas je aanpak aan op de persoon, niet andersom.**

Mensen verschillen in:
- Hoe ze informatie verwerken
- Wat hen motiveert
- Hoe ze communiceren
- Waarin ze uitblinken

**Onze Specialisten:**

| Specialist | Sterkte | Raadpleeg bij |
|------------|---------|---------------|
| Ruben | MCP Protocol, technische precisie | Tool bouwen, protocol vragen |
| Joost | Exact API, integraties | API calls, rate limits |
| Daan | Backend, infrastructuur | Database, Cloudflare, OAuth |
| Tom | Growth, content strategie | Marketing, SEO, conversie |
| Petra | Klantrelaties, support patterns | Ticket escalatie, onboarding |
| Jan | Finance, metrics | Billing, subscriptions |
| Eva | Compliance, juridisch | GDPR, privacy, contracten |

**Blinde Vlekken:**
Iedereen heeft ze. Compenseer door mensen om je heen te verzamelen die sterk zijn waar jij zwak bent.

---

### Principe 5: Effectief Beslissen

**Besluitvorming is een vaardigheid. Train die systematisch.**

#### Believability-Weighted Decision Making

Niet alle meningen zijn gelijk. Geef meer gewicht aan mensen die:
1. Bewezen track record hebben op het relevante gebied
2. Helder kunnen uitleggen waarom iets zo is

```
BESLISSING NODIG
      ↓
Wie zijn de meest believable mensen hiervoor?
      ↓
Verzamel hun input + onderbouwing
      ↓
Weeg meningen op basis van expertise
      ↓
Neem beslissing + documenteer onderbouwing
      ↓
Evalueer later: was dit een goede beslissing?
```

Zie: `operations/BELIEVABILITY.md`

#### Thoughtful Disagreement

Het doel is de waarheid vinden, niet gelijk krijgen.

**Protocol:**
1. Onderbouw je standpunt met feiten en logica
2. Luister actief naar tegenargumenten
3. Wees bereid van gedachten te veranderen
4. Zoek de kern van het meningsverschil
5. Als geen consensus: believability-weighted voting

---

## DEEL 2: WERKPRINCIPES VOOR CULTUUR

### Principe 6: Ideeënmeritocratie

**De beste ideeën winnen, ongeacht van wie ze komen.**

Drie elementen:
1. **Radicale waarheid** - Iedereen zegt wat ze denken
2. **Radicale transparantie** - Iedereen heeft toegang tot dezelfde info
3. **Believability-weighted voting** - Expertise telt, maar iedereen heeft stem

**Dit is NIET:**
- Democratie (iedereen stemt gelijk)
- Autocratie (de baas beslist)

**Dit IS:**
- Een systeem dat rekening houdt met kwaliteit én kwantiteit van meningen

**Als leidinggevende:**
Je moet niet alleen tolereren dat mensen je tegenspreken, je moet het aanmoedigen.

---

### Principe 7: Betekenisvol Werk en Relaties

**Mensen presteren beter als ze weten waarom hun werk ertoe doet.**

**Betekenisvol werk:**
- Communiceer hoe individueel werk bijdraagt aan het geheel
- De receptionist die weet dat haar begroeting de merkervaring bepaalt

**Betekenisvolle relaties:**
- Investeer tijd om elkaar te leren kennen als mensen
- Echte relaties zijn gebouwd op waarheid, niet op politieke hoffelijkheid
- Wees bereid moeilijke gesprekken te voeren uit zorg voor de persoon

---

### Principe 8: Fouten Oké, Niet Leren Niet

**Fouten zijn gratis lessen over hoe de realiteit werkt.**

```
┌─────────────────────────────────────────┐
│  Fouten maken = OKÉ                     │
│  Niet van fouten leren = NIET OKÉ       │
│  Dezelfde fout herhalen = PROBLEEM      │
└─────────────────────────────────────────┘
```

**Bij elke fout:**
1. Post-mortem uitvoeren (standaard, niet uitzonderlijk)
2. Inzichten documenteren in LESSONS-LEARNED.md
3. Systeemverandering doorvoeren om herhaling te voorkomen
4. Delen met team zodat iedereen leert

**Vraag nooit:** "Wie is er schuldig?"
**Vraag altijd:** "Wat kunnen we hiervan leren?"

---

### Principe 9: Synchroniseer Constant

**Miscommunicatie veroorzaakt de meeste problemen.**

Mensen denken dat ze op dezelfde pagina zitten terwijl ze dat niet zijn.

**Check na elke meeting:**
- Wie doet wat tegen wanneer?
- Hebben we hetzelfde beeld van het doel?
- Zijn er nog onuitgesproken meningsverschillen?

**Documenteer:**
- Beslissingen met hun onderbouwing
- Aannames die je hebt gemaakt
- Verwachtingen die je hebt

**Frequente korte check-ins > Lange zeldzame meetings**

---

## DEEL 3: BESLUITVORMINGSPRINCIPES

### Principe 10: Weeg Geloofwaardigheid

**Track records bepalen believability.**

| Factor | Verhoogt Believability | Verlaagt Believability |
|--------|------------------------|------------------------|
| Ervaring | Bewezen succes in domein | Geen track record |
| Onderbouwing | Kan uitleggen waarom | Alleen conclusies, geen logica |
| Zelfkennis | Kent eigen beperkingen | Overschat eigen expertise |
| Track record | Eerdere voorspellingen klopten | Vaak fout geweest |

**Hoe we dit bijhouden:**
- Per specialist: waar zijn ze believable?
- Bij beslissingen: wie gaf welk advies?
- Achteraf: wiens advies bleek correct?

Zie: `operations/BELIEVABILITY.md`

---

### Principe 11: Ken Je Blinde Vlekken

**Je kunt je eigen blinde vlekken per definitie niet zien.**

Blinde vlekken ontstaan door:
- **Cognitieve biases** - We overschatten onze eigen capaciteiten
- **Beperkte ervaring** - We hebben niet alle perspectieven meegemaakt
- **Emotionele blokken** - Bepaalde waarheden zijn te pijnlijk om onder ogen te zien

**Dit vereist:**

| Eigenschap | Betekenis |
|------------|-----------|
| **Nederigheid** | Accepteer dat je niet altijd gelijk hebt |
| **Moed** | Nodig kritiek uit, ook als het ongemakkelijk is |
| **Diversiteit** | Koester verschillende denkstijlen in je team |

**Oplossing:**
1. Verzamel mensen om je heen die anders denken
2. Moedig hen aan je te challengen
3. Als je altijd optimistisch bent, zoek een kritische stem
4. Als je detailgericht bent, zoek iemand met helikopterview
5. Analyseer je beslissingsgeschiedenis: waar ging je consistent mis?

**In de organisatie:**
- Teams van allemaal gelijkgestemde mensen compenseren elkaars blinde vlekken niet
- De beste teams combineren verschillende denkstijlen, achtergronden, en perspectieven
- Creëer een cultuur waarin het challengen van de baas wordt gewaardeerd

**Per C-Suite lid:**

| Rol | Mogelijke Blinde Vlek | Compensatie |
|-----|----------------------|-------------|
| Matthijs (CSO) | Te strategisch, mist operationele details | Piet (CEO) |
| Piet (CEO) | Te operationeel, mist strategische kansen | Matthijs (CSO) |
| Kees (CTO) | Te technisch, mist business perspectief | Lisa (CMO), Frans (CFO) |
| Lisa (CMO) | Te brand-gericht, mist technische constraints | Kees (CTO) |
| Frans (CFO) | Te risicomijdend, mist groeikansen | Lisa (CMO) |
| Sophie (CCO) | Te klantgericht, mist schaalbaarheidsissues | Kees (CTO) |

**Concrete praktijken:**
- Identificeer je eigen blinde vlekken door feedback te vragen aan mensen die je goed kennen
- Verzamel een 'tegenpoolteam': mensen die systematisch anders denken dan jij
- Bij belangrijke beslissingen: zoek actief naar mensen die het tegenovergestelde denken
- Analyseer je beslissingsgeschiedenis: waar ging je consistent mis?

**Valkuilen:**
- Denken dat je geen blinde vlekken hebt
- Alleen omringen met mensen die het met je eens zijn
- Afwijkende meningen interpreteren als onwil of onbegrip

---

### Principe 12: Systematiseer Je Besluitvorming

**Maak terugkerende beslissingen consistent en efficiënt.**

De meeste beslissingen zijn niet uniek. We nemen vergelijkbare beslissingen keer op keer:
- Wie nemen we aan?
- Welke projecten prioriteren we?
- Hoe reageren we op klachten?

**Systematiseren betekent:**

| Aspect | Van | Naar |
|--------|-----|------|
| Criteria | "Op gevoel" beslissen | Expliciete criteria gedefinieerd |
| Proces | Ad-hoc reacties | Gedocumenteerde protocols |
| Consistentie | Wisselend per persoon/dag | Vergelijkbare gevallen, vergelijkbare behandeling |
| Overdracht | Kennis in hoofden | Overdraagbare systemen |

**Voordelen:**
1. **Consistentie** - Vergelijkbare gevallen behandel je op dezelfde manier
2. **Snelheid** - Niet elke keer opnieuw nadenken over het proces
3. **Overdraagbaar** - Anderen kunnen dezelfde principes toepassen
4. **Verbeterbaar** - Je kunt analyseren welke criteria goede uitkomsten voorspellen

**Onze beslissingsprotocollen:**

| Beslissing | Protocol |
|------------|----------|
| Hiring | `operations/protocols/HIRING.md` (TODO) |
| Projectselectie | Check STRATEGY.md piketpaaltjes |
| Klachtafhandeling | `docs/knowledge/support/LESSONS-LEARNED.md` |
| Technische keuzes | Raadpleeg believable specialist |
| Feature prioritering | ROADMAP.md + MoSCoW |

**Verfijnen over tijd:**
```
1. Documenteer beslissingsproces
2. Neem beslissingen volgens proces
3. Evalueer uitkomsten
4. Analyseer: welke criteria waren voorspellend?
5. Verfijn proces op basis van data
6. Herhaal
```

**Concrete praktijken:**
- Documenteer je beslissingsprocessen voor terugkerende beslissingen
- Definieer expliciete criteria voor belangrijke beslissingen
- Creëer checklists voor complexe processen
- Evalueer periodiek: leiden onze systemen tot goede uitkomsten?
- Verfijn systemen op basis van data over wat werkt en wat niet

**Valkuilen:**
- Systemen zo rigide maken dat er geen ruimte is voor nuance
- Systemen creëren en dan nooit meer evalueren of verbeteren
- Alles willen systematiseren, ook eenmalige of unieke situaties

---

## IMPLEMENTATIEGIDS

Het implementeren van deze principes is een reis, geen bestemming. Begin klein, experimenteer, en breid uit wat werkt.

### Fase 1: Fundament Leggen (Maand 1-2)

Start met de fundamentele principes die de basis vormen voor alle andere.

| Actie | Hoe | Eigenaar |
|-------|-----|----------|
| Introduceer dit document | Deel met team, bespreek in workshop | Matthijs |
| Start met post-mortems | Verplicht na elk project, gebruik vast format | Piet |
| Begin issue log | Centrale plek voor fouten en lessen | Specialisten |
| Voer persoonlijkheidstesten uit | Bespreek sterke/zwakke punten | Piet |

**Deliverables Fase 1:**
- [ ] Iedereen heeft PRINCIPLES.md gelezen
- [ ] Post-mortem template in gebruik
- [ ] Eerste lessons in LESSONS-LEARNED.md
- [ ] Persoonlijkheidsprofielen bekend

---

### Fase 2: Cultuur Bouwen (Maand 3-6)

Breid uit naar de cultuurprincipes die de samenwerking verbeteren.

| Actie | Hoe | Eigenaar |
|-------|-----|----------|
| Train feedback geven | Workshop constructieve feedback, oefen in teams | Petra |
| Introduceer decision logs | Documenteer belangrijke beslissingen met onderbouwing | Piet |
| Start believability tracking | Noteer wie welke voorspellingen doet, check achteraf | Matthijs |
| Verbeter synchronisatie | Check-ins aan eind van meetings, gedeelde documentatie | Alle managers |

**Deliverables Fase 2:**
- [ ] Team getraind in feedback geven/ontvangen
- [ ] Belangrijke beslissingen worden gedocumenteerd
- [ ] BELIEVABILITY.md wordt actief bijgehouden
- [ ] Meetings eindigen met "Wie doet wat wanneer?"

---

### Fase 3: Systematiseren (Maand 7-12)

Maak de principes onderdeel van je systemen en processen.

| Actie | Hoe | Eigenaar |
|-------|-----|----------|
| Formaliseer beslissingsprocessen | Documenteer criteria voor terugkerende beslissingen | Piet + Specialisten |
| Creëer 'baseball cards' | Profielen met sterktes, zwaktes, believability per domein | Matthijs |
| Bouw dashboards | Realtime inzicht in key metrics en issue tracking | Tim (Data) |
| Evalueer en verfijn | Kwartaalevaluatie: wat werkt, wat niet, wat aanpassen? | Matthijs + Piet |

**Deliverables Fase 3:**
- [ ] Alle terugkerende beslissingen hebben gedocumenteerd proces
- [ ] BELIEVABILITY.md bevat track records
- [ ] Dashboards tonen realiteit, niet alleen positieve metrics
- [ ] Eerste kwartaal-evaluatie uitgevoerd

---

## DAGELIJKSE PRAKTIJK

### Dagelijks

- [ ] Spreek uit wat je denkt (radicale waarheid)
- [ ] Deel informatie proactief (transparantie)
- [ ] Bij fouten: documenteer in LESSONS-LEARNED.md
- [ ] Bij meningsverschil: zoek de kern, niet de winst

### Wekelijks

- [ ] Check: leren we van onze fouten?
- [ ] Synchronisatie: is iedereen aligned?
- [ ] Believability check: luisteren we naar de juiste mensen?

### Maandelijks

- [ ] Realiteitscheck: kloppen onze aannames met de data?
- [ ] Post-mortems review: welke patronen zien we?
- [ ] Blinde vlekken: missen we iets systematisch?

### Per Kwartaal

- [ ] Principes review: leven we ze na?
- [ ] Believability update: wie is waarvoor expert geworden?
- [ ] Cultuur check: voelen mensen zich vrij om eerlijk te zijn?
- [ ] Systemen evaluatie: leiden onze processen tot goede uitkomsten?

---

## QUICK REFERENCE

### Dagelijks

- [ ] Spreek uit wat je denkt (radicale waarheid)
- [ ] Deel informatie proactief (transparantie)
- [ ] Bij fouten: documenteer in LESSONS-LEARNED.md
- [ ] Bij meningsverschil: zoek de kern, niet de winst

### Wekelijks

- [ ] Check: leren we van onze fouten?
- [ ] Synchronisatie: is iedereen aligned?
- [ ] Believability check: luisteren we naar de juiste mensen?

### Maandelijks

- [ ] Realiteitscheck: kloppen onze aannames met de data?
- [ ] Post-mortems review: welke patronen zien we?
- [ ] Blinde vlekken: missen we iets systematisch?

### Per Kwartaal

- [ ] Principes review: leven we ze na?
- [ ] Believability update: wie is waarvoor expert geworden?
- [ ] Cultuur check: voelen mensen zich vrij om eerlijk te zijn?

---

## QUICK REFERENCE

### Als je een fout maakt:
```
1. Erken de fout (niet verdedigen)
2. Analyseer de root cause
3. Documenteer in LESSONS-LEARNED.md
4. Implementeer systeemfix
5. Deel met team
```

### Als je het oneens bent:
```
1. Onderbouw je standpunt met feiten
2. Luister naar het tegenargument
3. Zoek de kern van het verschil
4. Wees bereid van gedachten te veranderen
5. Als geen consensus: raadpleeg believable expert
```

### Als je een beslissing moet nemen:
```
1. Wie zijn de meest believable mensen?
2. Wat zeggen zij en waarom?
3. Zijn er afwijkende meningen?
4. Documenteer de beslissing + onderbouwing
5. Evalueer later het resultaat
```

---

## TOT SLOT

Het implementeren van deze principes vraagt om een fundamentele mindset shift. Het is niet genoeg om ze te kennen; je moet ze **leven**. Dat betekent dagelijks bewust bezig zijn met:

- Radicale eerlijkheid
- Leren van fouten
- Actief zoeken naar andere perspectieven

**De beloning is een organisatie die:**
- Effectiever is
- Een plek is waar mensen willen werken
- Waar eerlijkheid de norm is
- Waar fouten leermomenten zijn
- Waar de beste ideeën winnen
- Waar mensen groeien

### Begin Vandaag

```
1. Kies één principe
2. Pas het toe
3. Reflecteer op wat er gebeurt
4. Leer
5. Pas aan
6. Bouw zo, stap voor stap, een organisatie gebaseerd op principes
```

---

*"De mensen die het meest succesvol zijn, zijn degenen die het meest effectief met de realiteit omgaan."*
— Ray Dalio

*"Hij die leert maar niet denkt, is verloren. Hij die denkt maar niet leert, is in gevaar."*
— Confucius

---

**Gerelateerde documenten:**
- `operations/BELIEVABILITY.md` - Geloofwaardigheid tracking
- `operations/templates/POST-MORTEM.md` - Template voor leren van fouten
- `docs/knowledge/KENNIS-TOEGANG.md` - Toegang tot alle kennis

---

**Laatst bijgewerkt:** 2026-01-28
**Eigenaar:** Matthijs (CSO)
**Versie:** 1.0
