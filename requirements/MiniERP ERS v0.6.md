# **Mini ERP Comercial para la Gestión de Transacciones Comerciales por Medios Electrónicos** 

Proyecto Integrador de la asignatura: Transacciones Comerciales por Medios Electrónicos 

Versión: 0.6 **Estado:** Borrador **Fecha:** Julio 2026 

**Universidad de Oriente -** Facultad de Arquitectura e Ingeniería 

# **CONTROL DE VERSIONES** 

|**Versión**|**Fecha**|**Autor**|**Descripción**|
|---|---|---|---|
|0.1|Julio 2026|Jaime Guevara|Creación del documento.|
|0.2|Julio 2026|Jaime Guevara|Definición de la arquitectura delproyecto.|
|0.3|Julio 2026|Jaime Guevara|Modulo RBAC.|
|0.4|Julio 2026|Jaime Guevara|Modulo Bitacora|
|0.5|Julio 2026|Jaime Guevara|Empresa,Sucursales,AlmacenesyUbicaciones|
|0.6|Agosto 2026|Jaime Guevara|^rpveedoresycontactos|



1 

# **1. INTRODUCCIÓN** 

## **1.1 Propósito** 

El presente documento especifica los requerimientos funcionales y no funcionales para el desarrollo de un **Mini ERP Comercial** , el cual será construido progresivamente durante el desarrollo de la asignatura **Transacciones Comerciales por Medios Electrónicos** . 

El sistema simulará las operaciones comerciales de una empresa dedicada a la compra, almacenamiento, distribución y venta de productos, integrando los procesos administrativos y operativos mediante una plataforma web segura y escalable. 

Este documento servirá como referencia para el análisis, diseño, desarrollo, pruebas, documentación e implementación del sistema, estableciendo los lineamientos que deberán seguir los estudiantes durante el desarrollo del proyecto. 

## **1.2 Convenciones** 

Para facilitar la lectura del documento se utilizarán las siguientes convenciones: 

|Prefijo|Significado|
|---|---|
|RF|Requerimiento Funcional|
|RN|Regla de Negocio|
|RNF|Requerimiento No Funcional|
|CU|Caso de Uso|
|ER|Entidad Relación|
|API|Interfaz de Programación de Aplicaciones|



## **1.3 Público Objetivo** 

Este documento está dirigido a: 

- Estudiantes del curso. 

- Docente responsable. 

- Analistas de sistemas. 

- Desarrolladores Backend. 

- Desarrolladores Frontend. 

- Diseñadores UX/UI. 

- Equipo de pruebas. 

2 

## **1.4 Definiciones** 

**ERP:** Sistema que integra los procesos administrativos y operativos de una organización. 

**Retaceo:** Proceso mediante el cual se distribuyen costos adicionales de una compra (flete, seguros, impuestos, gastos aduanales, etc.) entre los productos adquiridos para obtener el costo real de cada artículo. 

**RBAC:** Modelo de control de acceso basado en roles. 

**API REST:** Conjunto de servicios que permiten la comunicación entre aplicaciones utilizando HTTP. 

3 

# **2. OBJETIVOS** 

## **2.1 Objetivo General** 

Diseñar e implementar un sistema ERP web que permita administrar los procesos comerciales de una empresa mediante transacciones electrónicas seguras, aplicando principios de ingeniería de software, arquitectura de aplicaciones y buenas prácticas de desarrollo. 

## **2.2 Objetivos Específicos** 

- Gestionar usuarios y controlar el acceso al sistema mediante roles y permisos. 

- Administrar clientes, proveedores y productos. 

- Automatizar el proceso de compras. 

- Gestionar cotizaciones y órdenes de compra. 

- Calcular costos reales mediante procesos de retaceo. 

- Gestionar inventarios distribuidos en múltiples almacenes y sucursales. 

- Administrar procesos de ventas. 

- Controlar devoluciones de clientes. 

- Gestionar el traslado de mercancías entre almacenes. 

- Administrar la flota de vehículos utilizada para la distribución. 

- Registrar todas las acciones realizadas por los usuarios. 

- Generar información para la toma de decisiones mediante reportes e indicadores. 

4 

# **3. ALCANCE DEL SISTEMA** 

El sistema cubrirá los procesos administrativos relacionados con el ciclo comercial de una empresa importadora y distribuidora de productos. 

Los módulos que conforman el sistema serán: 

- Administración de usuarios 

- Gestión de empleados 

- Roles y permisos 

- Auditoría del sistema 

- Clientes 

- Proveedores 

- Productos 

- Compras 

- Retaceo 

- Asignación de precios 

- Inventario 

- Almacenes 

- Sucursales 

- Traslados 

- Cotizaciones 

- Ventas 

- Devoluciones 

- Flota de vehículos 

- Conductores 

- Reportes 

### **Procesos fuera del alcance** 

En esta primera versión no se desarrollarán: 

- Contabilidad. 

- Recursos Humanos. 

- Nómina. 

- Activos Fijos. 

- Producción. 

- CRM. 

- Cuentas por cobrar. 

- Cuentas por pagar. 

- Integración bancaria. 

- Facturación electrónica gubernamental. 

Estos procesos podrán desarrollarse en versiones posteriores del ERP. 

5 

# **4. ACTORES DEL SISTEMA** 

El sistema contará con los siguientes actores principales. 

## **4.1 Administrador del Sistema** 

Responsable de la configuración general del ERP. 

Funciones principales: 

- Crear usuarios. 

- Asignar permisos. 

- Configurar parámetros. 

- Administrar catálogos. 

- Consultar auditoría. 

## **4.2 Gerente General** 

Responsable de supervisar la operación comercial. 

Funciones: 

- Aprobar compras. 

- Aprobar cambios de precio. 

- Consultar indicadores. 

- Consultar reportes. 

## **4.3 Encargado de Compras** 

Responsable del abastecimiento de productos. 

