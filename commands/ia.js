const db = require('../lib/db');
const { t } = require('../lib/i18n');

async function preguntarIA(pregunta, historial) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const modelo = process.env.AI_MODEL || 'claude-haiku-4-5-20251001';
  const mensajes = [...historial, { role: 'user', content: pregunta }];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: modelo, max_tokens: 600, messages: mensajes })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Error desconocido de la API');
  return (data.content || []).map((b) => b.text || '').join('\n').trim() || '🤷 No obtuve respuesta de la IA.';
}

module.exports = (bot) => {
  bot.command('ia', async (ctx) => {
    const grupo = ctx.chat?.type !== 'private' ? db.getGrupo(ctx.chat.id) : { language: 'es' };
    const pregunta = ctx.message.text.split(' ').slice(1).join(' ').trim();

    if (!pregunta) return ctx.reply(t(grupo, 'preguntaIAAyuda'));
    if (!process.env.ANTHROPIC_API_KEY) return ctx.reply(t(grupo, 'faltaApi'));

    const usuario = db.getUsuario(ctx.from.id);
    const esperando = await ctx.reply(t(grupo, 'pensando'));

    try {
      const respuesta = await preguntarIA(pregunta, usuario.historial || []);
      const nuevoHistorial = [...(usuario.historial || []), { role: 'user', content: pregunta }, { role: 'assistant', content: respuesta }].slice(-6);
      db.setUsuario(ctx.from.id, { historial: nuevoHistorial });
      await ctx.telegram.editMessageText(ctx.chat.id, esperando.message_id, undefined, respuesta);
    } catch (error) {
      console.error('Error IA:', error.message);
      await ctx.telegram.editMessageText(ctx.chat.id, esperando.message_id, undefined, t(grupo, 'errorIA')).catch(() => {});
    }
  });

  bot.command('resetia', (ctx) => {
    const grupo = ctx.chat?.type !== 'private' ? db.getGrupo(ctx.chat.id) : { language: 'es' };
    db.setUsuario(ctx.from.id, { historial: [] });
    return ctx.reply(t(grupo, 'historialBorrado'));
  });

  bot.action('menu_ia', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const grupo = ctx.chat?.type !== 'private' ? db.getGrupo(ctx.chat.id) : { language: 'es' };
    return ctx.replyWithMarkdown(`*${t(grupo, 'iaTitulo')}*\n\n${t(grupo, 'iaUso')}\n${t(grupo, 'iaEjemplo')}\n\n${t(grupo, 'iaReset')}`);
  });
};
