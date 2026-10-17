// Separate fail-closed disposable PG16 caller, not the F01/F03 database.
import {randomBytes} from 'node:crypto';
import {createCatalogService} from './catalog-service.mjs';
import {createCatalogHandler} from './catalog-http.mjs';
export function validateCatalogEnv(env=process.env){
 if(env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')throw Error('CATALOG_TEST_ONLY');
 if(env.API_HOST && !['127.0.0.1','localhost','::1'].includes(env.API_HOST))throw Error('CATALOG_LOOPBACK_REQUIRED');
 if(!env.F05_CATALOG_DATABASE_URL)throw Error('CATALOG_DATABASE_REQUIRED');
 let u;try{u=new URL(env.F05_CATALOG_DATABASE_URL)}catch{throw Error('CATALOG_DB_URI_INVALID')}
 if(!['postgres:','postgresql:'].includes(u.protocol)||u.hostname!=='127.0.0.1'||u.port!=='5432'||u.pathname!=='/f05_catalog_test'||u.username!=='f05_catalog_ci'||!u.password||u.search||u.hash)throw Error('CATALOG_DATABASE_NOT_ISOLATED');
 return {connectionString:env.F05_CATALOG_DATABASE_URL};
}
// Availability must be rechecked at request time, not only at startup.
// A successful SELECT 1 alone is insufficient if the test schema was dropped.
export const SQL_CATALOG_IDENTITY = "SELECT current_setting('server_version_num')::integer AS v,current_database() AS db,current_user AS role";
// DB identity is not proof of table shape. A same-named, incompatible fixture must be denied.
// Expected original Vehicle/Cycle column types come from the sealed M94 catalog;
// p/x are additive test-only sidecars, never production source evidence.
const REQUIRED_CATALOG_COLUMNS=Object.freeze([
 ['public.vehicles','vehicle_id','bigint'],
 ['public.vehicles','source_type','text'],
 ['public.vehicles','source_sale_status','text'],
 ['public.vehicles','platform_visibility','text'],
 ['public.vehicles','archived_at','timestamp with time zone'],
 ['public.vehicles','model_id','bigint'],
 ['public.vehicle_listing_cycles','vehicle_id','bigint'],
 ['public.vehicle_listing_cycles','listing_cycle_id','bigint'],
 ['public.vehicle_listing_cycles','started_at','timestamp with time zone'],
 ['public.vehicle_listing_cycles','ended_at','timestamp with time zone'],
 ['public.f05_real_catalog_visibility_test','vehicle_id','bigint'],
 ['public.f05_real_catalog_visibility_test','listing_cycle_id','bigint'],
 ['public.f05_real_catalog_visibility_test','allow_anonymous','boolean'],
 ['public.f05_real_catalog_visibility_test','verified_isolation','text'],
 ['public.f05_real_catalog_visibility_test','expires_at','timestamp with time zone'],
 ['public.f05_real_catalog_protections_test','vehicle_id','bigint'],
 ['public.f05_real_catalog_protections_test','listing_cycle_id','bigint'],
 ['public.f05_real_catalog_protections_test','ended_at','timestamp with time zone'],
]);
const EXPECTED_COLUMNS_VALUES=REQUIRED_CATALOG_COLUMNS.map(x=>`('${x[0]}','${x[1]}','${x[2]}')`).join(',');
export const SQL_CATALOG_SCHEMA=`SELECT
 to_regclass('public.vehicles') IS NOT NULL AS v,
 to_regclass('public.vehicle_listing_cycles') IS NOT NULL AS c,
 to_regclass('public.f05_real_catalog_visibility_test') IS NOT NULL AS p,
 to_regclass('public.f05_real_catalog_protections_test') IS NOT NULL AS x,
 NOT EXISTS (
  SELECT 1 FROM (VALUES ${EXPECTED_COLUMNS_VALUES}) AS expected(relation,column_name,physical_type)
  LEFT JOIN pg_catalog.pg_attribute attr
   ON attr.attrelid=to_regclass(expected.relation)
   AND attr.attname=expected.column_name AND attr.attnum>0 AND NOT attr.attisdropped
  WHERE attr.attname IS NULL OR pg_catalog.format_type(attr.atttypid,attr.atttypmod)<>expected.physical_type
 ) AS shape,
 (SELECT count(*)=2 FROM pg_catalog.pg_constraint fk
  WHERE fk.contype='f'
   AND fk.conrelid IN (to_regclass('public.f05_real_catalog_visibility_test'),to_regclass('public.f05_real_catalog_protections_test'))
   AND fk.confrelid=to_regclass('public.vehicle_listing_cycles')
   AND array_length(fk.conkey,1)=2 AND array_length(fk.confkey,1)=2) AS fk`;
export async function probeIsolatedCatalog(pool){
 try{
  const identity=(await pool.query(SQL_CATALOG_IDENTITY)).rows[0];
  if(!identity || Math.floor(Number(identity.v)/10000)!==16 || identity.db!=='f05_catalog_test' || identity.role!=='f05_catalog_ci')return false;
  const schema=(await pool.query(SQL_CATALOG_SCHEMA)).rows[0];
  return !!schema && Object.keys(schema).sort().join(',')==='c,fk,p,shape,v,x' && Object.values(schema).every(v=>v===true);
 }catch{return false}
}
export async function createIsolatedCatalogRuntime(env=process.env){
 const conf=validateCatalogEnv(env);
 const {default:pg}=await import('pg');
 const pool=new pg.Pool({connectionString:conf.connectionString,max:4,connectionTimeoutMillis:900,query_timeout:1800,statement_timeout:1800,application_name:'f05_catalog_disposable_only'});
 try{
  if(!await probeIsolatedCatalog(pool))throw Error('CATALOG_PG16_IDENTITY_OR_SCHEMA_DENIED');
  const service=createCatalogService({pool,cursorKey:randomBytes(32)});
  return {pool,handler:createCatalogHandler(service),ready:()=>probeIsolatedCatalog(pool),close:()=>pool.end()};
 }catch(e){await pool.end();throw e}
}
