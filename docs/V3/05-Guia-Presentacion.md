# GestIT V3 — Guía para la presentación de la Entrega 03

Testing de Aplicaciones · UADE · Grupo 12

Cada objetivo de la consigna, con el material que lo responde.

| # | Objetivo de la consigna | Material | Estado |
|---|---|---|---|
| 1 | Resumen de las nuevas funcionalidades y los requerimientos funcionales | `01-Requerimientos-V3.md` (HU‑05, HU‑11, HU‑12 y ajustes a HU‑01/03/04/15/19) | ✅ |
| 2 | Casos de prueba de las funcionalidades de V3 | `04-Casos-de-Prueba-V3.md` y hojas TC‑49 a TC‑82 de la planilla | ✅ diseñados · ⏳ ejecutar |
| 3 | Cómo se seleccionaron los casos de V1 y V2 que se ejecutan | `03-Seleccion…`, secciones 1, 2 y 4 | ✅ |
| 4 | Cómo se seleccionaron los casos a automatizar | `03-Seleccion…`, sección 3 (criterios de la clase + pirámide de Cohn) | ✅ |
| 5 | Especificación de los casos de regresión | `03-Seleccion…`, sección 5 (automatizados y manuales, con cambios para V3) | ✅ |
| 6 | Resumen de ejecuciones: % PASSED / FAILED / BLOCKED y cambios de estado por entrega, con gráfico | Hoja **Resumen V3** de la planilla (fórmulas y gráfico que se actualizan solos) + `reportes/reporte-regresion.html` | ⏳ completar la ejecución manual |
| 7 | Resumen de defectos | `02-Reportes-de-Defectos-V3.md` + hojas "Defect Report - BUG‑0x" | ✅ reportados y corregidos · ⏳ confirmar |

## Lo que falta (lo hace el equipo)

1. **Ejecución manual** de los 34 casos de V3 (TC‑49 a TC‑82) y de los 11 de regresión manual
   (TC‑08, 11, 13, 14, 26, 33, 39, 41, 42, 43, 44). Por cada uno: completar **Estado V3** (PASS / FAIL / BLOCKED),
   **Resultado obtenido** y **Ejecutado por** en la hoja *Resumen V3*, y en la hoja del caso *QA Tester's Log*,
   *Created By* / *Reviewed By* y *Actual Result (V3)*.
2. Si aparece un defecto nuevo en V3: reportarlo como **BUG‑09 en adelante** con la plantilla. Que V3 tenga algún
   FAILED no es malo: la devolución de la Entrega 02 criticó justamente el 100 % PASSED.
3. Correr `npm run test:reporte` el día de la entrega y adjuntar el HTML (o mostrar `npm run test:ver` en vivo).

## Guion sugerido (10–12 minutos)

1. **Qué cambió de V2 a V3** (1 min): pull request de `v3` → `main` en GitHub; un commit por defecto y por HU.
2. **Devolución de la Entrega 02 y testing exploratorio** (2 min): charters CH‑01 a CH‑05, el caso del profesor
   (`?next=/\example.com`) y la variante con tabulación que encontramos nosotros. 7 defectos nuevos.
3. **Funcionalidades nuevas** (2 min): demo de Editar equipo, Usuarios (bloqueo a los 5 intentos) y Auditoría.
4. **Casos de prueba de V3** (1 min): 34 casos, técnicas usadas (valores límite, tabla de decisión, transición de
   estados, predicción de errores).
5. **Selección de regresión y de automatización** (2 min): 48 → 31 automatizados + 11 manuales + 6 fuera; criterios
   de la clase (frecuencia, criticidad, oráculo automatizable, ROI); qué **no** se automatiza y por qué.
6. **Demo de Selenium** (1–2 min): `npm run test:ver`, 31 casos en ≈ 35 s, reporte HTML.
7. **Resultados** (1–2 min): gráfico PASSED / FAILED / BLOCKED V1 → V2 → V3, casos que cambiaron de estado y
   estado de los defectos.

## Post‑mortem (guía de lectura "¿Qué es un BUG?")

Causa raíz de los defectos de V2 (para la conclusión):

| Causa raíz | Defectos | Lección |
|---|---|---|
| Requerimiento incompleto o faltante | BUG‑04, BUG‑06, OBS‑01 (y BUG‑01 en V1) | Revisar las HU con mirada de seguridad y de datos degenerados |
| Validación de texto en vez de semántica | BUG‑02, BUG‑03 | Probar variantes, no solo el caso del criterio de aceptación |
| Inconsistencia navegador / servidor | BUG‑05, BUG‑07 | La regla 2.4 necesita casos "por API" para cada campo |
| Detalle de implementación (Unicode) | BUG‑08 | Agregar particiones de caracteres no ASCII a los valores límite |

En V2 todos los casos pasaron porque **diseñamos casos que confirmaban los criterios de aceptación**. Los defectos
aparecieron cuando probamos con la intención de romper (exploratorio con charters). Para V3 combinamos las dos
cosas: casos diseñados + automatización de la regresión, que libera tiempo para explorar.
