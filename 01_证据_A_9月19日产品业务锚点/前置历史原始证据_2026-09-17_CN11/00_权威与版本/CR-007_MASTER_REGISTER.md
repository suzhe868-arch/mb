# CR-007 Master Register

Baseline: `MB-V1-PREDEV-FINAL-2026-09-10.10`  
Predecessor: v9 / CR-006.2  
Rule: historical CR files remain immutable and authoritative only for their own version.

## Status vocabulary

- `FIXED_IMPLEMENTATION`: executable code, SQL or generated contract changed and locally verified.
- `FIXED_CONTRACT`: current product/API/IA/security contract changed; downstream implementation remains governed by DEV gates.
- `SUPERSEDED`: an older v9 design is retained only as history and cannot be revived.
- `EXTERNAL_DEPENDENCY`: requires a real service, account or runtime absent from this package.

## Master findings

| ID | Final ruling | Status | Evidence |
|---|---|---|---|
| CR007-001 | Vehicle 3x3 facts, condition tags and images use one typed customer-safe projection. | FIXED_CONTRACT | OpenAPI/DTO registry and CR-006.2 predecessor closure retained. |
| CR007-002 | Manual Mingbang/4S vehicles may be formally published with 0 persisted image rows; image count is not a publish gate. No-image projections use the configured default placeholder until real images are added. | FIXED_CONTRACT | 2026-09-17 re-review adjudication + SSOT/Action/Low-Fi alignment. |
| CR007-003 | An unpublished Mingbang/4S vehicle must remain `draft + hidden`. | FIXED_IMPLEMENTATION | `ck_unpublished_manual_vehicle_is_hidden_draft`. |
| CR007-004 | One employee has at most one unfinished manual draft. | FIXED_IMPLEMENTATION | `uq_employee_open_manual_draft`. |
| CR007-005 | JYT source-owned facts are written only by the ingest boundary. | FIXED_CONTRACT | Dedicated integration identity/role remains a deployment requirement. |
| CR007-006 | Model hierarchy uses source mapping identity; normalized brand text is not a global identity. | FIXED_CONTRACT | CR-006 model master retained; proposed global brand-name unique rejected. |
| CR007-007 | An incomplete model reuses `profile_status=partial`; no new state is added. | FIXED_CONTRACT | Model catalog contract. |
| CR007-008 | JYT batch writes return a result per `car_code`. | FIXED_CONTRACT | OpenAPI price batch result. |
| CR007-009 | `price_label` always means upstream list price: raw → `upstream_list_price_label`, parsed → `upstream_list_price_cents`; true wholesale remains separate and base wholesale falls back wholesale→list. | FIXED_IMPLEMENTATION | `000008_price_visibility_closure.sql` + parser/fallback regression. |
| CR007-010 | Parse failure preserves the previous standardized amount and never writes zero. | FIXED_IMPLEMENTATION | Parser error contract and per-item `PRICE_PARSE_FAILED`. |
| CR007-011 | Package manager is pnpm with a frozen workspace contract. | FIXED_IMPLEMENTATION | `packageManager`, `pnpm-workspace.yaml`, lockfile. |
| CR007-012 | Contract generators run outside frozen artifact directories and are deterministic. | FIXED_CONTRACT | Existing generators retained; v10 regenerated outputs/checksums. |
| CR007-013 | Mingbang phone flow is Mingbang → Collector → JYT; phone identity is `upstream_publisher_id / publisher_id`, never `car_code`. | FIXED_CONTRACT | Publisher cache/schema + Collector boundary + current OpenAPI test carrier. |
| CR007-014 | JYT credentials and request details stay in Collector. | FIXED_CONTRACT | Collector config exposes only secret reference/status. |
| CR007-015 | Collector origin is deployment allowlisted; P03 cannot extend the root allowlist. | FIXED_IMPLEMENTATION | `validateCollectorTarget`. |
| CR007-016 | Public discovery and customer detail share one visibility policy, while Matching intentionally uses a separate saleability filter so hidden vehicles remain matchable. | FIXED_IMPLEMENTATION | visibility + matching candidate functions and CN9 tests. |
| CR007-017 | `platform_visibility=hidden` blocks public browse/search/share, but does not block Matching; target customer detail is allowed after formal Recommendation creates an active grant. | FIXED_IMPLEMENTATION | CN9 visibility evaluator/matching regression. |
| CR007-018 | Visibility grants are Recommendation-derived customer-only overlays; `base_audience`, model visibility rules and manual/employee grants are retired. | FIXED_IMPLEMENTATION | `000008_price_visibility_closure.sql` + grant service. |
| CR007-019 | Model-target visibility-rule precedence is superseded; V1 has no `vehicle_model_visibility_rules`. | SUPERSEDED | CN9 dependency scan + `000008` DROP TABLE. |
| CR007-020 | Recommendation-derived customer grant is constrained to the same customer/vehicle/listing-cycle/Recommendation tuple; employee grants do not exist. | FIXED_IMPLEMENTATION | Composite FK + grant-only schema. |
| CR007-021 | Priority is the temporary exclusive branch of the unified public matching flow, not a Lock, Recommendation or Transaction. | FIXED_IMPLEMENTATION | `demand_priority_leases` + 2026-09-17 unified matching addendum. |
| CR007-022 | Priority qualification belongs to Customer; one customer may hold unlimited Priority vehicles and each Priority records one trigger Demand. | FIXED_IMPLEMENTATION | Customer Priority fields + `demand_priority_leases`. |
| CR007-023 | One vehicle has at most one active Priority lease. | FIXED_IMPLEMENTATION | `uq_vehicle_active_priority`. |
| CR007-024 | Priority arbitration is deterministic: `high > acceptable → Demand created_at → demand_id`; Priority defaults to a 24h snapshotted TTL. | FIXED_CONTRACT | Unified matching addendum + expiry index. |
| CR007-025 | Bulk visibility actions report per-vehicle outcomes and revalidate current state. | FIXED_CONTRACT | Action/API contract. |
| CR007-026 | Permission narrowing invalidates feed/search/facet/detail/match caches. | FIXED_CONTRACT | Security/cache contract. |
| CR007-027 | `locks.internal_wholesale_snapshot_cents` is nullable. | FIXED_IMPLEMENTATION | Migration drops `NOT NULL`. |
| CR007-028 | `LockDTO.price_snapshot.internal_wholesale_cents` is optional/nullable. | FIXED_IMPLEMENTATION | OpenAPI schema. |
| CR007-029 | Ordinary non-deposit Lock gets a server-calculated expiry; no indefinite default Lock. | FIXED_CONTRACT | Lock lifecycle contract. |
| CR007-030 | Lock → Transaction requires `transaction.manage`. | FIXED_IMPLEMENTATION | OpenAPI authorization map. |
| CR007-031 | Priority is exclusive visibility, not lock priority. Lock creation does not add Priority as a competing lock condition; it relies on normal visibility authorization plus Lock/Transaction truth. | FIXED_CONTRACT | 2026-09-16 re-review adjudication. |
| CR007-032 | One refund subject has at most one pending Refund Case. | FIXED_IMPLEMENTATION | Partial unique indexes for transaction/lock. |
| CR007-033 | Priority uses minimal API/security surface: SystemAdmin customer flag, staff release, Recommendation lifecycle, `priority.view`; no manual create/transfer/override/extend. | FIXED_IMPLEMENTATION | `000006_priority_unification.sql` + OpenAPI + tests. |
| CR007-034 | Invalidating the last valid deposit re-evaluates an expired Lock. | FIXED_CONTRACT | Recovery contract; end reason `EXPIRED_AFTER_DEPOSIT_INVALIDATION`. |
| CR007-035 | Transaction creation and Lock closure are one row-locking transaction. | FIXED_CONTRACT | Concurrency contract. |
| CR007-036 | Priority is evaluated in the visibility layer; Lock/Transaction availability remains a separate inventory/business-state guard. | FIXED_CONTRACT | 2026-09-16 re-review adjudication. |
| CR007-037 | Recommendation, listing-cycle price entitlement and necessary customer grant are atomic. | FIXED_CONTRACT | Recommendation transaction contract. |
| CR007-038 | Ordinary Share grants attribution only. | FIXED_IMPLEMENTATION | `resolveShareCapabilities` regression. |
| CR007-039 | Recommendation keeps immutable attribution/snapshots but has a minimal `active / ended` lifecycle; Priority expiry does not automatically end it. | FIXED_CONTRACT | 2026-09-17 unified matching addendum. |
| CR007-040 | Recommendation grant is an overlay and cannot make the vehicle public. | FIXED_CONTRACT | Visibility grant model. |
| CR007-041 | Recommendation creation re-reads current vehicle state. | FIXED_CONTRACT | Recommendation guard. |
| CR007-042 | Share token is not authentication or authorization. | FIXED_CONTRACT | Customer visibility contract. |
| CR007-043 | Historical recommender and price snapshot never drift with owner reassignment. | FIXED_CONTRACT | Append-only history rule. |
| CR007-044 | Customer owner is current ownership only; history is append-only. | FIXED_CONTRACT | Owner history contract. |
| CR007-045 | Customer owner reassignment does not reassign Demand/Consultation/Waitlist/Lock/Transaction. | FIXED_CONTRACT | Responsibility separation. |
| CR007-046 | Employee departure uses a handover batch for each active responsibility. | FIXED_CONTRACT | Existing handover tables plus v10 rule. |
| CR007-047 | Active protected business, including active Priority, prevents public-pool entry; Priority follows employee-departure customer handover rather than being cancelled. | FIXED_CONTRACT | 2026-09-16 re-review adjudication. |
| CR007-048 | Public-pool eligibility is evaluated at write time. | FIXED_CONTRACT | State guard. |
| CR007-049 | Collaboration access is scoped and never grants owner-level authority. | FIXED_CONTRACT | Authorization formula. |
| CR007-050 | Rehire reuses employee identity without reclaiming handed-over data. | FIXED_CONTRACT | Regression obligation. |
| CR007-051 | Phone change updates contact history; it does not create or merge a Customer. | FIXED_CONTRACT | V1 merge path removed. |
| CR007-052 | V1 has no Customer Merge. | FIXED_CONTRACT | Merge-related grant/owner/data movement is explicitly out of scope. |
| CR007-053 | Historical actor/responsible/referrer facts are immutable. | FIXED_CONTRACT | Audit/history rule. |
| CR007-054 | Active human-serviced objects require a responsible employee. | FIXED_CONTRACT | Existing non-null FKs and handover gate. |
| CR007-055 | CRM followups are append-only; corrections are new events. | FIXED_IMPLEMENTATION | `trg_crm_followup_append_only`. |
| CR007-056 | 4S employee visibility is restricted by organization/store scope. | FIXED_CONTRACT | Employee kind and scope intersection retained. |
| CR007-057 | 4S members cannot become customer owners or receive customer business. | FIXED_CONTRACT | `customer_business_eligible=false` invariant retained. |
| CR007-058 | System Admin and Employee are separate identity domains and sessions. | FIXED_IMPLEMENTATION | Separate tables and OpenAPI identity domains retained. |
| CR007-059 | No route may translate a System Admin principal into an Employee principal. | FIXED_CONTRACT | Auth boundary regression requirement. |
| CR007-060 | Development/test database uses Clean Rebuild; production drop is prohibited. | FIXED_IMPLEMENTATION | Guarded clean rebuild script, runbook and external gate. |

