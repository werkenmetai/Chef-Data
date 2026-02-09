# Hosting Advies - Stefan Zweig Genootschap Nederland

**Beheerder:** Dirk (DevOps Lead)
**Laatste update:** 2026-02-09
**Door:** Dirk (devops-lead)
**Status:** Advies ter besluitvorming

---

## Context

Het Stefan Zweig Genootschap Nederland migreert van een verouderde WordPress-site naar een nieuwe statische website (HTML/CSS/JS). De site draait momenteel op stefanzweig.nl bij een WordPress-hoster.

**Randvoorwaarden:**
- Statische site (geen backend, geen database)
- Eigen domein: stefanzweig.nl (DNS overname van huidige WordPress host)
- Contactformulier nodig (momenteel HTML form zonder backend)
- Geen budget (vrijwilligersorganisatie/stichting)
- Eenvoudig beheer voor niet-technisch bestuur

---

## Vergelijking Hosting Platformen

### 1. Netlify (Free Tier)

| Criterium | Beoordeling |
|-----------|-------------|
| **Kosten** | Gratis (100 GB bandbreedte/maand, 300 build-minuten/maand) |
| **Custom domein + SSL** | Ja, automatisch Let's Encrypt SSL |
| **Formulieren** | Netlify Forms ingebouwd (gratis tot 100 submissions/maand) |
| **Deploy workflow** | Git push naar GitHub/GitLab triggert automatische build |
| **CDN/Performance** | Eigen CDN, edge-nodes wereldwijd |
| **Eenvoud beheer** | Drag-and-drop upload mogelijk, web dashboard |

**Voordelen:**
- Netlify Forms: geen externe dienst nodig voor contactformulier
- Alleen `netlify` attribuut op `<form>` tag toevoegen, geen JavaScript nodig
- Spam-filter ingebouwd (honeypot + reCAPTCHA optioneel)
- Form submissions leesbaar in Netlify dashboard
- E-mail notificaties bij nieuwe submissions (gratis)
- Deploy previews bij pull requests
- Eenvoudige rollback via dashboard

**Nadelen:**
- 100 form submissions/maand op gratis tier (ruim voldoende voor een genootschap)
- Bandbreedte limiet 100 GB/maand (ruim voldoende)
- Netlify branding in form-bevestiging (verwijderbaar met eigen redirect)

---

### 2. Cloudflare Pages (Free Tier)

| Criterium | Beoordeling |
|-----------|-------------|
| **Kosten** | Gratis (ongelimiteerde bandbreedte, 500 builds/maand) |
| **Custom domein + SSL** | Ja, automatisch SSL via Cloudflare |
| **Formulieren** | Geen ingebouwde oplossing, externe dienst nodig |
| **Deploy workflow** | Git push naar GitHub/GitLab triggert automatische build |
| **CDN/Performance** | Cloudflare CDN, 300+ edge-locaties, snelste netwerk |
| **Eenvoud beheer** | Cloudflare dashboard, iets technischer dan Netlify |

**Voordelen:**
- Ongelimiteerde bandbreedte (geen limiet)
- Beste CDN-performance wereldwijd (Cloudflare netwerk)
- Ongelimiteerd aantal sites
- Cloudflare DNS is de snelste resolver ter wereld
- Workers integratie mogelijk voor toekomstige uitbreidingen

**Nadelen:**
- Geen ingebouwde formulieroplossing (Formspree of vergelijkbaar nodig)
- Dashboard iets complexer voor niet-technische gebruikers
- Formulieren vereisen een externe gratis dienst (extra account nodig)
- Minder intuitive UI voor simpel sitebeheer

---

### 3. GitHub Pages (Free)

| Criterium | Beoordeling |
|-----------|-------------|
| **Kosten** | Gratis (100 GB bandbreedte/maand, 1 GB opslaglimiet) |
| **Custom domein + SSL** | Ja, automatisch Let's Encrypt SSL |
| **Formulieren** | Geen ingebouwde oplossing, externe dienst nodig |
| **Deploy workflow** | Git push naar `main` branch publiceert automatisch |
| **CDN/Performance** | Fastly CDN, goede performance |
| **Eenvoud beheer** | Alleen via GitHub, geen apart dashboard |

