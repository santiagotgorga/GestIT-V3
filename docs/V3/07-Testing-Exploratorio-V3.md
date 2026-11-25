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

*Pendiente.*
