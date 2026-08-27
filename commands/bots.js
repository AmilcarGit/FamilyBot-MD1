const os = require('os');
const { startTime, BOT_NAME } = require('../lib/config');

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
    const uptime = formatUptime(Date.now() - startTime);
    const ram = (os.totalmem() - os.freemem()) / 1024 / 1024;
    ctx.replyWithMarkdown(
      `🤖 *${BOT_NAME} — Estado del Sistema*\n\n` +
      `🟢 *Estado:* Online 24/7\n` +
      `⏱️ *Uptime:* ${uptime}\n` +
      `💾 *RAM usada:* ${ram.toFixed(1)} MB\n` +
      `🖥️ *Plataforma:* ${os.platform()}\n` +
      `📦 *Node:* ${process.version}`
    );
  };

  bot.command('bots', responder);
  bot.command('status', responder);
  bot.action('menu_bots', responder);
};
