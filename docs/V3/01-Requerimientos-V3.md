# GestIT — Requerimientos de la Versión 3 (V3)

Testing de Aplicaciones · UADE · Grupo 12
Integrantes: Juan Ignacio Rua · Santiago Gorga · Santino Defilippo · Matias Sosa

> **Estado: BORRADOR para revisión del grupo.** Mismo formato que el documento de V2:
> Historia · Pantalla / UI · Campos · Reglas · Criterios de aceptación (Dado / Cuando / Entonces).

---

## 1. Objetivo de V3

Completar el backlog original de V1 y corregir los defectos encontrados en el testing exploratorio de V2:

1. **Corregir defectos de V2** (BUG‑02 a BUG‑08, ver `02-Reportes-de-Defectos-V3.md`). Entre ellos, la
   redirección abierta en el login que señaló el profesor en la devolución de la Entrega 02.
2. **HU‑05 · Editar los datos de un equipo**, pendiente desde V1.
3. **HU‑11 · Administrar usuarios del sistema**, pendiente desde V1. Incluye el bloqueo por intentos fallidos
   de inicio de sesión, que corrige BUG‑06.
4. **HU‑12 · Consultar el registro de auditoría**, pendiente desde V1.

**Fuera de alcance de V3:** HU‑10 (administrar categorías), ubicación sobre plano, garantías y mantenimiento,
gestión documental, anulación de actas y base de datos persistente.

## 2. Datos y reglas generales

### 2.1 Usuarios de prueba

| Usuario    | Contraseña    | Nombre        | Rol           | Estado |
|------------|---------------|---------------|---------------|--------|
| `admin`    | `admin123`    | Administrador | Administrador | Activo |
| `operador` | `operador123` | Operador      | Operador      | Activo |

### 2.2 Datos iniciales

Equipos, empleados, actas y módulos: **sin cambios respecto de V2** (sección 2.2 del documento de V2).
El registro de auditoría arranca vacío.

### 2.3 Estados del equipo y transiciones

Sin cambios respecto de V2 (tabla 2.3 del documento de V2).

### 2.4 Reglas transversales (cambios en V3 marcados)

Se mantienen todas las reglas de V2. Se agregan:

- **(V3) Tipos de dato estrictos en la API.** Cada campo debe llegar con el tipo esperado. Los textos deben ser
  strings y los identificadores numéricos deben ser números enteros positivos o strings de solo dígitos. Un valor de
  otro tipo (`true`, `"0x2"`, `1.5`, `[1]`) se rechaza con 400, con el mensaje del campo. *(Corrige BUG‑05.)*
- **(V3) Longitudes en caracteres reales.** Los mínimos y máximos de longitud cuentan caracteres tal como los ve
  el usuario: un emoji o una letra con tilde cuentan como 1. Esto aplica en el navegador y en el servidor.
  *(Corrige BUG‑08.)*
- **(V3) Auditoría.** Toda acción que modifica datos, y todo inicio de sesión exitoso o fallido, queda registrada
  en el registro de auditoría (HU‑12).

---

## 3. Historias de usuario

Las HU marcadas **(v3)** son HU de V1/V2 que se modifican. Las demás son nuevas en V3.

### HU‑01 (v3) · Iniciar sesión

*Sin cambios en la historia, en la pantalla ni en los campos. Cambian dos reglas y se agregan criterios.*

**Reglas que cambian**

