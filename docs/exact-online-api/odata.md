# OData Query Options for Exact Online API

Exact Online's REST API supports OData (Open Data Protocol) query options for filtering, sorting, and pagination.

## Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `$filter` | Filter results | `$filter=Name eq 'Acme'` |
| `$select` | Select specific fields | `$select=ID,Name,Code` |
| `$top` | Limit number of results | `$top=100` |
| `$skip` | Skip N results | `$skip=50` |
| `$orderby` | Sort results | `$orderby=Name asc` |
| `$expand` | Include related entities | `$expand=Lines` |

## Filtering ($filter)

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal | `$filter=Code eq 'ACC001'` |
| `ne` | Not equal | `$filter=Status ne 'Inactive'` |
| `gt` | Greater than | `$filter=Amount gt 1000` |
| `ge` | Greater than or equal | `$filter=Amount ge 1000` |
| `lt` | Less than | `$filter=Amount lt 500` |
| `le` | Less than or equal | `$filter=Amount le 500` |

### Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `and` | Logical AND | `$filter=Status eq 'Active' and Amount gt 100` |
| `or` | Logical OR | `$filter=Code eq 'A' or Code eq 'B'` |
| `not` | Logical NOT | `$filter=not(Status eq 'Closed')` |

### String Functions

| Function | Description | Example |
|----------|-------------|---------|
| `startswith` | Starts with | `$filter=startswith(Name, 'Acme')` |
| `endswith` | Ends with | `$filter=endswith(Email, '@acme.com')` |
| `substringof` | Contains | `$filter=substringof('acme', Name)` |

### Date Filtering

Dates must be formatted as: `datetime'YYYY-MM-DDTHH:mm:ss'`

```
$filter=Created gt datetime'2024-01-01T00:00:00'
$filter=Modified ge datetime'2024-06-01' and Modified lt datetime'2024-07-01'
```

### GUID Filtering

GUIDs must be prefixed with `guid`:

```
$filter=ID eq guid'12345678-1234-1234-1234-123456789abc'
$filter=CustomerID eq guid'...'
```

## Selecting Fields ($select)

Reduce response size by selecting only needed fields:

```
GET /api/v1/{division}/crm/Accounts?$select=ID,Code,Name,Email
```

**Response:**
```json
{
  "d": {
    "results": [
      {
        "ID": "guid-here",
        "Code": "ACC001",
        "Name": "Acme Corp",
        "Email": "info@acme.com"
      }
    ]
  }
}
```

## Sorting ($orderby)

Sort by one or more fields:

```
$orderby=Name asc
$orderby=Created desc
$orderby=Name asc, Created desc
```

**Example:**
```
GET /api/v1/{division}/crm/Accounts?$orderby=Name asc
```

## Pagination

### Using $top and $skip

```
GET /api/v1/{division}/crm/Accounts?$top=50&$skip=0   # First 50
GET /api/v1/{division}/crm/Accounts?$top=50&$skip=50  # Next 50
GET /api/v1/{division}/crm/Accounts?$top=50&$skip=100 # Next 50
```

### Using __next

The response includes a `__next` URL for the next page:

```json
{
  "d": {
    "results": [...],
    "__next": "https://start.exactonline.nl/api/v1/123456/crm/Accounts?$skiptoken=guid'abc123'"
  }
}
```

**Pagination Example:**

```typescript
async function getAllAccounts(divisionId: number): Promise<Account[]> {
  const allAccounts: Account[] = [];
  let url = `/api/v1/${divisionId}/crm/Accounts?$top=60`;

  while (url) {
    const response = await fetch(url);
    const data = await response.json();

    allAccounts.push(...data.d.results);

    // Get next page URL
    url = data.d.__next || null;
  }

  return allAccounts;
}
```

## Result Limits

| Endpoint Type | Default Limit | Maximum |
|---------------|---------------|---------|
| Standard | 60 records | 60 |
| Bulk | 1000 records | 1000 |

Use `$top` to explicitly set the limit:

```
$top=60   # Standard max
$top=1000 # Only works for bulk endpoints
```

## Complex Filter Examples

### Multiple Conditions

```
GET /api/v1/{division}/salesinvoice/SalesInvoices
  ?$filter=Status eq 50 and InvoiceDate ge datetime'2024-01-01'
```

### Filter by Related Entity

