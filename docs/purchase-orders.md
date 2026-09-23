# Órdenes de compra — Etapa 4

Las órdenes pertenecen siempre a una empresa y se generan desde cantidades adjudicadas no procesadas. Cada orden conserva proveedor, cotización, sucursal y almacén; una restricción única evita reutilizar una adjudicación.

La generación copia las condiciones comerciales y calcula los importes en el backend. Los gastos de cotización se prorratean según la proporción adjudicada y pasan a ser gastos editables de la orden.

Estados iniciales:

```text
DRAFT -> PENDING_APPROVAL -> APPROVED -> SENT
```

La etapa de recepción administrará posteriormente `PARTIALLY_RECEIVED`, `RECEIVED` y `CLOSED`.

Los documentos se almacenarán de forma privada en S3. La base de datos conservará `storageKey`, nombre original, MIME, tamaño y usuario; nunca una URL temporal.