**Voordelen:**
- Absoluut gratis, geen account nodig buiten GitHub
- Directe integratie met repository
- Eenvoudigste setup: push = live
- Goede documentatie

**Nadelen:**
- Geen ingebouwde formulieroplossing
- 1 GB opslaglimiet voor site (kan krap worden met veel afbeeldingen)
- Geen build previews bij pull requests
- Geen server-side redirects (alleen client-side of meta-refresh)
- 10 builds per uur limiet
- Repository moet public zijn voor gratis GitHub Pages (of GitHub Pro)
- Minder flexibel voor toekomstige uitbreidingen

---

## Vergelijking Formulieroplossingen

Het contactformulier is essentieel. Bezoekers moeten het bestuur kunnen bereiken.

| Oplossing | Kosten | Limiet | Spam-filter | E-mail notificatie | Setup |
|-----------|--------|--------|-------------|---------------------|-------|
| **Netlify Forms** | Gratis (bij Netlify hosting) | 100/maand | Ja (honeypot + reCAPTCHA) | Ja | 1 HTML-attribuut |
| **Formspree** | Gratis | 50/maand | Ja (reCAPTCHA) | Ja | Form action URL aanpassen |
| **Getform** | Gratis | 50/maand | Basis | Ja | Form action URL aanpassen |
| **Formsubmit** | Gratis | Ongelimiteerd | Basis (honeypot) | Ja | Form action URL aanpassen |
| **Web3Forms** | Gratis | 250/maand | Ja (hCaptcha) | Ja | Form action URL + access key |

**Formulier-advies:** Als we Netlify kiezen, is Netlify Forms de eenvoudigste en beste keuze: geen externe accounts, geen JavaScript, ingebouwde spam-filter. Bij een ander platform is Formspree of Web3Forms een goed alternatief.

---

## Scorematrix

| Criterium | Gewicht | Netlify | Cloudflare Pages | GitHub Pages |
|-----------|---------|---------|------------------|--------------|
| Gratis hosting | 20% | 10 | 10 | 10 |
| Custom domein + SSL | 15% | 10 | 10 | 10 |
| Formulier afhandeling | 20% | 10 | 5 | 5 |
| Deploy workflow | 15% | 9 | 9 | 8 |
| CDN/Performance | 10% | 8 | 10 | 7 |
| Eenvoud niet-technisch beheer | 20% | 9 | 6 | 5 |
| **Gewogen totaal** | **100%** | **9.35** | **7.90** | **7.30** |

---

## Aanbeveling

### Netlify (Free Tier) -- Aanbevolen

**Netlify is de beste keuze voor het Stefan Zweig Genootschap** om de volgende redenen:

1. **Formulieren zonder gedoe** -- Netlify Forms werkt out-of-the-box. Alleen `netlify` attribuut op de `<form>` tag, klaar. Geen externe diensten, geen extra accounts, geen JavaScript. Submissions komen per e-mail en zijn leesbaar in het dashboard.

2. **Eenvoudigst voor niet-technisch beheer** -- Het Netlify dashboard is intuïtief. Form-submissions bekijken, site status checken, en zelfs handmatig deployen via drag-and-drop van een zip-bestand.

3. **Ruim voldoende voor een genootschap** -- 100 GB bandbreedte en 100 form submissions per maand is meer dan genoeg voor een niche literair genootschap. Zelfs met alle essays en afbeeldingen.

4. **Automatische deploys** -- Push naar GitHub = site is binnen 30 seconden live. Geen handmatige stappen.

5. **Gratis SSL** -- Automatisch HTTPS op het eigen domein stefanzweig.nl.

6. **Rollback mogelijkheid** -- Fout gemaakt? Een klik in het dashboard zet de vorige versie terug.

