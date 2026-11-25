// =====================================================
// GestIT V3 - acciones sobre equipos (HU-05, HU-08, HU-15, HU-16)
// Compartido entre el listado y la ficha.
// =====================================================
let accionesOnCambio = async () => {};
let accionEnCurso = null;

function inicializarAcciones(onCambio) {
  accionesOnCambio = onCambio;

  document.body.insertAdjacentHTML("beforeend", `
  <!-- Modal cambio de estado -->
  <div id="estadoModalOverlay" class="modal-overlay hidden">
    <div class="modal">
      <div class="modal-header">
        <div>
          <h3 id="estadoModalTitle">Cambiar estado</h3>
          <p id="estadoModalSubtitle"></p>
        </div>
        <button type="button" class="modal-close" data-cerrar="estadoModalOverlay" aria-label="Cerrar">×</button>
      </div>
      <form id="estadoForm" novalidate>
        <div class="form-field">
          <label for="motivo">Motivo *</label>
          <textarea id="motivo" name="motivo" maxlength="500" data-testid="input-motivo"
            placeholder="Describí el motivo del cambio (10 a 500 caracteres)"></textarea>
          <div class="motivo-help"><span id="motivoCount">0</span>/500 caracteres (mínimo 10)</div>
          <div class="field-error" data-error-for="motivo" data-testid="error-motivo"></div>
        </div>
        <div id="estadoError" class="alert error hidden" data-testid="error-estado"></div>
        <div class="modal-actions">
          <button type="button" class="btn secondary" data-cerrar="estadoModalOverlay" data-testid="btn-cancelar-estado">Cancelar</button>
          <button type="submit" class="btn primary" data-testid="btn-confirmar-estado">Confirmar</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal edición (HU-05, V3) -->
  <div id="edicionModalOverlay" class="modal-overlay hidden">
    <div class="modal">
      <div class="modal-header">
        <div>
          <h3 id="edicionTitle">Editar equipo</h3>
          <p id="edicionSubtitle" data-testid="edicion-info"></p>
        </div>
        <button type="button" class="modal-close" data-cerrar="edicionModalOverlay" aria-label="Cerrar">×</button>
      </div>
      <form id="edicionForm" novalidate>
        <div class="form-grid">
          <div class="form-field">
            <label for="editMarca">Marca *</label>
            <input id="editMarca" name="marca" type="text" data-testid="edit-marca">
            <div class="field-error" data-error-for="marca" data-testid="error-edit-marca"></div>
          </div>
          <div class="form-field">
            <label for="editModelo">Modelo *</label>
            <input id="editModelo" name="modelo" type="text" data-testid="edit-modelo">
            <div class="field-error" data-error-for="modelo" data-testid="error-edit-modelo"></div>
          </div>
          <div class="form-field">
            <label for="editSerie">Número de serie *</label>
            <input id="editSerie" name="numeroSerie" type="text" data-testid="edit-serie">
            <div class="field-error" data-error-for="numeroSerie" data-testid="error-edit-serie"></div>
          </div>
          <div class="form-field">
            <label for="editCategoria">Categoría *</label>
            <select id="editCategoria" name="categoria" data-testid="edit-categoria">
              <option value="">Seleccionar...</option>
              <option value="Notebook">Notebook</option>
              <option value="PC">PC</option>
              <option value="Monitor">Monitor</option>
              <option value="Impresora">Impresora</option>
              <option value="Celular">Celular</option>
              <option value="Tablet">Tablet</option>
              <option value="Otro">Otro</option>
            </select>
            <div class="field-error" data-error-for="categoria" data-testid="error-edit-categoria"></div>
          </div>
        </div>
        <div class="form-field" style="margin-top:14px">
          <label for="editObservaciones">Observaciones</label>
          <textarea id="editObservaciones" name="observaciones" data-testid="edit-observaciones"
            placeholder="Opcional, hasta 500 caracteres"></textarea>
          <div class="field-error" data-error-for="observaciones" data-testid="error-edit-observaciones"></div>
        </div>
        <div id="edicionError" class="alert error hidden" data-testid="error-edicion"></div>
        <div class="modal-actions">
          <button type="button" class="btn secondary" data-cerrar="edicionModalOverlay" data-testid="btn-cancelar-edicion">Cancelar</button>
          <button type="submit" class="btn primary" data-testid="btn-guardar-edicion">Guardar cambios</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal entrega -->
  <div id="entregaModalOverlay" class="modal-overlay hidden">
    <div class="modal">
      <div class="modal-header">
        <div>
          <h3>Entregar equipo</h3>
          <p id="entregaSubtitle"></p>
        </div>
        <button type="button" class="modal-close" data-cerrar="entregaModalOverlay" aria-label="Cerrar">×</button>
      </div>
      <form id="entregaForm" novalidate>
        <div class="form-field">
          <label for="empleadoId">Empleado *</label>
          <select id="empleadoId" name="empleadoId" data-testid="select-empleado"></select>
          <div class="field-error" data-error-for="empleadoId" data-testid="error-empleado"></div>
        </div>
        <div class="form-field" style="margin-top:14px">
          <label for="observacionesEntrega">Observaciones</label>
          <textarea id="observacionesEntrega" name="observaciones" data-testid="input-observaciones-entrega"
            placeholder="Opcional, hasta 300 caracteres"></textarea>
          <div class="field-error" data-error-for="observaciones" data-testid="error-observaciones-entrega"></div>
        </div>
        <div id="entregaError" class="alert error hidden" data-testid="error-entrega"></div>
        <div class="modal-actions">
          <button type="button" class="btn secondary" data-cerrar="entregaModalOverlay" data-testid="btn-cancelar-entrega">Cancelar</button>
          <button type="submit" class="btn primary" data-testid="btn-confirmar-entrega">Confirmar entrega</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal devolución -->
  <div id="devolucionModalOverlay" class="modal-overlay hidden">
    <div class="modal">
      <div class="modal-header">
        <div>
          <h3>Registrar devolución</h3>
          <p id="devolucionSubtitle"></p>
        </div>
        <button type="button" class="modal-close" data-cerrar="devolucionModalOverlay" aria-label="Cerrar">×</button>
      </div>
      <form id="devolucionForm" novalidate>
        <label>Condición *</label>
        <div class="radio-group">
          <label><input type="radio" name="condicion" value="En condiciones" data-testid="radio-condicion-ok"> En condiciones</label>
          <label><input type="radio" name="condicion" value="Con falla" data-testid="radio-condicion-falla"> Con falla</label>
        </div>
        <div class="field-error" data-error-for="condicion" data-testid="error-condicion"></div>
        <div id="fallaField" class="form-field hidden" style="margin-top:14px">
          <label for="falla">Descripción de la falla *</label>
          <textarea id="falla" name="falla" data-testid="input-falla" placeholder="Entre 10 y 500 caracteres"></textarea>
          <div class="field-error" data-error-for="falla" data-testid="error-falla"></div>
        </div>
        <div id="devolucionError" class="alert error hidden" data-testid="error-devolucion"></div>
        <div class="modal-actions">
          <button type="button" class="btn secondary" data-cerrar="devolucionModalOverlay" data-testid="btn-cancelar-devolucion">Cancelar</button>
          <button type="submit" class="btn primary" data-testid="btn-confirmar-devolucion">Confirmar devolución</button>
        </div>
      </form>
    </div>
  </div>`);

  document.querySelectorAll("[data-cerrar]").forEach((btn) =>
    btn.addEventListener("click", () => cerrarOverlay(btn.dataset.cerrar))
  );

  const motivo = document.getElementById("motivo");
  motivo.addEventListener("input", () => {
    document.getElementById("motivoCount").textContent = largo(motivo.value);
  });

  document.querySelectorAll('input[name="condicion"]').forEach((radio) =>
    radio.addEventListener("change", () => {
      const conFalla = document.querySelector('input[name="condicion"]:checked')?.value === "Con falla";
      document.getElementById("fallaField").classList.toggle("hidden", !conFalla);
    })
  );

  document.getElementById("estadoForm").addEventListener("submit", enviarCambioEstado);
  document.getElementById("edicionForm").addEventListener("submit", enviarEdicion);
  document.getElementById("entregaForm").addEventListener("submit", enviarEntrega);
  document.getElementById("devolucionForm").addEventListener("submit", enviarDevolucion);

  // Delegación de eventos para los botones de acción
  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-accion]");
    if (!btn) return;
    abrirAccion(btn.dataset.codigo, btn.dataset.accion, btn.dataset.descripcion, btn.dataset.estadoActual);
  });
}

