# Compliance-analyse voor MCP-boekhoudintegratie met Claude

> **Status**: Analyse document - Actiepunten nog te implementeren
> **Datum**: Januari 2026
> **Auteur**: Claude (deep research)

Een Model Context Protocol (MCP) server die Exact Online-data toegankelijk maakt via Claude brengt significante compliance-uitdagingen met zich mee. **De meest kritieke bevinding**: Exact Online's partnervoorwaarden vereisen expliciete schriftelijke toestemming voor het delen van gebruikersdata met derden zoals Anthropic—dit vormt de belangrijkste juridische horde voor deze integratie. Daarnaast bereikt boekhouddata, ondanks lokale MCP-servers, altijd Anthropic's servers voor inferentie, wat GDPR-verwerkersverplichtingen activeert. De goede nieuws: Anthropic biedt een automatisch geïncorporeerd DPA met Standard Contractual Clauses, is gecertificeerd onder het EU-US Data Privacy Framework, en gebruikt commerciële data niet voor modeltraining.

---

## Inhoudsopgave

- [Data flow analyse](#data-flow-boekhouddata-bereikt-altijd-anthropic)
- [GDPR-compliance](#gdpr-compliance-anthropic-als-verwerker)
- [Financiële data classificatie](#financiële-data-geen-bijzondere-categorie-maar-wel-beschermd)
- [Anthropic certificeringen](#anthropics-beveiligingscertificeringen-en-beleid)
- [AP en GBA vereisten](#autoriteit-persoonsgegevens-en-gba-vereisten)
- [Exact Online verplichtingen](#exact-online-partnerverplichtingen-kritieke-horde)
- [Klantcommunicatie](#klantcommunicatie-en-verwerkersovereenkomsten)
- [Risicobeoordeling](#risicobeoordeling-en-handhavingsvoorbeelden)
- [Praktische stappen](#praktische-compliance-stappen-voor-mvp-launch)
- [Conclusie en actiepunten](#conclusie-drie-kritieke-actiepunten)

---

## Data flow: boekhouddata bereikt altijd Anthropic

Wanneer een gebruiker via Claude vraagt naar facturen of financiële gegevens, volgt de data een specifiek pad dat cruciaal is voor compliance-beoordeling. Ongeacht of de MCP-server lokaal (Claude Desktop) of cloud-hosted (API) draait, worden tool-resultaten naar Anthropic gestuurd voor Claude's responsverwerking.

### Technische data flow bij MCP-integratie

```
Gebruiker → Claude Host → Anthropic Cloud (query verwerking)
                              ↓
                    Tool call instructie
                              ↓
            MCP Client → MCP Server → Exact Online API
                              ↓
                    Boekhouddata (facturen, klanten, etc.)
                              ↓
            ← Tool resultaat terug naar Anthropic Cloud ←
                              ↓
            Claude genereert response met boekhouddata
```

**Het cruciale verschil** tussen lokale en cloud MCP-setups betreft alleen waar de MCP-server draait—niet waar Claude's inferentie plaatsvindt. Bij Claude Desktop communiceert de lokale MCP-server via STDIO (Standard Input/Output) zonder netwerkverkeer naar de datasource, maar de opgehaalde data gaat vervolgens alsnog naar Anthropic voor verwerking. Bij de Claude API verloopt alle communicatie via HTTPS, met extra netwerk-hops.

### Anthropic's serverlocaties en data-opslag

Anthropic's primaire infrastructuur draait op **Amazon Web Services**, met dataverwerking in de **VS, Europa, Azië en Australië**. Belangrijk: standaard data-opslag blijft in de **Verenigde Staten**. Voor striktere EU-data residency kunnen organisaties Claude gebruiken via **AWS Bedrock (Frankfurt, Ierland, Parijs)** of **Google Vertex AI (België, Frankfurt)** met regionale endpoints die zowel opslag als verwerking binnen de EU houden.

### Logging en retentiebeleid

Anthropic's standaard API-retentie bedraagt **30 dagen**, waarna inputs en outputs automatisch worden verwijderd. Voor enterprise-klanten is **Zero Data Retention (ZDR)** beschikbaar, waarbij logs alleen voor realtime abuse-detectie worden verwerkt en daarna direct worden verwijderd. Belangrijk: Anthropic stelt expliciet dat "raw content from connectors, including remote and local MCP servers" niet wordt gebruikt voor modeltraining—hoewel data die direct in conversaties wordt gekopieerd wel in de context terechtkomt.

---

## GDPR-compliance: Anthropic als verwerker

Onder de GDPR fungeert Anthropic als **verwerker (processor)** wanneer boekhouddata via Claude gaat. De accountingdienst die de MCP-server exploiteert is de **verwerkingsverantwoordelijke** die bepaalt welke data wordt verwerkt en waarvoor. Dit activeert de verplichtingen uit Artikel 28 GDPR.

### Data Processing Agreement automatisch geïncorporeerd

Anthropic biedt een DPA dat **automatisch wordt geïncorporeerd** in de Commercial Terms of Service. Dit DPA bevat Module Two (controller-to-processor) en Module Three (processor-to-processor) van de **Standard Contractual Clauses** conform EU-besluit 2021/914. Bij acceptatie van Anthropic's Commercial Terms accepteer je automatisch het DPA—geen separate ondertekening nodig.

Het DPA dekt:
- Toepasselijke databeschermingswetten inclusief GDPR en UK GDPR
- Sub-processor autorisaties met notificatieverplichtingen
- Recht om bezwaar te maken tegen nieuwe sub-processors binnen redelijke termijn
- Beveiligingsmaatregelen conform industrie-standaarden

### EU-US datatransfers na Schrems II

Het **EU-US Data Privacy Framework (DPF)** werd op 10 juli 2023 door de Europese Commissie aangenomen als adequaatheidsbesluit. Op **3 september 2025** bevestigde het Gerecht van de EU de geldigheid van dit framework. Anthropic is **gecertificeerd onder het DPF**, wat betekent dat datatransfers naar Anthropic's VS-servers zijn toegestaan **zonder aanvullende waarborgen** zoals SCCs of Binding Corporate Rules—hoewel deze in het DPA zijn opgenomen als extra bescherming.

### Rechtsgrondslag voor AI-verwerking

Het **EDPB Opinion 28/2024** (december 2024) bevestigt dat **gerechtvaardigd belang (legitimate interest, Artikel 6(1)(f))** een geldige rechtsgrondslag is voor AI-modelontwikkeling en -deployment. Dit vereist een drietrapstoets:

1. **Doeltoets**: Het belang moet rechtmatig, duidelijk gearticuleerd, en reëel zijn
2. **Noodzakelijkheidstoets**: Verwerking moet proportioneel zijn zonder minder ingrijpende alternatieven
3. **Afwegingstoets**: Belangen van de verwerkingsverantwoordelijke mogen niet prevaleren boven rechten van betrokkenen

Voor B2B-boekhoud-AI is **gerechtvaardigd belang** de meest praktische basis. Toestemming is meestal niet nodig maar wel moeilijk implementeerbaar omdat het specifiek, geïnformeerd, vrij gegeven, en even makkelijk intrekbaar moet zijn.

---

## Financiële data: geen bijzondere categorie maar wel beschermd

Boekhouddata—klantnamen, adressen, IBAN-nummers, facturen, omzetgegevens—valt **niet** onder de "bijzondere categorieën" van Artikel 9 GDPR. Die categorie is beperkt tot: ras/etniciteit, politieke opvattingen, religieuze overtuigingen, vakbondslidmaatschap, genetische/biometrische data, gezondheid, en seksuele geaardheid.

### IBAN-classificatie onder GDPR

Volgens de European Banking Authority (EBA Q&A 2020_5477) vormt een IBAN geen "gevoelige betalingsgegevens" onder PSD2 voor payment initiation services. Echter, wanneer gekoppeld aan natuurlijke personen **is een IBAN wel persoonsgegeven onder GDPR** en vereist bescherming. Dit betekent dat IBAN-nummers in factuur- en bankdata wel degelijk onder databeschermingsverplichtingen vallen.

### Aanbevolen maskeringstechnieken

| Dataveld | Techniek | Toelichting |
|----------|----------|-------------|
| **Klantnamen** | Substitutie/pseudonimisering | Vervang door tokens |
| **IBAN-nummers** | Tokenisatie | ****1234 format, omkeerbaar via vault |
| **Adressen** | Generalisatie | Alleen postcode of stad |
| **Factuurbedragen** | Variantie (±5-10%) | Behoudt statistische bruikbaarheid |
| **E-mailadressen** | Substitutie | Of hash met salt |

De MCP-server kan deze filtering implementeren **voordat** data naar Claude wordt gestuurd, wat de privacy-impact significant vermindert.

---

## Anthropic's beveiligingscertificeringen en beleid

Anthropic beschikt over robuuste security-certificeringen die belangrijk zijn voor vendor-assessments in de accountancysector.

### Behaalde certificeringen

| Certificering | Status |
|--------------|--------|
| **SOC 2 Type I & Type II** | ✓ Behaald |
| **ISO 27001:2022** | ✓ Behaald |
| **ISO/IEC 42001:2023** | ✓ Behaald (eerste internationale AI-governance standaard) |
| **CSA STAR Level 2** | ✓ Behaald |
| **HIPAA-ready** | ✓ BAA beschikbaar |

Het SOC 2 Type II rapport is beschikbaar onder NDA via Anthropic's Trust Portal (trust.anthropic.com).

### Modeltraining op commerciële data

Anthropic stelt expliciet: **"We will not use your chats or coding sessions to train our models"** voor commerciële diensten (API, Team, Enterprise). De enige uitzondering is expliciete opt-in voor het Development Partner Program of feedback via thumbs up/down mechanismen. Dit is een cruciale garantie voor zakelijke gebruikers.

---

## Autoriteit Persoonsgegevens en GBA-vereisten

### Nederlandse AP-guidance

De Autoriteit Persoonsgegevens is sinds 2023 **coördinerend toezichthouder voor algoritmes en AI**. Relevante vereisten:

- **DPIA verplicht**: Bij algoritmische verwerking met hoog risico is een Data Protection Impact Assessment verplicht
- **Voorafgaande raadpleging**: Als hoog risico niet kan worden gemitigeerd, raadpleeg AP vóór verwerking
- **Menselijke interventie**: Recht op menselijke tussenkomst bij geautomatiseerde besluitvorming
- **Transparantie**: Betrokkenen moeten worden geïnformeerd over AI-verwerking

De AP heeft ook onderzoek gedaan naar **verwerkersovereenkomsten** en bevond dat veel overeenkomsten niet alle Artikel 28(3)-vereisten volledig dekken, met name rond derdelandentransfers.

### Belgische GBA-guidance

De GBA publiceerde in december 2024 een uitgebreide **informatiebrochure over AI-systemen en de AVG**. Kernpunten:

- Artikel 6 rechtsgrondslagen gelden onverkort voor AI-systemen
- Referentie naar EDPB Opinion 28/2024 voor gerechtvaardigd belang
- Nadruk op risico's van historische bias in trainingsdata voor financiële beslissingen
- Verplicht menselijk toezicht voor hoog-risico AI onder de AI Act

De GBA participeert actief in de EDPB "Generative AI Enforcement Task Force" en tekende in oktober 2025 de "Joint Statement on Trustworthy Data Governance for AI."

---

## Exact Online partnerverplichtingen: kritieke horde

De **meest significante compliance-uitdaging** voor deze integratie komt van Exact Online's eigen voorwaarden—niet van de GDPR zelf.

### Verbod op datadeling met derden

Exact Online's App Center Terms (oktober 2018, Sectie 3.2d) stelt:

> **"You will not share any User Data, including any aggregated or processed User Data, with any third party, except with governmental organizations for compliance reasons only and/or when explicitly prior approved by Exact in writing."**

Het versturen van boekhouddata naar Anthropic's API voor Claude-verwerking kwalificeert waarschijnlijk als "sharing User Data with a third party." Dit vereist **expliciete schriftelijke goedkeuring van Exact** vóór implementatie.

### Overige Exact Online-vereisten

| Vereiste | Beschrijving |
|----------|--------------|
| **Data minimalisatie** | Alleen benodigde data voor gesteld doel opvragen |
| **Privacy policy URL** | Moet in de app worden opgenomen |
| **Doelbinding** | Wijzigingen in businessmodel vereisen schriftelijke toestemming |
| **Verwijderingsmechanisme** | Gebruikers moeten data kunnen laten verwijderen |
| **Security assessment** | Verplichte data & security review fase |
| **Auditrechten** | Exact mag audits uitvoeren |

### Exact's eigen AI-gebruik

Exact zelf gebruikt AI in producten zoals "Scan & Recognise" (factuurherkenning), AI-gestuurde betalingsherinneringen, en een generatieve AI-assistent. Hun AI-principes benadrukken "strict security standards" en "full transparency about sources used." Dit schept precedent maar elimineert niet de verplichting tot schriftelijke toestemming voor partners.

---

## Klantcommunicatie en verwerkersovereenkomsten

### Privacy policy vereisten

De privacy policy voor de MCP-dienst moet minimaal bevatten:
- Identificatie van Anthropic als sub-verwerker
- Beschrijving van welke data naar Claude wordt gestuurd
- Doeleinden van AI-verwerking
- Rechten van betrokkenen (inzage, rectificatie, verwijdering)
- Retentieperiodes
- Locatie van dataverwerking (VS, met EU-VS DPF adequaatheidsbesluit)
- Contact voor privacy-vragen

### B2B verwerkersovereenkomst inhoud

Op basis van Artikel 28(3) GDPR moet de verwerkersovereenkomst met klanten bevatten:

- **Onderwerp en duur** van verwerking
- **Aard en doel** van verwerking
- **Type persoonsgegevens**: NAW-gegevens, financiële gegevens, transactiedata
- **Categorieën betrokkenen**: Klanten, leveranciers, medewerkers van klant
- **Instructies verwerkingsverantwoordelijke**: Verwerker handelt alleen op gedocumenteerde instructies
- **Vertrouwelijkheid**: Geheimhoudingsverplichtingen personeel
- **Beveiligingsmaatregelen**: Technische en organisatorische maatregelen
- **Sub-verwerkers**: Schriftelijke autorisatie vereist; Anthropic als benoemde sub-verwerker
- **Rechten betrokkenen**: Assistentie bij verzoeken
- **Verwijdering/teruggave**: Bij beëindiging data verwijderen of retourneren
- **Audits**: Verwerker faciliteert audits
- **Derdelandentransfers**: Adequaatheidsbesluiten of SCCs (gedekt door Anthropic DPA)

---

## Risicobeoordeling en handhavingsvoorbeelden

### Realistische GDPR-boetescenario's

| Case | Land | Boete | Overtreding | Relevantie |
|------|------|-------|-------------|------------|
| **Clearview AI** | Nederland | €30,5M | Verwerking biometrische data zonder rechtsgrondslag | Direct AI-precedent |
| **Uber** | Nederland | €290M | Datatransfer naar VS zonder waarborgen | Transfer-overtredingen |
| **OpenAI/ChatGPT** | Italië | €15M | Transparantie- en betrokkenenrechten | AI chatbot precedent |
| **Meta** | Ierland | €1,2B | EU-VS transfers zonder adequate bescherming | Transfer-overtredingen |

De **AP heeft expliciet AI/algoritmes als prioriteit** voor 2024-2025 aangewezen, naast Big Tech en datahandel. De Clearview-zaak toont bereidheid om extraterritoriale AI-bedrijven te beboeten en zelfs **persoonlijke aansprakelijkheid van management** na te streven.

### Risico-matrix voor MCP-boekhoudintegratie

| Risico | Kans | Impact | Mitigatie |
|--------|------|--------|-----------|
| **Exact Online-contractbreuk** | Hoog (zonder toestemming) | Partner status verlies | Schriftelijke goedkeuring verkrijgen |
| **GDPR-boete** | Matig | Tot €20M of 4% omzet | Volledige GDPR-compliance |
| **Reputatieschade** | Matig | Significant in accountancy | Transparante communicatie |
| **Datalek** | Laag-Matig | Hoog | Encryptie, toegangscontrole |

---

## Praktische compliance-stappen voor MVP-launch

### Minimale stappen voor Nederland/België

**Fase 1: Juridische voorbereiding (2-4 weken)**
1. **Exact Online schriftelijke toestemming** aanvragen voor AI-verwerking met Anthropic als derde partij
2. **Legitimate Interest Assessment (LIA)** documenteren voor AI-verwerking
3. **Privacy policy** opstellen met Anthropic als sub-verwerker
4. **Verwerkersovereenkomst template** voor klanten voorbereiden

**Fase 2: Technische implementatie (4-8 weken)**
1. **Claude API** gebruiken (Commercial Terms, niet Desktop/consumer)
2. **PII-maskeringslaag** in MCP-server implementeren
3. **Logging en audit trails** opzetten
4. **Encryptie** configureren (TLS 1.2+, AES-256)

**Fase 3: Compliance documentatie (2-4 weken)**
1. **DPIA** uitvoeren indien hoog-risico verwerking
2. **Verwerkingsregister (ROPA)** opstellen
3. **Security assessment** voor Exact Online App Center doorlopen

### EU-gehoste alternatieven

| Provider | Land | Certificeringen | Overwegingen |
|----------|------|-----------------|--------------|
| **Mistral AI** | Frankrijk | ISO 27001 | Beste model-kwaliteit met EU-hosting |
| **Aleph Alpha** | Duitsland | ISO 27001, **BSI C5** | Striktste compliance, Duitse overheidsstandaard |
| **OVHcloud AI** | Frankrijk | ISO 27001, HDS | Healthcare-gecertificeerd |
| **Azure OpenAI (EU)** | Frankfurt | ISO 27001, SOC 2 | GPT-4 met EU data residency |

**Aleph Alpha** biedt de hoogste compliance met BSI C5-certificering en on-premises opties, maar met beperkter model-ecosysteem. **Mistral AI** combineert sterke Europese hosting met competitieve modellen en open-weight opties voor zelf-hosting.

### Kostenraming compliance-routes

| Route | Initiële kosten | Jaarlijkse kosten | Tijdlijn |
|-------|-----------------|-------------------|----------|
| Anthropic API + volledige compliance | €15.000-30.000 | €10.000-20.000 | 3-6 maanden |
| EU-hosted alternatief (Mistral/Aleph Alpha) | €20.000-40.000 | €15.000-30.000 | 4-8 maanden |
| Hybride (PII-masking + Anthropic) | €20.000-35.000 | €12.000-25.000 | 4-6 maanden |

Kosten omvatten: juridisch advies (€5.000-15.000), DPIA (€5.000-15.000), ISO 27001-voorbereiding indien gewenst (€30.000-100.000), en doorlopende compliance-monitoring.

---

## Conclusie: drie kritieke actiepunten

Deze analyse identificeert drie onmiddellijke prioriteiten voor een GDPR-compliant MCP-server die Exact Online-data via Claude ontsluit:

### Actiepunt 1: Exact Online Toestemming

**Exact Online's schriftelijke goedkeuring is de fundamentele voorwaarde**—zonder deze is de integratie contractueel niet toegestaan, ongeacht GDPR-compliance.

**Actie**: Start direct gesprek met Exact, met duidelijke beschrijving van:
- Dataflow architectuur
- Beveiligingsmaatregelen
- Anthropic's certificeringen en DPA

### Actiepunt 2: Anthropic API Configuratie

De **Anthropic API met Commercial Terms** biedt een solide compliance-fundament:
- Automatisch geïncorporeerd DPA met SCCs
- EU-VS DPF-certificering
- Geen modeltraining op data
- Beschikbare Zero Data Retention

**Actie**: Implementeer PII-maskeringslaag in MCP-server voordat data naar Claude gaat.

### Actiepunt 3: Proactieve Compliance-houding

De accountancysector's gevoeligheid voor databeveiliging rechtvaardigt proactieve aanpak.

**Acties**:
- [ ] Documenteer Legitimate Interest Assessment
- [ ] Implementeer technische beveiligingsmaatregelen conform ISO 27001
- [ ] Communiceer transparant naar klanten over AI-verwerking
- [ ] Stel privacy policy en verwerkersovereenkomst op

De €290 miljoen Uber-boete in Nederland demonstreert dat de AP serieus optreedt tegen datatransfer-overtredingen—adequate voorbereiding is essentieel.

---

## Referenties

- [Anthropic Trust Portal](https://trust.anthropic.com)
- [Anthropic DPA](https://www.anthropic.com/legal/commercial-terms)
- [EDPB Opinion 28/2024](https://edpb.europa.eu/our-work-tools/our-documents/opinion-board-art-64/opinion-282024-certain-data-protection-aspects_en)
- [Autoriteit Persoonsgegevens](https://autoriteitpersoonsgegevens.nl)
- [GBA AI Brochure](https://gegevensbeschermingsautoriteit.be)
- [Exact Online App Center Terms](https://apps.exactonline.com)
- [EU-US Data Privacy Framework](https://www.dataprivacyframework.gov)

---

*Dit document is een analyse en geen juridisch advies. Raadpleeg een privacy-jurist voor definitieve compliance-beslissingen.*
