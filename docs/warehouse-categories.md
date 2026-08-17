# Categorías de almacén

Las categorías de almacén son un catálogo propio de cada empresa. Clasifican el propósito operativo de los almacenes sin mezclar información entre tenants.

## Modelo

La tabla `warehouse_categories` contiene `id`, `company_id`, `code`, `name`, `description`, `is_active`, `created_at` y `updated_at`.

- `code` es una clave técnica estable e inmutable. El backend la genera automáticamente para categorías personalizadas; las categorías aprovisionadas conservan códigos semánticos del sistema.
- `name` es la etiqueta visible y puede actualizarse.
- `description` es opcional.
- La unicidad de código y nombre se aplica dentro de cada empresa.
- Los registros se desactivan; no se eliminan físicamente.
- Todas las consultas y escrituras se acotan por el `companyId` del contexto autenticado.

## Categorías iniciales

Cada empresa recibe: producto terminado, materia prima, repuestos, devoluciones, cuarentena, producción, consignación y tránsito. La migración incorpora estas categorías a empresas existentes y el aprovisionamiento de empresas las crea para las nuevas.

## API y permisos

La API se publica en `/api/v1/warehouse-categories` y ofrece listado, detalle, creación, actualización y cambio de estado. Requiere respectivamente:

- `warehouse_categories.read`
- `warehouse_categories.create`
- `warehouse_categories.update`
- `warehouse_categories.change_status`

Owner y Administrator reciben los cuatro permisos. Operator y Read Only reciben únicamente lectura. Las modificaciones generan eventos de auditoría y registros en el historial de cambios.

Cuando se implemente `warehouses`, una categoría inactiva no podrá asignarse a nuevos almacenes. La desactivación deberá conservar las relaciones históricas existentes.
