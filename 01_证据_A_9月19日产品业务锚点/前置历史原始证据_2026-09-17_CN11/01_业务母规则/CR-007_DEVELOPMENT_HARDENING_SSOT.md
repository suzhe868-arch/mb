# CR-007 Development Hardening SSOT

This file is the v10 delta over v9/CR-006.2. Where an active v9 file conflicts with this delta, this file wins. Historical CR documents remain unchanged.

## Global invariants

1. A vehicle without an internal wholesale price can be locked. Missing values remain `NULL`; zero is not a substitute.
2. Lock eligibility is based on source state, business state, current Lock/Transaction truth, normal visibility authorization, capability and data scope. Priority is not a lock-competition condition.
3. Public and Priority customers share one matching engine. Priority qualification is a Customer attribute; a customer may hold multiple vehicle Priority leases, and a vehicle has at most one active Priority lease.
4. Priority is a temporary sales-side exclusive visibility branch, not inventory occupation and not lock priority. Before formal Recommendation the customer is not visible to the vehicle; the responsible sales relationship and employees with `priority.view` may view it within existing data scope. After formal Recommendation, that customer also becomes visible while Priority remains active. Lock remains the only pre-transaction inventory occupation.
5. Share records attribution only. It grants no Recommendation, Visibility, price access, Lock or staff permission.
6. Recommendation preserves immutable attribution/snapshots but has a minimal `active / ended` lifecycle. Priority expiry does not automatically end an active Recommendation; vehicle terminal states and explicit cancellation may end it. Recommendation creation + current listing-cycle price entitlement commit atomically.
7. `platform_visibility=hidden` removes a vehicle from customer public browse/search/feed, but it does not make an otherwise saleable vehicle ineligible for Demand/Priority matching.
8. Hidden-vehicle customer access is recommendation-derived: an active formal Recommendation creates a customer-only `vehicle_visibility_grants` row for that vehicle/listing cycle; ending the Recommendation ends that grant. Priority by itself never creates customer visibility. Public discovery filtering and Matching candidate filtering are separate.
9. `price_label` is the sole input to JYT list-price synchronization. Preserve it verbatim in `upstream_list_price_label` and parse it into `upstream_list_price_cents`. `upstream_wholesale_price_cents` remains the true upstream wholesale price; `base_wholesale_price_cents = COALESCE(upstream_wholesale_price_cents, upstream_list_price_cents)`.
10. Phone access is Mingbang → Collector → JYT. JYT credentials stay in Collector. Mingbang phone/cache identity is `upstream_publisher_id / publisher_id`; `car_code` never participates in phone lookup.
11. V1 does not merge Customer identities. Duplicate hints and notes do not move business objects.
12. System Admin and Employee are separate principals, sessions and authorization domains.
13. Customer owner, Demand responsible, Consultation responsible, Waitlist responsible, Lock responsible and Transaction responsible are independent current assignments.
14. Historical actor, recommender, source, snapshot and followup facts are append-only.

## Visibility decision

```text
customer visible =
  active Lock/Transaction business access
  OR (
    source active
    AND business state permits ordinary customer detail
    AND (
      active Priority exists
        ? Priority belongs to this customer AND active formal Recommendation exists AND active recommendation-derived visibility grant exists
        : platform visible OR active recommendation-derived visibility grant exists
    )
  )
```

An active Priority is evaluated **before** public discovery/grant paths. Public visibility, old links and ordinary Share cannot bypass another customer's active Priority. Priority alone does not expose the vehicle to its target customer.

`vehicle_model_visibility_rules`, `base_audience` and manual/employee visibility grants are retired. Employee access continues to use employee identity, capability, tenant/org/store data scope and Priority-specific `priority.view` where applicable.

## Priority arbitration

Existing active Priority wins until it ends. Otherwise public matching first evaluates all active Demands under the unified rules. If eligible Priority customers exist, group candidates by customer, select that customer's best Demand, then arbitrate customers by `high > acceptable → Demand created_at earlier → demand_id smaller`. `confirmation_needed` never reserves the vehicle. Creation is transactional; the DB unique index is the race guard. Priority is not checked as a Lock competition condition.

## Public-pool protection

A customer is ineligible while any pending find-car application, active/paused Demand, active Priority, open Consultation, active Waitlist, active Lock, in-progress Transaction or pending Refund exists. Active Priority must be released before the customer can become a public-pool candidate. Final public-pool placement remains a manager/store-manager decision and is never automatic. On employee departure, active Priority follows the customer/business handover to the replacement responsible sales relationship; it is not cancelled merely because the former employee leaves. Eligibility is recalculated inside the write transaction.

## Clean rebuild

v10 development/test schema is built from an empty PostgreSQL 16 database. Old development data, old JYT phone configuration and dirty draft/price values are not migrated. Production deletion is outside this contract and requires a separate approved operation.
