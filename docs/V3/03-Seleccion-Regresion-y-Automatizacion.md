# GestIT — Selección de casos de regresión y de automatización (V3)

Testing de Aplicaciones · UADE · Grupo 12

> Responde a tres objetivos de la Entrega 03: **cómo se seleccionaron los casos de V1 y V2 que se ejecutan**,
> **cómo se seleccionaron los casos a automatizar** y la **especificación de los casos de regresión**.

## 1. Punto de partida

En V1 y V2 diseñamos **48 casos de prueba** (TC‑01 a TC‑48; los TC‑01 a TC‑04 vienen de V1). En V3 no tiene
sentido re‑ejecutar todo a mano: el esfuerzo de regresión crece con cada versión (clase de Automatización, diapositiva
"Analicemos el proceso de desarrollo"). Por eso clasificamos los 48 casos en tres grupos:

| Grupo | Cantidad | Cómo se ejecuta en V3 |
|---|---|---|
| **A. Regresión automatizada** | 31 | Selenium WebDriver (`npm test`), en cada cambio |
| **B. Regresión manual** | 11 | Ejecución manual por el equipo |
| **C. No se ejecutan en V3** | 6 | Riesgo bajo: código no modificado y cubierto indirectamente |

Además se ejecutan los **casos nuevos de V3** (ver `04-Casos-de-Prueba-V3.md`), que incluyen el **testing de
confirmación** de los defectos BUG‑02 a BUG‑08 y OBS‑01. El de BUG‑01 (V1) es TC‑06, que queda automatizado.

## 2. Criterios para elegir la regresión (grupos A + B)

Basados en la bibliografía de la materia (Toledo, cap. Automatización; clase de F. Martínez):

1. **Riesgo por cambio:** el caso toca código o reglas que cambiaron en V3 (correcciones de BUG‑02 a BUG‑08,
   botón Editar en listado y ficha, nuevas validaciones, sesión que se revalida en cada llamada).
2. **Criticidad (prioridad High):** login, permisos, alta, transiciones de estado, entregas y devoluciones. Un fallo
   ahí bloquea el uso del sistema.
3. **Cobertura de HU:** al menos un caso por HU de V1/V2 queda en la regresión.

Un caso queda **fuera** (grupo C) solo si cumple las tres condiciones: su código **no** cambió en V3, tiene prioridad
Normal o Low y otro caso de la regresión ya recorre la misma pantalla.

## 3. Criterios para elegir qué automatizar (grupo A)

Tomados de la diapositiva "Criterios para implementar Automatización" y de la exposición de experto:

| Criterio | Cómo lo aplicamos |
|---|---|
| **Frecuencia de ejecución** | Los casos de regresión se repiten en cada versión: son los primeros candidatos ("Pruebas de Regresión → ideales para ser automatizados"). |
| **Criticidad / prioridad** | Se automatizaron **los 27 casos High** (todos tienen un oráculo automatizable). Los otros 4 automatizados son de prioridad Normal y se eligieron por repetitivos (valores límite). |
| **Repetitivos y tediosos** | Valores límite con muchos datos (TC‑07, TC‑16, TC‑24, TC‑36) → **data‑driven**: un solo script recorre todos los valores. |
| **Estabilidad** | Pantallas y reglas que no cambian de una versión a otra (los `data-testid` del RNF‑08 hacen estable la ubicación de los elementos). |
| **Oráculo automatizable** | El resultado se puede comparar con un texto, un estado o un código HTTP. Si el oráculo es visual o físico (escanear un QR, ver el CSV en Excel, la vista de impresión, la usabilidad en 360 px), **no se automatiza**. |
| **Soporte de la herramienta / ROI** | Selenium es gratuito, corre en Chrome y el equipo ya conoce JavaScript. Con `POST /api/test/reset` (RNF‑09) cada caso arranca con los mismos datos, lo que abarata mantener los scripts. |

**No se automatiza** (exposición de experto, "¿Qué casos de prueba no automatizar?"): pruebas exploratorias (TC‑41),
de usabilidad, ad hoc, ni las que necesitan un oráculo humano (TC‑39, TC‑42).

### Pirámide de Cohn

Los scripts combinan **UI (Selenium)** para el flujo del usuario y **API** para los pasos "por API" de los casos
(403, 409, 400). Así se respetan los niveles de la pirámide: las verificaciones de reglas de negocio se hacen por API
(rápidas y estables), y la UI se usa solo para lo que el usuario ve.

## 4. Matriz de los 48 casos de V1/V2


