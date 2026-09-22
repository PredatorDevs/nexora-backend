# Guía funcional del proceso de Retaceo para un sistema ERP

## 1. Objetivo

El **retaceo** es el proceso mediante el cual se determina el costo real
de adquisición de los bienes importados y se distribuyen
proporcionalmente entre dichos bienes los costos incurridos para
ponerlos a disposición de la empresa.

En términos de ERP, el objetivo no es únicamente registrar el precio
indicado en la factura del proveedor, sino determinar el **costo puesto
en inventario (landed cost)**.

De forma general:

\[ `\text{Costo de adquisición}`{=tex} =
`\text{Valor de mercancía}`{=tex} +
`\text{Costos capitalizables de importación}`{=tex} \]

El proceso debe permitir conocer, justificar y auditar cuánto costó
realmente cada producto importado.

------------------------------------------------------------------------

## 2. Caso analizado

El ejemplo utilizado corresponde al retaceo **RTC-00233**, con los
siguientes datos principales:

-   Proveedor: Damlier
-   País de origen: Alemania
-   Factura de importación: 122
-   Póliza de importación: 6778
-   FOB total: **\$55,780.00**
-   Flete: **\$5,125.00**
-   DAI: **\$8,927.00**
-   Inventario final registrado: **\$72,582.00**
-   IVA de importación separado como crédito fiscal: **\$8,367.00**

Los bienes importados son:

  Código     Descripción     Cantidad               FOB
  ---------- ------------- ---------- -----------------
  655-SERT   Prensadora             1       \$50,000.00
  76sg-TOY   Camión                 1        \$5,780.00
             **Total**          **2**   **\$55,780.00**

------------------------------------------------------------------------

## 3. Conceptos fundamentales

### 3.1 FOB

Representa el valor de la mercancía utilizado como costo base en el
ejemplo.

\[ FOB\_{Total} = 50,000 + 5,780 = 55,780 \]

Por tanto:

\[ `\boxed{FOB = \$55,780.00}`{=tex} \]

------------------------------------------------------------------------

### 3.2 CIF

En el archivo analizado se determina mediante:

\[ CIF = FOB + Seguro + Flete \]

Con:

-   FOB = \$55,780
-   Seguro = \$1,250
-   Flete = \$5,125

Entonces:

\[ 55,780 + 1,250 + 5,125 = 62,155 \]

\[ `\boxed{CIF = \$62,155.00}`{=tex} \]

El valor CIF debe mantenerse conceptualmente separado del costo final de
adquisición.

------------------------------------------------------------------------

### 3.3 Landed Cost o costo puesto en inventario

Representa el costo final de los bienes después de incorporar los costos
que correspondan al inventario.

En el ejemplo:

\[ FOB = \$55,780 \]

\[ Costos capitalizados = \$16,802 \]

Por tanto:

\[ 55,780 + 16,802 = 72,582 \]

\[ `\boxed{Costo\ final\ de\ inventario = \$72,582.00}`{=tex} \]

------------------------------------------------------------------------

## 4. Bitácora de costos de la importación

El archivo registra los siguientes desembolsos:

  Concepto                       Valor
  ---------------------- -------------
  Compra FOB               \$55,780.00
  Seguro                    \$1,250.00
  Flete marítimo            \$5,125.00
  DAI                       \$8,927.00
  IVA importación           \$8,367.00
  Honorarios aduanales        \$250.00
  Fotocopias                    \$5.00
  Gasolina                     \$40.00
  Viáticos                     \$90.00
  Almacenamiento              \$300.00
  Custodia                     \$50.00
  Transporte                  \$500.00
  Descarga                    \$120.00
  Recarga                     \$120.00
  Otros                        \$25.00

Excluyendo el IVA recuperable, los valores llevados a pedidos en
tránsito totalizan:

\[ `\boxed{\$72,582.00}`{=tex} \]

------------------------------------------------------------------------

## 5. Tratamiento del IVA

El archivo separa el IVA de importación por **\$8,367.00** como IVA
Crédito Fiscal.

Bajo la lógica representada en el ejercicio:

\[ IVA recuperable `\notin `{=tex}Costo de Inventario \]

Por ello:

\[ Inventario = \$72,582 \]

y no:

\[ 72,582 + 8,367 \]

En el ERP, esta clasificación debe depender de reglas contables y
fiscales configuradas para el concepto correspondiente.

