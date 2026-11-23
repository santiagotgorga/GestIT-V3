// =====================================================
// GestIT V3 - soporte para los tests automatizados (Selenium WebDriver)
//
// - Levanta el servidor de GestIT en un puerto propio (no choca con `npm start`).
// - Restaura los datos iniciales antes de cada caso de prueba (RNF-09).
// - Crea el navegador Chrome controlado por Selenium.
// - Helpers para la interfaz (por data-testid, RNF-08) y para la API.
// =====================================================
const assert = require("node:assert/strict");
const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { app, resetDatos } = require("../../server");

const PUERTO = Number(process.env.PUERTO_TEST || 3100);
const BASE = `http://localhost:${PUERTO}`;
const ESPERA = 8000;

let servidor;

// Ver el navegador mientras corre: `npm run test:ver` (o la variable VER_NAVEGADOR=1)
const VER_NAVEGADOR = Boolean(process.env.VER_NAVEGADOR) || process.env.npm_lifecycle_event === "test:ver";

function crearDriver() {
  const opciones = new chrome.Options()
    .addArguments("--window-size=1366,900", "--lang=es-AR",
      "--disable-features=PasswordLeakDetection,PasswordManagerOnboarding,AutofillServerCommunication")
    // Sin gestor de contraseñas: sus avisos ("¿Guardar contraseña?") pueden tapar clics
    .setUserPreferences({ credentials_enable_service: false, "profile.password_manager_enabled": false });
  // Los confirm() quedan abiertos hasta que el test los acepte
  opciones.setAlertBehavior("ignore");
  if (!VER_NAVEGADOR) {
    opciones.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
  }

  const builder = new Builder().forBrowser("chrome").setChromeOptions(opciones);

  // Por defecto Selenium Manager descarga el ChromeDriver adecuado.
  // CHROMEDRIVER permite usar uno ya instalado (por ejemplo en un entorno sin internet).
  if (process.env.CHROMEDRIVER) {
    builder.setChromeService(new chrome.ServiceBuilder(process.env.CHROMEDRIVER).addArguments("--disable-build-check"));
  }

  return builder.build();
}

async function iniciarServidor() {
  if (servidor) return;
  await new Promise((resolve) => { servidor = app.listen(PUERTO, resolve); });
}

async function detenerServidor() {
  if (!servidor) return;
  await new Promise((resolve) => servidor.close(resolve));
  servidor = null;
}

// ---------------- Interfaz ----------------
const tid = (id) => By.css(`[data-testid="${id}"]`);

async function esperar(driver, id) {
  const el = await driver.wait(until.elementLocated(tid(id)), ESPERA, `No apareció [data-testid="${id}"]`);
  await driver.wait(until.elementIsVisible(el), ESPERA, `No se hizo visible [data-testid="${id}"]`);
  return el;
}

// Clic real del mouse. Se verifica que el evento llegó a la página: con algunas
// combinaciones de Chrome/ChromeDriver el primer clic después de tipear se pierde.
// En ese caso se repite el clic con JavaScript (queda registrado en la consola del test).
async function clic(driver, id) {
  const el = await esperar(driver, id);
  await driver.wait(until.elementIsEnabled(el), ESPERA);

  const token = String(Math.random());
  await driver.executeScript(`
    window.__clicToken = arguments[0];
    window.__clicOk = null;
    document.addEventListener("click", () => { window.__clicOk = arguments[0]; }, { capture: true, once: true });
  `, token);

  await el.click();

  // Si el clic abrió un confirm()/alert(), llegó (y no hay que tocar la página)
  try {
    await driver.switchTo().alert();
    return;
  } catch (error) { /* no hay diálogo abierto */ }

  let llego = true;
  try {
    llego = await driver.executeScript(
      "return window.__clicToken !== arguments[0] || window.__clicOk === arguments[0];", token
    );
  } catch (error) {
    llego = true; // la página navegó: el clic llegó
  }

  if (!llego) {
    if (process.env.DEBUG_CLICS) console.log(`      (clic por script en [data-testid="${id}"])`);
    await driver.executeScript("arguments[0].click();", el);
  }
}

async function escribir(driver, id, valor) {
  const el = await esperar(driver, id);
  const cargarPorScript = () => driver.executeScript(
    "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));",
    el, valor
  );

  // Textos largos (valores límite): se cargan directo para no tardar
  if (valor.length > 60) {
    await cargarPorScript();
    return;
  }

  // Se tipea como un usuario y se verifica que el campo quedó con el valor esperado
  for (let intento = 0; intento < 3; intento++) {
    await el.clear();
    if (valor.length > 0) await el.sendKeys(valor);
    if ((await el.getAttribute("value")) === valor) return;
  }
  await cargarPorScript();
}

