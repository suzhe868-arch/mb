import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify} from './migration.mjs';
if(process.argv.length!==3||process.argv[2]!=='--record')throw Error('F05_2_EVIDENCE_ARG_DENIED');
const c=await connect();
try{
 const report=await verify(c), catalog=await getPublicStructure(c);
 if(report.newSha!==catalog.sha256)throw Error('F05_2_EVIDENCE_PHYSICAL_MISMATCH');
 const dir=resolve('f05/vehicle-stewardship-physical-scope/artifacts');
 await mkdir(dir,{recursive:true});
 const original=JSON.parse(await readFile('f03/runtime-handover-reconciliation/evidence/pg16_full_catalog.json','utf8'));
 if(original.structure_sha256!==report.oldSha)throw Error('F05_2_EVIDENCE_OLD_CATALOG_MISMATCH');
 const records={
  'full-catalog.json':JSON.stringify(catalog,null,2)+'\n',
  'inventory.json':JSON.stringify({originalM94:report.oldSha,newStructure:report.newSha,
   tables:94+2,objects:report.objects,sqlSha:report.sqlSha,added:report.added,
   run:process.env.GITHUB_RUN_ID,commit:process.env.GITHUB_SHA},null,2)+'\n',
  'delta.json':JSON.stringify({oldObjectCount:original.objects.length,newObjectCount:catalog.objects.length,
   added:report.added,unchangedOriginalObjects:original.objects.length},null,2)+'\n',
  'source-provenance.json':JSON.stringify({base:'M94_000013_TRANSACTION',baseSha:report.oldSha,
   isolatedG14IsDifferentBranch:true,sourceSql:'000015_vehicle_responsibility.sql',sqlSha:report.sqlSha,
   permit:'DISPOSABLE_NONPRIVILEGED_PG16_ONLY',productBaseline:'NOT_READY'},null,2)+'\n'
 };
 for(const [name,value] of Object.entries(records))await writeFile(resolve(dir,name),value);
 await copyFile('f03/runtime-handover-reconciliation/evidence/SOURCE.md',resolve(dir,'original-frozen-source.md'));
 const sum=Object.entries(records).map(([name,v])=>createHash('sha256').update(v).digest('hex')+'  '+name).join('\n')+'\n';
 await writeFile(resolve(dir,'source-sha256sums.txt'),sum);
 console.log('F05_2_NATIVE_PG16_PROVENANCE '+JSON.stringify({run:process.env.GITHUB_RUN_ID,sha:process.env.GITHUB_SHA,old:report.oldSha,new:report.newSha,added:report.added.length}));
}finally{await c.end()}
