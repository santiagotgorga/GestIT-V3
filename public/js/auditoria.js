// =====================================================
// GestIT V3 - registro de auditoría (HU-12)
// =====================================================
let paginaActual = 1;
let totalPaginas = 1;

const filtroUsuario = document.getElementById("filtroUsuario");
const filtroAccion = document.getElementById("filtroAccion");
const filtroDesde = document.getElementById("filtroDesde");
const filtroHasta = document.getElementById("filtroHasta");
const filtroTexto = document.getElementById("filtroTexto");
const errorFiltros = document.getElementById("errorFiltros");

async function iniciarAuditoria() {
  const sesion = await requerirSesion();
  if (!sesion) return;

  // Solo el Administrador accede (HU-03 v3)
  if (!esAdmin()) {
    window.location.href = "/dashboard";
    return;
  }

  renderHeader("auditoria");
  await cargarAuditoria();
}

function opciones(select, valores, textoTodos) {
  const actual = select.value;
  select.innerHTML = `<option value="">${textoTodos}</option>` +
    valores.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  if (valores.includes(actual)) select.value = actual;
}

async function cargarAuditoria() {
  errorFiltros.classList.add("hidden");

  // Validación en el navegador (se repite en el servidor)
  if (filtroDesde.value && filtroHasta.value && filtroDesde.value > filtroHasta.value) {
    errorFiltros.textContent = "La fecha Desde no puede ser posterior a Hasta.";
    errorFiltros.classList.remove("hidden");
    return;
  }

  const params = new URLSearchParams({
    usuario: filtroUsuario.value,
    accion: filtroAccion.value,
    desde: filtroDesde.value,
    hasta: filtroHasta.value,
    q: filtroTexto.value.trim(),
    pagina: String(paginaActual)
  });

  const { ok, status, data } = await api(`/api/auditoria?${params.toString()}`);

  if (status === 401) {
    window.location.href = "/";
    return;
  }
  if (!ok) {
    errorFiltros.textContent = data.error || "No se pudo cargar la auditoría.";
    errorFiltros.classList.remove("hidden");
    return;
  }

  opciones(filtroUsuario, data.usuarios, "Todos");
  opciones(filtroAccion, data.acciones, "Todas");

  paginaActual = data.pagina;
  totalPaginas = data.totalPaginas;
  document.getElementById("textoPaginacion").textContent =
    `Página ${data.pagina} de ${data.totalPaginas} · ${data.total} ${data.total === 1 ? "registro" : "registros"}`;
  document.getElementById("paginaAnterior").disabled = data.pagina <= 1;
  document.getElementById("paginaSiguiente").disabled = data.pagina >= data.totalPaginas;

  const body = document.getElementById("auditoriaBody");
  document.getElementById("sinAuditoria").classList.toggle("hidden", data.registros.length > 0);

  body.innerHTML = data.registros.map((r) => `
    <tr data-testid="fila-auditoria-${r.id}">
      <td>${formatFecha(r.fecha)}</td>
      <td data-testid="auditoria-usuario">${escapeHtml(r.usuario || "—")}</td>
      <td><code data-testid="auditoria-accion">${escapeHtml(r.accion)}</code></td>
      <td data-testid="auditoria-objeto">${escapeHtml(r.objeto || "—")}</td>
      <td data-testid="auditoria-detalle">${escapeHtml(r.detalle || "—")}</td>
    </tr>`).join("");
}

function filtrar() {
  paginaActual = 1;
  cargarAuditoria();
}

function limpiarFiltrosAuditoria() {
  filtroUsuario.value = "";
  filtroAccion.value = "";
  filtroDesde.value = "";
  filtroHasta.value = "";
  filtroTexto.value = "";
  filtrar();
}

[filtroUsuario, filtroAccion, filtroDesde, filtroHasta].forEach((el) => el.addEventListener("change", filtrar));
filtroTexto.addEventListener("input", filtrar);
document.getElementById("limpiarAuditoriaBtn").addEventListener("click", limpiarFiltrosAuditoria);
document.getElementById("paginaAnterior").addEventListener("click", () => {
  if (paginaActual > 1) { paginaActual--; cargarAuditoria(); }
});
document.getElementById("paginaSiguiente").addEventListener("click", () => {
  if (paginaActual < totalPaginas) { paginaActual++; cargarAuditoria(); }
});

iniciarAuditoria();
