const { BOT_NAME, familia } = require('../lib/config');
const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { Markup } = require('telegraf');
const { enviarMenu } = require('../lib/menu-media');

function menuPrincipal(grupo) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(grupo, 'inicio'), 'menu_inicio'), Markup.button.callback(t(grupo, 'grupo'), 'menu_grupo')],
    [Markup.button.callback(t(grupo, 'bots'), 'menu_bots'), Markup.button.callback(t(grupo, 'seguridad'), 'menu_seguridad')],
    [Markup.button.callback(t(grupo, 'ajustes'), 'menu_ajustes'), Markup.button.callback(t(grupo, 'extras'), 'menu_extras')],
    [Markup.button.callback(t(grupo, 'ia'), 'menu_ia'), Markup.button.callback(t(grupo, 'redes'), 'menu_redes')],
    [Markup.button.callback(t(grupo, 'ayuda'), 'menu_ayuda')]
  ]);
}

function textoBienvenida(grupo) {
  const lista = familia.map((f) => `• *${f.nombre}* — ${f.frase}`).join('\n');
  return `👑 *${BOT_NAME}*\n_${t(grupo, 'lema')}_ ❤️\n\n${lista}\n\n${t(grupo, 'seleccionar')}`;
}

async function enviarMenuPrincipal(ctx, grupo) {
  return enviarMenu(ctx, textoBienvenida(grupo), menuPrincipal(grupo));
}

module.exports = (bot) => {
  const responder = async (ctx) => {
    const grupo = ctx.chat?.type !== 'private' ? db.getGrupo(ctx.chat.id) : { language: 'es' };
    return enviarMenuPrincipal(ctx, grupo);
  };

  bot.start(responder);
  bot.command('menu', responder);

  bot.action('menu_inicio', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const grupo = ctx.chat?.type !== 'private' ? db.getGrupo(ctx.chat.id) : { language: 'es' };
    return enviarMenuPrincipal(ctx, grupo);
  });
};

module.exports.menuPrincipal = menuPrincipal;
