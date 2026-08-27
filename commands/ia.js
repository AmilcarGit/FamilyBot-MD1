const db = require('../lib/db');

async function preguntarIA(pregunta, historial) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const modelo = process.env.AI_MODEL || 'claude-haiku-4-5-20251001';

  const mensajes = [
    ...historial,
    { role: 'user', content: pregunta }
  ];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 600,
      messages: mensajes
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Error desconocido de la API');
  const texto = (data.content || []).map((b) => b.text || '').join('\n').trim();
  return texto || '🤷 No obtuve respuesta de la IA.';
}

module.exports = (bot) => {
  bot.command('ia', async (ctx) => {
    const pregunta = ctx.message.text.split(' ').slice(1).join(' ').trim();

    if (!pregunta) {
      return ctx.reply('✍️ Escribe tu pregunta después del comando.\nEjemplo: /ia ¿Cuál es la capital de Francia?');
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return ctx.reply('⚠️ Falta configurar ANTHROPIC_API_KEY en tu archivo .env');
    }

    const userId = ctx.from.id;
    const usuario = db.getUsuario(userId);
    const esperando = await ctx.reply('🤖 Pensando...');

    try {
      const respuesta = await preguntarIA(pregunta, usuario.historial || []);

      const nuevoHistorial = [
        ...(usuario.historial || []),
        { role: 'user', content: pregunta },
        { role: 'assistant', content: respuesta }
      ].slice(-6);
      db.setUsuario(userId, { historial: nuevoHistorial });

      await ctx.telegram.editMessageText(ctx.chat.id, esperando.message_id, undefined, respuesta);
    } catch (err) {
      console.error('Error IA:', err.message);
      await ctx.telegram
        .editMessageText(ctx.chat.id, esperando.message_id, undefined, '❌ Ocurrió un error al consultar la IA. Revisa tu API key.')
        .catch(() => {});
    }
  });

  bot.command('resetia', (ctx) => {
    db.setUsuario(ctx.from.id, { historial: [] });
    ctx.reply('🧹 Se borró tu historial de conversación con la IA.');
  });

  bot.action('menu_ia', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    ctx.replyWithMarkdown(
      `🧠 *Asistente IA*\n\n` +
      `Usa: \`/ia tu pregunta\`\n` +
      `Ejemplo: \`/ia explícame qué es la fotosíntesis\`\n\n` +
      `/resetia — Borra tu historial de conversación`
    );
  });
};