Funciones: 

- Gestionar proveedores. 

- Elaborar cotizaciones de compra. 

- Emitir órdenes de compra. 

- Registrar compras. 

- Ejecutar retaceos. 

6 

## **4.4 Encargado de Inventario** 

Funciones: 

- Crear productos. 

- Administrar almacenes. 

- Gestionar existencias. 

- Realizar traslados. 

- Consultar Kardex. 

## **4.5 Vendedor** 

Funciones: 

- Administrar clientes. 

- Elaborar cotizaciones. 

- Registrar ventas. 

- Gestionar devoluciones. 

## **4.6 Encargado de Logística** 

Funciones: 

- Administrar vehículos. 

- Administrar conductores. 

- Asignar entregas. 

- Controlar despachos. 

7 

# **5. REGLAS DE NEGOCIO** 

**Seguridad** 

**RN-001:** Todo usuario deberá autenticarse antes de acceder al sistema. 

**RN-002:** Cada usuario deberá estar asociado a un empleado. 

**RN-003:** Cada usuario tendrá uno o más roles asignados. 

**RN-004:** Todos los accesos deberán registrarse en la bitácora. 

**RN-005:** Después de cinco intentos fallidos de autenticación el usuario será bloqueado. 

### **Compras** 

**RN-006:** Toda compra deberá estar respaldada por una orden de compra previamente autorizada. 

**RN-007:** Una orden de compra podrá originarse a partir de una cotización de compra. 

**RN-008:** Una orden podrá recibirse parcialmente. 

**RN-009:** Una compra incrementará automáticamente el inventario. 

**RN-010:** No podrá modificarse una compra ya confirmada. 

### **Retaceo** 

**RN-011:** Todo gasto adicional podrá distribuirse proporcionalmente entre los productos adquiridos. 

**RN-012:** El costo final de cada producto será recalculado después del retaceo. 

### **Productos** 

**RN-013:** Cada producto deberá poseer un código único. 

**RN-014:** No podrán eliminarse productos con movimientos históricos. 

### **Inventario** 

**RN-015:** No podrán existir inventarios negativos. 

8 

**RN-016:** Todo movimiento deberá quedar registrado en el Kardex. 

**RN-017:** Cada movimiento de inventario deberá indicar su documento de origen (compra, venta, devolución o traslado). 

### **Ventas** 

**RN-018:** Toda venta deberá disminuir automáticamente las existencias. 

**RN-019:** No podrá venderse un producto sin existencia disponible. 

**RN-020:** Una cotización podrá convertirse en una venta. 

### **Devoluciones** 

RN-021: Toda devolución deberá estar asociada a una venta previamente realizada. 

**RN-022:** Las devoluciones incrementarán nuevamente el inventario cuando el producto sea aceptado. 

### **Auditoría** 

**RN-023:** Toda operación de creación, modificación o eliminación lógica deberá registrarse en la bitácora. 

**RN-024:** Ningún registro histórico podrá eliminarse físicamente del sistema. 

9 

# **6. MODULOS** 

## **6.1. MÓDULO 1. CONTROL DE ACCESO (RBAC)** 

## **6.1.1. Descripción** 

El módulo de Control de Acceso (RBAC - Role Based Access Control) tiene como propósito administrar la autenticación, autorización y control de acceso de los usuarios al Mini ERP. 

La autorización se basa en la asignación de roles a los usuarios y de permisos a los roles, permitiendo que un usuario pueda desempeñar diferentes funciones dentro de la organización sin necesidad de administrar permisos individuales. 

Este módulo constituye el núcleo de seguridad del sistema y será utilizado por todos los módulos del ERP. 

## **6.1.2. Objetivos** 

### **Objetivo General** 

Garantizar que únicamente los usuarios autorizados puedan acceder a los recursos del sistema, aplicando un modelo de seguridad basado en roles y permisos. 

### **Objetivos Específicos** 

- Administrar usuarios del sistema. 

- Administrar roles. 

- Administrar permisos. 

- Asignar múltiples roles a un usuario. 

- Asignar múltiples permisos a un rol. 

- Validar permisos antes de ejecutar cualquier operación. 

- Facilitar la administración de seguridad mediante roles reutilizables. 

- Permitir la escalabilidad del sistema sin modificar el código fuente al agregar nuevos permisos. 

10 

## **6.1.3. Modelo de Datos** 

### **Tabla Users** 

Representa los usuarios que pueden autenticarse en el sistema. 

### Campos 

|Campo|Tipo|Descripción|
|---|---|---|
|id_user|int|Identificador único|
|username|string|Nombre de usuario|
|email|string|Correo electrónico|
|password_hash|string|Contraseña cifrada|
|is_active|boolean|Estado del usuario|
|created_at|datetime|Fecha de creación|



Reglas 

- username debe ser único. 

- email debe ser único. 

- password_hash nunca almacenará la contraseña en texto plano. 

- únicamente usuarios activos podrán iniciar sesión. 

### **Tabla Roles** 

Representa los perfiles de seguridad del sistema. 

Ejemplos: 

- Administrador 

- Gerente 

- Compras 

- Inventario 

Campos 

|Campo|Tipo|
|---|---|
|id_role|int|
|name|string|
|description|text|
|created_at|datetime|



11 

### Reglas 

- No podrán existir dos roles con el mismo nombre. 

### **Tabla Permissions** 

Define todas las acciones disponibles dentro del ERP. 

Cada permiso representa una única operación del sistema. 

Ejemplo 

- users.view 

- users.update 

- users.delete 

- products.view 

- products.create 

- inventory.transfer 

- sales.create 

Campos 

|Campo|Tipo|
|---|---|
|id_permission|string|
|name|string|
|description|text|
|action|string|



Reglas 

- El identificador del permiso deberá ser único. 

### **Tabla Users_Roles** 

Representa la relación muchos a muchos entre usuarios y roles. 

Un usuario podrá tener múltiples roles. 