function cerrarOverlay(id) {
  document.getElementById(id).classList.add("hidden");
  accionEnCurso = null;
}

function botonAccion(equipo, accion, texto, clase) {
  return `<button type="button" class="btn ${clase} small" data-accion="${accion}"
    data-codigo="${equipo.codigo}" data-estado-actual="${escapeHtml(equipo.estado)}"
    data-descripcion="${escapeHtml(`${equipo.marca} ${equipo.modelo}`)}"
    data-testid="btn-${accion}-${equipo.codigo}">${texto}</button>`;
}

// Botones según el estado actual (tabla 2.3 de los requerimientos)
function renderAccionesEquipo(equipo) {
  const botones = [];
  const personas = GestIT.modulos.personas;

  if (equipo.estado === "Disponible") {
    if (personas) botones.push(botonAccion(equipo, "entregar", "Entregar", "primary"));
    botones.push(botonAccion(equipo, "reparar", "Reparar", "secondary"));
    if (esAdmin()) botones.push(botonAccion(equipo, "baja", "Dar de baja", "danger"));
  } else if (equipo.estado === "En reparación") {
    botones.push(botonAccion(equipo, "liberar", "Liberar", "secondary"));
    if (esAdmin()) botones.push(botonAccion(equipo, "baja", "Dar de baja", "danger"));
  } else if (equipo.estado === "Asignado") {
    if (personas) botones.push(botonAccion(equipo, "devolucion", "Registrar devolución", "primary"));
  }

  // HU-05 (v3): cualquier equipo que no esté dado de baja se puede editar (ambos roles)
  if (equipo.estado !== "Dado de baja") {
    botones.push(botonAccion(equipo, "editar", "Editar", "outline"));
  }

  if (botones.length === 0) {
    return `<span class="no-action" data-testid="sin-acciones-${equipo.codigo}">Sin acciones</span>`;
  }

  return `<div class="row-actions">${botones.join("")}</div>`;
}

