# DEV-01 Static Vertical Slice Status

Baseline: `MB-V1-PREDEV-FINAL-2026-09-10.10`

## Completed without external runtime

### Engineering determinism
- Operation ownership regenerated from current 218-operation index; 218/218 owned.
- Generated per-workstream operation manifests.
- Generated TypeScript contract type layer for all 180 OpenAPI schemas.
- CR-004 corrected public-pool owner nullability in `StaffCustomerDTO`.

### W04 Vehicle Core — first read slice
Implemented repository/read adapters for:
- customer vehicle detail (`VehicleCustomerDetailDTO`), customer-safe visibility gate;
- staff customer-safe vehicle detail (`StaffVehicleSafeDTO`) without incorrectly hiding draft/offline management objects;
- staff internal vehicle detail (`StaffVehicleInternalDTO`) with independent internal-price/upstream-phone field gates;
- PC/admin vehicle detail (`AdminVehicleDTO`), including VIN carrier;
- customer display-price precedence: single-vehicle override > active ladder result > consultation; manual vehicle list price or consultation;
- current listing dates with config-controlled projection;
- customer-visible documents, condition provenance, images through an injected resolver, current anomaly.

### W06 Customer CRM — first read slice
Implemented repository/read adapters for:
- customer self (`CustomerDTO`) with masked phone;
- staff CRM customer (`StaffCustomerDTO`) with full phone carrier only in staff projection, aliases, profile summary, tags and active-business counts;
- legitimate public-pool no-owner projection;
- PC/admin customer (`AdminCustomerDTO`) with owner/public-pool facts and merged entitlements.

### Route adapters
Static Fastify adapters exist for the implemented detail reads. Employee object access requires an injected W03 `ObjectScopeAuthorizer`; no permissive fallback is provided.

### CR-005 Cross-layer semantic alignment
- Page Action Matrix permission aliases reconciled to the current 40-code RBAC registry.
- E01 Workbench and E04 Staff Self Page Data Matrix rebuilt against specialized read models.
- `GET /staff/me` / `StaffSelfDTO` added as the employee-self contract; a current-principal-only static W03 route/repository adapter is included, while real session/plugin wiring remains pending.
- Workbench shell uses `auth.staff.session`; CRM opportunities and demand radar remain protected by their business permissions and data scopes.
- Explicit 4S screen capability matrix is now part of the baseline.
- The authoritative manual-vehicle lock rule is unchanged: an internal wholesale price is not required to create a lock.

## Explicitly NOT claimed complete
- W04 lists/search/geography, favorites, price quota unlock, share/recommendation, vehicle write/state commands, override writes, upstream phone refresh and conversion.
- W06 customer session/profile writes/phone authorization, list/search/filter, quota writes, announcements/banners, public-pool claim logic.
- W03 real auth adapter, permission materialization and object/data-scope implementation.
- W01 real image proxy/object-storage URL resolver.
- Live PostgreSQL queries/migrations, npm dependency install, real Fastify build and UniApp builds.

## Gate
STATIC_TYPES = PENDING_DEPENDENCY_INSTALL
STATIC_ROUTE_BOUNDARIES = PASS
RUNTIME_GATE = PENDING_EXTERNAL_ENVIRONMENT

## CR-007 executable hardening slice

- JYT `price_label` parsing writes the existing cents meaning and rejects malformed values without inventing zero.
- 2026-09-17 Priority synchronization: Lock no longer reads Priority as a competition gate; customer/staff detail reads apply the active-Priority visibility overlay; unified matching/arbitration pure logic and foundation tests are present. Full write-side Recommendation/Priority orchestration remains for formal implementation workstreams.
- Customer visibility applies source/business and platform hard denial before grants/Priority.
- Ordinary Share returns attribution capability only.
- Collector target validation enforces a relative path and deployment-owned origin allowlist.
- Migration `000005_cr007_hardening.sql` implements visibility, Priority, nullable lock snapshots, refund uniqueness, draft and append-only CRM constraints.
- Full production handlers and UI integration remain downstream workstream scope.


## CR-005 baseline note
Current engineering authority is `MB-V1-PREDEV-FINAL-2026-09-10.10`. Live PostgreSQL, Collector runtime connection and device evidence gates remain external-environment pending. Direct JYT phone protocol details are Collector-owned and are not a Mingbang gate.

## CR-006 contract integration

CR-006 is integrated at baseline/schema/OpenAPI/generated-contract/workstream-test level. It does not claim the W04/W05 runtime feature handlers are fully implemented. Live PostgreSQL migration/import remains an environment gate.


## 2026-09-16 re-review synchronization status

The authoritative `spec/FINAL_DEV_READY` snapshot reflects all five adjudicated CR007 decisions. Existing starter code/tests are **not** promoted to authority: any predecessor behavior that conflicts with the snapshot (notably Priority-as-Lock competition and legacy phone-test naming) is an implementation follow-up for the formal code repository.

- Current Priority authority: `spec/FINAL_DEV_READY/02_SSOT/统一匹配与Priority规则_2026-09-17.md`.


### TypeScript gate clarification — 2026-09-17

`typescript` is declared in `devDependencies`, but this artifact environment does not contain installed `node_modules`/`pnpm`. Therefore the Foundation suite reports the strict TypeScript check as **SKIP / external dependency gate**, not PASS and not a business-code FAIL. The real engineering environment must run `pnpm install --frozen-lockfile` followed by `pnpm typecheck`; only a real zero-exit compilation may upgrade `STATIC_TYPES` to PASS.

## 2026-09-17 图片模块重审覆盖状态

- `IMAGE_MODULE_REVIEW = COMPLETE`
- `IMAGE_RULESET = FROZEN`
- `IMAGE_ENGINEERING_SYNC = NOT_IMPLEMENTED`
- 本 Starter 仍是 CN10 工程实现状态；尚未按最新图片 Decision Register 完成 wholesale snapshot freeze、first usable cover localize、on-demand ingestion、single-flight、manual image CRUD/reorder、conversion asset ownership transfer 或对应真实行为测试。
- CN10 既有 Foundation PASS 不得解释为上述图片行为已经实现。