12 

Campos 

Campo id_user_role id_user id_role assigned_at 

Reglas 

- No podrán existir registros duplicados. 

### **Tabla Roles_Permissions** 

Representa la relación muchos a muchos entre roles y permisos. 

Campos 

Campo id_role_permission id_role id_permission 

Relaciones 

|Tabla Padre|Tabla Hija|Tipo|
|---|---|---|
|Users|Users_Roles|1:N|
|Roles|Users_Roles|1:N|
|Roles|Roles_Permissions|1:N|
|Permissions|Roles_Permissions|1:N|



## **6.1.4. Reglas de Negocio** 

RN-RBAC-001: Todo usuario deberá tener al menos un rol asignado. 

RN-RBAC-002: Un usuario podrá pertenecer a múltiples roles. 

RN-RBAC-003: Los permisos serán heredados mediante los roles. 

RN-RBAC-004: No se asignarán permisos directamente al usuario. 

RN-RBAC-005: Los permisos serán evaluados antes de ejecutar cualquier operación. 

13 

RN-RBAC-006: Los menús del sistema deberán mostrarse únicamente cuando el usuario posea los permisos correspondientes. 

RN-RBAC-007: Las APIs deberán validar permisos independientemente de la interfaz gráfica. 

RN-RBAC-008: Toda modificación de usuarios, roles y permisos deberá registrarse en la bitácora. 

RN-RBAC-009: Los usuarios inactivos no podrán autenticarse. 

RN-RBAC-010; Las contraseñas deberán almacenarse utilizando algoritmos criptográficos seguros (Argon2id o BCrypt). 

## **6.1.5. Procesos del Módulo** 

### **Gestión de Usuarios** 

- Registrar usuario. 

- Editar usuario. 

- Activar usuario. 

- Desactivar usuario. 

- Restablecer contraseña. 

- Cambiar contraseña. 

- Consultar usuarios. 

### **Gestión de Roles** 

- Crear rol. 

- Editar rol. 

- Consultar rol. 

- Eliminar rol (solo si no está asignado). 

- Duplicar rol. 

### **Gestión de Permisos** 

- Crear permiso. 

- Editar permiso. 

- Consultar permiso. 

- Eliminar permiso (si no está asignado). 

### **Asignación Usuario-Rol** 

- Asignar rol. 

- Quitar rol. 

14 

- Consultar roles asignados. 

### **Asignación Rol-Permiso** 

- Agregar permiso. 

- Eliminar permiso. 

- Consultar permisos. 

## **6.1.6  Pantallas del Módulo** 

1. Inicio de sesión. 

2. Gestión de Usuarios. 

3. Gestión de Roles. 

4. Gestión de Permisos. 

5. Asignación de Roles a Usuarios. 

6. Asignación de Permisos a Roles. 

7. Cambio de Contraseña. 

15 

## **6.2 MÓDULO DE BITÁCORA (AUDITORÍA)** 

## **6.2.1 Descripción** 

El módulo de Bitácora tiene como finalidad registrar de manera automática todas las operaciones relevantes realizadas dentro del Mini ERP, proporcionando un mecanismo de auditoría, trazabilidad y control sobre la información del sistema. 

La bitácora constituye un componente transversal, por lo que será utilizada por todos los módulos del ERP para registrar las operaciones ejecutadas por los usuarios. 

Este módulo permitirá conocer: 

- Quién realizó una operación. 

- Cuándo se realizó. 

- Sobre qué módulo se ejecutó. 

- Qué información existía antes del cambio. 

- Qué información quedó después de la modificación. 

- Qué acción fue ejecutada. 

La información registrada en la bitácora será únicamente de consulta y no podrá ser modificada por ningún usuario del sistema. 

## **6.2.2 Objetivos** 

### **Objetivo General** 

Registrar todas las operaciones relevantes realizadas en el sistema para garantizar la trazabilidad, auditoría y seguridad de la información. 

### **Objetivos Específicos** 

- Registrar automáticamente las operaciones CRUD realizadas por los usuarios. 

- Mantener un historial completo de cambios. 

- Facilitar auditorías internas y externas. 

- Permitir la consulta histórica de modificaciones. 

- Proporcionar evidencia de las operaciones ejecutadas en el sistema. 

- Apoyar el análisis de incidentes de seguridad. 

- Cumplir con las buenas prácticas de auditoría de sistemas de información. 

16 

## **6.2.3 Modelo de Datos** 

### **Tabla: logs** 

Representa el historial de operaciones realizadas por los usuarios del sistema. 

|Campo|Tipo|Descripción|
|---|---|---|
|id_log|int|Identificador único del registro de auditoría|
|id_record|int|Identificador del registro afectado|
|controller|string|Módulo o controlador donde ocurrió la operación|
|action|string|Acción ejecutada|
|original_data|json|Información antes de la modificación|
|modified_data|json|Informaciónposterior a la operación|
|id_user|int|Usuarioque realizó la acción|
|created_at|datetime|Fechayhora del evento|



### **Relación de la tabla** 

|Tabla Padre|Tabla Hija|Relación|
|---|---|---|
|users|logs|1:N|



Un usuario puede generar múltiples registros de auditoría. 

## **6.2.4 Descripción de los Campos** 

id_log 

Identificador único del evento registrado. 

id_record 

Corresponde al identificador del registro afectado dentro del módulo correspondiente. 

Ejemplos: 

- id_user 

- id_product 

- id_sale 

- id_purchase 

### controller 

Indica el módulo donde ocurrió la operación. 

17 

### Ejemplos: 

- Users 

- Products 

- Sales 

- Purchases 

- Inventory 

- Warehouses 

- Customers 

- Suppliers 

- Roles 

- Permissions 

### action 

Representa la acción ejecutada por el usuario. 

Valores recomendados: 

- CREATE 

- UPDATE 

- DELETE 

original_data 

