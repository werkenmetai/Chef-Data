# Exact Online OData Best Practices

**Bron:** Exact Online Support - OData documentation
**Datum:** 2026-01-31
**Scraped door:** Piet (orchestrator) voor Joost (Exact specialist)

---

## OData Efficiënt Integreren

OData biedt vele manieren om data te identificeren, selecteren en filteren voor high-performing integraties. Het protocol werkt bovenop HTTP en maakt data-uitwisseling via URIs mogelijk.

**Referentie:** [OData Version 2.0](http://www.odata.org/documentation/odata-version-2-0/)

---

## Query String Options

### $select

Specificeer welke properties je wilt ontvangen:

```
GET: .../api/v1/{division}/purchaseentry/PurchaseEntries?$select=EntryID,Description,AmountFC,DueDate
```

**WAARSCHUWING:** Gebruik NOOIT `$select=*` - dit genereert alle properties en is inefficiënt.

### $filter

Voeg selectiecriteria toe bij ophalen:

```
GET: .../api/v1/{division}/purchaseentry/PurchaseEntries?$filter=AmountFC ge -8500&$select=EntryID,Description,AmountFC,DueDate
```

**Let op:** Filteren op navigation properties wordt NIET ondersteund:
```
?$filter=PurchaseEntryLines/AmountFC ge -8500  // NIET ONDERSTEUND
```

### $expand

Expandeer collecties binnen een entiteit:

```
GET: .../api/v1/{division}/purchaseentry/PurchaseEntries?$expand=PurchaseEntryLines&$select=EntryID,Description,AmountFC,DueDate
```

**Let op:** $filter op expanded lists wordt NIET ondersteund.

### $count en $inlinecount

Bepaal het aantal records:

```
// Alleen count (geen response body, geen Accept header nodig)
GET: .../api/v1/{division}/purchaseentry/PurchaseEntries/$count

// Count in response met '__count' property
GET: .../api/v1/{division}/purchaseentry/PurchaseEntries?$top=5&$inlinecount=allpages&$select=EntryNumber,AmountFC
```

---

## Primitive Data Types

### Edm.Guid

GUIDs vereisen een `guid` prefix:

```
guid'12345678-aaaa-bbbb-cccc-ddddeeeeffff'
```

### Edm.DateTime

DateTime objecten worden geretourneerd als epoch timestamp (Unix time) door WCF beperkingen. Bij queries moet je het OData DateTime formaat gebruiken:

```
datetime'2000-12-12T12:00'
```

**Conversie voorbeeld (C#):**
```csharp
DateTimeOffset dateTimeOffset = DateTimeOffset.FromUnixTimeSeconds({epoch_timestamp});
```

### Edm.Binary

Binary objecten (PDF, afbeeldingen) moeten als Base64 encoded string worden verstuurd:

```csharp
public string EncodeStringToBase64(string stringToEncode)
{
    return Convert.ToBase64String(Encoding.UTF8.GetBytes(stringToEncode));
}
```

Bij ophalen wordt meestal een link geretourneerd:

```
GET: .../docs/SysAttachment.aspx?ID=12345678-aaaa-bbbb-cccc-ddddeeeeffff
```

---

## Header Types

| Key | Value | Beschrijving |
|-----|-------|--------------|
| Accept | `application/atom+xml` | XML response (default) |
| Accept | `application/json` | JSON response |
| Content-Type | `application/json` | JSON payload |
| Prefer | `return=representation` | **Custom Exact header** - Retourneer alle properties na POST |

**WAARSCHUWING:** `application/xml` wordt NIET geaccepteerd!

---

## Best Practices

### Synchrone Requests Verplicht

Parallel requests kunnen duplicaten of missende records opleveren:

> "Messages are queued in a random order if you initiate parallel requests. This means that the data integrity cannot be guaranteed."

**Correcte aanpak:** Gebruik de `__next` property voor paginering:

```json
{
  "d": {
    "results": [...],
    "__next": "../api/v1/{division}/financial/GLAccounts?$select=Code,Description&$skiptoken=guid'...'"
  }
}
```

### Webhooks voor Real-time Updates

Gebruik webhooks voor real-time data updates in plaats van grote batch requests.

---

## API Types voor Efficiëntie

| Type | Records/call | Use Case | Vereisten |
|------|--------------|----------|-----------|
| Regular | 60 | CRUD operaties | - |
| Bulk | 1000 | Initiële sync | `$select` verplicht |
| Sync | 1000 | Delta updates | Timestamp parameter |
| Deleted | - | Verwijderde records | - |

### Bulk API

```
GET: .../api/v1/{division}/bulk/crm/Accounts?$select=ID,Name,Code
```

### Sync API

Gebaseerd op row versioning - betrouwbaarder dan modified date:

```
GET: .../api/v1/{division}/sync/crm/Accounts?timestamp={stored_timestamp}
```

### Deleted API

Gebruik samen met Sync API om verwijderde records te detecteren.

---

## Samenvatting Filter Syntax

| Filter | Voorbeeld | Werkt? |
|--------|-----------|--------|
| Veld vs constante | `Amount gt 100` | ✅ |
| Veld vs string | `Status eq 'C'` | ✅ |
| Veld vs boolean | `Blocked eq false` | ✅ |
| Veld vs GUID | `ID eq guid'...'` | ✅ |
| Veld vs DateTime | `Date ge datetime'2026-01-01T00:00'` | ✅ |
| Veld vs veld | `Amount ne Outstanding` | ❌ |
| Navigation property | `Lines/Amount gt 0` | ❌ |

---

*Gescraped van Exact Online Support documentatie - januari 2026*
