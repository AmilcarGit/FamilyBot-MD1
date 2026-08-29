const { t } = require('../lib/i18n');
const { enviarMenu } = require('../lib/menu-media');

function mostrar(ctx) {
  const grupo = ctx.chat?.type === 'private' ? {} : require('../lib/db').getGrupo(ctx.chat.id);
  const texto = `🌐 ${t(grupo, 'redesTitulo') || 'Redes'}\n\n🔗 ${t(grupo, 'redesDescripcion') || 'Encuentra nuestras redes y comunidades'}`;
  const teclado = { reply_markup: { inline_keyboard: [[{ text: `🏠 ${t(grupo, 'inicio') || 'Inicio'}`, callback_data: 'menu_inicio' }]] } };
  return enviarMenu(ctx, texto, teclado, null);
}

module.exports = (bot) => {
  bot.command('redes', mostrar);
  bot.action('menu_redes', async (ctx) => { await ctx.answerCbQuery().catch(() => {}); return mostrar(ctx); });
};