> **Importante:** la fórmula del archivo calcula el IVA como
> `FOB × 15 %`. Esta regla debe validarse contable y fiscalmente antes
> de implementarse como regla definitiva del sistema.

------------------------------------------------------------------------

## 6. Acumulación en Pedidos en Tránsito

Mientras la importación no ha finalizado, los costos relacionados con
ella se acumulan conceptualmente en una cuenta o entidad de **Pedidos en
Tránsito**.

El flujo puede representarse así:

``` text
Compra internacional
        |
        v
Factura del proveedor
        |
        v
Pedidos en tránsito
        |
        +-- FOB
        +-- Seguro
        +-- Flete
        +-- DAI
        +-- Honorarios
        +-- Almacenamiento
        +-- Transporte
        +-- Descarga
        +-- Otros costos capitalizables
        |
        v
Retaceo
        |
        v
Costo final por producto
        |
        v
Inventario
```

En el ejemplo:

\[ Pedidos en tránsito = \$72,582 \]

y posteriormente:

\[ Pedidos en tránsito `\rightarrow `{=tex}Inventario \]

por el mismo valor.

------------------------------------------------------------------------

## 7. ¿Qué hace el retaceo?

Una vez identificados los costos de la importación, estos deben
asignarse a los bienes importados.

El archivo utiliza principalmente el **valor FOB de cada producto como
base de distribución**.

La participación de un producto se obtiene mediante:

\[ Participacion_i = `\frac{FOB_i}{FOB_{Total}}`{=tex} \]

### Prensadora

\[ `\frac{50,000}{55,780}`{=tex} `\approx 89.6379`{=tex}% \]

### Camión

\[ `\frac{5,780}{55,780}`{=tex} `\approx 10.3621`{=tex}% \]

La suma debe ser:

\[ 89.6379% + 10.3621% = 100% \]

------------------------------------------------------------------------

## 8. Fórmula general de distribución

Para un costo determinado:

\[ CostoAsignado\_{i,g} = Costo_g `\times `{=tex}Participacion\_{i,g} \]

Cuando la base de distribución es FOB:

\[ Participacion\_{i,g} = `\frac{FOB_i}{FOB_{Total}}`{=tex} \]

Por tanto:

\[ CostoAsignado\_{i,g} = Costo_g `\times`{=tex}
`\frac{FOB_i}{FOB_{Total}}`{=tex} \]

------------------------------------------------------------------------

## 9. Ejemplo: distribución del flete

Flete total:

\[ \$5,125 \]

### Prensadora

\[ 5,125 `\times`{=tex} `\frac{50,000}{55,780}`{=tex} = 4,593.94 \]

### Camión

\[ 5,125 `\times`{=tex} `\frac{5,780}{55,780}`{=tex} = 531.06 \]

Validación:

\[ 4,593.94 + 531.06 = 5,125.00 \]

------------------------------------------------------------------------

## 10. Ejemplo: distribución del DAI

DAI total:

\[ \$8,927 \]

### Prensadora

\[ 8,927 `\times`{=tex} `\frac{50,000}{55,780}`{=tex} `\approx
8`{=tex},001.97 \]

### Camión

\[ 8,927 `\times`{=tex} `\frac{5,780}{55,780}`{=tex} `\approx
925.03`{=tex} \]

Validación:

\[ 8,001.97 + 925.03 = 8,927.00 \]

------------------------------------------------------------------------

## 11. Interpretación de los porcentajes mostrados en el Excel

El archivo muestra:

-   Flete: 9.19 %
-   Gastos: 2.69 %
-   DAI: 16.00 %

Estos porcentajes se obtienen respecto del FOB total.

Por ejemplo:

\[ `\frac{5,125}{55,780}`{=tex} `\approx
9.19`{=tex}% \]

Sin embargo, **no se debe utilizar el porcentaje visual redondeado para
realizar el cálculo**.

No debe calcularse:

\[ 50,000 `\times 9.19`{=tex}% \]

porque produciría una diferencia.

Debe utilizarse:

\[ 50,000 `\times`{=tex} `\frac{5,125}{55,780}`{=tex} \]

Esto conserva la precisión del cálculo.

------------------------------------------------------------------------

## 12. Cálculo mostrado actualmente por la hoja Retaceo

La hoja de retaceo distribuye:

