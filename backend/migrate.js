const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB = process.env.DATABASE_FILE || path.join(__dirname,'data.sqlite');
const db = new sqlite3.Database(DB);
const sql = fs.readFileSync(path.join(__dirname,'migrations.sql'),'utf8');

db.exec(sql, err => {
  if (err) console.error('Migration error', err);
  else console.log('Migrations applied');
  db.close();
});
