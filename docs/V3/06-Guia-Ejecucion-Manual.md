# GestIT V3 — Guía de ejecución manual

Testing de Aplicaciones · UADE · Grupo 12

Orden recomendado para ejecutar **los 34 casos de V3** y **los 11 de regresión manual** de corrido. Los casos están
agrupados en **bloques**: cada bloque empieza reiniciando el servidor (datos iniciales) y, dentro de un bloque, los casos
no se molestan entre sí.

## Preparación (una sola vez)

1. **Ventana 1 de Git Bash:** dentro de `~/GestIT-V3`, `npm start`. Para **reiniciar** (volver a los datos iniciales):
   **Ctrl + C** y `npm start` de nuevo.
2. **Chrome en ventana de incógnito** (Ctrl + Shift + N). Evita la caché vieja y los avisos de contraseña de Google.
   Para "empezar sin sesión", cerrá la ventana de incógnito y abrí otra.
3. **Ventana 2 de Git Bash** (para los pasos "por API"): pegá estas tres líneas **una vez**:

```bash
BASE=http://localhost:3000
login() { curl -s -c cookie.txt -H "Content-Type: application/json" -d "{\"usuario\":\"$1\",\"password\":\"$2\"}" -w "  → HTTP %{http_code}\n" $BASE/api/login; echo; }
api() { curl -s -b cookie.txt -H "Content-Type: application/json" -w "  → HTTP %{http_code}\n" "$@"; echo; }
```

`login admin admin123` inicia sesión por API, y `api …` hace una llamada con esa sesión. Cada comando muestra la
respuesta y, al final, el código HTTP (`→ HTTP 200`, `→ HTTP 409`, etc.).

**Cómo reportar:** por cada caso, `TC-xx: PASS` o `TC-xx: FAIL — paso N: vi tal cosa`. Si algo no se pudo ejecutar:
`BLOCKED — motivo`.

---

## Bloque A · Login y accesos (no hace falta reiniciar entre casos)

**TC‑49** · Ya ejecutado: PASS.

**TC‑50** · Redirección del servidor con sesión iniciada
1. En incógnito, iniciá sesión como admin.
2. En la misma pestaña, abrí `http://localhost:3000/?next=/%5Cexample.com` → **listado de equipos, la URL sigue en localhost**.
3. Abrí `http://localhost:3000/?next=/equipo.html?codigo=EQ-00002` → **ficha de EQ‑00002**.

**TC‑54** · El servidor recorta los espacios del usuario (Ventana 2)
```bash
curl -s -H "Content-Type: application/json" -d '{"usuario":" admin ","password":"admin123"}' -w "  → HTTP %{http_code}\n" $BASE/api/login
```
→ **"Login correcto." y HTTP 200**.

**TC‑58** · Un usuario inexistente nunca se bloquea (Ventana 2)
```bash
for i in $(seq 10); do curl -s -H "Content-Type: application/json" -d '{"usuario":"juan","password":"x"}' -w "  → HTTP %{http_code}\n" $BASE/api/login; done
```
→ **las 10 respuestas dicen "Usuario o contraseña incorrectos." con HTTP 401**, nunca el mensaje de bloqueo.

**TC‑72** · El Operador no accede a Usuarios
1. En incógnito, iniciá sesión como operador → en el menú **no aparece "Usuarios"**.
2. Abrí `http://localhost:3000/usuarios.html` → **te devuelve al listado**.
3. Ventana 2:
```bash
login operador operador123
api $BASE/api/usuarios
```
→ **HTTP 403**.
```bash
login admin admin123
api $BASE/api/usuarios
```
→ **lista admin y operador, y en ningún lado aparece "password"**.

**TC‑81** · El Operador no accede a la Auditoría
1. Como operador en incógnito → en el menú **no aparece "Auditoría"**.
2. Abrí `http://localhost:3000/auditoria.html` → **te devuelve al listado**.
3. Ventana 2:
```bash
login operador operador123
api $BASE/api/auditoria
```
→ **HTTP 403**.

**TC‑80** · La auditoría es inmutable (Ventana 2)
```bash
login admin admin123
api -X DELETE $BASE/api/auditoria
api -X PATCH -d '{"accion":"X"}' $BASE/api/auditoria/1
```
→ **HTTP 404 en los dos**. Después, `api $BASE/api/auditoria` → **los registros siguen ahí**.

---

## Bloque B · Bloqueo y desbloqueo — 🔄 reiniciar el servidor antes

**TC‑53** · 5 intentos fallidos bloquean al usuario (en incógnito, pantalla de login)
1. Ingresá 4 veces `operador` / `x` → **las 4 veces: "Usuario o contraseña incorrectos."**
2. 5.º intento con `operador` / `x` → **"Usuario bloqueado por intentos fallidos. Intentá más tarde o contactá a un Administrador."**
3. Intentá con `operador` / `operador123` → **el mismo mensaje de bloqueo**.

