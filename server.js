const express = require("express");
const session = require("express-session");
const path = require("path");
const QRCode = require("qrcode");

const app = express();
const PORT = 3000;

// =====================================================
// Catálogos y reglas
// =====================================================
const CATEGORIAS = ["Notebook", "PC", "Monitor", "Impresora", "Celular", "Tablet", "Otro"];
const SECTORES = ["Sistemas", "Administración", "Ventas", "Recursos Humanos", "Operaciones", "Gerencia"];
const ESTADOS = ["Disponible", "Asignado", "En reparación", "Dado de baja"];

// Transiciones MANUALES permitidas (tabla 2.3). Asignado solo por entrega/devolución.
const TRANSICIONES_MANUALES = {
  "Disponible": ["En reparación", "Dado de baja"],
  "Asignado": [],
  "En reparación": ["Disponible", "Dado de baja"],
  "Dado de baja": []
};

const MODULOS_INFO = {
  personas: { nombre: "Personas y entregas" },
  identificacion: { nombre: "Identificación física" }
};

const ROLES = ["Administrador", "Operador"];

// HU-11 (v3): bloqueo por intentos fallidos (corrige BUG-06)
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
const MENSAJE_BLOQUEO = "Usuario bloqueado por intentos fallidos. Intentá más tarde o contactá a un Administrador.";

// =====================================================
// Datos en memoria (se restituyen con resetDatos)
// =====================================================
let equipos, empleados, tenencias, actas, modulos, usuarios, auditoria;
let siguienteUsuario, siguienteAuditoria;
let siguienteEquipo, siguienteEmpleado, siguienteTenencia, siguienteActaEntrega, siguienteActaDevolucion;

function codigoEquipo(n) {
  return `EQ-${String(n).padStart(5, "0")}`;
}

function numeroActa(prefijo, n) {
  return `${prefijo}-${String(n).padStart(6, "0")}`;
}

function resetDatos() {
  const ahora = new Date();

  const usuarioBase = (id, usuario, password, nombre, rol) => ({
    id, usuario, password, nombre, rol, activo: true, intentosFallidos: 0, bloqueadoHasta: null
  });
  usuarios = [
    usuarioBase(1, "admin", "admin123", "Administrador", "Administrador"),
    usuarioBase(2, "operador", "operador123", "Operador", "Operador")
  ];
  siguienteUsuario = 3;

  // HU-12: el registro de auditoría arranca vacío
  auditoria = [];
  siguienteAuditoria = 1;

  const hace = (dias) => new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();

  const base = (n, marca, modelo, numeroSerie, categoria) => ({
    id: n,
    codigo: codigoEquipo(n),
    marca,
    modelo,
    numeroSerie,
    categoria,
    observaciones: "",
    estado: "Disponible",
    ultimoCambio: hace(30),
    responsableId: null,
    historial: [
      { fecha: hace(30), desde: null, hacia: "Disponible", usuario: "admin", motivo: "Alta del equipo" }
    ]
  });

  equipos = [
    base(1, "Dell", "Latitude 5420", "DL001", "Notebook"),
    base(2, "Lenovo", "ThinkCentre M70", "LN001", "PC"),
    base(3, "Samsung", "S24F350", "SM001", "Monitor"),
    base(4, "HP", "EliteBook 840", "HP-0004", "Notebook"),
    base(5, "Apple", "iPhone 13", "IP13-0005", "Celular")
  ];

  // EQ-00004 en reparación
  equipos[3].estado = "En reparación";
  equipos[3].ultimoCambio = hace(5);
  equipos[3].historial.push({
    fecha: hace(5), desde: "Disponible", hacia: "En reparación", usuario: "operador",
    motivo: "Pantalla con líneas verticales"
  });

  empleados = [
    { id: 1, nombre: "Ana", apellido: "Gómez", documento: "30111222", sector: "Sistemas", email: "ana.gomez@empresa.com", activo: true },
    { id: 2, nombre: "Carlos", apellido: "Pérez", documento: "28999888", sector: "Ventas", email: "carlos.perez@empresa.com", activo: true },
    { id: 3, nombre: "Lucía", apellido: "Díaz", documento: "35444555", sector: "Recursos Humanos", email: "lucia.diaz@empresa.com", activo: false }
  ];

  // EQ-00005 asignado a Ana Gómez con el acta AE-000001
  actas = [
    {
      numero: "AE-000001", tipo: "Entrega", equipoId: 5, empleadoId: 1, fecha: hace(10),
      usuario: "operador", observaciones: "Entrega de celular corporativo", condicion: null, falla: null
    }
  ];
  tenencias = [
    { id: 1, equipoId: 5, empleadoId: 1, fechaEntrega: hace(10), actaEntrega: "AE-000001", fechaDevolucion: null, actaDevolucion: null, condicion: null }
  ];
  equipos[4].estado = "Asignado";
  equipos[4].responsableId = 1;
  equipos[4].ultimoCambio = hace(10);
  equipos[4].historial.push({
    fecha: hace(10), desde: "Disponible", hacia: "Asignado", usuario: "operador",
    motivo: "Entrega a Gómez, Ana (Acta AE-000001)"
  });

  modulos = { personas: true, identificacion: true };

  siguienteEquipo = 6;
  siguienteEmpleado = 4;
  siguienteTenencia = 2;
  siguienteActaEntrega = 2;
  siguienteActaDevolucion = 1;
}

resetDatos();

// =====================================================
// Middlewares
// =====================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "gestit-v2-clave-local",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }
  })
);

app.use(express.static(path.join(__dirname, "public")));

