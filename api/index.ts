// ULTRA-ROBUST Vercel entry point with static imports for better bundling.
// Deployment trigger: 2026-03-12T16:08
import app, { initPromise } from "../server/api-handler.js";

export default async function handler(req: any, res: any) {
  try {
    // Wait for initialization (DB connections, routes, etc.)
    await initPromise;

    // Delegate to the Express app
    return app(req, res);
  } catch (err: any) {
    // CATCH ALL: If anything fails during init or execution, return a clean 500.
    console.error("CRITICAL ERROR during request execution:", err);
    console.error("Error Name:", err?.name);
    console.error("Error Message:", err?.message);
    if (err?.stack) console.error("Stack Trace:", err.stack);

    res.status(500).json({
      error: "Serverless function execution failed",
      message: err?.message ?? String(err),
      db_url_present: !!process.env.DATABASE_URL,
      node_env: process.env.NODE_ENV,
      stack: err?.stack
    });
  }
}
