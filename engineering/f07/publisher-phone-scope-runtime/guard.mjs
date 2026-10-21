import {readFile} from 'node:fs/promises';

const CAPABILITY = 'publisher.phone.sensitive';
const EMPLOYEE_ROLES = new Set(['sales','manager','store_manager']);
const SCOPE_MODES = new Set(['LOCKED_ONLY','ALL_ACTIVE_JYT']);
const deny = (code, status=403, origin='SIGNED_PARENT_NEGATIVE_ONLY') =>
  Object.freeze({ok:false,allowed:false,code,status,origin});
const validEmployeeId = value => Number.isSafeInteger(value) && value > 0;
const validVehicleId = value => typeof value === 'string' && /^[1-9][0-9]{0,17}$/.test(value);

export async function bootstrapPublisherPhoneScope(pool) {
  await pool.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
}

async function runtimeTransaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    const result = await fn(client);
    if (result && result.allowed === false) {
      await client.query('ROLLBACK');
      return result;
    }
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(()=>{});
    throw error;
  } finally {
    client.release();
  }
}

export async function authorizePublisherPhone({auth,pool,token,vehicleId,action}) {
  if (!['vehicle.publisher_phone.read','vehicle.publisher_phone.latest','vehicle.publisher_phone.dial'].includes(action))
    return deny('UNKNOWN_PUBLISHER_PHONE_ACTION');
  if (!validVehicleId(vehicleId)) return deny('VEHICLE_ID_INVALID',400,'CI_SYNTHETIC_ONLY');

  const permission = await auth.withSession(token, async (client,actor,session) => {
    if (!session || session.restricted || actor.principal_kind !== 'employee' ||
        actor.credential_state !== 'enabled' || actor.subject_status !== 'active' ||
        actor.force_password_change !== false || actor.employee_id == null ||
        actor.system_admin_id != null) return deny('CURRENT_EMPLOYEE_SESSION_REQUIRED');

    const result = await client.query(
      'SELECT e.employee_id::text AS employee_id,e.employment_status,r.role_code,' +
      'p.permission_id::text AS permission_id,o.decision AS personal_decision,d.enabled AS role_enabled,' +
      'EXISTS (SELECT 1 FROM public.employee_capability_scope_bindings b ' +
      'JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=b.employee_id ' +
      'WHERE b.employee_id=e.employee_id AND b.permission_id=p.permission_id ' +
      'AND s.scope_kind=$3 AND s.scope_reference_id=e.employee_id AND s.ended_at IS NULL ' +
      'AND b.granted_at<=transaction_timestamp() ' +
      'AND (b.ended_at IS NULL OR b.ended_at>transaction_timestamp())) AS capability_scope_bound ' +
      'FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id ' +
      'LEFT JOIN public.permissions p ON p.permission_code=$2 ' +
      'LEFT JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id ' +
      'LEFT JOIN public.role_permission_defaults d ON d.role_id=e.main_role_id AND d.permission_id=p.permission_id ' +
      'WHERE e.employee_id=$1::bigint FOR SHARE OF e',
      [String(actor.employee_id),CAPABILITY,'publisher_phone_special']
    );
    if (result.rowCount !== 1) return deny('CURRENT_EMPLOYEE_NOT_FOUND');
    const row = result.rows[0];
    if (row.employee_id !== String(actor.employee_id) || row.employment_status !== 'active')
      return deny('CURRENT_EMPLOYEE_NOT_ACTIVE');
    if (row.role_code === 'four_s') return deny('FOUR_S_HARD_DENY');
    if (!EMPLOYEE_ROLES.has(row.role_code)) return deny('EMPLOYEE_ROLE_DENIED');
    if (!row.permission_id) return deny('CAPABILITY_NOT_IN_CURRENT_CATALOG',403,'SOURCE_GAP');
    if (row.personal_decision === 'deny') return deny('CURRENT_PERSONAL_DENY');
    if (row.personal_decision !== 'allow') return deny('CURRENT_CAPABILITY_NOT_GRANTED');
    if (row.capability_scope_bound !== true) return deny('PUBLISHER_PHONE_CAPABILITY_SCOPE_BINDING_REQUIRED');
    return {ok:true,allowed:true,employeeId:row.employee_id,roleCode:row.role_code};
  }, {normalOnly:true});

  if (!permission) return deny('SESSION_OR_PC_ADMISSION_DENIED');
  if (permission.allowed !== true) return permission;

  return runtimeTransaction(pool, async client => {
    const scope = await client.query(
      'SELECT scope_mode,enabled,origin FROM f07_runtime.publisher_phone_employee_scope ' +
      'WHERE employee_id=$1::bigint FOR SHARE',
      [permission.employeeId]
    );
    if (scope.rowCount !== 1 || scope.rows[0].enabled !== true)
      return deny('PHONE_SCOPE_NOT_ENABLED');
    if (scope.rows[0].origin !== 'CI_SYNTHETIC_ONLY')
      return deny('PHONE_SCOPE_SOURCE_GAP',403,'SOURCE_GAP');
    const mode = scope.rows[0].scope_mode;
    if (!SCOPE_MODES.has(mode)) return deny('PHONE_SCOPE_MODE_INVALID');

    const current = await client.query(
      'SELECT vehicle_id::text AS vehicle_id,listing_cycle_id::text AS listing_cycle_id,' +
      'source_platform,upstream_publisher_id,source_type,listing_status,origin ' +
      'FROM f07_runtime.publisher_phone_vehicles ' +
      'WHERE vehicle_id=$1::bigint AND is_current_cycle=true FOR SHARE',
      [vehicleId]
    );
    if (current.rowCount !== 1) return deny('CURRENT_VEHICLE_NOT_FOUND');
    const vehicle = current.rows[0];
    if (vehicle.origin !== 'CI_SYNTHETIC_ONLY')
      return deny('VEHICLE_SOURCE_GAP',403,'SOURCE_GAP');
    if (vehicle.source_platform !== 'JYT' || vehicle.source_type !== 'wholesale' ||
        vehicle.listing_status !== 'active')
      return deny('CURRENT_WHOLESALE_JYT_REQUIRED');
    if (!vehicle.upstream_publisher_id)
      return deny('PUBLISHER_MAPPING_SOURCE_GAP',403,'SOURCE_GAP');

    if (mode === 'LOCKED_ONLY') {
      const lock = await client.query(
        'SELECT lock_id FROM f07_runtime.publisher_phone_locks ' +
        'WHERE vehicle_id=$1::bigint AND listing_cycle_id=$2::bigint ' +
        'AND status=$3 AND expires_at>clock_timestamp() AND origin=$4 FOR SHARE',
        [vehicle.vehicle_id,vehicle.listing_cycle_id,'active','CI_SYNTHETIC_ONLY']
      );
      if (lock.rowCount < 1) return deny('CURRENT_LOCK_REQUIRED');
    }

    return {
      ok:true,allowed:true,code:'PUBLISHER_PHONE_ALLOWED',origin:'CI_SYNTHETIC_ONLY',
      employeeId:permission.employeeId,roleCode:permission.roleCode,
      vehicleId:vehicle.vehicle_id,listingCycleId:vehicle.listing_cycle_id,
      sourcePlatform:vehicle.source_platform,upstreamPublisherId:vehicle.upstream_publisher_id,
      scopeMode:mode
    };
  });
}

