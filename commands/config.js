const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { requireAdmin, isGroup } = require('../lib/permissions');
const { enviarMenu } = require('../lib/menu-media');

function teclado(grupo) {
  return { reply_markup: { inline_keyboard: [
    [{ text: `👋 ${t(grupo, 'bienvenida')}`, callback_data: 'config_bienvenida' }, { text: '👋 ' + t(grupo, 'despedidaTitulo').replace('👋 ', ''), callback_data: 'config_despedida' }],
    [{ text: '📜 ' + t(grupo, 'reglasTitulo').replace('📜 ', ''), callback_data: 'config_reglas' }, { text: `🛡️ ${t(grupo, 'antilink').replace('🛡️ ', '')}`, callback_data: 'config_antilink' }],
    [{ text: `🌐 ${t(grupo, 'idioma')}`, callback_data: 'config_idioma' }, { text: `🔤 ${t(grupo, 'prefijo')}`, callback_data: 'config_prefijo' }],
    [{ text: `👥 ${t(grupo, 'grupo')}`, callback_data: 'menu_grupo' }, { text: `🏠 ${t(grupo, 'inicio')}`, callback_data: 'menu_inicio' }]
  ] } };
}

function estado(grupo) {
  const bienvenida = grupo.welcomeEnabled ? t(grupo, 'activado') : t(grupo, 'desactivado');
  const despedida = grupo.goodbyeEnabled ? t(grupo, 'activado') : t(grupo, 'desactivado');
  const antilink = grupo.antilink ? t(grupo, 'activado') : t(grupo, 'desactivado');
  const reglas = grupo.rules ? t(grupo, 'activado') : t(grupo, 'desactivado');
  return `⚙️ ${t(grupo, 'configTitulo')}\n\n👋 ${t(grupo, 'bienvenida')}: ${bienvenida}\n👋 ${t(grupo, 'despedidaTitulo').replace('👋 ', '')}: ${despedida}\n📜 ${t(grupo, 'reglasTitulo').replace('📜 ', '')}: ${reglas}\n🛡️ ${t(grupo, 'antilink').replace('🛡️ ', '')}: ${antilink}\n🌐 ${t(grupo, 'idioma')}: ${grupo.language === 'en' ? 'English' : 'Español'}\n🔤 ${t(grupo, 'prefijo')}: ${grupo.prefix || '/'}`;
}

async function mostrar(ctx) {
  if (!isGroup(ctx)) return ctx.reply(t({}, 'soloGrupoConfig'));
  const grupo = db.getGrupo(ctx.chat.id);
  return enviarMenu(ctx, estado(grupo), teclado(grupo), null);
}

module.exports = (bot) => {
  bot.command('config', mostrar);
  bot.action('menu_config', async (ctx) => { await ctx.answerCbQuery().catch(() => {}); return mostrar(ctx); });
  bot.action('config_bienvenida', async (ctx) => { await ctx.answerCbQuery().catch(() => {}); if (!(await requireAdmin(ctx))) return; const grupo = db.getGrupo(ctx.chat.id); db.setGrupo(ctx.chat.id, { welcomeEnabled: !grupo.welcomeEnabled }); return mostrar(ctx); });
  bot.action('config_despedida', async (ctx) => { await ctx.answerCbQuery().catch(() => {}); if (!(await requireAdmin(ctx))) return; const grupo = db.getGrupo(ctx.chat.id); db.setGrupo(ctx.chat.id, { goodbyeEnabled: !grupo.goodbyeEnabled }); return mostrar(ctx); });
  bot.action('config_antilink', async (ctx) => { await ctx.answerCbQuery().catch(() => {}); if (!(await requireAdmin(ctx))) return; const grupo = db.getGrupo(ctx.chat.id); db.setGrupo(ctx.chat.id, { antilink: !grupo.antilink }); return mostrar(ctx); });
  bot.action('config_reglas', async (ctx) => { await ctx.answerCbQuery().catch(() => {}); const grupo = db.getGrupo(ctx.chat.id); return enviarMenu(ctx, `📜 ${t(grupo, 'reglasTitulo')}\n\n${grupo.rules || t(grupo, 'reglasVacias')}`, { reply_markup: { inline_keyboard: [[{ text: `⚙️ ${t(grupo, 'configTitulo')}`, callback_data: 'menu_config' }]] } }, null); });
  bot.action('config_idioma', async (ctx) => { await ctx.answerCbQuery().catch(() => {}); if (!(await requireAdmin(ctx))) return; const grupo = db.getGrupo(ctx.chat.id); return enviarMenu(ctx, `${t(grupo, 'seleccionarIdioma')}\n\n${t(grupo, 'idiomaActual', { language: grupo.language === 'en' ? 'English' : 'Español' })}`, { reply_markup: { inline_keyboard: [[{ text: t(grupo, 'espanol'), callback_data: 'config_lang_es' }, { text: t(grupo, 'ingles'), callback_data: 'config_lang_en' }], [{ text: `⚙️ ${t(grupo, 'configTitulo')}`, callback_data: 'menu_config' }]] } }, null); });
  bot.action(/^config_lang_(es|en)$/, async (ctx) => { await ctx.answerCbQuery().catch(() => {}); if (!(await requireAdmin(ctx))) return; db.setGrupo(ctx.chat.id, { language: ctx.match[1] }); return mostrar(ctx); });
  bot.action('config_prefijo', async (ctx) => { await ctx.answerCbQuery().catch(() => {}); const grupo = db.getGrupo(ctx.chat.id); return enviarMenu(ctx, `${t(grupo, 'prefijoTitulo')}\n\n${t(grupo, 'prefijoActual', { prefix: grupo.prefix || '/' })}\n\n${t(grupo, 'prefijoAyuda')}`, { reply_markup: { inline_keyboard: [[{ text: `⚙️ ${t(grupo, 'configTitulo')}`, callback_data: 'menu_config' }]] } }, null); });

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