Almacena el estado del registro antes de la modificación. 

Ejemplo 

{ "price":25, "stock":100 } 

Cuando la acción sea CREATE este campo permanecerá NULL. 

modified_data 

18 

Almacena el estado del registro después de la operación. 

Ejemplo 

{ "price":28, "stock":95 } 

id_user 

Usuario responsable de la operación. 

created_at 

Fecha y hora exacta del evento. 

La fecha deberá obtenerse desde el servidor para garantizar la integridad de la auditoría. 

## **6.2.5 Reglas de Negocio** 

RN-LOG-001: Todo proceso que cree información deberá generar automáticamente un registro en la bitácora. 

RN-LOG-002: Toda modificación deberá registrar los valores originales y los nuevos valores. 

RN-LOG-003: Las eliminaciones lógicas deberán quedar registradas. 

RN-LOG-004: La bitácora será de solo lectura. No podrá modificarse mediante ninguna opción del sistema. 

RN-LOG-005: Los registros de auditoría no podrán eliminarse desde la aplicación. 

RN-LOG-006: Toda autenticación exitosa deberá registrarse. 

RN-LOG-007: Los cambios de contraseña deberán registrarse sin almacenar la contraseña anterior ni la nueva. 

RN-LOG-008: Las operaciones masivas (importaciones, exportaciones o actualizaciones por lote) deberán generar un registro principal y conservar el detalle correspondiente. 

19 

RN-LOG-009: Los datos almacenados en original_data y modified_data deberán conservar su estructura JSON para facilitar auditorías y análisis posteriores. 

RN-LOG-010: Todos los registros deberán conservar la referencia al usuario responsable mediante id_user. 

## **6.2.6 Operaciones del Módulo:** 

Consulta de Bitácora: Permite visualizar el historial de eventos registrados. 

Consulta por Usuario: Permite visualizar todas las acciones realizadas por un usuario específico. 

Consulta por Módulo: Permite consultar las operaciones realizadas sobre un módulo determinado. 

Consulta por Acción: Permite filtrar registros por tipo de acción. 

Consulta por Rango de Fechas: Permite consultar la actividad realizada dentro de un período determinado. 

Visualización de Cambios: Permite comparar la información original con la información modificada utilizando los campos JSON. 

Exportación: Permite exportar el resultado de las consultas para auditorías internas o externas. 

## **6.2.7 Pantallas del Módulo** 

Consulta General de Bitácora 

Mostrará: 

- Fecha 

- Usuario 

- Módulo 

- Acción 

- Registro afectado 

Detalle del Evento 

Mostrará: 

- Información anterior 

- Información nueva 

- Usuario 

20 

- Fecha 

- Hora 

- Acción 

- • Módulo 

Reporte de Auditoría 

Permitirá aplicar filtros por: 

- Usuario 

- Módulo 

- Acción 

- Fecha inicial 

- Fecha final 

## **6.2.8 Permisos RBAC** 

Permiso Descripción 

logs.view Consultar la bitácora 

logs.detail Consultar el detalle de un evento 

logs.export Exportar registros de auditoría 

No se definen permisos para crear, editar o eliminar registros, ya que estas acciones son automáticas y restringidas por diseño. 

## **6.2.9 Flujo del Proceso** 

Usuario 





El módulo procesa la operación ↓ 

Se obtiene el estado original (si aplica) 



Se genera automáticamente el registro en la tabla logs ↓ 

La información queda ponible para consulta 

21 

## **6.2.10 Validaciones** 

- El usuario debe estar autenticado antes de registrar el evento. 

- El controller debe corresponder a un módulo válido del sistema. 

- La action debe pertenecer al catálogo de acciones permitidas. 

- modified_data será obligatorio para todas las operaciones. 

- original_data será obligatorio en operaciones de actualización, eliminación lógica y restauración. 

- El registro de auditoría se almacenará dentro de la misma transacción de la operación de negocio para asegurar consistencia. 

## **6.2.11 Casos de Uso** 

- **CU-021:** Consultar bitácora general. 

- **CU-022:** Consultar historial de acciones de un usuario. 

- **CU-023:** Consultar cambios realizados sobre un registro específico. 

- **CU-024:** Filtrar eventos por módulo. 

- **CU-025:** Exportar reporte de auditoría. 

- **CU-026:** Comparar datos originales y modificados de una operación. 

## **6.2.12 Criterios de Aceptación** 

- Cada operación de creación, actualización y eliminación lógica genera automáticamente un registro en la tabla logs. 

- La bitácora conserva la referencia al usuario responsable y la fecha del evento. 

- Es posible consultar y filtrar registros por usuario, módulo, acción y rango de fechas. 

- Los datos originales y modificados se muestran de forma estructurada para facilitar la auditoría. 

- Ningún usuario puede editar o eliminar registros de la bitácora desde la aplicación. 

- Las operaciones registradas son consistentes con la información almacenada en los módulos del ERP. 

22 

## **6.3 MÓDULO DE EMPRESAS** 

## **6.3.1 Descripción** 

El módulo de Empresas permite administrar la información legal, tributaria y comercial de las empresas que utilizarán el Mini ERP. 

El sistema soporta una arquitectura **multiempresa** , permitiendo que una misma instalación administre una o varias empresas de manera independiente, cada una con su propia estructura organizacional, sucursales, almacenes y operaciones. 

Cada empresa constituye el nivel superior de la jerarquía organizacional y servirá como base para los módulos de Compras, Ventas, Inventario, Recursos Humanos, Contabilidad y Reportes. 

## **6.3.2 Objetivos** 

### **Objetivo General** 

Administrar la información general, fiscal y de contacto de las empresas registradas en el sistema. 

### **Objetivos Específicos** 

- Registrar empresas. 

- Administrar la información tributaria. 

- Administrar datos comerciales. 

- Gestionar la ubicación geográfica. 

- Administrar el logotipo institucional. 

