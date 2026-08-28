const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');
const DB_TMP_PATH = path.join(DB_DIR, 'db.json.tmp');

const DEFAULT_GROUP = {
  antilink: true,
  language: 'es',
  prefix: '/',
  createdAt: null,
  updatedAt: null
};

const DEFAULT_USER = {
  historial: [],
  username: null,
  firstName: null,
  lastName: null,
  isBot: false,
  createdAt: null,
  updatedAt: null
};

function now() {
  return new Date().toISOString();
}

function ensureDBDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function ensureDB() {
  ensureDBDir();
  if (!fs.existsSync(DB_PATH)) {
    guardarDB({ grupos: {}, usuarios: {} });
  }
}

function leerDB() {
  ensureDB();

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return {
      grupos: data?.grupos && typeof data.grupos === 'object' ? data.grupos : {},
      usuarios: data?.usuarios && typeof data.usuarios === 'object' ? data.usuarios : {}
    };
  } catch (error) {
    console.error('❌ No se pudo leer la base de datos:', error.message);
    throw new Error('La base de datos local está dañada o no es válida.');
  }
}

function guardarDB(data) {
  ensureDBDir();
  const contenido = JSON.stringify(data, null, 2);
  fs.writeFileSync(DB_TMP_PATH, contenido, 'utf-8');
  fs.renameSync(DB_TMP_PATH, DB_PATH);
}

function tieneCambios(actual, cambios) {
  return Object.entries(cambios).some(([clave, valor]) => actual[clave] !== valor);
}

function getGrupo(chatId) {
  const id = String(chatId);
  const data = leerDB();

  if (!data.grupos[id]) {
    const timestamp = now();
    data.grupos[id] = { ...DEFAULT_GROUP, createdAt: timestamp, updatedAt: timestamp };
    guardarDB(data);
  }

  return data.grupos[id];
}

function setGrupo(chatId, cambios = {}) {
  const id = String(chatId);
  const data = leerDB();
  const actual = data.grupos[id] || {};
  const timestamp = now();

  data.grupos[id] = {
    ...DEFAULT_GROUP,
    ...actual,
    ...cambios,
    createdAt: actual.createdAt || timestamp,
    updatedAt: timestamp
  };

  guardarDB(data);
  return data.grupos[id];
}

function upsertGrupo(chatId, cambios = {}) {
  const id = String(chatId);
  const data = leerDB();
  const actual = data.grupos[id];

  if (actual && !tieneCambios(actual, cambios)) return actual;

  const timestamp = now();
  data.grupos[id] = {
    ...DEFAULT_GROUP,
    ...actual,
    ...cambios,
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
    const timestamp = now();
    data.usuarios[id] = { ...DEFAULT_USER, createdAt: timestamp, updatedAt: timestamp };
    guardarDB(data);
  }

  return data.usuarios[id];
}

function setUsuario(userId, cambios = {}) {
  const id = String(userId);
  const data = leerDB();
  const actual = data.usuarios[id] || {};
  const timestamp = now();

  data.usuarios[id] = {
    ...DEFAULT_USER,
    ...actual,
    ...cambios,
    createdAt: actual.createdAt || timestamp,
    updatedAt: timestamp
  };

  guardarDB(data);
  return data.usuarios[id];
}

function upsertUsuario(userId, cambios = {}) {
  const id = String(userId);
  const data = leerDB();
  const actual = data.usuarios[id];

  if (actual && !tieneCambios(actual, cambios)) return actual;

  const timestamp = now();
  data.usuarios[id] = {
    ...DEFAULT_USER,
    ...actual,
    ...cambios,
    createdAt: actual?.createdAt || timestamp,
    updatedAt: timestamp
  };
  guardarDB(data);
  return data.usuarios[id];
}

module.exports = {
  leerDB,
  guardarDB,
  getGrupo,
  setGrupo,
  upsertGrupo,
  getUsuario,
  setUsuario,
  upsertUsuario
};