| CR007-061 | Mingbang-managed JYT upstream phone credential upload/test routes are removed; JYT ingest credential remains only for the three source synchronization APIs. | FIXED_CONTRACT | 2026-09-16 telephone legacy-contract cleanup. |

## Superseded v9 rules

- Mingbang-managed direct JYT phone configuration and token fields.
- Share creating Recommendation, Visibility Grant or Price Entitlement.
- Lock requiring a non-null internal wholesale snapshot.
- Priority quantity caps.
- Customer merge work in V1.
- `lock.manage` authorizing Transaction creation.

## External dependencies

| Gate | Required evidence |
|---|---|
| EXT-DB-01 | PostgreSQL 16 empty-database apply and second-run replay in a disposable development/test instance. |
| EXT-TSC-01 | Install workspace dependencies with the locked package manager and execute strict TypeScript compilation (`pnpm install --frozen-lockfile` then `pnpm typecheck`); no PASS is claimed while dependencies are absent. |
| EXT-COLLECTOR-01 | Collector base URL, relative phone path, internal authentication secret reference and response schema. |
| EXT-UI-01 | Real WeChat AppID, Developer Tools import and device E2E; local UniApp builds already pass. |
| EXT-PROD-01 | Any production migration, credential, deployment or data deletion requires a separate irreversible-action approval. |

