// Diagnostic handler: no static imports, tests modules via dynamic import to identify crashes
export default async function handler(req: any, res: any) {
  const results: Record<string, any> = {};

  // Check env vars
  results.env = {
    hasDbUrl: !!process.env.DATABASE_URL,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) ?? "NOT SET",
    nodeVersion: process.version,
  };

  // Test each module individually with dynamic imports to catch which one crashes
  try {
    await import("../server/db");
    results.db = "ok";
  } catch (err: any) {
    results.db = { error: err?.message ?? String(err) };
  }

  try {
    await import("../server/storage");
    results.storage = "ok";
  } catch (err: any) {
    results.storage = { error: err?.message ?? String(err) };
  }

  try {
    await import("../server/auth");
    results.auth = "ok";
  } catch (err: any) {
    results.auth = { error: err?.message ?? String(err) };
  }

  try {
    await import("../server/routes");
    results.routes = "ok";
  } catch (err: any) {
    results.routes = { error: err?.message ?? String(err) };
  }

  try {
    await import("../server/api-handler");
    results.apiHandler = "ok";
  } catch (err: any) {
    results.apiHandler = { error: err?.message ?? String(err) };
  }

  res.status(200).json({ diagnostic: true, results });
}