const DESTINO_ACCION = {
  reparar: "En reparación",
  liberar: "Disponible",
  baja: "Dado de baja"
};

async function abrirAccion(codigo, accion, descripcion, estadoActual) {
  accionEnCurso = { codigo, accion };

  if (DESTINO_ACCION[accion]) {
    const form = document.getElementById("estadoForm");
    limpiarErrores(form);
    form.reset();
    document.getElementById("motivoCount").textContent = "0";
    document.getElementById("estadoError").classList.add("hidden");
    document.getElementById("estadoModalTitle").textContent =
      accion === "baja" ? `Dar de baja ${codigo}` : `Cambiar estado de ${codigo}`;
    document.getElementById("estadoModalSubtitle").textContent =
      `${descripcion}: ${estadoActual} → ${DESTINO_ACCION[accion]}`;
    document.getElementById("estadoModalOverlay").classList.remove("hidden");
    document.getElementById("motivo").focus();
    return;
  }

  if (accion === "editar") {
    const form = document.getElementById("edicionForm");
    limpiarErrores(form);
    form.reset();
    document.getElementById("edicionError").classList.add("hidden");

    const { ok, data } = await api(`/api/equipos/${codigo}`);
    if (!ok) {
      mostrarAlerta(data.error || "No se pudo cargar el equipo.", "error");
      return;
    }

    document.getElementById("edicionTitle").textContent = `Editar equipo ${data.codigo}`;
    document.getElementById("edicionSubtitle").textContent =
      `Código ${data.codigo} · Estado: ${data.estado} (no editables)`;
    document.getElementById("editMarca").value = data.marca;
    document.getElementById("editModelo").value = data.modelo;
    document.getElementById("editSerie").value = data.numeroSerie;
    document.getElementById("editCategoria").value = data.categoria;
    document.getElementById("editObservaciones").value = data.observaciones || "";
    document.getElementById("edicionModalOverlay").classList.remove("hidden");
    document.getElementById("editMarca").focus();
    return;
  }

  if (accion === "entregar") {
    const form = document.getElementById("entregaForm");
    limpiarErrores(form);
    form.reset();
    document.getElementById("entregaError").classList.add("hidden");
    document.getElementById("entregaSubtitle").textContent = `${codigo} · ${descripcion}`;

    const { ok, data } = await api("/api/empleados");
    const select = document.getElementById("empleadoId");

    if (!ok) {
      mostrarAlerta(data.error || "No se pudieron cargar los empleados.", "error");
      return;
    }

    const activos = data.filter((e) => e.activo);
    select.innerHTML = `<option value="">Seleccionar empleado...</option>` + activos
      .map((e) => `<option value="${e.id}">${escapeHtml(`${e.apellido}, ${e.nombre} — DNI ${e.documento} — ${e.sector}`)}</option>`)
      .join("");

    document.getElementById("entregaModalOverlay").classList.remove("hidden");
    return;
  }

  if (accion === "devolucion") {
    const form = document.getElementById("devolucionForm");
    limpiarErrores(form);
    form.reset();
    document.getElementById("fallaField").classList.add("hidden");
    document.getElementById("devolucionError").classList.add("hidden");

    const { data } = await api(`/api/equipos/${codigo}`);
    const responsable = data.responsable ? data.responsable.nombre : "—";
    document.getElementById("devolucionSubtitle").textContent =
      `${codigo} · ${descripcion} · Responsable: ${responsable}`;
    document.getElementById("devolucionModalOverlay").classList.remove("hidden");
  }
}

