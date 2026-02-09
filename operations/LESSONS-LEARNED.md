# Organizational Lessons Learned

> **Principe:** "Pijn + Reflectie = Vooruitgang"
>
> Dit document bevat organisatie-brede lessen die niet in een specifiek technisch domein vallen.

**Eigenaar:** Piet (CEO) → Matthijs (CSO)
**Update frequentie:** Na elke significante sessie of incident

---

## Strategische Lessen (Matthijs)

### 1. Kennissysteem Schalen Vereist Consistent Patroon

**Datum:** 2026-01-28
**Bron:** Sessie claude/review-operations-agents-yh6LS
**Categorie:** Organisatie Design

**Issue:**
Bij uitbreiden van kennissysteem van 3 tech-domeinen naar 7 domeinen ontstond de vraag: hoe houden we consistentie?

**Root Cause:**
Ad-hoc oplossingen schalen niet. Zonder consistent patroon krijgt elk domein zijn eigen structuur.

**Oplossing:**
Consistent patroon voor ALLE kennisdomeinen:
- Elke specialist → eigen `domein/LESSONS-LEARNED.md`
- Elke specialist → eigen `domein/VERSION.md`
- Centrale toegang → `KENNIS-TOEGANG.md`
- Zelfde format → zelfde verwachtingen

**Detectie:**
Wanneer een nieuw domein/specialist wordt toegevoegd, check: volgt het exact hetzelfde patroon?

---

### 2. Principes In Hoofden → Gedocumenteerde Systemen

**Datum:** 2026-01-28
**Bron:** Sessie claude/review-operations-agents-yh6LS
**Categorie:** Kennismanagement

**Issue:**
Ray Dalio principes waren "bekend" maar niet gedocumenteerd. Nieuwe collega's kunnen niet leren wat niet geschreven staat.

**Root Cause:**
Aanname dat "iedereen weet het wel" werkt niet bij schalen. Impliciete kennis is niet overdraagbaar.

**Oplossing:**
- PRINCIPLES.md met alle 12 principes
- BELIEVABILITY.md voor expertise tracking
- POST-MORTEM.md template voor leren van fouten
- Expliciete links vanuit elke agent instructie

**Detectie:**
Test: kan een nieuwe collega (agent) binnen 5 minuten vinden hoe wij beslissingen nemen? Zo nee → documenteer.

---

## Operationele Lessen (Piet)

### 3. Systematische Agent Review - Verifieer met Data

**Datum:** 2026-01-28
**Bron:** Sessie claude/review-operations-agents-yh6LS
**Categorie:** Kwaliteitscontrole

**Issue:**
Bij review "zijn alle agents klaar?" werden 5 agents gevonden zonder KENNIS-TOEGANG reference.

**Root Cause:**
Aannames zonder verificatie. "Ik denk dat het klopt" is geen bewijs.

**Oplossing:**
Systematische check met concrete data:
```bash
# Check wie KENNIS-TOEGANG refereert
grep -l "KENNIS-TOEGANG" operations/agents/*.md | wc -l

# Check wie het NIET doet
for f in operations/agents/*.md; do
  grep -q "KENNIS-TOEGANG" "$f" || echo "MISSING: $f"
done
```

**Detectie:**
Bij elke "is X compleet?" vraag: gebruik grep/search, niet geheugen.

---

### 4. Incomplete Input Herkennen - Vraag Altijd "Is Dit Alles?"

**Datum:** 2026-01-28
**Bron:** Sessie claude/review-operations-agents-yh6LS
**Categorie:** Communicatie

**Issue:**
Ray Dalio principes document was incompleet (Principle 12 + Implementation Guide misten). Pas na eerste implementatie ontdekt.

**Root Cause:**
Niet geverifieerd of input compleet was voordat werk begon.

**Oplossing:**
Bij grote documenten/input altijd:
1. Check structuur - zijn er numbered items? Welke nummers zie ik?
2. Check einde - is er een conclusie/samenvatting?
3. Vraag expliciet: "Is dit het volledige document?"

**Detectie:**
Wanneer je een genummerde lijst krijgt, tel de nummers. Wanneer je een document krijgt, check op "Conclusie" of "Samenvatting".

