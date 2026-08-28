const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { isGroup } = require('../lib/permissions');

function menu(grupo) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: t(grupo, 'grupo'), callback_data: 'menu_grupo' }],
        [{ text: t(grupo, 'seguridad'), callback_data: 'menu_seguridad' }, { text: t(grupo, 'inicio'), callback_data: 'menu_inicio' }]
      ]
    }
  };
}

async function obtenerAdmins(ctx) {
  const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
  return admins.filter((admin) => !admin.user.is_bot);
}

function nombreUsuario(usuario) {
  const nombre = [usuario.first_name, usuario.last_name].filter(Boolean).join(' ');
  return usuario.username ? `${nombre} (@${usuario.username})` : nombre;
}

async function responder(ctx) {
  if (ctx.updateType === 'callback_query') await ctx.answerCbQuery().catch(() => {});

  if (!isGroup(ctx)) {
    return ctx.reply('ℹ️ Este comando solo está disponible en grupos.');
  }

  const grupo = db.getGrupo(ctx.chat.id);

  try {
    const admins = await obtenerAdmins(ctx);
    const creador = admins.filter((admin) => admin.status === 'creator');
    const administradores = admins.filter((admin) => admin.status !== 'creator');

    let texto = `👑 ${ctx.chat.title}\n\n`;
    texto += `👑 ${t(grupo, 'admin')}: ${admins.length}\n\n`;

    if (creador.length) {
      texto += `👑 Propietario\n${creador.map((admin) => `• ${nombreUsuario(admin.user)}`).join('\n')}\n\n`;
    }

    if (administradores.length) {
      texto += `🛡️ Administradores\n${administradores.map((admin) => `• ${nombreUsuario(admin.user)}`).join('\n')}`;
    }

    if (!creador.length && !administradores.length) {
      texto += '• No disponible';
    }

    if (ctx.updateType === 'callback_query') {
      return ctx.editMessageText(texto, menu(grupo));
    }

    return ctx.reply(texto, menu(grupo));
  } catch (error) {
    console.error('Error al obtener administradores:', error.message);
    return ctx.reply('⚠️ No pude obtener la lista de administradores. Comprueba los permisos del bot.');
  }
}

module.exports = (bot) => {
  bot.command('admins', responder);
  bot.action('menu_admins', responder);
};
