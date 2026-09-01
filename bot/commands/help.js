module.exports = async (ctx) => {
  await ctx.reply(
    `📖 *Справка по командам*

/start — приветствие
/new — начать новую запись
/cancel — отменить процесс
/sos — телефон доверия
/help — эта справка`,
    { parse_mode: 'Markdown' }
  );
};
