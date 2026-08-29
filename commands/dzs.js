const { Markup } = require('telegraf');
const { buscar, descargar } = require('../lib/deezer');

const resultados = new Map();

function listaTeclado(userId, lista) {
  return Markup.inlineKeyboard([
    ...lista.map((v, i) => [Markup.button.callback(`${i + 1} 🎵 ${String(v.title || 'Sin título').slice(0, 45)}`, `dzs_pick_${userId}_${i}`)]),
    [Markup.button.callback('❌ Cancelar', `dzs_cancel_${userId}`)]
  ]);
}

function seleccionTeclado(userId, index) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🎧 Descargar música', `dzs_download_${userId}_${index}`)],
    [Markup.button.callback('⬅️ Volver a resultados', `dzs_back_${userId}`)],
    [Markup.button.callback('❌ Cancelar', `dzs_cancel_${userId}`)]
  ]);
}

async function enviarAudio(ctx, userId, index) {
  if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
  const item = resultados.get(userId)?.[index];
  if (!item) return ctx.answerCbQuery('⚠️ Resultado expirado.', { show_alert: true });
  await ctx.answerCbQuery('🎧 Descargando música...').catch(() => {});
  try {
    await ctx.editMessageText(`⏳ *Descargando...*\n\n🎵 ${String(item.title).slice(0, 150)}\n👤 ${String(item.artist || 'Desconocido').slice(0, 100)}`, { parse_mode: 'Markdown' }).catch(() => {});
    const media = await descargar(item.url);
    await ctx.replyWithAudio({ url: media.dl }, {
      title: String(media.title || item.title).slice(0, 180),
      performer: String(media.artist || item.artist || '').slice(0, 100),
      caption: `🎵 *${String(media.title || item.title).slice(0, 180)}*\n👤 ${String(media.artist || item.artist || '').slice(0, 100)}\n\n⚡ FamilyBot-MD`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Descargar otra vez', `dzs_download_${userId}_${index}`)],
        [Markup.button.callback('🔎 Nueva búsqueda', 'dzs_new')]
      ])
    });
    await ctx.editMessageText('✅ Música enviada correctamente.').catch(() => {});
  } catch (error) {
    await ctx.editMessageText(`❌ No se pudo descargar.\n\n${error.message}`, seleccionTeclado(userId, index)).catch(() => ctx.reply(`❌ ${error.message}`));
  }
}

module.exports = bot => {
  bot.command('dzs', async ctx => {
    const query = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
    if (!query) return ctx.reply('🔎 Usa el comando así:\n\n/dzs nombre de la canción o artista');
    try {
      const buscando = await ctx.reply('🔎 *Buscando en Deezer...*', { parse_mode: 'Markdown' });
      const lista = (await buscar(query, 10)).slice(0, 10).map(v => ({
        id: v.id,
        title: v.title || 'Sin título',
        artist: v.artist || 'Desconocido',
        album: v.album || 'Desconocido',
        duration: v.duration || 'Desconocida',
        url: v.url,
        image: v.image || ''
      }));
      if (!lista.length) return ctx.telegram.editMessageText(ctx.chat.id, buscando.message_id, undefined, '❌ No encontré resultados.');
      resultados.set(ctx.from.id, lista);
      const texto = ['🎵 *Resultados de Deezer*', '', ...lista.map((v, i) => `${i + 1}. *${String(v.title).slice(0, 70)}*\n   👤 ${String(v.artist).slice(0, 60)} · ⏱️ ${v.duration}`), '', '👇 Selecciona una canción:'].join('\n');
      await ctx.telegram.editMessageText(ctx.chat.id, buscando.message_id, undefined, texto, { parse_mode: 'Markdown', ...listaTeclado(ctx.from.id, lista) });
    } catch (error) {
      return ctx.reply(`❌ Error al buscar en Deezer.\n\n${error.message}`);
    }
  });

  bot.action(/^dzs_pick_(\d+)_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    const index = Number(ctx.match[2]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    const item = resultados.get(userId)?.[index];
    if (!item) return ctx.answerCbQuery('⚠️ Resultado expirado.', { show_alert: true });
    await ctx.answerCbQuery('🎵 Seleccionado').catch(() => {});
    return ctx.editMessageText(`🎵 *${String(item.title).slice(0, 180)}*\n\n👤 ${item.artist}\n💿 ${item.album}\n⏱️ ${item.duration}\n\n👇 ¿Quieres descargar esta canción?`, { parse_mode: 'Markdown', ...seleccionTeclado(userId, index) }).catch(() => ctx.reply('👇 ¿Quieres descargar esta canción?', seleccionTeclado(userId, index)));
  });

  bot.action(/^dzs_download_(\d+)_(\d+)$/, (ctx) => enviarAudio(ctx, Number(ctx.match[1]), Number(ctx.match[2])));

  bot.action(/^dzs_back_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    const lista = resultados.get(userId);
    if (!lista) return ctx.answerCbQuery('⚠️ Los resultados expiraron.', { show_alert: true });
    await ctx.answerCbQuery().catch(() => {});
    const texto = ['🎵 *Resultados de Deezer*', '', ...lista.map((v, i) => `${i + 1}. *${String(v.title).slice(0, 70)}*\n   👤 ${String(v.artist).slice(0, 60)} · ⏱️ ${v.duration}`), '', '👇 Selecciona una canción:'].join('\n');
    return ctx.editMessageText(texto, { parse_mode: 'Markdown', ...listaTeclado(userId, lista) }).catch(() => {});
  });

  bot.action('dzs_new', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.reply('🔎 Escribe una nueva búsqueda:\n\n/dzs nombre de la canción o artista');
  });

  bot.action(/^dzs_cancel_(\d+)$/, async ctx => {
    const userId = Number(ctx.match[1]);
    if (ctx.from.id !== userId) return ctx.answerCbQuery('⚠️ Esta búsqueda pertenece a otro usuario.', { show_alert: true });
    resultados.delete(userId);
    await ctx.answerCbQuery('Búsqueda cancelada').catch(() => {});
    return ctx.editMessageText('❌ Búsqueda cancelada.').catch(() => ctx.reply('❌ Búsqueda cancelada.'));
  });
};
