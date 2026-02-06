# Juridisch Actieplan: Praat met je Boekhouding

> **Document**: Juridisch actieplan B2B SaaS
> **Versie**: 1.0
> **Datum**: Januari 2026
> **Auteur**: Juridische analyse voor Chef Data B.V.
> **Status**: CONCEPT - Juristenreview vereist voor finale versie

---

## Managementsamenvatting

Chef Data B.V. exploiteert "Praat met je Boekhouding", een B2B SaaS dienst die boekhouddata via Exact Online API ophaalt en doorgeeft aan AI-assistenten. De dienst fungeert als pass-through: geen opslag van boekhouddata, alleen real-time doorgifte.

**Kritieke juridische bevindingen:**

1. **Exact Online toestemming is blokkerend** - Sectie 3.2d App Center Terms verbiedt datadeling met derden zonder schriftelijke toestemming
2. **Chef Data is zowel verwerker ALS verwerkingsverantwoordelijke** - afhankelijk van de verwerkingsactiviteit
3. **Aansprakelijkheidsbeperking is essentieel** - AI-output kan leiden tot claims bij foute beslissingen
4. **Pass-through structuur biedt juridische voordelen** - maar vereist zorgvuldige documentatie

---

## Deel 1: Prioritering

### Documentprioriteiten

| Document | Urgentie | Risico zonder | Geschatte kosten | Review door jurist |
|----------|----------|---------------|------------------|-------------------|
| **Exact Online toestemming** | 🔴 KRITIEK | Launch blocker | €0-500 (eigen tijd) | Nee |
| **Terms of Service** | 🔴 KRITIEK | Onbeperkte aansprakelijkheid | €2.000-5.000 | Ja, sterk aanbevolen |
| **Verwerkersovereenkomst (DPA)** | 🔴 KRITIEK | AVG-boete tot €20M | €1.500-3.500 | Ja, verplicht |
| **Privacy Policy updates** | 🟡 HOOG | AP-onderzoek | €500-1.000 | Nee, al redelijk |
| **Disclaimer teksten** | 🟡 HOOG | Aansprakelijkheidsclaims | €0 (zelf te doen) | Optioneel |
| **Acceptable Use Policy** | 🟢 MEDIUM | Misbruik door klanten | €500-1.000 | Optioneel |
| **SLA document** | 🟢 MEDIUM | Verwachtingsmanagement | €500-1.000 | Nee |

### Tijdlijn aanbeveling

```
Week 1-2:  Exact Online toestemming aanvragen
           Terms of Service concept opstellen

Week 3-4:  Verwerkersovereenkomst finaliseren
           Disclaimers implementeren in app

Week 5-6:  Juristenreview van alle documenten
           Privacy Policy updates

Week 7-8:  Implementatie in productieomgeving
           Soft launch met beperkte klanten
```

---

## Deel 2: Juridische Rolbepaling

### Is Chef Data verwerker of verwerkingsverantwoordelijke?

**Conclusie: BEIDE, afhankelijk van de verwerking**

| Verwerking | Rol Chef Data | Toelichting |
|------------|---------------|-------------|
| Accountgegevens (email, naam) | **Verwerkingsverantwoordelijke** | Wij bepalen doel en middelen |
| OAuth tokens opslag | **Verwerkingsverantwoordelijke** | Technisch noodzakelijk voor onze dienst |
| Boekhouddata ophalen bij Exact | **Verwerker** | Klant geeft instructie via API call |
| Boekhouddata doorsturen naar AI | **Verwerker** | Klant initieert, wij faciliteren |
| Betalingsverwerking (Stripe) | **Verwerkingsverantwoordelijke** | Wij kiezen Stripe |
| API-gebruiksstatistieken | **Verwerkingsverantwoordelijke** | Eigen bedrijfsdoeleinden |

### De verwerkingsketen

**Directe klant (ZZP/MKB):**
```
Eindgebruiker → Chef Data (Verwerker) → AI Provider (Sub-verwerker)
     ↓
Verwerkingsverantwoordelijke
```

**Via accountantskantoor:**
```
Eindklant van accountant → Accountant → Chef Data → AI Provider
         ↓                      ↓           ↓           ↓
    Betrokkene          Verwerker    Sub-verwerker  Sub-sub-verwerker

Verwerkingsverantwoordelijke = Accountant
```

Dit heeft belangrijke implicaties:
- Bij directe klanten: klant = verwerkingsverantwoordelijke, wij = verwerker
- Bij accountants: accountant = verwerker voor hun klant, wij = sub-verwerker

---

## Deel 3: Terms of Service

### Nederlandse versie (hoofdtekst)

---

# Algemene Voorwaarden

## Praat met je Boekhouding

**Chef Data B.V.**
Versie 1.0 - [DATUM]

---

### Artikel 1 - Definities

In deze algemene voorwaarden wordt verstaan onder:

1.1 **Dienst**: de "Praat met je Boekhouding" software-as-a-service van Chef Data, bestaande uit een API/MCP-server die Exact Online boekhouddata toegankelijk maakt voor AI-assistenten.

1.2 **Chef Data** of **wij**: Chef Data B.V., gevestigd te Hilversum, KvK-nummer 96120924.

1.3 **Klant** of **u**: de rechtspersoon of natuurlijke persoon handelend in uitoefening van beroep of bedrijf die een Overeenkomst met Chef Data aangaat.

1.4 **Overeenkomst**: de overeenkomst tussen Chef Data en Klant voor het gebruik van de Dienst.

1.5 **Boekhouddata**: alle gegevens die via de Exact Online API worden opgehaald, waaronder maar niet beperkt tot facturen, relaties, transacties, grootboekrekeningen en administratieve gegevens.

1.6 **AI-assistent**: software van derden (zoals Claude, ChatGPT, Copilot) waarmee Klant interacteert en die via de Dienst Boekhouddata kan opvragen.

