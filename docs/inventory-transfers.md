# Traslados de inventario — ERS v1.0

## Objetivo

Un traslado mueve cantidades existentes de uno o varios lotes entre almacenes
de la misma compañía sin alterar el costo promedio global. Conserva lote,
cantidad y costo histórico desde el despacho hasta la recepción.

## Modelo

`inventory_transfers` almacena encabezado, código automático, almacenes,
estado, notas, responsables y fechas. `inventory_transfer_details` contiene
lote, ubicaciones, cantidad y el snapshot del costo por línea.

Las relaciones compuestas por `company_id` garantizan aislamiento multiempresa.
El almacén origen debe ser distinto del destino. Esta regla se valida en la
aplicación porque MySQL no permite el `CHECK` equivalente sobre columnas que
participan en las claves foráneas con las acciones configuradas.

## Estados y transiciones

```text
PREPARATION -> IN_TRANSIT -> RECEIVED
                  |  \------> INCIDENT -> RECEIVED
                  |
PREPARATION ------+-------> CANCELLED
```

- `PREPARATION`: documento creado; todavía no cambia existencias.
- `IN_TRANSIT`: se descontó físicamente del origen.
- `INCIDENT`: mercancía despachada con una incidencia pendiente.
- `RECEIVED`: se incorporó a las ubicaciones destino.
- `CANCELLED`: borrador cancelado antes del despacho.

Cancelar solo está permitido en `PREPARATION`. Un traslado despachado no puede
cancelarse porque ya posee movimientos históricos; su corrección requerirá el
flujo futuro de reversión o ajuste.

Todas las transiciones reciben `expectedUpdatedAt` para aplicar concurrencia
optimista.

## Creación

Cada línea indica:

- lote;
- ubicación origen;
- ubicación destino;
- cantidad;
- notas opcionales.

El backend comprueba que:

- ambos almacenes existen, están activos y pertenecen a la compañía;
- la ubicación origen pertenece al almacén origen;
- la ubicación destino pertenece al almacén destino;
- el lote está disponible;
- el saldo acumulado solicitado no supera la existencia origen;
- no se repite la misma combinación de lote y ubicaciones.

Crear el documento no reserva ni descuenta stock. La disponibilidad se vuelve a
validar durante el despacho para evitar existencias negativas ante operaciones
concurrentes.

## Despacho y recepción

El despacho descuenta cada saldo origen y crea un movimiento `TRANSFER_OUT`.
Todo ocurre dentro de una transacción; si una línea no dispone de existencias,
no se procesa ninguna.

La recepción incrementa cada saldo destino y crea un movimiento `TRANSFER_IN`
por la misma cantidad y costo. No crea otro lote ni modifica
`inventory_cost_averages`.

Durante `IN_TRANSIT` la mercancía ya no figura disponible en el origen y todavía
no figura en el destino. El estado del traslado conserva su trazabilidad. La
ubicación física tipo vehículo solicitada por la ERS queda pendiente hasta la
integración del módulo de flota.

## API

```text
GET  /api/v1/inventory-transfers
GET  /api/v1/inventory-transfers/:id
POST /api/v1/inventory-transfers
POST /api/v1/inventory-transfers/:id/dispatch
POST /api/v1/inventory-transfers/:id/receive
POST /api/v1/inventory-transfers/:id/incident
POST /api/v1/inventory-transfers/:id/cancel
```

El listado acepta búsqueda, estado, almacén origen, almacén destino, orden y
paginación.

## Permisos

```text
inventory.read
inventory.transfers_create
inventory.transfers_dispatch
inventory.transfers_receive
inventory.transfers_cancel
```

Registrar una incidencia utiliza el permiso de recepción porque forma parte de
la custodia y aceptación de mercancía en tránsito.

## Limitaciones actuales

- No cubre reubicaciones dentro del mismo almacén.
- No asigna la existencia a una ubicación tipo vehículo.
- No permite recepción parcial de una línea de traslado.
- Una incidencia se registra a nivel de encabezado, no por línea.
- Los traslados despachados se corrigen mediante los futuros ajustes o
  movimientos compensatorios.

