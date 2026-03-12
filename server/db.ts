import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema.js";

// We use a lazy initialization pattern to avoid top-level throws 
// that can crash serverless functions during module evaluation.
let dbInstance: any = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  let sanitizedUrl = dbUrl;
  try {
    const url = new URL(dbUrl);
    if (url.searchParams.has('channel_binding')) {
      url.searchParams.delete('channel_binding');
      sanitizedUrl = url.toString();
    }
  } catch (e) {
    // Ignore URL parsing errors and use original string
  }

  const sql = neon(sanitizedUrl);
  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}

// Export a proxy or just the getter to maintain compatibility with existing imports
export const db = new Proxy({} as any, {
  get(_, prop) {
    const instance = getDb();
    return instance[prop];
  }
});
