import { createFoundationServer } from './app.mjs';
import { loadConfig } from './config.mjs';

const { host, port } = loadConfig();
// F01-1 尚未连接真实数据库；不能将 ready 伪报为成功。
const server = createFoundationServer();
server.listen(port, host, () => console.info('F01 foundation listening', { host, port }));
const shutdown = () => server.close(() => process.exit(0));
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