1.7 **Persoonsgegevens**: alle informatie over een geïdentificeerde of identificeerbare natuurlijke persoon, zoals gedefinieerd in de AVG.

### Artikel 2 - Toepasselijkheid

2.1 Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, offertes, overeenkomsten en leveringen van de Dienst.

2.2 Afwijkingen van deze voorwaarden zijn slechts geldig indien schriftelijk overeengekomen.

2.3 De toepasselijkheid van eventuele inkoop- of andere voorwaarden van Klant wordt uitdrukkelijk van de hand gewezen.

2.4 **B2B-dienstverlening**: De Dienst is uitsluitend bestemd voor zakelijk gebruik. Door de Dienst te gebruiken verklaart Klant te handelen in de uitoefening van beroep of bedrijf.

### Artikel 3 - Totstandkoming Overeenkomst

3.1 De Overeenkomst komt tot stand op het moment dat Klant:
   a. een account aanmaakt op praatmetjeboekhouding.nl;
   b. de Exact Online OAuth-koppeling autoriseert; en
   c. deze algemene voorwaarden accepteert.

3.2 Chef Data behoudt zich het recht voor registraties zonder opgaaf van redenen te weigeren.

### Artikel 4 - De Dienst

4.1 **Omschrijving**: De Dienst stelt Klant in staat om via een API of MCP-protocol Boekhouddata uit Exact Online op te halen en deze te gebruiken in combinatie met AI-assistenten.

4.2 **Pass-through**: De Dienst fungeert als doorgeefluik. Boekhouddata wordt opgehaald bij Exact Online en direct doorgestuurd naar de AI-assistent die Klant gebruikt. **Chef Data slaat geen Boekhouddata op.**

4.3 **Beschikbaarheid**: Chef Data streeft naar een beschikbaarheid van 99% op maandbasis, exclusief:
   - gepland onderhoud (aangekondigd minimaal 24 uur vooraf);
   - storingen bij Exact Online of de AI-provider;
   - overmacht situaties.

4.4 **Geen SLA-garanties**: Tenzij schriftelijk anders overeengekomen in een apart Service Level Agreement, gelden geen gegarandeerde uptime percentages en zijn geen credits of compensatie verschuldigd bij storingen.

### Artikel 5 - Gebruik van de Dienst

5.1 Klant is verantwoordelijk voor:
   a. het geheim houden van API-sleutels en inloggegevens;
   b. alle activiteiten die plaatsvinden via zijn account;
   c. naleving van de voorwaarden van Exact Online;
   d. naleving van de voorwaarden van de gebruikte AI-provider;
   e. de keuze van AI-provider en de configuratie daarvan.

5.2 **Acceptable Use**: Klant zal de Dienst niet gebruiken voor:
   a. illegale activiteiten of activiteiten in strijd met wet- of regelgeving;
   b. het verwerken van gegevens waarvoor Klant geen rechtmatige grondslag heeft;
   c. het omzeilen van beveiligingsmaatregelen;
   d. het belasten van de infrastructuur door excessief of geautomatiseerd gebruik;
   e. reverse engineering, decompilatie of afgeleide werken;
   f. wederverkoop of sublicentiëring zonder schriftelijke toestemming.

5.3 Bij overtreding van artikel 5.2 kan Chef Data de toegang per direct opschorten zonder dat enige restitutie verschuldigd is.

### Artikel 6 - AI-assistenten en Output

6.1 **Klant kiest de AI-provider**: De Dienst is compatibel met diverse AI-assistenten. Klant is vrij in de keuze van AI-provider en is zelf verantwoordelijk voor:
   - het aangaan van een overeenkomst met die AI-provider;
   - naleving van de voorwaarden van die AI-provider;
   - eventuele kosten van die AI-provider.

6.2 **GEEN FINANCIEEL, FISCAAL OF JURIDISCH ADVIES**:

> ⚠️ **BELANGRIJKE DISCLAIMER**
>
> De AI-assistenten waarmee de Dienst wordt gebruikt kunnen informatie genereren die onjuist, onvolledig of misleidend is. De output van AI-assistenten:
> - vormt GEEN financieel, fiscaal, juridisch of ander professioneel advies;
> - vervangt NIET het oordeel van een gekwalificeerde professional;
> - dient ALTIJD door Klant te worden gecontroleerd en geverifieerd.
>
> Chef Data is op geen enkele wijze aansprakelijk voor beslissingen genomen op basis van AI-output.

6.3 **AI-hallucinaties**: AI-systemen kunnen informatie genereren die niet in de Boekhouddata voorkomt ("hallucinaties"). Klant erkent dit risico en zal AI-output nooit zonder verificatie gebruiken voor besluitvorming.

6.4 **Intellectueel eigendom AI-output**:
   a. Chef Data maakt geen aanspraak op de output gegenereerd door AI-assistenten.
   b. Het intellectueel eigendom op AI-output wordt beheerst door de voorwaarden van de betreffende AI-provider.
   c. Klant vrijwaart Chef Data voor claims van derden met betrekking tot AI-output.

### Artikel 7 - Persoonsgegevens en Privacy

7.1 Voor zover Chef Data bij het leveren van de Dienst Persoonsgegevens verwerkt ten behoeve van Klant, is de Verwerkersovereenkomst (bijlage bij deze voorwaarden) van toepassing.

7.2 Klant garandeert dat:
   a. Klant een geldige rechtsgrondslag heeft voor de verwerking van Persoonsgegevens die via de Dienst worden verwerkt;
   b. betrokkenen adequaat zijn geïnformeerd over de verwerking;
   c. Klant bevoegd is deze gegevens aan Chef Data te verstrekken.

7.3 De verwerking van Persoonsgegevens is nader uitgewerkt in ons Privacybeleid op praatmetjeboekhouding.nl/privacy.

### Artikel 8 - Tarieven en Betaling

8.1 De actuele tarieven zijn gepubliceerd op de website of zijn schriftelijk overeengekomen.

