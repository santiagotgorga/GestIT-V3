# GestIT — Casos de prueba de V3

Testing de Aplicaciones · UADE · Grupo 12

> Casos **nuevos** de V3: confirmación de los defectos de V2 (TC‑49 a TC‑56) y casos de las HU nuevas o
> modificadas (TC‑57 a TC‑82). Se ejecutan **manualmente** (consigna de la Entrega 03). La misma información
> está en la planilla `TPO - TC and Defect Template GRUPO12 - V3.xlsx`, una hoja por caso.

Los datos iniciales son los de la sección 2.2 de los requerimientos. Antes de cada caso conviene restaurar los
datos con `POST /api/test/reset` (RNF‑09), salvo que el caso diga otra cosa.

## Resumen

| TC | Descripción | HU | Tipo | Técnica | Prioridad |
|---|---|---|---|---|---|
| TC-49 | Confirmación BUG-02: ?next= con barra invertida o tabulación no sale del sistema. | HU-01 | Confirmación | Predicción de errores (variantes de URL) | High |
| TC-50 | Confirmación BUG-03: con sesión iniciada, GET /?next=/\dominio no redirige afuera. | HU-01, HU-18 | Confirmación | Predicción de errores | High |
| TC-51 | Confirmación BUG-04: el CSV no ejecuta fórmulas en Excel. | HU-19, HU-04 | Confirmación | Predicción de errores (CSV injection) | Normal |
| TC-52 | Confirmación BUG-05: la entrega rechaza empleadoId con tipos no numéricos. | HU-15 | Confirmación | Partición de equivalencias (clases inválidas por tipo) | Normal |
| TC-53 | Confirmación BUG-06: 5 intentos fallidos bloquean al usuario. | HU-01, HU-11 | Confirmación | Valores límite (4, 5 y 6 intentos) | High |
| TC-54 | Confirmación BUG-07: el servidor recorta los espacios del usuario. | HU-01 | Confirmación | Partición de equivalencias | Low |
| TC-55 | Confirmación BUG-08: los emojis cuentan como un carácter. | HU-04 | Confirmación | Valores límite + partición (caracteres no ASCII) | Low |
| TC-56 | Confirmación OBS-01: el N° de serie debe tener al menos una letra o un número. | HU-04 | Confirmación | Partición de equivalencias (clase inválida) | Low |
| TC-57 | Un login correcto pone en 0 el contador de intentos fallidos. | HU-01 | Nuevo V3 | Transición de estados (contador) | Normal |
| TC-58 | Un usuario inexistente nunca se bloquea ni revela que no existe. | HU-01 | Nuevo V3 | Predicción de errores (enumeración de usuarios) | Normal |
| TC-59 | Editar el modelo de un equipo. | HU-05 | Nuevo V3 | Caso de uso (flujo principal) | High |
| TC-60 | Edición: N° de serie duplicado con otro equipo; el propio se acepta. | HU-05 | Nuevo V3 | Partición de equivalencias + predicción de errores | High |
| TC-61 | Edición: valores límite de Marca (1, 2, 50 y 51). | HU-05 | Nuevo V3 | Valores límite | Normal |
| TC-62 | No se puede editar un equipo dado de baja. | HU-05, HU-09 | Nuevo V3 | Transición de estados (estado terminal) | High |
| TC-63 | La edición ignora los campos no editables enviados por API. | HU-05 | Nuevo V3 | Predicción de errores (API) | Normal |
| TC-64 | Guardar sin cambios muestra "No hay cambios para guardar." | HU-05 | Nuevo V3 | Partición de equivalencias | Low |
| TC-65 | Alta válida de usuario y primer ingreso. | HU-11 | Nuevo V3 | Caso de uso (flujo principal) | High |
| TC-66 | Usuario: valores límite y formato. | HU-11 | Nuevo V3 | Valores límite + partición de equivalencias | Normal |
| TC-67 | Contraseña: particiones de equivalencia y límite de 8. | HU-11 | Nuevo V3 | Partición de equivalencias + valores límite | Normal |
| TC-68 | Usuario duplicado sin distinguir mayúsculas. | HU-11 | Nuevo V3 | Predicción de errores | Normal |
| TC-69 | Protección del último Administrador y de uno mismo. | HU-11 | Nuevo V3 | Tabla de decisión (es uno mismo × admins activos) | High |
| TC-70 | Usuario desactivado: no ingresa y su sesión abierta deja de valer. | HU-11 | Nuevo V3 | Transición de estados (Activo → Inactivo) | High |
| TC-71 | El Administrador desbloquea a un usuario bloqueado. | HU-11 | Nuevo V3 | Transición de estados (Bloqueado → Activo) | Normal |
| TC-72 | El Operador no accede a Usuarios y la API nunca devuelve contraseñas. | HU-11, HU-03 | Nuevo V3 | Tabla de decisión (rol × acción) | High |
| TC-73 | Un cambio de rol se aplica en la siguiente acción del usuario. | HU-11, HU-03 | Nuevo V3 | Tabla de decisión (rol antes × después) | Normal |
| TC-74 | El alta de un equipo queda en la auditoría. | HU-12, HU-04 | Nuevo V3 | Caso de uso | High |
| TC-75 | Un login fallido se registra sin la contraseña. | HU-12, HU-01 | Nuevo V3 | Predicción de errores (datos sensibles) | High |
| TC-76 | Las operaciones rechazadas no generan registro. | HU-12 | Nuevo V3 | Partición de equivalencias (operación válida / rechazada) | Normal |
| TC-77 | Paginación de 20 registros (20 y 21). | HU-12 | Nuevo V3 | Valores límite (20 / 21 registros) | Normal |
| TC-78 | Filtros combinados de acción y usuario. | HU-12 | Nuevo V3 | Tabla de decisión (filtros) | Normal |
| TC-79 | Filtro de fechas: mismo día e intervalo invertido. | HU-12 | Nuevo V3 | Valores límite (fechas) + partición | Normal |
| TC-80 | El registro de auditoría es inmutable. | HU-12 | Nuevo V3 | Predicción de errores (API) | High |
| TC-81 | El Operador no accede a la auditoría. | HU-12, HU-03 | Nuevo V3 | Tabla de decisión (rol × acción) | High |
| TC-82 | La edición de un equipo queda auditada con antes y después. | HU-12, HU-05 | Nuevo V3 | Caso de uso | Normal |

