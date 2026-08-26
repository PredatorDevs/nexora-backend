# Almacenes

`Warehouse` representa un espacio de almacenamiento de una sucursal y pertenece directamente a una empresa. Es la raíz inmediata de las futuras ubicaciones físicas, existencias y movimientos de inventario.

## Contrato

- `companyId` fija el tenant y nunca se recibe desde el cuerpo de la solicitud.
- `branchId` y `warehouseCategoryId` deben pertenecer a la misma empresa.
- `code` se genera automáticamente con formato `WH-000001`, es único dentro de la empresa e inmutable.
- `name` es obligatorio y único dentro de la sucursal, incluso para registros inactivos.
- `description` es opcional.
- `locationSeparator` configura la representación de las coordenadas de sus ubicaciones. Admite `/`, `-`, `.`, `|` y `·`; su valor predeterminado es `/` para conservar la presentación de almacenes existentes.
- `isActive` implementa desactivación lógica; no existe eliminación física.
- La empresa, sucursal y categoría deben estar activas al crear un almacén o al asignar nuevas referencias.

Las claves foráneas compuestas `(branch_id, company_id)` y `(warehouse_category_id, company_id)` hacen imposible asociar datos pertenecientes a tenants distintos.

Cambiar el separador no modifica las coordenadas ni los códigos de las ubicaciones. Es una preferencia visual del almacén y se aplica tanto al listado como a las vistas previas de creación.

## API y permisos

La API `/api/v1/warehouses` ofrece listado por sucursal o categoría, detalle, creación, actualización y cambio de estado mediante `warehouses.read`, `warehouses.create`, `warehouses.update` y `warehouses.change_status`.

Owner y Administrator reciben mantenimiento completo. Operator y Read Only reciben lectura. Cada mutación registra auditoría e historial de cambios dentro de la transacción de negocio.

Cuando existan ubicaciones e inventario, cambiar la sucursal o desactivar el almacén deberá rechazarse si existen ubicaciones, existencias o procesos pendientes asociados.