8.2 Alle genoemde bedragen zijn exclusief BTW, tenzij anders vermeld.

8.3 Betaling geschiedt via Stripe. Klant machtigt Chef Data om periodiek verschuldigde bedragen te incasseren.

8.4 Bij niet-tijdige betaling:
   a. is Klant van rechtswege in verzuim;
   b. is Klant wettelijke handelsrente verschuldigd;
   c. kan Chef Data de Dienst opschorten na een betalingsherinnering.

### Artikel 9 - Aansprakelijkheid

9.1 **Beperking**: De totale aansprakelijkheid van Chef Data jegens Klant is beperkt tot:
   a. het bedrag dat door de aansprakelijkheidsverzekering wordt uitgekeerd, of indien geen uitkering plaatsvindt:
   b. het bedrag dat Klant in de 12 maanden voorafgaand aan de schadeveroorzakende gebeurtenis aan Chef Data heeft betaald, met een maximum van €5.000.

9.2 **Uitsluitingen**: Chef Data is nimmer aansprakelijk voor:
   a. **indirecte schade**, waaronder gevolgschade, gederfde winst, gemiste besparingen, verlies van goodwill, bedrijfsschade, of schade door bedrijfsstagnatie;
   b. **schade door onjuiste of onvolledige AI-output**, inclusief maar niet beperkt tot hallucinaties, verkeerde berekeningen, of misleidende informatie;
   c. **schade door beslissingen** die Klant of derden nemen op basis van informatie verkregen via de Dienst;
   d. **schade door storingen** bij Exact Online, AI-providers, of andere diensten van derden;
   e. **schade door ongeautoriseerde toegang** indien Klant API-sleutels of inloggegevens niet adequaat heeft beschermd;
   f. **schade door wijzigingen** in de Exact Online API of AI-provider APIs.

9.3 **Vrijwaring**: Klant vrijwaart Chef Data voor alle aanspraken van derden die verband houden met:
   a. het gebruik van de Dienst door Klant;
   b. schending van deze voorwaarden door Klant;
   c. inbreuk op rechten van derden;
   d. beslissingen genomen op basis van AI-output.

9.4 De beperkingen in dit artikel gelden niet voor schade veroorzaakt door opzet of bewuste roekeloosheid van de bedrijfsleiding van Chef Data.

### Artikel 10 - Duur en Beëindiging

10.1 De Overeenkomst wordt aangegaan voor onbepaalde tijd, tenzij schriftelijk anders overeengekomen.

10.2 Beide partijen kunnen de Overeenkomst opzeggen met inachtneming van een opzegtermijn van één (1) maand.

10.3 Chef Data kan de Overeenkomst met onmiddellijke ingang beëindigen indien:
   a. Klant in strijd handelt met deze voorwaarden;
   b. Klant failliet wordt verklaard of surseance van betaling aanvraagt;
   c. Chef Data de Dienst geheel staakt.

10.4 **Na beëindiging**:
   a. vervalt direct het recht om de Dienst te gebruiken;
   b. worden OAuth-tokens ingetrokken;
   c. worden accountgegevens binnen 30 dagen verwijderd, tenzij bewaring wettelijk verplicht is;
   d. is geen restitutie van vooruitbetaalde bedragen verschuldigd bij beëindiging door Chef Data wegens overtreding door Klant.

### Artikel 11 - Wijzigingen

11.1 Chef Data kan deze voorwaarden wijzigen. Wijzigingen worden minimaal 30 dagen vooraf aangekondigd via e-mail of in de Dienst.

11.2 Indien Klant niet akkoord gaat met gewijzigde voorwaarden, kan Klant de Overeenkomst opzeggen vóór inwerkingtreding van de wijzigingen.

11.3 Voortgezet gebruik van de Dienst na inwerkingtreding geldt als acceptatie van de gewijzigde voorwaarden.

### Artikel 12 - Overmacht

12.1 Chef Data is niet gehouden tot nakoming van enige verplichting indien dit wordt verhinderd door overmacht.

12.2 Onder overmacht wordt verstaan: storingen bij Exact Online, storingen bij AI-providers, storingen bij hosting/cloudproviders, cyberaanvallen, overheidsmaatregelen, natuurrampen, pandemieën, en andere omstandigheden buiten de invloedssfeer van Chef Data.

### Artikel 13 - Intellectueel Eigendom

13.1 Alle intellectuele eigendomsrechten op de Dienst, inclusief maar niet beperkt tot software, documentatie, en know-how, berusten bij Chef Data.

13.2 Klant verkrijgt uitsluitend een beperkt, niet-exclusief, niet-overdraagbaar gebruiksrecht voor de duur van de Overeenkomst.

### Artikel 14 - Vertrouwelijkheid

14.1 Partijen zullen vertrouwelijke informatie van de andere partij geheim houden en alleen gebruiken voor de uitvoering van de Overeenkomst.

14.2 Deze verplichting geldt niet voor informatie die:
   a. algemeen bekend is of wordt;
   b. al in bezit was van de ontvangende partij;
   c. onafhankelijk is ontwikkeld;
   d. van een derde is verkregen zonder geheimhoudingsverplichting;
   e. moet worden verstrekt op grond van wet of rechterlijk bevel.

### Artikel 15 - Toepasselijk Recht en Geschillen

15.1 Op de Overeenkomst is uitsluitend **Nederlands recht** van toepassing.

15.2 Het Weens Koopverdrag (CISG) is uitdrukkelijk uitgesloten.

15.3 Geschillen worden uitsluitend voorgelegd aan de **bevoegde rechter te Amsterdam**, tenzij dwingend recht anders voorschrijft.

15.4 Alvorens een geschil voor te leggen aan de rechter, zullen partijen gedurende minimaal 30 dagen trachten het geschil in onderling overleg op te lossen.

### Artikel 16 - Slotbepalingen

16.1 Indien een bepaling van deze voorwaarden nietig of vernietigbaar is, laat dit de geldigheid van de overige bepalingen onverlet.

