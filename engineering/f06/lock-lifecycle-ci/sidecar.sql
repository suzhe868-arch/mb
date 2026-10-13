-- F06-2 isolated synthetic PG16 only; no signed public migrations or money writes.
CREATE SCHEMA f06_2_ci;
CREATE TABLE f06_2_ci.attestation(
 seal_name TEXT PRIMARY KEY,
 source_sha256 TEXT NOT NULL,
 signed_catalog_sha256 TEXT NOT NULL,
 parent_sidecar_sha256 TEXT NOT NULL,
 original_ledger_sha256 TEXT NOT NULL,
 recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
-- Absence of receipts is not proof of no payment.  CI-only explicit fixture assertion.
-- No real Deposit issuer.  Unknown and existing money always deny mutation.
CREATE TABLE f06_2_ci.finance_proofs(
 lock_id BIGINT PRIMARY KEY REFERENCES public.locks(lock_id),
 proof_kind TEXT NOT NULL CHECK (proof_kind IN ('synthetic_absence_confirmed','unknown','present')),
 synthetic_only BOOLEAN NOT NULL DEFAULT true CHECK (synthetic_only),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_2_ci.lifecycle_events(
 event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 lock_id BIGINT NOT NULL REFERENCES public.locks(lock_id),
 event_key_sha256 TEXT NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 event_kind TEXT NOT NULL CHECK(event_kind IN ('extend','release','cancel','expire')),
 actor_kind TEXT NOT NULL CHECK(actor_kind IN ('employee','ci_system')),
 actor_employee_id BIGINT REFERENCES public.employees(employee_id),
 old_status TEXT NOT NULL,
 new_status TEXT NOT NULL,
 old_expires_at TIMESTAMPTZ NOT NULL,
 new_expires_at TIMESTAMPTZ NOT NULL,
 reason TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 6 AND 240),
 occurred_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 CHECK ((actor_kind='employee' AND actor_employee_id IS NOT NULL) OR
        (actor_kind='ci_system' AND actor_employee_id IS NULL)),
 CHECK ((event_kind='extend' AND old_status='active' AND new_status='active'
            AND new_expires_at>old_expires_at) OR
       (event_kind<>'extend' AND old_status='active' AND new_status<>'active'
            AND new_expires_at=old_expires_at))
);
CREATE INDEX f06_2_lock_event_history ON f06_2_ci.lifecycle_events(lock_id,event_id);
