# Company product dictionaries

Brands and product categories are company-owned catalogs. Their migration is
strictly additive: it creates `brands` and `product_categories` without
changing existing tables or data.

Brands receive automatic `MAR-######` codes per company. Categories and
subcategories share one hierarchical table and receive automatic `CAT-######`
codes. A null `parent_category_id` identifies a root category; a non-null value
identifies a subcategory. The current business rule permits exactly two levels.

Database constraints prevent cross-company parent relationships and duplicate
normalized names among siblings. `parent_scope_id` and `name_key` are internal
integrity fields, maintained transactionally by the service, and are never
accepted from API clients.

The APIs are:

```text
GET|POST /api/v1/brands
GET|PUT /api/v1/brands/:id
PATCH /api/v1/brands/:id/status

GET|POST /api/v1/product-categories
GET|PUT /api/v1/product-categories/:id
PATCH /api/v1/product-categories/:id/status
```

All operations require an active company context and the corresponding
`brands.*` or `product_categories.*` permission. Writes use `expectedUpdatedAt`
for optimistic concurrency and create both audit events and entity-change
snapshots. Categories with active children cannot be deactivated, and a
category with children cannot be converted into a subcategory.

Future products should reference `(brand_id, company_id)` and
`(product_category_id, company_id)` so the database enforces tenant ownership.