**Total: 34 casos** (8 de confirmación y 26 nuevos de V3).

## TC-49 · Confirmación BUG-02: ?next= con barra invertida o tabulación no sale del sistema.

- **HU cubiertas:** HU-01 · **Prioridad:** High · **Tipo:** Confirmación
- **Técnica de diseño:** Predicción de errores (variantes de URL)
- **Prerrequisitos:** Sin sesión iniciada. Datos de prueba restaurados (POST /api/test/reset).
- **Datos de prueba:** `next = /\example.com` · `next = /%09/example.com` · `next = https://example.com` · `next = javascript:alert(1)`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir http://localhost:3000/?next=/%5Cexample.com e iniciar sesión como admin. | Se llega al listado de equipos (/dashboard), no a example.com. |
| 2 | Cerrar sesión. Abrir /?next=/%09/example.com e iniciar sesión. | Se llega al listado de equipos. |
| 3 | Cerrar sesión. Abrir /?next=https://example.com e iniciar sesión. | Se llega al listado de equipos. |
| 4 | Cerrar sesión. Abrir /?next=javascript:alert(1) e iniciar sesión. | Se llega al listado; no se ejecuta ningún script. |
| 5 | Cerrar sesión. Abrir /?next=/equipo.html?codigo=EQ-00002 e iniciar sesión. | Se llega a la ficha de EQ-00002 (la redirección interna sigue funcionando). |

## TC-50 · Confirmación BUG-03: con sesión iniciada, GET /?next=/\dominio no redirige afuera.

