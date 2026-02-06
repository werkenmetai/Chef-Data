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

## Wanneer Hier vs Specialist?

| Les Type | Waar Documenteren |
|----------|-------------------|
| Technisch (code, API, infra) | Specialist LESSONS-LEARNED.md |
| Proces (hoe we werken) | **Dit bestand** |
| Strategisch (bedrijfsbeslissingen) | **Dit bestand** |
| Cross-domein (raakt meerdere gebieden) | **Dit bestand** + link naar specialisten |

---

*"De organisatie die het snelst leert, wint."*