**Cloudflare Pages** is het beste alternatief als performance de absolute topprioriteit zou zijn, maar het mist ingebouwde formulieroplossing en het dashboard is minder toegankelijk voor het bestuur.

---

## DNS Migratieplan: Van WordPress naar Netlify

### Voorbereiding (voor de migratie)

**Stap 0: Credentials verzamelen**
- [ ] Inloggegevens opvragen voor huidige domeinregistrar/DNS-beheer van stefanzweig.nl
- [ ] Vaststellen wie de domeinregistrar is (Antagonist, TransIP, Versio, etc.)
- [ ] Vaststellen wie de huidige DNS beheert (registrar zelf of WordPress host)
- [ ] Toegang tot e-mail op stefanzweig.nl domein vaststellen (risico bij DNS wijziging)

> **BLOKKADE:** Zonder DNS credentials kan de migratie niet starten. Dit is opgeschaald naar Matthijs om bij het bestuur op te vragen.

**Stap 1: Huidige situatie documenteren**
- [ ] Alle huidige DNS records exporteren/noteren (A, AAAA, CNAME, MX, TXT)
- [ ] Bijzondere aandacht voor MX records (e-mail!)
- [ ] Noteer de huidige TTL waarden
- [ ] Screenshot maken van huidige DNS configuratie

**Stap 2: Netlify account aanmaken**
- [ ] Account aanmaken op netlify.com (gratis, met GitHub login)
- [ ] GitHub repository koppelen aan Netlify
- [ ] Eerste deploy doen en verifiëren op [sitenaam].netlify.app
- [ ] Contactformulier testen op Netlify subdomain
- [ ] E-mail notificatie instellen voor form submissions

**Stap 3: Formulier aanpassen voor Netlify Forms**
- [ ] `netlify` attribuut toevoegen aan `<form>` tag in contact.html
- [ ] Optioneel: honeypot veld toevoegen voor spam-filter
- [ ] Optioneel: eigen success-pagina maken (redirect na verzending)
- [ ] Testen op [sitenaam].netlify.app

### Uitvoering (de migratie zelf)

**Stap 4: Custom domein toevoegen in Netlify**
- [ ] In Netlify dashboard: Site settings > Domain management
- [ ] stefanzweig.nl toevoegen als custom domain
- [ ] www.stefanzweig.nl toevoegen als alias
- [ ] Netlify genereert de benodigde DNS records

**Stap 5: DNS records wijzigen bij registrar**
- [ ] TTL verlagen naar 300 seconden (5 minuten) minimaal 24 uur voor de switch
- [ ] A record wijzigen: `stefanzweig.nl` -> Netlify load balancer IP (104.198.14.52)
- [ ] CNAME record toevoegen: `www.stefanzweig.nl` -> `[sitenaam].netlify.app`
- [ ] MX records BEHOUDEN (niet wijzigen! anders stopt e-mail)
- [ ] TXT records BEHOUDEN (SPF, DKIM, etc.)
- [ ] Eventuele andere bestaande records BEHOUDEN

> **LET OP:** Wijzig ALLEEN de A en CNAME records voor de website. Alle andere records (MX, TXT, SRV) moeten intact blijven om e-mail en andere diensten niet te verstoren.

**Stap 6: SSL activeren**
- [ ] Netlify activeert automatisch Let's Encrypt SSL na DNS propagatie
- [ ] Kan tot 24 uur duren (meestal sneller)
- [ ] Force HTTPS inschakelen in Netlify dashboard

**Stap 7: Verificatie**
- [ ] https://stefanzweig.nl opent de nieuwe site
- [ ] https://www.stefanzweig.nl redirect naar stefanzweig.nl
- [ ] SSL certificaat is geldig (groen slotje)
- [ ] Contactformulier werkt (test-submission)
- [ ] E-mail ontvangst testen (MX records intact)
- [ ] Alle pagina's en essays bereikbaar
- [ ] Afbeeldingen laden correct

### Na de migratie

