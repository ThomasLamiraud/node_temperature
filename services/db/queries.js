const DB_PATH = './db/temperature_db.db';
const SENSOR_READINGS_SELECT = `SELECT id, temperature AS value, humidity, date FROM sensor_readings`;
const memoryRows = [];

function isFakeModeEnabled() {
  return process.env.DHT_FAKE_TEMPERATURE !== undefined && process.env.DHT_FAKE_HUMIDITY !== undefined;
}

function getSqlite() {
  try {
    return require("sqlite3").verbose();
  } catch (error) {
    if (isFakeModeEnabled()) {
      return null;
    }

    throw error;
  }
}

function createDb() {
  const sqlite3 = getSqlite();
  return sqlite3 ? new sqlite3.Database(DB_PATH) : null;
}

function insertMemoryRow(value, humidity) {
  memoryRows.push({
    id: memoryRows.length + 1,
    value,
    temperature: value,
    humidity,
    date: new Date().toISOString(),
  });
}

function selectRows(query, params = []) {
  const db = createDb();
  if (!db) return Promise.resolve(memoryRows.slice(-50));

  return new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
      db.close();

      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

function getRangeQuery(limit) {
  if (limit === '1h') {
    return {
      query: `${SENSOR_READINGS_SELECT} WHERE date >= ? ORDER BY date ASC;`,
      params: [new Date(Date.now() - 60 * 60 * 1000).toISOString()],
    };
  }

  if (limit === '24h') {
    return {
      query: `${SENSOR_READINGS_SELECT} WHERE date >= ? ORDER BY date ASC;`,
      params: [new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()],
    };
  }

  if (limit === '7d') {
    return {
      query: `${SENSOR_READINGS_SELECT} WHERE date >= ? ORDER BY date ASC;`,
      params: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()],
    };
  }

  return {
    query: `SELECT id, temperature AS value, humidity, date FROM (SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 50) ORDER BY id ASC;`,
    params: [],
  };
}

exports.insertRow = function(value, humidity) {
  const db = createDb();
  if (!db) {
    insertMemoryRow(value, humidity);
    return;
  }

  db.run(
    `INSERT INTO sensor_readings (temperature, humidity, date) VALUES (?, ?, ?)`,
    [value, humidity, new Date().toISOString()],
    function (error) {
      if (error) {
        console.error("error", error.message);
        db.close();
        return;
      }

      console.log(`Inserted a row with the ID: ${this.lastID}`);
      db.close();
    }
  );
};

exports.selectLastTemperature = async function() {
  const db = createDb();
  if (!db) return memoryRows.slice(-1);

  return new Promise((resolve, reject) => {
    db.all(`${SENSOR_READINGS_SELECT} ORDER BY id DESC LIMIT 1;`, (error, rows) => {
      db.close();

      if(error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
};

exports.selectTemperaturesByRange = async function(limit) {
  const { query, params } = getRangeQuery(limit);
  return selectRows(query, params);
};

exports.selectAllTemperatures = async function() {
  return exports.selectTemperaturesByRange();
};