import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema.js";

const dbUrl = process.env.DATABASE_URL;

console.log("Current environment keys:", Object.keys(process.env).join(", "));
if (!dbUrl) {
  console.error("DEBUG: DATABASE_URL is missing or undefined.");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Basic sanitization: trim whitespace and remove problematic search params
export let sanitizedUrl = dbUrl.trim();
try {
  const url = new URL(sanitizedUrl);

  // Log masked URL for debugging
  const maskedUrl = `${url.protocol}//${url.username}:****@${url.host}${url.pathname}${url.search}`;
  console.log("DEBUG: Database connection string detected:", maskedUrl);

  let changed = false;
  if (url.searchParams.has('channel_binding')) {
    url.searchParams.delete('channel_binding');
    changed = true;
  }

  // sslmode=require is standard for Neon, but sometimes drivers handle it internally
  // We'll keep it unless we find reason to remove it specifically.

  if (changed) {
    sanitizedUrl = url.toString();
    console.log("DEBUG: Sanitized URL (removed channel_binding)");
  }
} catch (e) {
  console.warn("DEBUG: DATABASE_URL parsing failed, using trimmed raw string.");
}

console.log("Initializing database connection...");
const sql = neon(sanitizedUrl);
console.log("Neon client created. Initializing Drizzle with schema...");

// Export db directly. Drizzle 0.33+ should handle the neon client correctly.
// If there's a proxy issue, this direct export avoids it.
export const db = drizzle(sql, { schema });
console.log("Database storage initialized.");

// Keep getDb for compatibility if needed, but we'll use the direct export
export function getDb() {
  return db;
}
