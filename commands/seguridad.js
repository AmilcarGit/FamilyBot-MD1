const db = require('../lib/db');
const { isGroup, isAdmin, isBotAdmin, requireAdmin, requireBotAdmin } = require('../lib/permissions');
const { enviarMenu } = require('../lib/menu-media');

function tieneEnlace(ctx) {
  const texto = ctx.message?.text || '';
  const entidades = ctx.message?.entities || [];
  const tieneEntidad = entidades.some((entity) => ['url', 'text_link'].includes(entity.type));
  return tieneEntidad || /(https?:\/\/|t\.me\/|telegram\.me\/|www\.)/i.test(texto);
}

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery().catch(() => {});
    if (!isGroup(ctx)) return ctx.reply('ℹ️ El panel de seguridad solo está disponible en grupos.');
    const grupo = db.getGrupo(ctx.chat.id);
    const botAdmin = await isBotAdmin(ctx);
    const texto = `🛡️ *Panel de Seguridad*\n\nAntilink: ${grupo.antilink ? '✅ Activado' : '❌ Desactivado'}\nPermisos del bot: ${botAdmin ? '✅ Administrador' : '❌ No soy administrador'}\n\nUsa /antilink on|off para cambiarlo.`;
    return enviarMenu(ctx, texto, {}, 'Markdown');
  };

  bot.command('seguridad', responder);
  bot.action('menu_seguridad', responder);

  bot.command('antilink', async (ctx) => {
    if (!isGroup(ctx)) return ctx.reply('ℹ️ Este comando solo está disponible en grupos.');
    const args = (ctx.message.text.split(/\s+/)[1] || '').toLowerCase();
    if (!['on', 'off'].includes(args)) return ctx.reply('Uso: /antilink on|off');
    if (!(await requireAdmin(ctx))) return;
    if (!(await requireBotAdmin(ctx))) return;
    db.setGrupo(ctx.chat.id, { antilink: args === 'on' });
    return ctx.reply(`🛡️ Antilink ${args === 'on' ? 'activado ✅' : 'desactivado ❌'}`);
  });

  bot.on('text', async (ctx, next) => {
    if (!isGroup(ctx) || !tieneEnlace(ctx)) return next();
    const grupo = db.getGrupo(ctx.chat.id);
    if (!grupo.antilink || await isAdmin(ctx) || !(await isBotAdmin(ctx))) return next();
    try {
      await ctx.deleteMessage();
      await ctx.reply(`🚫 @${ctx.from.username || ctx.from.first_name}, los links no están permitidos aquí.`);
    } catch (error) {
      console.error('⚠️ No se pudo aplicar el antilink:', error.message);
    }
  });
};
