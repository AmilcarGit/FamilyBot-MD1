const { Markup } = require('telegraf');

const SEARCH_API = 'https://api.delirius.store/search/youtube';
const LEMPI_AUDIO = 'https://api.lempi.lat/dl/yta';
const LEMPI_VIDEO = 'https://api.lempi.lat/dl/ytv';
const LEMPI_KEY = 'lem_dc158e5ad3f4f6ee2de2905a222bfb68f61dd754';
const TIMEOUT = 45000;
const resultados = new Map();

function normalizar(data) {
  const lista = Array.isArray(data) ? data : data?.data || data?.results || data?.result || data?.videos || data?.items || [];
  return lista.map((v) => ({
    title: v.title || v.name || v.snippet?.title || 'Sin título',
    url: v.url || v.videoUrl || (v.id || v.videoId ? `https://www.youtube.com/watch?v=${v.id || v.videoId}` : null),
    duration: v.duration || v.timestamp || v.length || 'Desconocida',
    channel: v.author?.name || v.channel || v.channelTitle || v.uploader || 'YouTube'
  })).filter((v) => v.url);
}

async function peticion(api) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(api, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`API HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function buscar(query) {
  const api = new URL(SEARCH_API);
  api.searchParams.set('q', query);
  return normalizar(await peticion(api)).slice(0, 5);
}

function teclado(userId, lista) {
  return Markup.inlineKeyboard([
    ...lista.map((v, i) => [Markup.button.callback(`${i + 1} 🎵 ${v.title.slice(0, 45)}`, `yts_pick_${userId}_${i}`)]),
    [Markup.button.callback('❌ Cancelar', `yts_cancel_${userId}`)]
  ]);
}

function menuSeleccion(userId, index) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🎧 Descargar música', `yts_audio_${userId}_${index}`)],
    [Markup.button.callback('🎬 Descargar video', `yts_video_${userId}_${index}`)],
    [Markup.button.callback('⬅️ Volver a resultados', `yts_back_${userId}`)],
    [Markup.button.callback('❌ Cancelar', `yts_cancel_${userId}`)]
  ]);
}

function extraerUrl(data, tipo) {
  const claves = tipo === 'audio' ? ['url', 'download', 'downloadUrl', 'audio', 'audioUrl'] : ['url', 'download', 'downloadUrl', 'video', 'videoUrl'];
  for (const obj of [data, data?.result, data?.data]) {
    if (!obj) continue;
    for (const clave of claves) if (typeof obj[clave] === 'string' && /^https?:\/\//i.test(obj[clave])) return obj[clave];
  }
  return null;
}

async function descargar(ctx, userId, index, tipo) {
  if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
  const v = resultados.get(userId)?.[index];
  if (!v) return ctx.answerCbQuery('⚠️ Resultado expirado.', { show_alert: true });
  await ctx.answerCbQuery(tipo === 'audio' ? '🎧 Procesando música...' : '🎬 Procesando video...').catch(() => {});
  try {
    await ctx.editMessageText(`⏳ *Procesando ${tipo === 'audio' ? 'música' : 'video'}...*\n\n🎵 ${v.title.slice(0, 150)}`, { parse_mode: 'Markdown' });
    const api = new URL(tipo === 'audio' ? LEMPI_AUDIO : LEMPI_VIDEO);
    api.searchParams.set('url', v.url);
    api.searchParams.set('apikey', LEMPI_KEY);
    const data = await peticion(api);
    const downloadUrl = extraerUrl(data, tipo);
    if (!downloadUrl) throw new Error(String(data?.message || data?.error || data?.result?.message || `La API no devolvió un enlace de ${tipo}.`));
    await ctx.editMessageText(tipo === 'audio' ? '⬇️ *Descargando música...*' : '⬇️ *Descargando video...*', { parse_mode: 'Markdown' });
    if (tipo === 'audio') {
      await ctx.replyWithAudio({ url: downloadUrl }, { title: v.title.slice(0, 180), caption: `🎵 *${v.title.slice(0, 180)}*\n\n⚡ FamilyBot-MD`, parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Música otra vez', `yts_audio_${userId}_${index}`)],[Markup.button.callback('🎬 Descargar video', `yts_video_${userId}_${index}`)],[Markup.button.callback('🔎 Nueva búsqueda', 'yts_new')]]) });
    } else {
      await ctx.replyWithVideo({ url: downloadUrl }, { caption: `🎬 *${v.title.slice(0, 180)}*\n\n⚡ FamilyBot-MD`, parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Video otra vez', `yts_video_${userId}_${index}`)],[Markup.button.callback('🎧 Descargar música', `yts_audio_${userId}_${index}`)],[Markup.button.callback('🔎 Nueva búsqueda', 'yts_new')]]) });
    }
  } catch (error) {
    const msg = error.name === 'AbortError' ? '⏱️ La descarga tardó demasiado.' : `❌ No se pudo descargar.\n\n${error.message}`;
    return ctx.editMessageText(msg, Markup.inlineKeyboard([[Markup.button.callback('⬅️ Volver a resultados', `yts_back_${userId}`)],[Markup.button.callback('❌ Cancelar', `yts_cancel_${userId}`)]]));
  }
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
      return ctx.reply(error.name === 'AbortError' ? '⏱️ La búsqueda tardó demasiado.' : `❌ Error al buscar.\n\n${error.message}`);
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
    return ctx.editMessageText(`🎵 *Canción seleccionada*\n\n🎶 ${v.title}\n👤 ${v.channel}\n⏱️ ${v.duration}\n\n👇 Elige el formato:`, { parse_mode: 'Markdown', ...menuSeleccion(userId, index) });
  });

  bot.action(/^yts_audio_(\d+)_(\d+)$/, (ctx) => descargar(ctx, Number(ctx.match[1]), Number(ctx.match[2]), 'audio'));
  bot.action(/^yts_video_(\d+)_(\d+)$/, (ctx) => descargar(ctx, Number(ctx.match[1]), Number(ctx.match[2]), 'video'));

  bot.action(/^yts_back_(\d+)$/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    const lista = resultados.get(userId);
    if (!lista) return ctx.answerCbQuery('⚠️ Los resultados expiraron.', { show_alert: true });
    await ctx.answerCbQuery().catch(() => {});
    const texto = ['🎵 *Resultados de YouTube*', '', ...lista.map((v, i) => `${i + 1}. *${v.title.slice(0, 70)}*\n   👤 ${v.channel} · ⏱️ ${v.duration}`), '', '👇 Selecciona una canción:'].join('\n');
    return ctx.editMessageText(texto, { parse_mode: 'Markdown', ...teclado(userId, lista) });
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
