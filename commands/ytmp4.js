const { URL } = require('url');
const { Markup } = require('telegraf');

const API_URL = 'https://api.lempi.lat/dl/ytv';
const API_KEY = 'lem_dc158e5ad3f4f6ee2de2905a222bfb68f61dd754';
const TIMEOUT = 45000;
const pendientes = new Map();

function extraerUrl(data) {
  const candidatos = [data?.url, data?.download, data?.downloadUrl, data?.video, data?.videoUrl, data?.result?.url, data?.result?.download, data?.result?.downloadUrl, data?.result?.video, data?.result?.videoUrl, data?.data?.url, data?.data?.download, data?.data?.downloadUrl, data?.data?.video, data?.data?.videoUrl];
  return candidatos.find((v) => typeof v === 'string' && /^https?:\/\//i.test(v));
}

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
    api.searchParams.set('apikey', API_KEY);
    const response = await fetch(api, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`API HTTP ${response.status}`);
    const data = await response.json();
    const downloadUrl = extraerUrl(data);
    if (!downloadUrl) throw new Error(String(data?.message || data?.error || data?.result?.message || 'La API no devolvió un enlace de video.'));
    return { url: downloadUrl, title: data?.title || data?.result?.title || data?.data?.title || 'Video de YouTube' };
  } finally {
    clearTimeout(timer);
  }
}

function botones() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📥 Descargar video', 'ytmp4_download')],
    [Markup.button.callback('❌ Cancelar', 'ytmp4_cancel')]
  ]);
}

module.exports = (bot) => {
  bot.command('ytmp4', async (ctx) => {
    const entrada = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
    const videoUrl = obtenerUrlYoutube(entrada || '');
    if (!videoUrl) return ctx.reply('❌ Usa el comando así:\n\n/ytmp4 https://youtu.be/xxxxxxxxxxx');

    pendientes.set(ctx.from.id, videoUrl);
    return ctx.reply('🎬 *YouTube MP4*\n\n🔗 Enlace recibido correctamente.\n\nPulsa el botón para iniciar la descarga.', { parse_mode: 'Markdown', ...botones() });
  });

  bot.action('ytmp4_download', async (ctx) => {
    await ctx.answerCbQuery('⏳ Procesando video...').catch(() => {});
    const videoUrl = pendientes.get(ctx.from.id);
    if (!videoUrl) return ctx.editMessageText('⚠️ Esta descarga expiró. Envía nuevamente /ytmp4 <enlace>.');

    try {
      await ctx.editMessageText('⏳ *Procesando video...*\n\n🔎 Obteniendo enlace de descarga...', { parse_mode: 'Markdown' });
      const video = await obtenerVideo(videoUrl);
      await ctx.editMessageText('⬇️ *Descargando video...*\n\n🎬 ' + String(video.title).slice(0, 180), { parse_mode: 'Markdown' });
      await ctx.replyWithVideo({ url: video.url }, { caption: `🎬 *${String(video.title).slice(0, 180)}*\n\n⚡ FamilyBot-MD`, parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Descargar otra vez', 'ytmp4_again')]]) });
      pendientes.delete(ctx.from.id);
    } catch (error) {
      const mensaje = error.name === 'AbortError' ? '⏱️ La API tardó demasiado en responder.' : `❌ No se pudo descargar el video.\n\n${error.message}`;
      await ctx.editMessageText(mensaje, botones()).catch(() => ctx.reply(mensaje));
    }
  });

  bot.action('ytmp4_again', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const videoUrl = pendientes.get(ctx.from.id);
    if (!videoUrl) return ctx.reply('⚠️ Envía nuevamente /ytmp4 <enlace>.');
    await ctx.editMessageText('🎬 *YouTube MP4*\n\nPulsa el botón para descargar nuevamente.', { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📥 Descargar video', 'ytmp4_download')],[Markup.button.callback('❌ Cancelar', 'ytmp4_cancel')]]) });
  });

  bot.action('ytmp4_cancel', async (ctx) => {
    pendientes.delete(ctx.from.id);
    await ctx.answerCbQuery('Descarga cancelada').catch(() => {});
    return ctx.editMessageText('❌ Descarga cancelada.');
  });
};