16.2 In geval van nietigheid of vernietiging wordt de betreffende bepaling vervangen door een geldige bepaling die de bedoeling van partijen zoveel mogelijk benadert.

16.3 De Nederlandstalige versie van deze voorwaarden is bindend. Vertalingen zijn uitsluitend ter informatie.

---

**Chef Data B.V.**
Marconistraat 23, 1223BP Hilversum
KvK: 96120924 | BTW: NL867477702B01
info@praatmetjeboekhouding.nl | praatmetjeboekhouding.nl

---

### Engelse versie nodig?

**Aanbeveling**: Ja, op termijn, maar niet kritiek voor launch.

Argumenten voor:
- Belgische klanten spreken soms Engels als voorkeurstaal
- Internationale accountantskantoren
- Toekomstige uitbreiding

Argumenten tegen nu:
- Extra vertaalkosten (€500-1.500)
- Risico van inconsistenties tussen versies
- Nederlands recht is van toepassing, Nederlandse tekst prevaleert

**Advies**: Start met Nederlands. Voeg Engels toe wanneer eerste internationale klant vraagt.

---

## Deel 4: Verwerkersovereenkomst

### Versie A: Standaard B2B Verwerkersovereenkomst

---

# VERWERKERSOVEREENKOMST

*Data Processing Agreement (DPA)*

---

## Partijen

**Verwerkingsverantwoordelijke ("Klant"):**
[Naam bedrijf]
[Adres]
[KvK-nummer]
Vertegenwoordigd door: [Naam]

**Verwerker ("Chef Data"):**
Chef Data B.V.
Marconistraat 23, 1223BP Hilversum
KvK-nummer: 96120924
Vertegenwoordigd door: de directie

Hierna gezamenlijk "Partijen" en ieder afzonderlijk "Partij".

---

## Overwegingen

A. Klant maakt gebruik van de dienst "Praat met je Boekhouding" van Chef Data (de "Dienst").

B. Bij het leveren van de Dienst verwerkt Chef Data persoonsgegevens ten behoeve van Klant.

C. Partijen wensen hun afspraken over de verwerking van persoonsgegevens vast te leggen conform artikel 28 van de Algemene Verordening Gegevensbescherming (AVG).

---

## Artikel 1 - Definities

1.1 Begrippen in deze Verwerkersovereenkomst die in de AVG zijn gedefinieerd, hebben de betekenis zoals in de AVG bepaald.

1.2 **Persoonsgegevens**: alle persoonsgegevens die Chef Data verwerkt ten behoeve van Klant in het kader van de Dienst.

1.3 **Sub-verwerker**: een derde partij die Chef Data inschakelt voor de verwerking van Persoonsgegevens.

1.4 **Datalek**: een inbreuk op de beveiliging die per ongeluk of op onrechtmatige wijze leidt tot vernietiging, verlies, wijziging of ongeoorloofde verstrekking van of toegang tot Persoonsgegevens.

---

## Artikel 2 - Onderwerp en duur

2.1 **Onderwerp**: Deze Verwerkersovereenkomst heeft betrekking op de verwerking van Persoonsgegevens door Chef Data ten behoeve van Klant in het kader van de Dienst.

2.2 **Duur**: Deze Verwerkersovereenkomst is van kracht zolang Chef Data Persoonsgegevens verwerkt ten behoeve van Klant.

2.3 **Beëindiging**: Bij beëindiging van de Hoofdovereenkomst eindigt deze Verwerkersovereenkomst van rechtswege.

---

## Artikel 3 - Aard en doel van de verwerking

3.1 Chef Data verwerkt Persoonsgegevens uitsluitend voor de volgende doeleinden:
   a. het ophalen van boekhouddata uit Exact Online via API;
   b. het doorsturen van boekhouddata naar de AI-assistent die Klant gebruikt;
   c. het bijhouden van gebruiksstatistieken (geanonimiseerd);
   d. het beveiligen en onderhouden van de Dienst.

3.2 De aard van de verwerking betreft:
   - het tijdelijk in het geheugen laden van gegevens;
   - het transformeren van data naar AI-compatibel formaat;
   - het via beveiligde verbinding doorsturen naar AI-provider;
   - **expliciet NIET**: het permanent opslaan van boekhouddata.

---

## Artikel 4 - Soorten Persoonsgegevens en categorieën betrokkenen

4.1 **Soorten Persoonsgegevens** die kunnen worden verwerkt:

| Categorie | Voorbeelden |
|-----------|-------------|
| Identificatiegegevens | Naam, bedrijfsnaam, contactpersoon |
| Contactgegevens | E-mailadres, telefoonnummer, adres |
| Financiële gegevens | IBAN, factuurbedragen, betalingsstatus |
| Transactiegegevens | Factuurregels, boekingsdata, omschrijvingen |
| Zakelijke gegevens | Debiteur/crediteur informatie, BTW-nummers |

4.2 **Categorieën betrokkenen**:
   - Klanten van Klant (debiteuren)
   - Leveranciers van Klant (crediteuren)
   - Medewerkers van Klant (indien in administratie)
   - Contactpersonen bij relaties van Klant

---

## Artikel 5 - Verplichtingen van Chef Data

