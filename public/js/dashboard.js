// =====================================================
// GestIT V2 - listado de equipos (HU-04, HU-07, HU-08, HU-15, HU-16, HU-19)
// =====================================================
let equipos = [];

const tableBody = document.getElementById("equipmentTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const includeBajas = document.getElementById("includeBajas");
const modalOverlay = document.getElementById("modalOverlay");
const equipmentForm = document.getElementById("equipmentForm");
const formError = document.getElementById("formError");

async function iniciarDashboard() {
  const sesion = await requerirSesion();
  if (!sesion) return;

  renderHeader("equipos");
  inicializarAcciones(cargarEquipos);

  // Columna Responsable solo con el módulo Personas activo (HU-20)
  if (!GestIT.modulos.personas) {
    document.querySelectorAll(".col-responsable").forEach((el) => el.classList.add("hidden"));
  }

  // Exportar CSV solo con el módulo Identificación activo (HU-19)
  document.getElementById("exportCsvBtn").classList.toggle("hidden", !GestIT.modulos.identificacion);

  await cargarEquipos();
}

async function cargarEquipos() {
  const { ok, status, data } = await api("/api/equipos");

  if (status === 401) {
    window.location.href = "/";
    return;
  }
  if (!ok) {
    mostrarAlerta(data.error || "No se pudieron cargar los equipos.", "error");
    return;
  }

  equipos = data;
  actualizarEstadisticas();
  renderizarEquipos();
}

function actualizarEstadisticas() {
  const contar = (estado) => equipos.filter((e) => e.estado === estado).length;

  document.getElementById("totalEquipos").textContent = equipos.length;
  document.getElementById("disponibles").textContent = contar("Disponible");
  document.getElementById("asignados").textContent = contar("Asignado");
  document.getElementById("enReparacion").textContent = contar("En reparación");
  document.getElementById("dadosDeBaja").textContent = contar("Dado de baja");
}

function filtrosActuales() {
  return {
    q: searchInput.value.trim(),
    categoria: categoryFilter.value,
    estado: statusFilter.value,
    incluirBajas: includeBajas.checked
  };
}

// Mismas reglas que el servidor (HU-07)
function obtenerEquiposFiltrados() {
  const { q, categoria, estado, incluirBajas } = filtrosActuales();
  const busqueda = q.toLowerCase();

  return equipos.filter((e) => {
    const coincideBusqueda =
      !busqueda ||
      e.codigo.toLowerCase().includes(busqueda) ||
      e.marca.toLowerCase().includes(busqueda) ||
      e.modelo.toLowerCase().includes(busqueda) ||
      e.numeroSerie.toLowerCase().includes(busqueda);
    const coincideCategoria = !categoria || e.categoria === categoria;
    const coincideEstado = !estado || e.estado === estado;
    const visiblePorBaja = e.estado !== "Dado de baja" || incluirBajas || estado === "Dado de baja";
    return coincideBusqueda && coincideCategoria && coincideEstado && visiblePorBaja;
  });
}

function renderizarEquipos() {
  const filtrados = obtenerEquiposFiltrados();
  const mostrarResponsable = GestIT.modulos.personas;

  tableBody.innerHTML = "";
  document.getElementById("resultCount").textContent =
    `${filtrados.length} ${filtrados.length === 1 ? "equipo" : "equipos"}`;

  if (filtrados.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filtrados.forEach((equipo) => {
    const row = document.createElement("tr");
    row.setAttribute("data-testid", `fila-${equipo.codigo}`);

    row.innerHTML = `
      <td><a class="link-codigo" href="/equipo.html?codigo=${equipo.codigo}" data-testid="link-ficha-${equipo.codigo}">${equipo.codigo}</a></td>
      <td><strong>${escapeHtml(equipo.marca)}</strong></td>
      <td>${escapeHtml(equipo.modelo)}</td>
      <td><code>${escapeHtml(equipo.numeroSerie)}</code></td>
      <td>${escapeHtml(equipo.categoria)}</td>
      <td><span class="status-badge ${claseEstado(equipo.estado)}" data-testid="estado-${equipo.codigo}">${escapeHtml(equipo.estado)}</span></td>
      ${mostrarResponsable ? `<td data-testid="responsable-${equipo.codigo}">${equipo.responsable ? escapeHtml(equipo.responsable.nombre) : "—"}</td>` : ""}
      <td>${renderAccionesEquipo(equipo)}</td>
    `;

    tableBody.appendChild(row);
  });
}

function limpiarFiltros() {
  searchInput.value = "";
  categoryFilter.value = "";
  statusFilter.value = "";
  includeBajas.checked = false;
  renderizarEquipos();
}

// -------------------------
// Alta de equipo (HU-04 v2)
// -------------------------
function validarEquipo(datos) {
  const errores = {};

  if (largo(datos.marca) < 2 || largo(datos.marca) > 50) {
    errores.marca = "La marca debe tener entre 2 y 50 caracteres.";
  }
  if (largo(datos.modelo) < 2 || largo(datos.modelo) > 80) {
    errores.modelo = "El modelo debe tener entre 2 y 80 caracteres.";
  }
  if (largo(datos.numeroSerie) < 4 || largo(datos.numeroSerie) > 40) {
    errores.numeroSerie = "El número de serie debe tener entre 4 y 40 caracteres.";
  } else if (!/^[A-Za-z0-9-]+$/.test(datos.numeroSerie)) {
    errores.numeroSerie = "El número de serie solo admite letras, números y guiones.";
  } else if (!/[A-Za-z0-9]/.test(datos.numeroSerie)) {
    errores.numeroSerie = "El número de serie debe contener al menos una letra o un número.";
  }
  if (!datos.categoria) {
    errores.categoria = "Seleccioná una categoría.";
  }
  if (largo(datos.observaciones) > 500) {
    errores.observaciones = "Las observaciones admiten hasta 500 caracteres.";
  }

  return errores;
}

equipmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  limpiarErrores(equipmentForm);
  formError.classList.add("hidden");

  const fd = new FormData(equipmentForm);
  const nuevoEquipo = {
    marca: (fd.get("marca") || "").trim(),
    modelo: (fd.get("modelo") || "").trim(),
    numeroSerie: (fd.get("numeroSerie") || "").trim(),
    categoria: fd.get("categoria") || "",
    observaciones: (fd.get("observaciones") || "").trim()
  };

  const errores = validarEquipo(nuevoEquipo);
  if (Object.keys(errores).length > 0) {
    Object.entries(errores).forEach(([campo, mensaje]) => errorEnCampo(equipmentForm, campo, mensaje));
    return;
  }

  const { ok, data } = await api("/api/equipos", { method: "POST", body: nuevoEquipo });

  if (!ok) {
    if (data.campo) {
      errorEnCampo(equipmentForm, data.campo, data.error);
    } else {
      formError.textContent = data.error || "No se pudo crear el equipo.";
      formError.classList.remove("hidden");
    }
    return;
  }

  cerrarModal();
  equipmentForm.reset();
  mostrarAlerta(`Equipo ${data.codigo} creado correctamente.`, "success");
  await cargarEquipos();
});

