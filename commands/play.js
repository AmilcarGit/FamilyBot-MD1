const { URL } = require('url');
const { Markup } = require('telegraf');

const API_URL = 'https://api.delirius.store/download/ytmp3';
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

async function editar(ctx, texto, opciones = {}) {
  const msg = ctx.callbackQuery?.message;
  try {
    if (msg?.text === texto) return;
    if (msg?.text != null) return await ctx.editMessageText(texto, opciones);
    if (msg?.caption != null) return await ctx.editMessageCaption(texto, opciones);
    return await ctx.reply(texto, opciones);
  } catch (e) {
    if (e?.response?.error_code === 400 && /not modified|there is no text|message is not modified/i.test(e?.response?.description || '')) return;
    throw e;
  }
}

async function obtenerAudio(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const api = new URL(API_URL);
    api.searchParams.set('url', url);
    const response = await fetch(api, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`Delirius HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.status || !data?.data?.download) throw new Error(data?.message || 'Delirius no devolvió el audio.');
    return { url: data.data.download, title: data.data.title || 'Audio de YouTube' };
  } finally { clearTimeout(timer); }
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
    const videoUrl = obtenerUrlYoutube(entrada || '');
    if (!videoUrl) return ctx.reply('❌ Usa el comando así:\n\n/play https://youtu.be/xxxxxxxxxxx');
    pendientes.set(ctx.from.id, videoUrl);
    return ctx.reply('🎵 *YouTube Música*\n\n🔗 Enlace recibido correctamente.\n\nPulsa el botón para descargar el audio.', { parse_mode: 'Markdown', ...botones(ctx.from.id) });
  });

  bot.action(/^play_download_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    await ctx.answerCbQuery('⏳ Procesando audio...').catch(() => {});
    const videoUrl = pendientes.get(userId);
    if (!videoUrl) return editar(ctx, '⚠️ Esta descarga expiró. Envía nuevamente /play <enlace>.');
    try {
      await editar(ctx, '⏳ *Procesando música...*\n\n🔎 Delirius está preparando el audio...', { parse_mode: 'Markdown' });
      const audio = await obtenerAudio(videoUrl);
      await editar(ctx, '⬇️ *Enviando música...*\n\n🎵 ' + String(audio.title).slice(0, 180), { parse_mode: 'Markdown' });
      await ctx.replyWithAudio({ url: audio.url }, { title: String(audio.title).slice(0, 180), caption: `🎵 *${String(audio.title).slice(0, 180)}*\n\n⚡ FamilyBot-MD`, parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Descargar otra vez', `play_again_${userId}`)]]) });
      pendientes.delete(userId);
    } catch (error) {
      const mensaje = error.name === 'AbortError' ? '⏱️ Delirius tardó demasiado en responder.' : `❌ No se pudo descargar la música.\n\n${error.message}`;
      try { await editar(ctx, mensaje, botones(userId)); } catch { await ctx.reply(mensaje).catch(() => {}); }
    }
  });

  bot.action(/^play_again_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    await ctx.answerCbQuery().catch(() => {});
    const videoUrl = pendientes.get(userId);
    if (!videoUrl) return ctx.reply('⚠️ Envía nuevamente /play <enlace>.');
    return ctx.reply('🎵 *YouTube Música*\n\nPulsa el botón para descargar nuevamente.', { parse_mode: 'Markdown', ...botones(userId) });
  });

  bot.action(/^play_cancel_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta descarga pertenece a otro usuario.', { show_alert: true });
    pendientes.delete(userId);
    await ctx.answerCbQuery('Descarga cancelada').catch(() => {});
    return editar(ctx, '❌ Descarga de música cancelada.');
  });
};