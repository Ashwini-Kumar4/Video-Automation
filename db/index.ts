import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV !== "production") {
  console.warn(
    "⚠️ DATABASE_URL is not set. Please add your Neon connection string to .env.local"
  );
}

// Fallback to a mock connection string to prevent build-time crashes if DATABASE_URL is not set yet
const sql = neon(
  databaseUrl || "postgresql://placeholder:placeholder@ep-placeholder.neon.tech/neondb"
);

export const db = drizzle(sql, { schema });

export const isDbConfigured = Boolean(
  databaseUrl && databaseUrl.startsWith("postgres")
);

export { schema };
export * from "./schema";