// HU-11 (v3): la sesión refleja el estado actual del usuario.
// Si fue desactivado, la sesión deja de valer; si le cambiaron el rol, rige el nuevo.
app.use((req, res, next) => {
  if (req.session.usuario) {
    const actual = usuarios.find((u) => u.id === req.session.usuario.id);
    if (!actual || !actual.activo) {
      delete req.session.usuario;
    } else {
      req.session.usuario.rol = actual.rol;
      req.session.usuario.nombre = actual.nombre;
    }
  }
  next();
});

function requiereLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ error: "No autenticado." });
  }
  next();
}

function requiereAdministrador(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ error: "No autenticado." });
  }
  if (req.session.usuario.rol !== "Administrador") {
    return res.status(403).json({ error: "No tenés permisos para realizar esta operación." });
  }
  next();
}

function requiereModulo(clave) {
  return (req, res, next) => {
    if (!modulos[clave]) {
      return res.status(403).json({ error: `El módulo ${MODULOS_INFO[clave].nombre} está desactivado.` });
    }
    next();
  };
}

// =====================================================
// Helpers
// =====================================================
function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

// HU-12: registro de auditoría (inmutable: solo se agregan registros)
function auditar(usuario, accion, objeto, detalle = "") {
  auditoria.push({
    id: siguienteAuditoria++,
    fecha: new Date().toISOString(),
    usuario: usuario || "",
    accion,
    objeto: objeto || "",
    detalle
  });
}

function quien(req) {
  return req.session.usuario ? req.session.usuario.usuario : "";
}

// Regla 2.4 (v3) - BUG-05: identificadores numéricos estrictos.
// Acepta un entero positivo o un string de solo dígitos; cualquier otra cosa da null.
function enteroPositivo(valor) {
  if (typeof valor === "number") return Number.isInteger(valor) && valor > 0 ? valor : null;
  if (typeof valor === "string" && /^\d+$/.test(valor.trim())) {
    const n = Number(valor.trim());
    return n > 0 ? n : null;
  }
  return null;
}

// Regla 2.4 (v3) - BUG-08: longitudes en caracteres reales (un emoji cuenta 1, no 2)
function largo(valor) {
  return [...valor].length;
}

function errorCampo(res, campo, mensaje, status = 400) {
  return res.status(status).json({ error: mensaje, campo });
}

function empleadoPorId(id) {
  return empleados.find((e) => e.id === id) || null;
}

function nombreEmpleado(emp) {
  return emp ? `${emp.apellido}, ${emp.nombre}` : "";
}

function registrarCambio(equipo, hacia, motivo, usuario) {
  const fecha = new Date().toISOString();
  equipo.historial.push({ fecha, desde: equipo.estado, hacia, usuario, motivo });
  equipo.estado = hacia;
  equipo.ultimoCambio = fecha;
}

function equipoPublico(equipo) {
  const responsable = equipo.responsableId ? empleadoPorId(equipo.responsableId) : null;
  return {
    id: equipo.id,
    codigo: equipo.codigo,
    marca: equipo.marca,
    modelo: equipo.modelo,
    numeroSerie: equipo.numeroSerie,
    categoria: equipo.categoria,
    observaciones: equipo.observaciones,
    estado: equipo.estado,
    ultimoCambio: equipo.ultimoCambio,
    responsable: modulos.personas && responsable
      ? { id: responsable.id, nombre: nombreEmpleado(responsable) }
      : null
  };
}

function buscarEquipoPorCodigo(codigo) {
  const c = texto(codigo).toUpperCase();
  return equipos.find((e) => e.codigo === c) || null;
}

function buscarEquipoPorParam(param) {
  // Acepta id numérico o código EQ-00000
  if (/^\d+$/.test(String(param))) {
    return equipos.find((e) => e.id === Number(param)) || null;
  }
  return buscarEquipoPorCodigo(param);
}

function filtrarEquipos({ q, categoria, estado, incluirBajas }) {
  const busqueda = texto(q).toLowerCase();
  const incluir = incluirBajas === true || incluirBajas === "true" || incluirBajas === "1";

  return equipos.filter((e) => {
    const coincideBusqueda =
      !busqueda ||
      e.codigo.toLowerCase().includes(busqueda) ||
      e.marca.toLowerCase().includes(busqueda) ||
      e.modelo.toLowerCase().includes(busqueda) ||
      e.numeroSerie.toLowerCase().includes(busqueda);
    const coincideCategoria = !categoria || e.categoria === categoria;
    const coincideEstado = !estado || e.estado === estado;
    const visiblePorBaja = e.estado !== "Dado de baja" || incluir || estado === "Dado de baja";
    return coincideBusqueda && coincideCategoria && coincideEstado && visiblePorBaja;
  });
}

