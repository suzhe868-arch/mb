-- CR007 / 2026-09-17
-- Refund subject closure + cross-object business-chain integrity.
-- This migration does not introduce a new refund workflow; it only makes
-- existing Lock/Transaction refund subjects and source-object relationships unambiguous.

-- Referenced composite keys. ID remains the primary identity; these tuples allow
-- downstream FKs to prove that source objects belong to the same customer/vehicle chain.
ALTER TABLE find_car_applications
  ADD CONSTRAINT uq_application_id_customer UNIQUE(application_id, customer_id);
ALTER TABLE recommendations
  ADD CONSTRAINT uq_recommendation_id_customer_vehicle UNIQUE(recommendation_id, customer_id, vehicle_id);
ALTER TABLE consultations
  ADD CONSTRAINT uq_consultation_id_customer UNIQUE(consultation_id, customer_id),
  ADD CONSTRAINT uq_consultation_id_customer_vehicle UNIQUE(consultation_id, customer_id, vehicle_id);
ALTER TABLE locks
  ADD CONSTRAINT uq_lock_id_customer UNIQUE(lock_id, customer_id),
  ADD CONSTRAINT uq_lock_id_customer_vehicle UNIQUE(lock_id, customer_id, vehicle_id);
ALTER TABLE transactions
  ADD CONSTRAINT uq_transaction_id_customer UNIQUE(transaction_id, customer_id),
  ADD CONSTRAINT uq_transaction_id_customer_vehicle UNIQUE(transaction_id, customer_id, vehicle_id);

-- Application -> Demand/customer integrity in both directions.
ALTER TABLE demands
  ADD CONSTRAINT fk_demand_source_application_customer
  FOREIGN KEY(source_application_id, customer_id)
  REFERENCES find_car_applications(application_id, customer_id) ON DELETE RESTRICT;
ALTER TABLE find_car_applications
  ADD CONSTRAINT fk_application_activated_demand_customer
  FOREIGN KEY(activated_demand_id, customer_id)
  REFERENCES demands(demand_id, customer_id) ON DELETE RESTRICT;

-- Recommendation must point at the same customer's Demand and the vehicle's listing cycle.
ALTER TABLE recommendations
  ADD CONSTRAINT fk_recommendation_source_demand_customer
  FOREIGN KEY(source_demand_id, customer_id)
  REFERENCES demands(demand_id, customer_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_recommendation_listing_cycle_vehicle
  FOREIGN KEY(listing_cycle_id, vehicle_id)
  REFERENCES vehicle_listing_cycles(listing_cycle_id, vehicle_id) ON DELETE RESTRICT;

-- Consultation source objects must stay on one customer/vehicle chain.
ALTER TABLE consultations
  ADD CONSTRAINT ck_consultation_recommendation_requires_vehicle
  CHECK(source_recommendation_id IS NULL OR vehicle_id IS NOT NULL),
  ADD CONSTRAINT fk_consultation_source_recommendation_business
  FOREIGN KEY(source_recommendation_id, customer_id, vehicle_id)
  REFERENCES recommendations(recommendation_id, customer_id, vehicle_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_consultation_source_demand_customer
  FOREIGN KEY(source_demand_id, customer_id)
  REFERENCES demands(demand_id, customer_id) ON DELETE RESTRICT;

-- Lock source objects must belong to the same customer/vehicle business chain.
ALTER TABLE locks
  ADD CONSTRAINT fk_lock_source_recommendation_business
  FOREIGN KEY(source_recommendation_id, customer_id, vehicle_id)
  REFERENCES recommendations(recommendation_id, customer_id, vehicle_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_lock_source_demand_customer
  FOREIGN KEY(source_demand_id, customer_id)
  REFERENCES demands(demand_id, customer_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_lock_source_consultation_business
  FOREIGN KEY(source_consultation_id, customer_id, vehicle_id)
  REFERENCES consultations(consultation_id, customer_id, vehicle_id) ON DELETE RESTRICT;

-- Waitlist source objects must belong to the same customer/vehicle business chain.
ALTER TABLE waitlists
  ADD CONSTRAINT fk_waitlist_source_recommendation_business
  FOREIGN KEY(source_recommendation_id, customer_id, vehicle_id)
  REFERENCES recommendations(recommendation_id, customer_id, vehicle_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_waitlist_source_demand_customer
  FOREIGN KEY(source_demand_id, customer_id)
  REFERENCES demands(demand_id, customer_id) ON DELETE RESTRICT;

-- Transaction must inherit the exact Lock customer and vehicle.
ALTER TABLE transactions
  ADD CONSTRAINT fk_transaction_source_lock_business
  FOREIGN KEY(source_lock_id, customer_id, vehicle_id)
  REFERENCES locks(lock_id, customer_id, vehicle_id) ON DELETE RESTRICT;

-- Refund: exactly one subject, and that subject must belong to refund.customer_id.
ALTER TABLE refund_cases
  ADD CONSTRAINT ck_refund_exactly_one_subject
  CHECK (((transaction_id IS NOT NULL)::int + (lock_id IS NOT NULL)::int) = 1),
  ADD CONSTRAINT fk_refund_transaction_customer
  FOREIGN KEY(transaction_id, customer_id)
  REFERENCES transactions(transaction_id, customer_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_refund_lock_customer
  FOREIGN KEY(lock_id, customer_id)
  REFERENCES locks(lock_id, customer_id) ON DELETE RESTRICT;

-- CRM followups may reference business objects, but never another customer's objects.
ALTER TABLE crm_followups
  ADD CONSTRAINT fk_followup_demand_customer
  FOREIGN KEY(demand_id, customer_id)
  REFERENCES demands(demand_id, customer_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_followup_consultation_customer
  FOREIGN KEY(consultation_id, customer_id)
  REFERENCES consultations(consultation_id, customer_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_followup_transaction_customer
  FOREIGN KEY(transaction_id, customer_id)
  REFERENCES transactions(transaction_id, customer_id) ON DELETE RESTRICT;

-- Listing-cycle and recommendation derived grants must use the same customer/vehicle/cycle.
ALTER TABLE customer_vehicle_price_access
  ADD CONSTRAINT fk_price_access_listing_cycle_vehicle
  FOREIGN KEY(listing_cycle_id, vehicle_id)
  REFERENCES vehicle_listing_cycles(listing_cycle_id, vehicle_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_price_access_source_recommendation_business
  FOREIGN KEY(source_recommendation_id, customer_id, vehicle_id, listing_cycle_id)
  REFERENCES recommendations(recommendation_id, customer_id, vehicle_id, listing_cycle_id) ON DELETE RESTRICT;
ALTER TABLE price_access_events
  ADD CONSTRAINT fk_price_event_listing_cycle_vehicle
  FOREIGN KEY(listing_cycle_id, vehicle_id)
  REFERENCES vehicle_listing_cycles(listing_cycle_id, vehicle_id) ON DELETE RESTRICT;
ALTER TABLE vehicle_visibility_grants
  ADD CONSTRAINT fk_visibility_source_recommendation_business
  FOREIGN KEY(source_recommendation_id, customer_id, vehicle_id)
  REFERENCES recommendations(recommendation_id, customer_id, vehicle_id) ON DELETE RESTRICT;
