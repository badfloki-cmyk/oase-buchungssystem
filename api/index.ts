import app, { initPromise } from "../server/api-handler";

export default async function handler(req: any, res: any) {
  try {
    await initPromise;
  } catch (err: any) {
    console.error("Init failed:", err);
    res.status(500).json({ error: "Server initialization failed", detail: err?.message ?? String(err) });
    return;
  }
  app(req, res);
}
