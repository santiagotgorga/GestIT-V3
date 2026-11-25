# GestIT V3 — Resumen para el equipo (Entrega 03)

Testing de Aplicaciones · UADE · Grupo 12

Este documento es para ponerse al día con todo lo hecho para la Entrega 03: qué hay, dónde está, cómo se corre
y qué falta.

## 1. Dónde está todo

| Qué | Dónde |
|---|---|
| Código de V3 y documentos | Repo **github.com/santiagotgorga/GestIT-V3**, rama **`v3`** |
| V2 tal como se entregó | Rama `main` del mismo repo. El repo de Juan no se tocó. |
| Comparación V2 → V3 | Pull request `v3 → main` en ese repo (todavía sin mergear) |
| Planilla con casos, defectos y resultados | `docs/V3/TPO - TC and Defect Template GRUPO12 - V3.xlsx`, hoja **"Resumen V3"** |
| Presentación (16 diapositivas) | La comparte Santiago (artifact de Claude) |

**Por qué un repo nuevo:** Claude no tenía permiso para escribir en el repo de Juan. Se creó `GestIT-V3` con la
misma historia (V2 + V3). Al final se puede llevar la rama `v3` al repo de Juan con 3 comandos (están en el README).

## 2. Qué tiene V3

**Defectos de V2 corregidos y confirmados.** Se encontraron con testing exploratorio con charters, que es lo que
pidió el profe en la devolución de la Entrega 02:

| ID | Defecto |
|---|---|
| BUG‑02 / 03 | Redirección abierta en el login con `?next=/\example.com` (el caso del profe) y una variante con tabulación |
| BUG‑04 | Inyección de fórmulas en el CSV exportado |
| BUG‑05 | La entrega aceptaba `empleadoId: true` y le entregaba el equipo a otra persona |
| BUG‑06 | El login no limitaba los intentos fallidos |
| BUG‑07 | El servidor no recortaba los espacios del usuario |
| BUG‑08 | Un emoji contaba como 2 caracteres en los límites |
| OBS‑01 | Se aceptaba un N° de serie `----` |

**Funcionalidades nuevas** (estaban en el backlog de V1 y nunca se habían hecho):
- **HU‑05 · Editar equipo:** botón "Editar" en el listado y en la ficha.
- **HU‑11 · Usuarios:** alta, cambio de rol, activar/desactivar, bloqueo de 15 minutos tras 5 intentos fallidos y
  desbloqueo.
- **HU‑12 · Auditoría:** registro de quién hizo qué y cuándo, con filtros y paginación. No se puede modificar.

**Regresión automatizada con Selenium:** 31 de los 48 casos de V1/V2 (todos los de prioridad alta + valores
límite), en `test/regresion/`.

## 3. Cómo correrlo

```bash
git clone -b v3 https://github.com/santiagotgorga/GestIT-V3.git
cd GestIT-V3
npm install
npm start
```

Después abrir **http://localhost:3000** (admin / admin123 · operador / operador123). Importante: desde V3,
`npm install` es obligatorio porque `node_modules` ya no está en el repo.

Tests automatizados (hace falta Google Chrome):

```bash
npm test
npm run test:ver
npm run test:reporte
```

`test:ver` muestra el navegador (para la demo) y `test:reporte` genera `reportes/reporte-regresion.html`.

## 4. Resultados de la ejecución de V3

| Ejecución | Casos | PASS | FAIL | BLOCKED |
|---|---|---|---|---|
| Regresión automatizada (Selenium) | 31 | 31 | 0 | 0 |
| Casos nuevos de V3 (manual, TC‑49 a TC‑82) | 34 | 34 | 0 | 0 |
| Regresión manual (11 casos de V1/V2) | 11 | 10 | **1** | 0 |
| **Total** | **76** | **75** | **1** | **0** |

La ejecución manual la hizo Santiago, caso por caso; los resultados están en la planilla con lo que se vio en cada
uno. La primera corrida de Selenium en la PC de Santiago dio **29/31**: fueron 2 falsos negativos del script
(AUT‑01), que se corrigieron, y la segunda corrida dio 31/31.

**Cambió de estado:** TC‑41 dio PASS en V2 y **FAIL en V3**.

**Hallazgos de la ejecución de V3:**

| ID | Hallazgo | Estado |
|---|---|---|
| **BUG‑09** | El CSV se abre en una sola columna en Excel en español (ya pasaba en V2 y nadie lo vio) | **Abierto** |
| **BUG‑10** | En un celular (360 px) el menú del admin no entra y "Configuración" queda inaccesible: regresión que trajo V3 al sumar 2 menús | **Abierto** |
| AUT‑01 | Falsos negativos de Selenium (TC‑15, TC‑16) | Corregido |
| TC‑77 | Un caso tenía un resultado esperado incorrecto | Corregido antes de ejecutar |
| 4 observaciones | Usabilidad: tabla que se estira con textos largos, aviso informativo en rojo, resultado viejo en pantalla en la auditoría | Registradas |

BUG‑09 y BUG‑10 se entregan **abiertos** a propósito: son defectos reales encontrados en V3, para la próxima
versión.

## 5. Qué falta

1. **Testing exploratorio (mañana).** Hay 2 charters sobre lo nuevo que probablemente den defectos reales:
   - Con 5 contraseñas incorrectas se bloquea al único admin: ¿alguien lo puede destrabar?
   - Un usuario real se bloquea y uno inexistente no: eso revela qué usuarios existen (la HU‑01 dice lo contrario).
2. **Crear la etiqueta `v2.0`** en GitHub (Releases → Create a new release → tag `v2.0` sobre `main`).
3. **Repasar la presentación** y repartir quién presenta cada parte (hay un guion en `05-Guia-Presentacion.md`).
4. **Mergear el pull request** `v3 → main` y, si queremos, llevar la rama al repo de Juan.

## 6. Documentos (carpeta `docs/V3/`)

| Archivo | Para qué |
|---|---|
| `01-Requerimientos-V3.md` | HU nuevas y modificadas |
| `02-Reportes-de-Defectos-V3.md` | BUG‑02 a BUG‑10 y AUT‑01, con causa raíz |
| `03-Seleccion-Regresion-y-Automatizacion.md` | Qué casos de V1/V2 se ejecutan, cuáles se automatizan y por qué |
| `04-Casos-de-Prueba-V3.md` | Los 34 casos nuevos |
| `05-Guia-Presentacion.md` | Objetivos de la consigna, guion y post‑mortem |
| `06-Guia-Ejecucion-Manual.md` | Paso a paso para ejecutar los casos (con comandos de API) |
