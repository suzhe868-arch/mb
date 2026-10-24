import {copyFileSync,existsSync,mkdirSync,readdirSync,rmSync} from 'node:fs'
import {resolve} from 'node:path'

/** 原始共享业务规则仍保留在 apps/mobile/shared，生成副本仅用于 Taro SourceRoot 编译。 */
const source=resolve(process.cwd(),'../shared')
const target=resolve(process.cwd(),'src/shared')
if(!existsSync(resolve(source,'adapter.ts')))throw new Error('共享只读适配器源码缺失，禁止以旧缓存继续编译')
rmSync(target,{recursive:true,force:true})
mkdirSync(target,{recursive:true})
const files=readdirSync(source).filter(name=>name.endsWith('.ts')&&!name.endsWith('.test.ts')).sort()
if(!files.includes('adapter.ts')||!files.includes('query.ts')||!files.includes('domain.ts'))throw new Error('必要共享源文件不存在')
for(const filename of files)copyFileSync(resolve(source,filename),resolve(target,filename))
console.log('C-APP-01: Taro共享源同步 '+files.join(', '))
