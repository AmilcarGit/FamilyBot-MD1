const { BOT_NAME } = require('../lib/config');

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery();
    ctx.replyWithMarkdown(
      `⚙️ *Ajustes de ${BOT_NAME}*\n\n` +
      `• /idioma — Cambiar idioma\n` +
      `• /prefijo — Cambiar prefijo de comandos\n` +
      `• /antilink on|off — Moderación de links\n\n` +
      `_Más ajustes próximamente._`
    );
  };

  bot.command('ajustes', responder);
  bot.action('menu_ajustes', responder);
};
