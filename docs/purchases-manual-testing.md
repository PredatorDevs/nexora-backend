# Guía de pruebas manuales — Compras y recepciones (Etapa 5)

## Objetivo

Validar el flujo completo de recepción de mercancía contra órdenes autorizadas,
incluyendo recepciones parciales, reservas de borradores, estados, permisos,
aislamiento por empresa y protección contra concurrencia.

Esta guía asume que la migración `20260923000000_purchases` fue aplicada y que
se ejecutó nuevamente `npm run prisma:seed`.

## Preparación

### Servicios

1. Iniciar backend y frontend.
2. Iniciar sesión y seleccionar una empresa.
3. Si los permisos fueron asignados durante la sesión actual, cambiar al
   contexto de plataforma y volver a la empresa, o iniciar sesión nuevamente.

### Datos mínimos

Preparar:

- Una sucursal activa.
- Un almacén activo perteneciente a esa sucursal.
- Un proveedor activo.
- Dos productos activos con unidades de compra activas.
- Una solicitud de compra aprobada.
- Una cotización seleccionada.
- Una orden de compra en estado `SENT` con al menos dos líneas.

Ejemplo recomendado:

| Producto | Cantidad ordenada | Precio | Descuento | IVA |
|---|---:|---:|---:|---:|
| Producto A | 100 | 10.00 | 0 % | 13 % |
| Producto B | 50 | 20.00 | 5 % | 13 % |

Anotar el código de orden, las cantidades y su `updatedAt` si se inspeccionará
la API.

## Evidencia a conservar

Para cada inconsistencia registrar:

- Caso y paso donde ocurrió.
- Empresa y usuario utilizados.
- Código de orden y código de compra.
- Resultado esperado y resultado obtenido.
- Captura de pantalla.
- Request y response de DevTools > Network.
- Código HTTP.
- `meta.requestId` de la respuesta.
- Log del backend asociado al mismo request ID.

No compartir tokens, contraseñas ni credenciales de AWS.

## 1. Acceso y permisos

### 1.1 Usuario con lectura

1. Asignar únicamente `purchases.read` a un rol de prueba.
2. Ingresar a la empresa con un usuario que tenga ese rol.
3. Abrir **Recepciones de compra**.

Resultado esperado:

- La opción aparece en el menú.
- El listado y los previews son accesibles.
- No aparece **Nueva recepción**.
- No aparecen botones para editar, recibir, verificar, cerrar o cancelar.

### 1.2 Usuario sin lectura

1. Retirar `purchases.read`.
2. Refrescar el contexto de empresa.
3. Intentar navegar directamente a `/purchases`.

Resultado esperado:

- La opción no aparece en el menú.
- La ruta directa es rechazada por autorización.

### 1.3 Permisos por acción

Verificar individualmente:

| Permiso | Acción esperada |
|---|---|
| `purchases.create` | Mostrar **Nueva recepción** |
| `purchases.update` | Editar borradores |
| `purchases.receive` | Confirmar recepción |
| `purchases.verify` | Verificar compras recibidas |
| `purchases.close` | Cerrar compras verificadas |
| `purchases.cancel` | Cancelar borradores |

La ausencia de un botón no sustituye la seguridad del backend. Si es posible,
repetir una petición guardada sin el permiso y comprobar respuesta `403`.

## 2. Creación de borrador

1. Pulsar **Nueva recepción**.
2. Seleccionar una orden `SENT`.
3. Confirmar que se muestran proveedor, sucursal, almacén y moneda correctos.
4. Verificar las columnas **Ordenado**, **Reservado** y **Disponible**.
5. Ingresar cantidades parciales para una o más líneas.
6. Agregar fecha de recepción, factura, fecha de factura y observaciones.
7. Guardar.

Resultado esperado:

- Se genera automáticamente un código como `C-000001`.
- El estado inicial es `DRAFT`.
- Proveedor, destino, moneda, productos, unidades y precios coinciden con la
  orden y no son editables manualmente.
- Los totales son calculados por el backend.
- La orden continúa `SENT` mientras el borrador no sea confirmado.

### 2.1 Validaciones básicas

Intentar guardar:

