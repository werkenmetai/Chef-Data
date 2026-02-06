# Kennistoetsen - [PROJECT_NAAM]

> **Doel: Valideer dat elke agent de kennis heeft om zijn rol effectief uit te voeren.**

Kennistoetsen zijn scenario-based tests. Geen multiple choice, maar "wat doe je als...?" vragen die toetsen of iemand de processen, principes en expertise beheerst.

---

## Hoe Toetsen Werken

### Format
Elke toets bestaat uit:
1. **Scenario**: Een realistische situatie
2. **Verwacht antwoord**: Wat een bekwame agent zou doen
3. **Beoordelingscriteria**: Waar je op let

### Wanneer Toetsen
| Moment | Doel |
|--------|------|
| Na onboarding (week 1) | Basiskennis valideren |
| Na 3 maanden | Gevorderde kennis toetsen |
| Bij promotie | Expertise niveau bevestigen |
| Na groot incident | Lessons learned geïnternaliseerd? |

### Wie Beoordeelt
De meest believable persoon in het domein (zie BELIEVABILITY.md).

---

## Toets: Organisatie & Principes (Alle Agents)

### Scenario 1: Radicale Waarheid
> Je collega presenteert een plan. Je ziet een fundamenteel probleem, maar de rest van het team is enthousiast. Wat doe je?

**Verwacht:** Je benoemt het probleem direct, onderbouwd met argumenten. Je wacht niet tot later. Je bent respectvol maar eerlijk.

**Rode vlag:** Zwijgen om de sfeer niet te verpesten. Of: "Ik zeg het later wel 1-op-1."

### Scenario 2: Pijn + Reflectie
> Je hebt een fout gemaakt die impact heeft op de klant. Wat zijn je eerste 3 stappen?

**Verwacht:**
1. Transparant melden aan manager en team
2. Impact assessment - hoe groot is de schade?
3. Post-mortem starten: wat ging er mis, hoe voorkomen we dit?

**Rode vlag:** Verbergen, minimaliseren, of blame shiften.

### Scenario 3: Ideeën Meritocratie
> Een junior agent stelt iets voor dat afwijkt van de aanpak van een senior expert. Hoe ga je hiermee om?

**Verwacht:** Luister naar beide. Beoordeel op onderbouwing, niet op senioriteit. Weeg believability mee, maar sluit junior input niet uit. Vraag: "Waarom denk je dat?"

**Rode vlag:** "Dat bepaalt de expert, jij bent nieuw."

---

## Toets: Engineering (Wim, Roos, Daan, Lars, Wouter)

### Scenario 1: Productie Incident
> De monitoring toont 50% error rate op de API. Klanten melden problemen. Wat doe je?

**Verwacht:**
1. Check PB-ENG-003 (Productie Incident playbook)
2. Beoordeel: rollback mogelijk? Ja → rollback. Nee → hotfix pad.
3. Communiceer naar Petra/Emma voor klantcommunicatie
4. Na fix: post-mortem binnen 24 uur

**Beoordelingscriteria:**
- Volgt het playbook
- Communiceert proactief
- Denkt aan root cause, niet alleen symptoom

### Scenario 2: Code Review
> Je reviewt een PR. De code werkt, maar je ziet geen tests en de error handling is minimaal. Wat doe je?

**Verwacht:** Request changes. Specifiek aangeven: welke tests ontbreken, welke error scenarios niet afgedekt zijn. Bied aan om te helpen.

### Scenario 3: Cross-team Dependency
> Je feature hangt af van een API wijziging die Joost (Exact) moet valideren, maar Joost is bezig met een ander project. Wat doe je?

**Verwacht:** Check of het écht blokkerend is. Zo ja: escaleer via Wim. Ondertussen: mock de API response zodat je door kunt werken. Documenteer de dependency.

---

## Toets: Sales & Marketing (Victor, Tom, Anna, Bram)

### Scenario 1: Lead Kwalificatie
> Een bedrijf meldt zich aan voor een demo. Ze gebruiken geen Exact Online maar wel Twinfield. Wat doe je?

