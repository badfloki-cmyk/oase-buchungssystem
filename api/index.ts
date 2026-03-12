import app, { initPromise } from "../server/api-handler";

// Attach catch immediately so Node.js doesn't crash on unhandled rejection
initPromise.catch((err) => {
  console.error("GLOBAL INIT PROMISE REJECTION:", err);
});

// Diagnostic route for testing connection
app.get("/api/health", async (req: any, res: any) => {
  try {
    await initPromise;
    const { db } = await import("../server/db");
    const { users } = await import("../shared/schema");
    // Simple query to test DB
    await db.select().from(users).limit(1);
    res.json({ status: "ok", db: "connected", env: process.env.NODE_ENV });
  } catch (err: any) {
    console.error("Health check failed:", err);
    res.status(500).json({
      status: "error",
      message: err?.message ?? String(err),
      db_url_present: !!process.env.DATABASE_URL
    });
  }
});

export default async function handler(req: any, res: any) {
  try {
    await initPromise;
  } catch (err: any) {
    console.error("Vercel Init failed!");
    console.error("Error name:", err?.name);
    console.error("Error message:", err?.message);
    if (err?.stack) {
      console.error("Stack trace:", err.stack);
    }
    res.status(500).json({
      error: "Initialization failed",
      message: err?.message ?? String(err),
      stack: err?.stack,
      db_url_present: !!process.env.DATABASE_URL
    });
    return;
  }
  app(req, res);
}
