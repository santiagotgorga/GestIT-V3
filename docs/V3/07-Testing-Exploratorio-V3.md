# GestIT V3 — Testing exploratorio

Testing de Aplicaciones · UADE · Grupo 12

Sesiones de testing exploratorio **con charters** sobre las funcionalidades nuevas de V3. Responde a la devolución
de la Entrega 02 ("faltó exploratorio con mirada de romper la aplicación"). Los charters CH‑01 a CH‑05 fueron sobre
V2 (ver `02-Reportes-de-Defectos-V3.md`).

## CH‑06 · ¿Se puede dejar al sistema sin administrador?

| Campo | Valor |
|---|---|
| **Misión** | Explorar el bloqueo por intentos fallidos (HU‑11) con la intención de dejar el sistema sin nadie que lo administre. |
| **Áreas** | Login, bloqueo por intentos, pantalla Usuarios, API de desbloqueo. |
| **Duración** | 15 minutos |
| **Tester** | Santiago Gorga |
| **Entorno** | V3 (rama `v3`), localhost:3000, Chrome incógnito + Edge, curl |

**Qué se probó y qué se vio:**

| Prueba | Resultado |
|---|---|
| 5 intentos con `admin` / `x` | Intentos 1 a 4: "Usuario o contraseña incorrectos."; 5.º: "Usuario bloqueado…" |
| `admin` / `admin123` después del bloqueo | Mensaje de bloqueo: el Administrador legítimo no puede entrar |
| Como operador: menú Usuarios y `/usuarios.html` | No aparece; la URL redirige al listado (correcto según HU‑03) |
| Como operador: `POST /api/usuarios/admin/desbloquear` | HTTP 403 (correcto según HU‑03) |
| ¿Hace falta la contraseña para bloquear? | **No.** Alcanza con conocer el nombre de usuario; se puede automatizar con un script y repetir cada 15 minutos |

**Hallazgo:** cualquiera que conozca un nombre de usuario puede bloquear esa cuenta, y si es el único
Administrador, el sistema queda sin administración → **BUG‑11** (severidad Alta), demostrado por **TC‑83 (FAIL)**.

**Reflexión:** el bloqueo se agregó para corregir el BUG‑06 (fuerza bruta). La corrección de un defecto de
seguridad introdujo otro: un caso clásico de por qué hay que explorar también lo que se acaba de corregir.

## CH‑07 · ¿El bloqueo revela qué usuarios existen?

| Campo | Valor |
|---|---|
| **Misión** | Explorar los mensajes del login y del bloqueo con la intención de averiguar qué usuarios existen sin conocer ninguna contraseña. |
| **Áreas** | Login (pantalla y API), mensajes de error, bloqueo por intentos. |
| **Duración** | 15 minutos |
| **Tester** | Santiago Gorga |
| **Entorno** | V3 (rama `v3`), localhost:3000, curl |

**Qué se probó y qué se vio:**

| Prueba | Resultado |
|---|---|
| 5 intentos por API con `operador` / `x` (existe) | 4 × HTTP 401 "Usuario o contraseña incorrectos." y la 5.ª HTTP 423 "Usuario bloqueado…" |
| 5 intentos por API con `juan` / `x` (no existe) | 5 × HTTP 401 "Usuario o contraseña incorrectos." |
| ¿Se puede saber cuál existe? | **Sí**: el que se bloquea existe. Con una lista de nombres y 5 intentos por nombre se averigua qué usuarios son reales |

**Hallazgo:** el bloqueo revela qué usuarios existen, contra lo que pide la HU‑01 → **BUG‑12** (severidad Media),
demostrado por **TC‑84 (FAIL)**.

**Reflexión:** el TC‑58 había dado PASS porque verificaba que un usuario inexistente no se bloquea. El problema
aparece recién al **comparar** con un usuario real: el caso confirmaba el criterio sin ver el problema de fondo,
justo lo que señaló el profesor en la devolución de la Entrega 02.

## Resumen del exploratorio de V3

| Charter | Duración | Defectos | Caso |
|---|---|---|---|
| CH‑06 · ¿Se puede dejar al sistema sin administrador? | 15 min | BUG‑11 (Alta) | TC‑83 FAIL |
| CH‑07 · ¿El bloqueo revela qué usuarios existen? | 15 min | BUG‑12 (Media) | TC‑84 FAIL |

Los dos defectos nacen de la misma funcionalidad nueva (el bloqueo de HU‑11, que corrigió el BUG‑06). BUG‑12
permite averiguar qué usuarios existen y BUG‑11 permite bloquearlos: combinados, un atacante sin ninguna contraseña
puede dejar fuera del sistema a todos los usuarios.
