import { createServer } from 'node:http';

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

export function createFoundationServer({ readinessProbe = async () => false } = {}) {
  return createServer(async (req, res) => {
    const pathname = (req.url ?? '/').split('?')[0];
    if (pathname === '/api/v1/health/live' || pathname === '/api/v1/health/ready') {
      if (req.method !== 'GET') return sendJson(res, 405, { code: 'METHOD_NOT_ALLOWED' });
      if (pathname.endsWith('/live')) return sendJson(res, 200, { ok: true });
      try {
        const ready = await readinessProbe();
        return sendJson(res, ready === true ? 200 : 503, ready === true ? { ok: true } : { ok: false, code: 'DEPENDENCY_NOT_READY' });
      } catch {
        return sendJson(res, 503, { ok: false, code: 'DEPENDENCY_NOT_READY' });
      }
    }
    return sendJson(res, 404, { code: 'NOT_IMPLEMENTED' });
  });
}
