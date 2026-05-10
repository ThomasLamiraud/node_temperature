const fs = require("fs");
const db_file_path = "./db/temperature_db.db"

function getSqlite() {
  try {
    return require("sqlite3").verbose();
  } catch (error) {
    if (process.env.DHT_FAKE_TEMPERATURE !== undefined && process.env.DHT_FAKE_HUMIDITY !== undefined) {
      console.warn("sqlite3 is not available; using in-memory history for local fake sensor mode.");
      return null;
    }

    throw error;
  }
}

function createDbConnection() {
  const sqlite3 = getSqlite();
  if (!sqlite3) return Promise.resolve();

  fs.mkdirSync("./db", { recursive: true });

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(db_file_path, (error) => {
      if (error) {
        reject(error);
        return;
      }

      db.serialize(() => {
        createSensorReadingsTable(db, (createError) => {
          if (createError) {
            reject(createError);
            return;
          }

          db.close((closeError) => {
            if (closeError) {
              reject(closeError);
              return;
            }

            console.log("Connection with SQLite has been established");
            resolve();
          });
        });
      });
    });
  });
}

function createSensorReadingsTable(db, callback) {
  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_readings
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature integer NOT NULL,
      humidity real,
      date TEXT
    );
  `, callback);
}

module.exports = createDbConnection;