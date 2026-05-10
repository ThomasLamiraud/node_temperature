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

          migrateTemperaturesTable(db, (migrationError) => {
            if (migrationError) {
              reject(migrationError);
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

function migrateTemperaturesTable(db, callback) {
  db.get(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'temperatures';`,
    (error, table) => {
      if (error) {
        callback(error);
        return;
      }

      if (!table) {
        callback();
        return;
      }

      db.get(`SELECT COUNT(*) AS count FROM sensor_readings;`, (countError, row) => {
        if (countError) {
          callback(countError);
          return;
        }

        if (row.count > 0) {
          callback();
          return;
        }

        copyTemperatureRows(db, callback);
      });
    }
  );
}

function copyTemperatureRows(db, callback) {
  db.all(`PRAGMA table_info(temperatures);`, (error, columns) => {
    if (error) {
      callback(error);
      return;
    }

    const humidityExpression = columns.some(column => column.name === "humidity")
      ? "humidity"
      : "NULL";

    db.run(`
      INSERT INTO sensor_readings (id, temperature, humidity, date)
      SELECT id, value, ${humidityExpression}, date
      FROM temperatures;
    `, callback);
  });
}

module.exports = createDbConnection;