- **Redirección `?next=` segura (corrige BUG‑02 y BUG‑03).** Después de iniciar sesión se redirige a `next` solo
  si cumple **todas** estas condiciones. Si no las cumple, se va al listado (`/dashboard`):
  1. Empieza con una sola `/`.
  2. El segundo carácter no es `/` ni `\`.
  3. No contiene caracteres de control: tabulación, salto de línea ni ningún otro de código < 32 o el 127.
  4. Al interpretarlo como URL, el destino queda en el mismo sitio (mismo protocolo, servidor y puerto).

  La validación se hace en el navegador (login) **y** en el servidor (`GET /?next=` con sesión iniciada), con la
  misma regla.
- **El servidor recorta los espacios del usuario (corrige BUG‑07).** `POST /api/login` aplica la regla del campo
  Usuario (recortar espacios) igual que la pantalla. La contraseña se compara exacta.
- **Bloqueo por intentos fallidos (nuevo, ver HU‑11).** Tras 5 intentos fallidos *consecutivos* para un usuario
  existente, ese usuario queda bloqueado 15 minutos. Mientras está bloqueado, el login responde **423**
  "Usuario bloqueado por intentos fallidos. Intentá más tarde o contactá a un Administrador.", aunque la contraseña
  sea correcta. Un login exitoso pone el contador en 0.
- **Usuario inactivo (nuevo, ver HU‑11).** Un usuario desactivado no puede ingresar. Recibe el mismo mensaje
  genérico "Usuario o contraseña incorrectos." (401).

**Criterios de aceptación (se mantienen 1 a 7 de V2 y se agregan):**

8. Dado que abro `/?next=/\example.com` sin sesión, cuando inicio sesión, entonces llego al listado de equipos y no
   a example.com. *(Confirma BUG‑02, caso del profesor.)*
9. Dado `/?next=/%09/example.com` (tabulación), cuando inicio sesión, entonces llego al listado.
10. Dado `/?next=https://example.com` o `/?next=javascript:alert(1)`, cuando inicio sesión, entonces llego al
    listado.
11. Dado que ya tengo sesión, cuando abro `/?next=/\example.com`, entonces el servidor **no** redirige fuera del
    sistema y se muestra el listado. *(Confirma BUG‑03.)*
12. Dado que por API envío `{"usuario":" admin ","password":"admin123"}`, entonces el login es exitoso.
    *(Confirma BUG‑07.)*
13. Dado el usuario `operador`, cuando ingreso 5 veces una contraseña incorrecta, entonces el 5.º intento ya
    responde 423 con el mensaje de bloqueo. Al 6.º intento, aunque use `operador123`, también responde 423.
14. Dado el usuario `operador` con 4 intentos fallidos, cuando ingresa con la contraseña correcta, entonces entra y
    el contador vuelve a 0.
15. Dado un usuario inexistente (`juan`), cuando intento 10 veces, entonces siempre responde 401 "Usuario o
    contraseña incorrectos." (no se revela si existe).

---

### HU‑04 (v3) · Registrar un equipo

*Cambio mínimo: una regla nueva del número de serie y el conteo de caracteres reales (regla 2.4).*

- **N° de serie:** además de las reglas de V2, debe contener **al menos una letra o un número**. Mensaje: "El
  número de serie debe contener al menos una letra o un número." *(Observación OBS‑01: en V2 se aceptaba `----`.)*

**Criterios nuevos**

7. Dado el N° de serie `----`, cuando confirmo, entonces se muestra el error y no se crea el equipo.
8. Dado una Marca de 30 emojis (30 caracteres visibles), cuando confirmo, entonces se acepta. *(Confirma BUG‑08.)*

---

### HU‑05 · Editar los datos de un equipo *(nueva en V3, pendiente desde V1)*

Como Operador o Administrador, quiero corregir la información de un equipo cargado, para mantener el inventario fiel
a la realidad.

**Pantalla / UI**

- Botón "Editar" (`btn-editar-EQ-X`) en la ficha del equipo (panel de acciones) y en la fila del listado. Lo ven
  ambos roles. **No aparece** en equipos "Dado de baja".
- Modal "Editar equipo EQ‑0000X" con los campos precargados con los valores actuales y los botones "Cancelar"
  (`btn-cancelar-edicion`) y "Guardar cambios" (`btn-guardar-edicion`).
- El código interno y el estado se muestran como texto informativo, **no editable**.

