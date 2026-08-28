const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { requireAdmin, isGroup } = require('../lib/permissions');

const temporizadores = new Map();

function parsearDuracion(valor) {
  if (!valor) return 0;
  const match = String(valor).trim().toLowerCase().match(/^(\d+)(m|h|d)$/);
  if (!match) return -1;
  const cantidad = Number(match[1]);
  const unidad = match[2];
  const multiplicadores = { m: 60_000, h: 3_600_000, d: 86_400_000 };
  const ms = cantidad * multiplicadores[unidad];
  if (!Number.isSafeInteger(ms) || ms <= 0) return -1;
  return ms;
}

function nombreUsuario(usuario) {
  return [usuario.first_name, usuario.last_name].filter(Boolean).join(' ') || usuario.username || String(usuario.id);
}

async function obtenerObjetivo(ctx, argumentos) {
  if (ctx.message?.reply_to_message?.from) return { usuario: ctx.message.reply_to_message.from, duracion: argumentos[0] };

  const username = argumentos[0]?.replace(/^@/, '');
  if (!username) return null;

  try {
    const miembro = await ctx.telegram.getChatMember(ctx.chat.id, username);
    return { usuario: miembro.user, duracion: argumentos[1] };
  } catch {
    return null;
  }
}

async function aplicarMute(ctx, usuario, duracion) {
  const grupo = db.getGrupo(ctx.chat.id);
  const hasta = duracion ? Math.floor((Date.now() + duracion) / 1000) : 0;

  await ctx.telegram.restrictChatMember(ctx.chat.id, usuario.id, {
    permissions: {
      can_send_messages: false,
      can_send_audios: false,
      can_send_documents: false,
      can_send_photos: false,
      can_send_videos: false,
      can_send_video_notes: false,
      can_send_voice_notes: false,
      can_send_polls: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false,
      can_change_info: false,
      can_invite_users: false,
      can_pin_messages: false,
      can_manage_topics: false
    },
    use_independent_chat_permissions: true,
    until_date: hasta
  });

  const clave = `${ctx.chat.id}:${usuario.id}`;
  const anterior = temporizadores.get(clave);
  if (anterior) clearTimeout(anterior);

  if (duracion) {
    const temporizador = setTimeout(async () => {
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
            can_change_info: false,
            can_pin_messages: false,
            can_manage_topics: false
          },
          use_independent_chat_permissions: true
        });
      } catch {}
      temporizadores.delete(clave);
    }, duracion);
    temporizadores.set(clave, temporizador);
  }

  return grupo;
}

async function quitarMute(ctx, usuario) {
  const clave = `${ctx.chat.id}:${usuario.id}`;
  const temporizador = temporizadores.get(clave);
  if (temporizador) clearTimeout(temporizador);
  temporizadores.delete(clave);

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
      can_change_info: false,
      can_invite_users: false,
      can_pin_messages: false,
      can_manage_topics: false
    },
    use_independent_chat_permissions: true
  });
}

module.exports = (bot) => {
  bot.command('mute', async (ctx) => {
    if (!isGroup(ctx)) return ctx.reply(t({}, 'soloGrupoMute'));
    if (!(await requireAdmin(ctx))) return;

    const argumentos = ctx.message.text.trim().split(/\s+/).slice(1);
    const objetivo = await obtenerObjetivo(ctx, argumentos);
    if (!objetivo) return ctx.reply(t(db.getGrupo(ctx.chat.id), 'muteUso'));

    if (objetivo.usuario.is_bot) return ctx.reply(t(db.getGrupo(ctx.chat.id), 'muteBot'));

    const duracion = parsearDuracion(objetivo.duracion);
    if (duracion === -1) return ctx.reply(t(db.getGrupo(ctx.chat.id), 'muteDuracion'));

    try {
      const grupo = await aplicarMute(ctx, objetivo.usuario, duracion);
      const tiempo = objetivo.duracion || t(grupo, 'mutePermanente');
      return ctx.reply(t(grupo, 'muteExito', { usuario: nombreUsuario(objetivo.usuario), tiempo }));
    } catch (error) {
      return ctx.reply(`${t(db.getGrupo(ctx.chat.id), 'muteError')}\n${error.message}`);
    }
  });

  bot.command('unmute', async (ctx) => {
    if (!isGroup(ctx)) return ctx.reply(t({}, 'soloGrupoMute'));
    if (!(await requireAdmin(ctx))) return;

    const argumentos = ctx.message.text.trim().split(/\s+/).slice(1);
    const objetivo = await obtenerObjetivo(ctx, argumentos);
    if (!objetivo) return ctx.reply(t(db.getGrupo(ctx.chat.id), 'unmuteUso'));

    try {
      const grupo = db.getGrupo(ctx.chat.id);
      await quitarMute(ctx, objetivo.usuario);
      return ctx.reply(t(grupo, 'unmuteExito', { usuario: nombreUsuario(objetivo.usuario) }));
    } catch (error) {
      return ctx.reply(`${t(db.getGrupo(ctx.chat.id), 'unmuteError')}\n${error.message}`);
    }
  });
};
