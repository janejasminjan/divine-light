import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

const canUsePgEnv =
  Boolean(process.env.PGHOST) &&
  Boolean(process.env.PGUSER) &&
  Boolean(process.env.PGDATABASE);

if (!databaseUrl && !canUsePgEnv) {
  throw new Error(
    "DATABASE_URL must be set, or PGHOST/PGUSER/PGDATABASE must be available.",
  );
}

const poolConfig: pg.PoolConfig = databaseUrl
  ? { connectionString: databaseUrl }
  : {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl:
        process.env.PGSSLMODE === "require"
          ? { rejectUnauthorized: false }
          : undefined,
    };

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

export * from "./schema";
