const { URL } = require('url');
const { Markup } = require('telegraf');

const API_URL = 'https://api.delirius.store/download/ytmp4';
const TIMEOUT = 45000;
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

async function obtenerVideo(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const api = new URL(API_URL);
    api.searchParams.set('url', url);
    api.searchParams.set('format', '360');
    const response = await fetch(api, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`Delirius HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.status || !data?.data?.download) throw new Error(data?.message || 'Delirius no devolvió el video.');
    return { url: data.data.download, title: data.data.title || 'Video de YouTube', image: data.data.image || null };
  } finally {
    clearTimeout(timer);
  }
}

function botones(userId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📥 Descargar video', `ytmp4_download_${userId}`)],
    [Markup.button.callback('❌ Cancelar', `ytmp4_cancel_${userId}`)]
  ]);
}

module.exports = (bot) => {
  bot.command('ytmp4', async (ctx) => {
    const entrada = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
    const videoUrl = obtenerUrlYoutube(entrada || '');
    if (!videoUrl) return ctx.reply('❌ Usa el comando así:\n\n/ytmp4 https://youtu.be/xxxxxxxxxxx');
    pendientes.set(ctx.from.id, videoUrl);
    return ctx.reply('🎬 *YouTube MP4*\n\n🔗 Enlace recibido correctamente.\n\nPulsa el botón para iniciar la descarga.', { parse_mode: 'Markdown', ...botones(ctx.from.id) });
  });

  bot.action(/^ytmp4_download_(\d+)$/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    await ctx.answerCbQuery('⏳ Procesando video...').catch(() => {});
    const videoUrl = pendientes.get(userId);
    if (!videoUrl) return ctx.editMessageText('⚠️ Esta descarga expiró. Envía nuevamente /ytmp4 <enlace>.');
    try {
      await ctx.editMessageText('⏳ *Procesando video...*\n\n🔎 Delirius está preparando el MP4...', { parse_mode: 'Markdown' });
      const video = await obtenerVideo(videoUrl);
      await ctx.editMessageText('⬇️ *Enviando video...*\n\n🎬 ' + String(video.title).slice(0, 180), { parse_mode: 'Markdown' });
      await ctx.replyWithVideo({ url: video.url }, { caption: `🎬 *${String(video.title).slice(0, 180)}*\n\n⚡ FamilyBot-MD`, parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Descargar otra vez', `ytmp4_again_${userId}`)]]) });
      pendientes.delete(userId);
    } catch (error) {
      const mensaje = error.name === 'AbortError' ? '⏱️ Delirius tardó demasiado en responder.' : `❌ No se pudo descargar el video.\n\n${error.message}`;
      await ctx.editMessageText(mensaje, botones(userId)).catch(() => ctx.reply(mensaje));
    }
  });

  bot.action(/^ytmp4_again_(\d+)$/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    await ctx.answerCbQuery().catch(() => {});
    const videoUrl = pendientes.get(userId);
    if (!videoUrl) return ctx.reply('⚠️ Envía nuevamente /ytmp4 <enlace>.');
    return ctx.editMessageText('🎬 *YouTube MP4*\n\nPulsa el botón para descargar nuevamente.', { parse_mode: 'Markdown', ...botones(userId) });
  });

  bot.action(/^ytmp4_cancel_(\d+)$/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    pendientes.delete(userId);
    await ctx.answerCbQuery('Descarga cancelada').catch(() => {});
    return ctx.editMessageText('❌ Descarga de video cancelada.');
  });
};