| TC | Descripción | HU | Prioridad | Técnica | Decisión V3 | Justificación | Script |
|---|---|---|---|---|---|---|---|
| TC-01 | Login exitoso de Administrador. | HU-01, HU-04 | High | Caso de uso (flujo principal) | **A · Automatizado** | Prioridad alta; caso de V1 que se ejecuta en cada versión | `test/regresion/01-autenticacion-permisos.test.js` |
| TC-02 | Alta de equipo con campos obligatorios. | HU-04 | High | Partición de equivalencias (clase válida) | **A · Automatizado** | Prioridad alta; caso de V1 que se ejecuta en cada versión | `test/regresion/02-equipos.test.js` |
| TC-03 | Restricción de baja de equipo para Operadores. | HU-03 | High | Tabla de decisión (rol × acción) | **A · Automatizado** | Prioridad alta; caso de V1 que se ejecuta en cada versión | `test/regresion/01-autenticacion-permisos.test.js` |
| TC-04 | Filtro de búsqueda por texto. | HU-07 | High | Partición de equivalencias | **A · Automatizado** | Prioridad alta; caso de V1 que se ejecuta en cada versión | `test/regresion/02-equipos.test.js` |
| TC-05 | Alta válida genera código interno correlativo. | HU-04 | High | Partición de equivalencias (clase válida) | **A · Automatizado** | Prioridad alta | `test/regresion/02-equipos.test.js` |
| TC-06 | Confirmación BUG-01: el alta rechaza campos de 1 carácter. | HU-04 | High | Valores límite (debajo del mínimo) | **A · Automatizado** | Prioridad alta; valores límite: muchos datos, ideal data-driven; confirmación de BUG-01: evita que el defecto vuelva | `test/regresion/02-equipos.test.js` |
| TC-07 | Valores límite de Marca (1, 2, 50 y 51 caracteres). | HU-04 | Normal | Valores límite (3 puntos sobre 2 y 50) | **A · Automatizado** | valores límite: muchos datos, ideal data-driven | `test/regresion/02-equipos.test.js` |
| TC-08 | N° de serie con caracteres no permitidos. | HU-04 | Normal | Partición de equivalencias (clases inválidas) | B · Regresión manual | HU-04 cambió en V3 (OBS-01: nueva regla del N° de serie). | — |
| TC-09 | N° de serie duplicado ignorando mayúsculas y espacios. | HU-04 | High | Predicción de errores | **A · Automatizado** | Prioridad alta | `test/regresion/02-equipos.test.js` |
| TC-10 | El servidor valida el alta aunque se omita la interfaz. | HU-04, RF-01 | High | Predicción de errores (API) | **A · Automatizado** | Prioridad alta | `test/regresion/02-equipos.test.js` |
| TC-11 | Búsqueda por código interno sin distinguir mayúsculas. | HU-07 | Normal | Partición de equivalencias | B · Regresión manual | El listado cambió en V3 (botón Editar); verificación visual del contador. | — |
| TC-12 | Equipos dados de baja excluidos por defecto. | HU-07 | High | Tabla de decisión (casilla × filtro) | **A · Automatizado** | Prioridad alta | `test/regresion/02-equipos.test.js` |
| TC-13 | Filtros combinados de categoría y estado. | HU-07 | Normal | Tabla de decisión | B · Regresión manual | El listado cambió en V3 (botón Editar). | — |
| TC-14 | Sin resultados: mensaje y limpiar filtros. | HU-07 | Normal | Partición de equivalencias (sin coincidencias) | B · Regresión manual | El listado cambió en V3; incluye el estado vacío. | — |
| TC-15 | Reparar un equipo disponible con motivo válido. | HU-08 | High | Transición de estados (Disponible → En reparación) | **A · Automatizado** | Prioridad alta | `test/regresion/03-estados.test.js` |
| TC-16 | Valores límite del motivo (9, 10, 500 y 501 caracteres). | HU-08 | Normal | Valores límite | **A · Automatizado** | valores límite: muchos datos, ideal data-driven | `test/regresion/03-estados.test.js` |
| TC-17 | No se puede asignar un equipo manualmente. | HU-08, RF-05 | High | Transición de estados (transición inválida) | **A · Automatizado** | Prioridad alta; incluye verificación por API | `test/regresion/03-estados.test.js` |
| TC-18 | Un equipo dado de baja no admite cambios. | HU-08, HU-09 | High | Transición de estados (estado terminal) | **A · Automatizado** | Prioridad alta; incluye verificación por API | `test/regresion/03-estados.test.js` |
| TC-19 | El Operador no puede dar de baja (UI y API). | HU-03, HU-08 | High | Tabla de decisión (rol × acción) | **A · Automatizado** | Prioridad alta; incluye verificación por API | `test/regresion/01-autenticacion-permisos.test.js` |
| TC-20 | No se puede dar de baja un equipo Asignado. | HU-08, RF-05 | High | Transición de estados (transición inválida) | **A · Automatizado** | Prioridad alta; incluye verificación por API | `test/regresion/03-estados.test.js` |
| TC-21 | Ficha de un equipo asignado. | HU-06 | High | Caso de uso (flujo principal) | **A · Automatizado** | Prioridad alta | `test/regresion/02-equipos.test.js` |
| TC-22 | Ficha con código inexistente. | HU-06 | Normal | Partición de equivalencias (clase inválida) | C · No se ejecuta | Ficha inexistente: código no modificado en V3; riesgo bajo. | — |
| TC-23 | Alta válida de empleado. | HU-13 | High | Partición de equivalencias (clase válida) | **A · Automatizado** | Prioridad alta | `test/regresion/04-empleados.test.js` |
| TC-24 | Documento: particiones y valores límite. | HU-13 | Normal | Valores límite + partición de equivalencias | **A · Automatizado** | valores límite: muchos datos, ideal data-driven | `test/regresion/04-empleados.test.js` |
| TC-25 | Documento duplicado. | HU-13 | High | Predicción de errores | **A · Automatizado** | Prioridad alta | `test/regresion/04-empleados.test.js` |
| TC-26 | Email y nombre inválidos. | HU-13 | Normal | Partición de equivalencias (un inválido por caso) | B · Regresión manual | BUG-08 cambió la forma de medir longitudes en el alta de empleados. | — |
| TC-27 | Ver los equipos asignados a un empleado. | HU-13, RF-08 | Normal | Partición de equivalencias (con / sin equipos) | C · No se ejecuta | "Ver equipos" del empleado: código no modificado en V3. | — |
| TC-28 | Baja lógica de un empleado sin equipos. | HU-14 | Normal | Tabla de decisión (con / sin equipos) | C · No se ejecuta | Baja de empleado sin equipos: no modificado; TC-29 (automatizado) cubre la misma pantalla. | — |
| TC-29 | No se puede dar de baja un empleado con equipos asignados. | HU-14 | High | Tabla de decisión (rol × condición) | **A · Automatizado** | Prioridad alta; incluye verificación por API | `test/regresion/04-empleados.test.js` |
| TC-30 | Entrega de un equipo disponible. | HU-15 | High | Transición de estados (Disponible → Asignado) | **A · Automatizado** | Prioridad alta | `test/regresion/05-entregas-devoluciones.test.js` |
| TC-31 | No se puede entregar a un empleado inactivo. | HU-15 | High | Partición de equivalencias (empleado inactivo) | **A · Automatizado** | Prioridad alta; incluye verificación por API | `test/regresion/05-entregas-devoluciones.test.js` |
| TC-32 | No se puede entregar un equipo En reparación. | HU-15, RF-05 | High | Transición de estados (transición inválida) | **A · Automatizado** | Prioridad alta; incluye verificación por API | `test/regresion/05-entregas-devoluciones.test.js` |
| TC-33 | Numeración correlativa de actas de entrega. | HU-15, RF-10 | Normal | Caso de uso (repetición del flujo) | B · Regresión manual | BUG-05 cambió la validación de la entrega. | — |
| TC-34 | Devolución en condiciones. | HU-16 | High | Tabla de decisión (condición = En condiciones) | **A · Automatizado** | Prioridad alta | `test/regresion/05-entregas-devoluciones.test.js` |
| TC-35 | Devolución con falla. | HU-16 | High | Tabla de decisión (condición = Con falla) | **A · Automatizado** | Prioridad alta | `test/regresion/05-entregas-devoluciones.test.js` |
| TC-36 | Validaciones de la devolución. | HU-16 | Normal | Valores límite + partición | **A · Automatizado** | valores límite: muchos datos, ideal data-driven | `test/regresion/05-entregas-devoluciones.test.js` |
| TC-37 | Acta de entrega imprimible. | HU-17 | Normal | Caso de uso (flujo principal) | C · No se ejecuta | Acta imprimible: no modificada en V3; oráculo visual (vista de impresión). | — |
| TC-38 | Acta inexistente. | HU-17 | Low | Partición de equivalencias (clase inválida) | C · No se ejecuta | Acta inexistente: prioridad Low y código no modificado. | — |
| TC-39 | El QR de la ficha apunta a la ficha del equipo. | HU-18 | Normal | Caso de uso | B · Regresión manual | Hay que escanear el QR con un celular: el oráculo es físico/visual. | — |
| TC-40 | Acceso por QR sin sesión. | HU-18, HU-01 | High | Caso de uso (flujo alternativo) | **A · Automatizado** | Prioridad alta | `test/regresion/01-autenticacion-permisos.test.js` |
| TC-41 | Ficha legible en pantalla de 360 px. | HU-18, RNF-03 | Normal | Exploratorio con charter (móvil) | B · Regresión manual | Exploratorio de usabilidad en 360 px; la ficha ahora tiene el botón Editar. | — |
| TC-42 | Exportar CSV sin filtros. | HU-19 | Normal | Caso de uso + predicción de errores (comas) | B · Regresión manual | BUG-04 cambió el CSV; hay que abrirlo en Excel y mirarlo (oráculo visual). | — |
| TC-43 | Exportar CSV respeta los filtros. | HU-19 | Normal | Partición de equivalencias | B · Regresión manual | BUG-04 cambió el CSV exportado. | — |
| TC-44 | Exportar sin resultados. | HU-19 | Low | Partición de equivalencias (sin coincidencias) | B · Regresión manual | BUG-04 cambió el CSV exportado. | — |
| TC-45 | No se puede desactivar Personas con equipos asignados. | HU-20 | High | Tabla de decisión (asignados > 0) | **A · Automatizado** | Prioridad alta | `test/regresion/06-modulos.test.js` |
| TC-46 | Desactivar y reactivar Personas conserva los datos. | HU-20 | High | Tabla de decisión (asignados = 0) | **A · Automatizado** | Prioridad alta; incluye verificación por API | `test/regresion/06-modulos.test.js` |
| TC-47 | Desactivar Identificación física. | HU-20, HU-18, HU-19 | Normal | Tabla de decisión | C · No se ejecuta | Módulo Identificación: no modificado; TC-46 (automatizado) cubre la pantalla de módulos. | — |
| TC-48 | El Operador no accede a la configuración. | HU-20, HU-03 | High | Tabla de decisión (rol × acción) | **A · Automatizado** | Prioridad alta; incluye verificación por API | `test/regresion/01-autenticacion-permisos.test.js` |


