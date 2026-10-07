import pg from 'pg';

const { Client } = pg;
const CONSENT = 'I_CONFIRM_ISOLATED_TEST_DATABASE';
const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * F01 仅允许连接隔离的本机测试库，以 SELECT 1 作为真实就绪事实。
 * 不是迁移器、不是生产数据库连接、不是 F02 数据模型。
 */
export function createPgReadinessProbe(env = process.env) {
  if (!env.DATABASE_URL) return async () => false;
  if (env.APP_ENV !== 'test' || env.F01_TEST_DB_CONSENT !== CONSENT) {
    throw new Error('F01_ISOLATED_TEST_DATABASE_CONSENT_REQUIRED');
  }
  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error('F01_DATABASE_URL_INVALID');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
      !ALLOWED_HOSTS.has(url.hostname) || decodeURIComponent(url.pathname) !== '/f01_foundation') {
    throw new Error('F01_DATABASE_TARGET_NOT_ALLOWED');
  }
  // 凭据只在 pg 客户端内使用；错误响应/日志不得回传连接串。
  const connectionString = env.DATABASE_URL;
  return async () => {
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 800,
      query_timeout: 1200,
      statement_timeout: 1200,
      application_name: 'mingbang_f01_readiness',
    });
    try {
      await client.connect();
      const result = await client.query('SELECT 1::int AS ok');
      return result.rows.length === 1 && result.rows[0]?.ok === 1;
    } catch {
      return false;
    } finally {
      try { await client.end(); } catch { /* 连接失败时不能影响健康响应 */ }
    }
  };
}
