# Órdenes de compra — Etapa 4

Las órdenes pertenecen siempre a una empresa y se generan desde cantidades adjudicadas no procesadas. Cada orden conserva proveedor, cotización, sucursal y almacén; una restricción única evita reutilizar una adjudicación.

La generación copia las condiciones comerciales y calcula los importes en el backend. Los gastos de cotización se prorratean según la proporción adjudicada y pasan a ser gastos editables de la orden.

Estados iniciales:

```text
DRAFT -> PENDING_APPROVAL -> APPROVED -> SENT
```

La etapa de recepción administrará posteriormente `PARTIALLY_RECEIVED`, `RECEIVED` y `CLOSED`.

Los gastos pueden crearse, editarse y eliminarse mientras la orden se encuentre
en `DRAFT` o `PENDING_APPROVAL`. Cada cambio recalcula en una sola transacción
`additionalExpenses` y `total`; una vez aprobada la orden quedan congelados.
Un gasto con documentos no puede eliminarse hasta retirar primero su evidencia.

Los documentos se almacenan de forma privada en S3. La base de datos conserva
`storageKey`, nombre original, MIME, tamaño y usuario; nunca una URL temporal.
Se admiten PDF, JPEG, PNG y WebP. La API comprueba en S3 que el archivo existe,
que corresponde a la empresa/orden/gasto y que respeta MIME y tamaño antes de
registrarlo. Las descargas utilizan enlaces firmados temporales.

Las mutaciones y transiciones generan tanto bitácora operativa como historial
de cambios del agregado de la orden, incluidos gastos y documentos.