---

### 5. OAuth Flow - Valideer Alle Precondities Voordat Autorisatie

**Datum:** 2026-01-30
**Bron:** Claude Desktop "Not Connected" bug (P22)
**Categorie:** Security / UX

**Issue:**
Users konden MCP clients (Claude/ChatGPT) autoriseren ZONDER een Exact Online connectie.
Dit leidde tot "no_division_linked" errors bij tool gebruik - autorisatie leek geslaagd maar tools werkten niet.

**Root Cause:**
`/oauth/login.astro` checkte alleen of user een session had, niet of user ook Exact Online had gekoppeld.
Precondities voor succesvolle MCP usage:
1. ✅ User authenticated (session)
2. ❌ User has Exact Online connection (user_divisions populated)
3. ✅ User authorizes MCP client

**Oplossing:**
```typescript
// Check session AND Exact connection before showing consent screen
if (isAuthenticated && !hasExactConnection) {
  return Astro.redirect(`/connect?oauth_return=${currentUrl}`);
}
```

**Detectie:**
Bij elk OAuth/autorisatie systeem: "Wat heeft de user NODIG om succesvol te zijn?"
Valideer ALLE precondities VOORDAT je consent vraagt, niet achteraf.

---

### 6. Token Refresh - Memory vs Database Synchronization

**Datum:** 2026-01-30
**Bron:** 30-minuut disconnect issue (P22)
**Categorie:** Distributed Systems

**Issue:**
MCP sessies disconnecten na ~30 minuten met "token vernieuwen mislukt".

**Root Cause:**
1. Cron job refresht Exact tokens in DB elke 5 minuten
2. MCP sessie heeft oude tokens in memory
3. Wanneer MCP probeert te refreshen, gebruikt het OUDE refresh_token
4. Deze is al geconsumeerd door cron → Exact zegt "invalid"

**Oplossing:**
Altijd verse tokens uit database halen VOORDAT je refresh doet:
```typescript
// FOUT: gebruik cached token
await refreshToken(this.cachedRefreshToken);

// GOED: haal eerst verse uit DB
const freshTokens = await getFreshTokensFromDB(tokenId);
if (freshTokens.expiresAt > now) {
  // Cron already refreshed, use DB tokens
  return freshTokens;
}
// Only now use refresh_token from DB
await refreshToken(freshTokens.refreshToken);
```

**Detectie:**
Bij langlopende processen die tokens gebruiken: "Wie kan deze tokens ook wijzigen?"
Als meerdere processen dezelfde tokens kunnen refreshen → synchronizatie nodig.

---

## Proces Verbetering Log

| Datum | Les # | Geïmplementeerd? | Door |
|-------|-------|------------------|------|
| 2026-01-28 | 1 | Ja - 7 domeinen nu consistent | Piet |
| 2026-01-28 | 2 | Ja - PRINCIPLES.md etc | Piet |
| 2026-01-28 | 3 | Ja - review met grep | Piet |
| 2026-01-28 | 4 | Documenteer als reminder | Piet |
| 2026-01-30 | 5 | Ja - oauth/login.astro fix | Kees |
| 2026-01-30 | 6 | Ja - _base.ts getFreshTokens() | Kees |
| 2026-02-01 | 7 | Documenteer als reminder | Piet |
| 2026-02-06 | 8 | Documenteer + mitigatie plan | Matthijs |
| 2026-02-06 | 9 | Ja - regel in CLAUDE.md | Piet |
| 2026-02-06 | 10 | Documenteer + actie items | Piet/Matthijs |
| 2026-02-07 | 11 | Ja - SEO fixes in PR | Piet/Bram |
| 2026-02-09 | 12 | Ja - build-essays.js cleanup pipeline | Daan |
| 2026-02-09 | 13 | Ja - evenementen vereenvoudigd | Piet/Daan |

---

### 9. Wacht op CI Voordat Je Merged

**Datum:** 2026-02-06
**Bron:** Meerdere cancelled CI runs door te snel achter elkaar mergen
**Categorie:** Proces / CI-CD