- Activar o desactivar empresas. 

- Proporcionar la información corporativa utilizada por los demás módulos. 

## **6.3.3 Modelo de Datos** 

### **Tabla companies** 

|**Campo **|**Tipo **|**Descripción**|
|---|---|---|
|id_company|int|Identificador único|
|name|string|Razón social|
|commercial_name|string|Nombre comercial|
|nit|string|Número de Identificación Tributaria|
|nrc|string|Número de Registro de Contribuyente|
|commercial_line_1|string|Giro comercialprincipal|
|commercial_line_2|string|Giro comercial secundario|



23 

|commercial_line_3|string|Giro comercial adicional|
|---|---|---|
|address|string|Dirección|
|id_department|int|Departamento|
|id_municipality|int|Municipio|
|id_district|int|Distrito|
|phone|string|Teléfono|
|email|string|Correo electrónico|
|web_site|string|Sitio web|
|logo|string|Ruta del logotipo|
|is_active|boolean|Estado|



### **Catálogos Auxiliares** 

La dirección de la empresa utilizará los siguientes catálogos de consulta: 

- departments 

- municipalities 

- districts 

Estos catálogos son de solo lectura y no forman parte del mantenimiento del sistema. 

## **6.3.4 Reglas de Negocio** 

**RN-EMP-001:** El NIT deberá ser único. 

**RN-EMP-002:** El NRC deberá ser único. 

**RN-EMP-003:** Toda empresa deberá pertenecer a un departamento, municipio y distrito válidos. 

**RN-EMP-004:** No podrá eliminarse una empresa con sucursales asociadas. 

**RN-EMP-005:** Una empresa inactiva no podrá generar nuevas transacciones. 

**RN-EMP-006:** El logotipo deberá aceptar únicamente formatos de imagen permitidos. 

## **6.3.5 Operaciones** 

- Registrar empresa. 

- Modificar empresa. 

- Consultar empresa. 

24 

- Activar empresa. 

- Desactivar empresa. 

- Actualizar logotipo. 

- Consultar información fiscal. 

## **6.3.6 Pantallas** 

- Listado de empresas. 

- Nueva empresa. 

- Editar empresa. 

- Configuración de empresa. 

## **6.3.7 Permisos RBAC** 

- companies.view 

- companies.create 

- companies.update 

- companies.activate 

- companies.deactivate 

## **6.3.8 Validaciones** 

- Razón social obligatoria. 

- Nombre comercial obligatorio. 

- NIT obligatorio y único. 

- NRC obligatorio y único. 

- Correo electrónico válido. 

- Departamento obligatorio. 

- Municipio obligatorio. 

- Distrito obligatorio. 

- Logo opcional. 

## **6.3.9 Casos de Uso** 

- CU-027 Registrar empresa. 

- CU-028 Modificar empresa. 

- CU-029 Activar o desactivar empresa. 

- CU-030 Consultar información empresarial. 

25 

## **6.3.10 Criterios de Aceptación** 

- El sistema registra correctamente la información legal y comercial de la empresa. 

- No permite duplicidad de NIT ni NRC. 

- Utiliza únicamente departamentos, municipios y distritos válidos. 

- Toda modificación queda registrada en la bitácora. 

- La empresa queda disponible para asociar sucursales. 

26 

## **6.4 MÓDULO DE SUCURSALES** 

## **6.4.1 Descripción** 

El módulo de Sucursales permite administrar las diferentes sedes o establecimientos físicos pertenecientes a una empresa. Cada sucursal representa una unidad operativa desde donde se ejecutan los procesos comerciales, administrativos y logísticos del Mini ERP. 

Las sucursales constituyen el punto de operación para los módulos de Compras, Ventas, Inventario, Traslados, Facturación y Reportes. Una empresa puede poseer una o varias sucursales, mientras que cada sucursal pertenece exclusivamente a una empresa. 

La información geográfica de las sucursales se complementa mediante los catálogos nacionales de departamentos, municipios y distritos, los cuales son de solo lectura. 

## **6.4.2 Objetivos** 

### **Objetivo General** 

Administrar la estructura organizacional de las empresas mediante el registro y mantenimiento de sus sucursales. 

### **Objetivos Específicos** 

- Registrar sucursales por empresa. 

- Administrar la información de contacto de cada sucursal. 

- Definir la ubicación geográfica de las sucursales. 

- Activar o desactivar sucursales. 

- Asociar almacenes a cada sucursal. 

- Servir como punto de referencia para las operaciones del ERP. 

## **6.4.3 Modelo de Datos** 

### **Tabla branches** 

|**Campo **|**Tipo **|**Descripción**|
|---|---|---|
|id_branch|int|Identificador único|
|id_company|int|Empresa a laquepertenece|
|name|string|Nombre de la sucursal|
|address|string|Dirección|
|id_department|int|Departamento|
|id_municipality|int|Municipio|
|id_district|int|Distrito|



27 

|phone|string|Teléfono|
|---|---|---|
|email|string|Correo electrónico|
|is_active|boolean|Estado|



### **Catálogos Auxiliares** 

Las direcciones utilizan las siguientes tablas de consulta: 

- departments 

- municipalities 

- districts 

Estas tablas son administradas externamente y no cuentan con mantenimiento dentro del ERP. 

## **6.4.4 Reglas de Negocio** 

**RN-BRA-001:** Toda sucursal deberá pertenecer a una empresa existente. 

**RN-BRA-002:** Una empresa podrá registrar múltiples sucursales. 

**RN-BRA-003:** No podrá eliminarse una sucursal que tenga almacenes asociados. 

**RN-BRA-004:** Una sucursal inactiva no podrá generar nuevas transacciones. 

**RN-BRA-005:** El nombre de la sucursal deberá ser único dentro de la misma empresa. 

**RN-BRA-006:** Toda sucursal deberá tener una dirección geográfica válida. 

