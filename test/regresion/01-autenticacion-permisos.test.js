// =====================================================
// Regresión automatizada · Autenticación y permisos (HU-01, HU-03, HU-18, HU-20)
// Casos: TC-01, TC-03, TC-19, TC-40, TC-48
// =====================================================
const t = require("../soporte/entorno");
const { assert, By, until } = t;

describe("Autenticación y permisos", function () {
  const ctx = {};
  t.prepararSuite(ctx);

  it("TC-01 · Login exitoso de Administrador", async () => {
    const d = ctx.driver;
    await t.login(d, "admin", "admin123");
    await d.wait(until.urlContains("/dashboard"), t.ESPERA);
    await t.esperar(d, "tabla-equipos");
    const rol = await d.wait(until.elementLocated(By.id("userRole")), t.ESPERA);
    await d.wait(async () => (await rol.getText()) === "Administrador", t.ESPERA);
    assert.equal(await rol.getText(), "Administrador");
  });

  it("TC-03 · Restricción de baja de equipo para Operadores (UI)", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await t.esperar(d, "fila-EQ-00001");
    const bajas = await d.findElements(By.css('[data-testid^="btn-baja-"]'));
    assert.equal(bajas.length, 0, "El Operador no debería ver ningún botón 'Dar de baja'");
    assert.ok(await t.existe(d, "btn-reparar-EQ-00001"), "Debería ver 'Reparar'");
  });

  it("TC-19 · El Operador no puede dar de baja (UI y API)", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await t.esperar(d, "fila-EQ-00001");
    assert.equal(await t.existe(d, "btn-baja-EQ-00001"), false);

    const api = await t.sesionApi("operador", "operador123");
    const r = await api("/api/equipos/EQ-00001/baja", { method: "PATCH", body: { motivo: "Intento de baja por API" } });
    assert.equal(r.status, 403);
    assert.equal(r.data.error, "No tenés permisos para realizar esta operación.");
    const ficha = await api("/api/equipos/EQ-00001");
    assert.equal(ficha.data.estado, "Disponible");
  });

  it("TC-40 · Acceso por QR sin sesión: login y vuelta a la ficha", async () => {
    const d = ctx.driver;
    await t.abrir(d, "/equipo.html?codigo=EQ-00002");
    await d.wait(until.urlContains("next="), t.ESPERA);
    await t.escribir(d, "input-usuario", "operador");
    await t.escribir(d, "input-password", "operador123");
    await t.clic(d, "btn-login");
    await d.wait(until.urlContains("/equipo.html?codigo=EQ-00002"), t.ESPERA);
    assert.equal(await t.texto(d, "ficha-codigo"), "EQ-00002");
  });

  it("TC-48 · El Operador no accede a la configuración", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    assert.equal(await t.existe(d, "nav-configuracion"), false);
    await t.abrir(d, "/configuracion.html");
    await d.wait(until.urlContains("/dashboard"), t.ESPERA);

    const api = await t.sesionApi("operador", "operador123");
    const r = await api("/api/modulos/personas", { method: "PUT", body: { activo: false } });
    assert.equal(r.status, 403);
  });
});
