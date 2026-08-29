const { Markup } = require('telegraf');
const yts = require('yt-search');
const { descargar } = require('../lib/lempi');

const resultados = new Map();

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

async function descargarMedia(ctx, userId, index, tipo) {
  if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
  const v = resultados.get(userId)?.[index];
  if (!v) return ctx.answerCbQuery('⚠️ Resultado expirado.', { show_alert: true });
  await ctx.answerCbQuery(tipo === 'audio' ? '🎧 Descargando música...' : '🎬 Descargando video...').catch(() => {});
  try {
    await ctx.editMessageText(`⏳ *Descargando ${tipo === 'audio' ? 'música' : 'video'}...*\n\n⚡ API Lempi`, { parse_mode: 'Markdown' }).catch(() => {});
    const media = await descargar(v.url, tipo);
    if (tipo === 'audio') {
      await ctx.replyWithAudio({ url: media.url }, {
        title: String(media.title || v.title).slice(0, 180),
        caption: `🎵 *${String(media.title || v.title).slice(0, 180)}*\n\n⚡ FamilyBot-MD`,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Música otra vez', `yts_audio_${userId}_${index}`)], [Markup.button.callback('🎬 Descargar video', `yts_video_${userId}_${index}`)], [Markup.button.callback('🔎 Nueva búsqueda', 'yts_new')]])
      });
    } else {
      await ctx.replyWithVideo({ url: media.url }, {
        caption: `🎬 *${String(media.title || v.title).slice(0, 180)}*\n\n⚡ FamilyBot-MD`,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Video otra vez', `yts_video_${userId}_${index}`)], [Markup.button.callback('🎧 Descargar música', `yts_audio_${userId}_${index}`)], [Markup.button.callback('🔎 Nueva búsqueda', 'yts_new')]])
      });
    }
    await ctx.editMessageText('✅ Archivo enviado correctamente.').catch(() => {});
  } catch (error) {
    await ctx.editMessageText(`❌ No se pudo descargar.\n\n${error.message}`, menuSeleccion(userId, index)).catch(() => ctx.reply(`❌ ${error.message}`));
  }
}

module.exports = bot => {
  bot.command('yts', async ctx => {
    const query = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
    if (!query) return ctx.reply('🔎 Usa el comando así:\n\n/yts nombre de la canción');
    try {
      const buscando = await ctx.reply('🔎 *Buscando en YouTube...*', { parse_mode: 'Markdown' });
      const result = await yts(query);
      const lista = (result.videos || []).slice(0, 5).map(v => ({
        title: v.title || 'Sin título',
        url: v.url,
        duration: v.timestamp || 'Desconocida',
        channel: v.author?.name || 'YouTube',
        thumbnail: v.thumbnail || ''
      }));
      if (!lista.length) return ctx.telegram.editMessageText(ctx.chat.id, buscando.message_id, undefined, '❌ No encontré resultados.');
      resultados.set(ctx.from.id, lista);
      const texto = ['🎵 *Resultados de YouTube*', '', ...lista.map((v, i) => `${i + 1}. *${v.title.slice(0, 70)}*\n   👤 ${v.channel} · ⏱️ ${v.duration}`), '', '👇 Selecciona un resultado:'].join('\n');
      await ctx.telegram.editMessageText(ctx.chat.id, buscando.message_id, undefined, texto, { parse_mode: 'Markdown', ...teclado(ctx.from.id, lista) });
    } catch (error) {
      return ctx.reply(`❌ Error al buscar.\n\n${error.message}`);
    }
  });

  bot.action(/^yts_pick_(\d+)_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    const index = Number(ctx.match[2]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    const v = resultados.get(userId)?.[index];
    if (!v) return ctx.answerCbQuery('⚠️ Resultado expirado.', { show_alert: true });
    await ctx.answerCbQuery('🎵 Seleccionado').catch(() => {});
    return ctx.editMessageText(`🎵 *${v.title.slice(0, 180)}*\n\n👤 ${v.channel}\n⏱️ ${v.duration}\n\n👇 Elige qué descargar:`, { parse_mode: 'Markdown', ...menuSeleccion(userId, index) }).catch(() => ctx.reply('👇 Elige qué descargar:', menuSeleccion(userId, index)));
  });

  bot.action(/^yts_audio_(\d+)_(\d+)$/, ctx => descargarMedia(ctx, Number(ctx.match[1]), Number(ctx.match[2]), 'audio'));
  bot.action(/^yts_video_(\d+)_(\d+)$/, ctx => descargarMedia(ctx, Number(ctx.match[1]), Number(ctx.match[2]), 'video'));

  bot.action(/^yts_back_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    const lista = resultados.get(userId);
    if (!lista) return ctx.answerCbQuery('⚠️ Los resultados expiraron.', { show_alert: true });
    await ctx.answerCbQuery().catch(() => {});
    const texto = ['🎵 *Resultados de YouTube*', '', ...lista.map((v, i) => `${i + 1}. *${v.title.slice(0, 70)}*\n   👤 ${v.channel} · ⏱️ ${v.duration}`), '', '👇 Selecciona un resultado:'].join('\n');
    return ctx.editMessageText(texto, { parse_mode: 'Markdown', ...teclado(userId, lista) }).catch(() => {});
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
    return ctx.editMessageText('❌ Búsqueda cancelada.').catch(() => ctx.reply('❌ Búsqueda cancelada.'));
  });
};
