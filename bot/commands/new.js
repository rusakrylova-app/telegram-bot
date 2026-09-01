const { setState } = require('../../db/state');

module.exports = async (ctx) => {
  const userId = ctx.from.id;
  await setState(userId, 'situation', {});
  await ctx.reply(
    '✍️ *Новая запись*\n\nОпишите ситуацию, которая вас беспокоит.\nНапример: "Я опоздала на важную встречу".',
    { parse_mode: 'Markdown' }
  );
};