**Campos**: los mismos de HU‑04 con los mismos `data-testid` (prefijo `edit-`): `edit-marca`, `edit-modelo`,
`edit-serie`, `edit-categoria`, `edit-observaciones`. Tienen las mismas reglas y los mismos mensajes de error que
el alta.

**Reglas**

- `PATCH /api/equipos/{código}` con `{ marca, modelo, numeroSerie, categoria, observaciones }`. El servidor aplica
  las mismas validaciones que en el alta.
- El N° de serie no puede repetirse con **otro** equipo (incluidos los dados de baja). Se compara ignorando
  mayúsculas y espacios. Conservar el propio N° de serie es válido. Mensaje: "Ya existe un equipo con ese número
  de serie." (409).
- No se puede editar un equipo **Dado de baja**: 409 "No se puede editar un equipo dado de baja."
- Si se intenta cambiar `codigo`, `estado`, `id` o `responsable` por API, esos campos **se ignoran** y no se
  modifican.
- Si ningún valor cambió, no se guarda nada y se muestra "No hay cambios para guardar." (la API responde 200
  con `"cambios": []`).
- Al guardar se muestra "Equipo EQ‑0000X actualizado correctamente." La edición **no** agrega entradas al
  historial de estados (no hay cambio de estado). Sí queda en la auditoría (HU‑12) con el detalle de cada campo
  modificado: `Marca: "HP" → "Dell"`.

**Criterios de aceptación**

1. Dado EQ‑00001, cuando cambio el Modelo a "Latitude 5430" y guardo, entonces la ficha y el listado muestran el
   nuevo modelo, y el código y el estado no cambian.
2. Dado EQ‑00001, cuando cambio el N° de serie a "LN001" (de EQ‑00002) o a " ln001 ", entonces "Ya existe un
   equipo con ese número de serie." y no se guarda.
3. Dado EQ‑00001, cuando guardo sin cambiar el N° de serie "DL001", entonces se acepta (no choca consigo mismo).
4. Dado el formulario de edición, cuando dejo la Marca con 1 carácter → error; 2 → válido; 50 → válido; 51 →
   error.
5. Dado un equipo Dado de baja, entonces no se muestra "Editar", y por API la edición responde 409.
6. Dado que por API envío `{"estado":"Disponible","codigo":"EQ-99999","marca":"Dell"}` sobre EQ‑00004 (En
   reparación), entonces solo cambia la marca. EQ‑00004 sigue En reparación y con el mismo código.
7. Dado que abro el modal y guardo sin modificar nada, entonces veo "No hay cambios para guardar."
8. Dado que edito la Marca de EQ‑00003 de "Samsung" a "LG", entonces la auditoría registra
   `Marca: "Samsung" → "LG"` con mi usuario.

---

### HU‑11 · Administrar usuarios del sistema *(nueva en V3, pendiente desde V1)*

Como Administrador, quiero gestionar quiénes acceden y con qué rol, para controlar el acceso al sistema.

**Pantalla / UI**

- Menú "Usuarios" (`nav-usuarios`), solo para el Administrador. Abre la página `/usuarios.html`. Un Operador que
  escribe la URL es redirigido al listado de equipos.
- Tabla (`tabla-usuarios`) con las columnas Usuario, Nombre, Rol, Estado (Activo / Inactivo / Bloqueado) y
  Acciones:
  - "Cambiar rol" (`btn-rol-{usuario}`),
  - "Desactivar" / "Activar" (`btn-estado-{usuario}`),
  - "Desbloquear" (`btn-desbloquear-{usuario}`), solo si está bloqueado.
- Botón "+ Nuevo usuario" (`btn-nuevo-usuario`), que abre un modal con "Cancelar" y "Crear usuario"
  (`btn-crear-usuario`).

**Campos (alta)**