5.1 Chef Data zal:

   a. **Instructies naleven**: Persoonsgegevens uitsluitend verwerken op basis van schriftelijke instructies van Klant, inclusief de instructies in deze Verwerkersovereenkomst, tenzij verwerking vereist is op grond van Unierecht of lidstaatrecht;

   b. **Vertrouwelijkheid**: ervoor zorgen dat personen die Persoonsgegevens verwerken zich hebben verbonden aan geheimhouding;

   c. **Beveiligingsmaatregelen**: passende technische en organisatorische maatregelen nemen om een beveiligingsniveau te waarborgen dat past bij het risico (zie Bijlage 1);

   d. **Sub-verwerkers**: alleen Sub-verwerkers inschakelen met voorafgaande schriftelijke toestemming van Klant en onder dezelfde verplichtingen (zie Bijlage 2);

   e. **Bijstand rechten betrokkenen**: Klant bijstaan bij het beantwoorden van verzoeken van betrokkenen tot uitoefening van hun rechten onder de AVG;

   f. **Bijstand verplichtingen**: Klant bijstaan bij het nakomen van verplichtingen uit artikelen 32-36 AVG (beveiliging, melding datalekken, DPIA, voorafgaande raadpleging);

   g. **Verwijdering/retournering**: na beëindiging alle Persoonsgegevens verwijderen of retourneren, naar keuze van Klant, en bestaande kopieën verwijderen tenzij bewaring verplicht is;

   h. **Audits**: Klant in staat stellen audits uit te voeren of te laten uitvoeren, en daaraan medewerking verlenen.

---

## Artikel 6 - Datalekken

6.1 Chef Data informeert Klant zonder onredelijke vertraging, en in elk geval binnen 24 uur, nadat Chef Data kennis heeft gekregen van een Datalek.

6.2 De melding bevat tenminste:
   - een beschrijving van het Datalek;
   - de categorieën betrokkenen en geschat aantal;
   - de waarschijnlijke gevolgen;
   - de genomen of voorgestelde maatregelen.

6.3 Chef Data ondersteunt Klant bij het doen van meldingen aan de Autoriteit Persoonsgegevens en/of betrokkenen indien vereist.

---

## Artikel 7 - Sub-verwerkers

7.1 Klant geeft Chef Data algemene schriftelijke toestemming voor het inschakelen van Sub-verwerkers.

7.2 De actuele lijst van Sub-verwerkers is opgenomen in **Bijlage 2**.

7.3 Chef Data informeert Klant minimaal 14 dagen voorafgaand aan het inschakelen van een nieuwe Sub-verwerker of het vervangen van een bestaande Sub-verwerker.

7.4 Klant kan binnen 14 dagen na kennisgeving gemotiveerd bezwaar maken. Partijen treden in dat geval in overleg. Leidt dit niet tot overeenstemming, dan kan Klant de Overeenkomst opzeggen.

7.5 Chef Data legt aan Sub-verwerkers dezelfde verplichtingen op als in deze Verwerkersovereenkomst en blijft jegens Klant aansprakelijk voor de nakoming door Sub-verwerkers.

---

## Artikel 8 - Doorgifte buiten de EER

8.1 Chef Data zal Persoonsgegevens niet doorgeven naar landen buiten de Europese Economische Ruimte (EER) zonder passende waarborgen.

8.2 Ten aanzien van Anthropic (Sub-verwerker, VS):
   - Anthropic is gecertificeerd onder het EU-US Data Privacy Framework (adequaatheidsbesluit)
   - Aanvullend zijn Standard Contractual Clauses (SCCs) van toepassing
   - Het DPA van Anthropic is automatisch geïncorporeerd in hun Commercial Terms

8.3 Ten aanzien van overige Sub-verwerkers: zie Bijlage 2 voor de toepasselijke waarborgen.

---

## Artikel 9 - Verplichtingen van Klant

9.1 Klant garandeert dat:
   a. een geldige rechtsgrondslag bestaat voor de verwerking;
   b. betrokkenen zijn geïnformeerd conform artikelen 13/14 AVG;
   c. Klant bevoegd is de Persoonsgegevens aan Chef Data te verstrekken;
   d. de instructies aan Chef Data in overeenstemming zijn met de AVG.

9.2 Klant vrijwaart Chef Data voor claims van betrokkenen of derden die voortvloeien uit schending van de garanties in lid 1.

---

## Artikel 10 - Aansprakelijkheid

10.1 De aansprakelijkheid van Chef Data onder deze Verwerkersovereenkomst wordt beheerst door de aansprakelijkheidsbepalingen in de Algemene Voorwaarden.

10.2 Partijen zijn ieder aansprakelijk voor hun eigen AVG-boetes.

---

## Artikel 11 - Slotbepalingen

11.1 Bij strijdigheid tussen deze Verwerkersovereenkomst en de Algemene Voorwaarden prevaleert deze Verwerkersovereenkomst.

11.2 Op deze Verwerkersovereenkomst is Nederlands recht van toepassing.

11.3 Geschillen worden voorgelegd aan de bevoegde rechter te Amsterdam.

---

## Bijlage 1: Technische en organisatorische maatregelen

Chef Data heeft de volgende beveiligingsmaatregelen geïmplementeerd:

### Technische maatregelen

| Maatregel | Implementatie |
|-----------|---------------|
| **Encryptie in transit** | TLS 1.3 voor alle verbindingen |
| **Encryptie at rest** | AES-256 voor opgeslagen gegevens |
| **Authenticatie** | OAuth 2.0 met Exact Online |
| **API-beveiliging** | API keys worden gehashed opgeslagen |
| **Netwerk** | Cloudflare WAF en DDoS-bescherming |
| **Toegangscontrole** | Least-privilege principe |
| **Logging** | Audit logs van toegang |

### Organisatorische maatregelen

| Maatregel | Implementatie |
|-----------|---------------|
| **Geheimhouding** | Alle medewerkers gebonden aan geheimhouding |
| **Toegangsbeheer** | Need-to-know basis |
| **Incident response** | Procedure voor datalekken |
| **Updates** | Regelmatige security updates |

### Specifieke maatregel: geen opslag boekhouddata

Chef Data slaat geen boekhouddata permanent op. Data wordt:
- in het werkgeheugen geladen;
- getransformeerd naar het vereiste formaat;
- direct doorgestuurd naar de AI-provider;
- niet bewaard na het verzoek.

---

## Bijlage 2: Sub-verwerkers

