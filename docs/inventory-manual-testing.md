# Guía de pruebas manuales — Inventario v1.0

## Propósito

Esta guía valida el flujo disponible desde una recepción de compra hasta la
ubicación y traslado de sus lotes. Debe ejecutarse en una compañía de prueba y
con un usuario que posea los permisos indicados en `docs/inventory.md` e
`docs/inventory-transfers.md`.

## Preparación

1. Aplicar las migraciones pendientes y ejecutar el seed de permisos.
2. Iniciar backend y frontend con la misma compañía activa.
3. Crear dos almacenes activos de la compañía, preferiblemente en sucursales
   diferentes.
4. Crear al menos una ubicación activa en cada almacén.
5. Tener un producto activo con unidad de compra, unidad base y factor de
   conversión válido.
6. Completar orden y recepción hasta estado `VERIFIED` o `CLOSED`.
7. Si la recepción usa `LANDED_COST`, cerrar antes su retaceo.

Registrar en cada incidencia el `requestId` devuelto por la API.

## Caso 1: ingreso directo

1. Abrir **Ingresos de inventario**.
2. Localizar una recepción elegible con modo `DIRECT`.
3. Confirmar el ingreso.

Resultado esperado:

- se crea un lote por cada detalle recibido;
- cada lote conserva recepción, producto, unidades y factor de conversión;
- el Kardex muestra `PURCHASE_RECEIPT`;
- el costo promedio del producto se actualiza;
- la recepción deja de aparecer como elegible;
- repetir la operación no crea lotes duplicados.

## Caso 2: ingreso con retaceo

1. Elegir una recepción configurada como `LANDED_COST` sin retaceo cerrado.
2. Verificar que no permita ingresarla y explique el motivo.
3. Calcular, verificar y cerrar el retaceo.
4. Volver a confirmar el ingreso.

Resultado esperado: el costo total y unitario del lote proceden del detalle del
retaceo cerrado, convertido por el tipo de cambio de la recepción.

## Caso 3: conversión de unidad

Usar un producto cuya unidad de compra sea, por ejemplo, una caja de 12 unidades
y recibir 5 cajas.

Resultado esperado:

```text
cantidad recibida = 5 cajas
factor = 12
cantidad de inventario = 60 unidades
```

Una unidad que no sea la unidad de compra ni la unidad base debe rechazarse.

## Caso 4: asignación inicial

1. Abrir el detalle del lote.
2. Asignar una cantidad parcial a una ubicación del almacén receptor.
3. Asignar el remanente a otra ubicación del mismo almacén.

Resultado esperado:

- ambos saldos suman la cantidad del lote;
- aparecen pares `TRANSFER_OUT` y `TRANSFER_IN` por cada asignación;
- el costo promedio global no cambia.

Intentos que deben rechazarse:

- cantidad cero o negativa;
- cantidad superior al saldo pendiente;
- ubicación de otro almacén;
- ubicación inactiva o de otra compañía.

## Caso 5: etiquetas

1. Imprimir una cantidad válida de etiquetas para un lote.
2. Abrir el PDF y comprobar código interno, lote y fecha.
3. Intentar reimprimir sin motivo.
4. Reimprimir proporcionando un motivo de al menos tres caracteres.

Resultado esperado: la primera impresión se registra; la segunda sin motivo se
rechaza; la reimpresión justificada genera PDF y registro de auditoría.

## Caso 6: consultas y aislamiento

Validar las pestañas de existencias, Kardex y costos:

- búsqueda por producto, lote o ubicación;
- filtros por sucursal, almacén, ubicación, producto y lote vía API;
- tipo y rango de fechas en Kardex;
- paginación y ordenamiento;
- existencia, valor y costo promedio consistentes.

Cambiar a otra compañía. No debe mostrarse ningún lote, saldo, costo ni
movimiento de la compañía anterior, aunque se manipulen identificadores en la
solicitud.

## Caso 7: creación de traslado