| Campo      | data-testid             | Obligatorio | Regla | Mensaje de error |
|------------|-------------------------|-------------|-------|------------------|
| Usuario    | `input-nuevo-usuario`   | Sí | 3 a 20 caracteres; solo minúsculas, números, punto y guion bajo | "El usuario debe tener entre 3 y 20 caracteres (minúsculas, números, . o _)." |
| Nombre     | `input-nombre-usuario`  | Sí | 2 a 50 caracteres; solo letras y espacios | "El nombre debe tener entre 2 y 50 caracteres y solo letras." |
| Rol        | `select-rol`            | Sí | Administrador u Operador | "Seleccioná un rol." |
| Contraseña | `input-nueva-password`  | Sí | 8 a 50 caracteres; al menos una letra y un número | "La contraseña debe tener entre 8 y 50 caracteres, con al menos una letra y un número." |

**Reglas**

- API (solo Administrador; un Operador recibe 403 "No tenés permisos para realizar esta operación."):
  - `GET /api/usuarios`: lista los usuarios. **Nunca devuelve contraseñas.**
  - `POST /api/usuarios`: alta. El usuario nuevo se crea Activo.
  - `PATCH /api/usuarios/{usuario}` con `{ rol }` o `{ activo }`: cambia el rol o el estado.
  - `POST /api/usuarios/{usuario}/desbloquear`: levanta el bloqueo y pone el contador de intentos en 0.
- El nombre de usuario no puede repetirse. Se compara sin distinguir mayúsculas. Mensaje: "Ya existe un usuario
  con ese nombre." (409).
- **Protección del último Administrador:** no se puede desactivar ni pasar a Operador al último Administrador
  activo. Mensaje: "Debe quedar al menos un Administrador activo." (409).
- **Auto‑protección:** el Administrador no puede desactivarse ni quitarse el rol a sí mismo. Mensaje: "No podés
  modificar tu propio rol o estado." (409).
- Un usuario **desactivado** no puede iniciar sesión (HU‑01). Si tenía una sesión abierta, su siguiente llamada a
  la API responde 401 "No autenticado.".
- Si a un usuario con sesión abierta **le cambian el rol**, los permisos nuevos se aplican desde su siguiente
  llamada a la API.
- **Bloqueo (corrige BUG‑06):** 5 intentos fallidos consecutivos bloquean al usuario 15 minutos (ver HU‑01). El
  Administrador puede levantar el bloqueo antes con "Desbloquear".
- Las acciones irreversibles o sensibles (desactivar, cambiar rol) piden confirmación.
- Todas las acciones de esta HU quedan en la auditoría (HU‑12).

**Criterios de aceptación**

1. Dado el Administrador, cuando creo el usuario `tecnico1` / "Técnico Uno" / Operador / `clave1234`, entonces
   aparece Activo en la tabla y puede iniciar sesión.
2. Dado el Usuario "ab" (2) → error; "abc" (3) → válido; 20 caracteres → válido; 21 → error; "Tecnico" (con
   mayúscula) → error.
3. Dado la contraseña "clave12" (7) → error; "clave123" (8) → válido; "clavelarga" (sin números) → error;
   "12345678" (sin letras) → error.
4. Dado el usuario `ADMIN` (ya existe `admin`), cuando confirmo, entonces "Ya existe un usuario con ese nombre."
5. Dado el Administrador `admin` como único Administrador, cuando intenta pasarse a Operador o desactivarse,
   entonces 409 y sigue igual.
6. Dado que desactivo a `operador`, cuando `operador` intenta ingresar, entonces "Usuario o contraseña
   incorrectos."; si tenía sesión abierta, su siguiente acción responde 401.
7. Dado `operador` bloqueado por 5 intentos fallidos, cuando el Administrador hace "Desbloquear", entonces
   `operador` puede ingresar con `operador123`.
8. Dado el Operador, entonces no ve "Usuarios" en el menú, `/usuarios.html` lo lleva al listado y
   `GET /api/usuarios` responde 403.
