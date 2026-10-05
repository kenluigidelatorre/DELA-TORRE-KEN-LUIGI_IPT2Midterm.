// Import the PostgreSQL connection pool.
const { Pool } = require("pg");

// Load environment variables from the .env file.
require("dotenv").config();

// Configure the database connection using environment variables.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Export the pool so controllers can execute database queries.
module.exports = pool;