1. Abrir **Traslados de inventario**.
2. Seleccionar almacenes origen y destino distintos.
3. Agregar una o varias líneas con lote, ubicaciones y cantidad.
4. Guardar el documento.

Resultado esperado: se genera un código automático y estado `PREPARATION`; las
existencias todavía no cambian.

Deben rechazarse:

- almacén origen igual al destino;
- ubicación que no corresponde a su almacén;
- cantidad acumulada mayor al saldo;
- combinación repetida de lote y ubicaciones;
- registros de otra compañía.

## Caso 8: despacho y recepción

1. Despachar el traslado.
2. Consultar existencias y Kardex.
3. Recibirlo en destino.
4. Volver a consultar existencias, Kardex y costo promedio.

Resultado esperado al despachar:

- estado `IN_TRANSIT`;
- saldo origen descontado;
- movimiento `TRANSFER_OUT`;
- aún no existe saldo adicional en destino.

Resultado esperado al recibir:

- estado `RECEIVED`;
- saldo destino incrementado por la misma cantidad;
- movimiento `TRANSFER_IN` con mismo lote y costo;
- cantidad y valor globales sin variación.

## Caso 9: incidencia

1. Despachar un traslado.
2. Registrar una incidencia con motivo.
3. Confirmar posteriormente la recepción.

Resultado esperado: transición `IN_TRANSIT -> INCIDENT -> RECEIVED`, conservando
las notas de incidencia y responsables.

## Caso 10: cancelación y concurrencia

- Cancelar un traslado `PREPARATION` indicando motivo: debe pasar a `CANCELLED`
  sin afectar existencias.
- Intentar cancelar uno despachado: debe rechazarse.
- Abrir el mismo registro en dos sesiones; procesarlo en una y luego usar la
  otra: la segunda operación debe rechazarse por `expectedUpdatedAt` obsoleto.

## Caso 11: ajuste autorizado

1. Crear un ajuste de salida sobre un lote y ubicación con saldo.
2. Comprobar que el borrador no cambie existencias.
3. Aprobarlo con un usuario que posea `inventory.adjustments_approve`.

Resultado esperado: se descuenta el saldo, se actualiza la valoración y aparece
un movimiento `ADJUSTMENT_OUT`. Repetir la aprobación o exceder el saldo debe
rechazarse. Repetir con dirección `IN` debe incrementar saldo y valoración.

## Caso 12: reversión

1. Desde Kardex, revertir el movimiento de ajuste indicando un motivo.
2. Comprobar saldos, valoración y nuevo movimiento.
3. Intentar revertir nuevamente el movimiento original.

Resultado esperado: se crea `REVERSAL`, se restaura el efecto contrario y el
segundo intento se rechaza. No debe ofrecerse reversión directa para ingresos de
compra ni movimientos de traslado.

## Conciliación final

Para cada producto probado se debe cumplir:

```text
existencia global = suma de saldos por ubicación + mercancía aún no ubicada
valor global = valor anterior + entradas valorizadas - salidas valorizadas
traslado recibido: salida origen = entrada destino
```

Los traslados no cambian `quantity_on_hand`, `inventory_value` ni
`average_unit_cost`. Ningún movimiento confirmado debe poder editarse o
eliminarse desde la aplicación.

## Caso 13: reubicación interna

1. Seleccionar un almacén con un lote ubicado.
2. Elegir una ubicación destino distinta dentro del mismo almacén.
3. Confirmar una cantidad menor o igual al saldo disponible.

Resultado esperado: la cantidad sale del origen y entra al destino en una sola
operación; el lote, cantidad global, valor y costo promedio no cambian. Deben
rechazarse el mismo origen y destino, ubicaciones de otro almacén y cantidades
superiores al saldo.

## Fuera del alcance de esta guía

Todavía no deben probarse como disponibles:

- tránsito mediante ubicación de vehículo;
- salidas por venta;
- reingresos por devolución.

