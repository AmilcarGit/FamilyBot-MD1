const { BOT_NAME } = require('../lib/config');
const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { Markup } = require('telegraf');
const { enviarMenu } = require('../lib/menu-media');

function teclado() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📚 Todos los comandos', 'menu_comandos')],
    [Markup.button.callback('🏠 Inicio', 'menu_inicio')]
  ]);
}

function comandos(grupo) {
  return `📚 *${t(grupo, 'todosComandos')}*\n\n` +
    `🏠 *${t(grupo, 'categoriaGeneral')}*\n/start — ${t(grupo, 'menuPrincipal')}\n/menu — ${t(grupo, 'menuPrincipal')}\n/ayuda — ${t(grupo, 'esteMensaje')}\n/frase — ${t(grupo, 'fraseFamilia')}\n\n` +
    `📥 *DESCARGAS*\n/ytmp4 <url> — Descargar video de YouTube\n\n` +
    `👥 *${t(grupo, 'categoriaGrupo')}*\n/grupo — ${t(grupo, 'infoGrupo')}\n/admins — ${t(grupo, 'listaAdmins')}\n/reglas — ${t(grupo, 'reglasTitulo')}\n/setreglas <texto> — ${t(grupo, 'reglasUso')}\n/delreglas — ${t(grupo, 'reglasEliminadas')}\n\n` +
    `🛡️ *${t(grupo, 'categoriaModeracion')}*\n/seguridad — ${t(grupo, 'panelSeguridad')}\n/antilink on|off — ${t(grupo, 'moderacionLinks')}\n/mute — ${t(grupo, 'muteUso')}\n/unmute — ${t(grupo, 'unmuteUso')}\n\n` +
    `⚙️ *${t(grupo, 'categoriaConfiguracion')}*\n/config — ${t(grupo, 'configTitulo')}\n/ajustes — ${t(grupo, 'configuracion')}\n/bienvenida — ${t(grupo, 'bienvenidaTitulo')}\n/despedida — ${t(grupo, 'despedidaTitulo')}\n/idioma es|en — ${t(grupo, 'idioma')}\n/prefijo <carácter> — ${t(grupo, 'prefijo')}\n\n` +
    `🤖 *${t(grupo, 'categoriaBots')}*\n/bots — ${t(grupo, 'estadoSistema')}\n/ia <pregunta> — ${t(grupo, 'preguntaIA')}\n/resetia — ${t(grupo, 'borrarHistorial')}\n\n` +
    `🎁 *${t(grupo, 'categoriaExtras')}*\n/extras — ${t(grupo, 'funcionesExtra')}\n/redes — ${t(grupo, 'redesSociales')}`;
}

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery().catch(() => {});
    const grupo = ctx.chat?.type !== 'private' ? db.getGrupo(ctx.chat.id) : { language: 'es' };
    const texto = `❓ *${t(grupo, 'ayudaTitulo', { bot: BOT_NAME })}*\n\n` +
      `/start — ${t(grupo, 'menuPrincipal')}\n/grupo — ${t(grupo, 'infoGrupo')}\n/bots — ${t(grupo, 'estadoSistema')}\n/seguridad — ${t(grupo, 'panelSeguridad')}\n/antilink on|off — ${t(grupo, 'moderacionLinks')}\n/config — ${t(grupo, 'configTitulo')}\n/extras — ${t(grupo, 'funcionesExtra')}\n/frase — ${t(grupo, 'fraseFamilia')}\n/ia <pregunta> — ${t(grupo, 'preguntaIA')}\n/resetia — ${t(grupo, 'borrarHistorial')}\n/redes — ${t(grupo, 'redesSociales')}\n/ayuda — ${t(grupo, 'esteMensaje')}`;
    return enviarMenu(ctx, texto, teclado(), 'Markdown');
  };

  bot.command('ayuda', responder);
  bot.command('help', responder);
  bot.action('menu_ayuda', responder);

  bot.action('menu_comandos', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const grupo = ctx.chat?.type !== 'private' ? db.getGrupo(ctx.chat.id) : { language: 'es' };
    return enviarMenu(ctx, comandos(grupo), teclado(), 'Markdown');
  });
};
