// =====================================================
// Regresión automatizada · Equipos: alta y búsqueda (HU-04, HU-06, HU-07)
// Casos: TC-02, TC-04, TC-05, TC-06, TC-07, TC-09, TC-10, TC-12, TC-21
// =====================================================
const t = require("../soporte/entorno");
const { assert, until } = t;

async function abrirAlta(d) {
  await t.clic(d, "btn-nuevo-equipo");
  await t.esperar(d, "input-marca");
}

async function completarAlta(d, { marca, modelo, serie, categoria }) {
  await t.escribir(d, "input-marca", marca);
  await t.escribir(d, "input-modelo", modelo);
  await t.escribir(d, "input-serie", serie);
  if (categoria) await t.elegir(d, "select-categoria", categoria);
  await t.clic(d, "btn-crear-equipo");
}

describe("Equipos: alta, búsqueda y ficha", function () {
  const ctx = {};
  t.prepararSuite(ctx);

  it("TC-02 · Alta de equipo con campos obligatorios", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirAlta(d);
    // Cambio para V2/V3: la serie SM001 ya existe, se usa SM002
    await completarAlta(d, { marca: "Samsung", modelo: "S24F350", serie: "SM002", categoria: "Monitor" });
    await t.esperarTexto(d, "alerta-global", "Equipo EQ-00006 creado correctamente.");
    assert.equal(await t.texto(d, "estado-EQ-00006"), "Disponible");
  });

  it("TC-04 · Filtro de búsqueda por texto", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await t.escribir(d, "input-buscar", "Samsung");
    await t.esperarTexto(d, "contador-resultados", "1 equipo");
    assert.deepEqual(await t.codigosVisibles(d), ["EQ-00003"]);
  });

  it("TC-05 · Alta válida genera código interno correlativo", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirAlta(d);
    await completarAlta(d, { marca: "Lenovo", modelo: "ThinkPad L15", serie: "PF-56743", categoria: "Notebook" });
    await t.esperarTexto(d, "alerta-global", "Equipo EQ-00006 creado correctamente.");
    await t.clic(d, "link-ficha-EQ-00006");
    assert.equal(await t.texto(d, "ficha-estado"), "Disponible");
    assert.match(await t.texto(d, "tabla-historial-estados"), /Alta del equipo/);
  });

  it("TC-06 · Confirmación BUG-01: el alta rechaza campos de 1 carácter", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirAlta(d);
    await completarAlta(d, { marca: "a", modelo: "a", serie: "a", categoria: "Notebook" });
    assert.equal(await t.texto(d, "error-marca"), "La marca debe tener entre 2 y 50 caracteres.");
    assert.equal(await t.texto(d, "error-modelo"), "El modelo debe tener entre 2 y 80 caracteres.");
    assert.equal(await t.texto(d, "error-serie"), "El número de serie debe tener entre 4 y 40 caracteres.");
    const api = await t.sesionApi("operador", "operador123");
    assert.equal((await api("/api/equipos")).data.length, 5, "No se debe crear el equipo");
  });

  it("TC-07 · Valores límite de Marca (1, 2, 50 y 51 caracteres) [data-driven]", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    const casos = [
      { largo: 1, valido: false },
      { largo: 2, valido: true },
      { largo: 50, valido: true },
      { largo: 51, valido: false }
    ];
    for (const [i, c] of casos.entries()) {
      await abrirAlta(d);
      await completarAlta(d, { marca: "M".repeat(c.largo), modelo: "Modelo X", serie: `LIM-000${i}`, categoria: "PC" });
      if (c.valido) {
        await t.esperarTexto(d, "alerta-global", "creado correctamente");
      } else {
        assert.equal(await t.texto(d, "error-marca"), "La marca debe tener entre 2 y 50 caracteres.",
          `Marca de ${c.largo} caracteres debería dar error`);
        await t.clic(d, "btn-cancelar-equipo");
      }
    }
    const api = await t.sesionApi("operador", "operador123");
    assert.equal((await api("/api/equipos")).data.length, 7, "Solo deben crearse los 2 válidos");
  });

  it("TC-09 · N° de serie duplicado ignorando mayúsculas y espacios", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await abrirAlta(d);
    await completarAlta(d, { marca: "Dell", modelo: "Latitude", serie: " dl001 ", categoria: "Notebook" });
    assert.equal(await t.texto(d, "error-serie"), "Ya existe un equipo con ese número de serie.");
  });

  it("TC-10 · El servidor valida el alta aunque se omita la interfaz", async () => {
    const api = await t.sesionApi("operador", "operador123");
    const r = await api("/api/equipos", {
      method: "POST", body: { marca: "a", modelo: "Modelo", numeroSerie: "API-0001", categoria: "PC" }
    });
    assert.equal(r.status, 400);
    assert.equal(r.data.error, "La marca debe tener entre 2 y 50 caracteres.");
    assert.equal((await api("/api/equipos")).data.length, 5);
  });

  it("TC-12 · Equipos dados de baja excluidos por defecto", async () => {
    const d = ctx.driver;
    const api = await t.sesionApi("admin", "admin123");
    await api("/api/equipos/EQ-00003/estado", {
      method: "PATCH", body: { estado: "Dado de baja", motivo: "Equipo obsoleto para pruebas" }
    });
    await t.loginAdmin(d);
    await t.esperar(d, "fila-EQ-00001");
    assert.ok(!(await t.codigosVisibles(d)).includes("EQ-00003"), "No debería verse por defecto");
    await t.clic(d, "check-incluir-bajas");
    await t.esperar(d, "fila-EQ-00003");
  });

  it("TC-21 · Ficha de un equipo asignado", async () => {
    const d = ctx.driver;
    await t.loginOperador(d);
    await t.clic(d, "link-ficha-EQ-00005");
    assert.equal(await t.texto(d, "ficha-estado"), "Asignado");
    assert.equal(await t.texto(d, "responsable-nombre"), "Gómez, Ana");
    await t.esperar(d, "link-acta-AE-000001");
    const tenencias = await t.texto(d, "tabla-tenencias");
    assert.match(tenencias, /Gómez, Ana/);
  });
});
