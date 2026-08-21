import { Pool } from "pg";
import { envVariables } from "./env.ts";

export const pool = new Pool({
  host: envVariables.DB_HOST,
  port: envVariables.DB_PORT,
  user: envVariables.DB_USER,
  password: envVariables.DB_PASSWORD,
  database: envVariables.DB_NAME,
});

export const testConnection = async () => {
  await pool.query("SELECT 1");
  console.log("Database connected successfully");
};
