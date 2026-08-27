const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

function ensureDB() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ grupos: {}, usuarios: {} }, null, 2));
  }
}

function leerDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function guardarDB(data) {
  ensureDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// --- Ajustes por grupo (antilink, idioma, etc.) ---
function getGrupo(chatId) {
  const db = leerDB();
  if (!db.grupos[chatId]) {
    db.grupos[chatId] = { antilink: true };
    guardarDB(db);
  }
  return db.grupos[chatId];
}

function setGrupo(chatId, cambios) {
  const db = leerDB();
  db.grupos[chatId] = { ...(db.grupos[chatId] || {}), ...cambios };
  guardarDB(db);
  return db.grupos[chatId];
}

// --- Datos por usuario (ej: historial corto para la IA) ---
function getUsuario(userId) {
  const db = leerDB();
  if (!db.usuarios[userId]) {
    db.usuarios[userId] = { historial: [] };
    guardarDB(db);
  }
  return db.usuarios[userId];
}

function setUsuario(userId, cambios) {
  const db = leerDB();
  db.usuarios[userId] = { ...(db.usuarios[userId] || {}), ...cambios };
  guardarDB(db);
  return db.usuarios[userId];
}

module.exports = { leerDB, guardarDB, getGrupo, setGrupo, getUsuario, setUsuario };