**TC‑71** · El Administrador desbloquea (seguí sin reiniciar)
1. Abrí otra ventana de incógnito e iniciá sesión como admin → **Usuarios** → operador aparece **"Bloqueado"** con el botón **Desbloquear**.
2. Clic en **Desbloquear** → **"Usuario operador desbloqueado."** y estado **Activo**.
3. Iniciá sesión con `operador` / `operador123` → **entra al listado**.

---

## Bloque C · Contador de intentos — 🔄 reiniciar antes

**TC‑57** · Un login correcto pone el contador en 0
1. Ingresá 4 veces `operador` / `x` → 4 errores normales.
2. Ingresá con `operador` / `operador123` → **entra**. Cerrá sesión.
3. Ingresá 4 veces más `operador` / `x` → **siguen siendo errores normales, sin bloqueo**.

---

## Bloque D · Confirmación de defectos con datos — 🔄 reiniciar antes

**TC‑51** · El CSV no ejecuta fórmulas (como operador)
1. **+ Nuevo equipo**: Marca `=HYPERLINK("http://x","x")`, Modelo `Modelo X`, Serie `CSV-0001`, Categoría PC → se crea **EQ‑00006**.
2. Buscá `CSV-0001` y hacé clic en **Exportar CSV** → se descarga `gestit_equipos_AAAAMMDD.csv`.
3. Abrilo con el Bloc de notas → la marca aparece como **`'=HYPERLINK(...)`**, con un apóstrofo adelante.
4. Abrilo con Excel → **se ve como texto, no como link ni fórmula**.

**TC‑55** · Los emojis cuentan como un carácter (como operador)
1. **+ Nuevo equipo**: Marca = 30 emojis (copiá: `💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻💻`), Modelo `Modelo`, Serie `EMO-0001`, PC → **se crea**.
2. Marca = 51 emojis (pegá los 30 de arriba y 21 más), Serie `EMO-0002` → **"La marca debe tener entre 2 y 50 caracteres."**

**TC‑56** · El N° de serie necesita una letra o un número
1. Alta con Serie `----` (Marca `HP`, Modelo `Modelo`, PC) → **"El número de serie debe contener al menos una letra o un número."**
2. Alta con Serie `A---` → **se crea**.

**TC‑52** · La entrega rechaza empleadoId raros (Ventana 2)
```bash
login operador operador123
api -d '{"empleadoId":true}' $BASE/api/equipos/EQ-00002/entrega
api -d '{"empleadoId":"0x2"}' $BASE/api/equipos/EQ-00002/entrega
api -d '{"empleadoId":1.5}' $BASE/api/equipos/EQ-00002/entrega
api -d '{"empleadoId":"2abc"}' $BASE/api/equipos/EQ-00002/entrega
```
→ **los 4: "Seleccioná un empleado." con HTTP 400**. En la pantalla, EQ‑00002 sigue **Disponible**.
```bash
api -d '{"empleadoId":2}' $BASE/api/equipos/EQ-00002/entrega
```
→ **HTTP 201, acta AE‑000002**, y EQ‑00002 queda **Asignado a Pérez, Carlos**.

---

## Bloque E · HU‑05 Editar equipo — 🔄 reiniciar antes (como operador, salvo que se indique)

**TC‑59** · Editar el modelo
1. Clic en **Editar** de EQ‑00001 → se abre **"Editar equipo EQ‑00001"** con los datos cargados.
2. Modelo `Latitude 5430` → **Guardar cambios** → **"Equipo EQ‑00001 actualizado correctamente."**
3. Ficha de EQ‑00001 → **modelo nuevo; código y estado iguales; el historial de estados no tiene filas nuevas**.

**TC‑64** · Guardar sin cambios
1. **Editar** de EQ‑00001 → **Guardar cambios** sin tocar nada → **"No hay cambios para guardar."**

**TC‑60** · Serie duplicada en la edición
1. **Editar** EQ‑00001 → Serie `LN001` → Guardar → **"Ya existe un equipo con ese número de serie."**, no se guarda.
2. Serie ` ln001 ` (con espacios) → **mismo error**.
3. Volvé a `DL001`, escribí algo en Observaciones → Guardar → **se guarda**.

**TC‑61** · Valores límite de Marca en la edición (sobre EQ‑00002)
1. Marca `A` → **error**. 2. `AB` → **se guarda**.
3. 50 letras (`MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM`) → **se guarda**.
4. 51 letras (las 50 de arriba + una más) → **error, no se guarda**.

