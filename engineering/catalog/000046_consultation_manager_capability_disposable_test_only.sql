-- F05-10 PDM15 explicit manager/store-head management capability in disposable PG16 only.
-- The position/role never implies this capability. Customer/Consultation scope
-- must still be bound to an active Employee through current bearer and row locks.
ALTER TABLE public.f05_catalog_employee_consultation_scope_test
 ADD COLUMN can_manage_consultation boolean NOT NULL DEFAULT false;
-- Production permission signers are NOT inferred from this test fixture.
