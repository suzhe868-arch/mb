import type { Queryable } from "../../core/db-types.js";
import { idString, intValue } from "../../core/db-types.js";
import type { CustomerDTO, StaffCustomerDTO } from "@mingbang/contracts/types";

function maskPhone(phone: string | null): string | undefined {
  if (!phone) return undefined;
  if (phone.length <= 7) return phone.replace(/.(?=.{2})/g,"*");
  return `${phone.slice(0,3)}****${phone.slice(-4)}`;
}

export async function getCustomerSelf(db: Queryable, customerId: string): Promise<CustomerDTO | null> {
  const { rows } = await db.query({
    text: `SELECT c.customer_id,c.original_name,c.wechat_nickname,c.nickname,c.avatar_url,c.phone_current,
                  e.display_name AS owner_display,cl.name AS level_name
           FROM customers c
           LEFT JOIN employees e ON e.employee_id=c.owner_employee_id
           LEFT JOIN customer_levels cl ON cl.level_id=c.level_id
           WHERE c.customer_id=$1`,
    values: [customerId]
  });
  const r=rows[0]; if(!r) return null;
  const displayName=r.nickname ?? r.wechat_nickname ?? r.original_name ?? `客户#${r.customer_id}`;
  return {
    id:idString(r.customer_id), customer_id:idString(r.customer_id), display_name:String(displayName),
    ...(r.nickname ? {nickname:String(r.nickname)} : {}),
    ...(r.avatar_url ? {avatar_url:String(r.avatar_url)} : {}),
    ...(maskPhone(r.phone_current) ? {phone_masked:maskPhone(r.phone_current)!} : {}),
    ...(r.owner_display ? {owner_display:String(r.owner_display)} : {}),
    ...(r.level_name ? {level:String(r.level_name)} : {})
  };
}

export async function getStaffCustomer(db: Queryable, customerId: string, viewerEmployeeId: string): Promise<StaffCustomerDTO | null> {
  const { rows } = await db.query({
    text: `SELECT c.customer_id,c.original_name,c.wechat_nickname,c.nickname,c.phone_current,c.owner_employee_id,c.is_priority_customer,c.version,
                  cp.summary_text,
                  COALESCE((SELECT jsonb_agg(x.alias_text ORDER BY x.created_at DESC)
                            FROM customer_alias_notes x WHERE x.customer_id=c.customer_id),'[]'::jsonb) AS aliases,
                  (SELECT x.alias_text FROM customer_alias_notes x WHERE x.customer_id=c.customer_id
                   ORDER BY (x.employee_id=$2) DESC,x.created_at DESC LIMIT 1) AS preferred_alias,
                  COALESCE((SELECT jsonb_agg(ct.name ORDER BY ct.name)
                            FROM customer_tag_links ctl JOIN customer_tags ct ON ct.tag_id=ctl.tag_id
                            WHERE ctl.customer_id=c.customer_id),'[]'::jsonb) AS tags,
                  (SELECT count(*)::int FROM demands d WHERE d.customer_id=c.customer_id AND d.status='active') AS active_demand_count,
                  (SELECT count(*)::int FROM consultations q WHERE q.customer_id=c.customer_id AND q.status IN ('pending','processing')) AS open_consultation_count,
                  (SELECT count(*)::int FROM locks l WHERE l.customer_id=c.customer_id AND l.ended_at IS NULL) AS active_lock_count,
                  (SELECT count(*)::int FROM transactions t WHERE t.customer_id=c.customer_id AND t.status='in_progress') AS in_progress_transaction_count
           FROM customers c LEFT JOIN customer_profiles cp ON cp.customer_id=c.customer_id
           WHERE c.customer_id=$1`,
    values: [customerId,viewerEmployeeId]
  });
  const r=rows[0]; if(!r) return null;
  const displayName=r.preferred_alias ?? r.nickname ?? r.wechat_nickname ?? r.original_name ?? `客户#${r.customer_id}`;
  return {
    id:idString(r.customer_id), display_name:String(displayName),
    ...(r.original_name ? {original_name:String(r.original_name)} : {}),
    ...(r.wechat_nickname ? {wechat_nickname:String(r.wechat_nickname)} : {}),
    ...(r.nickname ? {nickname:String(r.nickname)} : {}),
    ...(r.phone_current ? {phone:String(r.phone_current)} : {}),
    ...(Array.isArray(r.aliases) && r.aliases.length ? {sales_aliases:r.aliases.map(String)} : {}),
    ...(r.summary_text ? {profile_summary:String(r.summary_text)} : {}),
    ...(r.owner_employee_id != null ? {owner_employee_id:idString(r.owner_employee_id)} : {}),
    is_priority_customer:Boolean(r.is_priority_customer),
    ...(Array.isArray(r.tags) && r.tags.length ? {tags:r.tags.map(String)} : {}),
    active_business_summary:{
      active_demand_count:intValue(r.active_demand_count),
      open_consultation_count:intValue(r.open_consultation_count),
      active_lock_count:intValue(r.active_lock_count),
      in_progress_transaction_count:intValue(r.in_progress_transaction_count)
    },
    version:intValue(r.version)
  };
}

import type { AdminCustomerDTO, CustomerEntitlementDTO } from "@mingbang/contracts/types";

async function getCustomerEntitlements(db: Queryable, customerId: string): Promise<CustomerEntitlementDTO> {
  const { rows } = await db.query({
    text: `SELECT c.level_id,cl.name AS level_name,
                  COALESCE((SELECT jsonb_object_agg(le.entitlement_key,le.value_json)
                            FROM level_entitlements le WHERE le.level_id=c.level_id),'{}'::jsonb) AS base_values,
                  COALESCE((SELECT jsonb_object_agg(z.entitlement_key,z.value_json)
                            FROM (SELECT DISTINCT ON (o.entitlement_key) o.entitlement_key,o.value_json
                                  FROM customer_entitlement_overrides o
                                  WHERE o.customer_id=c.customer_id AND o.revoked_at IS NULL
                                  ORDER BY o.entitlement_key,o.created_at DESC) z),'{}'::jsonb) AS override_values
           FROM customers c LEFT JOIN customer_levels cl ON cl.level_id=c.level_id
           WHERE c.customer_id=$1`,
    values:[customerId]
  });
  const r=rows[0]; if(!r) return {entitlements:[]};
  const merged={...(r.base_values??{}),...(r.override_values??{})};
  return {
    ...(r.level_id!=null?{level_id:idString(r.level_id)}:{}),
    ...(r.level_name?{level_name:String(r.level_name)}:{}),
    entitlements:Object.entries(merged).map(([key,value])=>({key,value}))
  };
}

export async function getAdminCustomer(db: Queryable, customerId: string, viewerEmployeeId: string): Promise<AdminCustomerDTO | null> {
  const customer=await getStaffCustomer(db,customerId,viewerEmployeeId); if(!customer) return null;
  const {rows}=await db.query({text:`SELECT c.public_pool_since,e.employee_id,e.display_name FROM customers c LEFT JOIN employees e ON e.employee_id=c.owner_employee_id WHERE c.customer_id=$1`,values:[customerId]});
  const r=rows[0]; if(!r)return null;
  const entitlements=await getCustomerEntitlements(db,customerId);
  return {
    customer,entitlements,
    ...(r.public_pool_since?{public_pool_since:new Date(r.public_pool_since).toISOString()}:{}),
    ...(r.employee_id!=null?{owner:{employee_id:idString(r.employee_id),display_name:String(r.display_name)}}:{})
  };
}
