# GestIT — Reportes de defectos (V2 corregidos en V3 y nuevos de V3)

Testing de Aplicaciones · UADE · Grupo 12

> **Estado:** BUG‑02 a BUG‑08 y OBS‑01 corregidos en V3 y **confirmados** (TC‑49 a TC‑56: PASS). BUG‑09 a BUG‑12, encontrados en la ejecución y el exploratorio de V3, quedan **abiertos**. AUT‑01 (falso negativo de los scripts) corregido y confirmado. Los campos siguen la hoja "Defect Report - Template" de la
> plantilla del grupo, con los mismos agregados que BUG‑01 (Root cause, Confirmation testing, Status).
> Después se pasan a la planilla Excel.

**Cómo se encontraron (BUG‑02 a BUG‑08).** En una sesión de **testing exploratorio con charters** sobre V2,
realizada con asistencia de la IA durante el análisis y motivada por la devolución de la Entrega 02
("faltó exploratorio con mirada de romper la aplicación"). El caso de BUG‑02 lo señaló el profesor:

| Charter | Objetivo | Defectos |
|---|---|---|
| CH‑01 | Explorar la redirección `?next=` del login con variantes de URL para salir del sistema | BUG‑02, BUG‑03 |
| CH‑02 | Explorar la API de entregas enviando tipos de dato inesperados | BUG‑05 |
| CH‑03 | Explorar el CSV exportado con valores que Excel interpreta | BUG‑04 |
| CH‑04 | Explorar el login con abuso de intentos y entradas con espacios | BUG‑06, BUG‑07 |
| CH‑05 | Explorar los límites de longitud con caracteres no ASCII (emojis) y valores degenerados | BUG‑08, OBS‑01 |

**Entorno (todos los reportes):** V2 (etiqueta `v2.0`, commit `f86bb80`) · Entorno local (localhost:3000) ·
Node.js 22 · Chromium 157. Los pasos por API se hicieron con `curl` usando la cookie de sesión.

---

## Defect Report – BUG‑02