- **HU cubiertas:** HU-01, HU-18 · **Prioridad:** High · **Tipo:** Confirmación
- **Técnica de diseño:** Predicción de errores
- **Prerrequisitos:** Usuario logueado como Administrador (admin / admin123).
- **Datos de prueba:** `next = /\example.com` · `next = /equipo.html?codigo=EQ-00002`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Con la sesión iniciada, abrir en la misma pestaña http://localhost:3000/?next=/%5Cexample.com. | Se muestra el listado de equipos; la URL sigue en localhost. |
| 2 | Abrir http://localhost:3000/?next=/equipo.html?codigo=EQ-00002. | Se abre la ficha de EQ-00002. |

## TC-51 · Confirmación BUG-04: el CSV no ejecuta fórmulas en Excel.

- **HU cubiertas:** HU-19, HU-04 · **Prioridad:** Normal · **Tipo:** Confirmación
- **Técnica de diseño:** Predicción de errores (CSV injection)
- **Prerrequisitos:** Usuario logueado como Operador (operador / operador123). Módulo Identificación física activo.
- **Datos de prueba:** `Marca = =HYPERLINK("http://x","x")` · `Modelo = Modelo X` · `Serie = CSV-0001` · `Categoría = PC`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Crear el equipo con los datos de prueba. | Se crea el equipo (EQ-00006). |
| 2 | Buscar CSV-0001 y hacer clic en Exportar CSV. | Se descarga gestit_equipos_AAAAMMDD.csv. |
| 3 | Abrir el archivo con un editor de texto. | La marca aparece como '=HYPERLINK(...) (con apóstrofo adelante). |
| 4 | Abrir el archivo en Excel. | La celda se ve como texto; no hay un link ni una fórmula ejecutada. |

## TC-52 · Confirmación BUG-05: la entrega rechaza empleadoId con tipos no numéricos.

- **HU cubiertas:** HU-15 · **Prioridad:** Normal · **Tipo:** Confirmación
- **Técnica de diseño:** Partición de equivalencias (clases inválidas por tipo)
- **Prerrequisitos:** Usuario logueado como Operador (operador / operador123). Cookie de sesión disponible para llamar a la API.
- **Datos de prueba:** `empleadoId = true` · `empleadoId = "0x2"` · `empleadoId = 1.5` · `empleadoId = "2abc"` · `empleadoId = 2 (válido)`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | POST /api/equipos/EQ-00002/entrega con {"empleadoId": true}. | HTTP 400 "Seleccioná un empleado."; EQ-00002 sigue Disponible. |
| 2 | Repetir con "0x2", 1.5 y "2abc". | HTTP 400 en los tres casos; no se genera ninguna acta. |
| 3 | Repetir con 2. | HTTP 201; acta AE-000002; EQ-00002 Asignado a Pérez, Carlos. |

## TC-53 · Confirmación BUG-06: 5 intentos fallidos bloquean al usuario.

- **HU cubiertas:** HU-01, HU-11 · **Prioridad:** High · **Tipo:** Confirmación
- **Técnica de diseño:** Valores límite (4, 5 y 6 intentos)
- **Prerrequisitos:** Sin sesión iniciada. Datos de prueba restaurados (POST /api/test/reset).
- **Datos de prueba:** `Usuario = operador` · `Contraseña incorrecta = x` · `Contraseña correcta = operador123`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Intentar ingresar 4 veces con operador / x. | Las 4 veces: "Usuario o contraseña incorrectos." |
| 2 | Intentar por 5.ª vez con operador / x. | "Usuario bloqueado por intentos fallidos. Intentá más tarde o contactá a un Administrador." |
| 3 | Intentar con operador / operador123. | Mismo mensaje de bloqueo: no se puede entrar aunque la contraseña sea correcta. |

## TC-54 · Confirmación BUG-07: el servidor recorta los espacios del usuario.

