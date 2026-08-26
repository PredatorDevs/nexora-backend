# Ubicaciones físicas

`Location` identifica una posición física dentro de un almacén. Pertenece directamente a una empresa y utiliza una relación compuesta con el almacén para impedir referencias entre tenants.

## Identidad y coordenadas

El backend genera un código estable `LOC-000001` mediante una secuencia independiente por almacén. El código nunca se recibe desde el formulario, no cambia cuando se reorganizan las coordenadas y no se reutiliza.

Pasillo, estante, nivel y posición son cadenas obligatorias, se normalizan a mayúsculas y su combinación es única dentro del almacén. La interfaz presenta estas coordenadas como referencia física legible.

El símbolo utilizado para presentar la referencia física se configura en el almacén mediante `locationSeparator`. No forma parte de la identidad de la ubicación: cambiarlo solo altera su visualización y nunca sus coordenadas almacenadas.

## Capacidad

`capacity` utiliza `DECIMAL(18,4)` y `capacityUnit` admite `UNITS`, `KG`, `M3` y `PALLETS`. Ambos son opcionales, pero deben informarse juntos y la capacidad debe ser mayor que cero. Inicialmente son datos operativos; no bloquean movimientos hasta que exista conversión formal de unidades de producto.

## Ciclo de vida

- La empresa y el almacén deben estar activos para crear o reactivar ubicaciones.
- Una ubicación no se mueve entre almacenes; `warehouseId` es inmutable después de crearla.
- No existe eliminación física.
- Al implementar inventario, se rechazará la desactivación con existencias y la modificación de coordenadas con historial operativo.
- Todas las mutaciones generan auditoría e historial de cambios.

La API `/api/v1/locations` utiliza `locations.read`, `locations.create`, `locations.update` y `locations.change_status`.

## Creación múltiple

`POST /api/v1/locations/bulk` conserva el mismo permiso `locations.create` y crea una cuadrícula completa dentro de un estante. Recibe el almacén, pasillo, estante, `levelCount` y `positionsPerLevel`; capacidad, unidad y observaciones son opcionales y se comparten entre todas las ubicaciones.

Los niveles y posiciones se generan como números consecutivos iniciando en `1`. Por ejemplo, cuatro niveles con seis posiciones crean 24 coordenadas desde `1/1` hasta `4/6`. La operación:

- admite como máximo 200 ubicaciones;
- valida anticipadamente que ninguna coordenada exista;
- reserva en bloque códigos consecutivos de la secuencia del almacén;
- se ejecuta con aislamiento serializable y crea todas las ubicaciones o ninguna;
- registra un evento `LOCATION.BULK_CREATED` y el historial de cada ubicación generada.

La creación y edición individual permanecen disponibles sin cambios.
