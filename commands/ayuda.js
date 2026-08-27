const { BOT_NAME } = require('../lib/config');

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery();
    ctx.replyWithMarkdown(
      `❓ *Ayuda — ${BOT_NAME}*\n\n` +
      `/start — Menú principal\n` +
      `/grupo — Info del grupo\n` +
      `/bots — Estado del sistema\n` +
      `/seguridad — Panel de seguridad\n` +
      `/antilink on|off — Moderación de links\n` +
      `/ajustes — Configuración\n` +
      `/extras — Funciones extra\n` +
      `/frase — Frase random de la familia\n` +
      `/ia <pregunta> — Pregúntale a la IA\n` +
      `/resetia — Borra tu historial con la IA\n` +
      `/redes — Redes sociales\n` +
      `/ayuda — Este mensaje`
    );
  };

  bot.command('ayuda', responder);
  bot.command('help', responder);
  bot.action('menu_ayuda', responder);
};