**Stap 8: Redirects instellen voor oude WordPress URLs**
- [ ] `_redirects` bestand aanmaken in root van de site
- [ ] Oude WordPress URLs (/?p=123, /wp-content/, etc.) redirecten naar nieuwe pagina's
- [ ] 301 redirects voor SEO-behoud

Voorbeeld `_redirects` bestand:
```
# Oude WordPress URLs naar nieuwe pagina's
/wp-content/*    /afbeeldingen/:splat  301
/?p=*            /                      301
/wp-admin        /                      301
/wp-login.php    /                      301

# www naar non-www
https://www.stefanzweig.nl/*  https://stefanzweig.nl/:splat  301!
```

**Stap 9: Monitoring eerste week**
- [ ] Dagelijks checken of site bereikbaar is
- [ ] Form submissions monitoren in Netlify dashboard
- [ ] Google Search Console updaten (als ingesteld)
- [ ] Oude WordPress hosting pas opzeggen na 30 dagen stabiele werking

**Stap 10: WordPress hosting opzeggen**
- [ ] Backup maken van oude WordPress-site (voor archief)
- [ ] Hosting pas opzeggen na minimaal 30 dagen stabiele werking op Netlify
- [ ] Bevestiging dat alle content succesvol is gemigreerd
- [ ] Domeinregistratie behouden (los van hosting!)

---

## Technische Details: Netlify Forms Setup

De enige code-aanpassing die nodig is in `contact.html`:

```html
<!-- VOOR (huidige situatie, formulier doet niets) -->
<form method="POST" action="#">
  <input type="text" name="naam" required>
  <input type="email" name="email" required>
  <textarea name="bericht" required></textarea>
  <button type="submit">Verstuur</button>
</form>

<!-- NA (werkt met Netlify Forms) -->
<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">
  <!-- Honeypot veld (onzichtbaar, vangt spam bots) -->
  <p class="hidden" style="display:none;">
    <label>Niet invullen: <input name="bot-field"></label>
  </p>
  <input type="text" name="naam" required>
  <input type="email" name="email" required>
  <textarea name="bericht" required></textarea>
  <button type="submit">Verstuur</button>
</form>
```

Dat is alles. Geen JavaScript, geen externe diensten, geen API keys.

---

## Tijdlijn

| Week | Activiteit | Wie |
|------|-----------|-----|
| W08 | DNS credentials opvragen bij bestuur | Matthijs |
| W08 | Netlify account + eerste deploy | Dirk |
| W08 | Formulier aanpassen voor Netlify Forms | Daan |
| W08 | Testen op [sitenaam].netlify.app | Roos |
| W09 | DNS switch uitvoeren | Dirk |
| W09 | SSL + verificatie | Dirk |
| W09 | Redirects oude WordPress URLs | Dirk + Bram |
| W09 | Go-live check | Heel team |
| W10+ | Monitoring + oude hosting opzeggen | Dirk |

---

## Risico's

| Risico | Kans | Impact | Mitigatie |
|--------|------|--------|-----------|
| DNS credentials niet beschikbaar | Hoog | Go-live geblokkeerd | Vroegtijdig opvragen, escalatie naar bestuur |
| E-mail stopt na DNS wijziging | Laag | Hoog | MX records niet wijzigen, vooraf documenteren |
| Formulier submissions mislopen | Laag | Medium | Uitvoerig testen op Netlify subdomain voor go-live |
| SSL certificaat vertraagd | Laag | Laag | TTL verlagen, 24-48 uur buffer inplannen |
| Oude WordPress URLs geven 404 | Medium | Medium | Redirect bestand aanmaken voor gangbare paden |

---

## Besluit

**Voorgesteld besluit:** Netlify Free Tier als hostingplatform voor stefanzweig.nl, met Netlify Forms voor het contactformulier.

**Ter goedkeuring door:** Matthijs (CSO) / Bestuur Stefan Zweig Genootschap

---

*Opgesteld door: Dirk (devops-lead) | 2026-02-09*
*Review door: Henk (COO)*
