const db = require('./db');

function registrarContexto(ctx) {
  const chat = ctx?.chat;
  const from = ctx?.from;

  if (from?.id != null) {
    db.upsertUsuario(from.id, {
      id: from.id,
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null,
      isBot: Boolean(from.is_bot)
    });
  }

  if (chat?.id != null && chat.type !== 'private') {
    db.upsertGrupo(chat.id, {
      id: chat.id,
      type: chat.type,
      title: chat.title || null,
      username: chat.username || null
    });
  }
}

function registrarMiddleware(bot) {
  bot.use(async (ctx, next) => {
    try {
      registrarContexto(ctx);
    } catch (error) {
      // La analítica/registro nunca debe impedir que un comando funcione.
      console.error('⚠️ Error registrando contexto:', error.message);
    }

    return next();
  });
}

module.exports = { registrarContexto, registrarMiddleware };
