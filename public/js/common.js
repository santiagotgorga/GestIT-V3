// =====================================================
// GestIT V2 - utilidades compartidas
// =====================================================
const GestIT = {
  usuario: null,
  modulos: { personas: false, identificacion: false }
};

async function api(url, opciones = {}) {
  const config = { ...opciones, headers: { ...(opciones.headers || {}) } };

  if (config.body && typeof config.body !== "string") {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  return { ok: response.ok, status: response.status, data: data || {} };
}

// Exige sesión: si no hay, va al login y vuelve a esta página después (HU-18)
async function requerirSesion() {
  const { ok, data } = await api("/api/me");

  if (!ok) {
    const destino = window.location.pathname + window.location.search;
    window.location.href = `/?next=${encodeURIComponent(destino)}`;
    return null;
  }

  GestIT.usuario = data.usuario;
  GestIT.modulos = data.modulos;
  return data;
}

function esAdmin() {
  return GestIT.usuario && GestIT.usuario.rol === "Administrador";
}

function renderHeader(activo) {
  const nav = document.getElementById("mainNav");
  const enlaces = [
    `<a href="/dashboard" data-testid="nav-equipos" class="${activo === "equipos" ? "active" : ""}">Equipos</a>`
  ];

  if (GestIT.modulos.personas) {
    enlaces.push(`<a href="/empleados.html" data-testid="nav-empleados" class="${activo === "empleados" ? "active" : ""}">Empleados</a>`);
  }

  if (esAdmin()) {
    enlaces.push(`<a href="/configuracion.html" data-testid="nav-configuracion" class="${activo === "configuracion" ? "active" : ""}">Configuración</a>`);
  }

  if (nav) nav.innerHTML = enlaces.join("");

  const nombre = document.getElementById("userName");
  const rol = document.getElementById("userRole");
  if (nombre) nombre.textContent = GestIT.usuario.nombre;
  if (rol) rol.textContent = GestIT.usuario.rol;

  const logout = document.getElementById("logoutBtn");
  if (logout) {
    logout.addEventListener("click", async () => {
      try {
        await api("/api/logout", { method: "POST" });
      } finally {
        window.location.href = "/";
      }
    });
  }
}

// Regla 2.4 (v3) - BUG-08: longitudes en caracteres reales (un emoji cuenta 1, no 2)
function largo(valor) {
  return [...String(valor ?? "")].length;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function claseEstado(estado) {
  if (estado === "Disponible") return "available";
  if (estado === "Asignado") return "assigned";
  if (estado === "En reparación") return "repair";
  return "retired";
}

function mostrarAlerta(mensaje, tipo, html = false) {
  const alerta = document.getElementById("globalAlert");
  if (!alerta) return;

  if (html) {
    alerta.innerHTML = mensaje;
  } else {
    alerta.textContent = mensaje;
  }
  alerta.className = `alert ${tipo}`;
  alerta.setAttribute("data-testid", "alerta-global");

  clearTimeout(mostrarAlerta.timer);
  mostrarAlerta.timer = setTimeout(() => alerta.classList.add("hidden"), 8000);
}

// Errores debajo de cada campo (RNF-02)
function limpiarErrores(form) {
  form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
  form.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
}

function errorEnCampo(form, campo, mensaje) {
  const el = form.querySelector(`[data-error-for="${campo}"]`);
  const input = form.querySelector(`[name="${campo}"]`);
  if (el) el.textContent = mensaje;
  if (input && input.classList) input.classList.add("input-error");
}
