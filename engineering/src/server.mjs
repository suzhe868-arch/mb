import { createFoundationServer } from './app.mjs';
import { loadConfig } from './config.mjs';
import { createPgReadinessProbe } from './postgres.mjs';

const { host, port } = loadConfig();
const server = createFoundationServer({
  readinessProbe: createPgReadinessProbe(process.env),
  readinessTimeoutMs: 3000,
});
server.listen(port, host, () => console.info('F01 foundation listening', { host, port }));
const shutdown = () => server.close(() => process.exit(0));
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
