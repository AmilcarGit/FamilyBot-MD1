const { URL } = require('url');
const { Markup } = require('telegraf');
const { descargar } = require('../lib/lempi');

const pendientes = new Map();

function obtenerUrlYoutube(texto) {
  try {
    const url = new URL(texto);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') return url.href;
    if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
      if (url.pathname === '/watch' && url.searchParams.has('v')) return url.href;
      if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/live/')) return url.href;
    }
  } catch {}
  return null;
}

function botones(userId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📥 Descargar video', `ytmp4_download_${userId}`)],
    [Markup.button.callback('❌ Cancelar', `ytmp4_cancel_${userId}`)]
  ]);
}

module.exports = bot => {
  bot.command('ytmp4', async ctx => {
    const entrada = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
    const videoUrl = obtenerUrlYoutube(entrada || '');
    if (!videoUrl) return ctx.reply('❌ Usa el comando así:\n\n/ytmp4 https://youtu.be/xxxxxxxxxxx');
    pendientes.set(ctx.from.id, videoUrl);
    return ctx.reply('🎬 *YouTube MP4*\n\n🔗 Enlace recibido correctamente.\n\nPulsa el botón para iniciar la descarga.', { parse_mode: 'Markdown', ...botones(ctx.from.id) });
  });

  bot.action(/^ytmp4_download_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    await ctx.answerCbQuery('⏳ Procesando video...').catch(() => {});
    const videoUrl = pendientes.get(userId);
    if (!videoUrl) return ctx.reply('⚠️ Esta descarga expiró. Usa /ytmp4 nuevamente.');
    try {
      await ctx.editMessageText('⏳ *Descargando video...*\n\n⚡ API Lempi', { parse_mode: 'Markdown' }).catch(() => {});
      const video = await descargar(videoUrl, 'video');
      await ctx.replyWithVideo({ url: video.url }, {
        caption: `🎬 *${String(video.title).slice(0, 180)}*\n\n⚡ FamilyBot-MD`,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Descargar otra vez', `ytmp4_again_${userId}`)]])
      });
      await ctx.editMessageText('✅ Video enviado correctamente.').catch(() => {});
    } catch (error) {
      await ctx.editMessageText(`❌ No se pudo descargar el video.\n\n${error.message}`, botones(userId)).catch(() => ctx.reply(`❌ ${error.message}`));
    }
  });

  bot.action(/^ytmp4_again_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    await ctx.answerCbQuery().catch(() => {});
    if (!pendientes.has(userId)) return ctx.reply('⚠️ Usa /ytmp4 nuevamente.');
    return ctx.reply('🎬 Pulsa para descargar nuevamente:', botones(userId));
  });

  bot.action(/^ytmp4_cancel_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    pendientes.delete(userId);
    await ctx.answerCbQuery('Descarga cancelada').catch(() => {});
    return ctx.editMessageText('❌ Descarga de video cancelada.').catch(() => ctx.reply('❌ Descarga de video cancelada.'));
  });
};
