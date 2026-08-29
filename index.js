const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
const { BOT_TOKEN, BOT_NAME, validarConfig } = require('./lib/config');
const { registrarMiddleware } = require('./lib/middleware');

const erroresConfig = validarConfig();

if (erroresConfig.length) {
  console.error(`❌ Configuración incompleta o inválida: ${erroresConfig.join(', ')}`);
  console.error('Revisa tu archivo .env antes de iniciar el bot.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const commandsPath = path.join(__dirname, 'commands');
let comandosCargados = 0;
let iniciado = false;
let apagando = false;

function cargarComandos() {
  if (!fs.existsSync(commandsPath)) throw new Error('No existe la carpeta commands/.');
  const archivos = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js')).sort();
  if (!archivos.length) throw new Error('No se encontraron comandos en commands/.');

  console.log('');
  console.log('📦 Cargando comandos...');

  for (const file of archivos) {
    const ruta = path.join(commandsPath, file);
    try {
      delete require.cache[require.resolve(ruta)];
      const registrar = require(ruta);
      if (typeof registrar !== 'function') throw new TypeError('El módulo debe exportar una función (bot) => {...}.');
      registrar(bot);
      comandosCargados += 1;
      console.log(`   ✅ ${file}`);
    } catch (error) {
      console.error(`   ❌ ${file}: ${error.message}`);
      throw error;
    }
  }

  console.log(`📦 ${comandosCargados} comandos cargados correctamente.`);
}

function mostrarInicio() {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log(`║  🤖 ${BOT_NAME.padEnd(30)}║`);
  console.log('║  🟢 BOT ONLINE                       ║');
  console.log(`║  📦 Comandos: ${String(comandosCargados).padEnd(21)}║`);
  console.log('║  🌐 Telegram: conectado              ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  console.log('Escribe Ctrl+C para detener el bot.');
  console.log('');
}

registrarMiddleware(bot);

try {
  cargarComandos();
} catch (error) {
  console.error('');
  console.error(`❌ Error fatal cargando comandos: ${error.message}`);
  process.exit(1);
}

bot.catch((error, ctx) => {
  const updateType = ctx?.updateType || 'desconocido';
  const chatId = ctx?.chat?.id || 'sin chat';
  const userId = ctx?.from?.id || 'sin usuario';
  console.error(`⚠️ Error | update=${updateType} | chat=${chatId} | user=${userId} | ${error.message}`);
});

async function iniciar() {
  try {
    await bot.launch();
    iniciado = true;
    mostrarInicio();
  } catch (error) {
    console.error(`❌ No se pudo iniciar ${BOT_NAME}: ${error.message}`);
    process.exit(1);
  }
}

async function apagar(signal) {
  if (apagando) return;
  apagando = true;
  console.log('');
  console.log(`🛑 Cerrando ${BOT_NAME}...`);
  try {
    if (iniciado) bot.stop(signal);
  } finally {
    console.log('🔴 Bot detenido correctamente.');
    process.exit(0);
  }
}

process.once('SIGINT', () => apagar('SIGINT'));
process.once('SIGTERM', () => apagar('SIGTERM'));
process.on('unhandledRejection', (error) => console.error(`⚠️ Promesa no manejada: ${error?.message || error}`));
process.on('uncaughtException', (error) => {
  console.error(`❌ Excepción no capturada: ${error.message}`);
  process.exit(1);
});

iniciar();