**TC‑63** · La API ignora los campos no editables (Ventana 2)
```bash
login operador operador123
api -X PATCH -d '{"estado":"Disponible","codigo":"EQ-99999","marca":"Dell"}' $BASE/api/equipos/EQ-00004
```
→ **HTTP 200**. En la ficha de EQ‑00004: **marca Dell, sigue "En reparación" y con el código EQ‑00004**.

**TC‑82** · La edición queda auditada (como admin)
1. Iniciá sesión como admin → **Editar** EQ‑00003 → Marca `LG` → Guardar.
2. **Auditoría** → primer registro **EQUIPO_EDICION · admin · EQ‑00003 · Marca: "Samsung" → "LG"**.

**TC‑62** · No se edita un equipo dado de baja (como admin)
1. **Dar de baja** EQ‑00003 (motivo: `Equipo obsoleto para pruebas`) → confirmar.
2. Marcá **"Incluir dados de baja"** → la fila de EQ‑00003 dice **"Sin acciones"** (no aparece Editar).
3. Ventana 2:
```bash
login admin admin123
api -X PATCH -d '{"marca":"Samsung2"}' $BASE/api/equipos/EQ-00003
```
→ **"No se puede editar un equipo dado de baja." con HTTP 409**.

---

## Bloque F · HU‑11 Usuarios — 🔄 reiniciar antes (como admin)

**TC‑65** · Alta de usuario y primer ingreso
1. **Usuarios → + Nuevo usuario**: `tecnico1`, `Técnico Uno`, Operador, `clave1234` → **"Usuario tecnico1 creado correctamente."**, Activo.
2. En otra ventana de incógnito, ingresá con `tecnico1` / `clave1234` → **entra; el encabezado dice "Técnico Uno" y "Operador"**.

**TC‑66** · Usuario: límites y formato (con contraseña `clave1234` en todos)
`ab` → **error** · `abc` → **se crea** · `abcdefghijklmnopqrst` (20) → **se crea** · `abcdefghijklmnopqrstu` (21) → **error** · `Tecnico` → **error**.

**TC‑67** · Contraseña (usuarios `pass1`, `pass2`, …)
`clave12` → **error** · `clave123` → **se crea** · `clavelarga` → **error** · `12345678` → **error**.

**TC‑68** · Usuario duplicado
1. Pantalla: crear el usuario `admin` → **"Ya existe un usuario con ese nombre."**
2. Ventana 2:
```bash
login admin admin123
api -d '{"usuario":"ADMIN","nombre":"Otro Admin","rol":"Operador","password":"clave1234"}' $BASE/api/usuarios
```
→ **HTTP 400** (solo se aceptan minúsculas). No se crea.

**TC‑69** · Último Administrador y uno mismo
1. En Usuarios, la fila de admin dice **"Tu usuario"**, sin botones.
2. Ventana 2 (sesión de admin del paso anterior):
```bash
api -X PATCH -d '{"rol":"Operador"}' $BASE/api/usuarios/admin
```
→ **"No podés modificar tu propio rol o estado." con HTTP 409**.
3. En la pantalla, creá `admin2` / `Admin Dos` / **Administrador** / `clave1234`. Después, en la Ventana 2:
```bash
login admin2 clave1234
api -X PATCH -d '{"rol":"Operador"}' $BASE/api/usuarios/admin
api -X PATCH -d '{"activo":false}' $BASE/api/usuarios/admin2
```
→ el primero **HTTP 200** (se permite: quedan 2 admins) · el segundo **HTTP 409** (es uno mismo).

**TC‑70** · Usuario desactivado — 🔄 reiniciar antes
1. Ventana incógnito **A**: admin. Ventana incógnito **B** (otra ventana): operador, en el listado.
2. En A: **Usuarios → Desactivar** operador → confirmar → **Inactivo**.
3. En B: recargá la página (F5) → **vuelve al login**.
4. En B: ingresá `operador` / `operador123` → **"Usuario o contraseña incorrectos."**
5. En A: **Activar** operador. En B: ingresá de nuevo → **entra**.

**TC‑73** · El cambio de rol rige en la siguiente acción — 🔄 reiniciar antes
1. Ventana A: admin. Ventana B: operador, en el listado (sin botones "Dar de baja").
2. En A: **Usuarios → Pasar a Administrador** a operador → confirmar.
3. En B: F5 → **aparecen "Dar de baja" y los menús Usuarios, Auditoría y Configuración**.

---

## Bloque G · HU‑12 Auditoría — 🔄 reiniciar antes

**TC‑74** · El alta queda auditada
1. Ventana A: operador → **+ Nuevo equipo**: Lenovo, ThinkPad L15, PF-56743, Notebook → **EQ‑00006**.
2. Ventana B: admin → **Auditoría** → primer registro **EQUIPO_ALTA · operador · EQ‑00006**.

**TC‑75** · Login fallido sin la contraseña
1. Intentá ingresar con `admin` / `admin999` → error.
2. Ingresá como admin → **Auditoría** → hay un **LOGIN_FALLIDO de admin**, y el detalle **no** dice `admin999`.