-   FOB: \$55,780
-   Flete: \$5,125
-   Gastos: \$1,500
-   DAI: \$8,927

Por tanto:

\[ 55,780 + 5,125 + 1,500 + 8,927 = 71,332 \]

### Prensadora

\[ 50,000 + 4,593.94 + 1,344.57 + 8,001.97 = 63,940.48 \]

### Camión

\[ 5,780 + 531.06 + 155.43 + 925.03 = 7,391.52 \]

Validación:

\[ 63,940.48 + 7,391.52 = 71,332.00 \]

------------------------------------------------------------------------

## 13. Discrepancia encontrada en el ejemplo

Existe una diferencia importante entre la hoja de retaceo y el costo
final llevado a inventario.

El retaceo distribuye:

\[ `\boxed{\$71,332}`{=tex} \]

pero la bitácora lleva a inventario:

\[ `\boxed{\$72,582}`{=tex} \]

La diferencia es:

\[ 72,582 - 71,332 = 1,250 \]

Los gastos adicionales registrados después son:

-   Fotocopias: \$5
-   Gasolina: \$40
-   Viáticos: \$90
-   Almacenamiento: \$300
-   Custodia: \$50
-   Transporte: \$500
-   Descarga: \$120
-   Recarga: \$120
-   Otros: \$25

Su suma es:

\[ `\boxed{\$1,250}`{=tex} \]

Por ello, el sistema ERP no debe depender de un único campo manual
denominado **Gastos**. Los costos deben registrarse individualmente y el
retaceo debe obtener automáticamente los costos capitalizables asociados
a la importación.

------------------------------------------------------------------------

## 14. Clasificación recomendada de conceptos

El ERP debería distinguir al menos las siguientes categorías.

### 14.1 Valor de mercancía

Ejemplo:

-   Prensadora
-   Camión

### 14.2 Transporte internacional

Ejemplo:

-   Flete
-   Seguro

### 14.3 Derechos e impuestos no recuperables

Ejemplo:

-   DAI, según corresponda.

### 14.4 Gastos accesorios capitalizables

Ejemplos:

-   Honorarios aduanales
-   Almacenamiento
-   Custodia
-   Transporte
-   Descarga
-   Recarga
-   Otros costos necesarios

### 14.5 Impuestos recuperables

Ejemplo:

-   IVA Crédito Fiscal

Los impuestos recuperables no deberían incorporarse automáticamente al
costo del inventario.

------------------------------------------------------------------------

## 15. El ERP no debe limitarse a distribuir por FOB

El ejemplo utiliza FOB como base de distribución, pero un sistema
robusto debe permitir diferentes métodos.

Métodos recomendados:

-   `FOB_VALUE`
-   `QUANTITY`
-   `WEIGHT`
-   `VOLUME`
-   `CIF_VALUE`
-   `EQUAL`
-   `MANUAL`

La regla general es:

\[ FactorParticipacion\_{i,g} = `\frac{Base_i}{\sum Base}`{=tex} \]

y:

\[ CostoAsignado\_{i,g} = Costo_g `\times`{=tex}
FactorParticipacion\_{i,g} \]

Cada tipo de costo debe indicar cuál es su método de distribución.

------------------------------------------------------------------------

## 16. Ejemplo de configuración de un tipo de costo

### Flete marítimo

``` text
Tipo: FREIGHT
Capitalizable: Sí
Afecta inventario: Sí
Forma parte de CIF: Sí
Método de distribución: WEIGHT o FOB_VALUE
Cuenta contable: Configurable
```

### IVA de importación

``` text
Tipo: IMPORT_VAT
Capitalizable: No, cuando sea recuperable
Recuperable: Sí
Afecta inventario: No
Cuenta contable: IVA Crédito Fiscal
```

### Descarga

``` text
Tipo: UNLOADING
Capitalizable: Sí
Afecta inventario: Sí
Forma parte de CIF: No
Método de distribución: QUANTITY / WEIGHT / FOB_VALUE
```

Las reglas no deben estar codificadas mediante condiciones especiales
para cada importación.

------------------------------------------------------------------------

## 17. Cálculo del costo final del producto

Para cada producto:

\[ CostoTotalProducto_i = CostoBase_i +
`\sum `{=tex}CostosAsignados\_{i,g} \]

Cuando una línea contiene varias unidades:

\[ CostoUnitario_i = `\frac{CostoTotalProducto_i}{Cantidad_i}`{=tex} \]

