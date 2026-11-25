// =====================================================
// Regresión automatizada · Configuración de módulos (HU-20)
// Casos: TC-45, TC-46
// =====================================================
const t = require("../soporte/entorno");
const { assert, By, until } = t;

async function abrirConfiguracion(d) {
  await t.clic(d, "nav-configuracion");
  await d.wait(until.urlContains("/configuracion.html"), t.ESPERA);
  await t.esperar(d, "modulo-personas");
}

async function clicToggle(d, id) {
  // El checkbox está oculto detrás del interruptor: se hace clic en el interruptor visible
  const toggle = await d.findElement(t.tid(id));
  await (await toggle.findElement(By.xpath("./following-sibling::span"))).click();
}

describe("Configuración de módulos", function () {
  const ctx = {};
  t.prepararSuite(ctx);

  it("TC-45 · No se puede desactivar Personas con equipos asignados", async () => {
    const d = ctx.driver;
    await t.loginAdmin(d);
    await abrirConfiguracion(d);
    await clicToggle(d, "toggle-modulo-personas");
    await t.aceptarConfirmacion(d);
    await t.esperarTexto(d, "alerta-global", "No se puede desactivar Personas y entregas: hay 1 equipo(s) asignado(s).");
    assert.equal(await d.findElement(t.tid("toggle-modulo-personas")).isSelected(), true);
  });

  it("TC-46 · Desactivar y reactivar Personas conserva los datos", async () => {
    const d = ctx.driver;
    const api = await t.sesionApi("admin", "admin123");
    await api("/api/equipos/EQ-00005/devolucion", { method: "POST", body: { condicion: "En condiciones" } });

    await t.loginAdmin(d);
    await abrirConfiguracion(d);
    await clicToggle(d, "toggle-modulo-personas");
    await t.aceptarConfirmacion(d);
    await t.esperarTexto(d, "alerta-global", "desactivado");

    // Desactivado: sin menú Empleados, sin Entregar ni columna Responsable; la API responde 403
    assert.equal(await t.existe(d, "nav-empleados"), false);
    await t.clic(d, "nav-equipos");
    await t.esperar(d, "fila-EQ-00001");
    assert.equal(await t.existe(d, "btn-entregar-EQ-00001"), false);
    assert.equal(await t.existe(d, "responsable-EQ-00001"), false);
    assert.equal((await api("/api/empleados")).status, 403);

    // Reactivado: los empleados y las tenencias siguen ahí
    await abrirConfiguracion(d);
    await clicToggle(d, "toggle-modulo-personas");
    await t.aceptarConfirmacion(d);
    await t.esperarTexto(d, "alerta-global", "activado");
    const empleados = await api("/api/empleados");
    assert.equal(empleados.data.length, 3);
    const ficha = await api("/api/equipos/EQ-00005");
    assert.equal(ficha.data.tenencias.length, 1);
  });
});
