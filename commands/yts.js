const { Markup } = require('telegraf');

const SEARCH_API = 'https://api.delirius.store/search/ytsearch';
const AUDIO_API = 'https://api.delirius.store/download/ytmp3';
const VIDEO_API = 'https://api.delirius.store/download/ytmp4';
const TIMEOUT = 45000;
const resultados = new Map();

async function peticion(api) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(api, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`Delirius HTTP ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

async function buscar(query) {
  const api = new URL(SEARCH_API);
  api.searchParams.set('q', query);
  const data = await peticion(api);
  if (!data?.status || !Array.isArray(data?.data)) throw new Error(data?.message || 'Respuesta inválida de Delirius.');
  return data.data.filter(v => v?.type === 'video' && v?.url).slice(0, 5).map(v => ({
    title: v.title || 'Sin título', url: v.url, thumbnail: v.thumbnail || v.image || '',
    duration: v.duration || 'Desconocida', channel: v.author?.name || v.author || 'YouTube', views: Number(v.views) || 0
  }));
}

async function editar(ctx, texto, opciones = {}) {
  const msg = ctx.callbackQuery?.message;
  try {
    if (msg?.text === texto && JSON.stringify(msg.reply_markup || null) === JSON.stringify(opciones.reply_markup || null)) return;
    if (msg?.text != null) return await ctx.editMessageText(texto, opciones);
    if (msg?.caption != null) return await ctx.editMessageCaption(texto, opciones);
    return await ctx.reply(texto, opciones);
  } catch (e) {
    if (e?.response?.error_code === 400 && /not modified|there is no text|message is not modified/i.test(e?.response?.description || '')) return;
    throw e;
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
    [Markup.button.callback('🎧 Descargar música', `yts_audio_${userId}_${index}`)],
    [Markup.button.callback('🎬 Descargar video', `yts_video_${userId}_${index}`)],
    [Markup.button.callback('⬅️ Volver a resultados', `yts_back_${userId}`)],
    [Markup.button.callback('❌ Cancelar', `yts_cancel_${userId}`)]
  ]);
}

async function descargar(ctx, userId, index, tipo) {
  if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
  const v = resultados.get(userId)?.[index];
  if (!v) return ctx.answerCbQuery('⚠️ Resultado expirado.', { show_alert: true });
  await ctx.answerCbQuery(tipo === 'audio' ? '🎧 Procesando música...' : '🎬 Procesando video...').catch(() => {});
  try {
    await editar(ctx, `⏳ *Procesando ${tipo === 'audio' ? 'música' : 'video'}...*\n\n🎵 ${v.title.slice(0, 150)}`, { parse_mode: 'Markdown' });
    const api = new URL(tipo === 'audio' ? AUDIO_API : VIDEO_API);
    api.searchParams.set('url', v.url);
    if (tipo === 'video') api.searchParams.set('format', '360');
    const data = await peticion(api);
    if (!data?.status || !data?.data?.download) throw new Error(data?.message || `Delirius no devolvió el ${tipo}.`);
    const downloadUrl = data.data.download;
    const title = data.data.title || v.title;
    await editar(ctx, tipo === 'audio' ? '⬇️ *Enviando música...*' : '⬇️ *Enviando video...*', { parse_mode: 'Markdown' });
    if (tipo === 'audio') {
      await ctx.replyWithAudio({ url: downloadUrl }, {
        title: String(title).slice(0, 180), caption: `🎵 *${String(title).slice(0, 180)}*\n\n⚡ FamilyBot-MD`, parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Música otra vez', `yts_audio_${userId}_${index}`)],[Markup.button.callback('🎬 Descargar video', `yts_video_${userId}_${index}`)],[Markup.button.callback('🔎 Nueva búsqueda', 'yts_new')]])
      });
    } else {
      await ctx.replyWithVideo({ url: downloadUrl }, {
        caption: `🎬 *${String(title).slice(0, 180)}*\n\n⚡ FamilyBot-MD`, parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Video otra vez', `yts_video_${userId}_${index}`)],[Markup.button.callback('🎧 Descargar música', `yts_audio_${userId}_${index}`)],[Markup.button.callback('🔎 Nueva búsqueda', 'yts_new')]])
      });
    }
  } catch (error) {
    const msg = error.name === 'AbortError' ? '⏱️ Delirius tardó demasiado en responder.' : `❌ No se pudo descargar.\n\n${error.message}`;
    try { await editar(ctx, msg, Markup.inlineKeyboard([[Markup.button.callback('⬅️ Volver a resultados', `yts_back_${userId}`)],[Markup.button.callback('❌ Cancelar', `yts_cancel_${userId}`)]])); }
    catch { await ctx.reply(msg).catch(() => {}); }
  }
}

module.exports = (bot) => {
  bot.command('yts', async ctx => {
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
      return ctx.reply(error.name === 'AbortError' ? '⏱️ Delirius tardó demasiado en responder.' : `❌ Error al buscar.\n\n${error.message}`);
    }
  });

  bot.action(/^yts_pick_(\d+)_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]), index = Number(ctx.match[2]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    const v = resultados.get(userId)?.[index];
    if (!v) return ctx.answerCbQuery('⚠️ Los resultados expiraron.', { show_alert: true });
    await ctx.answerCbQuery('🎵 Canción seleccionada').catch(() => {});
    return editar(ctx, `🎵 *Canción seleccionada*\n\n🎶 ${v.title}\n👤 ${v.channel}\n⏱️ ${v.duration}\n\n👇 Elige el formato:`, { parse_mode: 'Markdown', ...menuSeleccion(userId, index) });
  });

  bot.action(/^yts_audio_(\d+)_(\d+)$/, ctx => descargar(ctx, Number(ctx.match[1]), Number(ctx.match[2]), 'audio'));
  bot.action(/^yts_video_(\d+)_(\d+)$/, ctx => descargar(ctx, Number(ctx.match[1]), Number(ctx.match[2]), 'video'));

  bot.action(/^yts_back_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    const lista = resultados.get(userId);
    if (!lista) return ctx.answerCbQuery('⚠️ Los resultados expiraron.', { show_alert: true });
    await ctx.answerCbQuery().catch(() => {});
    const texto = ['🎵 *Resultados de YouTube*', '', ...lista.map((v, i) => `${i + 1}. *${v.title.slice(0, 70)}*\n   👤 ${v.channel} · ⏱️ ${v.duration}`), '', '👇 Selecciona una canción:'].join('\n');
    return editar(ctx, texto, { parse_mode: 'Markdown', ...teclado(userId, lista) });
  });

  bot.action('yts_new', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.reply('🔎 Escribe una nueva búsqueda:\n\n/yts nombre de la canción');
  });

  bot.action(/^yts_cancel_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    resultados.delete(userId);
    await ctx.answerCbQuery('Búsqueda cancelada').catch(() => {});
    return editar(ctx, '❌ Búsqueda cancelada.');
  });
};