| Sub-verwerker | Locatie | Dienst | Waarborg |
|---------------|---------|--------|----------|
| **Exact Online** (Exact Holding B.V.) | Nederland | Boekhoud-API | EU-verwerking |
| **Cloudflare, Inc.** | EU-regio | Hosting, WAF, Database | EU-dataresidentie |
| **Stripe, Inc.** | EU/VS | Betalingsverwerking | SCCs + DPA |
| **Anthropic PBC** | VS | AI-verwerking (indien gebruikt) | EU-US DPF + SCCs |
| **OpenAI LP** | VS | AI-verwerking (indien gebruikt) | SCCs + DPA |

**Let op**: De AI-provider (Anthropic, OpenAI, Microsoft, etc.) wordt alleen ingeschakeld wanneer Klant de Dienst actief gebruikt met die AI-provider. Klant bepaalt zelf welke AI-provider wordt gebruikt.

---

## Ondertekening

| Namens Klant | Namens Chef Data |
|--------------|------------------|
| Naam: ________________ | Naam: ________________ |
| Functie: ________________ | Functie: Directeur |
| Datum: ________________ | Datum: ________________ |
| Handtekening: | Handtekening: |

---

### Versie B: Aanvulling voor Accountantskantoren

---

# ADDENDUM VERWERKERSOVEREENKOMST ACCOUNTANTSKANTOREN

*Sub-sub-verwerker situatie*

---

Dit addendum is van toepassing wanneer Klant een accountantskantoor, administratiekantoor of vergelijkbare dienstverlener is die de Dienst gebruikt voor het verwerken van gegevens van eindklanten.

---

## Artikel A1 - Positie in de verwerkingsketen

A1.1 In de verwerkingsketen:
- Eindklant van Klant = Verwerkingsverantwoordelijke
- Klant (accountantskantoor) = Verwerker
- Chef Data = Sub-verwerker
- AI-provider (bijv. Anthropic) = Sub-sub-verwerker

A1.2 Klant verklaart dat:
   a. tussen Klant en diens Eindklanten verwerkersovereenkomsten zijn gesloten;
   b. deze verwerkersovereenkomsten het inschakelen van sub-verwerkers toestaan;
   c. Klant bevoegd is namens Eindklanten deze Verwerkersovereenkomst met Chef Data aan te gaan.

---

## Artikel A2 - Doorgifte van verplichtingen

A2.1 Klant garandeert dat de verwerkersovereenkomst met Eindklanten:
   a. het gebruik van AI-assistenten voor boekhoudverwerking toestaat of niet verbiedt;
   b. adequate informatie aan betrokkenen over AI-verwerking verplicht;
   c. passende waarborgen bevat voor internationale doorgifte.

A2.2 Indien de verwerkersovereenkomst met Eindklanten beperkingen bevat die het gebruik van de Dienst zouden belemmeren, is Klant verantwoordelijk voor het verkrijgen van aanvullende toestemming van Eindklanten.

---

## Artikel A3 - Informatieplicht jegens Eindklanten

A3.1 Klant informeert Eindklanten adequaat over:
   a. het gebruik van de Dienst;
   b. de doorgifte van boekhouddata naar AI-assistenten;
   c. de locatie van dataverwerking (inclusief VS voor AI-providers);
   d. de mogelijkheid om AI-verwerking te weigeren.

A3.2 Chef Data stelt op verzoek materiaal beschikbaar ter ondersteuning van deze informatieverplichting.

---

## Artikel A4 - Verzoeken van betrokkenen

A4.1 Verzoeken van betrokkenen (klanten van Eindklanten) worden als volgt afgehandeld:
   a. Verzoeken gericht aan Chef Data worden doorgestuurd naar Klant;
   b. Klant stuurt relevante verzoeken door naar de betreffende Eindklant;
   c. Eindklant beantwoordt het verzoek als Verwerkingsverantwoordelijke.

A4.2 Chef Data verleent medewerking aan verzoeken, maar heeft geen directe relatie met de betrokkenen van Eindklanten.

---

## Artikel A5 - Aansprakelijkheid

A5.1 Klant vrijwaart Chef Data voor:
   a. claims van Eindklanten met betrekking tot de verwerking;
   b. claims van betrokkenen van Eindklanten;
   c. AVG-boetes opgelegd vanwege gedragingen van Klant of Eindklanten.

A5.2 Chef Data is jegens Eindklanten niet contractueel gebonden en aanvaardt geen aansprakelijkheid jegens Eindklanten.

---

**Dit addendum is onlosmakelijk verbonden met de Verwerkersovereenkomst.**

---

## Deel 5: Disclaimer Teksten

### 5.1 Dashboard disclaimer (prominente banner)

```html
<div class="disclaimer-banner">
  <strong>⚠️ Belangrijk:</strong> AI-assistenten kunnen fouten maken.
  Controleer belangrijke informatie altijd in Exact Online.
  Deze dienst vervangt geen professioneel financieel of fiscaal advies.
</div>
```

**Volledige tekst voor dashboard:**

> **Disclaimer AI-assistenten**
>
> De informatie die AI-assistenten (zoals Claude) genereren op basis van uw boekhouddata kan onjuist, onvolledig of misleidend zijn. AI-systemen kunnen "hallucineren" — informatie presenteren die niet in uw administratie staat.
>
> **Belangrijk:**
> - Verifieer cijfers en analyses altijd in Exact Online
> - Neem geen financiële beslissingen uitsluitend op basis van AI-output
> - Deze dienst vervangt geen accountant, boekhouder of fiscalist
> - Chef Data is niet aansprakelijk voor beslissingen gebaseerd op AI-output
>
> Door de dienst te gebruiken accepteert u deze voorwaarden.

---

### 5.2 E-mail disclaimer (footer)

**Kort (standaard e-mail footer):**

```
---
De informatie in AI-gegenereerde antwoorden kan onjuist zijn.
Verifieer belangrijke informatie altijd in uw administratie.
Praat met je Boekhouding vervangt geen professioneel advies.
```

**Lang (bij financiële informatie):**