**RN-BRA-007:** Los documentos comerciales (compras, ventas, traslados, devoluciones, etc.) deberán estar asociados a una sucursal. 

## **6.4.5 Operaciones del Módulo** 

### **Gestión de Sucursales** 

- Registrar sucursal. 

- Modificar sucursal. 

- Consultar sucursal. 

- Activar sucursal. 

- Desactivar sucursal. 

- Consultar sucursales por empresa. 

28 

## **6.4.6 Pantallas** 

### **Administración de Sucursales** 

- Listado de sucursales. 

- Nueva sucursal. 

- Editar sucursal. 

- Consulta de sucursales. 

- Estado de sucursales. 

## **6.4.7 Permisos RBAC** 

**Permiso Descripción** branches.view Consultar sucursales branches.create Registrar sucursales branches.update Modificar sucursales branches.activate Activar sucursales branches.deactivate Desactivar sucursales 

## **6.4.8 Validaciones** 

- La empresa debe existir. 

- Nombre obligatorio. 

- Dirección obligatoria. 

- Departamento obligatorio. 

- Municipio obligatorio. 

- Distrito obligatorio. 

- Correo electrónico válido. 

- Teléfono válido. 

- No permitir nombres duplicados dentro de la misma empresa. 

## **6.4.9 Casos de Uso** 

**CU-031:** Registrar sucursal. 

- **CU-032:** Modificar sucursal. 

- **CU-033:** Consultar sucursales por empresa. 

- **CU-034:** Activar o desactivar sucursal. 

29 

## **6.4.10 Criterios de Aceptación** 

- Cada sucursal queda asociada a una empresa existente. 

- El sistema impide registrar nombres duplicados dentro de la misma empresa. 

- No es posible eliminar una sucursal con almacenes asociados. 

- Toda modificación queda registrada en la bitácora. 

- La sucursal queda disponible para la creación de almacenes y para los procesos de compras, ventas e inventario. 

30 

## **6.5 MÓDULO DE ALMACENES Y UBICACIONES** 

## **6.5.1 Descripción** 

El módulo de Almacenes y Ubicaciones permite administrar la estructura física destinada al almacenamiento de productos dentro de cada sucursal. 

Cada sucursal puede contar con uno o varios almacenes, clasificados según su función operativa. A su vez, cada almacén puede dividirse en múltiples ubicaciones físicas (pasillos, estantes, niveles y posiciones), permitiendo una gestión precisa del inventario. 

Este módulo constituye la base para los procesos de recepción de mercancías, almacenamiento, picking, traslados internos, inventarios físicos y despacho de productos. 

## **6.5.2 Objetivos** 

### **Objetivo General** 

Administrar los almacenes y sus ubicaciones físicas para optimizar el control del inventario y la logística de almacenamiento. 

### **Objetivos Específicos** 

- Registrar almacenes por sucursal. 

- Clasificar los almacenes según su función. 

- Administrar ubicaciones físicas. 

- Definir la capacidad de almacenamiento. 

- Facilitar la localización exacta de los productos. 

- Integrar la estructura física con los módulos de inventario y logística. 

## **6.5.3 Modelo de Datos** 

### **Tabla warehouse_category** 

|**Campo **|**Tipo **|**Descripción**|
|---|---|---|
|id_warehouse_category|int|Identificador|
|name|string|Nombre de la categoría|
|description|string|Descripción|



### **Ejemplos de categorías** 

- Producto Terminado 

- Materia Prima 

31 

- Repuestos 

- Devoluciones 

- Cuarentena 

- Producción 

- Consignación 

- Tránsito 

### **Tabla warehouses** 

|**Campo **|**Tipo **|**Descripción**|
|---|---|---|
|id_warehouse|int|Identificador|
|id_branch|int|Sucursal|
|id_warehouse_category|int|Categoría|
|name|string|Nombre|
|description|string|Descripción|
|is_active|boolean|Estado|



### **Tabla locations** 

|**Campo **|**Tipo **|**Descripción**|
|---|---|---|
|id_location|int|Identificador|
|id_warehouse|int|Almacén|
|code|string|Código de ubicación|
|aisle|string|Pasillo|
|rack|string|Estante|
|level|string|Nivel|
|position|string|Posición|
|capacity|int|Capacidad|
|notes|text|Observaciones|
|is_active|boolean|Estado|



## **6.5.4 Reglas de Negocio** 

**RN-WHS-001:** Todo almacén deberá pertenecer a una sucursal. 

**RN-WHS-002:** Todo almacén deberá tener una categoría asignada. 

**RN-WHS-003:** Una sucursal podrá administrar múltiples almacenes. 

**RN-WHS-004:** No podrá eliminarse un almacén que posea inventario registrado. 

**RN-WHS-005:** Toda ubicación deberá pertenecer a un único almacén. 

32 

**RN-WHS-006:** El código de ubicación deberá ser único dentro del almacén. 

**RN-WHS-007:** No podrá desactivarse una ubicación que contenga existencias. 

**RN-WHS-008: l** a capacidad de una ubicación deberá ser mayor que cero. 

**RN-WHS-009:** No podrá existir duplicidad en la combinación Pasillo–Estante–Nivel–Posición dentro del mismo almacén. 

## **6.5.5 Operaciones del Módulo** 

### **Gestión de Categorías** 

- Registrar categoría. 

- Modificar categoría. 

- Consultar categoría. 

- Desactivar categoría. 

### **Gestión de Almacenes** 

- Registrar almacén. 

- Modificar almacén. 

- Consultar almacén. 

- Activar almacén. 

- Desactivar almacén. 

### **Gestión de Ubicaciones** 

- Registrar ubicación. 

- Modificar ubicación. 

- Consultar ubicación. 

- Activar ubicación. 

- Desactivar ubicación. 

## **6.5.6 Pantallas** 

### **Categorías de Almacén** 

- Listado. 

- Nueva categoría. 

- Editar categoría. 

33 