**TC‑76** · Lo rechazado no se registra (como admin)
1. Auditoría → anotá el total ("… · N registros").
2. Intentá crear un equipo con Marca `a` → error.
3. Auditoría → **el total sigue siendo N**.

**TC‑77** · Paginación de 20 — 🔄 reiniciar antes
1. Ventana 2: `login admin admin123` (este login también queda en la auditoría, por eso va primero).
2. En incógnito, iniciá sesión como admin → **Auditoría** → anotá el total N (debería ser 2).
3. Creá 20 − N equipos por la Ventana 2 (cambiá `K=18` por 20 − N):
```bash
K=18; for i in $(seq 1 $K); do api -d "{\"marca\":\"Dell\",\"modelo\":\"Mod\",\"numeroSerie\":\"PAG-$i\",\"categoria\":\"PC\"}" $BASE/api/equipos > /dev/null; done
```
4. Recargá Auditoría → **"Página 1 de 1 · 20 registros"**, con **Siguiente** deshabilitado.
5. Creá 1 equipo más (por pantalla o con `api -d '{"marca":"Dell","modelo":"Mod","numeroSerie":"PAG-99","categoria":"PC"}' $BASE/api/equipos`) → recargá → **"Página 1 de 2 · 21 registros"**, con 20 filas.
6. **Siguiente** → **"Página 2 de 2"**, con 1 fila (el registro más antiguo).

**TC‑78** · Filtros combinados — 🔄 reiniciar antes
1. Ventana A: operador → **Entregar** EQ‑00001 a Pérez, Carlos. Ventana B: admin → **Entregar** EQ‑00002 a Pérez, Carlos.
2. En B, **Auditoría**: Acción = `ENTREGA` → **solo entregas (2)**. Sumá Usuario = `operador` → **solo la del operador**.
3. Buscar `zzz` → **"No hay registros de auditoría con los filtros aplicados."**
4. **Limpiar filtros** → vuelven todos.

**TC‑79** · Filtro de fechas (como admin)
1. Desde = Hasta = hoy → **se ven los registros de hoy**.
2. Desde = mañana, Hasta = hoy → **"La fecha Desde no puede ser posterior a Hasta."**

---

## Bloque H · Regresión manual (casos de V2) — 🔄 reiniciar antes (como operador)

| Caso | Qué hacés | Resultado esperado |
|---|---|---|
| **TC‑11** | Buscar `eq-00003` | Solo EQ‑00003; contador "1 equipo" |
| **TC‑13** | Categoría Notebook, después Estado En reparación | Primero EQ‑00001 y EQ‑00004; después solo EQ‑00004 |
| **TC‑14** | Buscar `zzz`, después **Limpiar filtros** | "No se encontraron equipos con los filtros aplicados."; después vuelven los 5 equipos |
| **TC‑44** | Buscar `zzz` y **Exportar CSV** | "No hay equipos para exportar con los filtros aplicados." y no se descarga nada |
| **TC‑43** | Limpiar, Categoría Notebook y **Exportar CSV** | El CSV tiene solo EQ‑00001 y EQ‑00004 |
| **TC‑08** | Alta con Serie `AB 12` y con `AB#12` (y, por V3, `----`) | "El número de serie solo admite letras, números y guiones." (con `----`: "…al menos una letra o un número.") y no se crea |
| **TC‑26** | Empleados → alta con email `martin@empresa`, con `martin.empresa.com`, y con nombre `M4rtin` | "Ingresá un email válido." en los dos primeros; error de nombre en el tercero |
| **TC‑39** | Ficha de EQ‑00002 → escanear el QR con la cámara del celular | El link que muestra el celular termina en `/equipo.html?codigo=EQ-00002` |
| **TC‑41** | Ficha de EQ‑00002 → F12 → **Ctrl + Shift + M** → ancho 360 | Una sola columna, sin scroll horizontal, botones (incluido **Editar**) de al menos 40 px de alto |
| **TC‑42** | Crear un equipo con Modelo `Latitude 5420, 14"` (Serie `CSV-0002`), limpiar filtros, **Exportar CSV** y abrirlo en Excel | Encabezado `codigo,marca,modelo,numero_serie,categoria,estado`, 6 filas, el modelo con coma entre comillas y ninguna celda ejecutada como fórmula |
| **TC‑33** | Entregar EQ‑00001 a Pérez, Carlos y después EQ‑00002 a Pérez, Carlos | Actas **AE‑000002** y **AE‑000003** |

---

## Al terminar

Mandá los resultados (`TC-xx: PASS` o `FAIL — …`). Se cargan en la planilla, hoja **"Resumen V3"**, y en la hoja de
cada caso, y el gráfico se actualiza solo.
