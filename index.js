const { Telegraf } = require('telegraf');
const { BOT_TOKEN, BOT_NAME } = require('./lib/config');

if (!BOT_TOKEN) {
  console.error('❌ ERROR: No se encontró BOT_TOKEN. Copia .env.example a .env y coloca tu token de @BotFather.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Cargar todos los comandos desde /commands
const fs = require('fs');
const path = require('path');
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath)
  .filter((f) => f.endsWith('.js'))
  .forEach((file) => {
    require(path.join(commandsPath, file))(bot);
    console.log(`✅ Comando cargado: ${file}`);
  });

bot.catch((err, ctx) => {
  console.error(`⚠️ Error en el bot para ${ctx.updateType}:`, err);
});

bot.launch().then(() => {
  console.log(`🟢 ${BOT_NAME} está online 24/7 — SYSTEM ONLINE`);
});

// Apagado limpio
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
