const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'parx.db');
const db = new sqlite3.Database(dbPath);

// Enable WAL mode for better concurrency
db.run('PRAGMA journal_mode = WAL');

// Initialize database schema
function initializeDatabase() {
  db.serialize(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS historical_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_path TEXT NOT NULL,
        value REAL NOT NULL,
        quality TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tag_timestamp ON historical_data(tag_path, timestamp);

      CREATE TABLE IF NOT EXISTS coils (
        id TEXT PRIMARY KEY,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        status TEXT NOT NULL,
        grade TEXT,
        target_thickness REAL,
        target_width REAL,
        length REAL,
        target_length REAL,
        stats TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER PRIMARY KEY,
        dashboard_layout TEXT,
        favorite_tags TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS alarms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_path TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        acknowledged INTEGER DEFAULT 0,
        acknowledged_by TEXT,
        acknowledged_at INTEGER
      );
    `);

    // Insert default users if they don't exist
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO users (username, password, role, name)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run('operator1', 'pass123', 'operator', 'Operator One');
    stmt.run('engineer1', 'pass123', 'engineer', 'Engineer One');
    stmt.run('manager1', 'pass123', 'manager', 'Manager One');
    stmt.finalize();

    console.log('Database initialized successfully');
  });
}

// Store historical tag data
function storeTagData(tagPath, value, quality, timestamp) {
  db.run(`
    INSERT INTO historical_data (tag_path, value, quality, timestamp)
    VALUES (?, ?, ?, ?)
  `, [tagPath, value, quality, timestamp]);
}

// Get historical data for a tag
function getHistoricalData(tagPath, startTime, endTime, limit = 1000) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT tag_path, value, quality, timestamp
      FROM historical_data
      WHERE tag_path = ? AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
      LIMIT ?
    `, [tagPath, startTime, endTime, limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Store coil data
function storeCoil(coilData) {
  db.run(`
    INSERT OR REPLACE INTO coils
    (id, start_time, end_time, status, grade, target_thickness, target_width, length, target_length, stats)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    coilData.id,
    coilData.startTime,
    coilData.endTime || null,
    coilData.status,
    coilData.grade || null,
    coilData.targetThickness || null,
    coilData.targetWidth || null,
    coilData.length || null,
    coilData.targetLength || null,
    coilData.stats ? JSON.stringify(coilData.stats) : null
  ]);
}

// Get coils
function getCoils(limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM coils
      ORDER BY start_time DESC
      LIMIT ?
    `, [limit], (err, rows) => {
      if (err) reject(err);
      else {
        const coils = (rows || []).map(row => ({
          ...row,
          stats: row.stats ? JSON.parse(row.stats) : null
        }));
        resolve(coils);
      }
    });
  });
}

// Authenticate user
function authenticateUser(username, password) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT id, username, role, name
      FROM users
      WHERE username = ? AND password = ?
    `, [username, password], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

// Store alarm
function storeAlarm(tagPath, severity, message, timestamp) {
  db.run(`
    INSERT INTO alarms (tag_path, severity, message, timestamp)
    VALUES (?, ?, ?, ?)
  `, [tagPath, severity, message, timestamp]);
}

// Get active alarms
function getActiveAlarms() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM alarms
      WHERE acknowledged = 0
      ORDER BY timestamp DESC
    `, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Clean up old data (keep last 7 days)
function cleanupOldData() {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  db.run(`
    DELETE FROM historical_data
    WHERE timestamp < ?
  `, [sevenDaysAgo], function(err) {
    if (err) {
      console.error('Error cleaning up old data:', err);
    } else {
      console.log(`Cleaned up ${this.changes} old records`);
    }
  });
}

// Schedule cleanup to run daily
setInterval(cleanupOldData, 24 * 60 * 60 * 1000);

module.exports = {
  db,
  initializeDatabase,
  storeTagData,
  getHistoricalData,
  storeCoil,
  getCoils,
  authenticateUser,
  storeAlarm,
  getActiveAlarms
};
