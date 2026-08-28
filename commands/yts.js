const { Markup } = require('telegraf');

const API_URL = 'https://api.delirius.store/search/youtube';
const TIMEOUT = 20000;
const resultados = new Map();

function normalizar(data) {
  const lista = Array.isArray(data) ? data : data?.data || data?.results || data?.result || data?.videos || data?.items || [];
  return lista.map((v) => ({
    title: v.title || v.name || v.snippet?.title || 'Sin título',
    url: v.url || v.videoUrl || (v.id || v.videoId ? `https://www.youtube.com/watch?v=${v.id || v.videoId}` : null),
    thumbnail: v.thumbnail || v.thumbnailUrl || v.image || v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url,
    duration: v.duration || v.timestamp || v.length || 'Desconocida',
    channel: v.author?.name || v.channel || v.channelTitle || v.uploader || 'YouTube',
    views: v.views || v.viewCount || 0
  })).filter((v) => v.url);
}

async function buscar(query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const api = new URL(API_URL);
    api.searchParams.set('q', query);
    const response = await fetch(api, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`API HTTP ${response.status}`);
    return normalizar(await response.json()).slice(0, 5);
  } finally {
    clearTimeout(timer);
  }
}

function teclado(userId, lista) {
  return Markup.inlineKeyboard([
    ...lista.map((v, i) => [Markup.button.callback(`${i + 1} 🎵 ${v.title.slice(0, 45)}`, `yts_pick_${userId}_${i}`)]),
    [Markup.button.callback('❌ Cancelar', `yts_cancel_${userId}`)]
  ]);
}

function menuSeleccion(userId, index) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🎧 Descargar música', `yts_play_${userId}_${index}`)],
    [Markup.button.callback('⬅️ Volver a resultados', `yts_back_${userId}`)],
    [Markup.button.callback('❌ Cancelar', `yts_cancel_${userId}`)]
  ]);
}

module.exports = (bot) => {
  bot.command('yts', async (ctx) => {
    const query = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
    if (!query) return ctx.reply('🔎 Usa el comando así:\n\n/yts nombre de la canción');
    try {
      const buscando = await ctx.reply('🔎 *Buscando en YouTube...*', { parse_mode: 'Markdown' });
      const lista = await buscar(query);
      if (!lista.length) return ctx.reply('❌ No encontré resultados para esa búsqueda.');
      resultados.set(ctx.from.id, lista);
      const texto = ['🎵 *Resultados de YouTube*', '', ...lista.map((v, i) => `${i + 1}. *${v.title.slice(0, 70)}*\n   👤 ${v.channel} · ⏱️ ${v.duration}`), '', '👇 Selecciona una canción:'].join('\n');
      await ctx.telegram.editMessageText(ctx.chat.id, buscando.message_id, undefined, texto, { parse_mode: 'Markdown', ...teclado(ctx.from.id, lista) });
    } catch (error) {
      const msg = error.name === 'AbortError' ? '⏱️ La búsqueda tardó demasiado.' : `❌ Error al buscar.\n\n${error.message}`;
      return ctx.reply(msg);
    }
  });

  bot.action(/^yts_pick_(\d+)_(\d+)$/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    const index = Number(ctx.match[2]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    const lista = resultados.get(userId);
    if (!lista?.[index]) return ctx.answerCbQuery('⚠️ Los resultados expiraron.', { show_alert: true });
    const v = lista[index];
    await ctx.answerCbQuery('🎵 Canción seleccionada').catch(() => {});
    return ctx.editMessageText(`🎵 *Canción seleccionada*\n\n🎶 ${v.title}\n👤 ${v.channel}\n⏱️ ${v.duration}\n\n👇 ¿Qué deseas hacer?`, { parse_mode: 'Markdown', ...menuSeleccion(userId, index) });
  });

  bot.action(/^yts_play_(\d+)_(\d+)$/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    const index = Number(ctx.match[2]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    const v = resultados.get(userId)?.[index];
    if (!v) return ctx.answerCbQuery('⚠️ Resultado expirado.', { show_alert: true });
    await ctx.answerCbQuery('🎧 Descargando música...').catch(() => {});
    try {
      await ctx.editMessageText(`⏳ *Procesando:* ${v.title.slice(0, 100)}\n\n🎧 Obteniendo audio...`, { parse_mode: 'Markdown' });
      const api = new URL('https://api.lempi.lat/dl/yta');
      api.searchParams.set('url', v.url);
      api.searchParams.set('apikey', 'lem_dc158e5ad3f4f6ee2de2905a222bfb68f61dd754');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      let data;
      try {
        const response = await fetch(api, { headers: { Accept: 'application/json' }, signal: controller.signal });
        if (!response.ok) throw new Error(`API HTTP ${response.status}`);
        data = await response.json();
      } finally {
        clearTimeout(timer);
      }
      const candidates = [data?.url, data?.download, data?.downloadUrl, data?.audio, data?.audioUrl, data?.result?.url, data?.result?.download, data?.result?.downloadUrl, data?.result?.audio, data?.result?.audioUrl, data?.data?.url, data?.data?.download, data?.data?.downloadUrl, data?.data?.audio, data?.data?.audioUrl];
      const audioUrl = candidates.find((x) => typeof x === 'string' && /^https?:\/\//i.test(x));
      if (!audioUrl) throw new Error(String(data?.message || data?.error || data?.result?.message || 'La API no devolvió un enlace de audio.'));
      await ctx.editMessageText('⬇️ *Descargando música...*', { parse_mode: 'Markdown' });
      await ctx.replyWithAudio({ url: audioUrl }, { title: v.title.slice(0, 180), caption: `🎵 *${v.title.slice(0, 180)}*\n\n⚡ FamilyBot-MD`, parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Descargar otra vez', `yts_play_${userId}_${index}`)],[Markup.button.callback('🔎 Nueva búsqueda', 'yts_new')]]) });
    } catch (error) {
      const msg = error.name === 'AbortError' ? '⏱️ La descarga tardó demasiado.' : `❌ No se pudo descargar la música.\n\n${error.message}`;
      return ctx.editMessageText(msg, Markup.inlineKeyboard([[Markup.button.callback('⬅️ Volver a resultados', `yts_back_${userId}`)],[Markup.button.callback('❌ Cancelar', `yts_cancel_${userId}`)]]));
    }
  });

  bot.action(/^yts_back_(\d+)$/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    const lista = resultados.get(userId);
    if (!lista) return ctx.answerCbQuery('⚠️ Los resultados expiraron.', { show_alert: true });
    await ctx.answerCbQuery().catch(() => {});
    return ctx.editMessageText(['🎵 *Resultados de YouTube*', '', ...lista.map((v, i) => `${i + 1}. *${v.title.slice(0, 70)}*\n   👤 ${v.channel} · ⏱️ ${v.duration}`), '', '👇 Selecciona una canción:'].join('\n'), { parse_mode: 'Markdown', ...teclado(userId, lista) });
  });

  bot.action('yts_new', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.reply('🔎 Escribe una nueva búsqueda:\n\n/yts nombre de la canción');
  });

  bot.action(/^yts_cancel_(\d+)$/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    resultados.delete(userId);
    await ctx.answerCbQuery('Búsqueda cancelada').catch(() => {});
    return ctx.editMessageText('❌ Búsqueda cancelada.');
  });
};
