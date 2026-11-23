// =====================================================
// Regresión automatizada · Padrón de empleados (HU-13, HU-14)
// Casos: TC-23, TC-24, TC-25, TC-29
// =====================================================
const t = require("../soporte/entorno");
const { assert, until } = t;

async function abrirEmpleados(d) {
  await t.clic(d, "nav-empleados");
  await d.wait(until.urlContains("/empleados.html"), t.ESPERA);
  await t.esperar(d, "fila-empleado-30111222");
}

async function cargarEmpleado(d, { nombre, apellido, documento, sector, email }) {
  await t.clic(d, "btn-nuevo-empleado");
  await t.escribir(d, "input-nombre", nombre);
  await t.escribir(d, "input-apellido", apellido);
  await t.escribir(d, "input-documento", documento);
  await t.elegir(d, "select-sector", sector);
  await t.escribir(d, "input-email", email);
  await t.clic(d, "btn-crear-empleado");
}

const MARTIN = { nombre: "Martín", apellido: "López", documento: "40123456", sector: "Operaciones", email: "martin.lopez@empresa.com" };

describe("Padrón de empleados", function () {
  const ctx = {};
  t.prepararSuite(ctx);

  it("TC-23 · Alta válida de empleado", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirEmpleados(d);
    await cargarEmpleado(d, MARTIN);
    await t.esperarTexto(d, "alerta-global", "Empleado López, Martín creado correctamente.");
    assert.equal(await t.texto(d, "estado-empleado-40123456"), "Activo");
    assert.equal(await t.texto(d, "cantidad-equipos-40123456"), "0");
  });

  it("TC-24 · Documento: particiones y valores límite [data-driven]", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirEmpleados(d);
    const casos = [
      { documento: "123456", valido: false },
      { documento: "1234567", valido: true },
      { documento: "12345678", valido: true },
      { documento: "123456789", valido: false },
      { documento: "1234567a", valido: false }
    ];
    for (const c of casos) {
      await cargarEmpleado(d, { ...MARTIN, documento: c.documento });
      if (c.valido) {
        await t.esperar(d, `fila-empleado-${c.documento}`);
      } else {
        assert.equal(await t.texto(d, "error-documento"), "El documento debe tener 7 u 8 dígitos numéricos.",
          `El documento "${c.documento}" debería ser inválido`);
        await t.clic(d, "btn-cancelar-empleado");
      }
    }
  });

  it("TC-25 · Documento duplicado", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirEmpleados(d);
    await cargarEmpleado(d, { ...MARTIN, documento: "30111222" });
    assert.equal(await t.texto(d, "error-documento"), "Ya existe un empleado con ese documento.");
  });

  it("TC-29 · No se puede dar de baja un empleado con equipos asignados", async () => {
    const d = ctx.driver;
    await t.loginAdmin(d);
    await abrirEmpleados(d);
    await t.clic(d, "btn-baja-empleado-30111222");
    await t.aceptarConfirmacion(d);
    await t.esperarTexto(d, "alerta-global", "No se puede dar de baja: el empleado tiene 1 equipo(s) asignado(s).");
    assert.equal(await t.texto(d, "estado-empleado-30111222"), "Activo");

    // El Operador no ve el botón y por API recibe 403
    const api = await t.sesionApi("operador", "operador123");
    const r = await api("/api/empleados/2/baja", { method: "PATCH" });
    assert.equal(r.status, 403);
  });
});
