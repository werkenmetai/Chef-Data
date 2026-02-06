# Exact Online Test Scenarios

**Beheerder:** Joost (Exact API Specialist)

Dit document bevat bekende edge cases en test scenarios om Exact Online API problemen te herkennen en op te lossen.

---

## Scenario 1: 404 bij ophalen divisions

### Symptomen
- GET /api/v1/{division}/hrm/Divisions returns 404
- User kan wel inloggen maar divisions niet ophalen

### Checklist
1. [ ] Heeft user toegang tot HRM module?
2. [ ] Probeer alternatief endpoint: `/system/Divisions`
3. [ ] Check CurrentDivision in `/current/Me` response
4. [ ] Fallback naar alleen currentDivision

### Oplossing
```typescript
const endpoints = [
  `/api/v1/${division}/hrm/Divisions`,
  `/api/v1/${division}/system/Divisions`,
];
// Try each, fallback to currentDivision from Me endpoint
```

---

## Scenario 2: Access token expired

### Symptomen
- 401 Unauthorized na ~10 minuten
- Requests werkten eerst wel

### Checklist
1. [ ] Is access token ouder dan 10 minuten?
2. [ ] Is refresh token nog geldig (< 30 dagen)?
3. [ ] Wordt token 30 sec voor expiry gerefreshed?

### Token refresh
```
POST https://start.exactonline.nl/api/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
refresh_token={refresh_token}
client_id={client_id}
client_secret={client_secret}
```

---

## Scenario 3: Refresh token expired (30 dagen)

### Symptomen
- Refresh request returns error
- "invalid_grant" error

### Checklist
1. [ ] Is app > 30 dagen niet gebruikt?
2. [ ] Is user nog actief in Exact Online?

### Oplossing
- Gebruiker moet opnieuw autoriseren via OAuth flow
- Geen automatische recovery mogelijk

---

## Scenario 4: Division scope error

### Symptomen
- API returns data voor verkeerde division
- Sommige divisions niet toegankelijk
- 403 Forbidden op bepaalde divisions

### Checklist
1. [ ] Welke divisions heeft user geautoriseerd in consent screen?
2. [ ] Is division parameter correct in URL?
3. [ ] Check `/current/Me` voor toegankelijke divisions

### Test
```bash
# Get current user and divisions
curl -H "Authorization: Bearer {token}" \
  "https://start.exactonline.nl/api/v1/current/Me?\$select=CurrentDivision,DivisionCustomer"
```

---

## Scenario 5: Rate limiting (429)

### Symptomen
- 429 Too Many Requests
- Requests falen na vele calls

### Checklist
1. [ ] Meer dan 60 requests/minuut?
2. [ ] Meerdere clients met zelfde API key?
3. [ ] Batch waar mogelijk

### Oplossing
```typescript
// Exponential backoff
const delays = [1000, 2000, 4000, 8000];
for (const delay of delays) {
  const response = await fetch(url);
  if (response.status !== 429) break;
  await sleep(delay);
}
```

---

## Scenario 6: OData query errors

### Symptomen
- 400 Bad Request op $filter
- Onverwachte resultaten
- Pagination werkt niet

### Checklist
1. [ ] Is $filter syntax correct? (gebruik `eq`, `ne`, `gt`, etc.)
2. [ ] Zijn string values correct gequoted? (`Name eq 'value'`)
3. [ ] Is $select beperkt tot bestaande velden?
4. [ ] Wordt $skiptoken gebruikt voor pagination?

### Voorbeelden
```
# Correct filter syntax
$filter=Name eq 'Test'
$filter=Modified gt datetime'2026-01-01'
$filter=Status eq 'A' and Type eq 1

# Pagination
$skiptoken=guid'{next-page-token}'
```

---

## Scenario 7: Kostenplaatsen/dragers niet zichtbaar

### Symptomen
- Transacties missen cost center info
- CostCenter veld is null

### Checklist
1. [ ] Zijn CostCenter, CostCenterDescription in $select?
2. [ ] Heeft administratie kostenplaatsen ingeschakeld?
3. [ ] Zijn transacties gekoppeld aan kostenplaats?

### Correcte query
```
GET /api/v1/{division}/financialtransaction/TransactionLines
  ?$select=AmountDC,Description,CostCenter,CostCenterDescription,CostUnit,CostUnitDescription
```

---

## Scenario 8: Bulk endpoint vs REST endpoint

### Symptomen
- Sync duurt te lang
- Te veel API calls nodig

### Checklist
1. [ ] Gebruik je bulk/sync endpoints waar beschikbaar?
2. [ ] Page size: REST = 60, Bulk = 1000
3. [ ] Check of sync endpoint beschikbaar is

### Bulk endpoints
```
/api/v1/{division}/bulk/Cashflow/Receivables
/api/v1/{division}/bulk/CRM/Accounts
/api/v1/{division}/sync/Financial/TransactionLines
```

---

## Quick Diagnosis Commands

```bash
# Test OAuth token
curl -H "Authorization: Bearer {token}" \
  "https://start.exactonline.nl/api/v1/current/Me"

# List divisions
curl -H "Authorization: Bearer {token}" \
  "https://start.exactonline.nl/api/v1/{division}/system/Divisions"

# Check API status
curl -H "Authorization: Bearer {token}" \
  "https://start.exactonline.nl/api/v1/{division}/system/SystemHealth"

# Test rate limit (check X-RateLimit headers)
curl -v -H "Authorization: Bearer {token}" \
  "https://start.exactonline.nl/api/v1/{division}/crm/Accounts?\$top=1"
```

---

## Error Code Reference

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| 400 | Bad Request | Check query syntax |
| 401 | Unauthorized | Refresh access token |
| 403 | Forbidden | Check division scope |
| 404 | Not Found | Check endpoint/division |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry later |