## 5. Especificación de los casos de regresión a ejecutar en V3

Los pasos, datos y resultados esperados son los de la planilla de V2, salvo los **cambios para V3** indicados abajo.

### 5.1 Regresión automatizada (grupo A, 31 casos)

| TC | Script | Cambios para V3 |
|---|---|---|
| TC-01 · Login exitoso de Administrador. | `01-autenticacion-permisos.test.js` | Ninguno. |
| TC-02 · Alta de equipo con campos obligatorios. | `02-equipos.test.js` | Dato: serie SM002 (SM001 ya existe). Sin cambios de resultado. |
| TC-03 · Restricción de baja de equipo para Operadores. | `01-autenticacion-permisos.test.js` | Ninguno. |
| TC-04 · Filtro de búsqueda por texto. | `02-equipos.test.js` | Ninguno. |
| TC-05 · Alta válida genera código interno correlativo. | `02-equipos.test.js` | Ninguno. |
| TC-06 · Confirmación BUG-01: el alta rechaza campos de 1 carácter. | `02-equipos.test.js` | Ninguno. |
| TC-07 · Valores límite de Marca (1, 2, 50 y 51 caracteres). | `02-equipos.test.js` | En V3 el campo ya no corta en 50 (se quitó maxlength): con 51 se ve el mensaje de error (BUG-08). |
| TC-09 · N° de serie duplicado ignorando mayúsculas y espacios. | `02-equipos.test.js` | Ninguno. |
| TC-10 · El servidor valida el alta aunque se omita la interfaz. | `02-equipos.test.js` | Ninguno. |
| TC-12 · Equipos dados de baja excluidos por defecto. | `02-equipos.test.js` | Ninguno. |
| TC-15 · Reparar un equipo disponible con motivo válido. | `03-estados.test.js` | Ninguno. |
| TC-16 · Valores límite del motivo (9, 10, 500 y 501 caracteres). | `03-estados.test.js` | Ninguno. |
| TC-17 · No se puede asignar un equipo manualmente. | `03-estados.test.js` | Ninguno. |
| TC-18 · Un equipo dado de baja no admite cambios. | `03-estados.test.js` | Ninguno. |
| TC-19 · El Operador no puede dar de baja (UI y API). | `01-autenticacion-permisos.test.js` | Ninguno. |
| TC-20 · No se puede dar de baja un equipo Asignado. | `03-estados.test.js` | Esperado V3: además de "Registrar devolución" aparece "Editar" (HU-05). |
| TC-21 · Ficha de un equipo asignado. | `02-equipos.test.js` | Ninguno. |
| TC-23 · Alta válida de empleado. | `04-empleados.test.js` | Ninguno. |
| TC-24 · Documento: particiones y valores límite. | `04-empleados.test.js` | Ninguno. |
| TC-25 · Documento duplicado. | `04-empleados.test.js` | Ninguno. |
| TC-29 · No se puede dar de baja un empleado con equipos asignados. | `04-empleados.test.js` | Ninguno. |
| TC-30 · Entrega de un equipo disponible. | `05-entregas-devoluciones.test.js` | Ninguno. |
| TC-31 · No se puede entregar a un empleado inactivo. | `05-entregas-devoluciones.test.js` | Ninguno. |
| TC-32 · No se puede entregar un equipo En reparación. | `05-entregas-devoluciones.test.js` | Ninguno. |
| TC-34 · Devolución en condiciones. | `05-entregas-devoluciones.test.js` | Ninguno. |
| TC-35 · Devolución con falla. | `05-entregas-devoluciones.test.js` | Ninguno. |
| TC-36 · Validaciones de la devolución. | `05-entregas-devoluciones.test.js` | Ninguno. |
| TC-40 · Acceso por QR sin sesión. | `01-autenticacion-permisos.test.js` | Ninguno. |
| TC-45 · No se puede desactivar Personas con equipos asignados. | `06-modulos.test.js` | Ninguno. |
| TC-46 · Desactivar y reactivar Personas conserva los datos. | `06-modulos.test.js` | Ninguno. |
| TC-48 · El Operador no accede a la configuración. | `01-autenticacion-permisos.test.js` | Ninguno. |

