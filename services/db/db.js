const { log } = require("console");
const fs = require("fs");
const db_file_path = "./db/temperature_db.db"
const sqlite3 = require("sqlite3").verbose();

function createDbConnection() {
  console.log("createDbConnection()")
  if (fs.existsSync(db_file_path)) {
    console.log("if")
    return new sqlite3.Database(db_file_path);
  } else {
    console.log("else")
    const db = new sqlite3.Database(db_file_path, (error) => {
      if (error) {
        console.log("error", error)
        return console.error(error.message);
      }
      createTable(db);
    });
    console.log("Connection with SQLite has been established");
    return db;
  }
}

function createTable(db) {
  console.log("create table")
    db.exec(`
    CREATE TABLE temperatures
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      value integer NOT NULL,
      date TEXT
    );
  `);
}

module.exports = createDbConnection;