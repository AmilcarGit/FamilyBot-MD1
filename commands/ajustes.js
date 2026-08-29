const { BOT_NAME } = require('../lib/config');
const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { requireAdmin, isGroup } = require('../lib/permissions');
const { enviarMenu } = require('../lib/menu-media');

function menuAjustes(grupo) {
  return { reply_markup: { inline_keyboard: [
    [{ text: `${t(grupo, 'antilink')} ${grupo.antilink ? 'ON' : 'OFF'}`, callback_data: 'ajustes_antilink' }],
    [{ text: t(grupo, 'idioma'), callback_data: 'ajustes_idioma' }, { text: t(grupo, 'prefijo'), callback_data: 'ajustes_prefijo' }],
    [{ text: t(grupo, 'seguridad'), callback_data: 'menu_seguridad' }, { text: t(grupo, 'inicio'), callback_data: 'menu_inicio' }]
  ] } };
}

function textoAjustes(grupo) {
  return `${t(grupo, 'ajustes', { bot: BOT_NAME })}\n\n${t(grupo, 'antilink')}: ${grupo.antilink ? `✅ ${t(grupo, 'activado')}` : `❌ ${t(grupo, 'desactivado')}`}\n${t(grupo, 'idioma')}: ${grupo.language}\n${t(grupo, 'prefijo')}: ${grupo.prefix}\n\n${t(grupo, 'seleccionar')}`;
}

function menuIdioma(grupo) {
  return { reply_markup: { inline_keyboard: [
    [{ text: t(grupo, 'espanol'), callback_data: 'ajustes_idioma_es' }, { text: t(grupo, 'ingles'), callback_data: 'ajustes_idioma_en' }],
    [{ text: t(grupo, 'inicio'), callback_data: 'menu_ajustes' }]
  ] } };
}

function menuPrefijo(grupo) {
  return { reply_markup: { inline_keyboard: [[{ text: t(grupo, 'inicio'), callback_data: 'menu_ajustes' }]] } };
}

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery().catch(() => {});
    if (!isGroup(ctx)) return ctx.reply('ℹ️ Los ajustes de grupo solo están disponibles en grupos.');
    const grupo = db.getGrupo(ctx.chat.id);
    return enviarMenu(ctx, textoAjustes(grupo), menuAjustes(grupo), null);
  };

  bot.command('ajustes', responder);
  bot.action('menu_ajustes', responder);

  bot.action('ajustes_antilink', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    if (!(await requireAdmin(ctx))) return;
    const grupo = db.getGrupo(ctx.chat.id);
    const actualizado = db.setGrupo(ctx.chat.id, { antilink: !grupo.antilink });
    return enviarMenu(ctx, textoAjustes(actualizado), menuAjustes(actualizado), null);
  });

  bot.action('ajustes_idioma', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    if (!(await requireAdmin(ctx))) return;
    const grupo = db.getGrupo(ctx.chat.id);
    return enviarMenu(ctx, `${t(grupo, 'idiomaGrupo')}\n\n${t(grupo, 'idiomaActual', { language: grupo.language })}\n\n${t(grupo, 'seleccionarIdioma')}`, menuIdioma(grupo), null);
  });

  for (const idioma of ['es', 'en']) {
    bot.action(`ajustes_idioma_${idioma}`, async (ctx) => {
      await ctx.answerCbQuery().catch(() => {});
      if (!(await requireAdmin(ctx))) return;
      db.setGrupo(ctx.chat.id, { language: idioma });
      return responder(ctx);
    });
  }

  bot.action('ajustes_prefijo', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    if (!(await requireAdmin(ctx))) return;
    const grupo = db.getGrupo(ctx.chat.id);
    return enviarMenu(ctx, `${t(grupo, 'prefijoTitulo')}\n\n${t(grupo, 'prefijoActual', { prefix: grupo.prefix })}\n\n${t(grupo, 'prefijoAyuda')}`, menuPrefijo(grupo), null);
  });

  bot.command('idioma', async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const grupo = db.getGrupo(ctx.chat.id);
    const idioma = ctx.message.text.trim().split(/\s+/)[1]?.toLowerCase();
    if (!['es', 'en'].includes(idioma)) return ctx.reply(t(grupo, 'usoIdioma'));
    const actualizado = db.setGrupo(ctx.chat.id, { language: idioma });
    return ctx.reply(t(actualizado, 'idiomaActualizado', { language: idioma }));
  });

  bot.command('prefijo', async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const grupo = db.getGrupo(ctx.chat.id);
    const prefijo = ctx.message.text.trim().split(/\s+/)[1];
    if (!prefijo || prefijo.length > 2 || !/^[!./#?$]+$/.test(prefijo)) return ctx.reply(t(grupo, 'usoPrefijo'));
    db.setGrupo(ctx.chat.id, { prefix: prefijo });
    return ctx.reply(t(grupo, 'prefijoGuardado', { prefix: prefijo }));
  });
};
