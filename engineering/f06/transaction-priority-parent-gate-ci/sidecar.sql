-- F06-5C-PG1：仅限独立非特权 PG16 合成环境的追加式安全闸门。
-- 原 v24 函数/触发器定义不修改；签名取消在 UPDATE 之后才写入，故先跳过早期签发，事务末复验。
CREATE SCHEMA f06_5c_pg1_ci;
CREATE TABLE f06_5c_pg1_ci.attestation(
  name text PRIMARY KEY CHECK(name='F06_5C_PG1'),
  source_sha256 text NOT NULL CHECK(source_sha256 ~ '^[0-9a-f]{64}$'),
  parent_ledger_sha256 text NOT NULL CHECK(parent_ledger_sha256 ~ '^[0-9a-f]{64}$'),
  parent_priority_sha256 text NOT NULL CHECK(parent_priority_sha256 ~ '^[0-9a-f]{64}$'),
  sidecar_chain_sha256 text NOT NULL CHECK(sidecar_chain_sha256 ~ '^[0-9a-f]{64}$'),
  parent_catalog_sha256 text NOT NULL CHECK(parent_catalog_sha256 ~ '^[0-9a-f]{64}$'),
  post_catalog_sha256 text NOT NULL CHECK(post_catalog_sha256 ~ '^[0-9a-f]{64}$'),
  delta_sha256 text NOT NULL CHECK(delta_sha256 ~ '^[0-9a-f]{64}$'),
  delta_manifest jsonb NOT NULL CHECK(jsonb_typeof(delta_manifest)='array'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_5c_pg1_ci.immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'PG1_IMMUTABLE_ATTESTATION' USING ERRCODE='23514'; END $$;
CREATE TRIGGER attestation_immutable BEFORE UPDATE OR DELETE
  ON f06_5c_pg1_ci.attestation FOR EACH ROW EXECUTE FUNCTION f06_5c_pg1_ci.immutable();

-- 此函数仅回答「此刻是否允许新签发」，不能更改任何资金/历史对象。
-- 在任何一条不可辨识来源存在时返回 false，禁止通过 public.status 伪造可信来源。
CREATE FUNCTION f06_5c_pg1_ci.safe_to_issue(v bigint, cyc bigint)
RETURNS boolean LANGUAGE plpgsql VOLATILE AS $$
DECLARE t record; r record; signed_ok boolean;
BEGIN
 IF to_regclass('f06_1_lock_ci.waitlist_sources') IS NULL
    OR to_regclass('f06_3b_ci.transaction_origins') IS NULL
    OR to_regclass('f06_5b_ci.guard_events') IS NULL
    OR to_regclass('f06_4a_ci.cancel_origins') IS NULL
    OR to_regclass('f06_4c_ci.cancel_origins') IS NULL
    OR to_regclass('f06_3c1_ci.refund_origins') IS NULL
    OR to_regclass('f06_5a_ci.refund_origins') IS NULL
 THEN RETURN false; END IF;

 -- 原父正常仲裁自带Lock占用校验；PG1还必须独立拦截无权限显式INSERT，
 -- 不能让活动锁车与Priority独占同时存在。
 IF EXISTS(SELECT 1 FROM public.locks l
    WHERE l.vehicle_id=v AND l.listing_cycle_id=cyc
      AND l.lock_status='active' AND l.expires_at>statement_timestamp())
 THEN RETURN false; END IF;

 -- 无论 public 候补是否已经被签名认可，都不能将尚未完结的候补忽略。
 -- 有签的候补同时核原 Request/queue，不使用 join 缺失把候补过滤掉。
 IF EXISTS(
   SELECT 1 FROM public.waitlists w
    LEFT JOIN f06_1_lock_ci.waitlist_sources s ON s.waitlist_id=w.waitlist_id
    WHERE w.vehicle_id=v AND w.listing_cycle_id=cyc AND w.ended_at IS NULL
 ) THEN RETURN false; END IF;
 -- 同车同周期未签/漂移的终结候补也不能成为允许新签发的依据。
 IF EXISTS(
   SELECT 1 FROM public.waitlists w
   LEFT JOIN f06_1_lock_ci.waitlist_sources s ON s.waitlist_id=w.waitlist_id
   LEFT JOIN public.lock_requests q ON q.lock_request_id=w.source_lock_request_id
   WHERE w.vehicle_id=v AND w.listing_cycle_id=cyc
     AND (s.waitlist_id IS NULL OR s.source_request_id IS DISTINCT FROM w.source_lock_request_id
        OR s.queue_request_id IS DISTINCT FROM q.lock_request_id
        OR s.queue_created_at IS DISTINCT FROM q.created_at)
 ) THEN RETURN false; END IF;

 FOR t IN SELECT * FROM public.transactions
   WHERE vehicle_id=v AND listing_cycle_id=cyc ORDER BY transaction_id
 LOOP
   IF t.status <> 'cancelled' OR t.completed_at IS NOT NULL THEN RETURN false; END IF;
   -- 3B 不可变的 in_progress 出生事实 + 5B 原子转换签名，两者缺一不可。
   IF NOT EXISTS(
     SELECT 1 FROM f06_3b_ci.transaction_origins o
       JOIN f06_5b_ci.guard_events g ON g.transaction_id=o.transaction_id
       JOIN f06_3b_ci.origin_events oe ON oe.transaction_id=o.transaction_id
       JOIN f06_3b_ci.request_keys rk ON rk.event_key_sha256=oe.event_key_sha256
       JOIN public.locks l ON l.lock_id=o.source_lock_id
     WHERE o.transaction_id=t.transaction_id AND o.source_lock_id=t.source_lock_id
       AND o.vehicle_id=t.vehicle_id AND o.listing_cycle_id=t.listing_cycle_id
       AND o.customer_id=t.customer_id AND o.status='in_progress'
       AND o.public_carrier_status='in_progress'
       AND o.lock_end_reason='converted_to_transaction'
       AND oe.source_lock_id=o.source_lock_id
       AND oe.actor_employee_id=o.opening_actor_employee_id
       AND oe.event_kind='lock_converted_to_transaction'
       AND oe.previous_lock_status='active' AND oe.final_lock_status='released'
       AND rk.resulting_transaction_id=o.transaction_id
       AND rk.source_lock_id=o.source_lock_id
       AND rk.opening_actor_employee_id=o.opening_actor_employee_id
       AND rk.action='open'
       AND g.actor_employee_id=o.opening_actor_employee_id
       AND g.source_lock_id=o.source_lock_id AND g.vehicle_id=v
       AND g.listing_cycle_id=cyc AND g.production_issuer='UNWIRED'
       AND l.lock_status='released' AND l.end_reason='converted_to_transaction'
       AND l.vehicle_id=v AND l.listing_cycle_id=cyc
   ) THEN RETURN false; END IF;

   -- 4A 单人取消必须有 origin + event + request_key 三签一致。
   signed_ok := EXISTS(
     SELECT 1 FROM f06_4a_ci.cancel_origins o
      JOIN f06_4a_ci.cancel_events e ON e.transaction_id=o.transaction_id
      JOIN f06_4a_ci.request_keys k ON k.event_key_sha256=e.event_key_sha256
     WHERE o.transaction_id=t.transaction_id
       AND o.source_lock_id=t.source_lock_id AND o.customer_id=t.customer_id
       AND o.vehicle_id=v AND o.listing_cycle_id=cyc
       AND o.original_responsible_employee_id=t.responsible_employee_id
        AND o.original_responsible_employee_id=(SELECT birth.original_responsible_employee_id
          FROM f06_3b_ci.transaction_origins birth WHERE birth.transaction_id=t.transaction_id)
       AND o.actor_employee_id=e.actor_employee_id
       AND e.actor_employee_id=k.actor_employee_id
       AND e.event_kind='transaction_cancelled_without_payment'
       AND e.previous_status='in_progress' AND e.resulting_status='cancelled'
       AND o.previous_status='in_progress' AND o.resulting_status='cancelled'
       AND o.reason=e.reason AND k.action='cancel'
       AND k.transaction_id=t.transaction_id
   );
   -- 4C 跨负责人取消还须 4B 有签投影与最后一条真实事件。
   IF NOT signed_ok THEN
     signed_ok := EXISTS(
      SELECT 1 FROM f06_4c_ci.cancel_origins o
       JOIN f06_4c_ci.cancel_events e ON e.transaction_id=o.transaction_id
       JOIN f06_4c_ci.request_keys k ON k.event_key_sha256=e.event_key_sha256 AND k.event_id=e.event_id
       JOIN f06_4b_ci.responsible_projection p ON p.transaction_id=o.transaction_id
       JOIN f06_4b_ci.handoff_events h ON h.event_id=p.last_event_id AND h.transaction_id=t.transaction_id
       JOIN f06_4b_ci.request_keys hk ON hk.result_event_id=h.event_id
      WHERE o.transaction_id=t.transaction_id AND o.source_lock_id=t.source_lock_id
       AND o.customer_id=t.customer_id AND o.vehicle_id=v AND o.listing_cycle_id=cyc
       AND o.original_responsible_employee_id=p.original_responsible_employee_id
        AND o.original_responsible_employee_id=(SELECT birth.original_responsible_employee_id
          FROM f06_3b_ci.transaction_origins birth WHERE birth.transaction_id=t.transaction_id)
       AND o.transferred_responsible_employee_id=t.responsible_employee_id
       AND p.current_responsible_employee_id=t.responsible_employee_id
       AND h.new_responsible_employee_id=t.responsible_employee_id
       AND o.actor_employee_id=t.responsible_employee_id
       AND o.parent_last_handoff_event_id=p.last_event_id
       AND o.parent_handoff_event_count=p.event_count
       AND e.parent_last_handoff_event_id=h.event_id
       AND e.current_responsible_employee_id=t.responsible_employee_id
       AND e.original_responsible_employee_id=o.original_responsible_employee_id
       AND e.reason=o.reason
       AND e.actor_employee_id=k.actor_employee_id
       AND k.transaction_id=t.transaction_id
       AND e.event_kind='post_handoff_transaction_cancelled_ci_only'
       AND o.previous_status='in_progress' AND o.resulting_status='cancelled'
       AND hk.transaction_id=t.transaction_id
       AND hk.actor_employee_id=h.actor_employee_id
     );
   END IF;
   -- 双签、伪签或半签全部拒绝。
   IF NOT signed_ok OR
      (EXISTS(SELECT 1 FROM f06_4a_ci.cancel_origins WHERE transaction_id=t.transaction_id)
       AND EXISTS(SELECT 1 FROM f06_4c_ci.cancel_origins WHERE transaction_id=t.transaction_id))
   THEN RETURN false; END IF;
 END LOOP;

 -- 未知或未完成的资金绝对不能借签名取消释放 Priority。
 FOR r IN
   SELECT f.*,l.vehicle_id AS lock_vehicle,l.listing_cycle_id AS lock_cycle,
     t.vehicle_id AS transaction_vehicle,t.listing_cycle_id AS transaction_cycle
   FROM public.refund_cases f
   LEFT JOIN public.locks l ON l.lock_id=f.lock_id
   LEFT JOIN public.transactions t ON t.transaction_id=f.transaction_id
   WHERE (l.vehicle_id=v AND l.listing_cycle_id=cyc)
      OR (t.vehicle_id=v AND t.listing_cycle_id=cyc)
 LOOP
  IF r.status <> 'closed' OR r.closed_at IS NULL OR r.close_reason IS NULL
     OR EXISTS(SELECT 1 FROM public.refund_payments p WHERE p.refund_id=r.refund_id)
  THEN RETURN false; END IF;
  IF r.lock_id IS NOT NULL THEN
    IF r.transaction_id IS NOT NULL OR NOT EXISTS(
       SELECT 1 FROM f06_3c1_ci.refund_origins o
        JOIN f06_3c1_ci.status_events e ON e.refund_id=o.refund_id AND e.event_kind='closed_without_payment'
        JOIN f06_3c1_ci.request_keys k ON k.event_key_sha256=e.event_key_sha256 AND k.action='close'
       WHERE o.refund_id=r.refund_id AND o.lock_id=r.lock_id
         AND o.vehicle_id=v AND o.listing_cycle_id=cyc AND o.customer_id=r.customer_id
    ) THEN RETURN false; END IF;
  ELSIF r.transaction_id IS NOT NULL THEN
    IF NOT EXISTS(
      SELECT 1 FROM f06_5a_ci.refund_origins o
       JOIN f06_5a_ci.status_events e ON e.refund_id=o.refund_id AND e.event_kind='closed_without_payment'
       JOIN f06_5a_ci.request_keys k ON k.event_key_sha256=e.event_key_sha256 AND k.action='close'
      WHERE o.refund_id=r.refund_id AND o.transaction_id=r.transaction_id
       AND o.vehicle_id=v AND o.listing_cycle_id=cyc AND o.customer_id=r.customer_id
    ) THEN RETURN false; END IF;
  ELSE RETURN false; END IF;
 END LOOP;

 -- 真实金钱来源未逐笔签名为完全结清前，保守拒绝新 Priority。
 IF EXISTS(
   SELECT 1 FROM public.deposit_receipts d
     JOIN public.locks l ON l.lock_id=d.lock_id
   WHERE l.vehicle_id=v AND l.listing_cycle_id=cyc
 ) OR EXISTS(
   SELECT 1 FROM public.refund_payments p
    JOIN public.refund_cases r ON r.refund_id=p.refund_id
    LEFT JOIN public.locks l ON l.lock_id=r.lock_id
    LEFT JOIN public.transactions t ON t.transaction_id=r.transaction_id
   WHERE (l.vehicle_id=v AND l.listing_cycle_id=cyc)
      OR (t.vehicle_id=v AND t.listing_cycle_id=cyc)
 ) THEN RETURN false; END IF;
 RETURN true;
END $$;

-- 独立校验取消凭据；被候补/资金阻断时仍必须核对取消自身合法性。
CREATE FUNCTION f06_5c_pg1_ci.valid_cancel_signature(tx_id bigint)
RETURNS boolean LANGUAGE plpgsql VOLATILE AS $$
DECLARE t record;
BEGIN
 SELECT * INTO t FROM public.transactions WHERE transaction_id=tx_id;
 IF NOT FOUND OR t.status <> 'cancelled' OR t.completed_at IS NOT NULL
 THEN RETURN false; END IF;
 IF NOT EXISTS(
    SELECT 1 FROM f06_3b_ci.transaction_origins o
      JOIN f06_5b_ci.guard_events g ON g.transaction_id=o.transaction_id
       JOIN f06_3b_ci.origin_events oe ON oe.transaction_id=o.transaction_id
       JOIN f06_3b_ci.request_keys rk ON rk.event_key_sha256=oe.event_key_sha256
      JOIN public.locks l ON l.lock_id=o.source_lock_id
    WHERE o.transaction_id=tx_id AND o.source_lock_id=t.source_lock_id
      AND o.vehicle_id=t.vehicle_id AND o.listing_cycle_id=t.listing_cycle_id
      AND o.customer_id=t.customer_id AND o.public_carrier_status='in_progress'
      AND o.lock_end_reason='converted_to_transaction'
       AND oe.source_lock_id=o.source_lock_id
       AND oe.actor_employee_id=o.opening_actor_employee_id
       AND oe.event_kind='lock_converted_to_transaction'
       AND oe.previous_lock_status='active' AND oe.final_lock_status='released'
       AND rk.resulting_transaction_id=o.transaction_id
       AND rk.source_lock_id=o.source_lock_id
       AND rk.opening_actor_employee_id=o.opening_actor_employee_id
       AND rk.action='open'
       AND g.actor_employee_id=o.opening_actor_employee_id
      AND g.source_lock_id=t.source_lock_id AND g.vehicle_id=t.vehicle_id
      AND g.listing_cycle_id=t.listing_cycle_id AND g.production_issuer='UNWIRED'
      AND l.lock_status='released' AND l.end_reason='converted_to_transaction'
 ) THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM f06_4a_ci.cancel_origins WHERE transaction_id=tx_id)
    AND EXISTS(SELECT 1 FROM f06_4c_ci.cancel_origins WHERE transaction_id=tx_id)
 THEN RETURN false; END IF;
 IF EXISTS(
   SELECT 1 FROM f06_4a_ci.cancel_origins o
      JOIN f06_4a_ci.cancel_events e ON e.transaction_id=o.transaction_id
      JOIN f06_4a_ci.request_keys k ON k.event_key_sha256=e.event_key_sha256
    WHERE o.transaction_id=tx_id AND o.source_lock_id=t.source_lock_id
      AND o.customer_id=t.customer_id AND o.vehicle_id=t.vehicle_id
      AND o.listing_cycle_id=t.listing_cycle_id
      AND o.original_responsible_employee_id=t.responsible_employee_id
        AND o.original_responsible_employee_id=(SELECT birth.original_responsible_employee_id
          FROM f06_3b_ci.transaction_origins birth WHERE birth.transaction_id=t.transaction_id)
      AND o.actor_employee_id=e.actor_employee_id
      AND e.actor_employee_id=k.actor_employee_id AND k.transaction_id=tx_id
      AND e.event_kind='transaction_cancelled_without_payment'
      AND o.previous_status='in_progress' AND o.resulting_status='cancelled'
      AND e.previous_status='in_progress' AND e.resulting_status='cancelled'
      AND o.reason=e.reason AND k.action='cancel'
 ) THEN RETURN true; END IF;
 RETURN EXISTS(
   SELECT 1 FROM f06_4c_ci.cancel_origins o
    JOIN f06_4c_ci.cancel_events e ON e.transaction_id=o.transaction_id
    JOIN f06_4c_ci.request_keys k ON k.event_key_sha256=e.event_key_sha256 AND k.event_id=e.event_id
    JOIN f06_4b_ci.responsible_projection p ON p.transaction_id=o.transaction_id
    JOIN f06_4b_ci.handoff_events h ON h.event_id=p.last_event_id AND h.transaction_id=t.transaction_id
    JOIN f06_4b_ci.request_keys hk ON hk.result_event_id=h.event_id
    WHERE o.transaction_id=tx_id AND o.source_lock_id=t.source_lock_id
      AND o.customer_id=t.customer_id AND o.vehicle_id=t.vehicle_id
      AND o.listing_cycle_id=t.listing_cycle_id
      AND o.original_responsible_employee_id=p.original_responsible_employee_id
        AND o.original_responsible_employee_id=(SELECT birth.original_responsible_employee_id
          FROM f06_3b_ci.transaction_origins birth WHERE birth.transaction_id=t.transaction_id)
      AND o.transferred_responsible_employee_id=t.responsible_employee_id
       AND p.current_responsible_employee_id=t.responsible_employee_id
       AND h.new_responsible_employee_id=t.responsible_employee_id
      AND o.actor_employee_id=t.responsible_employee_id
      AND o.parent_last_handoff_event_id=p.last_event_id
      AND o.parent_handoff_event_count=p.event_count
      AND e.parent_last_handoff_event_id=h.event_id
      AND e.current_responsible_employee_id=t.responsible_employee_id
       AND e.original_responsible_employee_id=o.original_responsible_employee_id
       AND e.reason=o.reason
      AND e.actor_employee_id=k.actor_employee_id
      AND k.transaction_id=tx_id AND hk.transaction_id=tx_id
       AND hk.actor_employee_id=h.actor_employee_id
      AND o.previous_status='in_progress' AND o.resulting_status='cancelled'
      AND e.event_kind='post_handoff_transaction_cancelled_ci_only'
 );
END $$;

-- 名称按字母排在旧 f05_8_priority_append_history 之后；旧函数既有字节保持不变。
-- 仅对旧源自动签发允许「静默跳过」，使合法 4A/4C 的临时半签时序不致整体回滚。
-- 显式人工签发如不安全，必须报错让上游事务撤销，绝不能伪造成功。
CREATE FUNCTION f06_5c_pg1_ci.guard_priority_insert() RETURNS trigger LANGUAGE plpgsql AS $
BEGIN
 -- 自动父签发及显式插入都须绑定当前真实F05-7 Match、资格与员工授权范围。
 -- 旧父自动发行的候选正取自同一不可变F05-8视图，故合法场景保持等价。
 IF NOT EXISTS(
  SELECT 1 FROM public.f05_8_eligible_candidates_ci e
  WHERE e.vehicle_id=NEW.vehicle_id AND e.listing_cycle_id=NEW.listing_cycle_id
   AND e.customer_id=NEW.customer_id AND e.demand_id=NEW.trigger_demand_id
   AND e.result_id=NEW.source_match_result_id
   AND e.source_signature=NEW.source_signature
   AND e.responsible_employee_id=NEW.responsible_employee_id
 ) THEN
  IF NEW.creation_key LIKE 'source-create:%' THEN RETURN NULL; END IF;
  RAISE EXCEPTION 'F06_5C_PG1_UNSIGNED_MATCH_OR_QUALIFICATION' USING ERRCODE='23514';
 END IF;
 IF NOT f06_5c_pg1_ci.safe_to_issue(NEW.vehicle_id,NEW.listing_cycle_id) THEN
  IF NEW.creation_key LIKE 'source-create:%' THEN RETURN NULL; END IF;
  RAISE EXCEPTION 'F06_5C_PG1_UNTRUSTED_PRIORITY_ISSUER'
    USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER pg1_signed_priority_insert
 BEFORE INSERT ON public.f05_8_priority_ci FOR EACH ROW
 EXECUTE FUNCTION f06_5c_pg1_ci.guard_priority_insert();

-- 原事务 UPDATE public.status 时旧F05源已同步尝试签发（被上方截住）；
-- 当且仅当合法签名都写完，在事务末重跑原版签发器。
-- 伪取消必须在 COMMIT 时回滚，而非留下伪造终态。
CREATE FUNCTION f06_5c_pg1_ci.finalize_cancel() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE fresh record;
BEGIN
 SELECT * INTO fresh FROM public.transactions WHERE transaction_id=NEW.transaction_id;
 IF NOT FOUND OR fresh.status <> 'cancelled' THEN RETURN NULL; END IF;
 PERFORM 1 FROM public.vehicles WHERE vehicle_id=fresh.vehicle_id FOR UPDATE;
 IF NOT f06_5c_pg1_ci.safe_to_issue(fresh.vehicle_id,fresh.listing_cycle_id) THEN
  -- 待处理候补/资金时合法取消可提交，只有取消签名本身伪造才应回滚。
  IF NOT f06_5c_pg1_ci.valid_cancel_signature(fresh.transaction_id) THEN
    RAISE EXCEPTION 'F06_5C_PG1_UNSIGNED_CANCEL_ROLLBACK' USING ERRCODE='23514';
  END IF;
  RETURN NULL;
 END IF;
 PERFORM public.f05_8_reconcile_scope_ci(fresh.vehicle_id,fresh.listing_cycle_id);
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER pg1_deferred_signed_cancel
 AFTER UPDATE OF status ON public.transactions
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
 EXECUTE FUNCTION f06_5c_pg1_ci.finalize_cancel();