- **HU cubiertas:** HU-01 · **Prioridad:** Low · **Tipo:** Confirmación
- **Técnica de diseño:** Partición de equivalencias
- **Prerrequisitos:** Sin sesión iniciada.
- **Datos de prueba:** `usuario = " admin "` · `password = admin123`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | POST /api/login con {"usuario":" admin ","password":"admin123"}. | HTTP 200 "Login correcto." |

## TC-55 · Confirmación BUG-08: los emojis cuentan como un carácter.

- **HU cubiertas:** HU-04 · **Prioridad:** Low · **Tipo:** Confirmación
- **Técnica de diseño:** Valores límite + partición (caracteres no ASCII)
- **Prerrequisitos:** Usuario logueado como Operador (operador / operador123).
- **Datos de prueba:** `Marca = 30 × 💻 (válida)` · `Marca = 51 × 💻 (inválida)` · `Modelo = Modelo` · `Categoría = PC`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Alta con Marca de 30 emojis, Serie EMO-0001. | Se crea el equipo. |
| 2 | Alta con Marca de 51 emojis, Serie EMO-0002. | "La marca debe tener entre 2 y 50 caracteres." y no se crea. |

## TC-56 · Confirmación OBS-01: el N° de serie debe tener al menos una letra o un número.

- **HU cubiertas:** HU-04 · **Prioridad:** Low · **Tipo:** Confirmación
- **Técnica de diseño:** Partición de equivalencias (clase inválida)
- **Prerrequisitos:** Usuario logueado como Operador (operador / operador123).
- **Datos de prueba:** `Serie = ----` · `Serie = A---`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Alta con Serie "----". | "El número de serie debe contener al menos una letra o un número." y no se crea. |
| 2 | Alta con Serie "A---". | Se crea el equipo. |

## TC-57 · Un login correcto pone en 0 el contador de intentos fallidos.

- **HU cubiertas:** HU-01 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Transición de estados (contador)
- **Prerrequisitos:** Sin sesión iniciada. Datos de prueba restaurados (POST /api/test/reset).
- **Datos de prueba:** `Usuario = operador`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Ingresar 4 veces con operador / x. | 4 veces "Usuario o contraseña incorrectos." |
| 2 | Ingresar con operador / operador123 y cerrar sesión. | Entra al listado. |
| 3 | Ingresar 4 veces más con operador / x. | Siguen siendo errores normales (401), sin bloqueo. |

## TC-58 · Un usuario inexistente nunca se bloquea ni revela que no existe.

- **HU cubiertas:** HU-01 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Predicción de errores (enumeración de usuarios)
- **Prerrequisitos:** Sin sesión iniciada.
- **Datos de prueba:** `Usuario = juan` · `Contraseña = x`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Intentar ingresar 10 veces con juan / x. | Las 10 veces: "Usuario o contraseña incorrectos." (nunca el mensaje de bloqueo). |

## TC-59 · Editar el modelo de un equipo.

- **HU cubiertas:** HU-05 · **Prioridad:** High · **Tipo:** Nuevo V3
- **Técnica de diseño:** Caso de uso (flujo principal)
- **Prerrequisitos:** Usuario logueado como Operador (operador / operador123). Datos de prueba restaurados (POST /api/test/reset).
- **Datos de prueba:** `Equipo = EQ-00001` · `Modelo nuevo = Latitude 5430`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | En el listado, hacer clic en Editar de EQ-00001. | Se abre "Editar equipo EQ-00001" con los datos actuales precargados. |
| 2 | Cambiar el Modelo a Latitude 5430 y Guardar cambios. | "Equipo EQ-00001 actualizado correctamente." |
| 3 | Abrir la ficha de EQ-00001. | Modelo Latitude 5430; código y estado sin cambios; el historial de estados no agrega filas. |

## TC-60 · Edición: N° de serie duplicado con otro equipo; el propio se acepta.