// =====================================================
// Autenticación (HU-01, HU-02)
// =====================================================
app.post("/api/login", (req, res) => {
  // HU-01 (v3) - BUG-07: el servidor recorta los espacios del usuario igual que la pantalla
  const usuario = texto(req.body.usuario);
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!usuario || !password) {
    return res.status(400).json({ error: "Ingresá usuario y contraseña." });
  }

  const encontrado = usuarios.find((u) => u.usuario === usuario) || null;
  const ahora = Date.now();

  // HU-01 (v3) / HU-11 - BUG-06: usuario bloqueado por intentos fallidos
  if (encontrado && encontrado.bloqueadoHasta && encontrado.bloqueadoHasta > ahora) {
    auditar(usuario, "LOGIN_FALLIDO", usuario, "Intento con el usuario bloqueado.");
    return res.status(423).json({ error: MENSAJE_BLOQUEO });
  }
  if (encontrado && encontrado.bloqueadoHasta && encontrado.bloqueadoHasta <= ahora) {
    encontrado.bloqueadoHasta = null; // el bloqueo venció
  }

  const valido = encontrado && encontrado.activo && encontrado.password === password;

  if (!valido) {
    auditar(usuario, "LOGIN_FALLIDO", usuario, "Usuario o contraseña incorrectos.");

    if (encontrado) {
      encontrado.intentosFallidos++;
      if (encontrado.intentosFallidos >= MAX_INTENTOS) {
        encontrado.intentosFallidos = 0;
        encontrado.bloqueadoHasta = ahora + BLOQUEO_MS;
        auditar(usuario, "USUARIO_BLOQUEADO", usuario, `${MAX_INTENTOS} intentos fallidos consecutivos.`);
        return res.status(423).json({ error: MENSAJE_BLOQUEO });
      }
    }
    // Mismo mensaje si no existe, si la contraseña es incorrecta o si está inactivo (HU-01, HU-11)
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }

  encontrado.intentosFallidos = 0;
  req.session.usuario = {
    id: encontrado.id,
    usuario: encontrado.usuario,
    nombre: encontrado.nombre,
    rol: encontrado.rol
  };
  auditar(encontrado.usuario, "LOGIN_OK", encontrado.usuario);

  res.json({ mensaje: "Login correcto.", usuario: req.session.usuario });
});

app.get("/api/me", (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: "No autenticado." });
  }
  res.json({ usuario: req.session.usuario, modulos });
});

app.post("/api/logout", (req, res) => {
  const usuario = quien(req);
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "No se pudo cerrar la sesión." });
    }
    if (usuario) auditar(usuario, "LOGOUT", usuario);
    res.json({ mensaje: "Sesión cerrada." });
  });
});

// =====================================================
// Equipos (HU-04, HU-06, HU-07, HU-08)
// =====================================================
app.get("/api/equipos", requiereLogin, (req, res) => {
  // Devuelve todos; el filtrado de la pantalla se hace con las mismas reglas que /export
  res.json(equipos.map(equipoPublico));
});

// HU-04 / HU-05: mismas validaciones para el alta y la edición.
// Devuelve { datos } o { error: { campo, mensaje, status } }.
function validarEquipo(body, idPropio = null) {
  const marca = texto(body.marca);
  const modelo = texto(body.modelo);
  const numeroSerie = texto(body.numeroSerie);
  const categoria = texto(body.categoria);
  const observaciones = texto(body.observaciones);
  const falla = (campo, mensaje, status = 400) => ({ error: { campo, mensaje, status } });

  if (largo(marca) < 2 || largo(marca) > 50) {
    return falla("marca", "La marca debe tener entre 2 y 50 caracteres.");
  }
  if (largo(modelo) < 2 || largo(modelo) > 80) {
    return falla("modelo", "El modelo debe tener entre 2 y 80 caracteres.");
  }
  if (largo(numeroSerie) < 4 || largo(numeroSerie) > 40) {
    return falla("numeroSerie", "El número de serie debe tener entre 4 y 40 caracteres.");
  }
  if (!/^[A-Za-z0-9-]+$/.test(numeroSerie)) {
    return falla("numeroSerie", "El número de serie solo admite letras, números y guiones.");
  }
  if (!/[A-Za-z0-9]/.test(numeroSerie)) {
    // HU-04 (v3) - OBS-01
    return falla("numeroSerie", "El número de serie debe contener al menos una letra o un número.");
  }
  if (!CATEGORIAS.includes(categoria)) {
    return falla("categoria", "Seleccioná una categoría.");
  }
  if (largo(observaciones) > 500) {
    return falla("observaciones", "Las observaciones admiten hasta 500 caracteres.");
  }

  const serieExiste = equipos.some(
    (e) => e.id !== idPropio && e.numeroSerie.trim().toLowerCase() === numeroSerie.toLowerCase()
  );
  if (serieExiste) {
    return falla("numeroSerie", "Ya existe un equipo con ese número de serie.", 409);
  }

  return { datos: { marca, modelo, numeroSerie, categoria, observaciones } };
}

app.post("/api/equipos", requiereLogin, (req, res) => {
  const { datos, error } = validarEquipo(req.body);
  if (error) {
    return errorCampo(res, error.campo, error.mensaje, error.status);
  }
  const { marca, modelo, numeroSerie, categoria, observaciones } = datos;

  const fecha = new Date().toISOString();
  const id = siguienteEquipo++;
  const nuevo = {
    id,
    codigo: codigoEquipo(id),
    marca,
    modelo,
    numeroSerie,
    categoria,
    observaciones,
    estado: "Disponible",
    ultimoCambio: fecha,
    responsableId: null,
    historial: [
      { fecha, desde: null, hacia: "Disponible", usuario: req.session.usuario.usuario, motivo: "Alta del equipo" }
    ]
  };

  equipos.push(nuevo);
  auditar(quien(req), "EQUIPO_ALTA", nuevo.codigo, `${marca} ${modelo} · Serie ${numeroSerie} · ${categoria}`);
  res.status(201).json(equipoPublico(nuevo));
});

