// ULTRA-ROBUST Vercel entry point.
// Uses dynamic imports to catch EVERY possible error during module evaluation.

export default async function handler(req: any, res: any) {
  try {
    // 1. Dynamic import of the main app and initialization logic
    const { default: app, initPromise } = await import("../server/api-handler");

    // 2. Wait for initialization (DB connections, routes, etc.)
    await initPromise;

    // 3. Delegate to the Express app
    return app(req, res);
  } catch (err: any) {
    // CATCH ALL: If anything fails (import, init, or execution), return a clean 500.
    console.error("CRITICAL BOOTSTRAP FAILURE:", err);
    console.error("Error Name:", err?.name);
    console.error("Error Message:", err?.message);
    if (err?.stack) console.error("Stack Trace:", err.stack);

    res.status(500).json({
      error: "Serverless function execution failed during bootstrap",
      message: err?.message ?? String(err),
      db_url_present: !!process.env.DATABASE_URL,
      node_env: process.env.NODE_ENV,
      stack: err?.stack
    });
  }
}