- **HU cubiertas:** HU-05 · **Prioridad:** High · **Tipo:** Nuevo V3
- **Técnica de diseño:** Partición de equivalencias + predicción de errores
- **Prerrequisitos:** Usuario logueado como Operador (operador / operador123). Datos de prueba restaurados (POST /api/test/reset).
- **Datos de prueba:** `Equipo = EQ-00001 (serie DL001)` · `Serie LN001 (de EQ-00002)` · `Serie " ln001 "` · `Serie DL001 (propia)`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Editar EQ-00001 con Serie LN001 y guardar. | "Ya existe un equipo con ese número de serie." debajo del campo; no se guarda. |
| 2 | Probar con " ln001 ". | Mismo error (ignora mayúsculas y espacios). |
| 3 | Dejar DL001, cambiar las Observaciones y guardar. | Se guarda: el equipo no choca consigo mismo. |

## TC-61 · Edición: valores límite de Marca (1, 2, 50 y 51).

- **HU cubiertas:** HU-05 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Valores límite
- **Prerrequisitos:** Usuario logueado como Operador (operador / operador123). Datos de prueba restaurados (POST /api/test/reset).
- **Datos de prueba:** `Equipo = EQ-00002` · `Marca = 1, 2, 50 y 51 caracteres`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Editar EQ-00002 con Marca de 1 carácter. | "La marca debe tener entre 2 y 50 caracteres." |
| 2 | Con 2 caracteres. | Se guarda. |
| 3 | Con 50 caracteres. | Se guarda. |
| 4 | Con 51 caracteres. | Error y no se guarda. |

## TC-62 · No se puede editar un equipo dado de baja.

- **HU cubiertas:** HU-05, HU-09 · **Prioridad:** High · **Tipo:** Nuevo V3
- **Técnica de diseño:** Transición de estados (estado terminal)
- **Prerrequisitos:** Usuario logueado como Administrador (admin / admin123). EQ-00003 dado de baja.
- **Datos de prueba:** `Equipo = EQ-00003`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Marcar "Incluir dados de baja" y mirar la fila de EQ-00003. | "Sin acciones": no aparece Editar. |
| 2 | PATCH /api/equipos/EQ-00003 con {"marca":"Samsung2"}. | HTTP 409 "No se puede editar un equipo dado de baja." |

## TC-63 · La edición ignora los campos no editables enviados por API.

- **HU cubiertas:** HU-05 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Predicción de errores (API)
- **Prerrequisitos:** Usuario logueado como Operador (operador / operador123). Cookie de sesión disponible para llamar a la API.
- **Datos de prueba:** `{"estado":"Disponible","codigo":"EQ-99999","marca":"Dell"} sobre EQ-00004`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | PATCH /api/equipos/EQ-00004 con el cuerpo de los datos de prueba. | HTTP 200; solo cambia la marca. |
| 2 | Abrir la ficha de EQ-00004. | Sigue En reparación y con el código EQ-00004. |

## TC-64 · Guardar sin cambios muestra "No hay cambios para guardar."

- **HU cubiertas:** HU-05 · **Prioridad:** Low · **Tipo:** Nuevo V3
- **Técnica de diseño:** Partición de equivalencias
- **Prerrequisitos:** Usuario logueado como Operador (operador / operador123).
- **Datos de prueba:** `Equipo = EQ-00001`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir Editar de EQ-00001 y hacer clic en Guardar cambios sin modificar nada. | "No hay cambios para guardar."; no se registra nada en la auditoría. |

## TC-65 · Alta válida de usuario y primer ingreso.

- **HU cubiertas:** HU-11 · **Prioridad:** High · **Tipo:** Nuevo V3
- **Técnica de diseño:** Caso de uso (flujo principal)
- **Prerrequisitos:** Usuario logueado como Administrador (admin / admin123). Datos de prueba restaurados (POST /api/test/reset).
- **Datos de prueba:** `Usuario = tecnico1` · `Nombre = Técnico Uno` · `Rol = Operador` · `Contraseña = clave1234`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Menú Usuarios → + Nuevo usuario; completar los datos y Crear usuario. | "Usuario tecnico1 creado correctamente."; aparece Activo con rol Operador. |
| 2 | Cerrar sesión e ingresar con tecnico1 / clave1234. | Entra al listado; el encabezado muestra "Técnico Uno" y "Operador". |

