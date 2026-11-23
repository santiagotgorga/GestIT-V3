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

const usuarios = [
  { id: 1, usuario: "admin", password: "admin123", nombre: "Administrador", rol: "Administrador" },
  { id: 2, usuario: "operador", password: "operador123", nombre: "Operador", rol: "Operador" }
];

// =====================================================
// Datos en memoria (se restituyen con resetDatos)
// =====================================================
let equipos, empleados, tenencias, actas, modulos;
let siguienteEquipo, siguienteEmpleado, siguienteTenencia, siguienteActaEntrega, siguienteActaDevolucion;

function codigoEquipo(n) {
  return `EQ-${String(n).padStart(5, "0")}`;
}

function numeroActa(prefijo, n) {
  return `${prefijo}-${String(n).padStart(6, "0")}`;
}

function resetDatos() {
  const ahora = new Date();
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
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: "Ingresá usuario y contraseña." });
  }

  const encontrado = usuarios.find((u) => u.usuario === usuario && u.password === password);

  if (!encontrado) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }

  req.session.usuario = {
    id: encontrado.id,
    usuario: encontrado.usuario,
    nombre: encontrado.nombre,
    rol: encontrado.rol
  };

  res.json({ mensaje: "Login correcto.", usuario: req.session.usuario });
});

app.get("/api/me", (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: "No autenticado." });
  }
  res.json({ usuario: req.session.usuario, modulos });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "No se pudo cerrar la sesión." });
    }
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

app.post("/api/equipos", requiereLogin, (req, res) => {
  const marca = texto(req.body.marca);
  const modelo = texto(req.body.modelo);
  const numeroSerie = texto(req.body.numeroSerie);
  const categoria = texto(req.body.categoria);
  const observaciones = texto(req.body.observaciones);

  if (marca.length < 2 || marca.length > 50) {
    return errorCampo(res, "marca", "La marca debe tener entre 2 y 50 caracteres.");
  }
  if (modelo.length < 2 || modelo.length > 80) {
    return errorCampo(res, "modelo", "El modelo debe tener entre 2 y 80 caracteres.");
  }
  if (numeroSerie.length < 4 || numeroSerie.length > 40) {
    return errorCampo(res, "numeroSerie", "El número de serie debe tener entre 4 y 40 caracteres.");
  }
  if (!/^[A-Za-z0-9-]+$/.test(numeroSerie)) {
    return errorCampo(res, "numeroSerie", "El número de serie solo admite letras, números y guiones.");
  }
  if (!CATEGORIAS.includes(categoria)) {
    return errorCampo(res, "categoria", "Seleccioná una categoría.");
  }
  if (observaciones.length > 500) {
    return errorCampo(res, "observaciones", "Las observaciones admiten hasta 500 caracteres.");
  }

  const serieExiste = equipos.some(
    (e) => e.numeroSerie.trim().toLowerCase() === numeroSerie.toLowerCase()
  );
  if (serieExiste) {
    return errorCampo(res, "numeroSerie", "Ya existe un equipo con ese número de serie.", 409);
  }

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
  res.status(201).json(equipoPublico(nuevo));
});

// Exportación CSV (HU-19) — se declara antes de /:codigo
app.get("/api/equipos/export", requiereLogin, requiereModulo("identificacion"), (req, res) => {
  const lista = filtrarEquipos(req.query);

  if (lista.length === 0) {
    return res.status(404).json({ error: "No hay equipos para exportar con los filtros aplicados." });
  }

  const celda = (valor) => {
    const s = String(valor ?? "");
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
  if (motivo.length < 10 || motivo.length > 500) {
    return errorCampo(res, "motivo", "El motivo debe tener entre 10 y 500 caracteres.");
  }

  registrarCambio(equipo, estado, motivo, req.session.usuario.usuario);
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
  if (motivo.length < 10 || motivo.length > 500) {
    return errorCampo(res, "motivo", "El motivo debe tener entre 10 y 500 caracteres.");
  }

  registrarCambio(equipo, "Dado de baja", motivo, req.session.usuario.usuario);
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

  if (nombre.length < 2 || nombre.length > 50 || !REGEX_NOMBRE.test(nombre)) {
    return errorCampo(res, "nombre", "El nombre debe tener entre 2 y 50 caracteres y solo letras.");
  }
  if (apellido.length < 2 || apellido.length > 50 || !REGEX_NOMBRE.test(apellido)) {
    return errorCampo(res, "apellido", "El apellido debe tener entre 2 y 50 caracteres y solo letras.");
  }
  if (!/^\d{7,8}$/.test(documento)) {
    return errorCampo(res, "documento", "El documento debe tener 7 u 8 dígitos numéricos.");
  }
  if (!SECTORES.includes(sector)) {
    return errorCampo(res, "sector", "Seleccioná un sector.");
  }
  if (email.length > 100 || !REGEX_EMAIL.test(email)) {
    return errorCampo(res, "email", "Ingresá un email válido.");
  }
  if (empleados.some((e) => e.documento === documento)) {
    return errorCampo(res, "documento", "Ya existe un empleado con ese documento.", 409);
  }

  const nuevo = { id: siguienteEmpleado++, nombre, apellido, documento, sector, email, activo: true };
  empleados.push(nuevo);
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
  res.json({ mensaje: "Empleado dado de baja correctamente.", empleado: empleadoPublico(emp) });
});

// =====================================================
// Entregas y devoluciones (HU-15, HU-16)
// =====================================================
app.post("/api/equipos/:codigo/entrega", requiereLogin, requiereModulo("personas"), (req, res) => {
  const equipo = buscarEquipoPorParam(req.params.codigo);
  const empleadoId = Number(req.body.empleadoId);
  const observaciones = texto(req.body.observaciones);

  if (!equipo) {
    return res.status(404).json({ error: `No se encontró ningún equipo con el código ${texto(req.params.codigo)}.` });
  }
  if (!empleadoId) {
    return errorCampo(res, "empleadoId", "Seleccioná un empleado.");
  }
  if (observaciones.length > 300) {
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
  if (condicion === "Con falla" && (falla.length < 10 || falla.length > 500)) {
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

  modulos[clave] = activo;
  res.json({
    mensaje: `Módulo ${MODULOS_INFO[clave].nombre} ${activo ? "activado" : "desactivado"}.`,
    modulos
  });
});

// =====================================================
// Restaurar datos de prueba (RNF-09)
// =====================================================
app.post("/api/test/reset", requiereAdministrador, (req, res) => {
  resetDatos();
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

app.listen(PORT, () => {
  console.log("");
  console.log("====================================");
  console.log("     GestIT V2 - Servidor iniciado");
  console.log("====================================");
  console.log(`URL: http://localhost:${PORT}`);
  console.log("");
});
