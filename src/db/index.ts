
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Initialize the Pool with the connection string from environment variables
// Note: In production or a real deployment, you'd use a connection string provided by Neon or similar.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