## TC-66 · Usuario: valores límite y formato.

- **HU cubiertas:** HU-11 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Valores límite + partición de equivalencias
- **Prerrequisitos:** Usuario logueado como Administrador (admin / admin123).
- **Datos de prueba:** `ab (2)` · `abc (3)` · `20 caracteres` · `21 caracteres` · `Tecnico (mayúscula)`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Crear usuario "ab". | "El usuario debe tener entre 3 y 20 caracteres (minúsculas, números, . o _)." |
| 2 | Crear "abc". | Se crea. |
| 3 | Crear uno de 20 caracteres. | Se crea. |
| 4 | Crear uno de 21 caracteres. | Error. |
| 5 | Crear "Tecnico". | Error (solo minúsculas). |

## TC-67 · Contraseña: particiones de equivalencia y límite de 8.

- **HU cubiertas:** HU-11 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Partición de equivalencias + valores límite
- **Prerrequisitos:** Usuario logueado como Administrador (admin / admin123).
- **Datos de prueba:** `clave12 (7)` · `clave123 (8)` · `clavelarga (sin números)` · `12345678 (sin letras)`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Crear un usuario con contraseña "clave12". | "La contraseña debe tener entre 8 y 50 caracteres, con al menos una letra y un número." |
| 2 | Con "clave123". | Se crea. |
| 3 | Con "clavelarga". | Error. |
| 4 | Con "12345678". | Error. |

## TC-68 · Usuario duplicado sin distinguir mayúsculas.

- **HU cubiertas:** HU-11 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Predicción de errores
- **Prerrequisitos:** Usuario logueado como Administrador (admin / admin123). Cookie de sesión disponible para llamar a la API.
- **Datos de prueba:** `usuario = "ADMIN" (API)` · `usuario = "admin"`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Crear el usuario "admin" desde la pantalla. | "Ya existe un usuario con ese nombre." |
| 2 | POST /api/usuarios con usuario "ADMIN". | HTTP 400 (formato: solo minúsculas). No se crea. |

## TC-69 · Protección del último Administrador y de uno mismo.

- **HU cubiertas:** HU-11 · **Prioridad:** High · **Tipo:** Nuevo V3
- **Técnica de diseño:** Tabla de decisión (es uno mismo × admins activos)
- **Prerrequisitos:** Usuario logueado como Administrador (admin / admin123). Cookie de sesión disponible para llamar a la API. Datos de prueba restaurados (POST /api/test/reset).
- **Datos de prueba:** `Usuario objetivo = admin (único Administrador)`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | En Usuarios, mirar la fila de admin. | Muestra "Tu usuario" sin botones. |
| 2 | PATCH /api/usuarios/admin con {"rol":"Operador"}. | HTTP 409 "No podés modificar tu propio rol o estado." |
| 3 | Crear admin2 (Administrador), ingresar como admin2 y pasar a admin a Operador. | Se permite (quedan 2 → 1 Administrador activo). |
| 4 | Como admin2, intentar desactivar a admin2 por API. | HTTP 409 (es uno mismo). |

## TC-70 · Usuario desactivado: no ingresa y su sesión abierta deja de valer.

- **HU cubiertas:** HU-11 · **Prioridad:** High · **Tipo:** Nuevo V3
- **Técnica de diseño:** Transición de estados (Activo → Inactivo)
- **Prerrequisitos:** Dos navegadores: A con admin, B con operador (sesión abierta).
- **Datos de prueba:** `Usuario = operador`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | En A: Usuarios → Desactivar operador → confirmar. | operador queda Inactivo. |
| 2 | En B: hacer clic en cualquier acción (por ejemplo, recargar el listado). | La sesión ya no vale: vuelve al login. |
| 3 | En B: ingresar con operador / operador123. | "Usuario o contraseña incorrectos." |
| 4 | En A: Activar operador. En B: ingresar de nuevo. | Entra. |

