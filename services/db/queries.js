const sqlite3 = require("sqlite3").verbose();
const DB_PATH = './db/temperature_db.db'

exports.insertRow = function(value) {
  let db = new sqlite3.Database(DB_PATH);

  // insert one row into the temperatures table
  db.run(
    `INSERT INTO temperatures (value, date) VALUES (?, ?)`,
    [value, new Date().toISOString()],
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
  let db = new sqlite3.Database(DB_PATH);

  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM temperatures ORDER BY temperatures.id DESC LIMIT 1;`, (error, rows) => {
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
  let db = new sqlite3.Database(DB_PATH);
  
  // Calculate start date based on range (default to 50 items if no date range is used)
  let query = `SELECT * FROM (SELECT * FROM temperatures ORDER BY id DESC LIMIT 50) ORDER BY id ASC;`;
  let params = [];

  if (limit === '1h') {
      // 1 hour ago
      const date = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      query = `SELECT * FROM temperatures WHERE date >= ? ORDER BY date ASC;`;
      params = [date];
  } else if (limit === '24h') {
      // 24 hours ago
      const date = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = `SELECT * FROM temperatures WHERE date >= ? ORDER BY date ASC;`;
      params = [date];
  } else if (limit === '7d') {
      // 7 days ago
      const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = `SELECT * FROM temperatures WHERE date >= ? ORDER BY date ASC;`;
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