// Exportación CSV (HU-19) — se declara antes de /:codigo
app.get("/api/equipos/export", requiereLogin, requiereModulo("identificacion"), (req, res) => {
  const lista = filtrarEquipos(req.query);

  if (lista.length === 0) {
    return res.status(404).json({ error: "No hay equipos para exportar con los filtros aplicados." });
  }

  const celda = (valor) => {
    let s = String(valor ?? "");
    // HU-19 (v3) - BUG-04: evita que Excel interprete el valor como fórmula
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const filas = [
    "codigo,marca,modelo,numero_serie,categoria,estado",
    ...lista.map((e) =>
      [e.codigo, e.marca, e.modelo, e.numeroSerie, e.categoria, e.estado].map(celda).join(",")
    )
  ];

  const hoy = new Date();
  const nombre = `gestit_equipos_${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}${String(hoy.getDate()).padStart(2, "0")}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
  res.send("﻿" + filas.join("\r\n") + "\r\n");
});

// Ficha (HU-06)
app.get("/api/equipos/:codigo", requiereLogin, (req, res) => {
  const equipo = buscarEquipoPorParam(req.params.codigo);

  if (!equipo) {
    return res.status(404).json({
      error: `No se encontró ningún equipo con el código ${texto(req.params.codigo)}.`
    });
  }

  const ficha = equipoPublico(equipo);
  ficha.historial = [...equipo.historial].reverse();

  if (modulos.personas) {
    const responsable = equipo.responsableId ? empleadoPorId(equipo.responsableId) : null;
    const tenenciaVigente = tenencias.find((t) => t.equipoId === equipo.id && !t.fechaDevolucion);

    ficha.responsable = responsable
      ? {
          id: responsable.id,
          nombre: nombreEmpleado(responsable),
          documento: responsable.documento,
          sector: responsable.sector,
          fechaEntrega: tenenciaVigente ? tenenciaVigente.fechaEntrega : null,
          actaEntrega: tenenciaVigente ? tenenciaVigente.actaEntrega : null
        }
      : null;

    ficha.tenencias = tenencias
      .filter((t) => t.equipoId === equipo.id)
      .sort((a, b) => b.fechaEntrega.localeCompare(a.fechaEntrega))
      .map((t) => ({
        empleado: nombreEmpleado(empleadoPorId(t.empleadoId)),
        fechaEntrega: t.fechaEntrega,
        actaEntrega: t.actaEntrega,
        fechaDevolucion: t.fechaDevolucion,
        actaDevolucion: t.actaDevolucion,
        condicion: t.condicion
      }));
  }

  res.json(ficha);
});

// Edición (HU-05, nueva en V3)
const CAMPOS_EDITABLES = [
  ["marca", "Marca"],
  ["modelo", "Modelo"],
  ["numeroSerie", "N° de serie"],
  ["categoria", "Categoría"],
  ["observaciones", "Observaciones"]
];

app.patch("/api/equipos/:codigo", requiereLogin, (req, res) => {
  const equipo = buscarEquipoPorParam(req.params.codigo);

  if (!equipo) {
    return res.status(404).json({ error: `No se encontró ningún equipo con el código ${texto(req.params.codigo)}.` });
  }
  if (equipo.estado === "Dado de baja") {
    return res.status(409).json({ error: "No se puede editar un equipo dado de baja." });
  }

  // Los campos no editables (código, estado, responsable, id) se ignoran.
  // Un campo que no se envía conserva su valor actual.
  const body = req.body || {};
  const propuesta = {};
  CAMPOS_EDITABLES.forEach(([campo]) => {
    propuesta[campo] = body[campo] === undefined ? equipo[campo] : body[campo];
  });

  const { datos, error } = validarEquipo(propuesta, equipo.id);
  if (error) {
    return errorCampo(res, error.campo, error.mensaje, error.status);
  }

  const cambios = CAMPOS_EDITABLES
    .filter(([campo]) => datos[campo] !== equipo[campo])
    .map(([campo, etiqueta]) => ({ campo, etiqueta, antes: equipo[campo], despues: datos[campo] }));

  if (cambios.length === 0) {
    return res.json({ mensaje: "No hay cambios para guardar.", cambios: [], equipo: equipoPublico(equipo) });
  }

  cambios.forEach((c) => { equipo[c.campo] = c.despues; });
  auditar(quien(req), "EQUIPO_EDICION", equipo.codigo,
    cambios.map((c) => `${c.etiqueta}: "${c.antes}" → "${c.despues}"`).join("; "));

  res.json({
    mensaje: `Equipo ${equipo.codigo} actualizado correctamente.`,
    cambios: cambios.map(({ campo, antes, despues }) => ({ campo, antes, despues })),
    equipo: equipoPublico(equipo)
  });
});

// Cambio de estado manual (HU-08 / HU-09)
app.patch("/api/equipos/:codigo/estado", requiereLogin, (req, res) => {
  const equipo = buscarEquipoPorParam(req.params.codigo);
  const estado = texto(req.body.estado);
  const motivo = texto(req.body.motivo);

  if (!equipo) {
    return res.status(404).json({ error: `No se encontró ningún equipo con el código ${texto(req.params.codigo)}.` });
  }
  if (!ESTADOS.includes(estado)) {
    return errorCampo(res, "estado", "Estado inválido.");
  }
  if (estado === "Dado de baja" && req.session.usuario.rol !== "Administrador") {
    return res.status(403).json({ error: "No tenés permisos para realizar esta operación." });
  }
  if (!TRANSICIONES_MANUALES[equipo.estado].includes(estado)) {
    return res.status(409).json({ error: `No se puede pasar de "${equipo.estado}" a "${estado}".` });
  }
  if (largo(motivo) < 10 || largo(motivo) > 500) {
    return errorCampo(res, "motivo", "El motivo debe tener entre 10 y 500 caracteres.");
  }

  const desde = equipo.estado;
  registrarCambio(equipo, estado, motivo, req.session.usuario.usuario);
  auditar(quien(req), estado === "Dado de baja" ? "EQUIPO_BAJA" : "EQUIPO_ESTADO", equipo.codigo,
    `${desde} → ${estado}. Motivo: ${motivo}`);
  res.json({ mensaje: "Estado actualizado correctamente.", equipo: equipoPublico(equipo) });
});

// Compatibilidad con V1: baja directa (solo Administrador)
app.patch("/api/equipos/:codigo/baja", requiereAdministrador, (req, res) => {
  const equipo = buscarEquipoPorParam(req.params.codigo);
  const motivo = texto(req.body && req.body.motivo);

  if (!equipo) {
    return res.status(404).json({ error: `No se encontró ningún equipo con el código ${texto(req.params.codigo)}.` });
  }
  if (!TRANSICIONES_MANUALES[equipo.estado].includes("Dado de baja")) {
    return res.status(409).json({ error: `No se puede pasar de "${equipo.estado}" a "Dado de baja".` });
  }
  if (largo(motivo) < 10 || largo(motivo) > 500) {
    return errorCampo(res, "motivo", "El motivo debe tener entre 10 y 500 caracteres.");
  }

  const desde = equipo.estado;
  registrarCambio(equipo, "Dado de baja", motivo, req.session.usuario.usuario);
  auditar(quien(req), "EQUIPO_BAJA", equipo.codigo, `${desde} → Dado de baja. Motivo: ${motivo}`);
  res.json({ mensaje: "Equipo dado de baja correctamente.", equipo: equipoPublico(equipo) });
});

// QR (HU-18)
app.get("/api/equipos/:codigo/qr", requiereLogin, requiereModulo("identificacion"), async (req, res) => {
  const equipo = buscarEquipoPorParam(req.params.codigo);

  if (!equipo) {
    return res.status(404).json({ error: `No se encontró ningún equipo con el código ${texto(req.params.codigo)}.` });
  }

  const url = `${req.protocol}://${req.get("host")}/equipo.html?codigo=${equipo.codigo}`;

  try {
    const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 220 });
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
  } catch (error) {
    res.status(500).json({ error: "No se pudo generar el código QR." });
  }
});

