// PR63：只读解析本批ESM声明与GitHub真实文件，不触碰数据库/运行旧业务Service。
// node --check 只检查语法、不会解析被导入模块是否真的导出了所用函数。
// 此门禁只检查本目录的静态“named import”依赖；原生PG16执行与签名断言仍必须独立通过。
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./',import.meta.url));
const files=(await readdir(root)).filter(f=>f.endsWith('.mjs')&&f!=='静态ESM导入契约验证.mjs');
let checked=0;
for(const local of files){
 const file=join(root,local),source=await readFile(file,'utf8');
 // 本目录所有named imports均是单行声明；若将来更换格式，仍由原生测试最终验签。
 for(const match of source.matchAll(/^\s*import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?/gm)){
  const [,names,request]=match;
  if(!request.startsWith('.'))continue;
  const target=resolve(dirname(file),request);
  assert.ok(target.endsWith('.mjs'),'PG1_IMPORT_NON_ESM_'+local);
  const targetContent=await readFile(target,'utf8');
  for(const item of names.split(',').map(s=>s.trim()).filter(Boolean)){
   const exported=item.split(/\s+as\s+/)[0].trim();
   assert.match(exported,/^[A-Za-z_$][A-Za-z0-9_$]*$/,'PG1_INVALID_ESM_SYMBOL_'+exported);
   const declaration=new RegExp('\\bexport\\s+(?:(?:default|async|declare)\\s+)?(?:function|class|const|let|var)\\s+'+exported+'\\b');
   const declarationBlock=/\bexport\s*\{([^}]+)\}/g;
   const inNamedExport=[...targetContent.matchAll(declarationBlock)].some(m=>m[1].split(',').some(s=>s.trim().split(/\s+as\s+/).pop().trim()===exported));
   assert.ok(declaration.test(targetContent)||inNamedExport,
    'PG1_MISSING_REAL_NAMED_EXPORT_'+local+'_'+request+'_'+exported);
   checked++;
  }
 }
}
assert.ok(checked>=30,'PG1_IMPORT_GATE_INSUFFICIENT_COVERAGE_'+checked);
console.log('PG1_STATIC_REAL_MODULE_EXPORT_CONTRACT_PASS',JSON.stringify({files:files.length,namedExportsChecked:checked}));
