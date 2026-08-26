# Productos

El catálogo de productos es privado por empresa y se expone en `/api/v1/products`. La primera versión cubre información comercial, clasificación y unidades; las imágenes se incorporan en un corte separado sobre el servicio S3 ya configurado.

## Modelo

- `uuid`: identificador público estable.
- `internalCode`: código automático `PRD-######`, único por empresa. No se solicita al usuario.
- `sku`: opcional y único por empresa cuando tiene valor.
- `originalCode`: código opcional del fabricante o proveedor.
- `productCategoryId`: referencia a una subcategoría hoja activa. La categoría principal se deriva de su padre y no se duplica en `products`.
- `brandId`: marca activa opcional de la misma empresa.
- `purchaseUnitId` y `saleUnitId`: unidades comerciales activas de la misma empresa y de tipo `PURCHASE` y `SALE`, respectivamente.
- `purchaseToSaleFactor`: cantidad positiva de unidades de venta contenidas en una unidad de compra; se almacena como `DECIMAL(18,6)`.
- `size`, `dimensions`, `presentation` y `description`: atributos descriptivos opcionales.
- `isActive`: baja lógica; no existe eliminación física en la API.

Todas las claves de catálogos controlados por empresa usan relaciones compuestas con `company_id`, por lo que la base de datos también impide referencias cruzadas entre tenants.

## API y permisos

- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products`
- `PUT /api/v1/products/:id`
- `PATCH /api/v1/products/:id/status`

Permisos: `products.read`, `products.create`, `products.update` y `products.change_status`. Owner y Administrator reciben gestión completa; Operator y Read Only reciben lectura.

Los cambios generan eventos de auditoría `PRODUCT.CREATED`, `PRODUCT.UPDATED` y `PRODUCT.STATUS_CHANGED`, además del historial de valores de la entidad. Las actualizaciones requieren `expectedUpdatedAt` para prevenir sobrescrituras concurrentes.