export async function configurePublisherPhoneAccess({auth,pool,token,input}) {
  const keys = input && typeof input === 'object' && !Array.isArray(input)
    ? Object.keys(input).sort().join('|') : '';
  if (keys !== 'action|employee_id|scope_mode' ||
      !['grant','revoke'].includes(input.action) ||
      !SCOPE_MODES.has(input.scope_mode))
    return deny('INVALID_PHONE_SCOPE_CONFIG',400,'CI_SYNTHETIC_ONLY');
  const employeeId = typeof input.employee_id === 'number' ? input.employee_id :
    (typeof input.employee_id === 'string' && /^[1-9][0-9]{0,17}$/.test(input.employee_id) ? Number(input.employee_id) : NaN);
  if (!validEmployeeId(employeeId)) return deny('INVALID_EMPLOYEE_ID',400,'CI_SYNTHETIC_ONLY');
  if (typeof token !== 'string') return deny('SYSTEM_ADMIN_SESSION_REQUIRED');

  let staged = false;
  try {
    const result = await auth.withSession(token, async (client,actor,session) => {
      if (!session || session.restricted || actor.principal_kind !== 'system_admin' ||
          actor.credential_state !== 'enabled' || actor.subject_status !== 'active' ||
          actor.force_password_change !== false || actor.system_admin_id == null ||
          actor.employee_id != null)
        return deny('SYSTEM_ADMIN_CONTROL_REQUIRED');

      const target = await client.query(
        'SELECT e.employee_id::text AS employee_id,e.employment_status,r.role_code ' +
        'FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id ' +
        'JOIN public.pc_login_accounts a ON a.employee_id=e.employee_id ' +
        'WHERE e.employee_id=$1::bigint AND a.principal_kind=$2 AND a.credential_state=$3 ' +
        'ORDER BY a.account_id LIMIT 1 FOR UPDATE OF e,a',
        [employeeId,'employee','enabled']
      );
      if (target.rowCount !== 1 || target.rows[0].employment_status !== 'active')
        return deny('TARGET_EMPLOYEE_NOT_ELIGIBLE');
      if (!EMPLOYEE_ROLES.has(target.rows[0].role_code))
        return deny(target.rows[0].role_code === 'four_s' ? 'FOUR_S_TARGET_HARD_DENY' : 'TARGET_EMPLOYEE_ROLE_DENIED');

      const cap = await client.query(
        'SELECT permission_id::text AS permission_id FROM public.permissions WHERE permission_code=$1',
        [CAPABILITY]
      );
      if (cap.rowCount !== 1) return deny('CAPABILITY_NOT_IN_CURRENT_CATALOG',403,'SOURCE_GAP');
      const permissionId = cap.rows[0].permission_id;
      const previous = await client.query(
        'SELECT decision FROM public.employee_permission_overrides WHERE employee_id=$1::bigint AND permission_id=$2::bigint FOR UPDATE',
        [employeeId,permissionId]
      );
      const scopeBeforeResult = await pool.query(
        'SELECT scope_mode,enabled FROM f07_runtime.publisher_phone_employee_scope WHERE employee_id=$1::bigint',
        [employeeId]
      );
      const scopeBefore = scopeBeforeResult.rows[0] || null;

      await pool.query(
        'INSERT INTO f07_runtime.publisher_phone_employee_scope(employee_id,scope_mode,enabled,updated_by_system_admin_id,updated_at,origin) ' +
        'VALUES($1::bigint,$2,false,$3::bigint,clock_timestamp(),$4) ' +
        'ON CONFLICT(employee_id) DO UPDATE SET scope_mode=EXCLUDED.scope_mode,enabled=false,' +
        'updated_by_system_admin_id=EXCLUDED.updated_by_system_admin_id,updated_at=clock_timestamp(),origin=EXCLUDED.origin',
        [employeeId,input.scope_mode,actor.system_admin_id,'CI_SYNTHETIC_ONLY']
      );
      staged = true;

      await client.query(
        'UPDATE public.employee_capability_scope_bindings SET ended_at=transaction_timestamp() ' +
        'WHERE employee_id=$1::bigint AND permission_id=$2::bigint AND ended_at IS NULL',
        [employeeId,permissionId]
      );
      await client.query(
        'UPDATE public.employee_data_scopes SET ended_at=transaction_timestamp() ' +
        'WHERE employee_id=$1::bigint AND scope_kind=$2 AND ended_at IS NULL',
        [employeeId,'publisher_phone_special']
      );

      if (input.action === 'grant') {
        const newScope = await client.query(
          'INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id,ended_at) ' +
          'VALUES($1::bigint,$2,$1::bigint,NULL) RETURNING scope_id::text AS scope_id',
          [employeeId,'publisher_phone_special']
        );
        await client.query(
          'INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at,ended_at) ' +
          'VALUES($1::bigint,$2::bigint,$3::bigint,transaction_timestamp(),NULL)',
          [employeeId,permissionId,newScope.rows[0].scope_id]
        );
        await client.query(
          'INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) ' +
          'VALUES($1::bigint,$2::bigint,$3,transaction_timestamp()) ' +
          'ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision=EXCLUDED.decision,changed_at=transaction_timestamp()',
          [employeeId,permissionId,'allow']
        );
        await client.query(
          'INSERT INTO public.employee_permission_override_history(employee_id,permission_id,decision,actor_kind,actor_id) ' +
          'VALUES($1::bigint,$2::bigint,$3,$4,$5::bigint)',
          [employeeId,permissionId,'allow','system_admin',actor.system_admin_id]
        );
      } else {
        await client.query(
          'DELETE FROM public.employee_permission_overrides WHERE employee_id=$1::bigint AND permission_id=$2::bigint',
          [employeeId,permissionId]
        );
        await client.query(
          'INSERT INTO public.employee_permission_override_history(employee_id,permission_id,decision,actor_kind,actor_id) ' +
          'VALUES($1::bigint,$2::bigint,$3,$4,$5::bigint)',
          [employeeId,permissionId,'revoked','system_admin',actor.system_admin_id]
        );
      }

      const before = {
        permissionDecision:previous.rows[0]?.decision || null,
        scopeMode:scopeBefore?.scope_mode || null,
        scopeEnabled:scopeBefore?.enabled === true
      };
      const after = {
        permissionDecision:input.action === 'grant' ? 'allow' : null,
        scopeMode:input.scope_mode,
        scopeEnabled:input.action === 'grant',
        sg01BindingActive:input.action === 'grant'
      };
      await client.query(
        'INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) ' +
        'VALUES($1,$2,$3::jsonb,$4,$5,$6,$7::jsonb,$8::jsonb,transaction_timestamp())',
        ['system_admin',String(actor.system_admin_id),
          JSON.stringify({principal_kind:'system_admin',system_admin_id:String(actor.system_admin_id),capability:CAPABILITY}),
          'employee_permission_override',String(employeeId),
          input.action === 'grant' ? 'publisher.phone.scope.grant' : 'publisher.phone.scope.revoke',
          JSON.stringify(before),JSON.stringify(after)]
      );

      if (input.action === 'grant') {
        const activated = await pool.query(
          'UPDATE f07_runtime.publisher_phone_employee_scope SET enabled=true,updated_at=clock_timestamp() ' +
          'WHERE employee_id=$1::bigint AND scope_mode=$2 AND updated_by_system_admin_id=$3::bigint AND origin=$4',
          [employeeId,input.scope_mode,actor.system_admin_id,'CI_SYNTHETIC_ONLY']
        );
        if (activated.rowCount !== 1) throw Error('PHONE_SCOPE_ACTIVATION_FAILED');
      }
      return {
        ok:true,allowed:true,code:input.action === 'grant' ? 'PHONE_SCOPE_GRANTED' : 'PHONE_SCOPE_REVOKED',
        employee_id:employeeId,scope_mode:input.scope_mode,enabled:input.action === 'grant',
        origin:'CI_SYNTHETIC_ONLY'
      };
    }, {normalOnly:true});
    return result || deny('SYSTEM_ADMIN_SESSION_REQUIRED');
  } catch (error) {
    if (staged) {
      await pool.query(
        'UPDATE f07_runtime.publisher_phone_employee_scope SET enabled=false,updated_at=clock_timestamp() WHERE employee_id=$1::bigint',
        [employeeId]
      ).catch(()=>{});
    }
    return deny('PHONE_SCOPE_CONFIG_FAILED',500,'CI_SYNTHETIC_ONLY');
  }
}