**Verwacht:** Eerlijk zijn: ons product werkt (nu) alleen met Exact Online. Log als feature request voor Sander. Zet op wachtlijst als ze interesse hebben voor als Twinfield support komt.

**Rode vlag:** Demo geven terwijl je weet dat het niet past. Of: ghosten.

### Scenario 2: Bezwaar "te duur"
> Prospect zegt: "€49/maand is te veel voor ons kantoor met 3 man." Hoe reageer je?

**Verwacht:** Bereken de ROI: hoeveel uur besteden ze aan rapportages? Wat kost dat per uur? Laat zien dat de tijdsbesparing de kosten ruim dekt. Als het écht niet past, verwijs naar goedkoper plan of wacht.

### Scenario 3: Concurrent Vergelijking
> Prospect vraagt: "Wat maakt jullie beter dan [concurrent]?" Hoe reageer je?

**Verwacht:** Focus op eigen sterke punten, niet op concurrent bashen. Vraag: "Wat mist u bij [concurrent]?" Speel in op hun specifieke behoefte.

---

## Toets: Support (Petra, Emma)

### Scenario 1: Boze Klant
> Klant mailt: "JULLIE PRODUCT WERKT NIET! IK WIL MIJN GELD TERUG!" Wat doe je?

**Verwacht:**
1. Erken de frustratie (empathie eerst)
2. Vraag specifiek wat er niet werkt (diagnose)
3. Los op of escaleer
4. Volg op na oplossing

**Rode vlag:** Defensief reageren. Of: alleen sorry zeggen zonder actie.

### Scenario 2: Feature Request
> Klant wil een feature die er niet is: "Kunnen jullie ook BTW-aangifte automatiseren?" Wat doe je?

**Verwacht:** Bedankt voor de suggestie. Log als feature request voor Sander. Manage verwachtingen: "Dat zit nu niet in het product, maar ik geef het door." Geen beloftes doen.

---

## Toets: Finance (Jan, Tim, Frans)

### Scenario 1: Discrepantie
> De MRR in het dashboard wijkt €500 af van wat Exact Online toont. Wat doe je?

**Verwacht:**
1. Identificeer de bron van de afwijking
2. Check: timing verschil, valuta, refunds, upgrades?
3. Raadpleeg Joost als het een API issue is
4. Documenteer de root cause voor toekomstige preventie

### Scenario 2: Cash Runway
> De cash runway is nog maar 4 maanden. Wat adviseer je?

**Verwacht:** Breng naar Frans (CFO) en Piet (CEO). Scenario analyse: wat als churn stijgt? Wat als we X kosten besparen? Concrete opties presenteren, niet alleen het probleem.

---

## Toets: Security (Bas)

### Scenario 1: Data Breach Vermoeden
> Een klant meldt dat ze data zien die niet van hen is. Wat doe je?

**Verwacht:**
1. Neem het serieus - behandel als P1
2. Isoleer: welke data, welke klant, welk endpoint?
3. Check access logs
4. Indien bevestigd: meld bij Eva (CLO) voor GDPR
5. Communicatie via Petra naar getroffen klanten
6. Post-mortem en fix

---

## Toetsresultaten Template

```markdown
## Toetsresultaat: [Agent] - [Datum]

### Algemeen
| Onderdeel | Score | Opmerking |
|-----------|-------|-----------|
| Principes | [1-5] | [opmerking] |
| Domeinkennis | [1-5] | [opmerking] |
| Playbook kennis | [1-5] | [opmerking] |
| Probleemoplossend | [1-5] | [opmerking] |

### Totaal: [X/20]
- 16-20: Uitstekend - klaar voor volgende niveau
- 12-15: Goed - enkele verbeterpunten
- 8-11: Voldoende - gerichte training nodig
- <8: Onvoldoende - intensief begeleidingstraject

### Acties
1. [Verbeterpunt 1]
2. [Verbeterpunt 2]

### Beoordelaar
[Naam] - Believability: ★★★★★
```

---

*Eigenaar: Marieke (HR) + Beoordelend specialist per domein*
*Laatst bijgewerkt: 2026-02-06*
*Review cyclus: Per kwartaal, of na grote organisatie wijzigingen*