**Issue:**
PRs werden binnen seconden na aanmaken gemerged, voordat CI klaar was. Dit cancelled de vorige CI run en betekent dat merges effectief zonder checks doorkomen.

**Root Cause:**
Snelheid boven zorgvuldigheid. Bij docs-only changes is het risico laag, maar bij code-changes skip je effectief de hele CI pipeline.

**Oplossing:**
Na `gh pr create`, ALTIJD wachten tot CI groen is:
```bash
# PR aanmaken
gh pr create --title "..." --body "..."

# Wacht op CI (blokkert tot checks klaar zijn)
gh pr checks --watch

# Pas dan mergen
gh pr merge --merge --delete-branch
```

**Detectie:**
Als je `cancelled` runs ziet in `gh run list`, merge je te snel.

---

### 7. Verduidelijk Doel Voordat Je Bouwt

**Datum:** 2026-02-01
**Bron:** MCP Registry publicatie poging
**Categorie:** Communicatie / Efficiëntie

**Issue:**
Opdracht was "Claude Desktop probleem oplossen" en "aanmelden in de algemene store". Ik bouwde een hele MCP Registry publicatie flow (mcp-publisher CLI downloaden, authenticeren, server.json maken) terwijl de echte oplossing simpeler was: direct submitten via Anthropic's Connector formulier.

**Root Cause:**
- Agents onderzochten "MCP Registry" → ik nam aan dat was de route
- Niet gevraagd: "Wat bedoel je precies met officiële connector?"
- Direct uitvoeren in plaats van eerst valideren

**Oplossing:**
Bij ambigue doelen ALTIJD eerst verduidelijken:
```
User: "Aanmelden bij de store"
FOUT: → Start bouwen aan eerste optie die je vindt
GOED: → "Welke store bedoel je? Claude Connectors, MCP Registry, of iets anders?"
```

**Verspilde tijd:** ~30 minuten aan verkeerde oplossing

**Detectie:**
Wanneer een opdracht meerdere interpretaties heeft, vraag:
1. "Wat is het eindresultaat dat je wilt zien?"
2. "Ken je een voorbeeld van wat je bedoelt?"

---

### 8. Vibe Coding ≠ Vibe Operating

**Datum:** 2026-02-06
**Bron:** Artikel Karim Khan (Zinzo.com) - "Why Vibe Coding Is Not a Business Strategy"
**Categorie:** Strategisch / Business Continuity

**Issue:**
AI agents kunnen code schrijven, audits uitvoeren, content produceren en systemen bouwen. Maar ownership, continuity en accountability zijn menselijke verantwoordelijkheden die niet gedelegeerd kunnen worden aan AI.

**Root Cause:**
De snelheid waarmee AI agents produceren (254 PRs in 3 weken) creëert de illusie dat het systeem zelfstandig draait. In werkelijkheid is er één mens (Matthijs) als single point of failure. Als die persoon uitvalt, stopt alles.

**Khan's kernvragen die we moeten kunnen beantwoorden:**
1. Wie owns dit in 2 jaar?
2. Wie maintained het?
3. Wie secured het?
4. Wie legt het uit aan het volgende team?
5. Wie draagt het risico als het faalt?

**Waar wij WEL anders zijn dan Khan's archetype:**
- Git als single source of truth (beslissingen, strategie, kennis)
- Systematisch leren via LESSONS-LEARNED.md per domein
- Security en compliance EERST, niet achteraf (audits GROEN)
- Branch protection met enforce_admins (geen cowboy deploys)
- Platform architectuur, geen quick hack

**Waar wij WEL kwetsbaar zijn:**
- Bus factor = 1 (credentials, context, beslissingen in één hoofd)
- AI agents reviewen AI-geschreven code (geen onafhankelijke menselijke review)
- Velocity > stability (254 PRs, maar geen monitoring/alerting)
- Documentatie geschreven door agents voor agents (niet getest met menselijke onboarding)

**Oplossing - 4 mitigaties:**

1. **Bus Factor Mitigatie**
   - "Hit by a bus" document: hoe draait alles, wie te bellen
   - Credentials in encrypted vault, niet alleen in één hoofd
   - Backup operator identificeren die minimaal kan deployen

