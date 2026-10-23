# Inventario — ERS v1.0

## Objetivo y alcance

El módulo controla existencias físicas por empresa, producto, lote, almacén y
ubicación. Mantiene un Kardex inmutable y el costo promedio ponderado global
por producto dentro de cada empresa.

Todas las operaciones se ejecutan en el contexto de la compañía autenticada.
Las relaciones compuestas con `company_id` impiden cruzar productos, compras,
almacenes, ubicaciones y lotes entre tenants.

El corte actual incluye:

- ingreso al inventario desde recepciones verificadas o cerradas;
- creación de lotes y conversión a la unidad base de inventario;
- costo directo o costo definitivo procedente de un retaceo cerrado;
- asignación inicial del lote a ubicaciones;
- consulta de existencias, lotes, Kardex y costo promedio;
- generación de etiquetas PDF y trazabilidad de reimpresiones;
- traslados entre almacenes, descritos en `docs/inventory-transfers.md`.
- ajustes autorizados y reversión de sus movimientos, descritos en
  `docs/inventory-adjustments.md`.

Las ventas, devoluciones y la ubicación de tránsito mediante vehículos todavía
no forman parte del flujo operativo disponible.

## Modelo de datos

### `inventory_lots`

Representa una cantidad recibida de un producto. Cada detalle real de recepción
puede originar un único lote. Conserva la unidad recibida, unidad base, factor de
conversión, cantidades y costo histórico.

El código se genera automáticamente por compañía. La combinación
`(purchase_detail_id, company_id)` es única e impide ingresar dos veces el mismo
detalle de recepción.

Estados definidos:

```text
PENDING | AVAILABLE | DEPLETED | CANCELLED
```

Los lotes creados por el flujo actual quedan `AVAILABLE`.

### `inventory_location_details`

Es el saldo actual de un lote en una ubicación. Existe un único registro por
`(company_id, inventory_lot_id, location_id)`. No sustituye al Kardex: representa
el estado vigente y se actualiza de forma transaccional con sus movimientos.

### `inventory_movements`

Es el historial auditable y cronológico. Registra producto, lote, almacén,
ubicación opcional, entrada, salida, costo, documento de origen y usuario que
confirmó la operación.

Tipos preparados en el esquema:

```text
PURCHASE_RECEIPT
TRANSFER_OUT
TRANSFER_IN
SALE_ISSUE
CUSTOMER_RETURN
ADJUSTMENT_IN
ADJUSTMENT_OUT
REVERSAL
```

En este corte se generan `PURCHASE_RECEIPT`, `TRANSFER_OUT`, `TRANSFER_IN`,
`ADJUSTMENT_IN`, `ADJUSTMENT_OUT` y `REVERSAL`.
Los movimientos confirmados no se editan ni eliminan; las correcciones futuras
se harán mediante movimientos compensatorios.

### `inventory_cost_averages`

Mantiene un resumen valorizado único por `(company_id, product_id)`:

- existencia global;
- valor acumulado;
- costo unitario promedio.

Una entrada aplica:

```text
nueva cantidad = cantidad anterior + cantidad recibida
nuevo valor = valor anterior + costo total de la entrada
nuevo promedio = nuevo valor / nueva cantidad
```

Los traslados internos no modifican estos valores.

### `inventory_label_prints`

Registra cada impresión: lote, cantidad, usuario y fecha. Si ya existió una
impresión para el lote, toda reimpresión exige un motivo. La etiqueta utiliza el
código interno del producto como código de barras y muestra el lote y la fecha
de recepción.

## Ingreso desde una recepción

Solo una compra `VERIFIED` o `CLOSED` puede ingresar. El backend vuelve a leer y
bloquear los datos dentro de una transacción y usa `expectedUpdatedAt` para
detectar cambios concurrentes.

El modo de costeo determina la fuente:

- `DIRECT`: costo neto del detalle de la recepción convertido a la moneda base;
- `LANDED_COST`: costo total del detalle correspondiente en un retaceo `CLOSED`.

Por cada detalle pendiente se ejecutan atómicamente estos pasos:

1. Validar la unidad recibida y convertir la cantidad a la unidad base de venta.
2. Crear el lote con trazabilidad hacia `purchase_details`.
3. Registrar un movimiento `PURCHASE_RECEIPT` en la zona lógica de recepción.
4. Actualizar el costo promedio global del producto.

La ubicación física se asigna después. Al ubicar una cantidad se registra una
salida de la zona de recepción y una entrada en la ubicación seleccionada. La
ubicación debe pertenecer al mismo almacén de la recepción y la suma asignada no
puede exceder la cantidad del lote.

## Consultas

```text
GET  /api/v1/inventory/stock
GET  /api/v1/inventory/kardex
GET  /api/v1/inventory/costs
GET  /api/v1/inventory/lots
GET  /api/v1/inventory/lots/:id
GET  /api/v1/inventory/eligible-receipts
POST /api/v1/inventory/receipts/:purchaseId/post
POST /api/v1/inventory/lots/:id/locations
POST /api/v1/inventory/lots/:id/labels
```

Existencias y Kardex aceptan filtros por sucursal, almacén, ubicación, producto
y lote. Kardex también admite tipo de movimiento y rango de fechas. Los
resultados se paginan con el contrato estándar del proyecto.

## Permisos

```text
inventory.read
inventory.lots_read
inventory.receive
inventory.labels_print
inventory.locations_assign
inventory.kardex_read
inventory.costs_read
```

```text
inventory.adjustments_create
inventory.adjustments_approve
inventory.movements_reverse
```

La API valida permisos independientemente de la visibilidad del menú.

## Invariantes

- Nunca se acepta un identificador perteneciente a otra compañía.
- Un detalle de recepción solo puede originar un lote.
- No se asigna a ubicaciones más cantidad que la disponible en el lote.
- La ubicación inicial pertenece al almacén de la recepción.
- El Kardex se agrega; no se modifica ni elimina.
- Saldos, movimiento y costo promedio se actualizan en una transacción.
- Los traslados no recalculan el costo promedio.

## Pendientes de la v1.0

- ubicación tipo vehículo para mercancía en tránsito;
- integración con salidas de venta y devoluciones aceptadas;
- conciliación administrativa asistida entre saldos y Kardex.

