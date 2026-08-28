const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { requireAdmin, isGroup } = require('../lib/permissions');

function menu(grupo) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: t(grupo, 'despedidaActivar'), callback_data: 'despedida_on' }, { text: t(grupo, 'despedidaDesactivar'), callback_data: 'despedida_off' }],
        [{ text: t(grupo, 'grupo'), callback_data: 'menu_grupo' }, { text: t(grupo, 'ajustes'), callback_data: 'menu_ajustes' }],
        [{ text: t(grupo, 'inicio'), callback_data: 'menu_inicio' }]
      ]
    }
  };
}

function texto(grupo) {
  const estado = grupo.goodbyeEnabled ? `✅ ${t(grupo, 'activado')}` : `❌ ${t(grupo, 'desactivado')}`;
  return `${t(grupo, 'despedidaTitulo')}\n\n${t(grupo, 'despedidaEstado')}: ${estado}\n\n${t(grupo, 'despedidaAyuda')}`;
}

async function cambiar(ctx, activo) {
  if (!(await requireAdmin(ctx))) return;
  const grupo = db.setGrupo(ctx.chat.id, { goodbyeEnabled: activo });
  return ctx.editMessageText(texto(grupo), menu(grupo));
}

module.exports = (bot) => {
  bot.command('despedida', async (ctx) => {
    if (!isGroup(ctx)) return ctx.reply(t({}, 'soloGrupoDespedida'));
    const grupo = db.getGrupo(ctx.chat.id);
    return ctx.reply(texto(grupo), menu(grupo));
  });

  bot.command('despedida_on', async (ctx) => {
    if (!isGroup(ctx)) return ctx.reply(t({}, 'soloGrupoDespedida'));
    if (!(await requireAdmin(ctx))) return;
    const grupo = db.setGrupo(ctx.chat.id, { goodbyeEnabled: true });
    return ctx.reply(t(grupo, 'despedidaActivada'));
  });

  bot.command('despedida_off', async (ctx) => {
    if (!isGroup(ctx)) return ctx.reply(t({}, 'soloGrupoDespedida'));
    if (!(await requireAdmin(ctx))) return;
    const grupo = db.setGrupo(ctx.chat.id, { goodbyeEnabled: false });
    return ctx.reply(t(grupo, 'despedidaDesactivada'));
  });

  bot.action('despedida_on', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    if (!isGroup(ctx)) return;
    return cambiar(ctx, true);
  });

  bot.action('despedida_off', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    if (!isGroup(ctx)) return;
    return cambiar(ctx, false);
  });

  bot.on('left_chat_member', async (ctx) => {
    if (!isGroup(ctx)) return;

    const grupo = db.getGrupo(ctx.chat.id);
    const usuario = ctx.message.left_chat_member;

    if (!grupo.goodbyeEnabled || !usuario || usuario.is_bot) return;

    const nombre = [usuario.first_name, usuario.last_name].filter(Boolean).join(' ') || 'Usuario';
    let miembros = '—';

    try {
      miembros = await ctx.telegram.callApi('getChatMemberCount', { chat_id: ctx.chat.id });
    } catch {}

    const textoSalida = `${t(grupo, 'despedidaMensaje')}\n\n👤 ${nombre}\n${t(grupo, 'despedidaGrupo', { grupo: ctx.chat.title || 'Grupo' })}\n👥 ${t(grupo, 'despedidaMiembros', { cantidad: miembros })}`;
    return ctx.reply(textoSalida);
  });
};