```
---
DISCLAIMER: Dit bericht kan informatie bevatten gegenereerd door
AI-assistenten. AI-output kan onjuist, onvolledig of misleidend zijn.
Verifieer alle cijfers en analyses in uw Exact Online administratie
alvorens beslissingen te nemen.

Praat met je Boekhouding (Chef Data B.V.) verstrekt geen financieel,
fiscaal of juridisch advies. Raadpleeg een gekwalificeerde professional
voor dergelijk advies. Chef Data B.V. is niet aansprakelijk voor
beslissingen genomen op basis van informatie uit deze dienst.
```

---

### 5.3 "Geen advies" formulering (meerdere varianten)

**Variant 1 - Kort en direct:**
> Dit is geen financieel, fiscaal of juridisch advies. Raadpleeg een professional.

**Variant 2 - Uitgebreider:**
> De informatie gegenereerd door AI-assistenten is uitsluitend informatief en vormt geen financieel, fiscaal, juridisch of ander professioneel advies. Neem geen belangrijke beslissingen zonder consultatie van een gekwalificeerde professional.

**Variant 3 - Zeer volledig (voor Terms of Service):**
> GEEN PROFESSIONEEL ADVIES: De Dienst en de output van AI-assistenten die via de Dienst worden gebruikt vormen geen financieel advies, beleggingsadvies, fiscaal advies, juridisch advies, accountancy-advies of enige andere vorm van professioneel advies. De informatie is uitsluitend bedoeld ter ondersteuning en vervangt nimmer het oordeel van een gekwalificeerde financieel adviseur, accountant, fiscalist, advocaat of andere professional. Klant dient voor alle beslissingen met financiële, fiscale of juridische gevolgen een gekwalificeerde professional te raadplegen.

---

### 5.4 Implementatie-advies disclaimers

| Locatie | Type disclaimer | Timing |
|---------|-----------------|--------|
| Dashboard home | Banner (kort) | Altijd zichtbaar |
| API response header | Technisch | Bij elke response |
| Onboarding flow | Pop-up (lang) | Bij eerste gebruik |
| Terms of Service | Artikel | Bij acceptatie |
| Marketing website | Footer + pagina | Altijd |
| Email transactioneel | Footer (kort) | Elke e-mail |
| Email met data | Footer (lang) | Bij financiële content |

---

## Deel 6: Exact Online Strategie

### 6.1 Het probleem

Exact Online App Center Terms, Sectie 3.2d:

> "You will not share any User Data with any third party, except with governmental organizations for compliance reasons only and/or when explicitly prior approved by Exact in writing."

Dit lijkt het delen van boekhouddata met AI-providers zoals Anthropic te verbieden.

### 6.2 Juridische argumentatie voor toestemming

**Argument 1: De klant deelt, niet Chef Data**

De technische architectuur kan zo worden gestructureerd dat:
- Klant autoriseert de koppeling met Exact Online
- Klant configureert de AI-provider
- Klant initieert elk dataverzoek
- Chef Data faciliteert alleen de doorgifte

Juridische positie: Chef Data is een "conduit" (doorgeefluik). De klant deelt hun eigen data met hun eigen AI-provider. Chef Data faciliteert dit technisch maar neemt niet het initiatief tot delen.

**Zwakte**: Exact kan dit zien als een technische constructie die het verbod omzeilt.

---

**Argument 2: Klant is eigenaar van de data**

De boekhouddata behoort toe aan de klant, niet aan Exact Online. Exact Online is verwerker van die data namens de klant. De klant als verwerkingsverantwoordelijke mag beslissen om hun eigen data te delen met derden.

**Zwakte**: Dit argument raakt aan de partnerovereenkomst, niet aan eigendom van data.

---

**Argument 3: Moderne zakelijke realiteit**

AI-tools zijn mainstream in de zakelijke markt. Exact zelf gebruikt AI in hun producten. Het verbieden van AI-integraties door partners is:
- Inconsistent met Exact's eigen praktijk
- Schadelijk voor klanten die AI willen gebruiken
- Niet in lijn met marktontwikkelingen

**Argument voor gesprek met Exact**: Vraag om expliciete toestemming met het argument dat dit in het belang is van Exact Online gebruikers.

---

### 6.3 Aanvraag schriftelijke toestemming

**Conceptbrief aan Exact:**

---

Betreft: Verzoek schriftelijke toestemming AI-integratie

Geachte [Partner Manager],

Chef Data B.V. ontwikkelt een dienst ("Praat met je Boekhouding") die Exact Online gebruikers in staat stelt hun boekhouddata te analyseren met behulp van AI-assistenten zoals Claude (Anthropic).

**Technische werking:**
- Gebruiker autoriseert via OAuth 2.0 toegang tot hun Exact Online divisie
- Bij gebruik roept de AI-assistent via ons platform data op uit de Exact Online API
- Data wordt niet opgeslagen, alleen doorgestuurd naar de AI-provider
- Gebruiker houdt volledige controle over welke data wordt gedeeld

**Beveiligingsmaatregelen:**
- TLS 1.3 encryptie voor alle verbindingen
- OAuth tokens versleuteld opgeslagen
- Geen persistente opslag van boekhouddata
- Cloudflare WAF bescherming

**Compliance AI-providers:**
- Anthropic: SOC 2 Type II, ISO 27001, ISO 42001
- Anthropic: DPA met Standard Contractual Clauses
- Anthropic: EU-US Data Privacy Framework gecertificeerd
- Anthropic: Geen training op commerciële data

**Verzoek:**
Op grond van Sectie 3.2d van de App Center Terms verzoeken wij om schriftelijke toestemming voor het doorsturen van User Data naar AI-providers, specifiek wanneer dit geschiedt op initiatief en met expliciete toestemming van de gebruiker.

Wij zijn beschikbaar voor een gesprek om onze architectuur toe te lichten en eventuele zorgen te adresseren.

Met vriendelijke groet,

Chef Data B.V.

---

### 6.4 Alternatieve structuren als backup

