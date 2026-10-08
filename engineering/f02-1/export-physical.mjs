// Evidence-only export from the disposable PG16 CI database, after --verify PASS.
import pg from 'pg';
import {mkdir,writeFile} from 'node:fs/promises';
import {verifyF021Target} from './guard.mjs';
import {requireSamePublicStructure} from './schema-integrity.mjs';
const client=new pg.Client({connectionString:verifyF021Target().connectionString,connectionTimeoutMillis:2500});
try{
 await client.connect();await client.query('BEGIN READ ONLY');
 const meta=(await client.query("SELECT checksum,structure_sha256 FROM public.f02_schema_migrations WHERE migration_id='000001_current_initial'")).rows[0];
 if(!meta)throw Error('F02_1_MISSING_MIGRATION_METADATA');
 const physical=await requireSamePublicStructure(client,meta.structure_sha256);
 await client.query('COMMIT');
 const dir=new URL('./artifacts/',import.meta.url);
 await mkdir(dir,{recursive:true});
 await writeFile(new URL('./artifacts/pg16_object_inventory.json',import.meta.url),JSON.stringify({
  migration:'000001_current_initial',migrationChecksum:meta.checksum,
  structureSha256:physical.sha256,objectCount:physical.objectCount,objects:physical.objects
 },null,2)+'\n');
 console.log('F02-1 PHYSICAL DEFINITION INVENTORY EXPORTED: objects='+physical.objectCount+' sha256='+physical.sha256);
}catch(e){try{await client.query('ROLLBACK')}catch{}console.error('F02-1 STRUCTURE EXPORT FAIL:',e.message);process.exitCode=1}
finally{try{await client.end()}catch{}}
