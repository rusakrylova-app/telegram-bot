const { Bot } = require('grammy');
const startCommand = require('./commands/start');
const newCommand = require('./commands/new');
const cancelCommand = require('./commands/cancel');
const sosCommand = require('./commands/sos');
const helpCommand = require('./commands/help');
const { handleMessage } = require('./wizard');

function setupBot(token) {
  const bot = new Bot(token);

  bot.command('start', startCommand);
  bot.command('new', newCommand);
  bot.command('cancel', cancelCommand);
  bot.command('sos', sosCommand);
  bot.command('help', helpCommand);

  bot.on('message:text', async (ctx) => {
    await handleMessage(ctx);
  });

  bot.catch((err) => {
    console.error('❌ Ошибка в боте:', err);
  });

  return bot;
}

module.exports = { setupBot };