async function enviarCambioEstado(event) {
  event.preventDefault();
  if (!accionEnCurso) return;

  const form = event.target;
  limpiarErrores(form);
  const errorBox = document.getElementById("estadoError");
  errorBox.classList.add("hidden");

  const motivo = document.getElementById("motivo").value.trim();
  if (largo(motivo) < 10 || largo(motivo) > 500) {
    errorEnCampo(form, "motivo", "El motivo debe tener entre 10 y 500 caracteres.");
    return;
  }

  const { codigo, accion } = accionEnCurso;

  if (accion === "baja") {
    const confirmar = confirm(`¿Seguro que querés dar de baja el equipo ${codigo}? Esta acción no se puede deshacer.`);
    if (!confirmar) return;
  }

  const { ok, data } = await api(`/api/equipos/${codigo}/estado`, {
    method: "PATCH",
    body: { estado: DESTINO_ACCION[accion], motivo }
  });

  if (!ok) {
    if (data.campo) {
      errorEnCampo(form, data.campo, data.error);
    } else {
      errorBox.textContent = data.error || "No se pudo cambiar el estado.";
      errorBox.classList.remove("hidden");
    }
    return;
  }

  cerrarOverlay("estadoModalOverlay");
  mostrarAlerta(`Equipo ${data.equipo.codigo} actualizado a "${data.equipo.estado}".`, "success");
  await accionesOnCambio();
}

