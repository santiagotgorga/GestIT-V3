# GestIT V3

GestIT - Gestión de activos de IT (V3). Trabajo práctico del Grupo 12 para la materia **Testing de Aplicaciones**.

> **Novedades de V3:** edición de equipos (HU-05), administración de usuarios con bloqueo por intentos fallidos
> (HU-11), registro de auditoría (HU-12), corrección de los defectos BUG-02 a BUG-08 y regresión automatizada
> con Selenium. La V2 entregada queda en la rama `main` y en la etiqueta `v2.0`.

## Requisitos

- **Node.js 18 o superior** (incluye `npm`). Descarga: https://nodejs.org (versión LTS).
- **Git** (para clonar el repositorio). Descarga: https://git-scm.com

Para verificar que están instalados:

```bash
node -v
npm -v
git --version
```

## Cómo iniciar el programa localmente

### En Mac (Terminal)

1. Abrir la app **Terminal** (Cmd + Espacio → escribir "Terminal").
2. Si no tenés Node.js, instalarlo desde https://nodejs.org, o con Homebrew:
   ```bash
   brew install node
   ```
3. Clonar el repositorio y entrar a la carpeta:
   ```bash
   git clone https://github.com/jrua182/GestITV2-Testing-de-Aplicaciones.git
   cd GestITV2-Testing-de-Aplicaciones
   ```
4. Instalar dependencias (obligatorio: desde V3 el repo ya no incluye `node_modules`):
   ```bash
   npm install
   ```
5. Iniciar el servidor:
   ```bash
   npm start
   ```
6. Abrir en el navegador:
   ```bash
   open http://localhost:3000
   ```

### En Windows (PowerShell o Símbolo del sistema)

1. Abrir **PowerShell** (tecla Windows → escribir "PowerShell").
2. Si no tenés Node.js, instalarlo desde https://nodejs.org, o con winget:
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```
   Después de instalarlo, cerrar y volver a abrir PowerShell.
3. Clonar el repositorio y entrar a la carpeta:
   ```powershell
   git clone https://github.com/jrua182/GestITV2-Testing-de-Aplicaciones.git
   cd GestITV2-Testing-de-Aplicaciones
   ```
4. Instalar dependencias:
   ```powershell
   npm install
   ```
5. Iniciar el servidor:
   ```powershell
   npm start
   ```
6. Abrir en el navegador:
   ```powershell
   start http://localhost:3000
   ```

> **Sin Git:** también se puede descargar el proyecto desde GitHub con el botón **Code → Download ZIP**, descomprimirlo, abrir la terminal dentro de la carpeta y seguir desde el paso 4.

> **Nota Windows:** si PowerShell muestra un error de "ejecución de scripts deshabilitada" al correr `npm`, usar el **Símbolo del sistema (cmd)** en su lugar, o ejecutar una vez:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

Para detener el servidor (Mac y Windows): presionar **Ctrl + C** en la terminal.

Modo desarrollo (se reinicia solo al modificar `server.js`):

```bash
npm run dev
```

## Usuarios de prueba

| Usuario    | Contraseña    | Rol           |
|------------|---------------|---------------|
| `admin`    | `admin123`    | Administrador |
| `operador` | `operador123` | Operador      |

Desde V3, 5 intentos fallidos seguidos bloquean al usuario 15 minutos. Para destrabarlo: un Administrador lo
desbloquea desde **Usuarios**, o se reinicia el servidor.

## Tests automatizados de regresión (Selenium)

Requisito: tener **Google Chrome** instalado. Selenium descarga solo el ChromeDriver que corresponde.

```bash
npm test
```

| Comando | Qué hace |
|---|---|
| `npm test` | Corre los 31 casos de regresión automatizados (sin ventana, ≈ 35 s). |
| `npm run test:ver` | Lo mismo, pero se ve el navegador mientras trabaja (ideal para la presentación). |
| `npm run test:reporte` | Genera `reportes/reporte-regresion.html` con el resultado de cada caso y gráficos. |

Los tests levantan su propio servidor en el puerto 3100 (no hace falta tener `npm start` corriendo) y restauran
los datos antes de cada caso. Si un caso falla, queda una captura en `reportes/capturas/`.

## Documentación de V3

| Documento | Contenido |
|---|---|
| `docs/V3/01-Requerimientos-V3.md` | HU nuevas y modificadas de V3 |
| `docs/V3/02-Reportes-de-Defectos-V3.md` | BUG-02 a BUG-08 (testing exploratorio) |
| `docs/V3/03-Seleccion-Regresion-y-Automatizacion.md` | Qué casos de V1/V2 se ejecutan y cuáles se automatizan, y por qué |
| `docs/V3/04-Casos-de-Prueba-V3.md` | 34 casos nuevos (TC-49 a TC-82) |
| `docs/V3/05-Guia-Presentacion.md` | Objetivos de la Entrega 03 y dónde está cada cosa |
| `docs/V3/TPO - TC and Defect Template GRUPO12 - V3.xlsx` | Planilla del grupo con los casos, defectos y el resumen con gráfico |

## Restaurar datos para pruebas (RNF-09)

Los datos se guardan en memoria y se restauran al reiniciar el servidor. También se pueden restaurar
los datos iniciales antes de cada ciclo de pruebas con sesión de Administrador:
`POST /api/test/reset`.

## Problemas comunes

- **`EADDRINUSE: address already in use :::3000`**: el puerto 3000 ya está en uso (probablemente otra instancia del servidor). Cerrar esa terminal o detenerla con Ctrl + C y volver a correr `npm start`.
- **`node` o `npm` no se reconoce como comando**: Node.js no está instalado o falta reiniciar la terminal después de instalarlo.
