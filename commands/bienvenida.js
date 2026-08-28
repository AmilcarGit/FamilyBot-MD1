const db = require('../lib/db');
const { t } = require('../lib/i18n');
const { isGroup, requireAdmin } = require('../lib/permissions');

function opciones(grupo) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: `👋 ${t(grupo, 'bienvenida')}`, callback_data: 'bienvenida_menu' }],
        [{ text: t(grupo, 'grupo'), callback_data: 'menu_grupo' }, { text: t(grupo, 'inicio'), callback_data: 'menu_inicio' }]
      ]
    }
  };
}

function texto(grupo) {
  const estado = grupo.welcomeEnabled ? t(grupo, 'activado') : t(grupo, 'desactivado');
  return `${t(grupo, 'bienvenidaTitulo')}\n\n${t(grupo, 'estado')}: ${estado}\n\n${t(grupo, 'bienvenidaAyuda')}`;
}

async function cambiar(ctx, activado) {
  if (!isGroup(ctx)) return ctx.reply(t(db.getGrupo(ctx.chat.id), 'soloGrupos'));
  if (!(await requireAdmin(ctx))) return;
  const grupo = db.setGrupo(ctx.chat.id, { welcomeEnabled: activado });
  return ctx.reply(t(grupo, activado ? 'bienvenidaActivada' : 'bienvenidaDesactivada'), opciones(grupo));
}

async function menu(ctx) {
  if (ctx.updateType === 'callback_query') await ctx.answerCbQuery().catch(() => {});
  if (!isGroup(ctx)) return ctx.reply(t(db.getGrupo(ctx.chat.id), 'soloGrupos'));
  const grupo = db.getGrupo(ctx.chat.id);
  if (ctx.updateType === 'callback_query') return ctx.editMessageText(texto(grupo), opciones(grupo));
  return ctx.reply(texto(grupo), opciones(grupo));
}

async function bienvenida(ctx) {
  if (!ctx.message?.new_chat_members?.length) return;
  const grupo = db.getGrupo(ctx.chat.id);
  if (!grupo.welcomeEnabled) return;

  const nuevos = ctx.message.new_chat_members.filter((usuario) => !usuario.is_bot);
  if (!nuevos.length) return;

  const nombres = nuevos.map((usuario) => {
    const nombre = [usuario.first_name, usuario.last_name].filter(Boolean).join(' ') || 'Usuario';
    return `[${nombre}](tg://user?id=${usuario.id})`;
  });

  const mensaje = `${t(grupo, 'bienvenidaMensaje')}\n\n${nombres.map((nombre) => `👋 ${nombre}`).join('\n')}\n\n${t(grupo, 'bienvenidaFinal')}`;
  return ctx.reply(mensaje, { parse_mode: 'Markdown' });
}

module.exports = (bot) => {
  bot.command('bienvenida', menu);
  bot.command('welcome', menu);
  bot.command('bienvenida_on', (ctx) => cambiar(ctx, true));
  bot.command('bienvenida_off', (ctx) => cambiar(ctx, false));
  bot.action('bienvenida_menu', menu);
  bot.on('new_chat_members', bienvenida);
};