9. Dado `GET /api/usuarios`, entonces ningún usuario incluye el campo `password`.

---

### HU‑12 · Consultar el registro de auditoría *(nueva en V3, pendiente desde V1)*

Como Administrador, quiero revisar qué acciones se ejecutaron en el sistema, para poder reconstruir qué pasó ante una
inconsistencia o un reclamo.

**Pantalla / UI**

- Menú "Auditoría" (`nav-auditoria`), solo para el Administrador. Abre la página `/auditoria.html`. Un Operador
  es redirigido al listado de equipos.
- Tabla (`tabla-auditoria`) con las columnas Fecha y hora, Usuario, Acción, Objeto (código de equipo, documento de
  empleado, número de acta o usuario) y Detalle. Del más reciente al más antiguo.
- Filtros:
  - Usuario (`select-filtro-usuario`),
  - Acción (`select-filtro-accion`),
  - Desde (`input-desde`) y Hasta (`input-hasta`), fechas dd/mm/aaaa,
  - Buscar en objeto o detalle (`input-buscar-auditoria`),
  - "Limpiar filtros" (`btn-limpiar-auditoria`).
- Paginación de **20 registros por página**: "Anterior" (`btn-pagina-anterior`), "Siguiente"
  (`btn-pagina-siguiente`) y el texto "Página N de M · T registros" (`texto-paginacion`).

**Acciones registradas**

| Acción | Cuándo |
|---|---|
| `LOGIN_OK` / `LOGIN_FALLIDO` / `USUARIO_BLOQUEADO` / `LOGOUT` | Autenticación (HU‑01, HU‑02). En el fallido se guarda el usuario ingresado, nunca la contraseña. |
| `EQUIPO_ALTA` / `EQUIPO_EDICION` / `EQUIPO_ESTADO` / `EQUIPO_BAJA` | HU‑04, HU‑05, HU‑08, HU‑09. La edición detalla `campo: "antes" → "después"`. |
| `EMPLEADO_ALTA` / `EMPLEADO_BAJA` | HU‑13, HU‑14 |
| `ENTREGA` / `DEVOLUCION` | HU‑15, HU‑16 (con el número de acta) |
| `MODULO_ACTIVADO` / `MODULO_DESACTIVADO` | HU‑20 |
| `USUARIO_ALTA` / `USUARIO_ROL` / `USUARIO_ESTADO` / `USUARIO_DESBLOQUEO` | HU‑11 |
| `DATOS_RESTAURADOS` | `POST /api/test/reset` (RNF‑09) |

**Reglas**

- `GET /api/auditoria?usuario=&accion=&desde=&hasta=&q=&pagina=`: solo Administrador (Operador → 403).
- Las operaciones **rechazadas** (400, 403, 409) **no** generan registro, salvo `LOGIN_FALLIDO`.
- El registro es **inmutable**: no existe forma de editar ni borrar registros (cualquier `PUT`, `PATCH` o
  `DELETE` sobre `/api/auditoria` responde 404).
- Filtro de fechas: "Desde" y "Hasta" son inclusivas (todo el día). Si "Desde" es posterior a "Hasta": "La fecha
  Desde no puede ser posterior a Hasta." (400) y no se filtra.
- Sin resultados: "No hay registros de auditoría con los filtros aplicados." (`mensaje-sin-auditoria`).
- La auditoría es parte del núcleo: no depende de los módulos activables.
- `POST /api/test/reset` vacía la auditoría y deja un único registro `DATOS_RESTAURADOS`.

**Criterios de aceptación**

1. Dado que el Operador da de alta un equipo, cuando el Administrador abre la auditoría, entonces el primer registro
   es `EQUIPO_ALTA`, con usuario `operador` y el código del equipo creado.
2. Dado un login fallido de `admin` con "admin999", entonces se registra `LOGIN_FALLIDO` con usuario `admin` y el
   detalle **no** contiene la contraseña.
