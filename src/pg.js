// Database Connection
const Pool = require("pg").Pool;
const pool = new Pool({
  user: "root",
  host: "192.168.100.30",
  database: "ndau",
  password: "12345",
  port: "5432",
  // ssl: true
});
pool.connect(async (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Pg Database Connected");
  }
});

global.pool = pool;