function abrirModal() {
  limpiarErrores(equipmentForm);
  equipmentForm.reset();
  formError.classList.add("hidden");
  modalOverlay.classList.remove("hidden");
  document.getElementById("marca").focus();
}

function cerrarModal() {
  modalOverlay.classList.add("hidden");
}

// -------------------------
// Exportar CSV (HU-19)
// -------------------------
async function exportarCsv() {
  const f = filtrosActuales();
  const params = new URLSearchParams({
    q: f.q,
    categoria: f.categoria,
    estado: f.estado,
    incluirBajas: f.incluirBajas ? "true" : "false"
  });

  const response = await fetch(`/api/equipos/export?${params.toString()}`);

  if (!response.ok) {
    let mensaje = "No se pudo exportar el listado.";
    try {
      mensaje = (await response.json()).error || mensaje;
    } catch (e) { /* sin cuerpo */ }
    mostrarAlerta(mensaje, "error");
    return;
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const nombre = (disposition.match(/filename="(.+)"/) || [])[1] || "gestit_equipos.csv";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document.getElementById("newEquipmentBtn").addEventListener("click", abrirModal);
document.getElementById("closeModalBtn").addEventListener("click", cerrarModal);
document.getElementById("cancelModalBtn").addEventListener("click", cerrarModal);
document.getElementById("clearFiltersBtn").addEventListener("click", limpiarFiltros);
document.getElementById("clearFiltersEmptyBtn").addEventListener("click", limpiarFiltros);
document.getElementById("exportCsvBtn").addEventListener("click", exportarCsv);

modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) cerrarModal();
});

searchInput.addEventListener("input", renderizarEquipos);
categoryFilter.addEventListener("change", renderizarEquipos);
statusFilter.addEventListener("change", renderizarEquipos);
includeBajas.addEventListener("change", renderizarEquipos);

iniciarDashboard();
