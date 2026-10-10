-- F03 package G1. EXACTLY TWO pre-approved CHECK replacements, no table/column delta.
ALTER TABLE public.handover_items DROP CONSTRAINT handover_items_status_check;
ALTER TABLE public.handover_items ADD CONSTRAINT handover_items_status_check
 CHECK (status IN ('pending','retry_required','blocked','completed'));
ALTER TABLE public.handover_batches DROP CONSTRAINT handover_batches_status_check;
ALTER TABLE public.handover_batches ADD CONSTRAINT handover_batches_status_check
 CHECK (status IN ('collecting','pending_domain_handover','blocked','completed'));
