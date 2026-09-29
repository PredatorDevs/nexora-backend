# Solicitudes de compra — Etapa 1

## Objetivo

La solicitud de compra registra una necesidad interna de abastecimiento antes de contactar proveedores. Pertenece siempre a una empresa, indica la sucursal y el almacén de destino, conserva al usuario solicitante y contiene una o más líneas de producto.

## Modelo

- `purchase_requests`: cabecera, código automático `PR-000001` por empresa, destino, fechas, justificación, estado y trazabilidad de aprobación, rechazo o cancelación.
- `purchase_request_details`: líneas numeradas con producto, unidad de compra, cantidad decimal, descripción y notas.
- Todas las relaciones de negocio incluyen `company_id`; las claves foráneas compuestas impiden referencias cruzadas entre tenants.
- Cada producto solo puede aparecer una vez por solicitud con una combinación producto/unidad.
- La unidad debe ser la unidad de compra activa configurada en el producto.

## Flujo de estados

```text
DRAFT ──submit──> SUBMITTED ──approve──> APPROVED
                       └──────reject───> REJECTED
DRAFT | SUBMITTED | APPROVED ──cancel──> CANCELLED
```

`IN_QUOTATION` y `COMPLETED` están reservados para las etapas posteriores. No pueden seleccionarse manualmente desde esta etapa.

Solo un borrador puede modificarse. Las transiciones son endpoints independientes y usan `expectedUpdatedAt` para control de concurrencia optimista.

## API

- `GET /api/v1/purchase-requests`
- `GET /api/v1/purchase-requests/:id`
- `POST /api/v1/purchase-requests`
- `PUT /api/v1/purchase-requests/:id`
- `POST /api/v1/purchase-requests/:id/submit`
- `POST /api/v1/purchase-requests/:id/approve`
- `POST /api/v1/purchase-requests/:id/reject`
- `POST /api/v1/purchase-requests/:id/cancel`

Rechazar y cancelar requieren `reason`. Crear y actualizar reemplazan el agregado completo dentro de una transacción.

## Permisos

- `purchase_requests.read`
- `purchase_requests.create`
- `purchase_requests.update`
- `purchase_requests.submit`
- `purchase_requests.approve`
- `purchase_requests.reject`
- `purchase_requests.cancel`

Owner y Administrator reciben todos. Operator recibe lectura, creación, edición y envío. Read Only recibe únicamente lectura.

## Reglas principales

- Empresa, sucursal, almacén, productos y unidades deben estar activos.
- El almacén debe pertenecer a la sucursal elegida.
- La fecha requerida no puede estar en el pasado.
- Debe existir al menos una línea con cantidad mayor que cero.
- El solicitante se toma del usuario autenticado; no se acepta desde el cliente.
- Los eventos relevantes se registran tanto en auditoría operacional como en historial de cambios.

## Consolidación de solicitudes

Las solicitudes creadas manualmente son de tipo `STANDARD`. Dos o más solicitudes
individuales aprobadas y todavía no consolidadas pueden convertirse mediante
`POST /api/v1/purchase-requests/consolidate` en una solicitud de tipo
`CONSOLIDATED`.

La operación es atómica y aplica estas reglas:

- Solo acepta solicitudes `STANDARD` en estado `APPROVED` de la empresa activa.
- La consolidación toma cada solicitud de origen completa; no admite consolidación parcial.
- El usuario elige la sucursal y el almacén de destino de la solicitud consolidada.
- Las líneas con la misma combinación producto/unidad se agrupan y sus cantidades se suman.
- Se conserva la relación exacta entre cada línea consolidada y sus líneas de origen.
- La nueva solicitud nace en `DRAFT` y debe recorrer envío y aprobación normalmente.
- Las solicitudes de origen pasan a `CONSOLIDATED`, quedan vinculadas a la nueva solicitud y ya no son editables ni cotizables.
- Solo las solicitudes de tipo `CONSOLIDATED` pueden vincularse posteriormente a cotizaciones.

El listado permite filtrar por rango de fecha, estado, tipo y situación de
consolidación. “Consolidadas” incluye tanto las solicitudes individuales ya
absorbidas como las solicitudes maestras generadas; “no consolidadas” muestra
únicamente solicitudes individuales todavía disponibles. El permiso específico para ejecutar la operación es
`purchase_requests.consolidate`; se asigna inicialmente a Owner y Administrator.