## TC-71 · El Administrador desbloquea a un usuario bloqueado.

- **HU cubiertas:** HU-11 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Transición de estados (Bloqueado → Activo)
- **Prerrequisitos:** operador bloqueado (5 intentos fallidos). Otro navegador con admin.
- **Datos de prueba:** `Usuario = operador`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Como admin, abrir Usuarios. | operador aparece con estado "Bloqueado" y el botón Desbloquear. |
| 2 | Hacer clic en Desbloquear. | "Usuario operador desbloqueado."; estado Activo. |
| 3 | Ingresar con operador / operador123. | Entra al listado. |

## TC-72 · El Operador no accede a Usuarios y la API nunca devuelve contraseñas.

- **HU cubiertas:** HU-11, HU-03 · **Prioridad:** High · **Tipo:** Nuevo V3
- **Técnica de diseño:** Tabla de decisión (rol × acción)
- **Prerrequisitos:** Usuario logueado como Operador (operador / operador123).
- **Datos de prueba:** `URL = /usuarios.html` · `GET /api/usuarios`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Mirar el menú. | No aparece "Usuarios". |
| 2 | Abrir /usuarios.html escribiendo la URL. | Redirige al listado de equipos. |
| 3 | GET /api/usuarios como Operador. | HTTP 403. |
| 4 | GET /api/usuarios como Administrador. | Lista los usuarios; ninguno incluye el campo password. |

## TC-73 · Un cambio de rol se aplica en la siguiente acción del usuario.

- **HU cubiertas:** HU-11, HU-03 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Tabla de decisión (rol antes × después)
- **Prerrequisitos:** Navegador A con admin; navegador B con operador.
- **Datos de prueba:** `Usuario = operador`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | En A: Pasar a Administrador a operador → confirmar. | operador queda con rol Administrador. |
| 2 | En B: recargar el listado. | Aparecen los botones "Dar de baja" y los menús Usuarios, Auditoría y Configuración. |

## TC-74 · El alta de un equipo queda en la auditoría.

- **HU cubiertas:** HU-12, HU-04 · **Prioridad:** High · **Tipo:** Nuevo V3
- **Técnica de diseño:** Caso de uso
- **Prerrequisitos:** Datos de prueba restaurados (POST /api/test/reset). Navegador A con operador; navegador B con admin.
- **Datos de prueba:** `Equipo nuevo = Lenovo ThinkPad L15 PF-56743 Notebook`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | En A: crear el equipo. | Se crea EQ-00006. |
| 2 | En B: abrir Auditoría. | Primer registro: EQUIPO_ALTA · operador · EQ-00006, con marca, modelo y serie en el detalle. |

## TC-75 · Un login fallido se registra sin la contraseña.

- **HU cubiertas:** HU-12, HU-01 · **Prioridad:** High · **Tipo:** Nuevo V3
- **Técnica de diseño:** Predicción de errores (datos sensibles)
- **Prerrequisitos:** Datos de prueba restaurados (POST /api/test/reset).
- **Datos de prueba:** `admin / admin999`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Intentar ingresar con admin / admin999. | "Usuario o contraseña incorrectos." |
| 2 | Ingresar como admin y abrir Auditoría. | Hay un LOGIN_FALLIDO de admin; el detalle no contiene "admin999". |

## TC-76 · Las operaciones rechazadas no generan registro.

- **HU cubiertas:** HU-12 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Partición de equivalencias (operación válida / rechazada)
- **Prerrequisitos:** Usuario logueado como Administrador (admin / admin123).
- **Datos de prueba:** `Marca = a (inválida)`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Anotar el total de registros de Auditoría. | Total N. |
| 2 | Intentar crear un equipo con Marca "a". | Error de validación. |
| 3 | Volver a Auditoría. | El total sigue siendo N. |

## TC-77 · Paginación de 20 registros (20 y 21).

