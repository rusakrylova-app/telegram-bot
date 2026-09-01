const { getDb } = require('./index');

async function getState(userId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT step, temp_data FROM user_states WHERE user_id = ?',
      [userId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          resolve({ step: 'idle', temp_data: {} });
          return;
        }
        resolve({
          step: row.step,
          temp_data: row.temp_data ? JSON.parse(row.temp_data) : {}
        });
      }
    );
  });
}

async function setState(userId, step, tempData) {
  const db = getDb();
  const now = new Date().toISOString();
  const tempJson = JSON.stringify(tempData || {});
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO user_states (user_id, step, temp_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         step = excluded.step,
         temp_data = excluded.temp_data,
         updated_at = excluded.updated_at`,
      [userId, step, tempJson, now, now],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

async function clearState(userId) {
  await setState(userId, 'idle', {});
}

module.exports = { getState, setState, clearState };