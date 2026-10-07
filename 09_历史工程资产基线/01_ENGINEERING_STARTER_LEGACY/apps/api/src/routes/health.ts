import type { FastifyInstance } from "fastify";
export async function healthRoutes(app: FastifyInstance) {
  app.get("/health/live", async () => ({ ok: true }));
  app.get("/health/ready", async () => {
    await app.db.query("select 1 as ok");
    return { ok: true };
  });
}
