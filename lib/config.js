require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  OWNER_ID: process.env.OWNER_ID,
  BOT_NAME: process.env.BOT_NAME || 'FamilyBot-MD',
  startTime: Date.now(),
  // "Familia" de personajes del bot (personaliza como quieras)
  familia: [
    { nombre: 'ElyssiaBot-MD', frase: 'La Elegancia Escucha 🎧' },
    { nombre: 'TheKael-MD', frase: 'Fuerza · Lealtad · Poder 🛡️' },
    { nombre: 'TheYui-MD', frase: 'Doce como el viento 🍃' },
    { nombre: 'TheEly-MD', frase: 'Velocidad sin Límites ⚡' }
  ]
};
