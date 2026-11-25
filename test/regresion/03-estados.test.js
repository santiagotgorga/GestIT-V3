// =====================================================
// Regresión automatizada · Cambio de estado de equipos (HU-08, HU-09, RF-05)
// Casos: TC-15, TC-16, TC-17, TC-18, TC-20
// =====================================================
const t = require("../soporte/entorno");
const { assert, By } = t;

async function abrirReparar(d, codigo) {
  await t.clic(d, `btn-reparar-${codigo}`);
  await t.esperar(d, "input-motivo");
}

describe("Cambio de estado de equipos", function () {
  const ctx = {};
  t.prepararSuite(ctx);

  it("TC-15 · Reparar un equipo disponible con motivo válido", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirReparar(d, "EQ-00001");
    await t.escribir(d, "input-motivo", "No enciende la pantalla");
    await t.clic(d, "btn-confirmar-estado");
    await t.esperarTexto(d, "estado-EQ-00001", "En reparación");

    await t.clic(d, "link-ficha-EQ-00001");
    await t.esperar(d, "tabla-historial-estados");
    // Se vuelve a buscar la fila en cada intento por si la ficha se redibuja
    await d.wait(async () => {
      try {
        const fila = await d.findElement(By.css('[data-testid="tabla-historial-estados"] tbody tr:first-child'));
        return /No enciende la pantalla/.test(await fila.getText());
      } catch (error) {
        return false;
      }
    }, t.ESPERA, "La primera fila del historial no muestra el motivo");
  });

  it("TC-16 · Valores límite del motivo (9, 10, 500 y 501 caracteres) [data-driven]", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);

    // 9 caracteres -> error, el estado no cambia
    await abrirReparar(d, "EQ-00001");
    await t.escribir(d, "input-motivo", "123456789");
    await t.clic(d, "btn-confirmar-estado");
    assert.equal(await t.texto(d, "error-motivo"), "El motivo debe tener entre 10 y 500 caracteres.");
    await t.clic(d, "btn-cancelar-estado");

    // 10 caracteres -> se aplica
    await abrirReparar(d, "EQ-00001");
    await t.escribir(d, "input-motivo", "1234567890");
    await t.clic(d, "btn-confirmar-estado");
    await t.esperarTexto(d, "estado-EQ-00001", "En reparación");

    // 501 caracteres -> el campo admite como máximo 500 (atributo maxlength)
    await abrirReparar(d, "EQ-00002");
    const motivo = await t.esperar(d, "input-motivo");
    assert.equal(await motivo.getAttribute("maxlength"), "500", "El motivo debe limitarse a 500 caracteres");
    await motivo.sendKeys("x".repeat(501));
    const largoTipeado = (await motivo.getAttribute("value")).length;
    assert.ok(largoTipeado <= 500, `El campo aceptó ${largoTipeado} caracteres (máximo 500)`);

    // 500 caracteres -> se aplica
    await t.escribir(d, "input-motivo", "x".repeat(500));
    await t.clic(d, "btn-confirmar-estado");
    await t.esperarTexto(d, "estado-EQ-00002", "En reparación");

    // 501 por API -> 400
    const api = await t.sesionApi("operador", "operador123");
    const r = await api("/api/equipos/EQ-00003/estado", {
      method: "PATCH", body: { estado: "En reparación", motivo: "x".repeat(501) }
    });
    assert.equal(r.status, 400);
  });

  it("TC-17 · No se puede asignar un equipo manualmente", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await t.esperar(d, "fila-EQ-00001");
    const asignar = await d.findElements(By.css('[data-testid^="btn-asignar-"]'));
    assert.equal(asignar.length, 0, "No debe existir un botón para asignar manualmente");

    const api = await t.sesionApi("operador", "operador123");
    const r = await api("/api/equipos/EQ-00001/estado", {
      method: "PATCH", body: { estado: "Asignado", motivo: "Asignación manual por API" }
    });
    assert.equal(r.status, 409);
    assert.equal(r.data.error, 'No se puede pasar de "Disponible" a "Asignado".');
    assert.equal((await api("/api/equipos/EQ-00001")).data.estado, "Disponible");
  });

  it("TC-18 · Un equipo dado de baja no admite cambios", async () => {
    const d = ctx.driver;
    const api = await t.sesionApi("admin", "admin123");
    await api("/api/equipos/EQ-00003/estado", {
      method: "PATCH", body: { estado: "Dado de baja", motivo: "Equipo obsoleto para pruebas" }
    });

    await t.loginAdmin(d);
    await t.clic(d, "check-incluir-bajas");
    await t.esperar(d, "sin-acciones-EQ-00003");

    const r = await api("/api/equipos/EQ-00003/estado", {
      method: "PATCH", body: { estado: "Disponible", motivo: "Intento de reactivación" }
    });
    assert.equal(r.status, 409);
    assert.equal((await api("/api/equipos/EQ-00003")).data.estado, "Dado de baja");
  });

  it("TC-20 · No se puede dar de baja un equipo Asignado", async () => {
    const d = ctx.driver;
    await t.loginAdmin(d);
    await t.esperar(d, "btn-devolucion-EQ-00005");
    // Cambio para V3: además de "Registrar devolución" aparece "Editar" (HU-05)
    assert.equal(await t.existe(d, "btn-baja-EQ-00005"), false);
    assert.equal(await t.existe(d, "btn-reparar-EQ-00005"), false);

    const api = await t.sesionApi("admin", "admin123");
    const r = await api("/api/equipos/EQ-00005/baja", { method: "PATCH", body: { motivo: "Intento de baja de asignado" } });
    assert.equal(r.status, 409);
  });
});
