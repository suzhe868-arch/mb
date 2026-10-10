// F05-1: reproducible physical M94 provenance and fail-closed Vehicle ownership policy.
import {readFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {verify as verifyM94} from '../../f03/runtime-transaction-responsible-handover/migration.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const base='engineering/f05/vehicle-scope-safe-projection/';
const catalogPath='engineering/f03/runtime-handover-reconciliation/evidence/pg16_full_catalog.json';
const inventoryPath='engineering/f03/runtime-transaction-responsible-handover/evidence/pg16_inventory.json';
const read=p=>readFileSync(join(root,p),'utf8');
const fail=s=>{throw Error('F05_1_PHYSICAL_'+s)};
const parse=s=>{const [h,...body]=s.trimEnd().split('\n'),head=h.split('\t');return body.map((l,i)=>{const cols=l.split('\t');if(cols.length!==head.length)fail('MALFORMED_ROW_'+(i+2));return Object.fromEntries(cols.map((v,j)=>[head[j],v]))})};
export const safeFieldNames=Object.freeze(['vehicleId','listingCycleId','sourceKind']);
export const forbiddenOutputKeys=Object.freeze(['vin','upstreamPublisherId','publisherPhone','phone','internalWholesalePrice','price','priceHistory','documents','customerId','token','merchantId','teamId','storeId','rawRow']);
export const outlets=Object.freeze(['detail','list','export','copy','cache','print','history']);
export const sourceTypes=Object.freeze(['wholesale','mingbang','four_s']);
export const physicalRef=()=>JSON.parse(read(base+'Vehicle原始M94封印.json'));
export function verifyPhysicalSource(
 fieldsText=read(base+'Vehicle真实物理关系与来源证据.tsv'),
 scopeText=read(base+'Vehicle三来源Actor对象Scope矩阵.tsv'),
 lockText=read(base+'Vehicle原始M94封印.json')){
 const physical=JSON.parse(lockText),archived=JSON.parse(read(catalogPath)),old=JSON.parse(read(inventoryPath));
 if(physical.version!=='F05_1_M94_PHYSICAL_SOURCE_LOCK'||physical.main_sha!=='b0be8663d3cdf5652d7f372a489ec67a02d415e6'||
    physical.archived_catalog!==catalogPath||
    physical.structure_sha256!==old.structure_sha256||
    archived.structure_sha256!==old.structure_sha256||
    old.tables!==94||old.columns!==608||old.constraints!==435||old.indexes!==163||
    archived.objects.length!==2120||
    JSON.stringify(physical.counts)!==JSON.stringify({tables:94,columns:608,constraints:435,indexes:163,objects:2120}))
    fail('FROZEN_SEAL_CHANGED');
 const fields=parse(fieldsText),types=new Set(physical.relevant_tables),seen=new Set();
 const fromCatalog=archived.objects.filter(o=>o.kind==='column'&&physical.relevant_tables.some(t=>o.name.startsWith(t+'.')));
 if(fields.length!==fromCatalog.length||fields.length!==physical.source_rows)fail('FIELD_COUNT');
 for(let i=0;i<fields.length;i++){
  const x=fields[i],source=fromCatalog[i],key=x.table+'.'+x.column;
  const kind=source.definition.split('|')[0];
  if(seen.has(key)||source.name!==key||x.physical_type!==kind||!types.has(x.table)||
     x.nullability!==(source.definition.includes('notnull=true')?'NOT_NULL':'NULLABLE')||
     x.physical_evidence_locator!==catalogPath+'#column:'+key||x.source_seal!=='M94_FROZEN')
     fail('FIELD_PROVENANCE_OR_ALIAS_'+i);
  seen.add(key);
  const restricted=/(vin|phone|password|token|secret|ciphertext|amount_cents|price|payload|document|relative_path|source_url_fact|customer|name|audit)/i.test(x.column);
  const safe=(x.table==='vehicles'&&['vehicle_id','source_type'].includes(x.column))||
    (x.table==='vehicle_listing_cycles'&&['listing_cycle_id','vehicle_id'].includes(x.column));
  if(x.projection_policy!==(safe?'SAFE_CANDIDATE_REQUIRES_CURRENT_AUTH':restricted?'NEVER_DIRECTLY_EXPOSE':'INTERNAL_ONLY_NOT_PROVEN'))fail('SOURCE_FIELD_SAFETY_DOWNGRADE');
  if(!['NOT_OBJECT_OWNERSHIP_AUTHORITY','NO_SIGNED_VEHICLE_OWNER_BINDING'].includes(x.ownership_policy))fail('FORGED_OWNERSHIP');
 }
 for(const req of physical.required_columns){
  if(!seen.has(req.table+'.'+req.column)||fields.find(x=>x.table===req.table&&x.column===req.column)?.physical_type!==req.type)fail('REQUIRED_TRUE_COLUMN_MISSING');
 }
 const names=new Set(archived.objects.filter(o=>o.kind==='relation').map(o=>o.name));
 for(const name of physical.no_owner_binding_table_names)
  if(names.has(name)||!name.startsWith('vehicle_'))fail('FAKE_OWNER_RELATION');
 if(physical.vehicle_scope_classification!=='VEHICLE_SCOPE_SOURCE_GAP_BLOCKED'||
   physical.positive_vehicle_scope_count!==0||
   physical.source_type_not_owner!==true||
   physical.all_business_outlets_deny_if_missing_physical_binding!==true||
   JSON.stringify(physical.source_types)!==JSON.stringify({wholesale:'JYT批发',mingbang:'名邦自有',four_s:'4S合作'}))
   fail('SCOPE_NOT_FAIL_CLOSED');
 const actors=['MINGBANG_EMPLOYEE','EMPLOYEE_MANAGER','FOUR_S_MEMBER','SYSTEM_ADMIN','CUSTOMER_PC_COOKIE','ANONYMOUS'];
 const cycles=['ACTIVE_CURRENT_CYCLE','ENDED_OR_STALE_CYCLE'];
 const matrix=parse(scopeText);
 if(matrix.length!==actors.length*sourceTypes.length*cycles.length*outlets.length)fail('SCOPE_GRID_INCOMPLETE');
 let n=0;
 for(const actor of actors)for(const source of sourceTypes)for(const cycle of cycles)for(const outlet of outlets){
  const r=matrix[n++];
  if(r.actor!==actor||r.vehicle_source!==source||r.listing_cycle!==cycle||
    r.outlet!==outlet||r.decision!=='DENY_403_F05_VEHICLE_SCOPE_UNPROVEN'||
    r.proven_vehicle_ownership_count!=='0'||r.runtime!=='CI_ONLY_NOT_PRODUCTION'||
    r.scope_status!=='REAL_TARGET_VEHICLE_OWNER_TEAM_MERCHANT_MISSING'||
    r.capability!=='VEHICLE_BUSINESS_CAPABILITY_NOT_ATTESTED')fail('SCOPE_GRANTED_BY_BOGUS_OR_STALE_PROOF');
 }
 return Object.freeze({rows:fields.length,matrixRows:matrix.length,physicalPositiveScope:0,
  frozenSha:archived.structure_sha256,checksumFields:createHash('sha256').update(fieldsText).digest('hex'),
  checksumMatrix:createHash('sha256').update(scopeText).digest('hex')});
}
const positiveId=v=>Number.isSafeInteger(v)&&v>0;
export function redactMinimal({vehicle_id,listing_cycle_id,source_type},scope){
 // Explicitly unexportable without distinct signed current object-ownership proof.
 if(scope?.trustedCurrentVehicleOwnership!==true||scope?.signedBusinessRead!==true||
  !positiveId(Number(vehicle_id))||!positiveId(Number(listing_cycle_id))||
  !sourceTypes.includes(source_type))return null;
 return Object.freeze({vehicleId:Number(vehicle_id),listingCycleId:Number(listing_cycle_id),sourceKind:source_type});
}
export async function verifyLiveM94(db){
 const v=await verifyM94(db);
 if(!v.verified||v.sha!==physicalRef().structure_sha256)fail('LIVE_M94_NOT_SIGNED');
 const x=(await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n;
 if(x!==94)fail('LIVE_NOT_94');
 // No trusted present ownership relation; do not use created_by, user-sent team, or 4S role as an alias.
 const r=await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1::text[])",[physicalRef().no_owner_binding_table_names]);
 if(r.rowCount!==0)fail('UNKNOWN_NEW_OWNER_TABLE_UNAPPROVED');
 return Object.freeze({verified:true,vehicleScopeProven:false,sha:v.sha,tables:x});
}
export async function observePhysicalVehicle(db,id){
 if(!positiveId(Number(id)))return null;
 // A candidate physical fact, not an authorization grant. SQL projection has zero sensitive columns.
 const q=await db.query("SELECT v.vehicle_id, v.source_type, v.created_by_employee_id,cy.listing_cycle_id,cy.ended_at FROM public.vehicles v LEFT JOIN LATERAL (SELECT listing_cycle_id,ended_at FROM public.vehicle_listing_cycles WHERE vehicle_id=v.vehicle_id ORDER BY started_at DESC,listing_cycle_id DESC LIMIT 1) cy ON TRUE WHERE v.vehicle_id=$1",[id]);
 return q.rows[0]??null;
}
export async function proveCurrentVehicleScope(db,actor,request){
 if(!actor||!positiveId(request?.vehicleId)||!outlets.includes(request?.outlet)||request?.claimedOwner||request?.merchantId||request?.teamId)
    return {proven:false,reason:'NO_LEGAL_SCOPE_INPUT'};
 // Even legitimate employee, store, team and uploader are insufficient.
 const physical=await observePhysicalVehicle(db,request.vehicleId);
 if(!physical)return {proven:false,reason:'VEHICLE_NOT_FOUND'};
 if(!sourceTypes.includes(physical.source_type)||physical.ended_at!==null||!positiveId(Number(physical.listing_cycle_id)))
    return {proven:false,reason:'STALE_OR_UNAVAILABLE_CYCLE'};
 return {proven:false,reason:'MISSING_SIGNED_CURRENT_VEHICLE_TEAM_MERCHANT_BINDING'};
}