async function elegir(driver, id, valor) {
  const el = await esperar(driver, id);
  await driver.executeScript(
    "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
    el, valor
  );
}

async function texto(driver, id) {
  return (await (await esperar(driver, id)).getText()).trim();
}

async function existe(driver, id) {
  const els = await driver.findElements(tid(id));
  for (const el of els) {
    if (await el.isDisplayed()) return true;
  }
  return false;
}

// Espera hasta que el texto del elemento contenga lo esperado
async function esperarTexto(driver, id, esperado) {
  const el = await esperar(driver, id);
  await driver.wait(async () => (await el.getText()).includes(esperado), ESPERA,
    `[data-testid="${id}"] no contiene "${esperado}"`);
  return (await el.getText()).trim();
}

async function aceptarConfirmacion(driver) {
  await driver.wait(until.alertIsPresent(), ESPERA);
  await (await driver.switchTo().alert()).accept();
}

async function abrir(driver, ruta) {
  await driver.get(BASE + ruta);
}

async function login(driver, usuario, password, ruta = "/") {
  await abrir(driver, ruta);
  await escribir(driver, "input-usuario", usuario);
  await escribir(driver, "input-password", password);
  await clic(driver, "btn-login");
}

async function loginAdmin(driver) {
  await login(driver, "admin", "admin123");
  await driver.wait(until.urlContains("/dashboard"), ESPERA);
  await esperar(driver, "tabla-equipos");
}

async function loginOperador(driver) {
  await login(driver, "operador", "operador123");
  await driver.wait(until.urlContains("/dashboard"), ESPERA);
  await esperar(driver, "tabla-equipos");
}

async function codigosVisibles(driver) {
  const filas = await driver.findElements(By.css('[data-testid="tabla-equipos"] tbody tr'));
  const codigos = [];
  for (const fila of filas) {
    codigos.push((await fila.getAttribute("data-testid")).replace("fila-", ""));
  }
  return codigos;
}

// ---------------- API ----------------
// Sesión de API independiente del navegador (para los pasos "por API" de los casos)
async function sesionApi(usuario, password) {
  const r = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, password })
  });
  const cookie = (r.headers.get("set-cookie") || "").split(";")[0];

  return async (ruta, { method = "GET", body } = {}) => {
    const resp = await fetch(BASE + ruta, {
      method,
      headers: { Cookie: cookie, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await resp.json(); } catch (e) { data = null; }
    return { status: resp.status, data };
  };
}

// Hooks comunes para cada archivo de tests
function prepararSuite(contexto) {
  before(async function () {
    this.timeout(60000);
    await iniciarServidor();
    contexto.driver = await crearDriver();
  });

  beforeEach(async () => {
    // Se sale de la página anterior antes de borrar la sesión: si no, su JavaScript
    // podría detectar la sesión borrada y redirigir al login en medio del caso siguiente.
    await contexto.driver.get("about:blank");
    await contexto.driver.get(BASE + "/api/me"); // mismo origen, sin JavaScript
    await contexto.driver.manage().deleteAllCookies();
    resetDatos(); // RNF-09: cada caso arranca con los datos iniciales
  });

  // Si un caso falla, se guarda una captura de pantalla como evidencia
  afterEach(async function () {
    if (this.currentTest.state !== "failed" || !contexto.driver) return;
    const fs = require("node:fs");
    const path = require("node:path");
    const dir = path.join(__dirname, "..", "..", "reportes", "capturas");
    fs.mkdirSync(dir, { recursive: true });
    const nombre = this.currentTest.title.split(" ")[0] + ".png";
    fs.writeFileSync(path.join(dir, nombre), await contexto.driver.takeScreenshot(), "base64");
    console.log(`      captura: reportes/capturas/${nombre} · URL: ${await contexto.driver.getCurrentUrl()}`);
  });

  after(async () => {
    if (contexto.driver) await contexto.driver.quit();
  });
}

module.exports = {
  assert, By, Key, until, BASE, ESPERA,
  iniciarServidor, detenerServidor, crearDriver, prepararSuite,
  tid, esperar, clic, escribir, elegir, texto, existe, esperarTexto, aceptarConfirmacion,
  abrir, login, loginAdmin, loginOperador, codigosVisibles, sesionApi
};