async function enviarEntrega(event) {
  event.preventDefault();
  if (!accionEnCurso) return;

  const form = event.target;
  limpiarErrores(form);
  const errorBox = document.getElementById("entregaError");
  errorBox.classList.add("hidden");

  const empleadoId = document.getElementById("empleadoId").value;
  const observaciones = document.getElementById("observacionesEntrega").value.trim();
  let valido = true;

  if (!empleadoId) {
    errorEnCampo(form, "empleadoId", "Seleccioná un empleado.");
    valido = false;
  }
  if (largo(observaciones) > 300) {
    errorEnCampo(form, "observaciones", "Las observaciones admiten hasta 300 caracteres.");
    valido = false;
  }
  if (!valido) return;

  const { ok, data } = await api(`/api/equipos/${accionEnCurso.codigo}/entrega`, {
    method: "POST",
    body: { empleadoId: Number(empleadoId), observaciones }
  });

  if (!ok) {
    if (data.campo) {
      errorEnCampo(form, data.campo, data.error);
    } else {
      errorBox.textContent = data.error || "No se pudo registrar la entrega.";
      errorBox.classList.remove("hidden");
    }
    return;
  }

  cerrarOverlay("entregaModalOverlay");
  mostrarAlerta(
    `${escapeHtml(data.mensaje)} <a href="/acta.html?numero=${data.acta}" data-testid="link-ver-acta">Ver acta</a>`,
    "success",
    true
  );
  await accionesOnCambio();
}

async function enviarDevolucion(event) {
  event.preventDefault();
  if (!accionEnCurso) return;

  const form = event.target;
  limpiarErrores(form);
  const errorBox = document.getElementById("devolucionError");
  errorBox.classList.add("hidden");

  const condicion = document.querySelector('input[name="condicion"]:checked')?.value || "";
  const falla = document.getElementById("falla").value.trim();
  let valido = true;

  if (!condicion) {
    errorEnCampo(form, "condicion", "Indicá la condición del equipo.");
    valido = false;
  }
  if (condicion === "Con falla" && (largo(falla) < 10 || largo(falla) > 500)) {
    errorEnCampo(form, "falla", "La descripción de la falla debe tener entre 10 y 500 caracteres.");
    valido = false;
  }
  if (!valido) return;

  const { ok, data } = await api(`/api/equipos/${accionEnCurso.codigo}/devolucion`, {
    method: "POST",
    body: { condicion, falla }
  });

  if (!ok) {
    if (data.campo) {
      errorEnCampo(form, data.campo, data.error);
    } else {
      errorBox.textContent = data.error || "No se pudo registrar la devolución.";
      errorBox.classList.remove("hidden");
    }
    return;
  }

  cerrarOverlay("devolucionModalOverlay");
  mostrarAlerta(
    `${escapeHtml(data.mensaje)} <a href="/acta.html?numero=${data.acta}" data-testid="link-ver-acta">Ver acta</a>`,
    "success",
    true
  );
  await accionesOnCambio();
}

// HU-05 (v3): mismas validaciones que el alta (HU-04)
function validarDatosEquipo(datos) {
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

async function enviarEdicion(event) {
  event.preventDefault();
  if (!accionEnCurso) return;

  const form = event.target;
  limpiarErrores(form);
  const errorBox = document.getElementById("edicionError");
  errorBox.classList.add("hidden");

  const datos = {
    marca: document.getElementById("editMarca").value.trim(),
    modelo: document.getElementById("editModelo").value.trim(),
    numeroSerie: document.getElementById("editSerie").value.trim(),
    categoria: document.getElementById("editCategoria").value,
    observaciones: document.getElementById("editObservaciones").value.trim()
  };

  const errores = validarDatosEquipo(datos);
  if (Object.keys(errores).length > 0) {
    Object.entries(errores).forEach(([campo, mensaje]) => errorEnCampo(form, campo, mensaje));
    return;
  }

  const { ok, data } = await api(`/api/equipos/${accionEnCurso.codigo}`, { method: "PATCH", body: datos });

  if (!ok) {
    if (data.campo) {
      errorEnCampo(form, data.campo, data.error);
    } else {
      errorBox.textContent = data.error || "No se pudo guardar el equipo.";
      errorBox.classList.remove("hidden");
    }
    return;
  }

  if (data.cambios.length === 0) {
    errorBox.textContent = data.mensaje; // "No hay cambios para guardar."
    errorBox.classList.remove("hidden");
    return;
  }

  cerrarOverlay("edicionModalOverlay");
  mostrarAlerta(data.mensaje, "success");
  await accionesOnCambio();
}
