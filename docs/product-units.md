# Company product units

`product_units` contains the commercial purchase and sale presentations owned
by each company. It complements rather than replaces the global
`measurement_units` dictionary.

Examples:

| Commercial name | Type     | Global measurement unit |
| --------------- | -------- | ----------------------- |
| Caja de 24      | PURCHASE | OTRA (MH 99)            |
| Saco de 50 kg   | PURCHASE | KILOGRAMO (MH 34)       |
| Unidad          | SALE     | UNIDAD (MH 59)          |

Each record has an automatic `PUN-######` code scoped to its company. Names are
unique within `(company, type)`, so a company may define “Unidad” separately
for purchase and sale. Only active global measurement units may be assigned.

The eventual product will reference one active `PURCHASE` record and one active
`SALE` record from the same company. Its `purchase_to_sale_factor` will hold the
product-specific conversion; conversion does not belong in this catalog.

## API and permissions

```text
GET|POST /api/v1/product-units
GET|PUT /api/v1/product-units/:id
PATCH /api/v1/product-units/:id/status
```

Permissions use `product_units.read`, `create`, `update`, and `change_status`.
Writes use optimistic concurrency, audit events, and entity-change snapshots.
There is no physical deletion endpoint.