En el ejemplo ambas líneas tienen cantidad 1, por lo que el costo total
de la línea coincide con el costo unitario.

El ERP debe mantener ambos conceptos separados.

------------------------------------------------------------------------

## 18. Flujo funcional recomendado

### Etapa 1 --- Crear expediente de importación

Registrar:

-   Código de retaceo/importación
-   Proveedor
-   País de origen
-   Moneda
-   Fecha
-   Factura
-   Póliza
-   Documentos relacionados

### Etapa 2 --- Registrar mercancía

Por cada línea:

-   Producto
-   Cantidad
-   Precio
-   FOB
-   Peso, cuando aplique
-   Volumen, cuando aplique
-   Información arancelaria necesaria
-   Otros atributos utilizados para distribución

### Etapa 3 --- Registrar costos

Cada costo debe almacenarse individualmente:

-   Tipo
-   Proveedor
-   Documento
-   Fecha
-   Moneda
-   Importe
-   Capitalizable
-   Recuperable/no recuperable
-   Método de distribución

### Etapa 4 --- Acumular pedido en tránsito

Mientras la importación permanezca abierta, el sistema mantiene los
costos asociados al expediente.

### Etapa 5 --- Simular retaceo

El sistema calcula:

-   Bases de distribución
-   Participación de cada producto
-   Costos asignados
-   Costo total
-   Costo unitario
-   Diferencias de redondeo

Esta operación todavía no debe modificar definitivamente el inventario.

### Etapa 6 --- Validar

Antes de cerrar:

-   Todos los documentos requeridos deben existir.
-   Los costos deben estar clasificados.
-   Las distribuciones deben cuadrar.
-   No deben existir diferencias monetarias sin justificar.

### Etapa 7 --- Aprobar retaceo

Un usuario autorizado aprueba el cálculo.

### Etapa 8 --- Capitalizar

Se realiza la entrada o valorización correspondiente de inventario.

### Etapa 9 --- Contabilizar

El sistema genera los movimientos contables correspondientes según la
configuración.

### Etapa 10 --- Cerrar

El retaceo se congela y queda disponible para auditoría.

------------------------------------------------------------------------

## 19. Estados recomendados

Una posible máquina de estados es:

``` text
DRAFT
  |
  v
IN_TRANSIT
  |
  v
READY_FOR_ALLOCATION
  |
  v
CALCULATED
  |
  v
APPROVED
  |
  v
CLOSED
```

Equivalentes funcionales:

-   Borrador
-   En tránsito
-   Listo para retaceo
-   Calculado
-   Aprobado
-   Cerrado

Mientras el expediente esté abierto pueden agregarse gastos.

Una vez cerrado, las modificaciones deben realizarse mediante
operaciones de ajuste formal.

------------------------------------------------------------------------

## 20. Gastos posteriores al cierre

Un caso importante ocurre cuando se recibe un gasto después de haber
aprobado el retaceo.

Ejemplo:

``` text
Retaceo original:       $71,332
Gastos posteriores:      $1,250
Costo ajustado:          $72,582
```

El sistema no debe modificar silenciosamente un retaceo histórico.

Debe existir un mecanismo de **ajuste de landed cost** que registre:

-   Retaceo original
-   Gasto adicional
-   Motivo
-   Usuario
-   Fecha
-   Distribución
-   Impacto en inventario
-   Impacto contable

Si parte de la mercancía ya fue vendida, debe definirse explícitamente
el tratamiento contable del ajuste.

------------------------------------------------------------------------

## 21. Política de redondeo

Los cálculos internos deben conservar suficiente precisión.

Ejemplo:

\[ CostoAsignado = 50000 `\times`{=tex} `\frac{5125}{55780}`{=tex} \]

No debe utilizarse el porcentaje visual de 9.19 %.

Al presentar o contabilizar valores monetarios puede ser necesario
redondear a dos decimales.

El sistema debe garantizar:

\[ `\sum `{=tex}CostosAsignados = CostoOriginal \]

Si un costo de \$100 se distribuye entre tres líneas y se obtiene:

``` text
33.33
33.33
33.33
-----
99.99
```

el centavo residual debe asignarse mediante una regla determinista:

``` text
33.34
33.33
33.33
-----
100.00
```

No deben perderse diferencias por redondeo.

------------------------------------------------------------------------

## 22. Validaciones obligatorias

