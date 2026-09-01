const { clearState } = require('../../db/state');

module.exports = async (ctx) => {
  const userId = ctx.from.id;
  await clearState(userId);
  await ctx.reply('❌ Процесс отменён. Используйте /new для новой записи.');
};