2. **Onafhankelijke Review**
   - Externe menselijke code review (2-4 uur)
   - Penetration test na App Store launch
   - "Fresh eyes" onboarding test met iemand die de code nog niet kent

3. **Predictability boven Speed**
   - Shift van "build fast" naar "run reliable"
   - Monitoring en alerting opzetten vóór eerste klant
   - Stability metrics (uptime, error rate) naast velocity metrics

4. **Ownership Documentatie**
   - Architecture Decision Records (ADRs) voor grote keuzes
   - Runbook voor derden (niet alleen voor AI agents)
   - Incident response plan

**Detectie:**
Elke week de vraag: "Kan iemand anders dit overnemen met alleen wat in git staat?" Zo nee → documenteer tot het antwoord ja is.

**Bron artikel:** Karim Khan, Zinzo.com, 17 jan 2026 - "Riding the Waves of AI Without Drowning: Why Vibe Coding Is Not a Business Strategy"

---

### 10. mcp-remote OAuth is Ongeschikt voor Eindgebruikers

**Datum:** 2026-02-06
**Bron:** Productie MCP server "Server disconnected" in Claude.ai
**Categorie:** Product / UX / Klantimpact

**Issue:**
De productie `exact-online` MCP server in Claude.ai viel uit met "Server disconnected". Na analyse bleek een cascade van problemen:
1. OAuth token van `mcp-remote` verlopen na ~24u inactiviteit
2. `mcp-remote` upgradede zichzelf (0.1.36 → 0.1.37), nieuwe versie kon oude tokens niet vinden
3. Re-authenticatie vereist browser OAuth flow, maar Claude.ai geeft slechts 60 seconden timeout
4. Meerdere zombie-processen vochten om dezelfde callback port (EADDRINUSE op :4089)
5. Corrupte npm cache door race conditions tussen parallelle npx processen

**Root Cause:**
`mcp-remote` is een developer tool, geen eindgebruiker tool. Het vertrouwt op:
- Lokale bestandssysteem state (`~/.mcp-auth/`) die breekt bij versie-updates
- `npx -y` dat automatisch nieuwe versies installeert (breaking changes)
- Lokale callback server op vaste port (port conflicts)
- Handmatige browser flow voor re-authenticatie (niet automatiseerbaar)

**Impact voor klanten:**
Als dit een klant was geweest in plaats van ons:
- Ze zien "Server disconnected" → paniek, geen idee wat te doen
- Support kan niet remote debuggen (lokaal proces op hun machine)
- Oplossing vereist terminal kennis (kill process, rm cache, npx commando)
- Een boekhouder of ondernemer kan dit NIET zelf oplossen

**Oplossing - 3 niveaus:**

1. **Korte termijn (nu):**
   - Demo MCP (`exact-online-demo`) is bewust token-loos → geen OAuth issues
   - Dit valideert onze keuze voor de Exact partner demo
   - Documenteer reconnect procedure voor support team

2. **Middellange termijn (voor eerste klanten):**
   - Server-side token refresh moet 100% automatisch werken
   - Langere token lifetime overwegen (7 dagen refresh ipv 24u)
   - "Verbinding herstellen" self-service knop op praatmetjeboekhouding.nl
   - Monitoring/alerting op token expiry VOORDAT klant het merkt

3. **Lange termijn (schaal):**
   - Evalueer alternatieven voor `mcp-remote` (eigen thin client?)
   - Of: wacht tot Claude.ai native remote MCP OAuth ondersteunt
   - Token management volledig server-side, geen lokale state

**Detectie:**
- Monitor `Server disconnected` errors in Claude.ai MCP logs
- Alert op token expiry >12u voor geplande verloop
- Test maandelijks: "wat gebeurt er als token verloopt?"

**Kernles:**
Wat voor developers een kleine inconvenience is (terminal commando), is voor eindgebruikers een showstopper. Elke stap tussen "het werkt niet" en "het werkt weer" die handmatige actie vereist, is een stap te veel.

---

### 11. SEO: Title Tag ≠ Vindbaarheid - Zichtbare Tekst Telt

**Datum:** 2026-02-07
**Bron:** ChatGPT-verslag "Waarom ik de tool niet kon vinden"
**Categorie:** Marketing / SEO

