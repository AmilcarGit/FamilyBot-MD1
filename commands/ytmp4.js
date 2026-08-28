const { URL } = require('url');
const { LEMPI_API_KEY } = require('../lib/config');

const API_URL = 'https://api.lempi.lat/dl/ytv';
const TIMEOUT = 45000;

function extraerUrl(data) {
  const candidatos = [
    data?.url,
    data?.download,
    data?.downloadUrl,
    data?.video,
    data?.videoUrl,
    data?.result?.url,
    data?.result?.download,
    data?.result?.downloadUrl,
    data?.result?.video,
    data?.result?.videoUrl,
    data?.data?.url,
    data?.data?.download,
    data?.data?.downloadUrl,
    data?.data?.video,
    data?.data?.videoUrl
  ];

  return candidatos.find((value) => typeof value === 'string' && /^https?:\/\//i.test(value));
}

function obtenerUrlYoutube(texto) {
  try {
    const url = new URL(texto);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') return url.href;
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (url.pathname === '/watch' && url.searchParams.has('v')) return url.href;
      if (url.pathname.startsWith('/shorts/')) return url.href;
      if (url.pathname.startsWith('/live/')) return url.href;
    }
  } catch {}
  return null;
}

module.exports = (bot) => {
  bot.command('ytmp4', async (ctx) => {
    const entrada = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
    const videoUrl = obtenerUrlYoutube(entrada || '');

    if (!videoUrl) {
      return ctx.reply('❌ Usa el comando así:\n\n/ytmp4 https://youtu.be/xxxxxxxxxxx');
    }

    if (!LEMPI_API_KEY) {
      return ctx.reply('❌ El comando YTMP4 no está configurado. Falta LEMPI_API_KEY en el archivo .env.');
    }

    const mensaje = await ctx.reply('⏳ *Procesando video...*\n\n🔎 Buscando el enlace de descarga...', { parse_mode: 'Markdown' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const api = new URL(API_URL);
      api.searchParams.set('url', videoUrl);
      api.searchParams.set('apikey', LEMPI_API_KEY);

      const response = await fetch(api, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) throw new Error(`API HTTP ${response.status}`);

      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const texto = await response.text();
        try {
          data = JSON.parse(texto);
        } catch {
          throw new Error('La API no devolvió un JSON válido.');
        }
      }

      const downloadUrl = extraerUrl(data);
      if (!downloadUrl) {
        const detalle = data?.message || data?.error || data?.result?.message || 'La API no devolvió un enlace de video.';
        throw new Error(String(detalle));
      }

      const titulo = data?.title || data?.result?.title || data?.data?.title || 'FamilyBot-MD';
      await ctx.telegram.editMessageText(ctx.chat.id, mensaje.message_id, undefined, `⬇️ *Descargando...*\n\n🎬 ${String(titulo).slice(0, 180)}`, { parse_mode: 'Markdown' }).catch(() => {});

      await ctx.replyWithVideo({ url: downloadUrl }, {
        caption: `🎬 *${String(titulo).slice(0, 180)}*\n\n⚡ Descargado con FamilyBot-MD`,
        parse_mode: 'Markdown'
      });

      await ctx.telegram.deleteMessage(ctx.chat.id, mensaje.message_id).catch(() => {});
    } catch (error) {
      const texto = error.name === 'AbortError'
        ? '⏱️ La API tardó demasiado en responder.'
        : `❌ No se pudo descargar el video.\n\n${error.message}`;
      await ctx.telegram.editMessageText(ctx.chat.id, mensaje.message_id, undefined, texto).catch(() => ctx.reply(texto));
    } finally {
      clearTimeout(timer);
    }
  });
};
