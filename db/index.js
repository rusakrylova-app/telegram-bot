
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

async function initDb() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, '../data.db');
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Ошибка подключения к БД:', err);
        reject(err);
        return;
      }
      
      console.log('✅ Подключено к SQLite');
      
      // Создаём таблицу записей
      db.run(`
        CREATE TABLE IF NOT EXISTS records (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          chat_id INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          situation TEXT NOT NULL,
          automatic_thoughts TEXT NOT NULL,
          emotions TEXT NOT NULL,
          cognitive_distortions TEXT,
          alternative_thoughts TEXT,
          mood_before INTEGER NOT NULL,
          mood_after INTEGER NOT NULL,
          is_resolved INTEGER DEFAULT 0
        )
      `, (err) => {
        if (err) console.error('❌ Ошибка создания таблицы records:', err);
      });
      
      // Создаём таблицу состояний пользователей
      db.run(`
        CREATE TABLE IF NOT EXISTS user_states (
          user_id INTEGER PRIMARY KEY,
          step TEXT NOT NULL DEFAULT 'idle',
          temp_data TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `, (err) => {
        if (err) console.error('❌ Ошибка создания таблицы user_states:', err);
      });
      
      console.log('✅ Таблицы созданы/проверены');
      resolve(db);
    });
  });
}

function getDb() {
  if (!db) throw new Error('База данных не инициализирована');
  return db;
}

module.exports = { initDb, getDb };