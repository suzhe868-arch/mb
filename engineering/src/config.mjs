const ALLOWED_ENVS = new Set(['development', 'test', 'production']);
const ALLOWED_BIND_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '0.0.0.0']);

export function loadConfig(env = process.env) {
  const mode = env.APP_ENV ?? 'development';
  if (!ALLOWED_ENVS.has(mode)) throw new Error('APP_ENV must be development, test or production');
  // 尚无正式数据库探针、鉴权和业务合同；禁止误将本骨架当生产服务。
  if (mode === 'production') throw new Error('F01_PRODUCTION_NOT_READY');
  const portText = env.API_PORT ?? '3000';
  if (!/^\d+$/.test(portText)) throw new Error('API_PORT must be an integer from 1 to 65535');
  const port = Number(portText);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('API_PORT out of range');
  const host = env.API_HOST ?? '127.0.0.1';
  if (!ALLOWED_BIND_HOSTS.has(host)) throw new Error('API_HOST is not an allowed bind address');
  if (host === '0.0.0.0' && env.ALLOW_DEV_PUBLIC_BIND !== 'I_ACCEPT_LOCAL_NETWORK_EXPOSURE') {
    throw new Error('PUBLIC_BIND_REFUSED: explicit development opt-in required');
  }
  return { mode, host, port };
}
