// =====================================================
// GestIT V2 - padrón de empleados (HU-13, HU-14)
// =====================================================
let empleados = [];

const body = document.getElementById("empleadosBody");
const buscar = document.getElementById("buscarEmpleado");
const empForm = document.getElementById("empleadoForm");
const empOverlay = document.getElementById("empModalOverlay");

async function iniciarEmpleados() {
  const sesion = await requerirSesion();
  if (!sesion) return;

  renderHeader("empleados");

  if (!GestIT.modulos.personas) {
    document.querySelector(".main-content").innerHTML =
      `<div class="card" data-testid="modulo-desactivado"><h3>El módulo Personas y entregas está desactivado.</h3>
       <a href="/dashboard" class="btn secondary">Volver al listado</a></div>`;
    return;
  }

  await cargarEmpleados();
}

async function cargarEmpleados() {
  const { ok, data } = await api("/api/empleados");

  if (!ok) {
    mostrarAlerta(data.error || "No se pudieron cargar los empleados.", "error");
    return;
  }

  empleados = data;
  renderEmpleados();
}

function renderEmpleados() {
  const q = buscar.value.trim().toLowerCase();
  const lista = empleados.filter((e) =>
    !q ||
    e.apellido.toLowerCase().includes(q) ||
    e.nombre.toLowerCase().includes(q) ||
    e.documento.includes(q)
  );

  document.getElementById("empCount").textContent =
    `${lista.length} ${lista.length === 1 ? "empleado" : "empleados"}`;
  document.getElementById("emptyEmp").classList.toggle("hidden", lista.length > 0);

  body.innerHTML = lista.map((e) => `
    <tr data-testid="fila-empleado-${e.documento}">
      <td><strong>${escapeHtml(e.apellido)}, ${escapeHtml(e.nombre)}</strong></td>
      <td>${escapeHtml(e.documento)}</td>
      <td>${escapeHtml(e.sector)}</td>
      <td>${escapeHtml(e.email)}</td>
      <td><span class="status-badge ${e.activo ? "available" : "retired"}" data-testid="estado-empleado-${e.documento}">${e.activo ? "Activo" : "Inactivo"}</span></td>
      <td data-testid="cantidad-equipos-${e.documento}">${e.equiposAsignados}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn secondary small" data-ver="${e.id}" data-testid="btn-ver-equipos-${e.documento}">Ver equipos</button>
          ${esAdmin() && e.activo
            ? `<button type="button" class="btn danger small" data-baja="${e.id}" data-testid="btn-baja-empleado-${e.documento}">Dar de baja</button>`
            : ""}
        </div>
      </td>
    </tr>`).join("");
}

body.addEventListener("click", async (event) => {
  const ver = event.target.closest("[data-ver]");
  const baja = event.target.closest("[data-baja]");

  if (ver) {
    const emp = empleados.find((e) => e.id === Number(ver.dataset.ver));
    const { ok, data } = await api(`/api/empleados/${emp.id}/equipos`);
    document.getElementById("verEquiposSubtitle").textContent = `${emp.apellido}, ${emp.nombre}`;
    document.getElementById("verEquiposBody").innerHTML = !ok
      ? `<p class="alert error">${escapeHtml(data.error)}</p>`
      : data.length === 0
        ? `<p class="muted">No tiene equipos asignados.</p>`
        : `<table><thead><tr><th>Código</th><th>Equipo</th><th>Entregado el</th></tr></thead><tbody>
            ${data.map((eq) => `<tr><td><a class="link-codigo" href="/equipo.html?codigo=${eq.codigo}">${eq.codigo}</a></td>
            <td>${escapeHtml(eq.marca)} ${escapeHtml(eq.modelo)}</td><td>${formatFecha(eq.fechaEntrega)}</td></tr>`).join("")}
          </tbody></table>`;
    document.getElementById("verEquiposOverlay").classList.remove("hidden");
  }

  if (baja) {
    const emp = empleados.find((e) => e.id === Number(baja.dataset.baja));
    const confirmar = confirm(`¿Seguro que querés dar de baja a ${emp.apellido}, ${emp.nombre}?`);
    if (!confirmar) return;

    const { ok, data } = await api(`/api/empleados/${emp.id}/baja`, { method: "PATCH" });
    if (!ok) {
      mostrarAlerta(data.error || "No se pudo dar de baja al empleado.", "error");
      return;
    }
    mostrarAlerta(`Empleado ${emp.apellido}, ${emp.nombre} dado de baja.`, "success");
    await cargarEmpleados();
  }
});

// -------------------------
// Alta de empleado (HU-13)
// -------------------------
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

function validarEmpleado(d) {
  const errores = {};
  if (largo(d.nombre) < 2 || largo(d.nombre) > 50 || !REGEX_NOMBRE.test(d.nombre)) {
    errores.nombre = "El nombre debe tener entre 2 y 50 caracteres y solo letras.";
  }
  if (largo(d.apellido) < 2 || largo(d.apellido) > 50 || !REGEX_NOMBRE.test(d.apellido)) {
    errores.apellido = "El apellido debe tener entre 2 y 50 caracteres y solo letras.";
  }
  if (!/^\d{7,8}$/.test(d.documento)) {
    errores.documento = "El documento debe tener 7 u 8 dígitos numéricos.";
  }
  if (!d.sector) {
    errores.sector = "Seleccioná un sector.";
  }
  if (largo(d.email) > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    errores.email = "Ingresá un email válido.";
  }
  return errores;
}

empForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  limpiarErrores(empForm);
  const errorBox = document.getElementById("empFormError");
  errorBox.classList.add("hidden");

  const fd = new FormData(empForm);
  const datos = {
    nombre: (fd.get("nombre") || "").trim(),
    apellido: (fd.get("apellido") || "").trim(),
    documento: (fd.get("documento") || "").trim(),
    sector: fd.get("sector") || "",
    email: (fd.get("email") || "").trim()
  };

  const errores = validarEmpleado(datos);
  if (Object.keys(errores).length > 0) {
    Object.entries(errores).forEach(([campo, msg]) => errorEnCampo(empForm, campo, msg));
    return;
  }

  const { ok, data } = await api("/api/empleados", { method: "POST", body: datos });

  if (!ok) {
    if (data.campo) {
      errorEnCampo(empForm, data.campo, data.error);
    } else {
      errorBox.textContent = data.error || "No se pudo crear el empleado.";
      errorBox.classList.remove("hidden");
    }
    return;
  }

  empOverlay.classList.add("hidden");
  empForm.reset();
  mostrarAlerta(`Empleado ${data.apellido}, ${data.nombre} creado correctamente.`, "success");
  await cargarEmpleados();
});

document.getElementById("newEmpleadoBtn").addEventListener("click", () => {
  limpiarErrores(empForm);
  empForm.reset();
  document.getElementById("empFormError").classList.add("hidden");
  empOverlay.classList.remove("hidden");
  document.getElementById("nombre").focus();
});
document.getElementById("closeEmpModal").addEventListener("click", () => empOverlay.classList.add("hidden"));
document.getElementById("cancelEmpModal").addEventListener("click", () => empOverlay.classList.add("hidden"));
document.getElementById("closeVerEquipos").addEventListener("click", () =>
  document.getElementById("verEquiposOverlay").classList.add("hidden")
);
buscar.addEventListener("input", renderEmpleados);

iniciarEmpleados();
