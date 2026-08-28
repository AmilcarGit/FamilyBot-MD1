const { OWNER_ID } = require('./config');

function getUserId(ctx) {
  return ctx?.from?.id != null ? String(ctx.from.id) : null;
}

function isOwner(ctx) {
  const userId = getUserId(ctx);
  return Boolean(userId && OWNER_ID && userId === String(OWNER_ID));
}

function isGroup(ctx) {
  return Boolean(ctx?.chat && ['group', 'supergroup'].includes(ctx.chat.type));
}

async function getMemberStatus(ctx, userId = ctx?.from?.id) {
  if (!isGroup(ctx) || userId == null) return null;

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
  if (!isGroup(ctx)) return false;

  const botId = ctx.botInfo?.id;
  if (!botId) return false;

  const status = await getMemberStatus(ctx, botId);
  return status === 'administrator' || status === 'creator';
}

async function requireAdmin(ctx, options = {}) {
  const { allowPrivate = false, message = '⚠️ Solo administradores pueden usar este comando.' } = options;

  if (!isGroup(ctx)) {
    if (allowPrivate && isOwner(ctx)) return true;
    await ctx.reply('ℹ️ Este comando solo está disponible en grupos.');
    return false;
  }

  if (await isAdmin(ctx)) return true;

  await ctx.reply(message);
  return false;
}

async function requireBotAdmin(ctx) {
  if (await isBotAdmin(ctx)) return true;
  await ctx.reply('⚠️ Necesito permisos de administrador para realizar esta acción.');
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
  requireBotAdmin,
  requireOwner
};
