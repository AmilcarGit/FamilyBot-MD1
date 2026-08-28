require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN?.trim();
const OWNER_ID = process.env.OWNER_ID?.trim();
const BOT_NAME = process.env.BOT_NAME?.trim() || 'FamilyBot-MD';
const AI_MODEL = process.env.AI_MODEL?.trim() || 'claude-haiku-4-5-20251001';

const familia = [
  { nombre: 'ElyssiaBot-MD', frase: 'La Elegancia Escucha 🎧' },
  { nombre: 'TheKael-MD', frase: 'Fuerza · Lealtad · Poder 🛡️' },
  { nombre: 'TheYui-MD', frase: 'Doce como el viento 🍃' },
  { nombre: 'TheEly-MD', frase: 'Velocidad sin Límites ⚡' }
];

function validarConfig() {
  const errores = [];

  if (!BOT_TOKEN) errores.push('BOT_TOKEN');
  if (!OWNER_ID) errores.push('OWNER_ID');
  if (OWNER_ID && !/^\d+$/.test(OWNER_ID)) errores.push('OWNER_ID (debe ser numérico)');

  return errores;
}

module.exports = {
  BOT_TOKEN,
  OWNER_ID,
  BOT_NAME,
  AI_MODEL,
  startTime: Date.now(),
  familia,
  validarConfig
};
