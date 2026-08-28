const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');
const DB_TMP_PATH = path.join(DB_DIR, 'db.json.tmp');

const DEFAULT_DB = {
  grupos: {},
  usuarios: {}
};

const DEFAULT_GROUP = {
  id: null,
  type: null,
  title: null,
  username: null,
  antilink: true,
  language: 'es',
  prefix: '/',
  createdAt: null,
  updatedAt: null
};

const DEFAULT_USER = {
  id: null,
  historial: [],
  username: null,
  firstName: null,
  lastName: null,
  isBot: false,
  createdAt: null,
  updatedAt: null
};

let cache = null;

function now() {
  return new Date().toISOString();
}

function ensureDBDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function normalizarDB(data) {
  return {
    grupos: data?.grupos && typeof data.grupos === 'object' && !Array.isArray(data.grupos) ? data.grupos : {},
    usuarios: data?.usuarios && typeof data.usuarios === 'object' && !Array.isArray(data.usuarios) ? data.usuarios : {}
  };
}

function ensureDB() {
  ensureDBDir();

  if (!fs.existsSync(DB_PATH)) {
    guardarDB({ ...DEFAULT_DB });
  }
}

function leerDB() {
  if (cache) return cache;

  ensureDB();

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    cache = normalizarDB(JSON.parse(raw));
    return cache;
  } catch (error) {
    console.error('❌ No se pudo leer la base de datos:', error.message);
    throw new Error('La base de datos local está dañada o no es válida.');
  }
}

function guardarDB(data) {
  ensureDBDir();

  const normalizada = normalizarDB(data);
  const contenido = JSON.stringify(normalizada, null, 2);

  fs.writeFileSync(DB_TMP_PATH, contenido, 'utf-8');
  fs.renameSync(DB_TMP_PATH, DB_PATH);
  cache = normalizada;

  return cache;
}

function tieneCambios(actual, cambios) {
  return Object.entries(cambios).some(([clave, valor]) => actual[clave] !== valor);
}

function crearGrupo(chatId, datos = {}) {
  const timestamp = now();
  return {
    ...DEFAULT_GROUP,
    ...datos,
    id: String(chatId),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function crearUsuario(userId, datos = {}) {
  const timestamp = now();
  return {
    ...DEFAULT_USER,
    ...datos,
    id: String(userId),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function getGrupo(chatId) {
  const id = String(chatId);
  const data = leerDB();

  if (!data.grupos[id]) {
    data.grupos[id] = crearGrupo(id);
    guardarDB(data);
  }

  return data.grupos[id];
}

function setGrupo(chatId, cambios = {}) {
  const id = String(chatId);
  const data = leerDB();
  const actual = data.grupos[id];
  const timestamp = now();

  data.grupos[id] = {
    ...DEFAULT_GROUP,
    ...actual,
    ...cambios,
    id,
    createdAt: actual?.createdAt || timestamp,
    updatedAt: timestamp
  };

  guardarDB(data);
  return data.grupos[id];
}

function upsertGrupo(chatId, cambios = {}) {
  const id = String(chatId);
  const data = leerDB();
  const actual = data.grupos[id];
  const cambiosNormalizados = { ...cambios, id };

  if (actual && !tieneCambios(actual, cambiosNormalizados)) return actual;

  const timestamp = now();
  data.grupos[id] = {
    ...DEFAULT_GROUP,
    ...actual,
    ...cambiosNormalizados,
    createdAt: actual?.createdAt || timestamp,
    updatedAt: timestamp
  };

  guardarDB(data);
  return data.grupos[id];
}

function getUsuario(userId) {
  const id = String(userId);
  const data = leerDB();

  if (!data.usuarios[id]) {
    data.usuarios[id] = crearUsuario(id);
    guardarDB(data);
  }

  return data.usuarios[id];
}

function setUsuario(userId, cambios = {}) {
  const id = String(userId);
  const data = leerDB();
  const actual = data.usuarios[id];
  const timestamp = now();

  data.usuarios[id] = {
    ...DEFAULT_USER,
    ...actual,
    ...cambios,
    id,
    createdAt: actual?.createdAt || timestamp,
    updatedAt: timestamp
  };

  guardarDB(data);
  return data.usuarios[id];
}

function upsertUsuario(userId, cambios = {}) {
  const id = String(userId);
  const data = leerDB();
  const actual = data.usuarios[id];
  const cambiosNormalizados = { ...cambios, id };

  if (actual && !tieneCambios(actual, cambiosNormalizados)) return actual;

  const timestamp = now();
  data.usuarios[id] = {
    ...DEFAULT_USER,
    ...actual,
    ...cambiosNormalizados,
    createdAt: actual?.createdAt || timestamp,
    updatedAt: timestamp
  };

  guardarDB(data);
  return data.usuarios[id];
}

function limpiarCache() {
  cache = null;
}

module.exports = {
  leerDB,
  guardarDB,
  limpiarCache,
  getGrupo,
  setGrupo,
  upsertGrupo,
  getUsuario,
  setUsuario,
  upsertUsuario
};
