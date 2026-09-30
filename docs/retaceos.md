# Retaceos — Etapa 6

## Objetivo

El retaceo determina el costo real de los productos efectivamente recibidos en
una compra importada. Distribuye los costos necesarios para poner la mercancía
a disposición de la empresa, excluyendo los impuestos recuperables del valor
del inventario.

El Excel `docs/Retaceo.xlsx` es una referencia funcional, no el modelo de
persistencia. En su ejemplo, la hoja resumida distribuye USD 71,332, mientras
que la bitácora capitaliza USD 72,582. La diferencia de USD 1,250 corresponde a
costos individuales omitidos en el resumen. Por ello no se utiliza un único
campo manual de “gastos”.

## Modelo

### `retaceos`

Encabezado del expediente. Pertenece siempre a una compañía y referencia una
compra real, su proveedor y el país de origen. Conserva moneda, tipo de cambio,
factura, póliza, totales, versión de cálculo, estado y responsables de cada
transición.

Inicialmente una compra admite un único retaceo principal mediante la clave
única `(purchase_id, company_id)`.

### `retaceo_details`

Snapshot de cada línea recibida. Conserva la relación con `purchase_details`,
producto, unidad, cantidad, FOB unitario y total, costos capitalizables
asignados, costo total y costo unitario. Peso y volumen son opcionales y
permiten métodos futuros de distribución.

### `retaceo_costs`

Registra cada costo de forma independiente. Puede provenir de un gasto
definitivo de la orden o registrarse específicamente para el expediente.
Conserva importe original, moneda, conversión, clasificación fiscal y contable
y método de distribución como snapshot histórico.

Categorías iniciales:

```text
FREIGHT
INSURANCE
IMPORT_DUTY
OTHER
IMPORT_VAT
```

`IMPORT_VAT` puede registrarse para trazabilidad, pero cuando es recuperable
debe tener `is_capitalizable = false` y no participa en el landed cost.

### `retaceo_allocations`

Snapshot reproducible de la distribución de cada costo entre cada detalle.
Conserva método, base individual, base total, factor, costo original, importe
asignado y ajuste de redondeo.

## Configuración de tipos de gasto

`expense_types` incorpora valores predeterminados para retaceo:

- categoría;
- método de distribución;
- capitalizable;
- impuesto recuperable;
- componente del CIF.

Los registros existentes reciben una configuración neutral (`OTHER`,
`FOB_VALUE` y banderas desactivadas). Estas propiedades no modifican los
cálculos actuales de cotizaciones ni órdenes.

## Métodos de distribución

```text
FOB_VALUE
QUANTITY
WEIGHT
VOLUME
CIF_VALUE
EQUAL
MANUAL
```

El motor funcional implementa todos los métodos definidos. `FOB_VALUE` es el
valor predeterminado y el requerido por ERS v0.9:

```text
factor = fob_linea / total_fob
asignado = costo * factor
```

Los cálculos internos usarán seis decimales monetarios y doce para factores.
Al contabilizar o presentar a dos decimales, cualquier residuo se asignará de
forma determinista para garantizar que la suma distribuida coincida exactamente
con el costo original.

Para `WEIGHT` y `VOLUME`, todas las líneas deben tener una base mayor que cero.
`CIF_VALUE` utiliza el FOB más los componentes CIF distribuidos previamente,
respetando el orden de los costos. `MANUAL` exige indicar una asignación para
cada línea y que su suma coincida exactamente con el costo.

## Totales

```text
total_cif = total_fob + costos marcados como componente CIF
total_landed_cost = total_fob + costos capitalizables
```

Los impuestos recuperables se acumulan en `total_recoverable_taxes`, pero no se
suman a `total_landed_cost`.

## Estados

```text
DRAFT -> CALCULATED -> VERIFIED -> CLOSED
  \----------\----------\-----> CANCELLED
```

- `DRAFT`: expediente editable.
- `CALCULATED`: simulación generada sin afectar inventario.
- `VERIFIED`: cálculo revisado y congelado.
- `CLOSED`: costo definitivo preparado para Inventario.
- `CANCELLED`: expediente anulado sin eliminación física.

Modificar líneas o costos después de calcular deberá invalidar el resultado y
devolver el expediente a `DRAFT`. Un retaceo cerrado no se modifica; los costos
posteriores requerirán un ajuste formal en un corte futuro.

## Permisos

```text
retaceos.read
retaceos.create
retaceos.update
retaceos.calculate
retaceos.verify
retaceos.close
retaceos.cancel
```

Owner y Administrator reciben todos los permisos. Operator recibe lectura,
creación, actualización y cálculo. Read Only recibe únicamente lectura.

## Integraciones

- La fuente es una compra `VERIFIED` o `CLOSED`, nunca directamente una orden.
- Los detalles conservan la trazabilidad compra → orden → cotización → solicitud.
- Los gastos definitivos de orden pueden copiarse como costos del retaceo.
- El cierre prepara costos para Inventario; este corte no crea existencias ni
  asientos contables.
- La asignación de precios consumirá posteriormente el costo unitario cerrado.

## API disponible en el corte funcional

Todos los endpoints operan dentro del contexto de compañía autenticado:

```text
GET    /api/v1/retaceos
GET    /api/v1/retaceos/eligible-purchases
GET    /api/v1/retaceos/:id
POST   /api/v1/retaceos
PUT    /api/v1/retaceos/:id
POST   /api/v1/retaceos/:id/costs
PUT    /api/v1/retaceos/:id/costs/:costId
DELETE /api/v1/retaceos/:id/costs/:costId
POST   /api/v1/retaceos/:id/calculate
POST   /api/v1/retaceos/:id/verify
POST   /api/v1/retaceos/:id/close
POST   /api/v1/retaceos/:id/cancel
```

Solo una compra `VERIFIED` o `CLOSED` sin retaceo previo aparece como elegible.
Al crear el expediente se copian las líneas recibidas y su FOB neto. De forma
predeterminada también se copian los gastos definitivos de la orden; cada uno
conserva una instantánea de la clasificación configurada en su tipo de gasto.

La edición del encabezado, peso, volumen y costos se permite únicamente en
`DRAFT` y utiliza `updatedAt` para impedir sobrescrituras concurrentes.

La verificación vuelve a comprobar todas las cuadraturas y congela el cálculo.
El cierre repite estas validaciones antes de dejar el expediente inmutable. La
cancelación requiere motivo y se admite antes del cierre; nunca elimina datos.
Cerrar un retaceo todavía no genera existencias ni asientos contables.
