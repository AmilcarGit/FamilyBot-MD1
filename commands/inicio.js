const { Markup } = require('telegraf');
const { BOT_NAME, familia } = require('../lib/config');

function menuPrincipal() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🏠 Inicio', 'menu_inicio'), Markup.button.callback('👨‍👩‍👧 Grupo', 'menu_grupo')],
    [Markup.button.callback('🤖 Bots', 'menu_bots'), Markup.button.callback('🛡️ Seguridad', 'menu_seguridad')],
    [Markup.button.callback('⚙️ Ajustes', 'menu_ajustes'), Markup.button.callback('🎁 Extras', 'menu_extras')],
    [Markup.button.callback('⭐ Redes', 'menu_redes'), Markup.button.callback('❓ Ayuda', 'menu_ayuda')]
  ]);
}

function textoBienvenida() {
  const lista = familia.map(f => `• *${f.nombre}* — ${f.frase}`).join('\n');
  return (
    `👑 *${BOT_NAME}*\n` +
    `_Una Familia · Un Bot · Sin Límites_ ❤️\n\n` +
    `${lista}\n\n` +
    `Selecciona una opción del menú:`
  );
}

module.exports = (bot) => {
  bot.start((ctx) => {
    ctx.replyWithMarkdown(textoBienvenida(), menuPrincipal());
  });

  bot.command('menu', (ctx) => {
    ctx.replyWithMarkdown(textoBienvenida(), menuPrincipal());
  });

  bot.action('menu_inicio', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText(textoBienvenida(), { parse_mode: 'Markdown', ...menuPrincipal() });
  });
};

module.exports.menuPrincipal = menuPrincipal;
