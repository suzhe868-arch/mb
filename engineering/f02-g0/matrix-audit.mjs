import {readFile} from 'node:fs/promises';
const data=await readFile(new URL('./field-matrix.tsv',import.meta.url),'utf8');
const rows=data.trim().split(/\r?\n/).map(s=>s.split('\t'));
const columns=rows[0].length;
const body=rows.slice(1);
if(columns!==11||body.some(x=>x.length!==columns)||body.length<240)throw Error('F02_G0_MATRIX_INCOMPLETE');
const ids=new Set(),tuple=new Set(),tables=new Set(),sources=new Set();
for(const r of body){
  if(ids.has(r[0])||tuple.has(r[1]+':'+r[2]))throw Error('F02_G0_DUPLICATE_FIELD');
  ids.add(r[0]);tuple.add(r[1]+':'+r[2]);tables.add(r[1]);
  if(!r[8].startsWith('PDM-')||r[9]!=='CANDIDATE_UNFROZEN'||r[10]!=='NOT_RUN')throw Error('F02_G0_FALSE_IMPLEMENTATION_CLAIM');
  for(const m of r[8].matchAll(/PDM-(\d+)/g))sources.add(Number(m[1]));
}
if(tables.size<50)throw Error('F02_G0_DOMAIN_COVERAGE_TOO_SMALL');
for(const source of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,23,24,25]){
  if(!sources.has(source))throw Error('F02_G0_MISSING_PDM_'+source);
}
for(const entity of ['manual_vehicle_drafts','lock_requests','locks','waitlists','refund_cases','vehicle_models','jyt_model_source_mappings','audit_events','public_pool_events'])if(!tables.has(entity))throw Error('F02_G0_MISSING_ENTITY_'+entity);
console.log('F02-G0 field coverage static PASS: '+body.length+' candidate fields; '+tables.size+' logical entity candidates; '+sources.size+' PDM references; 0 duplicates; 0 fields marked implemented');
