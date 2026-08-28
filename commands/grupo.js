const { BOT_NAME } = require('../lib/config');
const db = require('../lib/db');
const { isGroup, isBotAdmin, getMemberStatus } = require('../lib/permissions');

function menuGrupo() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚙️ Ajustes', callback_data: 'menu_ajustes' }, { text: '🛡️ Seguridad', callback_data: 'menu_seguridad' }],
        [{ text: '🔄 Actualizar', callback_data: 'grupo_actualizar' }, { text: '⬅️ Inicio', callback_data: 'menu_inicio' }]
      ]
    }
  };
}

function estado(valor) {
  return valor ? '✅ Activado' : '❌ Desactivado';
}

async function obtenerAdministradores(ctx) {
  const administradores = await ctx.telegram.getChatAdministrators(ctx.chat.id);
  return administradores.filter((admin) => !admin.user.is_bot);
}

async function obtenerTexto(ctx) {
  const chat = await ctx.telegram.getChat(ctx.chat.id);
  const miembros = await ctx.telegram.getChatMemberCount(ctx.chat.id);
  const administradores = await obtenerAdministradores(ctx);
  const botAdmin = await isBotAdmin(ctx);
  const grupo = db.getGrupo(ctx.chat.id);

  db.setGrupo(ctx.chat.id, {
    title: chat.title || ctx.chat.title || 'Sin nombre',
    username: chat.username || null,
    memberCount: miembros
  });

  const listaAdmins = administradores.length
    ? administradores.slice(0, 8).map((admin) => `• ${admin.user.first_name}${admin.user.username ? ` (@${admin.user.username})` : ''}`).join('\n')
    : '• No disponible';

  return `👥 ${BOT_NAME}\n\n📝 Nombre: ${chat.title || ctx.chat.title || 'Sin nombre'}\n🆔 ID: ${ctx.chat.id}\n🔗 Username: ${chat.username ? `@${chat.username}` : 'No disponible'}\n👤 Miembros: ${miembros}\n\n👑 Administradores (${administradores.length})\n${listaAdmins}\n\n🤖 Bot administrador: ${botAdmin ? '✅ Sí' : '❌ No'}\n🛡️ Antilink: ${estado(grupo.antilink)}\n🌐 Idioma: ${grupo.language}\n🔤 Prefijo: ${grupo.prefix}`;
}

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery();

    if (!isGroup(ctx)) {
      return ctx.reply('ℹ️ Este comando solo está disponible en grupos.');
    }

    try {
      const texto = await obtenerTexto(ctx);
      const opciones = menuGrupo();

      if (ctx.updateType === 'callback_query') {
        return ctx.editMessageText(texto, opciones);
      }

      return ctx.reply(texto, opciones);
    } catch (error) {
      console.error('Error al obtener información del grupo:', error.message);
      return ctx.reply('⚠️ No pude obtener toda la información del grupo. Comprueba que tengo los permisos necesarios.');
    }
  };

  bot.command('grupo', responder);
  bot.action('menu_grupo', responder);
  bot.action('grupo_actualizar', responder);
};
