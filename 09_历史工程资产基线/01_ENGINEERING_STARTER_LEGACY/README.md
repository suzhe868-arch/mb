# 名邦汽车 V1 — Engineering Repository

Authoritative baseline: **MB-V1-PREDEV-FINAL-2026-09-10.10**.

This repository is the DEV-00 engineering bootstrap. The independent sibling `名邦汽车_V1_FINAL_DEV_READY_2026-09-10_v10_CR007/` is the **only authoritative specification mother copy**. `spec/FINAL_DEV_READY/` is a generated frozen snapshot for this engineering delivery and must never be maintained independently. `spec/FINAL_DEV_READY/ARCHIVE/` is historical only and must not override current contracts.

## Architecture

- `apps/api` — TypeScript + Fastify + PostgreSQL 16.
- `apps/customer-miniapp` — UniApp + Vue 3 customer WeChat mini-program.
- `apps/staff-miniapp` — UniApp + Vue 3 employee mini-program.
- `apps/admin-web` — Vue 3 + Vite PC management console.
- `packages/contracts` — OpenAPI, permissions, operation inventory and generated contract indexes.
- `packages/shared` — cross-app pure utilities/types only; no business-state ownership.
- `database/migrations` — schema authority copied from the frozen physical DB contract plus technical seed migrations.
- `workstreams` — isolated implementation packages with dependencies, allowed scope, forbidden scope and DoD.

## Non-negotiable rules

1. Do not infer product behavior from `ARCHIVE`.
2. Do not let an ORM create/alter the schema. SQL migrations are authoritative.
3. Authorization is `identity domain + capability/RBAC code + data scope + object state`.
4. Customer-safe APIs must never return internal fields merely hidden by UI.
5. External JYT integration never writes the database directly.
6. Any implementation ambiguity that changes business semantics becomes a DEV-PD/CR; technical-only choices are resolved in code and recorded.

## First commands

```bash
pnpm install --frozen-lockfile
pnpm preflight
pnpm test:foundation
```

Database when Docker is available:

```bash
docker compose up -d postgres
npm run db:migrate
```

No production credentials are required for DEV-00.


## CR-005 baseline note
Current engineering authority is `MB-V1-PREDEV-FINAL-2026-09-10.10`. Live PostgreSQL, Collector/JYT and device evidence gates remain external-environment pending.

## CR-007 hardening

CR-007 adds executable price-label parsing, Collector target validation, unified customer visibility decisions, exclusive-visibility Priority leases, lock eligibility independent of Priority competition/internal wholesale price, refund concurrency constraints and a pnpm-only workspace. Phone lookup is keyed by publisher ID, never `car_code`. Use `pnpm generate:contracts` after OpenAPI edits.

## CR-006.2 integrated baseline

This starter includes the CR-006/CR-006.1 foundation plus CR-006.2 predecessor contract and CR-007 hardening. E02-02 uses automatic draft recovery and one publish action; it has no preview. Collector connection/runtime evidence may remain `RUNTIME_GATE_PENDING` until the Mingbang→Collector environment is configured; direct JYT phone protocol evidence is Collector-owned and is not a Mingbang gate. Unfinished protected runtime routes are not mounted. Live PostgreSQL apply/replay is still required before claiming the database engineering gate. Use `pnpm generate:contracts` after OpenAPI edits.
