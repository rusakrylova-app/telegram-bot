require('dotenv').config();
const { initDb } = require('./db');
const { setupBot } = require('./bot');

async function main() {
  console.log('🚀 Запуск бота...');
  
  await initDb();
  console.log('✅ База данных готова');

  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error('❌ BOT_TOKEN не задан в .env');
    process.exit(1);
  }

  const bot = setupBot(token);
  bot.start();
  console.log('🤖 Бот успешно запущен!');
}

main().catch((error) => {
  console.error('❌ Ошибка при запуске:', error);
});
