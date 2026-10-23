# Ajustes y reversiones de inventario — ERS v1.0

## Propósito

Los ajustes corrigen diferencias justificadas entre la existencia física y el
saldo del sistema. Nunca modifican un movimiento histórico: al aprobarse crean
nuevos asientos de Kardex y actualizan saldos y valoración en una transacción.

## Modelo y estados

`inventory_adjustments` conserva compañía, código automático `AJ-`, almacén,
motivo, responsables y fechas. `inventory_adjustment_details` registra lote,
ubicación, dirección, cantidad y el costo utilizado al aprobar.

```text
DRAFT -> APPROVED
   \----> CANCELLED
```

- `DRAFT`: no afecta existencias y puede cancelarse.
- `APPROVED`: aplicado e inmutable.
- `CANCELLED`: anulado antes de afectar inventario.

La aprobación utiliza `expectedUpdatedAt` para evitar procesamiento concurrente.

## Reglas de aprobación

- El almacén, lote y ubicación pertenecen a la compañía activa.
- La ubicación pertenece al almacén del ajuste.
- El lote debe estar disponible.
- Toda cantidad es positiva.
- Una salida no puede exceder el saldo de la ubicación.
- Ninguna operación puede producir cantidad o valoración global negativa.
- El costo usado es el promedio vigente; si aún no existe, se utiliza el costo
  histórico del lote.
- Una entrada genera `ADJUSTMENT_IN`; una salida genera `ADJUSTMENT_OUT`.

El saldo por ubicación, costo promedio, detalle valorizado y Kardex se actualizan
atómicamente.

## Reversiones

Una reversión crea un movimiento `REVERSAL` con cantidades opuestas y referencia
al movimiento original. El índice único sobre `reversal_of_movement_id` impide
revertir dos veces el mismo asiento.

En este corte solo se revierten `ADJUSTMENT_IN` y `ADJUSTMENT_OUT`. Los ingresos
de compra y traslados tienen documentos compuestos y no deben revertirse como
un asiento aislado. La reversión también verifica el saldo disponible y evita
valores negativos.

## API

```text
GET  /api/v1/inventory-adjustments
GET  /api/v1/inventory-adjustments/:id
POST /api/v1/inventory-adjustments
POST /api/v1/inventory-adjustments/:id/approve
POST /api/v1/inventory-adjustments/:id/cancel
POST /api/v1/inventory-adjustments/movements/:id/reverse
```

## Permisos

```text
inventory.adjustments_create
inventory.adjustments_approve
inventory.movements_reverse
```

Owner y Administrator reciben los tres permisos. Operator puede crear y
cancelar borradores, pero la aprobación y reversión requieren los permisos
explícitos correspondientes.
