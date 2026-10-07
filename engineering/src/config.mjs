const ALLOWED_ENVS = new Set(['development', 'test', 'production']);

export function loadConfig(env = process.env) {
  const mode = env.APP_ENV ?? 'development';
  if (!ALLOWED_ENVS.has(mode)) throw new Error('APP_ENV must be development, test or production');
  const portText = env.API_PORT ?? '3000';
  if (!/^\\d+$/.test(portText)) throw new Error('API_PORT must be an integer from 1 to 65535');
  const port = Number(portText);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('API_PORT out of range');
  return { mode, host: env.API_HOST ?? '127.0.0.1', port };
}