Collector-owned JYT method/header/response verification is outside the Mingbang readiness-gate boundary; Mingbang phone runtime acceptance stops at Mingbang→Collector.

No open product decision blocks v10. External gates do not authorize production actions.


## 2026-09-16 re-review normalization

- Phone: publisher-ID keyed; `car_code` phone lookup is superseded.
- Priority: exclusive visibility only; not a Lock competition rule.
- Public pool: active Priority is absolute protection; final pool placement remains manager/store-manager manual action.
- Handover: active Priority follows customer/business handover on employee departure.
- Permission: Lock → Transaction uses `transaction.manage`; `lock.manage` does not authorize transaction creation.
- Version consistency: one FINAL_DEV_READY mother; starter snapshot is generated/frozen only.


## 2026-09-17 unified matching + Priority simplification

- Ordinary and Priority customers share one deterministic matching engine.
- Customer-level Priority qualification is SystemAdmin-only.
- `priority.override` is retired; only read-through `priority.view` remains.
- Priority is staff-internal before formal Recommendation, 24h by default, and never a Lock competition rule.
- Recommendation now has a minimal active/ended lifecycle and can outlive Priority.
- Executable DB delta: `patch/000006_priority_unification.sql`.


## 2026-09-17 Refund / data-integrity closure

- Refund creation requires exactly one subject: `lock_id` XOR `transaction_id`; the selected subject must belong to `customer_id`.
- Lock-side refund covers deposit-before-Transaction cases; once a Transaction exists for that Lock, subsequent refund ownership is Transaction-based.
- Composite FKs close cross-customer/cross-vehicle source-link risks across Demand → Recommendation → Consultation/Waitlist/Lock → Transaction and derived recommendation access facts.
- PostgreSQL runtime Apply/Replay remains an external gate; static closure does not claim live DB execution.