- Sin seleccionar orden.
- Sin fecha de recepción.
- Sin cantidades.
- Con cantidad cero.
- Con cantidad negativa.
- Con cantidad mayor a la disponible.
- Repitiendo una línea mediante una petición manual.

Resultado esperado:

- El formulario o la API rechazan todos los casos.
- No queda una compra parcial en la base de datos.
- Los totales de la orden no cambian.

## 3. Cálculos financieros

Para cada línea comprobar:

```text
grossAmount = quantityReceived × unitPrice
discountAmount = grossAmount × discountRate / 100
subtotal = grossAmount - discountAmount
taxAmount = subtotal × taxRate / 100
total = subtotal + taxAmount
```

En la cabecera:

```text
subtotal = SUM(grossAmount)
discount = SUM(discountAmount)
tax = SUM(taxAmount)
total = subtotal - discount + tax
```

Resultado esperado:

- Los cálculos usan seis decimales internamente.
- El frontend presenta importes monetarios con dos decimales.
- Cambiar cantidades y guardar recalcula todos los valores.
- No es posible enviar precios o impuestos alternativos desde el formulario.

## 4. Edición y reservas

1. Crear un borrador por 60 unidades de un producto ordenado por 100.
2. Abrir nuevamente la creación de una recepción para la misma orden.

Resultado esperado:

- Ordenado: `100`.
- Reservado: `60`.
- Disponible: `40`.

3. Editar el primer borrador.

Resultado esperado:

- Su propia reserva no se cuenta dos veces.
- El formulario permite mantener las 60 unidades o modificarlas hasta el total
  que resulte disponible excluyendo ese mismo borrador.

4. Cambiar el borrador de 60 a 50.
5. Abrir una nueva recepción.

Resultado esperado:

- La nueva disponibilidad es 50.

## 5. Confirmación de recepción

1. Crear un borrador con factura y fecha de factura.
2. Pulsar **Recibir**.
3. Confirmar la advertencia.

Resultado esperado:

- La compra cambia de `DRAFT` a `RECEIVED`.
- Se registra `receivedAt`.
- Desaparecen las acciones de edición y cancelación.
- La compra ya no puede modificarse mediante una petición manual.
- Si quedan cantidades pendientes, la orden pasa a `PARTIALLY_RECEIVED`.
- Si todas las líneas quedan completas, la orden pasa a `RECEIVED`.

### 5.1 Factura obligatoria al confirmar

1. Crear un borrador sin factura o sin fecha de factura.
2. Intentar recibirlo.

Resultado esperado:

- La API rechaza la confirmación.
- La compra permanece `DRAFT`.
- La orden no cambia de estado.

## 6. Recepciones parciales sucesivas

Utilizar una orden de 100 unidades:

1. Crear y confirmar `C-000001` por 60.
2. Comprobar que la orden queda `PARTIALLY_RECEIVED`.
3. Crear `C-000002` por 40.
4. Confirmarla.

Resultado esperado:

- Antes de crear la segunda recepción, el disponible es 40.
- Después de confirmarla, el acumulado recibido es 100.
- La orden cambia a `RECEIVED`.
- La orden deja de aparecer entre las disponibles para nuevas recepciones.

Repetir con dos productos y completar solamente uno. La orden debe permanecer
`PARTIALLY_RECEIVED` hasta completar todas sus líneas.

## 7. Sobrerrecepción

Con 10 unidades disponibles:

1. Intentar recibir 11 mediante el formulario.
2. Intentar repetirlo modificando manualmente el request.

Resultado esperado:

- El frontend limita el valor.
- El backend rechaza cualquier valor superior.
- La respuesta indica la línea y cantidad restante.
- No se crean ni modifican registros parcialmente.

## 8. Cancelación de borrador

1. Crear un borrador que reserve parte de una orden.
2. Anotar la disponibilidad restante.
3. Cancelar e ingresar un motivo.

Resultado esperado:

- La compra cambia a `CANCELLED`.
- Se registran fecha, usuario y motivo.
- Las cantidades vuelven a estar disponibles.
- La orden queda `SENT` si no hay recepciones confirmadas.
- La orden queda `PARTIALLY_RECEIVED` si conserva alguna recepción confirmada.
- No se puede cancelar una compra `RECEIVED`, `VERIFIED` o `CLOSED`.

