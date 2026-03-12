// Dynamic import so all errors are caught — prevents unhandled rejection crash
export default async function handler(req: any, res: any) {
  try {
    const { default: app, initPromise } = await import("../server/api-handler");
    await initPromise;
    app(req, res);
  } catch (err: any) {
    console.error("Handler error:", err?.message, err?.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message ?? String(err) });
    }
  }
}