**Issue:**
ChatGPT kon "Praat met je Boekhouding" niet vinden op generieke zoektermen als "Exact Online koppelen aan ChatGPT" of "Exact Online connector". De pagina werd pas gevonden bij merknaam-zoekopdrachten.

**Root Cause:**
De title tag was goed ("Exact Online koppelen met ChatGPT, Claude & AI"), maar de **zichtbare tekst** op de pagina bevatte deze zoektermen niet. H1 zei "Praat met je Exact Online boekhouding" zonder "ChatGPT", "koppelen" of "MCP connector". Google en AI-zoektools vertrouwen op zichtbare content, niet alleen op meta tags.

**Oplossing:**
- Hero sectie uitgebreid met zichtbare tekst die doelwoorden bevat
- FAQPage schema uitgebreid van 4→7 vragen met ChatGPT/MCP-specifieke content
- HowTo schema toegevoegd
- Keywords meta tag uitgebreid
- Sitemap gesynchroniseerd (10→22 blog posts)

**Detectie:**
Kwartaal-check: zoek op je doelwoorden in Google EN in ChatGPT/Claude. Vind je jezelf? Zo nee → zichtbare tekst aanpassen.

**Kernles:** Een goede `<title>` tag is noodzakelijk maar onvoldoende. Zoekmachines (en AI-tools) gebruiken voornamelijk zichtbare paginatekst om relevantie te bepalen.

---

### 12. WordPress Migratie: Scrape Content ≠ Content Klaar

**Datum:** 2026-02-09
**Bron:** Stefan Zweig Genootschap website-migratie
**Categorie:** Content / Technisch

**Issue:**
Bij het scrapen van 9 essays van stefanzweig.nl (WordPress) leken de teksten compleet. Maar na renderen bleken meerdere problemen: onzichtbare tekst door onafgesloten `<strong>` tags, dubbele afbeeldingen, externe image-URLs die 404'd, en WordPress-specifieke HTML-rommel.

**Root Cause:**
WordPress genereert HTML die er in de browser goed uitziet door browser error-correction, maar die als ruwe HTML vol problemen zit. Copy-paste of scraping neemt deze problemen mee.

**Oplossing:**
Bij elke WordPress content-migratie altijd een cleanup pipeline bouwen:
1. Scrape ruwe HTML
2. Clean met regex (lege paragrafen, meta-divs, nav, social tagging)
3. Fix structurele HTML-fouten (onafgesloten tags)
4. Lokaliseer externe assets (download images)
5. Visueel verifiëren in browser

**Detectie:**
Na scraping altijd: open de pagina, scroll door de hele tekst, check of alle content zichtbaar is.

---

### 13. Klantfeedback Meteen Verwerken, Niet Bufferen

**Datum:** 2026-02-09
**Bron:** Stefan Zweig - "ze doen alleen lezingen"
**Categorie:** Klantcommunicatie

**Issue:**
Evenementenpagina toonde Lezingen, Leeskringen en Excursies. Klant zei: "ze doen alleen lezingen". Simpele feedback, maar als dit pas na go-live was ontdekt had het er onprofessioneel uitgezien.

**Root Cause:**
Aannames over scope zonder klantvalidatie. De referentie-site toonde meer activiteiten, maar het Genootschap doet er maar één.

**Oplossing:**
Na elke pagina-oplevering: toon aan klant, vraag "klopt dit?" voordat je doorgaat. Liever 5 minuten feedback-loop dan 2 uur rework.

**Detectie:**
Bij elk project met externe klant: review-moment inplannen per opgeleverde pagina, niet pas aan het eind.

---

## Wanneer Hier vs Specialist?

| Les Type | Waar Documenteren |
|----------|-------------------|
| Technisch (code, API, infra) | Specialist LESSONS-LEARNED.md |
| Proces (hoe we werken) | **Dit bestand** |
| Strategisch (bedrijfsbeslissingen) | **Dit bestand** |
| Cross-domein (raakt meerdere gebieden) | **Dit bestand** + link naar specialisten |

---

*"De organisatie die het snelst leert, wint."*
