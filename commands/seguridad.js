const { OWNER_ID } = require('../lib/config');
const db = require('../lib/db');

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery();
    const chatId = ctx.chat.id;
    const grupo = db.getGrupo(chatId);
    ctx.replyWithMarkdown(
      `🛡️ *Panel de Seguridad*\n\n` +
      `Antilink: ${grupo.antilink ? '✅ Activado' : '❌ Desactivado'}\n\n` +
      `Usa /antilink on|off para cambiarlo (solo admins).`
    );
  };

  bot.command('seguridad', responder);
  bot.action('menu_seguridad', responder);

  bot.command('antilink', async (ctx) => {
    const args = ctx.message.text.split(' ')[1];
    if (!['on', 'off'].includes(args)) {
      return ctx.reply('Uso: /antilink on|off');
    }
    try {
      const member = await ctx.getChatMember(ctx.from.id);
      if (!['administrator', 'creator'].includes(member.status) && String(ctx.from.id) !== OWNER_ID) {
        return ctx.reply('⚠️ Solo administradores pueden usar este comando.');
      }
    } catch (e) {
      // en chat privado no aplica
    }
    db.setGrupo(ctx.chat.id, { antilink: args === 'on' });
    ctx.reply(`🛡️ Antilink ${args === 'on' ? 'activado ✅' : 'desactivado ❌'} (esto se recuerda aunque reinicies el bot)`);
  });

  bot.on('text', (ctx, next) => {
    const chatId = ctx.chat.id;
    const grupo = db.getGrupo(chatId);
    const esGrupo = ctx.chat.type !== 'private';
    const tieneLink = /(https?:\/\/|t\.me\/|www\.)/i.test(ctx.message.text);
    if (esGrupo && grupo.antilink && tieneLink) {
      ctx.deleteMessage().catch(() => {});
      ctx.reply(`🚫 @${ctx.from.username || ctx.from.first_name}, los links no están permitidos aquí.`);
      return;
    }
    return next();
  });
};