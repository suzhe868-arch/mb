import {readFileSync,existsSync} from 'node:fs'
import {resolve} from 'node:path'
import assert from 'node:assert/strict'
const cwd=process.cwd()
const file=p=>readFileSync(resolve(cwd,p),'utf8')
for(const p of ['src/app.tsx','src/app.config.ts','src/pages/index/index.tsx','src/pages/detail/index.tsx','../shared/query.ts','../shared/domain.ts']){
 assert.ok(existsSync(resolve(cwd,p)),'missing '+p)
}
const index=file('src/pages/index/index.tsx'),detail=file('src/pages/detail/index.tsx')
assert.ok(index.includes('mockReadAdapter.list'), '首页必须调用同一查询adapter')
assert.ok(index.includes('filters'), '必须可筛选')
assert.ok(index.includes('sort'), '必须可排序')
assert.ok(index.includes('navigateTo'), '必须有详情导航')
assert.ok(index.includes('stopPullDownRefresh'),'刷新实现缺失')
assert.ok(detail.includes('mockReadAdapter.detail'),'详情必须重新调用客户安全只读适配器')
const adapter=file('../shared/adapter.ts')
assert.ok(adapter.includes('safeById(id,scenario,getMockTier())'),'只读适配器必须在每次详情读取时重新检查访问权限')
assert.ok(!detail.includes('params.tier'),'不允许从详情分享URL直接赋予粉丝或VIP展示身份')
assert.ok(!detail.includes('支付成功'),'不得伪造真实交易结果')
for(const src of [index,detail]){
 for(const pattern of [/\bVIN\b/,/upstream_publisher_id/,/wholesale_price/,/customer_phone/,/金鱼塘/]){
  assert.equal(pattern.test(src),false,'客户页面疑似泄漏敏感字段 '+pattern)
 }
}
console.log('C-APP-01 静态授权路径检查：PASS')
