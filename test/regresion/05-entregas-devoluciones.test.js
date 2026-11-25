// =====================================================
// Regresión automatizada · Entregas y devoluciones (HU-15, HU-16)
// Casos: TC-30, TC-31, TC-32, TC-34, TC-35, TC-36
// =====================================================
const t = require("../soporte/entorno");
const { assert, By } = t;

async function abrirEntrega(d, codigo) {
  await t.clic(d, `btn-entregar-${codigo}`);
  await t.esperar(d, "select-empleado");
  // Espera a que se carguen los empleados en el selector
  await d.wait(async () => (await d.findElements(By.css('[data-testid="select-empleado"] option'))).length > 1, t.ESPERA);
}

async function opcionesEmpleado(d) {
  const opciones = await d.findElements(By.css('[data-testid="select-empleado"] option'));
  return Promise.all(opciones.map((o) => o.getText()));
}

async function abrirDevolucion(d, codigo) {
  await t.clic(d, `btn-devolucion-${codigo}`);
  await t.esperar(d, "radio-condicion-ok");
}

describe("Entregas y devoluciones", function () {
  const ctx = {};
  t.prepararSuite(ctx);

  it("TC-30 · Entrega de un equipo disponible", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirEntrega(d, "EQ-00001");
    await t.elegir(d, "select-empleado", "2"); // Pérez, Carlos
    await t.clic(d, "btn-confirmar-entrega");
    await t.esperarTexto(d, "alerta-global", "Equipo entregado. Acta AE-000002 generada.");
    assert.equal(await t.texto(d, "estado-EQ-00001"), "Asignado");
    assert.equal(await t.texto(d, "responsable-EQ-00001"), "Pérez, Carlos");
  });

  it("TC-31 · No se puede entregar a un empleado inactivo", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirEntrega(d, "EQ-00001");
    const opciones = await opcionesEmpleado(d);
    assert.ok(!opciones.some((o) => o.includes("Díaz")), "Lucía Díaz (inactiva) no debe figurar");

    const api = await t.sesionApi("operador", "operador123");
    const r = await api("/api/equipos/EQ-00001/entrega", { method: "POST", body: { empleadoId: 3 } });
    assert.equal(r.status, 409);
    assert.equal(r.data.error, "El empleado no está activo.");
  });

  it("TC-32 · No se puede entregar un equipo En reparación", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await t.esperar(d, "fila-EQ-00004");
    assert.equal(await t.existe(d, "btn-entregar-EQ-00004"), false);

    const api = await t.sesionApi("operador", "operador123");
    const r = await api("/api/equipos/EQ-00004/entrega", { method: "POST", body: { empleadoId: 2 } });
    assert.equal(r.status, 409);
    assert.equal(r.data.error, "El equipo no está disponible para entrega.");
  });

  it("TC-34 · Devolución en condiciones", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirDevolucion(d, "EQ-00005");
    await t.clic(d, "radio-condicion-ok");
    await t.clic(d, "btn-confirmar-devolucion");
    await t.esperarTexto(d, "alerta-global", "Devolución registrada. Acta AD-000001 generada.");
    assert.equal(await t.texto(d, "estado-EQ-00005"), "Disponible");
    assert.equal(await t.texto(d, "responsable-EQ-00005"), "—");
  });

  it("TC-35 · Devolución con falla", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirDevolucion(d, "EQ-00005");
    await t.clic(d, "radio-condicion-falla");
    await t.escribir(d, "input-falla", "Batería no carga");
    await t.clic(d, "btn-confirmar-devolucion");
    await t.esperarTexto(d, "alerta-global", "Acta AD-000001 generada.");
    assert.equal(await t.texto(d, "estado-EQ-00005"), "En reparación");

    await t.clic(d, "link-ficha-EQ-00005");
    assert.match(await t.texto(d, "tabla-historial-estados"), /Batería no carga/);
  });

  it("TC-36 · Validaciones de la devolución [data-driven]", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);

    // Sin condición
    await abrirDevolucion(d, "EQ-00005");
    await t.clic(d, "btn-confirmar-devolucion");
    assert.equal(await t.texto(d, "error-condicion"), "Indicá la condición del equipo.");

    // Con falla y 9 caracteres
    await t.clic(d, "radio-condicion-falla");
    await t.escribir(d, "input-falla", "123456789");
    await t.clic(d, "btn-confirmar-devolucion");
    assert.equal(await t.texto(d, "error-falla"), "La descripción de la falla debe tener entre 10 y 500 caracteres.");

    // Con falla y 10 caracteres -> se registra
    await t.escribir(d, "input-falla", "1234567890");
    await t.clic(d, "btn-confirmar-devolucion");
    await t.esperarTexto(d, "alerta-global", "Devolución registrada.");
  });
});
