require("dotenv").config();

// Database Connection
const Pool = require("pg").Pool;
const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database:process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
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