// =====================================================
// Empleados (HU-13, HU-14)
// =====================================================
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function equiposAsignados(empleadoId) {
  return equipos.filter((e) => e.estado === "Asignado" && e.responsableId === empleadoId);
}

function empleadoPublico(emp) {
  return { ...emp, equiposAsignados: equiposAsignados(emp.id).length };
}

app.get("/api/empleados", requiereLogin, requiereModulo("personas"), (req, res) => {
  const lista = [...empleados].sort((a, b) =>
    `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, "es")
  );
  res.json(lista.map(empleadoPublico));
});

app.post("/api/empleados", requiereLogin, requiereModulo("personas"), (req, res) => {
  const nombre = texto(req.body.nombre);
  const apellido = texto(req.body.apellido);
  const documento = texto(req.body.documento);
  const sector = texto(req.body.sector);
  const email = texto(req.body.email);

  if (largo(nombre) < 2 || largo(nombre) > 50 || !REGEX_NOMBRE.test(nombre)) {
    return errorCampo(res, "nombre", "El nombre debe tener entre 2 y 50 caracteres y solo letras.");
  }
  if (largo(apellido) < 2 || largo(apellido) > 50 || !REGEX_NOMBRE.test(apellido)) {
    return errorCampo(res, "apellido", "El apellido debe tener entre 2 y 50 caracteres y solo letras.");
  }
  if (!/^\d{7,8}$/.test(documento)) {
    return errorCampo(res, "documento", "El documento debe tener 7 u 8 dígitos numéricos.");
  }
  if (!SECTORES.includes(sector)) {
    return errorCampo(res, "sector", "Seleccioná un sector.");
  }
  if (largo(email) > 100 || !REGEX_EMAIL.test(email)) {
    return errorCampo(res, "email", "Ingresá un email válido.");
  }
  if (empleados.some((e) => e.documento === documento)) {
    return errorCampo(res, "documento", "Ya existe un empleado con ese documento.", 409);
  }

  const nuevo = { id: siguienteEmpleado++, nombre, apellido, documento, sector, email, activo: true };
  empleados.push(nuevo);
  auditar(quien(req), "EMPLEADO_ALTA", documento, `${apellido}, ${nombre} · ${sector}`);
  res.status(201).json(empleadoPublico(nuevo));
});

app.get("/api/empleados/:id/equipos", requiereLogin, requiereModulo("personas"), (req, res) => {
  const emp = empleadoPorId(Number(req.params.id));
  if (!emp) {
    return res.status(404).json({ error: "Empleado no encontrado." });
  }

  const lista = equiposAsignados(emp.id).map((e) => {
    const t = tenencias.find((x) => x.equipoId === e.id && !x.fechaDevolucion);
    return { codigo: e.codigo, marca: e.marca, modelo: e.modelo, fechaEntrega: t ? t.fechaEntrega : null };
  });

  res.json(lista);
});

app.patch("/api/empleados/:id/baja", requiereAdministrador, requiereModulo("personas"), (req, res) => {
  const emp = empleadoPorId(Number(req.params.id));
  if (!emp) {
    return res.status(404).json({ error: "Empleado no encontrado." });
  }
  if (!emp.activo) {
    return res.status(409).json({ error: "El empleado ya está inactivo." });
  }

  const cantidad = equiposAsignados(emp.id).length;
  if (cantidad > 0) {
    return res.status(409).json({
      error: `No se puede dar de baja: el empleado tiene ${cantidad} equipo(s) asignado(s).`
    });
  }

  emp.activo = false;
  auditar(quien(req), "EMPLEADO_BAJA", emp.documento, nombreEmpleado(emp));
  res.json({ mensaje: "Empleado dado de baja correctamente.", empleado: empleadoPublico(emp) });
});

// =====================================================
// Entregas y devoluciones (HU-15, HU-16)
// =====================================================
app.post("/api/equipos/:codigo/entrega", requiereLogin, requiereModulo("personas"), (req, res) => {
  const equipo = buscarEquipoPorParam(req.params.codigo);
  const empleadoId = enteroPositivo(req.body.empleadoId);
  const observaciones = texto(req.body.observaciones);

  if (!equipo) {
    return res.status(404).json({ error: `No se encontró ningún equipo con el código ${texto(req.params.codigo)}.` });
  }
  if (!empleadoId) {
    return errorCampo(res, "empleadoId", "Seleccioná un empleado.");
  }
  if (largo(observaciones) > 300) {
    return errorCampo(res, "observaciones", "Las observaciones admiten hasta 300 caracteres.");
  }
  if (equipo.estado !== "Disponible") {
    return res.status(409).json({ error: "El equipo no está disponible para entrega." });
  }

  const emp = empleadoPorId(empleadoId);
  if (!emp) {
    return res.status(404).json({ error: "Empleado no encontrado." });
  }
  if (!emp.activo) {
    return res.status(409).json({ error: "El empleado no está activo." });
  }

  // Operación completa (todo o nada)
  const numero = numeroActa("AE", siguienteActaEntrega);
  const fecha = new Date().toISOString();

  actas.push({
    numero, tipo: "Entrega", equipoId: equipo.id, empleadoId: emp.id, fecha,
    usuario: req.session.usuario.usuario, observaciones, condicion: null, falla: null
  });
  tenencias.push({
    id: siguienteTenencia++, equipoId: equipo.id, empleadoId: emp.id, fechaEntrega: fecha,
    actaEntrega: numero, fechaDevolucion: null, actaDevolucion: null, condicion: null
  });
  registrarCambio(equipo, "Asignado", `Entrega a ${nombreEmpleado(emp)} (Acta ${numero})`, req.session.usuario.usuario);
  equipo.responsableId = emp.id;
  siguienteActaEntrega++;
  auditar(quien(req), "ENTREGA", numero, `${equipo.codigo} entregado a ${nombreEmpleado(emp)}`);

  res.status(201).json({
    mensaje: `Equipo entregado. Acta ${numero} generada.`,
    acta: numero,
    equipo: equipoPublico(equipo)
  });
});

app.post("/api/equipos/:codigo/devolucion", requiereLogin, requiereModulo("personas"), (req, res) => {
  const equipo = buscarEquipoPorParam(req.params.codigo);
  const condicion = texto(req.body.condicion);
  const falla = texto(req.body.falla);

  if (!equipo) {
    return res.status(404).json({ error: `No se encontró ningún equipo con el código ${texto(req.params.codigo)}.` });
  }
  if (equipo.estado !== "Asignado") {
    return res.status(409).json({ error: "El equipo no tiene una entrega vigente." });
  }
  if (!["En condiciones", "Con falla"].includes(condicion)) {
    return errorCampo(res, "condicion", "Indicá la condición del equipo.");
  }
  if (condicion === "Con falla" && (largo(falla) < 10 || largo(falla) > 500)) {
    return errorCampo(res, "falla", "La descripción de la falla debe tener entre 10 y 500 caracteres.");
  }

  const tenencia = tenencias.find((t) => t.equipoId === equipo.id && !t.fechaDevolucion);
  const emp = empleadoPorId(equipo.responsableId);
  const numero = numeroActa("AD", siguienteActaDevolucion);
  const fecha = new Date().toISOString();

  actas.push({
    numero, tipo: "Devolución", equipoId: equipo.id, empleadoId: emp ? emp.id : null, fecha,
    usuario: req.session.usuario.usuario, observaciones: "", condicion,
    falla: condicion === "Con falla" ? falla : null
  });

  if (tenencia) {
    tenencia.fechaDevolucion = fecha;
    tenencia.actaDevolucion = numero;
    tenencia.condicion = condicion;
  }

  const destino = condicion === "En condiciones" ? "Disponible" : "En reparación";
  const motivo = `Devolución de ${nombreEmpleado(emp)} (Acta ${numero}) - ${condicion}` +
    (condicion === "Con falla" ? `: ${falla}` : "");

  registrarCambio(equipo, destino, motivo, req.session.usuario.usuario);
  equipo.responsableId = null;
  siguienteActaDevolucion++;
  auditar(quien(req), "DEVOLUCION", numero,
    `${equipo.codigo} devuelto por ${nombreEmpleado(emp)} - ${condicion}${condicion === "Con falla" ? `: ${falla}` : ""}`);

  res.status(201).json({
    mensaje: `Devolución registrada. Acta ${numero} generada.`,
    acta: numero,
    equipo: equipoPublico(equipo)
  });
});

// =====================================================
// Actas (HU-17)
// =====================================================
app.get("/api/actas/:numero", requiereLogin, requiereModulo("personas"), (req, res) => {
  const numero = texto(req.params.numero).toUpperCase();
  const acta = actas.find((a) => a.numero === numero);

  if (!acta) {
    return res.status(404).json({ error: `No se encontró el acta ${texto(req.params.numero)}.` });
  }

  const equipo = equipos.find((e) => e.id === acta.equipoId);
  const emp = empleadoPorId(acta.empleadoId);

  res.json({
    ...acta,
    equipo: equipo && {
      codigo: equipo.codigo, marca: equipo.marca, modelo: equipo.modelo,
      numeroSerie: equipo.numeroSerie, categoria: equipo.categoria
    },
    empleado: emp && { nombre: nombreEmpleado(emp), documento: emp.documento, sector: emp.sector }
  });
});

// =====================================================
// Módulos (HU-20)
// =====================================================
app.get("/api/modulos", requiereLogin, (req, res) => {
  res.json(modulos);
});

app.put("/api/modulos/:clave", requiereAdministrador, (req, res) => {
  const clave = req.params.clave;
  const activo = req.body.activo;

  if (clave === "nucleo") {
    return res.status(400).json({ error: "El núcleo no puede desactivarse." });
  }
  if (!MODULOS_INFO[clave]) {
    return res.status(404).json({ error: "Módulo inexistente." });
  }
  if (typeof activo !== "boolean") {
    return res.status(400).json({ error: "Indicá si el módulo debe estar activo." });
  }

  if (clave === "personas" && activo === false) {
    const asignados = equipos.filter((e) => e.estado === "Asignado").length;
    if (asignados > 0) {
      return res.status(409).json({
        error: `No se puede desactivar Personas y entregas: hay ${asignados} equipo(s) asignado(s).`
      });
    }
  }

  const cambio = modulos[clave] !== activo;
  modulos[clave] = activo;
  if (cambio) auditar(quien(req), activo ? "MODULO_ACTIVADO" : "MODULO_DESACTIVADO", MODULOS_INFO[clave].nombre);
  res.json({
    mensaje: `Módulo ${MODULOS_INFO[clave].nombre} ${activo ? "activado" : "desactivado"}.`,
    modulos
  });
});

// =====================================================
// Usuarios (HU-11, nueva en V3)
// =====================================================
const REGEX_USUARIO = /^[a-z0-9._]+$/;

function usuarioPublico(u) {
  // Nunca se devuelve la contraseña
  return {
    id: u.id,
    usuario: u.usuario,
    nombre: u.nombre,
    rol: u.rol,
    activo: u.activo,
    bloqueado: Boolean(u.bloqueadoHasta && u.bloqueadoHasta > Date.now())
  };
}

function buscarUsuario(nombreUsuario) {
  return usuarios.find((u) => u.usuario === texto(nombreUsuario).toLowerCase()) || null;
}

function adminsActivos() {
  return usuarios.filter((u) => u.activo && u.rol === "Administrador").length;
}

app.get("/api/usuarios", requiereAdministrador, (req, res) => {
  res.json(usuarios.map(usuarioPublico));
});

app.post("/api/usuarios", requiereAdministrador, (req, res) => {
  const usuario = texto(req.body.usuario);
  const nombre = texto(req.body.nombre);
  const rol = texto(req.body.rol);
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (largo(usuario) < 3 || largo(usuario) > 20 || !REGEX_USUARIO.test(usuario)) {
    return errorCampo(res, "usuario", "El usuario debe tener entre 3 y 20 caracteres (minúsculas, números, . o _).");
  }
  if (largo(nombre) < 2 || largo(nombre) > 50 || !REGEX_NOMBRE.test(nombre)) {
    return errorCampo(res, "nombre", "El nombre debe tener entre 2 y 50 caracteres y solo letras.");
  }
  if (!ROLES.includes(rol)) {
    return errorCampo(res, "rol", "Seleccioná un rol.");
  }
  if (largo(password) < 8 || largo(password) > 50 || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password) || !/\d/.test(password)) {
    return errorCampo(res, "password", "La contraseña debe tener entre 8 y 50 caracteres, con al menos una letra y un número.");
  }
  if (usuarios.some((u) => u.usuario.toLowerCase() === usuario.toLowerCase())) {
    return errorCampo(res, "usuario", "Ya existe un usuario con ese nombre.", 409);
  }

  const nuevo = {
    id: siguienteUsuario++, usuario, password, nombre, rol,
    activo: true, intentosFallidos: 0, bloqueadoHasta: null
  };
  usuarios.push(nuevo);
  auditar(quien(req), "USUARIO_ALTA", usuario, `${nombre} · ${rol}`);
  res.status(201).json(usuarioPublico(nuevo));
});

app.patch("/api/usuarios/:usuario", requiereAdministrador, (req, res) => {
  const objetivo = buscarUsuario(req.params.usuario);
  const body = req.body || {};

  if (!objetivo) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  const cambiaRol = body.rol !== undefined;
  const cambiaEstado = body.activo !== undefined;

  if (!cambiaRol && !cambiaEstado) {
    return res.status(400).json({ error: "Indicá el rol o el estado a modificar." });
  }
  if (cambiaRol && !ROLES.includes(body.rol)) {
    return errorCampo(res, "rol", "Seleccioná un rol.");
  }
  if (cambiaEstado && typeof body.activo !== "boolean") {
    return errorCampo(res, "activo", "Indicá si el usuario debe estar activo.");
  }
  if (objetivo.id === req.session.usuario.id) {
    return res.status(409).json({ error: "No podés modificar tu propio rol o estado." });
  }

  const pierdeAdmin = objetivo.rol === "Administrador" && objetivo.activo &&
    ((cambiaRol && body.rol !== "Administrador") || (cambiaEstado && body.activo === false));
  if (pierdeAdmin && adminsActivos() <= 1) {
    return res.status(409).json({ error: "Debe quedar al menos un Administrador activo." });
  }

  if (cambiaRol && body.rol !== objetivo.rol) {
    auditar(quien(req), "USUARIO_ROL", objetivo.usuario, `${objetivo.rol} → ${body.rol}`);
    objetivo.rol = body.rol;
  }
  if (cambiaEstado && body.activo !== objetivo.activo) {
    auditar(quien(req), "USUARIO_ESTADO", objetivo.usuario, body.activo ? "Inactivo → Activo" : "Activo → Inactivo");
    objetivo.activo = body.activo;
  }

  res.json({ mensaje: `Usuario ${objetivo.usuario} actualizado correctamente.`, usuario: usuarioPublico(objetivo) });
});

app.post("/api/usuarios/:usuario/desbloquear", requiereAdministrador, (req, res) => {
  const objetivo = buscarUsuario(req.params.usuario);

  if (!objetivo) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }
  if (!usuarioPublico(objetivo).bloqueado) {
    return res.status(409).json({ error: "El usuario no está bloqueado." });
  }

  objetivo.bloqueadoHasta = null;
  objetivo.intentosFallidos = 0;
  auditar(quien(req), "USUARIO_DESBLOQUEO", objetivo.usuario);
  res.json({ mensaje: `Usuario ${objetivo.usuario} desbloqueado.`, usuario: usuarioPublico(objetivo) });
});

// =====================================================
// Auditoría (HU-12, nueva en V3)
// =====================================================
const ACCIONES_AUDITORIA = [
  "LOGIN_OK", "LOGIN_FALLIDO", "USUARIO_BLOQUEADO", "LOGOUT",
  "EQUIPO_ALTA", "EQUIPO_EDICION", "EQUIPO_ESTADO", "EQUIPO_BAJA",
  "EMPLEADO_ALTA", "EMPLEADO_BAJA", "ENTREGA", "DEVOLUCION",
  "MODULO_ACTIVADO", "MODULO_DESACTIVADO",
  "USUARIO_ALTA", "USUARIO_ROL", "USUARIO_ESTADO", "USUARIO_DESBLOQUEO",
  "DATOS_RESTAURADOS"
];
const POR_PAGINA = 20;

// "aaaa-mm-dd" -> Date (hora local) o null si no es una fecha válida
function fechaLocal(valor, finDelDia) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto(valor));
  if (!m) return null;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const d = finDelDia ? new Date(anio, mes, dia, 23, 59, 59, 999) : new Date(anio, mes, dia, 0, 0, 0, 0);
  return d.getFullYear() === anio && d.getMonth() === mes && d.getDate() === dia ? d : null;
}

app.get("/api/auditoria", requiereAdministrador, (req, res) => {
  const { usuario, accion, desde, hasta, q } = req.query;
  const busqueda = texto(q).toLowerCase();

  const fDesde = texto(desde) ? fechaLocal(desde, false) : null;
  const fHasta = texto(hasta) ? fechaLocal(hasta, true) : null;
  if ((texto(desde) && !fDesde) || (texto(hasta) && !fHasta)) {
    return res.status(400).json({ error: "Ingresá una fecha válida." });
  }
  if (fDesde && fHasta && fDesde > fHasta) {
    return res.status(400).json({ error: "La fecha Desde no puede ser posterior a Hasta." });
  }

  const filtrados = auditoria
    .filter((r) => !texto(usuario) || r.usuario === texto(usuario))
    .filter((r) => !texto(accion) || r.accion === texto(accion))
    .filter((r) => !fDesde || new Date(r.fecha) >= fDesde)
    .filter((r) => !fHasta || new Date(r.fecha) <= fHasta)
    .filter((r) => !busqueda || r.objeto.toLowerCase().includes(busqueda) || r.detalle.toLowerCase().includes(busqueda))
    .reverse(); // del más reciente al más antiguo

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pedida = enteroPositivo(req.query.pagina) || 1;
  const pagina = Math.min(pedida, totalPaginas);

  res.json({
    registros: filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA),
    total,
    pagina,
    totalPaginas,
    porPagina: POR_PAGINA,
    usuarios: [...new Set(auditoria.map((r) => r.usuario).filter(Boolean))].sort(),
    acciones: ACCIONES_AUDITORIA
  });
});

// =====================================================
// Restaurar datos de prueba (RNF-09)
// =====================================================
app.post("/api/test/reset", requiereAdministrador, (req, res) => {
  const usuario = quien(req);
  resetDatos();
  auditar(usuario, "DATOS_RESTAURADOS", "", "Se restauraron los datos iniciales de prueba.");
  res.json({ mensaje: "Datos de prueba restaurados." });
});

// =====================================================
// Páginas
// =====================================================
// HU-01 (v3) - BUG-03: misma regla que el login (public/js/login.js).
// Devuelve la ruta interna normalizada, o null si podría salir del sistema.
function destinoSeguro(next) {
  if (typeof next !== "string" || !next.startsWith("/")) return null;
  if (next[1] === "/" || next[1] === "\\") return null;
  if (/[\u0000-\u001F\u007F]/.test(next)) return null;
  try {
    const base = "http://gestit.local";
    const url = new URL(next, base);
    if (url.origin !== base) return null;
    return url.pathname + url.search + url.hash;
  } catch (error) {
    return null;
  }
}

app.get("/", (req, res) => {
  const destino = destinoSeguro(req.query.next);
  if (req.session.usuario && destino) {
    return res.redirect(destino);
  }
  if (req.session.usuario) {
    return res.sendFile(path.join(__dirname, "public", "dashboard.html"));
  }
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/dashboard", (req, res) => {
  if (!req.session.usuario) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.use((req, res) => {
  res.status(404).json({ error: "Recurso no encontrado." });
});

// Se exporta la app para los tests automatizados; solo escucha si se ejecuta directamente
module.exports = { app, resetDatos };

if (require.main === module) app.listen(PORT, () => {
  console.log("");
  console.log("====================================");
  console.log("     GestIT V3 - Servidor iniciado");
  console.log("====================================");
  console.log(`URL: http://localhost:${PORT}`);
  console.log("");
});
