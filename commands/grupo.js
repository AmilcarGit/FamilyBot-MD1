const { BOT_NAME } = require('../lib/config');
const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { isGroup, isBotAdmin } = require('../lib/permissions');
const { enviarMenu } = require('../lib/menu-media');

function menuGrupo(grupo) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: `👥 ${t(grupo, 'grupo')}`, callback_data: 'menu_grupo' }],
        [{ text: `👑 ${t(grupo, 'admin')}`, callback_data: 'menu_admins' }, { text: t(grupo, 'seguridad'), callback_data: 'menu_seguridad' }],
        [{ text: `🔄 ${t(grupo, 'actualizar')}`, callback_data: 'grupo_actualizar' }, { text: t(grupo, 'inicio'), callback_data: 'menu_inicio' }]
      ]
    }
  };
}

function estado(valor, grupo) {
  return valor ? `✅ ${t(grupo, 'activado')}` : `❌ ${t(grupo, 'desactivado')}`;
}

async function obtenerAdmins(ctx) {
  try {
    return await ctx.telegram.getChatAdministrators(ctx.chat.id);
  } catch (error) {
    console.error(`⚠️ Administradores: ${error.message}`);
    return [];
  }
}

async function obtenerMiembros(ctx) {
  try {
    return await ctx.telegram.callApi('getChatMemberCount', { chat_id: ctx.chat.id });
  } catch (error) {
    console.error(`⚠️ Miembros: ${error.message}`);
    return null;
  }
}

async function obtenerTexto(ctx) {
  const chat = ctx.chat;
  const grupo = db.getGrupo(ctx.chat.id);
  const [miembros, administradores, botAdmin] = await Promise.all([obtenerMiembros(ctx), obtenerAdmins(ctx), isBotAdmin(ctx)]);
  const grupoActualizado = db.setGrupo(ctx.chat.id, {
    type: chat.type,
    title: chat.title || null,
    username: chat.username || null,
    memberCount: miembros
  });
  const adminsHumanos = administradores.filter((admin) => !admin.user.is_bot);
  const listaAdmins = adminsHumanos.length
    ? adminsHumanos.slice(0, 8).map((admin) => `• ${admin.user.first_name}${admin.user.last_name ? ` ${admin.user.last_name}` : ''}${admin.user.username ? ` (@${admin.user.username})` : ''}`).join('\n')
    : `• ${t(grupoActualizado, 'noDisponible')}`;
  return `👥 ${BOT_NAME}\n\n📝 ${t(grupoActualizado, 'nombre')}: ${chat.title || t(grupoActualizado, 'sinNombre')}\n🆔 ${t(grupoActualizado, 'id')}: ${chat.id}\n🔗 ${t(grupoActualizado, 'username')}: ${chat.username ? `@${chat.username}` : t(grupoActualizado, 'noDisponible')}\n👤 ${t(grupoActualizado, 'miembros')}: ${miembros ?? t(grupoActualizado, 'noDisponible')}\n\n👑 ${t(grupoActualizado, 'administradores')} (${adminsHumanos.length})\n${listaAdmins}\n\n🤖 ${t(grupoActualizado, 'botAdministrador')}: ${botAdmin ? `✅ ${t(grupoActualizado, 'si')}` : `❌ ${t(grupoActualizado, 'no')}`}\n🛡️ ${t(grupoActualizado, 'antilink')}: ${estado(grupoActualizado.antilink, grupoActualizado)}\n🌐 ${t(grupoActualizado, 'idioma')}: ${grupoActualizado.language}\n🔤 ${t(grupoActualizado, 'prefijo')}: ${grupoActualizado.prefix}`;
}

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery().catch(() => {});
    if (!isGroup(ctx)) return ctx.reply('ℹ️ Este comando solo está disponible en grupos.');
    const grupo = db.getGrupo(ctx.chat.id);
    try {
      const texto = await obtenerTexto(ctx);
      return enviarMenu(ctx, texto, menuGrupo(grupo), null);
    } catch (error) {
      console.error(`❌ Error en /grupo: ${error.message}`);
      return ctx.reply(`⚠️ ${t(grupo, 'grupoError')}`);
    }
  };

  bot.command('grupo', responder);
  bot.action('menu_grupo', responder);
  bot.action('grupo_actualizar', responder);
};
