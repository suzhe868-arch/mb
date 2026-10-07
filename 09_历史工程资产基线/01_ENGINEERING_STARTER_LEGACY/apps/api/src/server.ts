import { buildApp } from "./app.js";
const { app, config } = await buildApp();
await app.listen({ host: config.host, port: config.port });
