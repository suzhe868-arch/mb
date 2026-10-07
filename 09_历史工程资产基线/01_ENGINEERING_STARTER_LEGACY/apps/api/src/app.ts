import Fastify from "fastify";
import { loadConfig } from "./config.js";
import { createDbPool } from "./core/db.js";
import { AppError } from "./core/errors.js";
import { healthRoutes } from "./routes/health.js";
export async function buildApp() {
  const config = loadConfig();
  const app = Fastify({ logger: { level: config.logLevel } });
  const db = createDbPool(config.databaseUrl);
  app.decorate("db", db);
  app.addHook("onClose", async () => { await db.end(); });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) return reply.code(error.statusCode).send({ code:error.code, message:error.message, details:error.details ?? null });
    app.log.error(error);
    return reply.code(500).send({ code:"INTERNAL_ERROR", message:"Internal server error" });
  });
  await app.register(healthRoutes, { prefix: "/api/v1" });
  return { app, config };
}