### **Almacenes** 

- Listado de almacenes. 

- Nuevo almacén. 

- Editar almacén. 

- Consulta por sucursal. 

### **Ubicaciones** 

- Listado de ubicaciones. 

- Nueva ubicación. 

- Editar ubicación. 

- Consulta por almacén. 

## **6.5.7 Permisos RBAC** 

### **Categorías** 

- warehouse_categories.view 

- warehouse_categories.create 

- warehouse_categories.update 

- warehouse_categories.deactivate 

### **Almacenes** 

- warehouses.view 

- warehouses.create 

- warehouses.update 

- warehouses.activate 

- warehouses.deactivate 

### **Ubicaciones** 

- locations.view 

- locations.create 

- locations.update 

- locations.activate 

- locations.deactivate 

34 

## **6.5.8 Validaciones** 

### **Categorías** 

- Nombre obligatorio. 

- No permitir categorías duplicadas. 

### **Almacenes** 

- Debe existir la sucursal. 

- Debe existir la categoría. 

- Nombre obligatorio. 

- Nombre único dentro de la sucursal. 

### **Ubicaciones** 

- Código obligatorio. 

- Código único dentro del almacén. 

- Capacidad mayor que cero. 

- No permitir duplicidad de coordenadas físicas (pasillo, estante, nivel y posición). 

## **6.5.9 Casos de Uso** 

- **CU-035:** Registrar categoría de almacén. 

- **CU-036:** Registrar almacén. 

- **CU-037:** Modificar almacén. 

- **CU-038:** Registrar ubicación. 

- **CU-039:** Consultar estructura física de un almacén. 

   - **CU-040:** Activar o desactivar almacenes yh ubicaciones. 

## **6.5.10 Criterios de Aceptación** 

- Cada almacén queda asociado a una sucursal y a una categoría válida. 

- Cada ubicación pertenece a un único almacén. 

- El sistema evita códigos de ubicación duplicados dentro del mismo almacén. 

- No permite eliminar almacenes con inventario ni desactivar ubicaciones con existencias. 

- La estructura física queda disponible para los módulos de Inventario, Compras, Ventas, Recepción, Picking y Traslados. 

- Todas las operaciones de mantenimiento generan automáticamente su correspondiente registro en la bitácora del sistema. 

35 

# **6.6 MÓDULO DE PROVEEDORES Y CONTACTOS DE PROVEEDORES** 

## **6.6.1 Descripción** 

El módulo de Proveedores permite administrar la información de las empresas o personas que suministran bienes y servicios a las empresas registradas en el Mini ERP. 

- El módulo será utilizado principalmente por los procesos de **Cotizaciones de Compra, Órdenes de Compra y Compras** , permitiendo mantener un catálogo centralizado de proveedores y sus datos de contacto.suplll 

Cada proveedor podrá contar con uno o varios contactos, permitiendo identificar a las personas responsables de atender las operaciones comerciales, cotizaciones, órdenes de compra y demás comunicaciones relacionadas con el proceso de abastecimiento. 

La información de los proveedores será reutilizada por los módulos de compras y abastecimiento, evitando la duplicación de datos. 

## **6.6.2 Objetivos** 

### **Objetivo General** 

Administrar la información comercial y de contacto de los proveedores que participan en las operaciones de abastecimiento del Mini ERP. 

### **Objetivos Específicos** 

- Registrar proveedores. 

- Administrar información general y comercial. 

- Mantener información de contacto. 

- Registrar múltiples contactos por proveedor. 

- Activar o desactivar proveedores. 

- Activar o desactivar contactos. 

- Facilitar la selección de proveedores durante los procesos de compras. 

- Mantener el historial de las operaciones relacionadas con proveedores. 

36 

## **6.6.3 Modelo de Datos** 

El módulo está compuesto por dos tablas principales: 

- suppliers 

- suppliers_contacts 

### **Tabla suppliers** 

Representa el catálogo principal de proveedores. 

|**Campo **|**Tipo **|**Descripción**|
|---|---|---|
|id_supplier|int|Identificador único delproveedor|
|code|string|Código interno delproveedor|
|name|string|Nombre o razón social|
|country|int|País delproveedor|
|address|string|Dirección|
|phone|string|Teléfonoprincipal|
|email|string|Correo electrónicoprincipal|
|website|string|Sitio web|
|is_active|boolean|Estado delproveedor|



### **Tabla suppliers_contacts** 

Almacena las personas de contacto asociadas a un proveedor. 

|**Campo **|**Tipo **|**Descripción**|
|---|---|---|
|id_supplier_contact|int|Identificador del contacto|
|id_supplier|int|Proveedor alquepertenece|
|full_name|string|Nombre completo del contacto|
|phone|string|Teléfono del contacto|
|email|string|Correo electrónico|
|is_active|boolean|Estado del contacto|



## **6.6.4 Reglas de Negocio** 

**RN-SUP-001:** Cada proveedor deberá tener un identificador único. 

**RN-SUP-002:** El código interno del proveedor deberá ser único. 

**RN-SUP-003:** El nombre o razón social del proveedor será obligatorio. 

**RN-SUP-004:** Un proveedor podrá tener múltiples contactos. 

37 

**RN-SUP-005:** Cada contacto deberá pertenecer a un proveedor existente. 

**RN-SUP-006:** Un contacto inactivo no deberá aparecer como contacto disponible durante una operación de compra. 

**RN-SUP-007:** Un proveedor inactivo no podrá ser seleccionado para nuevas cotizaciones, órdenes de compra o compras. 

**RN-SUP-008:** No deberá eliminarse físicamente un proveedor que tenga operaciones comerciales asociadas. 

**RN-SUP-009:** Cuando un proveedor deje de utilizarse, deberá desactivarse mediante el campo is_active. 

**RN-SUP-010:** Cuando un contacto deje de trabajar con el proveedor, deberá desactivarse sin eliminar su historial. 