## 2026-09-17 manual zero-image publish normalization

- Manual Mingbang/4S vehicles may be formally published with 0 real images.
- Image count is not part of `PUBLISH_REQUIRED_FIELDS_MISSING`.
- When no real image exists, customer/staff projections render `image.default_placeholder`; adding real images later removes the fallback.


## 2026-09-17 CN9 price + hidden-visibility closure

- `price_label` is list price only; raw column is `upstream_list_price_label`.
- base wholesale is synchronized as true upstream wholesale when present, otherwise upstream list price.
- hidden blocks public browse/search, not ordinary/Priority Matching.
- hidden formal Recommendation creates a customer-only visibility grant; Recommendation end ends the grant without cancelling Lock/Transaction.
- `base_audience`, `vehicle_model_visibility_rules`, `vehicle.visibility.manage`, manual/employee grants are retired.
- Current acceptance keeps external runtime gates explicit; historical `.4~.9` verdicts moved to ARCHIVE.

## 2026-09-17｜图片模块重审主线吸收

- `IMAGE_MODULE_REVIEW = COMPLETE`
- `IMAGE_RULESET = FROZEN`
- `IMAGE_ENGINEERING_SYNC = PENDING`
- 图片规则来源：FINAL_DEV_READY `15_CHANGE_CONTROL/CR-007/图片模块重审_2026-09-17/`。
- 本次不修改图片模块以外已冻结规则；DB/OpenAPI/Starter/Worker/Storage/Conversion/Tests 的新图片规则落地属于后续施工，不得提前标 PASS。
