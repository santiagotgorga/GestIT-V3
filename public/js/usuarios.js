// =====================================================
// GestIT V3 - administrar usuarios del sistema (HU-11)
// =====================================================
let usuariosLista = [];

const usuarioForm = document.getElementById("usuarioForm");
const usuarioModal = document.getElementById("usuarioModalOverlay");

async function iniciarUsuarios() {
  const sesion = await requerirSesion();
  if (!sesion) return;

  // Solo el Administrador accede (HU-03 v3)
  if (!esAdmin()) {
    window.location.href = "/dashboard";
    return;
  }

  renderHeader("usuarios");
  await cargarUsuarios();
}

async function cargarUsuarios() {
  const { ok, status, data } = await api("/api/usuarios");

  if (status === 401) {
    window.location.href = "/";
    return;
  }
  if (!ok) {
    mostrarAlerta(data.error || "No se pudieron cargar los usuarios.", "error");
    return;
  }

  usuariosLista = data;
  renderUsuarios();
}

function estadoUsuario(u) {
  if (!u.activo) return { texto: "Inactivo", clase: "retired" };
  if (u.bloqueado) return { texto: "Bloqueado", clase: "blocked" };
  return { texto: "Activo", clase: "available" };
}

function renderUsuarios() {
  const body = document.getElementById("usuariosBody");
  document.getElementById("usuariosCount").textContent =
    `${usuariosLista.length} ${usuariosLista.length === 1 ? "usuario" : "usuarios"}`;

  body.innerHTML = usuariosLista.map((u) => {
    const estado = estadoUsuario(u);
    const esYo = u.id === GestIT.usuario.id;
    const otroRol = u.rol === "Administrador" ? "Operador" : "Administrador";
    const acciones = esYo
      ? `<span class="no-action">Tu usuario</span>`
      : `<div class="row-actions">
          <button type="button" class="btn secondary small" data-rol="${escapeHtml(u.usuario)}" data-nuevo-rol="${otroRol}"
            data-testid="btn-rol-${escapeHtml(u.usuario)}">Pasar a ${otroRol}</button>
          <button type="button" class="btn ${u.activo ? "danger" : "primary"} small" data-estado="${escapeHtml(u.usuario)}"
            data-activo="${u.activo ? "false" : "true"}"
            data-testid="btn-estado-${escapeHtml(u.usuario)}">${u.activo ? "Desactivar" : "Activar"}</button>
          ${u.bloqueado ? `<button type="button" class="btn outline small" data-desbloquear="${escapeHtml(u.usuario)}"
            data-testid="btn-desbloquear-${escapeHtml(u.usuario)}">Desbloquear</button>` : ""}
        </div>`;

    return `
      <tr data-testid="fila-usuario-${escapeHtml(u.usuario)}">
        <td><strong>${escapeHtml(u.usuario)}</strong></td>
        <td>${escapeHtml(u.nombre)}</td>
        <td data-testid="rol-usuario-${escapeHtml(u.usuario)}">${escapeHtml(u.rol)}</td>
        <td><span class="status-badge ${estado.clase}" data-testid="estado-usuario-${escapeHtml(u.usuario)}">${estado.texto}</span></td>
        <td>${acciones}</td>
      </tr>`;
  }).join("");
}

// -------------------------
// Acciones de la tabla
// -------------------------
document.getElementById("usuariosBody").addEventListener("click", async (event) => {
  const btnRol = event.target.closest("[data-rol]");
  const btnEstado = event.target.closest("[data-estado]");
  const btnDesbloquear = event.target.closest("[data-desbloquear]");

  if (btnRol) {
    const { rol: usuario, nuevoRol } = btnRol.dataset;
    if (!confirm(`¿Seguro que querés pasar a ${usuario} al rol ${nuevoRol}?`)) return;
    await enviarCambio(`/api/usuarios/${usuario}`, "PATCH", { rol: nuevoRol });
  } else if (btnEstado) {
    const usuario = btnEstado.dataset.estado;
    const activo = btnEstado.dataset.activo === "true";
    if (!confirm(`¿Seguro que querés ${activo ? "activar" : "desactivar"} al usuario ${usuario}?`)) return;
    await enviarCambio(`/api/usuarios/${usuario}`, "PATCH", { activo });
  } else if (btnDesbloquear) {
    await enviarCambio(`/api/usuarios/${btnDesbloquear.dataset.desbloquear}/desbloquear`, "POST");
  }
});

async function enviarCambio(url, method, body) {
  const { ok, data } = await api(url, body ? { method, body } : { method });

  if (!ok) {
    mostrarAlerta(data.error || "No se pudo actualizar el usuario.", "error");
    return;
  }

  mostrarAlerta(data.mensaje, "success");
  await cargarUsuarios();
}

// -------------------------
// Alta de usuario
// -------------------------
function validarUsuario(d) {
  const errores = {};

  if (largo(d.usuario) < 3 || largo(d.usuario) > 20 || !/^[a-z0-9._]+$/.test(d.usuario)) {
    errores.usuario = "El usuario debe tener entre 3 y 20 caracteres (minúsculas, números, . o _).";
  }
  if (largo(d.nombre) < 2 || largo(d.nombre) > 50 || !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(d.nombre)) {
    errores.nombre = "El nombre debe tener entre 2 y 50 caracteres y solo letras.";
  }
  if (!d.rol) {
    errores.rol = "Seleccioná un rol.";
  }
  if (largo(d.password) < 8 || largo(d.password) > 50 || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(d.password) || !/\d/.test(d.password)) {
    errores.password = "La contraseña debe tener entre 8 y 50 caracteres, con al menos una letra y un número.";
  }

  return errores;
}

usuarioForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  limpiarErrores(usuarioForm);
  const errorBox = document.getElementById("usuarioFormError");
  errorBox.classList.add("hidden");

  const fd = new FormData(usuarioForm);
  const datos = {
    usuario: (fd.get("usuario") || "").trim(),
    nombre: (fd.get("nombre") || "").trim(),
    rol: fd.get("rol") || "",
    password: fd.get("password") || ""
  };

  const errores = validarUsuario(datos);
  if (Object.keys(errores).length > 0) {
    Object.entries(errores).forEach(([campo, mensaje]) => errorEnCampo(usuarioForm, campo, mensaje));
    return;
  }

  const { ok, data } = await api("/api/usuarios", { method: "POST", body: datos });

  if (!ok) {
    if (data.campo) {
      errorEnCampo(usuarioForm, data.campo, data.error);
    } else {
      errorBox.textContent = data.error || "No se pudo crear el usuario.";
      errorBox.classList.remove("hidden");
    }
    return;
  }

  usuarioModal.classList.add("hidden");
  usuarioForm.reset();
  mostrarAlerta(`Usuario ${data.usuario} creado correctamente.`, "success");
  await cargarUsuarios();
});

function abrirModalUsuario() {
  limpiarErrores(usuarioForm);
  usuarioForm.reset();
  document.getElementById("usuarioFormError").classList.add("hidden");
  usuarioModal.classList.remove("hidden");
  document.getElementById("nuevoUsuario").focus();
}

function cerrarModalUsuario() {
  usuarioModal.classList.add("hidden");
}

document.getElementById("nuevoUsuarioBtn").addEventListener("click", abrirModalUsuario);
document.getElementById("cerrarUsuarioModal").addEventListener("click", cerrarModalUsuario);
document.getElementById("cancelarUsuarioModal").addEventListener("click", cerrarModalUsuario);
usuarioModal.addEventListener("click", (event) => {
  if (event.target === usuarioModal) cerrarModalUsuario();
});

iniciarUsuarios();
