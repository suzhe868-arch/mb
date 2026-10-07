# Environment handoff — first external execution point

Everything before this point has been completed without production credentials.

The first unavoidable environment-dependent checks are:

1. Install workspace dependencies from npm.
2. Start a PostgreSQL 16 instance.
3. Run the two migrations against an empty database.
4. Re-run migrations to prove replay/no-op safety.
5. Compile API + two UniApp apps + PC admin.

Commands:

```bash
cp .env.example .env
npm install
npm run preflight
npm run test:foundation
docker compose up -d postgres
set -a; source .env; set +a
npm run db:migrate
npm run db:migrate
npm --workspace @mingbang/api run build
npm --workspace @mingbang/customer-miniapp run build:mp-weixin
npm --workspace @mingbang/staff-miniapp run build:mp-weixin
npm --workspace @mingbang/admin-web run build
```

No WeChat/JYT/Feishu credentials are needed for these foundation gates. Those credentials become necessary only when integration adapters are exercised later.
