const { BOT_NAME } = require('../lib/config');
const db = require('../lib/db');
const { requireAdmin, isGroup } = require('../lib/permissions');

function menuAjustes(grupo) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: `🛡️ Antilink ${grupo.antilink ? 'ON' : 'OFF'}`, callback_data: 'ajustes_antilink' }],
        [{ text: '🌐 Idioma', callback_data: 'ajustes_idioma' }, { text: '🔤 Prefijo', callback_data: 'ajustes_prefijo' }],
        [{ text: '🛡️ Seguridad', callback_data: 'menu_seguridad' }, { text: '⬅️ Inicio', callback_data: 'menu_inicio' }]
      ]
    }
  };
}

function textoAjustes(grupo) {
  return `⚙️ Ajustes de ${BOT_NAME}\n\n🛡️ Antilink: ${grupo.antilink ? '✅ Activado' : '❌ Desactivado'}\n🌐 Idioma: ${grupo.language}\n🔤 Prefijo: ${grupo.prefix}\n\nSelecciona una opción:`;
}

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery();

    if (!isGroup(ctx)) {
      return ctx.reply('ℹ️ Los ajustes de grupo solo están disponibles en grupos.');
    }

    const grupo = db.getGrupo(ctx.chat.id);

    if (ctx.updateType === 'callback_query') {
      return ctx.editMessageText(textoAjustes(grupo), menuAjustes(grupo));
    }

    return ctx.reply(textoAjustes(grupo), menuAjustes(grupo));
  };

  bot.command('ajustes', responder);
  bot.action('menu_ajustes', responder);

  bot.action('ajustes_antilink', async (ctx) => {
    await ctx.answerCbQuery();

    if (!(await requireAdmin(ctx))) return;

    const grupo = db.getGrupo(ctx.chat.id);
    const actualizado = db.setGrupo(ctx.chat.id, { antilink: !grupo.antilink });

    return ctx.editMessageText(textoAjustes(actualizado), menuAjustes(actualizado));
  });

  bot.action('ajustes_idioma', async (ctx) => {
    await ctx.answerCbQuery();

    if (!(await requireAdmin(ctx))) return;

    const grupo = db.getGrupo(ctx.chat.id);

    return ctx.editMessageText(
      `🌐 Idioma del grupo\n\nIdioma actual: ${grupo.language}\n\nSelecciona el idioma:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🇪🇸 Español', callback_data: 'ajustes_idioma_es' }, { text: '🇺🇸 English', callback_data: 'ajustes_idioma_en' }],
            [{ text: '⬅️ Ajustes', callback_data: 'menu_ajustes' }]
          ]
        }
      }
    );
  });

  for (const idioma of ['es', 'en']) {
    bot.action(`ajustes_idioma_${idioma}`, async (ctx) => {
      await ctx.answerCbQuery();

      if (!(await requireAdmin(ctx))) return;

      db.setGrupo(ctx.chat.id, { language: idioma });
      return responder(ctx);
    });
  }

  bot.action('ajustes_prefijo', async (ctx) => {
    await ctx.answerCbQuery();

    if (!(await requireAdmin(ctx))) return;

    const grupo = db.getGrupo(ctx.chat.id);

    return ctx.editMessageText(
      `🔤 Prefijo de comandos\n\nPrefijo actual: ${grupo.prefix}\n\nPara cambiarlo usa:\n/prefijo !\n/prefijo .\n/prefijo /`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Ajustes', callback_data: 'menu_ajustes' }]]
        }
      }
    );
  });

  bot.command('idioma', async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    const idioma = ctx.message.text.trim().split(/\s+/)[1]?.toLowerCase();

    if (!['es', 'en'].includes(idioma)) {
      return ctx.reply('Uso: /idioma es|en');
    }

    db.setGrupo(ctx.chat.id, { language: idioma });
    return ctx.reply(`🌐 Idioma actualizado: ${idioma}`);
  });

  bot.command('prefijo', async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    const prefijo = ctx.message.text.trim().split(/\s+/)[1];

    if (!prefijo || prefijo.length > 2 || !/^[!./#?$]+$/.test(prefijo)) {
      return ctx.reply('Uso: /prefijo !');
    }

    db.setGrupo(ctx.chat.id, { prefix: prefijo });
    return ctx.reply(`🔤 Prefijo guardado: ${prefijo}`);
  });
};