**RN-SUP-011:** El correo electrónico deberá cumplir con un formato válido cuando sea proporcionado. 

**RN-SUP-012:** El sitio web deberá validarse como una dirección web cuando sea proporcionado. 

**RN-SUP-013:** Toda creación, modificación, activación o desactivación deberá quedar registrada en la bitácora. 

## **6.6.5 Gestión de Proveedores** 

El sistema deberá permitir las siguientes operaciones: 

- Registrar proveedor. 

- Modificar proveedor. 

- Consultar proveedor. 

- Buscar proveedor. 

- Filtrar proveedores activos. 

- Activar proveedor. 

- Desactivar proveedor. 

- Consultar contactos. 

- Consultar historial de operaciones. 

- Asociar contactos. 

- Consultar compras realizadas al proveedor. 

38 

## **6.6.6 Gestión de Contactos** 

Para cada proveedor se permitirá: 

- Registrar contacto. 

- Modificar contacto. 

- Consultar contacto. 

- Activar contacto. 

- Desactivar contacto. 

- Buscar contacto. 

- Consultar contactos activos. 

- Consultar historial de contactos. 

## **6.6.7 Pantallas del Módulo** 

### **Pantalla de Proveedores** 

La pantalla principal deberá mostrar como mínimo: 

**Columna** Código Proveedor País Teléfono Correo Estado Acciones 

Las acciones podrán incluir: 

- Ver 

- Editar 

- Activar 

- Desactivar 

- Contactos 

- Historial 

### **Pantalla de Registro de Proveedor** 

Campos: 

- Código 

- Nombre 

39 

- País 

- Dirección 

- Teléfono 

- Correo electrónico 

- Sitio web 

- Estado 

### **Pantalla de Contactos** 

Permitirá visualizar los contactos asociados al proveedor seleccionado. 

**Columna** Nombre Teléfono Correo Estado Acciones 

### **Pantalla de Registro de Contacto** 

Campos: 

- Nombre completo 

- Teléfono 

- Correo electrónico 

- Estado 

El proveedor será obtenido automáticamente desde el contexto de la pantalla. 

## **6.6.8 Permisos RBAC** 

### **Proveedores** 

|**Permiso**|**Descripción**|
|---|---|
|suppliers.view|Consultarproveedores|
|suppliers.create|Registrarproveedores|
|suppliers.update|Modificarproveedores|
|suppliers.activate|Activarproveedores|
|suppliers.deactivate|Desactivarproveedores|



40 

### **Contactos** 

|**Permiso**|**Descripción**|
|---|---|
|supplier_contacts.view|Consultar contactos|
|supplier_contacts.create|Registrar contactos|
|supplier_contacts.update|Modificar contactos|
|supplier_contacts.activate|Activar contactos|
|supplier_contacts.deactivate|Desactivar contactos|



## **6.6.9 Validaciones** 

### **Proveedor** 

El sistema deberá validar: 

- Código obligatorio. 

- Código único. 

- Nombre obligatorio. 

- País obligatorio. 

- Correo electrónico válido. 

- Sitio web válido, cuando sea proporcionado. 

- Teléfono válido, cuando sea proporcionado. 

- No permitir proveedores duplicados según los criterios definidos por el negocio. 

### **Contacto** 

El sistema deberá validar: 

- Proveedor obligatorio. 

- Proveedor existente. 

- Nombre completo obligatorio. 

- Correo electrónico válido, cuando sea proporcionado. 

- Teléfono válido, cuando sea proporcionado. 

## **6.6.10 Integración con Otros Módulos** 

El módulo de Proveedores tendrá relación directa con los siguientes módulos: 

**Cotizaciones de Compra:** Permite seleccionar proveedores para solicitar precios de productos. 

**Órdenes de Compra:** Permite generar órdenes dirigidas a un proveedor específico. 

**Compras:** Permite identificar el proveedor que suministró los productos. 

41 

**Retaceo:** Permite relacionar los costos adicionales con las compras correspondientes. 

**Productos** : permitirá posteriormente asociar productos con proveedores, si se incorpora esta relación al modelo de datos. 

**Bitácora:** Todas las operaciones realizadas sobre proveedores y contactos serán auditadas. 

## **6.6.11 Casos de Uso** 

**CU-041:** Registrar proveedor. 

**CU-042:** Modificar proveedor. 

**CU-043:** Consultar proveedores. 

**CU-044:** Activar proveedor. 

**CU-045:** Desactivar proveedor. 

**CU-046:** Registrar contacto de proveedor. 

**CU-047:** Modificar contacto. 

**CU-048:** Activar o desactivar contacto. 

**CU-049:** Consultar contactos de proveedor. 

## **6.6.12 Criterios de Aceptación** 

**CA-SUP-001:** El sistema deberá permitir registrar proveedores con la información definida en suppliers. 

**CA-SUP-002:** El código del proveedor no podrá repetirse. 

**CA-SUP-003:** El sistema deberá permitir registrar múltiples contactos para un mismo proveedor. 

**CA-SUP-004:** Un contacto no podrá registrarse sin estar asociado a un proveedor existente. 

**CA-SUP-005:** Los proveedores inactivos no deberán aparecer como opciones disponibles para nuevas operaciones de compra. 

42 

**CA-SUP-006:** Los contactos inactivos no deberán aparecer como contactos disponibles en las operaciones comerciales. 

**CA-SUP-007:** El sistema deberá conservar la información histórica de proveedores que hayan participado en operaciones comerciales. 

**CA-SUP-008:** Toda modificación realizada sobre proveedores o contactos deberá registrarse automáticamente en la bitácora. 

**CA-SUP-009:** El sistema deberá permitir consultar los contactos directamente desde la información del proveedor. 

**CA-SUP-010:** El módulo deberá proporcionar información de proveedores para su utilización en **Cotizaciones de Compra, Órdenes de Compra y Compras** . 

43 

