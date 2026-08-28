const db = require('../lib/db');
const { isGroup, isAdmin, isBotAdmin, requireAdmin } = require('../lib/permissions');

function objetivo(ctx) {
  const usuario = ctx.message?.reply_to_message?.from;
  return usuario && !usuario.is_bot ? usuario : null;
}

function nombre(usuario) {
  return [usuario.first_name, usuario.last_name].filter(Boolean).join(' ') || usuario.username || String(usuario.id);
}

async function base(ctx) {
  if (!isGroup(ctx)) {
    await ctx.reply('ℹ️ Este comando solo está disponible en grupos.');
    return false;
  }
  if (!(await requireAdmin(ctx))) return false;
  if (!(await isBotAdmin(ctx))) {
    await ctx.reply('⚠️ Necesito permisos de administrador para realizar esta acción.');
    return false;
  }
  return true;
}

async function validarObjetivo(ctx) {
  const usuario = objetivo(ctx);
  if (!usuario) {
    await ctx.reply('↩️ Responde al mensaje del usuario que quieres moderar.');
    return null;
  }
  if (await isAdmin(ctx, usuario.id)) {
    await ctx.reply('🛡️ No puedo aplicar esta acción a un administrador.');
    return null;
  }
  return usuario;
}

function mencionar(usuario) {
  if (usuario.username) return `@${usuario.username}`;
  return `[${nombre(usuario)}](tg://user?id=${usuario.id})`;
}

async function mencionarGrupo(ctx, oculto) {
  if (!(await base(ctx))) return;
  const miembros = db.getMiembrosConocidos(ctx.chat.id);
  const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id).catch(() => []);
  const mapa = new Map(miembros.map((usuario) => [String(usuario.id), usuario]));

  for (const admin of admins) {
    if (!admin.user.is_bot) mapa.set(String(admin.user.id), admin.user);
  }

  const usuarios = [...mapa.values()];
  if (!usuarios.length) return ctx.reply('ℹ️ Todavía no tengo participantes conocidos para mencionar.');

  let bloque = oculto ? '📢' : `📢 ${ctx.from?.first_name || 'Familia'} está llamando al grupo`;
  let enviados = 0;

  for (const usuario of usuarios) {
    const linea = `\n${mencionar(usuario)}`;
    if ((bloque + linea).length > 3500) {
      await ctx.reply(bloque, { parse_mode: 'Markdown' });
      bloque = `📢 ${linea.trim()}`;
    } else {
      bloque += linea;
    }
    enviados += 1;
  }

  if (bloque) await ctx.reply(bloque, { parse_mode: 'Markdown' });
  return ctx.reply(`ℹ️ ${enviados} participante(s) conocido(s) mencionados. Telegram no permite a los bots obtener automáticamente la lista completa de miembros.`);
}

async function kick(ctx) {
  if (!(await base(ctx))) return;
  const usuario = await validarObjetivo(ctx);
  if (!usuario) return;
  try {
    await ctx.telegram.banChatMember(ctx.chat.id, usuario.id);
    await ctx.telegram.unbanChatMember(ctx.chat.id, usuario.id, { only_if_banned: true });
    return ctx.reply(`👢 ${nombre(usuario)} fue expulsado del grupo.`);
  } catch (error) {
    return ctx.reply(`❌ No pude expulsar a ${nombre(usuario)}.`);
  }
}

async function ban(ctx) {
  if (!(await base(ctx))) return;
  const usuario = await validarObjetivo(ctx);
  if (!usuario) return;
  try {
    await ctx.telegram.banChatMember(ctx.chat.id, usuario.id);
    return ctx.reply(`🔨 ${nombre(usuario)} fue bloqueado del grupo.`);
  } catch (error) {
    return ctx.reply(`❌ No pude bloquear a ${nombre(usuario)}.`);
  }
}

async function unban(ctx) {
  if (!(await base(ctx))) return;
  const usuario = objetivo(ctx);
  if (!usuario) return ctx.reply('↩️ Responde al mensaje del usuario bloqueado para desbloquearlo.');
  try {
    await ctx.telegram.unbanChatMember(ctx.chat.id, usuario.id, { only_if_banned: true });
    return ctx.reply(`🔓 ${nombre(usuario)} fue desbloqueado.`);
  } catch (error) {
    return ctx.reply(`❌ No pude desbloquear a ${nombre(usuario)}.`);
  }
}

async function mute(ctx) {
  if (!(await base(ctx))) return;
  const usuario = await validarObjetivo(ctx);
  if (!usuario) return;
  try {
    await ctx.telegram.restrictChatMember(ctx.chat.id, usuario.id, { permissions: { can_send_messages: false } });
    return ctx.reply(`🔇 ${nombre(usuario)} fue silenciado.`);
  } catch (error) {
    return ctx.reply(`❌ No pude silenciar a ${nombre(usuario)}.`);
  }
}

async function unmute(ctx) {
  if (!(await base(ctx))) return;
  const usuario = objetivo(ctx);
  if (!usuario) return ctx.reply('↩️ Responde al mensaje del usuario que quieres desbloquear del silencio.');
  try {
    await ctx.telegram.restrictChatMember(ctx.chat.id, usuario.id, {
      permissions: {
        can_send_messages: true,
        can_send_audios: true,
        can_send_documents: true,
        can_send_photos: true,
        can_send_videos: true,
        can_send_video_notes: true,
        can_send_voice_notes: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_invite_users: true,
        can_pin_messages: false,
        can_change_info: false
      }
    });
    return ctx.reply(`🔊 ${nombre(usuario)} puede volver a escribir.`);
  } catch (error) {
    return ctx.reply(`❌ No pude quitar el silencio a ${nombre(usuario)}.`);
  }
}

async function warn(ctx) {
  if (!(await base(ctx))) return;
  const usuario = await validarObjetivo(ctx);
  if (!usuario) return;
  const cantidad = db.getWarnings(ctx.chat.id, usuario.id) + 1;
  db.setWarnings(ctx.chat.id, usuario.id, cantidad);
  if (cantidad >= 3) {
    try {
      await ctx.telegram.banChatMember(ctx.chat.id, usuario.id);
      db.setWarnings(ctx.chat.id, usuario.id, 0);
      return ctx.reply(`⚠️ ${nombre(usuario)} recibió ${cantidad}/3 advertencias y fue bloqueado automáticamente.`);
    } catch (error) {
      return ctx.reply(`⚠️ ${nombre(usuario)} recibió ${cantidad}/3 advertencias, pero no pude bloquearlo.`);
    }
  }
  return ctx.reply(`⚠️ ${nombre(usuario)} recibió una advertencia: ${cantidad}/3.`);
}

async function warnings(ctx) {
  if (!isGroup(ctx)) return ctx.reply('ℹ️ Este comando solo está disponible en grupos.');
  if (!(await requireAdmin(ctx))) return;
  const usuario = objetivo(ctx);
  if (!usuario) return ctx.reply('↩️ Responde al mensaje del usuario para consultar sus advertencias.');
  return ctx.reply(`⚠️ ${nombre(usuario)} tiene ${db.getWarnings(ctx.chat.id, usuario.id)}/3 advertencias.`);
}

module.exports = (bot) => {
  bot.command('tagall', (ctx) => mencionarGrupo(ctx, false));
  bot.command('hidetag', (ctx) => mencionarGrupo(ctx, true));
  bot.command('kick', kick);
  bot.command('ban', ban);
  bot.command('unban', unban);
  bot.command('mute', mute);
  bot.command('unmute', unmute);
  bot.command('warn', warn);
  bot.command('warnings', warnings);
};
