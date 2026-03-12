import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Neon HTTP driver doesn't support some postgres query params like channel_binding
// which might be present in some connection strings and cause crashes during init.
let sanitizedUrl = dbUrl;
try {
  const url = new URL(dbUrl);
  if (url.searchParams.has('channel_binding')) {
    console.log("Removing unsupported 'channel_binding' parameter from DATABASE_URL");
    url.searchParams.delete('channel_binding');
    sanitizedUrl = url.toString();
  }
} catch (e) {
  console.warn("Failed to parse DATABASE_URL for sanitization, using as is.");
}

console.log("Initializing database connection...");
const sql = neon(sanitizedUrl);
export const db = drizzle(sql, { schema });
console.log("Database connection initialized.");