```
GET /api/v1/{division}/crm/Contacts
  ?$filter=Account eq guid'customer-guid-here'
```

### Search by Name Pattern

```
GET /api/v1/{division}/crm/Accounts
  ?$filter=substringof('consulting', tolower(Name))
```

### Date Range

```
GET /api/v1/{division}/salesinvoice/SalesInvoices
  ?$filter=InvoiceDate ge datetime'2024-01-01' and InvoiceDate lt datetime'2024-02-01'
```

### Filter with Select and Order

```
GET /api/v1/{division}/crm/Accounts
  ?$filter=Status eq 'C'
  &$select=ID,Code,Name,Created
  &$orderby=Created desc
  &$top=100
```

## Expanding Related Entities ($expand)

Some endpoints support expanding related entities:

```
GET /api/v1/{division}/salesinvoice/SalesInvoices
  ?$expand=SalesInvoiceLines
```

**Note:** Not all endpoints support `$expand`. Check the specific endpoint documentation.

## Common Patterns

### Get All Active Customers

```
GET /api/v1/{division}/crm/Accounts
  ?$filter=Status eq 'C' and IsCustomer eq true
  &$select=ID,Code,Name,Email,Phone
  &$orderby=Name
```

### Get Unpaid Invoices

```
GET /api/v1/{division}/salesinvoice/SalesInvoices
  ?$filter=Status ne 50 and AmountDC gt 0
  &$select=InvoiceID,InvoiceNumber,CustomerName,AmountDC,DueDate
  &$orderby=DueDate
```

### Get Recent Transactions

```
GET /api/v1/{division}/financialtransaction/TransactionLines
  ?$filter=Date ge datetime'2024-01-01'
  &$orderby=Date desc
  &$top=1000
```

### Get Items by Group

```
GET /api/v1/{division}/logistics/Items
  ?$filter=ItemGroup eq guid'group-guid-here'
  &$select=ID,Code,Description,SalesPrice
```

## URL Encoding

Remember to URL-encode special characters:

| Character | Encoded |
|-----------|---------|
| Space | `%20` or `+` |
| `'` | `%27` |
| `&` | `%26` |
| `?` | `%3F` |

**Example:**
```
$filter=Name eq 'O%27Brien' // O'Brien
```

## TypeScript Helper

```typescript
class ODataQueryBuilder {
  private filters: string[] = [];
  private selects: string[] = [];
  private orderBy: string[] = [];
  private top: number | null = null;
  private skip: number | null = null;

  filter(condition: string): this {
    this.filters.push(condition);
    return this;
  }

  select(...fields: string[]): this {
    this.selects.push(...fields);
    return this;
  }

  order(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.orderBy.push(`${field} ${direction}`);
    return this;
  }

  limit(n: number): this {
    this.top = n;
    return this;
  }

  offset(n: number): this {
    this.skip = n;
    return this;
  }

  build(): string {
    const params: string[] = [];

    if (this.filters.length > 0) {
      params.push(`$filter=${this.filters.join(' and ')}`);
    }

    if (this.selects.length > 0) {
      params.push(`$select=${this.selects.join(',')}`);
    }

    if (this.orderBy.length > 0) {
      params.push(`$orderby=${this.orderBy.join(',')}`);
    }

    if (this.top !== null) {
      params.push(`$top=${this.top}`);
    }

    if (this.skip !== null) {
      params.push(`$skip=${this.skip}`);
    }

    return params.length > 0 ? `?${params.join('&')}` : '';
  }
}

// Usage
const query = new ODataQueryBuilder()
  .filter("Status eq 'C'")
  .filter("IsCustomer eq true")
  .select('ID', 'Code', 'Name')
  .order('Name', 'asc')
  .limit(100)
  .build();

// Result: ?$filter=Status eq 'C' and IsCustomer eq true&$select=ID,Code,Name&$orderby=Name asc&$top=100
```

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid filter` | Syntax error in $filter | Check operator syntax |
| `Property not found` | Unknown field name | Verify field exists for entity |
| `Invalid GUID` | Missing `guid` prefix | Use `guid'...'` format |
| `Invalid datetime` | Wrong date format | Use `datetime'YYYY-MM-DD'` |

### Debugging Tips

1. Test queries in browser first
2. Start simple, add complexity gradually
3. Check field names are exact (case-sensitive)
4. Verify GUID and datetime formatting
