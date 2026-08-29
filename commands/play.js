const { URL } = require('url');
const { Markup } = require('telegraf');
const yts = require('yt-search');
const { descargar } = require('../lib/lempi');

const pendientes = new Map();

function youtubeUrl(texto) {
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
    [Markup.button.callback('🎵 Descargar música', `play_download_${userId}`)],
    [Markup.button.callback('❌ Cancelar', `play_cancel_${userId}`)]
  ]);
}

module.exports = bot => {
  bot.command('play', async ctx => {
    const entrada = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
    if (!entrada) return ctx.reply('🎵 Usa /play con un enlace o nombre de canción.');
    try {
      let videoUrl = youtubeUrl(entrada);
      let title = entrada;
      if (!videoUrl) {
        const result = await yts(entrada);
        const video = result.videos?.[0];
        if (!video) return ctx.reply('❌ No encontré esa canción en YouTube.');
        videoUrl = video.url;
        title = video.title;
      }
      pendientes.set(ctx.from.id, videoUrl);
      return ctx.reply(`🎵 *${String(title).slice(0, 180)}*\n\n🔗 Listo para descargar el audio.\n\nPulsa el botón:`, { parse_mode: 'Markdown', ...botones(ctx.from.id) });
    } catch (error) {
      return ctx.reply(`❌ No se pudo buscar la canción.\n\n${error.message}`);
    }
  });

  bot.action(/^play_download_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    await ctx.answerCbQuery('⏳ Procesando audio...').catch(() => {});
    const videoUrl = pendientes.get(userId);
    if (!videoUrl) return ctx.reply('⚠️ Esta descarga expiró. Usa /play nuevamente.');
    try {
      await ctx.editMessageText('⏳ *Descargando música...*\n\n⚡ API Lempi', { parse_mode: 'Markdown' }).catch(() => {});
      const audio = await descargar(videoUrl, 'audio');
      await ctx.replyWithAudio({ url: audio.url }, {
        title: String(audio.title).slice(0, 180),
        caption: `🎵 *${String(audio.title).slice(0, 180)}*\n\n⚡ FamilyBot-MD`,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Descargar otra vez', `play_again_${userId}`)]])
      });
      await ctx.editMessageText('✅ Música enviada correctamente.').catch(() => {});
    } catch (error) {
      await ctx.editMessageText(`❌ No se pudo descargar la música.\n\n${error.message}`, botones(userId)).catch(() => ctx.reply(`❌ ${error.message}`));
    }
  });

  bot.action(/^play_again_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    await ctx.answerCbQuery().catch(() => {});
    if (!pendientes.has(userId)) return ctx.reply('⚠️ Usa /play nuevamente.');
    return ctx.reply('🎵 Pulsa para descargar nuevamente:', botones(userId));
  });

  bot.action(/^play_cancel_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    pendientes.delete(userId);
    await ctx.answerCbQuery('Descarga cancelada').catch(() => {});
    return ctx.editMessageText('❌ Descarga cancelada.').catch(() => ctx.reply('❌ Descarga cancelada.'));
  });
};
