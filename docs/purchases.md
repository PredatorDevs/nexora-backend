# Compras y recepciones — Etapa 5

`purchases` representa lo realmente recibido contra una orden de compra. Toda
compra pertenece a una compañía y conserva como snapshot el proveedor, destino,
moneda, tipo de cambio, factura y totales aplicables en el momento de recibir.

Una orden puede originar varias compras para soportar entregas parciales. Cada
línea de `purchase_details` referencia exactamente una línea de la orden y
conserva `quantity_ordered` junto con `quantity_received` para trazabilidad.

## Estados

```text
DRAFT -> RECEIVED -> VERIFIED -> CLOSED
   \-> CANCELLED
```

- Solo `DRAFT` será editable o cancelable.
- Confirmar como `RECEIVED` vuelve inmutable la recepción.
- `VERIFIED` representa la revisión documental y cuantitativa.
- `CLOSED` finaliza el proceso administrativo.

## Reglas de cantidad

Para cada detalle de orden:

```text
pending = ordered - SUM(received in non-cancelled purchases)
0 < new receipt <= pending
```

La creación o confirmación debe comprobar esta regla y actualizar la orden en
una sola transacción. Si todavía queda alguna cantidad pendiente, la orden pasa
a `PARTIALLY_RECEIVED`; cuando todas sus líneas quedan satisfechas pasa a
`RECEIVED`.

## Factura y totales

La factura puede permanecer vacía durante el borrador. Cuando exista, la
combinación compañía, proveedor y número de factura es única. Los importes de
detalle usan `grossAmount`, `discountRate`, `discountAmount`, `subtotal`,
`taxRate`, `taxAmount` y `total`; los totales de cabecera se calculan en backend.

## Inventario y retaceo

La recepción confirmada deja preparados los datos para crear movimientos de
inventario, pero la distribución física entre ubicaciones se modelará mediante
movimientos o asignaciones independientes: una línea puede distribuirse entre
varias ubicaciones. El retaceo se relacionará con la compra real y utilizará
únicamente cantidades efectivamente recibidas.

## Permisos

```text
purchases.read
purchases.create
purchases.update
purchases.receive
purchases.verify
purchases.close
purchases.cancel
```

## API inicial

```text
GET  /api/v1/purchases
GET  /api/v1/purchases/:id
GET  /api/v1/purchases/orders/:orderId/availability
POST /api/v1/purchases
PUT  /api/v1/purchases/:id
POST /api/v1/purchases/:id/receive
POST /api/v1/purchases/:id/verify
POST /api/v1/purchases/:id/close
POST /api/v1/purchases/:id/cancel
```

Las escrituras reciben `expectedOrderUpdatedAt`; las ediciones y confirmaciones
también reciben `expectedUpdatedAt` de la compra. Estos valores implementan
control de concurrencia optimista. Crear o editar un borrador reserva sus
cantidades; confirmar vuelve a comprobarlas contra recepciones confirmadas.

El cliente únicamente envía la línea de orden y cantidad recibida. Productos,
unidades, precios, descuentos, impuestos, destino, proveedor y moneda se copian
o calculan en el backend desde la orden autorizada.

Cancelar está permitido únicamente para borradores y libera su reserva. Una
recepción confirmada no se cancela ni modifica: una reversión futura deberá
producir un movimiento compensatorio de inventario. Verificar requiere estado
`RECEIVED`, y cerrar requiere estado `VERIFIED`.
