import {writeFile,mkdir} from 'node:fs/promises';
import {compileCurrentInitial} from './compile-current.mjs';
const x=await compileCurrentInitial();
await mkdir(new URL('./artifacts/',import.meta.url),{recursive:true});
await writeFile(new URL('./artifacts/current_initial.sql',import.meta.url),x.sql);
await writeFile(new URL('./artifacts/schema_expected.json',import.meta.url),JSON.stringify({sha256:x.checksum,stats:x.stats,g0Accepted:true,f021Accepted:false},null,2)+'\n');
console.log('F02-1 GENERATED CURRENT SQL: '+JSON.stringify(x.stats)+' SHA256='+x.checksum);
