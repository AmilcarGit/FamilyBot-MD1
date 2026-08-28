const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
const {
  BOT_TOKEN,
  BOT_NAME,
  validarConfig
} = require('./lib/config');
const { registrarMiddleware } = require('./lib/middleware');

const erroresConfig = validarConfig();

if (erroresConfig.length) {
  console.error(`❌ Configuración incompleta o inválida: ${erroresConfig.join(', ')}`);
  console.error('   Revisa tu archivo .env antes de iniciar el bot.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const commandsPath = path.join(__dirname, 'commands');

function cargarComandos() {
  if (!fs.existsSync(commandsPath)) {
    throw new Error('No existe la carpeta commands/.');
  }

  const archivos = fs.readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'))
    .sort();

  if (!archivos.length) {
    throw new Error('No se encontraron comandos en commands/.');
  }

  for (const file of archivos) {
    const ruta = path.join(commandsPath, file);

    try {
      const registrar = require(ruta);
      if (typeof registrar !== 'function') {
        throw new TypeError('El módulo debe exportar una función (bot) => {...}.');
      }

      registrar(bot);
      console.log(`✅ Comando cargado: ${file}`);
    } catch (error) {
      console.error(`❌ No se pudo cargar ${file}: ${error.message}`);
      throw error;
    }
  }
}

// Middleware global: registra usuarios y grupos sin bloquear los comandos.
registrarMiddleware(bot);

try {
  cargarComandos();
} catch (error) {
  console.error('❌ Error fatal cargando comandos:', error);
  process.exit(1);
}

bot.catch((error, ctx) => {
  const updateType = ctx?.updateType || 'desconocido';
  const chatId = ctx?.chat?.id || 'sin chat';
  const userId = ctx?.from?.id || 'sin usuario';

  console.error(
    `⚠️ Error manejado | update=${updateType} | chat=${chatId} | user=${userId} | ${error.message}`
  );
});

let iniciado = false;
let apagando = false;

async function iniciar() {
  try {
    await bot.launch();
    iniciado = true;
    console.log(`🟢 ${BOT_NAME} está online — SYSTEM ONLINE`);
  } catch (error) {
    console.error(`❌ No se pudo iniciar ${BOT_NAME}:`, error.message);
    process.exit(1);
  }
}

async function apagar(signal) {
  if (apagando) return;
  apagando = true;

  console.log(`🛑 Recibida señal ${signal}. Cerrando bot...`);

  try {
    if (iniciado) bot.stop(signal);
  } finally {
    process.exit(0);
  }
}

process.once('SIGINT', () => apagar('SIGINT'));
process.once('SIGTERM', () => apagar('SIGTERM'));

process.on('unhandledRejection', (error) => {
  console.error('⚠️ Promesa no manejada:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  // Dejamos que el supervisor (PM2/systemd/etc.) decida si debe reiniciar el proceso.
  process.exit(1);
});

iniciar();