Antes de cerrar un retaceo deben cumplirse, como mínimo:

### Validación de costos capitalizables

\[ FOB\_{Total} + CostosCapitalizables = ValorInventario \]

En el ejemplo:

\[ 55,780 + 16,802 = 72,582 \]

### Validación de distribución

Para cada costo:

\[ `\sum `{=tex}CostoAsignado\_{i,g} = Costo_g \]

### Validación final

\[ `\sum `{=tex}CostoFinalProducto_i = ValorInventario \]

Si cualquiera de estas ecuaciones no cuadra dentro de la tolerancia
monetaria configurada, el sistema no debe permitir el cierre.

------------------------------------------------------------------------

## 23. Trazabilidad del cálculo

El ERP debe poder explicar por qué un producto tiene determinado costo.

Ejemplo:

``` text
Producto: Prensadora 655-SERT

FOB                         $50,000.00
Flete asignado                4,593.94
DAI asignado                  8,001.97
Seguro asignado                    ...
Honorarios asignados               ...
Transporte asignado                ...
Almacenamiento asignado            ...
Otros                              ...
-------------------------------------
Costo total                         ...
Cantidad                              1
Costo unitario                       ...
```

Cada importe debe poder rastrearse hasta el gasto y documento que lo
originó.

------------------------------------------------------------------------

## 24. Preservación histórica

Las reglas de distribución pueden cambiar con el tiempo.

Por ejemplo:

``` text
Flete
Antes: distribución por FOB
Ahora: distribución por peso
```

Esto no debe modificar un retaceo previamente cerrado.

Cuando se aprueba el retaceo, el sistema debe preservar un **snapshot
del cálculo**.

Un detalle de distribución debería conservar información equivalente a:

``` text
importCostId
importItemId
allocationMethod
baseValue
totalBaseValue
allocationFactor
originalCost
allocatedCost
```

De esta manera, el cálculo puede reproducirse y auditarse
posteriormente.

------------------------------------------------------------------------

## 25. Modelo conceptual de datos

Una estructura preliminar podría contemplar:

``` text
Import
ImportDocument
ImportItem

ImportCostType
ImportCost
ImportTax

LandedCost
LandedCostAllocation

InventoryReceipt
InventoryReceiptDetail

AccountingEntry
```

Una posible organización física posterior podría utilizar tablas como:

``` text
imports
import_documents
import_items

import_cost_types
import_costs
import_taxes

landed_costs
landed_cost_allocations

inventory_receipts
inventory_receipt_details
```

Esta estructura es conceptual y debe validarse antes de crear el esquema
SQL definitivo.

------------------------------------------------------------------------

## 26. ImportCost como entidad flexible

No se recomienda crear columnas rígidas como:

``` text
freight
insurance
dai
storage
transport
```

en la tabla principal de importaciones.

Los costos deberían modelarse como registros independientes.

Ejemplo:

``` text
ID | ImportID | CostType      | Amount
1  | 233      | INSURANCE     | 1250
2  | 233      | FREIGHT       | 5125
3  | 233      | DAI           | 8927
4  | 233      | CUSTOMS_FEES  | 250
5  | 233      | STORAGE       | 300
```

Esto permite agregar nuevos conceptos sin modificar el esquema:

-   Inspección sanitaria
-   Demora portuaria
-   Manejo de terminal
-   Agente de carga
-   Fumigación
-   Certificaciones
-   Otros

------------------------------------------------------------------------

## 27. Separación entre costo y método de distribución

Un principio fundamental del diseño es:

> El costo y la forma en que dicho costo se distribuye son conceptos
> independientes.

Ejemplo:

``` text
Costo:
Flete marítimo = $5,125

Método:
Distribución por peso
```

Otro gasto puede utilizar:

``` text
Costo:
Seguro = $1,250

Método:
Distribución por FOB
```

Esta separación permite construir un motor de retaceo reutilizable.

------------------------------------------------------------------------

## 28. Auditoría

El sistema debería registrar al menos:

-   Usuario que creó la importación
-   Usuario que registró/modificó cada gasto
-   Fecha de cada modificación
-   Documentos asociados
-   Usuario que ejecutó el cálculo
-   Versión del cálculo
-   Usuario que aprobó
-   Fecha de aprobación
-   Usuario que cerró
-   Ajustes posteriores
-   Motivos de los ajustes