3. Dado un alta rechazada por validación (marca "a"), entonces **no** se agrega ningún registro.
4. Dado 21 registros, entonces la página 1 muestra 20, la página 2 muestra 1 y el texto dice "Página 1 de 2 · 21
   registros".
5. Dado el filtro Acción = `ENTREGA`, entonces solo se ven entregas. Combinado con Usuario = `operador`, solo las
   entregas del operador.
6. Dado Desde = Hasta = hoy, entonces se ven los registros de hoy. Dado Desde posterior a Hasta, entonces se
   muestra el error.
7. Dado `DELETE /api/auditoria` o `PATCH /api/auditoria/1` como Administrador, entonces 404 y el registro no cambia.
8. Dado el Operador, entonces no ve "Auditoría"; `/auditoria.html` lo lleva al listado y `GET /api/auditoria`
   responde 403.

---

### HU‑15 (v3) · Entregar un equipo — cambio de regla

- `empleadoId` debe ser un entero positivo (número entero o string de solo dígitos). Cualquier otro valor
  (`true`, `"0x2"`, `1.5`, `"2abc"`) responde 400 "Seleccioná un empleado." *(Corrige BUG‑05.)*

Criterio nuevo:

6. Dado `{"empleadoId": true}` o `{"empleadoId": "0x2"}` por API, entonces 400 y el equipo sigue Disponible.

### HU‑19 (v3) · Exportar CSV — cambio de regla

- **Protección contra fórmulas (corrige BUG‑04):** si un valor empieza con `=`, `+`, `-`, `@`, tabulación o
  retorno de carro, se exporta precedido por un apóstrofo (`'`). Así Excel lo muestra como texto y no lo ejecuta.

Criterio nuevo:

5. Dado un equipo con Marca `=HYPERLINK("http://x","x")`, cuando exporto, entonces la celda contiene
   `'=HYPERLINK(...)` y Excel no la interpreta como fórmula.

### HU‑03 (v3) · Matriz de permisos — filas nuevas

| Acción | Administrador | Operador |
|---|---|---|
| Editar un equipo (HU‑05) | ✅ | ✅ |
| Administrar usuarios (HU‑11) | ✅ | ❌ |
| Consultar la auditoría (HU‑12) | ✅ | ❌ |

---

## 4. HU que se mantienen sin cambios funcionales

HU‑02, HU‑06, HU‑07, HU‑08, HU‑09, HU‑13, HU‑14, HU‑16, HU‑17, HU‑18 y HU‑20. Sus acciones pasan a registrarse
en la auditoría (HU‑12).

## 5. Defectos de V2 a corregir en V3

| ID | Título | HU | Corrección esperada |
|---|---|---|---|
| BUG‑02 | Redirección abierta en el login con `?next=/\dominio` o con tabulación | HU‑01 | Validación de `next` de HU‑01 (v3) en el navegador |
| BUG‑03 | Redirección abierta del servidor en `GET /?next=` con sesión iniciada | HU‑01 | La misma validación en el servidor |
| BUG‑04 | El CSV exportado permite inyección de fórmulas | HU‑19 | Prefijo `'` en las celdas peligrosas |
| BUG‑05 | La entrega acepta `empleadoId` con tipos no numéricos (`true`, `"0x2"`) | HU‑15 | Tipos estrictos (regla 2.4) |
| BUG‑06 | El login no limita los intentos fallidos (fuerza bruta) | HU‑01 | Bloqueo de HU‑01 / HU‑11 |
| BUG‑07 | El servidor no recorta los espacios del usuario en el login | HU‑01 | Recorte en el servidor |
| BUG‑08 | Las longitudes cuentan mal emojis y caracteres compuestos | HU‑04 (y todo campo con longitud) | Conteo en caracteres reales (regla 2.4) |
| OBS‑01 | Se acepta un N° de serie sin letras ni números (`----`) | HU‑04 | Regla nueva de HU‑04 (v3) |
