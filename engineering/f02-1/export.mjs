import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {compileCurrentInitial} from './compile-current.mjs';
const x=await compileCurrentInitial();
const pinned=JSON.parse(await readFile(new URL('./migrations/000001_current_initial.manifest.json',import.meta.url),'utf8'));
if(pinned.version!=='000001_current_initial'||x.checksum!==pinned.sha256||JSON.stringify(x.stats)!==JSON.stringify(pinned.stats))throw Error('F02_1_PINNED_INITIAL_SQL_CHECKSUM_MISMATCH');
await mkdir(new URL('./artifacts/',import.meta.url),{recursive:true});
await writeFile(new URL('./artifacts/current_initial.sql',import.meta.url),x.sql);
await writeFile(new URL('./artifacts/schema_expected.json',import.meta.url),JSON.stringify({sha256:x.checksum,stats:x.stats,g0Accepted:true,f021Accepted:false},null,2)+'\n');
console.log('F02-1 GENERATED CURRENT SQL: '+JSON.stringify(x.stats)+' SHA256='+x.checksum);