Los retaceos cerrados no deberían poder alterarse directamente.

------------------------------------------------------------------------

## 29. Flujo resumido del módulo

``` text
COMPRA INTERNACIONAL
        |
        v
EXPEDIENTE DE IMPORTACIÓN
        |
        +---- Documentos
        +---- Productos
        +---- Gastos
        +---- Impuestos
        |
        v
PEDIDO EN TRÁNSITO
        |
        v
SIMULACIÓN DE RETACEO
        |
        +---- Base de distribución
        +---- Factores
        +---- Costos asignados
        +---- Redondeos
        |
        v
VALIDACIÓN
        |
        v
APROBACIÓN
        |
        v
COSTO FINAL / LANDED COST
        |
        v
ENTRADA A INVENTARIO
        |
        v
CONTABILIZACIÓN
        |
        v
CIERRE Y AUDITORÍA
```

------------------------------------------------------------------------

## 30. Principios de implementación

La implementación del módulo debería respetar los siguientes principios:

1.  **No replicar literalmente el Excel.** El archivo sirve para
    entender el proceso, no como modelo definitivo de datos.

2.  **Registrar cada costo individualmente.** No utilizar únicamente un
    campo genérico de gastos.

3.  **Separar costos capitalizables de impuestos recuperables.**

4.  **Separar FOB, CIF y landed cost.**

5.  **Permitir múltiples métodos de distribución.**

6.  **Calcular con precisión completa y redondear de manera
    controlada.**

7.  **Garantizar matemáticamente que todos los costos distribuidos
    cuadren con sus valores originales.**

8.  **Permitir simulación antes de afectar inventario.**

9.  **Congelar el cálculo aprobado.**

10. **Utilizar ajustes formales para costos posteriores.**

11. **Mantener trazabilidad desde el costo final del producto hasta el
    documento que originó cada gasto.**

12. **Integrar el módulo con Compras, Inventario, Tesorería/Cuentas por
    Pagar y Contabilidad sin acoplar indebidamente las reglas de cada
    dominio.**

------------------------------------------------------------------------

## 31. Resultado esperado

Al finalizar una importación, el ERP debe ser capaz de responder de
forma inequívoca:

-   ¿Cuánto costó la mercancía al proveedor?
-   ¿Cuánto costó traerla?
-   ¿Qué impuestos fueron recuperables?
-   ¿Qué costos se capitalizaron?
-   ¿Cómo se distribuyó cada gasto?
-   ¿Por qué un producto recibió determinado importe?
-   ¿Cuál es el costo total de cada línea?
-   ¿Cuál es el costo unitario?
-   ¿Cuál fue el valor transferido a inventario?
-   ¿Quién calculó y aprobó el retaceo?
-   ¿Hubo ajustes posteriores?
-   ¿Puede reproducirse exactamente el cálculo histórico?

El retaceo debe funcionar, por tanto, como un **motor auditable de
determinación y distribución del costo de importación**, y no
simplemente como una hoja de cálculo trasladada a una pantalla del ERP.

------------------------------------------------------------------------

## 32. Puntos pendientes de definición antes del desarrollo

Antes de diseñar definitivamente las tablas y endpoints deben cerrarse
las siguientes reglas de negocio:

1.  Determinar qué tipos de costos serán capitalizables.
2.  Definir el tratamiento fiscal y contable definitivo del IVA de
    importación.
3.  Validar la base utilizada para el cálculo del IVA mostrada en el
    Excel.
4.  Definir qué conceptos forman parte del CIF.
5.  Definir los métodos de distribución permitidos por tipo de costo.
6.  Determinar si el DAI se obtiene de la póliza, se calcula o se
    registra manualmente.
7.  Definir tratamiento de múltiples monedas y tipos de cambio.
8.  Definir tratamiento de múltiples facturas/proveedores dentro de una
    importación.
9.  Definir tratamiento de recepciones parciales.
10. Definir tratamiento de gastos posteriores al cierre.
11. Definir tratamiento cuando parte del inventario ya fue vendido antes
    de un ajuste.
12. Definir política exacta de redondeo y asignación de residuos.
13. Definir permisos y responsables de cálculo, aprobación y cierre.
14. Definir los asientos contables que deben generarse en cada etapa.

Una vez acordadas estas reglas, el siguiente paso técnico será diseñar
el **modelo de base de datos y el contrato de lógica de negocio del
backend**.
