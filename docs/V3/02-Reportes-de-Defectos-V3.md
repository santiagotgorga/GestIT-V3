# GestIT — Reportes de defectos encontrados en V2 (a corregir en V3)

Testing de Aplicaciones · UADE · Grupo 12

> **Estado: corregidos en V3 (un commit por defecto en la rama `v3`). Falta el testing de confirmación (TC‑49 a TC‑56).** Los campos siguen la hoja "Defect Report - Template" de la
> plantilla del grupo, con los mismos agregados que BUG‑01 (Root cause, Confirmation testing, Status).
> Después se pasan a la planilla Excel.

**Cómo se encontraron.** En una sesión de **testing exploratorio con charters** sobre V2, motivada por la
devolución de la Entrega 02 ("faltó exploratorio con mirada de romper la aplicación"):

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
| **Status** | Corregido en V3 → pendiente de confirmación por QA. |
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
| **Status** | Corregido en V3 → pendiente de confirmación por QA. |
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
| **Status** | Corregido en V3 → pendiente de confirmación por QA. |
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
| **Status** | Corregido en V3 → pendiente de confirmación por QA. |
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
| **Status** | Corregido en V3 → pendiente de confirmación por QA. |
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
| **Status** | Corregido en V3 → pendiente de confirmación por QA. |
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
| **Status** | Corregido en V3 → pendiente de confirmación por QA. |
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
