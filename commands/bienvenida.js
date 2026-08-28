const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { isGroup, requireAdmin } = require('../lib/permissions');

function opciones(grupo) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: grupo.welcomeEnabled ? '🔴 Desactivar' : '🟢 Activar', callback_data: grupo.welcomeEnabled ? 'bienvenida_off' : 'bienvenida_on' }],
        [{ text: grupo.welcomeDeleteJoin ? '🧹 Borrar entrada: Sí' : '🧹 Borrar entrada: No', callback_data: 'bienvenida_delete' }],
        [{ text: t(grupo, 'grupo'), callback_data: 'menu_grupo' }, { text: t(grupo, 'inicio'), callback_data: 'menu_inicio' }]
      ]
    }
  };
}

function texto(grupo) {
  const estado = grupo.welcomeEnabled ? t(grupo, 'activado') : t(grupo, 'desactivado');
  const borrar = grupo.welcomeDeleteJoin ? 'Sí' : 'No';
  return `${t(grupo, 'bienvenidaTitulo')}\n\n👋 ${t(grupo, 'estado')}: ${estado}\n🧹 Borrar mensaje de entrada: ${borrar}\n\n${t(grupo, 'bienvenidaAyuda')}`;
}

async function responderMenu(ctx) {
  if (ctx.updateType === 'callback_query') await ctx.answerCbQuery().catch(() => {});
  const grupo = db.getGrupo(ctx.chat.id);
  if (!isGroup(ctx)) return ctx.reply(t(grupo, 'soloGrupos'));
  if (ctx.updateType === 'callback_query') return ctx.editMessageText(texto(grupo), opciones(grupo));
  return ctx.reply(texto(grupo), opciones(grupo));
}

async function cambiar(ctx, activado) {
  if (ctx.updateType === 'callback_query') await ctx.answerCbQuery().catch(() => {});
  const grupo = db.getGrupo(ctx.chat.id);
  if (!isGroup(ctx)) return ctx.reply(t(grupo, 'soloGrupos'));
  if (!(await requireAdmin(ctx))) return;
  const actualizado = db.setGrupo(ctx.chat.id, { welcomeEnabled: activado });
  if (ctx.updateType === 'callback_query') return ctx.editMessageText(texto(actualizado), opciones(actualizado));
  return ctx.reply(t(actualizado, activado ? 'bienvenidaActivada' : 'bienvenidaDesactivada'), opciones(actualizado));
}

async function cambiarBorrado(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  const grupo = db.getGrupo(ctx.chat.id);
  if (!isGroup(ctx)) return ctx.reply(t(grupo, 'soloGrupos'));
  if (!(await requireAdmin(ctx))) return;
  const actualizado = db.setGrupo(ctx.chat.id, { welcomeDeleteJoin: !grupo.welcomeDeleteJoin });
  return ctx.editMessageText(texto(actualizado), opciones(actualizado));
}

function escapar(texto) {
  return String(texto || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function nombreUsuario(usuario) {
  return [usuario.first_name, usuario.last_name].filter(Boolean).join(' ') || 'Usuario';
}

function mencionar(usuario) {
  return `<a href="tg://user?id=${usuario.id}">${escapar(nombreUsuario(usuario))}</a>`;
}

async function fotoPerfil(ctx, usuario) {
  try {
    const fotos = await ctx.telegram.getUserProfilePhotos(usuario.id, 0, 1);
    return fotos.total_count > 0 ? fotos.photos[0][fotos.photos[0].length - 1].file_id : null;
  } catch (error) {
    return null;
  }
}

async function bienvenida(ctx) {
  if (!ctx.message?.new_chat_members?.length) return;
  const grupo = db.getGrupo(ctx.chat.id);
  if (!grupo.welcomeEnabled) return;

  const nuevos = ctx.message.new_chat_members.filter((usuario) => !usuario.is_bot);
  if (!nuevos.length) return;

  const miembros = await ctx.telegram.callApi('getChatMemberCount', { chat_id: ctx.chat.id }).catch(() => null);
  const lista = nuevos.map(mencionar).join(', ');
  const titulo = escapar(ctx.chat.title || 'este grupo');
  const mensaje = `${t(grupo, 'bienvenidaMensaje')}\n\n👤 ${lista}\n\n🎉 ${t(grupo, 'bienvenidaGrupo', { grupo: titulo })}\n👥 ${t(grupo, 'bienvenidaMiembros', { cantidad: miembros || '—' })}\n\n${t(grupo, 'bienvenidaFinal')}`;
  const opcionesMensaje = {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{ text: `👤 ${t(grupo, 'verPerfil')}`, url: `tg://user?id=${nuevos[0].id}` }]]
    }
  };

  try {
    const foto = await fotoPerfil(ctx, nuevos[0]);
    if (foto) await ctx.replyWithPhoto(foto, { caption: mensaje, ...opcionesMensaje });
    else await ctx.reply(mensaje, opcionesMensaje);
  } catch (error) {
    await ctx.reply(mensaje, opcionesMensaje).catch(() => {});
  }

  if (grupo.welcomeDeleteJoin) {
    await ctx.deleteMessage(ctx.message.message_id).catch(() => {});
  }
}

module.exports = (bot) => {
  bot.command('bienvenida', responderMenu);
  bot.command('welcome', responderMenu);
  bot.command('bienvenida_on', (ctx) => cambiar(ctx, true));
  bot.command('bienvenida_off', (ctx) => cambiar(ctx, false));
  bot.action('bienvenida_menu', responderMenu);
  bot.action('bienvenida_on', (ctx) => cambiar(ctx, true));
  bot.action('bienvenida_off', (ctx) => cambiar(ctx, false));
  bot.action('bienvenida_delete', cambiarBorrado);
  bot.on('new_chat_members', bienvenida);
};