## 9. Verificación y cierre

1. Sobre una compra `RECEIVED`, pulsar **Verificar**.
2. Comprobar usuario y fecha en el preview.
3. Pulsar **Cerrar**.

Resultado esperado:

- Flujo exacto: `RECEIVED → VERIFIED → CLOSED`.
- No se puede cerrar directamente una compra `RECEIVED`.
- No se puede verificar un borrador, una cancelada o una cerrada.
- Una compra cerrada solo conserva acciones de consulta.

## 10. Facturas duplicadas

1. Registrar una factura para un proveedor.
2. Intentar registrar el mismo número en otra compra del mismo proveedor y
   compañía.

Resultado esperado:

- La segunda operación es rechazada.

3. Probar el mismo número con otro proveedor.

Resultado esperado:

- Es aceptado, porque la unicidad es por compañía y proveedor.

Comprobar también diferencias de mayúsculas, espacios y guiones y documentar
el comportamiento observado. La normalización fiscal avanzada puede requerir
una decisión posterior.

## 11. Concurrencia

Abrir la aplicación en dos navegadores o sesiones:

### 11.1 Dos borradores simultáneos

1. En ambas sesiones abrir la misma orden cuando tiene 10 disponibles.
2. En ambas ingresar 10.
3. Guardar primero en A y luego en B.

Resultado esperado:

- A guarda correctamente.
- B recibe conflicto de concurrencia (`409`) y debe refrescar.
- Nunca quedan 20 unidades reservadas.

### 11.2 Edición obsoleta

1. Abrir el mismo borrador en A y B.
2. Guardar cambios en A.
3. Guardar cambios distintos en B.

Resultado esperado:

- B recibe conflicto de concurrencia.
- Los datos guardados por A no se sobrescriben.

### 11.3 Confirmación simultánea

1. Preparar dos borradores válidos de la misma orden.
2. Intentar confirmarlos simultáneamente.

Resultado esperado:

- Solo se confirman cantidades que respeten el pendiente real.
- La orden termina en el estado que corresponda al acumulado confirmado.

## 12. Aislamiento multiempresa

Con acceso a dos compañías:

1. Crear datos en compañía A.
2. Cambiar a compañía B.
3. Intentar consultar por URL o API los IDs de A.
4. Intentar crear una compra en B usando una orden de A.

Resultado esperado:

- Los datos de A no aparecen en B.
- Las consultas cruzadas devuelven `404` o rechazo equivalente sin filtrar
  información sensible.
- Ninguna FK cruzada puede persistirse.

## 13. Preview detallado

Comprobar que el modal muestra:

- UUID, código y estado.
- Orden de origen.
- Proveedor, sucursal y almacén.
- Fecha y responsable.
- Factura y fecha de factura.
- Moneda y tipo de cambio.
- Subtotal, descuento, impuesto y total.
- Fechas de recepción, verificación, cierre o cancelación.
- Usuario verificador o cancelador cuando corresponda.
- Observaciones y motivo de cancelación.
- Todas las líneas con cantidades, unidad, precio, descuento, impuesto, total y
  notas.

## 14. Bitácora e historial

Después de crear, editar, recibir, verificar, cerrar y cancelar, revisar:

- **Auditoría**: acción, usuario, empresa, resultado y request ID.
- **Historial de cambios**: snapshots anterior y nuevo del agregado.

Acciones esperadas:

```text
PURCHASE.CREATED
PURCHASE.UPDATED
PURCHASE.RECEIVED
PURCHASE.VERIFIED
PURCHASE.CLOSED
PURCHASE.CANCELLED
```

## 15. Regresión básica

Confirmar que continúan funcionando:

- Solicitudes de compra.
- Cotizaciones y comparación.
- Generación y aprobación de órdenes.
- Gastos y documentos privados de órdenes.
- Cambio entre plataforma y empresa.
- Administración de roles y permisos.

## Plantilla para reportar incidencias

```text
Caso:
Empresa:
Usuario/rol:
Código de orden:
Código de compra:

Pasos:
1.
2.
3.

Resultado esperado:

Resultado obtenido:

Código HTTP:
Request ID:
Request payload:
Response payload:

Captura/log adicional:
```