| Campo | Valor |
|---|---|
| **ID** | BUG‑02 |
| **Title** | Redirección abierta en el login: `?next=/\dominio` (o con tabulación) lleva a un sitio externo. |
| **Description / Overview** | La HU‑01 dice que solo se aceptan rutas internas en `?next=` "para evitar redirecciones a sitios externos". La validación solo revisa que `next` empiece con `/` y no con `//`. Los navegadores tratan `\` como `/` y descartan las tabulaciones de las URLs, así que `/\example.com` y `/<TAB>/example.com` pasan la validación pero terminan en `//example.com`, un sitio externo. Un atacante puede mandar un link legítimo del sistema que, después del login, lleva a una página falsa (phishing). *(Caso reportado por el profesor en la devolución de la Entrega 02; la variante con tabulación la encontró el grupo.)* |
| **Reproduction Steps** | 1- Sin sesión, abrir `http://localhost:3000/?next=/%5Cexample.com`. <br>2- Ingresar `admin` / `admin123` y hacer clic en "Iniciar sesión". <br>3- Observar la URL final. <br>4- Repetir con `http://localhost:3000/?next=/%09/example.com`. |
| **Expected Behavior** | En ambos casos se llega al listado de equipos (`/dashboard`) y no se sale del sistema (HU‑01, criterio 7 y regla de `?next=`). |
| **Actual Behavior (V2)** | El navegador termina en `http://example.com/` en los dos casos. |
| **Incidence / Severity / Probability of reproduction** | Severidad **Alta** (seguridad: redirección abierta, posible phishing) / 100 % de reproducción. |
| **Story and Acceptance Criteria affected** | HU‑01 (regla "Cambio en V2 (redirección ?next=)"; el criterio 7 solo probaba `//sitio-externo.com`). |
| **Root cause** | Validación incompleta en el código (`public/js/login.js`): se compara texto (`startsWith`) en vez de interpretar la URL como lo hace el navegador. También faltaba un criterio de aceptación con variantes (`\`, tabulación, `https:`). |
| **Confirmation testing (V3)** | HU‑01 (v3) criterios 8, 9 y 10 (casos de confirmación nuevos). |
| **Status** | **Cerrado**: corregido en V3 y confirmado por QA (caso de confirmación PASS, ejecutado por Santiago Gorga). |
| **Browsers tested** | Chromium 157 |
| **Environment** | Entorno local (localhost:3000) |
| **Notes** | Variantes probadas: `/equipo.html?codigo=EQ-00002` → OK (ficha); `//example.com` → OK (listado); `/\example.com` → **FALLA**; `/%09/example.com` → **FALLA**. |

## Defect Report – BUG‑03

| Campo | Valor |
|---|---|
| **ID** | BUG‑03 |
| **Title** | El servidor redirige fuera del sistema en `GET /?next=/\dominio` cuando ya hay sesión. |
| **Description / Overview** | Con la sesión iniciada, `GET /` redirige al valor de `next` usando la misma validación incompleta que BUG‑02, pero en el servidor (`server.js`, ruta `/`). Responde `302 Location: /\example.com` y el navegador lo sigue hasta example.com. |
| **Reproduction Steps** | 1- Iniciar sesión como `admin`. <br>2- En la misma pestaña, abrir `http://localhost:3000/?next=/%5Cexample.com`. <br>3- Observar la URL final (o la respuesta con `curl -i -b cookies.txt "http://localhost:3000/?next=/%5Cexample.com"`). |
| **Expected Behavior** | Se muestra el listado de equipos sin salir del sistema. |
| **Actual Behavior (V2)** | `HTTP 302` con `Location: /\example.com`, y el navegador termina en example.com. Con `/%09/example.com` responde `Location: /%09/example.com`. |
| **Incidence / Severity / Probability of reproduction** | Severidad **Alta** / 100 %. |
| **Story and Acceptance Criteria affected** | HU‑01 (regla de `?next=`), HU‑18 (acceso por QR). |
| **Root cause** | Código duplicado: la regla de `next` se implementó dos veces (navegador y servidor), con el mismo error en las dos. |
| **Confirmation testing (V3)** | HU‑01 (v3) criterio 11. |
| **Status** | **Cerrado**: corregido en V3 y confirmado por QA (caso de confirmación PASS, ejecutado por Santiago Gorga). |
| **Browsers tested** | Chromium 157 · curl |
| **Environment** | Entorno local (localhost:3000) |
| **Notes** | Conviene corregirlo junto con BUG‑02, con una sola función de validación compartida. |

## Defect Report – BUG‑04

| Campo | Valor |
|---|---|
| **ID** | BUG‑04 |
| **Title** | El CSV exportado permite inyección de fórmulas (CSV injection). |
| **Description / Overview** | La marca, el modelo y las observaciones aceptan cualquier carácter. Si un valor empieza con `=`, `+`, `-` o `@`, el CSV de HU‑19 lo exporta tal cual, y al abrirlo en Excel se ejecuta como fórmula (por ejemplo, un link `HYPERLINK` malicioso en la planilla de etiquetas). |
| **Reproduction Steps** | 1- Iniciar sesión. <br>2- "+ Nuevo equipo": Marca `=HYPERLINK("http://x","x")`, Modelo `Modelo X`, Serie `CSV-0001`, Categoría PC. Crear. <br>3- Buscar `CSV-0001` y hacer clic en "Exportar CSV". <br>4- Abrir el archivo en Excel. |
| **Expected Behavior** | La celda se muestra como texto y no se ejecuta como fórmula. |
| **Actual Behavior (V2)** | El CSV contiene `EQ-00006,"=HYPERLINK(""http://x"",""x"")",Modelo X,...` y Excel lo interpreta como fórmula. |
| **Incidence / Severity / Probability of reproduction** | Severidad **Media** / 100 %. |
| **Story and Acceptance Criteria affected** | HU‑19 (exportación CSV), HU‑04 (alta). |
| **Root cause** | Requerimiento incompleto: HU‑19 definía el escape de comas y comillas, pero no el riesgo de fórmulas. |
| **Confirmation testing (V3)** | HU‑19 (v3) criterio 5. |
| **Status** | **Cerrado**: corregido en V3 y confirmado por QA (caso de confirmación PASS, ejecutado por Santiago Gorga). |
| **Browsers tested** | Chromium 157 · curl |
| **Environment** | Entorno local (localhost:3000) |
| **Notes** | Referencia: OWASP "CSV Injection". |

## Defect Report – BUG‑05

| Campo | Valor |
|---|---|
| **ID** | BUG‑05 |
| **Title** | La entrega acepta `empleadoId` con tipos no numéricos (`true`, `"0x2"`) y entrega el equipo a otro empleado. |
| **Description / Overview** | El servidor convierte `empleadoId` con `Number(...)`, así que `true` pasa a ser `1` (Ana Gómez) y `"0x2"` pasa a ser `2` (Carlos Pérez). Una petición mal formada termina en una entrega real con acta generada. |
| **Reproduction Steps** | 1- Iniciar sesión (cookie en `c.txt`). <br>2- `curl -b c.txt -H "Content-Type: application/json" -d '{"empleadoId":true}' http://localhost:3000/api/equipos/EQ-00002/entrega` <br>3- Abrir la ficha de EQ‑00002. |
| **Expected Behavior** | 400 "Seleccioná un empleado." y EQ‑00002 sigue Disponible (regla 2.4: el servidor aplica las mismas reglas que la interfaz). |
| **Actual Behavior (V2)** | 201 "Equipo entregado. Acta AE‑000002 generada." y EQ‑00002 queda Asignado a Gómez, Ana. Con `"0x2"` se entrega a Pérez, Carlos. Con `1.5` responde 404 "Empleado no encontrado." en vez de 400. |
| **Incidence / Severity / Probability of reproduction** | Severidad **Media** (integridad de datos; genera actas incorrectas) / 100 % por API. No se reproduce desde la interfaz. |
| **Story and Acceptance Criteria affected** | HU‑15, regla 2.4. |
| **Root cause** | Validación débil en el código: conversión implícita de tipos de JavaScript. |
| **Confirmation testing (V3)** | HU‑15 (v3) criterio 6. |
| **Status** | **Cerrado**: corregido en V3 y confirmado por QA (caso de confirmación PASS, ejecutado por Santiago Gorga). |
| **Browsers tested** | curl |
| **Environment** | Entorno local (localhost:3000) |
| **Notes** | Encontrado con la técnica de *predicción de errores* (tipos inesperados). |

## Defect Report – BUG‑06

| Campo | Valor |
|---|---|
| **ID** | BUG‑06 |
| **Title** | El login no limita los intentos fallidos (permite fuerza bruta). |
| **Description / Overview** | Se pueden hacer intentos de login ilimitados. Probamos 30 contraseñas incorrectas seguidas contra `admin` y todas respondieron 401, sin bloqueo ni demora. |
| **Reproduction Steps** | 1- Ejecutar 30 veces `curl -H "Content-Type: application/json" -d '{"usuario":"admin","password":"x"}' http://localhost:3000/api/login` <br>2- Observar los códigos de respuesta. |
| **Expected Behavior** | Después de una cantidad razonable de intentos fallidos, el usuario se bloquea temporalmente. |
| **Actual Behavior (V2)** | 30 respuestas 401, sin ningún bloqueo. |
| **Incidence / Severity / Probability of reproduction** | Severidad **Media** (seguridad) / 100 %. |
| **Story and Acceptance Criteria affected** | HU‑01, HU‑11 (pendiente desde V1). |
| **Root cause** | Requerimiento faltante: ninguna HU de V1/V2 definía un límite de intentos. |
| **Confirmation testing (V3)** | HU‑01 (v3) criterios 13 a 15 y HU‑11 criterio 7. |
| **Status** | **Cerrado**: corregido en V3 y confirmado por QA (caso de confirmación PASS, ejecutado por Santiago Gorga). |
| **Browsers tested** | curl |
| **Environment** | Entorno local (localhost:3000) |
| **Notes** | Discutible si es defecto o mejora (no estaba especificado). Lo tratamos como defecto de seguridad porque la HU‑01 busca "acceder únicamente a las funciones que me corresponden". |

## Defect Report – BUG‑07

| Campo | Valor |
|---|---|
| **ID** | BUG‑07 |
| **Title** | El servidor no recorta los espacios del usuario en el login. |
| **Description / Overview** | La HU‑01 dice que en Usuario "se recortan los espacios al inicio y al final", y la regla 2.4 que toda validación se repite en el servidor. La pantalla recorta, pero `POST /api/login` no: `" admin"` responde 401. |
| **Reproduction Steps** | 1- `curl -H "Content-Type: application/json" -d '{"usuario":" admin","password":"admin123"}' http://localhost:3000/api/login` |
| **Expected Behavior** | Login exitoso, igual que desde la pantalla. |
| **Actual Behavior (V2)** | 401 "Usuario o contraseña incorrectos." |
| **Incidence / Severity / Probability of reproduction** | Severidad **Baja** / 100 % por API. No se reproduce desde la interfaz. |
| **Story and Acceptance Criteria affected** | HU‑01 (tabla de campos), regla 2.4. |
| **Root cause** | Inconsistencia entre la validación del navegador y la del servidor. |
| **Confirmation testing (V3)** | HU‑01 (v3) criterio 12. |
| **Status** | **Cerrado**: corregido en V3 y confirmado por QA (caso de confirmación PASS, ejecutado por Santiago Gorga). |
| **Browsers tested** | curl |
| **Environment** | Entorno local (localhost:3000) |
| **Notes** | — |

## Defect Report – BUG‑08

| Campo | Valor |
|---|---|
| **ID** | BUG‑08 |
| **Title** | Los límites de longitud cuentan mal los emojis y los caracteres compuestos. |
| **Description / Overview** | Las longitudes se miden en unidades UTF‑16 de JavaScript (`.length`), no en caracteres. Un emoji cuenta como 2, así que una Marca de 30 emojis (30 caracteres visibles, dentro del límite de 50) se rechaza. |
| **Reproduction Steps** | 1- Por API: `POST /api/equipos` con Marca de 30 × "💻", Modelo `Modelo`, Serie `EMO-0001`, Categoría PC. <br>2- Desde la interfaz: pegar 26 emojis en Marca (el `maxlength` también corta antes). |
| **Expected Behavior** | Se acepta (30 caracteres ≤ 50). |
| **Actual Behavior (V2)** | 400 "La marca debe tener entre 2 y 50 caracteres." |
| **Incidence / Severity / Probability of reproduction** | Severidad **Baja** / 100 %. |
| **Story and Acceptance Criteria affected** | HU‑04 (y todo campo con límite de longitud: HU‑08, HU‑13, HU‑15, HU‑16). |
| **Root cause** | Código: se usa `.length` en lugar de contar caracteres. Encontrado con valores límite combinados con particiones de caracteres no ASCII. |
| **Confirmation testing (V3)** | HU‑04 (v3) criterio 8. |
| **Status** | **Cerrado**: corregido en V3 y confirmado por QA (caso de confirmación PASS, ejecutado por Santiago Gorga). |
| **Browsers tested** | Chromium 157 · curl |
| **Environment** | Entorno local (localhost:3000) |
| **Notes** | — |

## Observación – OBS‑01 (no es defecto: el requerimiento lo permitía)

| Campo | Valor |
|---|---|
| **ID** | OBS‑01 |
| **Title** | Se acepta un N° de serie formado solo por guiones (`----`). |
| **Description / Overview** | Cumple la regla de V2 (4 a 40 caracteres; letras, números y guiones), pero no identifica ningún equipo. En la misma sesión vimos que también se aceptan Marca `!!`, Modelo `??` y un Motivo de 10 puntos. |
| **Decisión** | En V3 se agrega a HU‑04 la regla "al menos una letra o un número" para el N° de serie. El resto queda como mejora futura. |
| **Root cause** | Requerimiento incompleto. |
| **Confirmation testing (V3)** | HU‑04 (v3) criterio 7. |

---

# Defectos encontrados durante la ejecución manual de V3

## Defect Report – BUG‑09

| Campo | Valor |
|---|---|
| **ID** | BUG‑09 |
| **Title** | El CSV exportado se abre en una sola columna en Excel con configuración regional en español. |
| **Description / Overview** | La HU‑19 pide exportar el listado "para imprimir las etiquetas", con separador **coma** y BOM "para que Excel muestre bien los acentos": el archivo está pensado para abrirse en Excel. Pero en Windows con configuración regional de Argentina (y de la mayoría de los países de habla hispana) el separador de listas es el **punto y coma**. Al abrir el CSV con doble clic, Excel deja cada fila entera en la columna A y no se pueden usar los datos para las etiquetas sin pasos manuales (Datos → Texto en columnas). |
| **Reproduction Steps** | 1- En una PC con Windows en español (Argentina), iniciar sesión en GestIT. <br>2- En el listado, hacer clic en "Exportar CSV". <br>3- Abrir el archivo descargado con doble clic (Excel). |
| **Expected Behavior** | Cada dato en su columna: código, marca, modelo, N° de serie, categoría y estado. |
| **Actual Behavior (V3)** | Toda la fila queda en la columna A, por ejemplo `EQ-00006,"'=HYPERLINK(""http://x"",""x"")",Modelo X,CSV-0001,PC,Disponible`. |
| **Incidence / Severity / Probability of reproduction** | Severidad **Media** (la funcionalidad no sirve para su objetivo sin pasos manuales) / 100 % en Excel con configuración regional en español. |
| **Story and Acceptance Criteria affected** | HU‑19 (exportar el listado para imprimir etiquetas). También estaba en V2: los casos TC‑42 y TC‑43 verificaban el contenido del archivo, no cómo lo abre Excel. |
| **Root cause** | Requerimiento incompleto: la HU‑19 fijó "separador coma" sin contemplar la configuración regional del Excel de los usuarios. |
| **Cómo se encontró** | Ejecución manual de TC‑51 (confirmación de BUG‑04), Santiago Gorga, Excel en Windows. Ningún caso automatizado lo detecta: el oráculo es visual (cómo se ve en Excel). |
| **Status** | Abierto. |
| **Browsers tested** | Chrome (incógnito) · Microsoft Excel (Windows, configuración regional Argentina) |
| **Environment** | Entorno local (localhost:3000), V3 (rama `v3`). |
| **Notes** | Corrección propuesta: ver el mensaje de seguimiento (separador punto y coma, o selector de separador). |

## Defect Report – BUG‑10

| Campo | Valor |
|---|---|
| **ID** | BUG‑10 |
| **Title** | En pantallas de 360 px el menú del Administrador no entra: "Auditoría" se corta y "Configuración" queda inaccesible. |
| **Description / Overview** | La HU‑18 pide que la ficha sea "legible y operable en pantallas de 360 px de ancho". En V3 el menú del Administrador pasó de 3 opciones (Equipos, Empleados, Configuración) a 5 (se sumaron Usuarios y Auditoría). El menú mide 540 px y no se acomoda en varias líneas: en un celular de 360 px "Auditoría" queda cortada y "Configuración" fuera de la pantalla, sin forma de llegar. Con el Operador (2 opciones) no pasa. |
| **Reproduction Steps** | 1- Iniciar sesión como admin. <br>2- Abrir la ficha de EQ‑00002. <br>3- F12 → Ctrl + Shift + M → Responsive 360 × 740. <br>4- Mirar el menú del encabezado. |
| **Expected Behavior** | Todas las opciones del menú visibles y accesibles en 360 px (por ejemplo, en dos renglones). |
| **Actual Behavior (V3)** | Se ven Equipos, Empleados, Usuarios y parte de "Auditoría"; "Configuración" queda fuera de la pantalla. |
| **Incidence / Severity / Probability of reproduction** | Severidad **Media** (el Administrador no puede llegar a Configuración ni a Auditoría desde un celular) / 100 % con el rol Administrador en 360 px. |
| **Story and Acceptance Criteria affected** | HU‑18 (criterio 3, 360 px), RNF‑03. |
| **Root cause** | **Regresión introducida en V3:** al agregar los menús de HU‑11 y HU‑12 no se revisó el encabezado en 360 px. El TC‑41 de V2 se había ejecutado como Operador, que tiene un menú corto. |
| **Cómo se encontró** | Regresión manual de TC‑41 en V3, Santiago Gorga (Chrome, vista de dispositivo 360 × 740). |
| **Corrección propuesta** | Permitir que el menú pase a varios renglones (`flex-wrap: wrap` en `.main-nav`). Probada en el commit `92e7dfb` y revertida por decisión del equipo: el defecto se entrega abierto en V3. |
| **Confirmation testing** | Volver a ejecutar TC‑41 como Administrador (y como Operador) cuando se aplique la corrección. |
| **Status** | **Abierto** (a corregir en la próxima versión). |
| **Browsers tested** | Chrome (vista de dispositivo 360 × 740) |
| **Environment** | Entorno local (localhost:3000), V3 (rama `v3`). |

## Defect Report – BUG‑11

| Campo | Valor |
|---|---|
| **ID** | BUG‑11 |
| **Title** | Cualquiera que conozca un nombre de usuario puede bloquear esa cuenta; con el único Administrador, el sistema queda sin administración. |
| **Description / Overview** | El bloqueo de HU‑11 (5 intentos fallidos → 15 minutos) se aplica a la **cuenta**, sin importar quién hace los intentos. No hace falta saber la contraseña: alcanza con conocer el nombre de usuario (`admin` es el de los datos de prueba) para bloquearla, a mano o con un script, y repetirlo cada 15 minutos. Si la cuenta es la del **único Administrador**, nadie puede desbloquearla desde el sistema, porque el Operador no tiene acceso a Usuarios: el sistema queda sin nadie que pueda administrar usuarios, ver la auditoría ni configurar módulos. |
| **Reproduction Steps** | 1- Reiniciar el servidor (admin es el único Administrador). <br>2- En el login, ingresar 5 veces `admin` / `x`. <br>3- Ingresar con `admin` / `admin123` → mensaje de bloqueo. <br>4- Como operador: no aparece Usuarios; `POST /api/usuarios/admin/desbloquear` → 403. |
| **Expected Behavior** | Un tercero no puede dejar al sistema sin administración. El bloqueo frena la fuerza bruta sin impedir que el Administrador legítimo recupere el acceso (por ejemplo, demora progresiva entre intentos, bloqueo por origen o un Administrador de respaldo). |
| **Actual Behavior (V3)** | `admin` queda bloqueado 15 minutos y nadie lo puede desbloquear; el ataque se puede repetir indefinidamente. |
| **Incidence / Severity / Probability of reproduction** | Severidad **Alta** (seguridad: denegación de servicio sobre la administración del sistema) / 100 %. |
| **Story and Acceptance Criteria affected** | HU‑11 (regla de bloqueo), HU‑01. |
| **Root cause** | Requerimiento incompleto: la HU‑11 definió el bloqueo para frenar la fuerza bruta (corrección de BUG‑06) sin contemplar que también sirve para bloquear cuentas ajenas. La corrección de un defecto introdujo otro. |
| **Cómo se encontró** | Sesión de testing exploratorio **CH‑06** sobre V3, Santiago Gorga. Caso que lo demuestra: **TC‑83 (FAIL)**. |
| **Status** | **Abierto** (a corregir en la próxima versión). |
| **Browsers tested** | Chrome (incógnito) y Edge · curl |
| **Environment** | Entorno local (localhost:3000), V3 (rama `v3`). |

## Defect Report – BUG‑12

| Campo | Valor |
|---|---|
| **ID** | BUG‑12 |
| **Title** | El bloqueo por intentos revela qué usuarios existen (enumeración de usuarios). |
| **Description / Overview** | La HU‑01 usa el mismo mensaje para usuario inexistente y contraseña incorrecta "para no revelar qué usuarios existen". Pero el bloqueo de HU‑11 solo se aplica a usuarios reales: al 5.º intento, un usuario existente responde **423** "Usuario bloqueado…" y uno inexistente sigue respondiendo **401** "Usuario o contraseña incorrectos.". Probando 5 veces cada nombre de una lista, un atacante sabe cuáles existen sin conocer ninguna contraseña, y después puede bloquearlos (BUG‑11). |
| **Reproduction Steps** | 1- `POST /api/login` 5 veces con `operador` / `x` → 4 respuestas 401 y la 5.ª 423 "Usuario bloqueado…". <br>2- `POST /api/login` 5 veces con `juan` / `x` → 5 respuestas 401. <br>3- Comparar: operador existe, juan no. |
| **Expected Behavior** | Las respuestas no permiten distinguir un usuario existente de uno inexistente. |
| **Actual Behavior (V3)** | El usuario existente se bloquea (423, otro mensaje) y el inexistente no. |
| **Incidence / Severity / Probability of reproduction** | Severidad **Media** (seguridad: facilita ataques dirigidos, por ejemplo combinado con BUG‑11) / 100 %. |
| **Story and Acceptance Criteria affected** | HU‑01 (regla del mismo mensaje), HU‑11. |
| **Root cause** | Requerimiento contradictorio: la regla de bloqueo de HU‑11 no se cruzó con la regla de HU‑01. El **TC‑58** verificaba que un usuario inexistente no se bloquea, pero no lo comparaba con uno real: el caso confirmaba el criterio sin ver el problema. |
| **Cómo se encontró** | Sesión de testing exploratorio **CH‑07** sobre V3, Santiago Gorga. Caso que lo demuestra: **TC‑84 (FAIL)**. |
| **Status** | **Abierto** (a corregir en la próxima versión). |
| **Browsers tested** | curl (API) |
| **Environment** | Entorno local (localhost:3000), V3 (rama `v3`). |

---

# Defectos de los scripts de prueba automatizados

## AUT-01 · Falsos negativos en TC‑15 y TC‑16 (Selenium)

| Campo | Valor |
|---|---|
| **ID** | AUT‑01 |
| **Title** | TC‑15 y TC‑16 fallan con `StaleElementReferenceError` aunque la app funciona bien. |
| **Cómo se encontró** | Primera corrida de `npm run test:reporte` en la PC del equipo (Windows, Chrome 158): 29 de 31 PASS. |
| **Descripción** | Los scripts guardaban la referencia al elemento "estado" de la fila y esperaban que cambiara a "En reparación". Pero después de cada acción la app redibuja la tabla: el elemento guardado deja de existir y Selenium lanza `StaleElementReferenceError`. En el entorno donde se desarrollaron los scripts el orden de los tiempos era otro y no se manifestaba. |
| **Tipo** | **Falso negativo**: el test falla sin que haya un defecto en la aplicación. La clase de Automatización lo menciona como una desventaja ("la automatización puede introducir errores: falsos positivos / falsos negativos"). |
| **Causa raíz** | Defecto del script: espera sobre una referencia vieja en lugar de volver a buscar el elemento. |
| **Corrección** | `esperarTexto`, `texto` y `existe` (test/soporte/entorno.js) vuelven a buscar el elemento en cada intento. TC‑16 verifica el límite de 500 con el atributo `maxlength` en vez de depender de tipear 501 teclas. |
| **Confirmación** | 5 corridas seguidas con 31 de 31 PASS en el entorno de desarrollo, y `npm run test:reporte` en la PC del equipo (Windows, Chrome 158): **31 de 31 PASS**. |
| **Status** | Cerrado (confirmado por QA). |
