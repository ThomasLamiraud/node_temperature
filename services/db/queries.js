const DB_PATH = './db/temperature_db.db'
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

exports.insertRow = function(value, humidity) {
  const sqlite3 = getSqlite();
  if (!sqlite3) {
    memoryRows.push({
      id: memoryRows.length + 1,
      value,
      temperature: value,
      humidity,
      date: new Date().toISOString(),
    });
    return;
  }

  let db = new sqlite3.Database(DB_PATH);

  db.run(
    `INSERT INTO sensor_readings (temperature, humidity, date) VALUES (?, ?, ?)`,
    [value, humidity, new Date().toISOString()],
    function (error) {
      if (error) {
        console.error("error", error.message);
      }
      console.log(`Inserted a row with the ID: ${this.lastID}`);
    }
  );

  // close the database connection
  db.close();
}

exports.selectLastTemperature = async function() {
  const sqlite3 = getSqlite();
  if (!sqlite3) {
    return memoryRows.slice(-1);
  }

  let db = new sqlite3.Database(DB_PATH);

  return new Promise((resolve, reject) => {
    db.all(`SELECT id, temperature AS value, humidity, date FROM sensor_readings ORDER BY id DESC LIMIT 1;`, (error, rows) => {
      if(error) {
        reject(error)
      }
      console.log('selectLastTemperature', {rows});
      resolve(rows)
    })

    db.close();
  })
}

exports.selectTemperaturesByRange = async function(limit) {
  const sqlite3 = getSqlite();
  if (!sqlite3) {
    return memoryRows.slice(-50);
  }

  let db = new sqlite3.Database(DB_PATH);
  
  // Calculate start date based on range (default to 50 items if no date range is used)
  let query = `SELECT id, temperature AS value, humidity, date FROM (SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 50) ORDER BY id ASC;`;
  let params = [];

  if (limit === '1h') {
      // 1 hour ago
      const date = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      query = `SELECT id, temperature AS value, humidity, date FROM sensor_readings WHERE date >= ? ORDER BY date ASC;`;
      params = [date];
  } else if (limit === '24h') {
      // 24 hours ago
      const date = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = `SELECT id, temperature AS value, humidity, date FROM sensor_readings WHERE date >= ? ORDER BY date ASC;`;
      params = [date];
  } else if (limit === '7d') {
      // 7 days ago
      const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = `SELECT id, temperature AS value, humidity, date FROM sensor_readings WHERE date >= ? ORDER BY date ASC;`;
      params = [date];
  }

  return new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
      if(error) {
        reject(error)
      }
      resolve(rows)
    })

    db.close();
  })
}

exports.selectAllTemperatures = async function() {
  return exports.selectTemperaturesByRange();
}