**Cómo se ejecuta:**

```bash
npm install
```
```bash
npm test
```

- `npm run test:ver` corre lo mismo con el navegador visible (útil para mostrar en la presentación).
- `npm run test:reporte` genera `reportes/reporte-regresion.html` con el resultado de cada caso y gráficos.
- Si un caso falla, se guarda una captura de pantalla en `reportes/capturas/TC-xx.png` como evidencia.

Cada `it` del script lleva el ID del caso (por ejemplo `TC-07 · Valores límite de Marca`), así el reporte se cruza
uno a uno con la planilla.

### 5.2 Regresión manual (grupo B, 11 casos)

| TC | Descripción | Motivo de la selección | Cambios para V3 |
|---|---|---|---|
| TC-08 | N° de serie con caracteres no permitidos. | HU-04 cambió en V3 (OBS-01: nueva regla del N° de serie). | Agregar el dato "----" → "El número de serie debe contener al menos una letra o un número." (o crear un caso V3 aparte: TC-56). |
| TC-11 | Búsqueda por código interno sin distinguir mayúsculas. | El listado cambió en V3 (botón Editar); verificación visual del contador. | Ninguno. |
| TC-13 | Filtros combinados de categoría y estado. | El listado cambió en V3 (botón Editar). | Ninguno. |
| TC-14 | Sin resultados: mensaje y limpiar filtros. | El listado cambió en V3; incluye el estado vacío. | Ninguno. |
| TC-26 | Email y nombre inválidos. | BUG-08 cambió la forma de medir longitudes en el alta de empleados. | Ninguno. |
| TC-33 | Numeración correlativa de actas de entrega. | BUG-05 cambió la validación de la entrega. | Ninguno. |
| TC-39 | El QR de la ficha apunta a la ficha del equipo. | Hay que escanear el QR con un celular: el oráculo es físico/visual. | Ninguno. |
| TC-41 | Ficha legible en pantalla de 360 px. | Exploratorio de usabilidad en 360 px; la ficha ahora tiene el botón Editar. | Verificar que el botón "Editar" no rompe la vista de 360 px. |
| TC-42 | Exportar CSV sin filtros. | BUG-04 cambió el CSV; hay que abrirlo en Excel y mirarlo (oráculo visual). | Abrir el CSV en Excel y verificar que ninguna celda se ejecuta como fórmula. |
| TC-43 | Exportar CSV respeta los filtros. | BUG-04 cambió el CSV exportado. | Ninguno. |
| TC-44 | Exportar sin resultados. | BUG-04 cambió el CSV exportado. | Ninguno. |

## 6. Resumen para la presentación

- De **48** casos de V1/V2: **42 se ejecutan** en V3 (31 automatizados + 11 manuales) y **6 no se ejecutan**.
- La automatización reemplaza la ejecución manual de **31 casos**; el equipo usa ese tiempo en los casos nuevos de V3
  y en testing exploratorio (justo lo que pidió la devolución de la Entrega 02).
- Corrida completa de los 31 casos automatizados: **≈ 35 segundos**.
