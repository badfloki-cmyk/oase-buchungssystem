import app, { initPromise } from "../server/api-handler";

// Attach catch immediately so Node.js doesn't crash on unhandled rejection
// if initPromise rejects before the first request handler runs.
initPromise.catch(() => { });

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
      stack: process.env.NODE_ENV === "development" ? err?.stack : undefined
    });
    return;
  }
  app(req, res);
}
