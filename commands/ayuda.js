const { BOT_NAME } = require('../lib/config');
const db = require('../lib/db');
const { t } = require('../lib/i18n');

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery();
    const grupo = ctx.chat?.type !== 'private' ? db.getGrupo(ctx.chat.id) : { language: 'es' };
    const texto = `❓ *${t(grupo, 'ayudaTitulo', { bot: BOT_NAME })}*\n\n` +
      `/start — ${t(grupo, 'menuPrincipal')}\n` +
      `/grupo — ${t(grupo, 'infoGrupo')}\n` +
      `/bots — ${t(grupo, 'estadoSistema')}\n` +
      `/seguridad — ${t(grupo, 'panelSeguridad')}\n` +
      `/antilink on|off — ${t(grupo, 'moderacionLinks')}\n` +
      `/ajustes — ${t(grupo, 'configuracion')}\n` +
      `/extras — ${t(grupo, 'funcionesExtra')}\n` +
      `/frase — ${t(grupo, 'fraseFamilia')}\n` +
      `/ia <pregunta> — ${t(grupo, 'preguntaIA')}\n` +
      `/resetia — ${t(grupo, 'borrarHistorial')}\n` +
      `/redes — ${t(grupo, 'redesSociales')}\n` +
      `/ayuda — ${t(grupo, 'esteMensaje')}`;
    return ctx.replyWithMarkdown(texto);
  };

  bot.command('ayuda', responder);
  bot.command('help', responder);
  bot.action('menu_ayuda', responder);
};
