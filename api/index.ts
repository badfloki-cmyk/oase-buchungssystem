import app, { initPromise } from "../server/api-handler";

// Attach catch immediately so Node.js doesn't crash on unhandled rejection
// if initPromise rejects before the first request handler runs.
initPromise.catch(() => {});

export default async function handler(req: any, res: any) {
  try {
    await initPromise;
  } catch (err: any) {
    console.error("Init failed:", err?.message, err?.stack);
    res.status(500).json({ error: err?.message ?? String(err) });
    return;
  }
  app(req, res);
}
