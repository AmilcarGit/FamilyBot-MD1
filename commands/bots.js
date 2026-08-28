const os = require('os');
const { startTime, BOT_NAME } = require('../lib/config');
const db = require('../lib/db');
const { t } = require('../lib/i18n');

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return `${h}h ${m}m ${seg}s`;
}

module.exports = (bot) => {
  const responder = async (ctx) => {
    if (ctx.updateType === 'callback_query') await ctx.answerCbQuery();
    const grupo = ctx.chat?.type !== 'private' ? db.getGrupo(ctx.chat.id) : { language: 'es' };
    const uptime = formatUptime(Date.now() - startTime);
    const ram = (os.totalmem() - os.freemem()) / 1024 / 1024;
    return ctx.replyWithMarkdown(
      `🤖 *${BOT_NAME} — ${t(grupo, 'estadoSistema')}*\n\n` +
      `🟢 *${t(grupo, 'estado')}:* Online 24/7\n` +
      `⏱️ *${t(grupo, 'uptime')}:* ${uptime}\n` +
      `💾 *${t(grupo, 'ram')}:* ${ram.toFixed(1)} MB\n` +
      `🖥️ *${t(grupo, 'plataforma')}:* ${os.platform()}\n` +
      `📦 *Node:* ${process.version}`
    );
  };

  bot.command('bots', responder);
  bot.command('status', responder);
  bot.action('menu_bots', responder);
};
