const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { requireAdmin, isGroup } = require('../lib/permissions');

function menu(grupo) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: t(grupo, 'grupo'), callback_data: 'menu_grupo' }, { text: t(grupo, 'ajustes'), callback_data: 'menu_ajustes' }],
        [{ text: t(grupo, 'inicio'), callback_data: 'menu_inicio' }]
      ]
    }
  };
}

function textoReglas(grupo, chatTitle) {
  const reglas = grupo.rules || t(grupo, 'reglasVacias');
  return `📜 ${chatTitle}\n\n${t(grupo, 'reglasTitulo')}\n\n${reglas}`;
}

module.exports = (bot) => {
  const mostrar = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery().catch(() => {});

    if (!isGroup(ctx)) return ctx.reply(t({}, 'soloGrupoReglas'));

    const grupo = db.getGrupo(ctx.chat.id);
    const texto = textoReglas(grupo, ctx.chat.title || 'Grupo');

    if (ctx.updateType === 'callback_query') return ctx.editMessageText(texto, menu(grupo));
    return ctx.reply(texto, menu(grupo));
  };

  bot.command('reglas', mostrar);
  bot.action('menu_reglas', mostrar);

  bot.command('setreglas', async (ctx) => {
    if (!isGroup(ctx)) return ctx.reply(t({}, 'soloGrupoReglas'));
    if (!(await requireAdmin(ctx))) return;

    const grupo = db.getGrupo(ctx.chat.id);
    const texto = ctx.message.text.replace(/^\/setreglas(?:@\w+)?\s*/i, '').trim();

    if (!texto) return ctx.reply(t(grupo, 'reglasUso'));
    if (texto.length > 4000) return ctx.reply(t(grupo, 'reglasLargo'));

    const actualizado = db.setGrupo(ctx.chat.id, { rules: texto });
    return ctx.reply(t(actualizado, 'reglasGuardadas'));
  });

  bot.command('delreglas', async (ctx) => {
    if (!isGroup(ctx)) return ctx.reply(t({}, 'soloGrupoReglas'));
    if (!(await requireAdmin(ctx))) return;

    const grupo = db.getGrupo(ctx.chat.id);
    db.setGrupo(ctx.chat.id, { rules: '' });
    return ctx.reply(t(grupo, 'reglasEliminadas'));
  });
};
