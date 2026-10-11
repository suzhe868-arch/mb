// F05-3H｜仅限隔离PG16的受信来源审计；物理identity不代表持有者已认证。
import {verify} from '../favorite-physical-carrier/migration.mjs';

export const SOURCE_GAP = 'CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP';
export const TRUST_CHAIN = Object.freeze([
  ['WECHAT_OFFICIAL_SERVER_CODE_EXCHANGE', 'SOURCE_GAP'],
  ['CUSTOMER_SESSION_ISSUE_AND_REVOCATION', 'SOURCE_GAP'],
  ['SESSION_TO_IDENTITY_SCOPE_AND_KEY_POSSESSION', 'SOURCE_GAP'],
  ['IDENTITY_SCOPE_AND_KEY_TO_CUSTOMER', 'SIGNED_SOURCE'],
  ['CUSTOMER_CURRENT_ACTIVE_STATUS', 'SIGNED_SOURCE'],
  ['CUSTOMER_TO_VEHICLE_FAVORITE_CARRIER', 'SIGNED_SOURCE'],
  ['CUSTOMER_FAVORITE_SELF_ACTION_AUTHORIZATION', 'SOURCE_GAP'],
  ['CUSTOMER_CSRF_ORIGIN_REPLAY_REVOCATION', 'SOURCE_GAP']
]);

function requireCI() {
  const expected = {
    CI: 'true',
    GITHUB_ACTIONS: 'true',
    GITHUB_REPOSITORY: 'suzhe868-arch/mb',
    APP_ENV: 'test',
    NODE_ENV: 'test',
    F05_2_ISOLATION_CONFIRM: 'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'
  };
  for (const [name, value] of Object.entries(expected)) {
    if (process.env[name] !== value) throw Error('F05_3H_CI_ONLY_' + name);
  }
}

export async function auditPhysicalIdentity(db) {
  requireCI();
  const seal = await verify(db);
  if (seal.verified !== true) throw Error('F05_3H_V19_NOT_VERIFIED');
  const columns = (await db.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='customer_wechat_identities'"
  )).rows.map(row => row.column_name);
  const constraints = (await db.query(
    "SELECT contype, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.customer_wechat_identities'::regclass"
  )).rows;
  const indexes = (await db.query(
    "SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='customer_wechat_identities'"
  )).rows;
  const required = ['wechat_identity_id', 'customer_id', 'identity_scope', 'wechat_identity_key', 'first_seen_at'];
  if (required.some(name => !columns.includes(name))) throw Error('F05_3H_MISSING_WECHAT_COLUMNS');
  if (!constraints.some(row => row.contype === 'f' && /customer_id/.test(row.definition) && /customers/.test(row.definition))) {
    throw Error('F05_3H_MISSING_CUSTOMER_FK');
  }
  if (!indexes.some(row => /UNIQUE INDEX/i.test(row.indexdef) &&
      /identity_scope/.test(row.indexdef) && /wechat_identity_key/.test(row.indexdef))) {
    throw Error('F05_3H_MISSING_SCOPED_UNIQUE_INDEX');
  }
  return {
    physicalIdentityRelationVerified: true,
    authenticCustomerSessionVerified: false,
    sourceGap: SOURCE_GAP,
    columns,
    trustChain: TRUST_CHAIN,
    structureSha256: seal.newSha
  };
}

// 只读检查CI专用合成行，不输出身份密钥、客户ID，也绝不颁发Customer会话。
export async function inspectSyntheticIdentity(db, scope, key) {
  requireCI();
  if (typeof scope !== 'string' || !/^f05h_ci_[a-z]{2,16}$/.test(scope) ||
      typeof key !== 'string' || !/^f05h_ci_[a-z_]{2,32}$/.test(key)) {
    return { authenticated: false, mapped: false, sourceGap: SOURCE_GAP };
  }
  const result = await db.query(
    "SELECT c.account_status FROM public.customer_wechat_identities wi " +
    "JOIN public.customers c ON c.customer_id=wi.customer_id " +
    "WHERE wi.identity_scope=$1 AND wi.wechat_identity_key=$2 FOR SHARE OF wi,c",
    [scope, key]
  );
  return {
    authenticated: false,
    mapped: result.rowCount === 1,
    active: result.rows[0]?.account_status === 'active',
    sourceGap: SOURCE_GAP
  };
}

// 没有经签发证明的微信用户本人会话时，所有声称（含PC Cookie、openid、customerId、trusted=true）均拒绝。
export async function auditUntrustedClaim(db, _claim) {
  requireCI();
  await verify(db);
  return { allowed: false, sourceGap: SOURCE_GAP };
}