**Structuur A: "Bring Your Own API Key"**

Klant voert zelf API-sleutel van AI-provider in. Chef Data stuurt data naar endpoint dat klant configureert.

Juridische positie: Klant deelt data met eigen AI-provider via zelf ingerichte integratie.

Nadeel: Complexer voor gebruiker.

---

**Structuur B: Client-side verwerking**

MCP-server draait volledig lokaal bij de klant. Data gaat rechtstreeks van klant-PC naar Exact en naar AI-provider. Chef Data servers zien de boekhouddata niet.

Juridische positie: Chef Data deelt geen data; alles gebeurt client-side.

Nadeel: Beperkt tot Claude Desktop, geen web-app.

---

**Structuur C: Proxy met opt-in**

Klant tekent aanvullende overeenkomst waarin klant expliciet opdracht geeft tot doorgifte. Chef Data handelt als agent van klant.

Juridische positie: Klant geeft expliciete instructie; Chef Data voert uit.

---

### 6.5 Risico-analyse: doorgaan zonder toestemming

| Risico | Kans | Impact | Mitigatie |
|--------|------|--------|-----------|
| Exact beëindigt partnerschap | Hoog bij ontdekking | Kritiek - dienst stopt | Toestemming aanvragen |
| Exact stuurt cease & desist | Medium | Hoog - juridische kosten | Structuur aanpassen |
| Klant verliest Exact toegang | Laag | Hoog voor klant | Goede voorlichting |
| Rechtszaak door Exact | Laag | Zeer hoog | Niet doorgaan zonder OK |

**Aanbeveling**:

🔴 **NIET lanceren zonder Exact toestemming of juridisch advies dat dit veilig kan.**

De consequentie van het verliezen van API-toegang is fataal voor de dienst. Het risico is te hoog om te nemen zonder formele toestemming of een waterdichte alternatieve structuur.

---

## Deel 7: Launch Checklist

### 7.1 MUST HAVE voor commerciële launch

| Item | Status | Verantwoordelijke | Deadline |
|------|--------|-------------------|----------|
| ✅ Privacy Policy live | ✓ Gereed | - | - |
| ⬜ Exact Online toestemming | BLOCKER | Directie | Week 2 |
| ⬜ Terms of Service | Kritiek | Juridisch | Week 4 |
| ⬜ Verwerkersovereenkomst | Kritiek | Juridisch | Week 4 |
| ⬜ Disclaimer in dashboard | Kritiek | Development | Week 3 |
| ⬜ Acceptance Terms flow | Kritiek | Development | Week 4 |
| ⬜ Juristenreview ToS + DPA | Sterk aanbevolen | Extern | Week 6 |

### 7.2 KAN LATER

| Item | Prioriteit | Toelichting |
|------|------------|-------------|
| Engelse vertaling ToS | Medium | Bij eerste internationale klant |
| ISO 27001 certificering | Laag | Voor enterprise deals |
| Formeel SLA document | Laag | Bij enterprise klanten |
| DPIA | Medium | Bepaal eerst of verplicht |
| GBA-specifieke compliance | Medium | Bij eerste Belgische klant |
| PII-maskeringslaag | Medium | Nice-to-have, niet verplicht |

### 7.3 RED FLAGS - Launch stoppers

| Red Flag | Status | Oplossing |
|----------|--------|-----------|
| 🚫 Geen Exact toestemming | OPEN | Aanvragen of alternatieve structuur |
| 🚫 Geen ToS | OPEN | Implementeren |
| 🚫 Geen acceptatieflow | OPEN | Bouwen |
| ✅ Privacy Policy | OK | - |

### 7.4 Waar jurist MOET reviewen

1. **Terms of Service** - aansprakelijkheidsbeperkingen zijn alleen geldig als correct geformuleerd
2. **Verwerkersovereenkomst** - moet voldoen aan Art. 28 AVG
3. **Exact Online strategie** - risico-inschatting contractbreuk

### 7.5 Waar dit voldoende is

1. **Disclaimer teksten** - standaardformuleringen, geen jurist nodig
2. **Privacy Policy** - huidige versie is adequaat
3. **Interne compliance documentatie** - actielijsten, analyses

---

## Bijlagen

### Bijlage A: Referenties

- AVG/GDPR (Verordening EU 2016/679)
- Exact Online App Center Terms (Oktober 2018)
- Anthropic Commercial Terms & DPA
- EDPB Opinion 28/2024 (Legitimate Interest & AI)
- AP Guidance algorithmes en AI

### Bijlage B: Contactgegevens

| Partij | Contact | Doel |
|--------|---------|------|
| Exact Online Partner | partner@exact.com | Schriftelijke toestemming |
| Anthropic Sales | sales@anthropic.com | Enterprise/DPA vragen |
| AP | avg@autoriteitpersoonsgegevens.nl | Voorafgaand overleg |
| GBA | contact@gegevensbeschermingsautoriteit.be | Belgische vragen |

### Bijlage C: Kostenraming

| Item | Geschatte kosten | Wanneer nodig |
|------|------------------|---------------|
| Juridisch advies ToS + DPA | €3.000 - 8.000 | Vóór launch |
| DPIA (indien nodig) | €5.000 - 15.000 | Indien hoog risico |
| ISO 27001 (optioneel) | €30.000 - 100.000 | Enterprise deals |
| Jaarlijks juridisch onderhoud | €2.000 - 5.000 | Doorlopend |

---

## Versiegeschiedenis

| Versie | Datum | Wijzigingen |
|--------|-------|-------------|
| 1.0 | Jan 2026 | Initiële versie |

---

*Dit document is een juridische analyse en conceptdocumentatie. Het vormt geen juridisch advies. Laat kritieke documenten (ToS, DPA) reviewen door een gekwalificeerde jurist voordat u deze in productie neemt.*

**Chef Data B.V.**
Marconistraat 23, 1223BP Hilversum
KvK: 96120924
