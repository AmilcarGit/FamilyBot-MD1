const { OWNER_ID } = require('./config');

function getUserId(ctx) {
  return ctx?.from?.id != null ? String(ctx.from.id) : null;
}

function isOwner(ctx) {
  const userId = getUserId(ctx);
  return Boolean(userId && OWNER_ID && userId === String(OWNER_ID));
}

function isGroup(ctx) {
  return Boolean(ctx?.chat && ctx.chat.type !== 'private');
}

async function getMemberStatus(ctx, userId = ctx?.from?.id) {
  if (!ctx?.chat || ctx.chat.type === 'private' || userId == null) return null;

  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, userId);
    return member?.status || null;
  } catch (error) {
    console.error('⚠️ No se pudo consultar el estado del miembro:', error.message);
    return null;
  }
}

async function isAdmin(ctx) {
  if (isOwner(ctx)) return true;
  const status = await getMemberStatus(ctx);
  return status === 'administrator' || status === 'creator';
}

async function isBotAdmin(ctx) {
  if (!isGroup(ctx) || !ctx.botInfo?.id) return false;
  const status = await getMemberStatus(ctx, ctx.botInfo.id);
  return status === 'administrator' || status === 'creator';
}

async function requireAdmin(ctx, options = {}) {
  const { allowPrivate = false, message = '⚠️ Solo administradores pueden usar este comando.' } = options;

  if (!isGroup(ctx)) {
    if (allowPrivate || isOwner(ctx)) return true;
    await ctx.reply('ℹ️ Este comando solo está disponible en grupos.');
    return false;
  }

  if (await isAdmin(ctx)) return true;

  await ctx.reply(message);
  return false;
}

async function requireOwner(ctx, message = '⛔ Este comando solo está disponible para el propietario del bot.') {
  if (isOwner(ctx)) return true;
  await ctx.reply(message);
  return false;
}

module.exports = {
  getUserId,
  isOwner,
  isGroup,
  getMemberStatus,
  isAdmin,
  isBotAdmin,
  requireAdmin,
  requireOwner
};
