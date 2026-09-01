// db/records.js
const { getDb } = require('./index');
const crypto = require('crypto');

async function saveRecord(record) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO records (
        id, user_id, chat_id, created_at, situation, 
        automatic_thoughts, emotions, cognitive_distortions, 
        alternative_thoughts, mood_before, mood_after, is_resolved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        record.user_id,
        record.chat_id,
        now,
        record.situation,
        JSON.stringify(record.automatic_thoughts),
        JSON.stringify(record.emotions),
        JSON.stringify(record.cognitive_distortions || []),
        JSON.stringify(record.alternative_thoughts || []),
        record.mood_before,
        record.mood_after,
        record.is_resolved ? 1 : 0
      ],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...record, created_at: now });
        }
      }
    );
  });
}

async function getRecords(userId, limit = 10) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM records WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            ...row,
            automatic_thoughts: JSON.parse(row.automatic_thoughts),
            emotions: JSON.parse(row.emotions),
            cognitive_distortions: row.cognitive_distortions ? JSON.parse(row.cognitive_distortions) : [],
            alternative_thoughts: row.alternative_thoughts ? JSON.parse(row.alternative_thoughts) : [],
            is_resolved: Boolean(row.is_resolved)
          })));
        }
      }
    );
  });
}

async function getRecordById(id, userId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM records WHERE id = ? AND user_id = ?`,
      [id, userId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (!row) {
            resolve(null);
          } else {
            resolve({
              ...row,
              automatic_thoughts: JSON.parse(row.automatic_thoughts),
              emotions: JSON.parse(row.emotions),
              cognitive_distortions: row.cognitive_distortions ? JSON.parse(row.cognitive_distortions) : [],
              alternative_thoughts: row.alternative_thoughts ? JSON.parse(row.alternative_thoughts) : [],
              is_resolved: Boolean(row.is_resolved)
            });
          }
        }
      }
    );
  });
}

module.exports = { saveRecord, getRecords, getRecordById };