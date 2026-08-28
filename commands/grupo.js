const { BOT_NAME } = require('../lib/config');
const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { isGroup, isBotAdmin } = require('../lib/permissions');

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
    return await ctx.telegram.getChatMemberCount(ctx.chat.id);
  } catch (error) {
    console.error(`⚠️ Miembros: ${error.message}`);
    return null;
  }
}

async function obtenerTexto(ctx) {
  const chat = ctx.chat;
  const grupo = db.getGrupo(ctx.chat.id);
  const [miembros, administradores, botAdmin] = await Promise.all([
    obtenerMiembros(ctx),
    obtenerAdmins(ctx),
    isBotAdmin(ctx)
  ]);

  db.setGrupo(ctx.chat.id, {
    type: chat.type,
    title: chat.title || null,
    username: chat.username || null,
    memberCount: miembros
  });

  const adminsHumanos = administradores.filter((admin) => !admin.user.is_bot);
  const listaAdmins = adminsHumanos.length
    ? adminsHumanos.slice(0, 8).map((admin) => `• ${admin.user.first_name}${admin.user.last_name ? ` ${admin.user.last_name}` : ''}${admin.user.username ? ` (@${admin.user.username})` : ''}`).join('\n')
    : `• ${t(grupo, 'noDisponible')}`;

  return `👥 ${BOT_NAME}\n\n📝 ${t(grupo, 'nombre')}: ${chat.title || t(grupo, 'sinNombre')}\n🆔 ${t(grupo, 'id')}: ${chat.id}\n🔗 ${t(grupo, 'username')}: ${chat.username ? `@${chat.username}` : t(grupo, 'noDisponible')}\n👤 ${t(grupo, 'miembros')}: ${miembros ?? t(grupo, 'noDisponible')}\n\n👑 ${t(grupo, 'administradores')} (${adminsHumanos.length})\n${listaAdmins}\n\n🤖 ${t(grupo, 'botAdministrador')}: ${botAdmin ? `✅ ${t(grupo, 'si')}` : `❌ ${t(grupo, 'no')}`}\n🛡️ ${t(grupo, 'antilink')}: ${estado(grupo.antilink, grupo)}\n🌐 ${t(grupo, 'idioma')}: ${grupo.language}\n🔤 ${t(grupo, 'prefijo')}: ${grupo.prefix}`;
}

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery().catch(() => {});

    if (!isGroup(ctx)) {
      return ctx.reply('ℹ️ Este comando solo está disponible en grupos.');
    }

    const grupo = db.getGrupo(ctx.chat.id);

    try {
      const texto = await obtenerTexto(ctx);
      const opciones = menuGrupo(grupo);

      if (ctx.updateType === 'callback_query') {
        return ctx.editMessageText(texto, opciones).catch(() => ctx.reply(texto, opciones));
      }

      return ctx.reply(texto, opciones);
    } catch (error) {
      console.error(`❌ Error en /grupo: ${error.message}`);
      return ctx.reply(`⚠️ ${t(grupo, 'grupoError')}`);
    }
  };

  bot.command('grupo', responder);
  bot.action('menu_grupo', responder);
  bot.action('grupo_actualizar', responder);
};