- **HU cubiertas:** HU-12 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Valores límite (20 / 21 registros)
- **Prerrequisitos:** Datos de prueba restaurados (POST /api/test/reset). Usuario logueado como Administrador (admin / admin123).
- **Datos de prueba:** `19 altas de equipos (por API o pantalla)`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Después del reset e ingreso (2 registros), crear 18 equipos y abrir Auditoría. | "Página 1 de 1 · 20 registros"; Siguiente deshabilitado. |
| 2 | Crear 1 equipo más y recargar. | "Página 1 de 2 · 21 registros"; 20 filas. |
| 3 | Hacer clic en Siguiente. | "Página 2 de 2"; 1 fila (DATOS_RESTAURADOS). |

## TC-78 · Filtros combinados de acción y usuario.

- **HU cubiertas:** HU-12 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Tabla de decisión (filtros)
- **Prerrequisitos:** Datos de prueba restaurados (POST /api/test/reset). Entregas hechas por admin y por operador.
- **Datos de prueba:** `Acción = ENTREGA` · `Usuario = operador`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Filtrar Acción = ENTREGA. | Solo registros ENTREGA. |
| 2 | Agregar Usuario = operador. | Solo las entregas del operador. |
| 3 | Filtrar por algo inexistente (Buscar = zzz). | "No hay registros de auditoría con los filtros aplicados." |
| 4 | Limpiar filtros. | Vuelven todos los registros. |

## TC-79 · Filtro de fechas: mismo día e intervalo invertido.

- **HU cubiertas:** HU-12 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Valores límite (fechas) + partición
- **Prerrequisitos:** Usuario logueado como Administrador (admin / admin123).
- **Datos de prueba:** `Desde = Hasta = hoy` · `Desde = mañana, Hasta = hoy`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Desde = Hasta = hoy. | Se ven los registros de hoy (los límites son inclusivos). |
| 2 | Desde = mañana y Hasta = hoy. | "La fecha Desde no puede ser posterior a Hasta." |

## TC-80 · El registro de auditoría es inmutable.

- **HU cubiertas:** HU-12 · **Prioridad:** High · **Tipo:** Nuevo V3
- **Técnica de diseño:** Predicción de errores (API)
- **Prerrequisitos:** Usuario logueado como Administrador (admin / admin123). Cookie de sesión disponible para llamar a la API.
- **Datos de prueba:** `DELETE /api/auditoria` · `PATCH /api/auditoria/1`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | DELETE /api/auditoria. | HTTP 404. |
| 2 | PATCH /api/auditoria/1 con cualquier cuerpo. | HTTP 404. |
| 3 | GET /api/auditoria. | Mismos registros que antes. |

## TC-81 · El Operador no accede a la auditoría.

- **HU cubiertas:** HU-12, HU-03 · **Prioridad:** High · **Tipo:** Nuevo V3
- **Técnica de diseño:** Tabla de decisión (rol × acción)
- **Prerrequisitos:** Usuario logueado como Operador (operador / operador123).
- **Datos de prueba:** `URL = /auditoria.html`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Mirar el menú. | No aparece "Auditoría". |
| 2 | Abrir /auditoria.html. | Redirige al listado de equipos. |
| 3 | GET /api/auditoria. | HTTP 403. |

## TC-82 · La edición de un equipo queda auditada con antes y después.

- **HU cubiertas:** HU-12, HU-05 · **Prioridad:** Normal · **Tipo:** Nuevo V3
- **Técnica de diseño:** Caso de uso
- **Prerrequisitos:** Usuario logueado como Administrador (admin / admin123). Datos de prueba restaurados (POST /api/test/reset).
- **Datos de prueba:** `EQ-00003: Marca Samsung → LG`

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Editar EQ-00003 y cambiar la Marca a LG. | "Equipo EQ-00003 actualizado correctamente." |
| 2 | Abrir Auditoría. | EQUIPO_EDICION · admin · EQ-00003 · Marca: "Samsung" → "LG". |
