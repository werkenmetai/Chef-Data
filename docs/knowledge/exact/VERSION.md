# Exact Online Knowledge Base Version

**Beheerder:** Joost (Exact API Specialist)

---

## Huidige Versies

| Component | Versie | Datum |
|-----------|--------|-------|
| REST API | `v1` | 2026-01-28 |
| OAuth 2.0 | `2.0` | 2026-01-28 |
| Refresh Token Validity | `30 dagen` | Sinds juli 2021 |

## Laatste Sync

- **Datum:** 2026-01-31
- **Bron:** support.exactonline.com, start.exactonline.nl
- **Aantal documenten:** 7

## Changelog

### 2026-01-31
- OData Best Practices document toegevoegd (filter, select, expand, API types)
- 5 nieuwe lessons learned gedocumenteerd:
  - Accept header restrictions
  - Prefer header voor POST
  - Synchrone requests verplicht
  - Bulk/Sync API (1000 records/call)
  - Binary data via Base64

### 2026-01-28
- Initiële kennisbase opgebouwd
- 6 Exact Online documenten gescraped
- 4 lessons learned gedocumenteerd
- Test scenarios toegevoegd

## Volgende Check

- **Gepland:** 2026-02-04 (wekelijks)
- **Check op:**
  - Nieuwe API endpoints
  - OAuth wijzigingen
  - Rate limit changes
  - Nieuwe services/modules

## Breaking Changes Log

| Datum | Change | Impact |
|-------|--------|--------|
| Juli 2021 | Refresh token 30 dagen geldig | Token management |
| - | Division scoping in consent | Multi-admin access |

## URLs om te monitoren

1. https://support.exactonline.com/community/s/knowledge-base - Knowledge base updates
2. https://start.exactonline.nl/docs/HlpRestAPIResources.aspx - API reference
3. https://developers.exactonline.com - Developer portal news

## Bekende Limieten

| Limiet | Waarde | Notities |
|--------|--------|----------|
| Rate limit | 60 req/min | Per API key |
| Access token | 10 minuten | Refresh na 9:30 |
| Refresh token | 30 dagen | Herauth nodig na expiry |
| Page size (REST) | 60 | Standaard endpoints |
| Page size (Bulk/Sync) | 1000 | Bulk endpoints |
| Auth code | 3 minuten | Na redirect |
