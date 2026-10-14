// PG1：原F05-7(v23)/F05-8(v24)真实签名服务的历史Catalog只读视图。
// 仅对冻结父的结构清单SELECT及旧版本Ledger返回真实原行；业务SQL透传一个物理事务。
// 新版PG1验证先验证整个真实24链及精确3对象增量，绝不更改父模块签名常量。
// 不依赖未合并的F06-5C PR62源码。
import {verify as verifyNew,gate} from './catalog-delta-verifier.mjs';
const HISTORY_SQL='SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id';
function history(c,version){
 if(![21,22].includes(version))throw Error('PG1_HISTORIC_PARENT_VERSION_DENIED');
 const later=version===21?/(^|[.])f05_(8|9|10)_/:/(^|[.])f05_(9|10)_/;
 const isCatalogQuery=s=>typeof s==='string'&&
  ((s.includes(' AS name')&&s.includes(' AS definition')&&s.includes('pg_namespace n')&&s.includes("n.nspname='public'"))||
   (s.includes('pg_sequences s')&&s.includes("s.schemaname='public'")&&s.includes(' AS definition')));
 return {query:async(sql,...args)=>{
  if(typeof sql==='string'&&sql.trim()===HISTORY_SQL)
   return c.query(HISTORY_SQL+' LIMIT '+version,...args);
  const answer=await c.query(sql,...args);
  if(isCatalogQuery(sql)){
   const rows=answer.rows.filter(r=>!later.test(String(r.name)));
   return {...answer,rows,rowCount:rows.length};
  }
  return answer;
 }};
}
export function historicalSignedService(auth,version,{afterPatch=true}={}){
 gate();
 if(![21,22].includes(version)||typeof auth?.withSession!=='function')
  throw Error('PG1_HISTORIC_AUTH_OR_VERSION_DENIED');
 return {withSession:(token,fn,opt)=>{
  if(typeof fn!=='function'||opt?.normalOnly!==true)throw Error('PG1_SIGNED_PARENT_NORMAL_SESSION_REQUIRED');
  return auth.withSession(token,async(c,actor,s,now)=>{
   if(afterPatch)await verifyNew(c);
   return fn(history(c,version),actor,s,now);
  },opt);
 }};
}
