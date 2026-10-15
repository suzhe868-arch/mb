import test from 'node:test'
import assert from 'node:assert/strict'
import {ALL_SAFE_VEHICLES,DENIED_FIXTURES} from './mock'
import {DEFAULT_QUERY,EMPTY_FILTERS,priceText,SORTS,type QueryState,type SafeVehicle} from './domain'
import {queryFeed,matches,orderRows,parsedKeyword,safeById,validateFilters} from './query'
import {mockReadAdapter,unsignedApiAdapter,UNSIGNED_WRITE_OPERATIONS} from './adapter'
import {getMockTier,setMockTier,resetMockTier} from './session'
const q=(x:Partial<QueryState>={}):QueryState=>({...DEFAULT_QUERY,filters:{...EMPTY_FILTERS},...x})
test('C01默认批发车源、全国、最新上架且首页第一页15台',()=>{
 const feed=queryFeed();assert.equal(DEFAULT_QUERY.source,'wholesale');assert.equal(DEFAULT_QUERY.city,'全国')
 assert.equal(DEFAULT_QUERY.sort,'newest');assert.equal(feed.items.length,15)
 assert.ok(feed.items.every(v=>v.source==='wholesale'))
 assert.ok(feed.total>=15);assert.equal(feed.hasMore,true)
})
test('C01分页每页15且顺序无重复',()=>{
 const one=queryFeed(q(),1),two=queryFeed(q(),2)
 assert.equal(two.items.length,Math.min(two.total,30))
 assert.deepEqual(two.items.slice(0,15),one.items)
 assert.equal(new Set(two.items.map(x=>x.id)).size,two.items.length)
})
test('C01三频道保持同一筛选条件',()=>{
 for(const s of ['wholesale','mingbang','dealer4s'] as const){
  const feed=queryFeed(q({source:s,city:'上海'}))
  assert.ok(feed.items.every(v=>v.source===s&&v.city==='上海'))
 }
})
test('C01城市全国与手动地域，不包含自动700km扩张',()=>{
 const all=queryFeed(),city=queryFeed(q({city:'上海'}))
 assert.ok(all.total>city.total)
 assert.ok(city.items.every(v=>v.city==='上海'))
 assert.equal(q({city:'全国'}).city,'全国')
})
test('C01名邦与4S机会块为严格匹配条件的可见车辆',()=>{
 const feed=queryFeed(q({keyword:'奥迪'}))
 assert.ok(feed.opportunityMingbang.every(v=>v.source==='mingbang'&&v.brand==='奥迪'))
 assert.ok(feed.opportunity4s.every(v=>v.source==='dealer4s'&&v.brand==='奥迪'))
 assert.equal(queryFeed(q({source:'dealer4s'})).opportunityMingbang.length,0)
 assert.equal(queryFeed(q({keyword:'从未存在的车型'})).opportunityMingbang.length,0)
})
test('C01解析26款 奥迪A6为车型事实，不混淆上牌年',()=>{
 assert.deepEqual(parsedKeyword('26款 奥迪A6'),{brand:'奥迪',series:'A6',modelYear:2026})
 const f=queryFeed(q({keyword:'26款 奥迪A6'}))
 assert.ok(f.items.every(v=>v.brand==='奥迪'&&v.series==='A6'&&v.modelYear===2026))
})
test('C01价区间必须剔除价格咨询',()=>{
 const out=queryFeed(q({filters:{...EMPTY_FILTERS,priceMin:'10',priceMax:'20'}}))
 assert.ok(out.items.every(v=>v.customerPriceWan!==null&&(v.customerPriceWan>=10&&v.customerPriceWan<=20)))
})
test('C01年份是首次上牌、里程独立筛选',()=>{
 const filters={...EMPTY_FILTERS,yearMin:'2024',mileageMax:'5'}
 const feed=queryFeed(q({filters}))
 assert.ok(feed.items.every(v=>v.registrationYear>=2024&&v.mileageKm<=50000))
})
test('C01筛选校验拒绝无效数字和逆区间',()=>{
 assert.equal(validateFilters({...EMPTY_FILTERS,priceMin:'20',priceMax:'10'}),false)
 assert.equal(validateFilters({...EMPTY_FILTERS,yearMin:'2026',yearMax:'2020'}),false)
 assert.equal(validateFilters({...EMPTY_FILTERS,mileageMax:'-2'}),false)
 assert.equal(validateFilters({...EMPTY_FILTERS,priceMin:'12.5'}),true)
})
test('C01排序固定七项且数字价优先于咨询价',()=>{
 assert.equal(SORTS.length,7)
 const base=[...ALL_SAFE_VEHICLES.slice(0,10),{...ALL_SAFE_VEHICLES[0],id:'ask',customerPriceWan:null}]
 for(const key of ['price_asc','price_desc'] as const){
  const a=orderRows(base,key);assert.equal(a[a.length-1].id,'ask')
 }
 assert.ok(orderRows(base,'mileage_asc').slice(1).every((v,i)=>v.mileageKm>=orderRows(base,'mileage_asc')[i].mileageKm))
})
test('C01普通批发价受限、粉丝VIP显价、无数字价咨询',()=>{
 const car=ALL_SAFE_VEHICLES.find(x=>x.source==='wholesale'&&x.customerPriceWan!==null)!
 assert.equal(priceText(car,'limited'),'--万')
 assert.match(priceText(car,'fan'),/万$/)
 assert.match(priceText(car,'vip'),/万$/)
 assert.notEqual(priceText(car,'fan'),'--万')
 const unknown:SafeVehicle={...car,customerPriceWan:null}
 for(const tier of ['limited','fan','vip'] as const)assert.equal(priceText(unknown,tier),'价格咨询')
})
test('C01隐藏、下架、撤权对象永远不在Feed、Opportunity和Detail',()=>{
 const feed=queryFeed()
 for(const v of DENIED_FIXTURES){
  assert.equal(matches(v,q()),false);assert.equal(safeById(v.id),null)
  assert.equal(feed.items.some(x=>x.id===v.id),false)
  assert.equal(feed.opportunityMingbang.some(x=>x.id===v.id),false)
  assert.equal(feed.opportunity4s.some(x=>x.id===v.id),false)
 }
 assert.equal(safeById(ALL_SAFE_VEHICLES[0].id,'revoked'),null)
 assert.equal(safeById('MISS-001'),null)
})
test('C01客户安全投影字段白名单，敏感属性缺席',()=>{
 for(const v of [...ALL_SAFE_VEHICLES,...queryFeed().items]){
  const keys=Object.keys(v).map(k=>k.toLowerCase())
  for(const forbidden of ['vin','wholesaleprice','upstream','phone','priority','publisher','deposit','customerid','idcard','greenbook','internalprice']){
   assert.equal(keys.some(k=>k.includes(forbidden)),false,forbidden)
  }
 }
})
test('C01加载、错误、空状态均不泄漏旧结果',()=>{
 assert.equal(queryFeed(q(),1,'empty').items.length,0)
 assert.equal(queryFeed(q(),1,'no_banner').banner,false)
 assert.ok(queryFeed(q(),1,'no_image').items.every(v=>v.photoUrl===null))
})
test('C01关键词零结果不偷偷放宽为全国或全部车型',()=>{
 assert.equal(queryFeed(q({keyword:'某个无法匹配的稀有代号'})).total,0)
 assert.equal(queryFeed(q({city:'杭州',keyword:'某个无法匹配的稀有代号'})).total,0)
})
test('C01重复快速查看安全详情不创建业务数据',()=>{
 const original=JSON.stringify(ALL_SAFE_VEHICLES)
 for(let i=0;i<100;i++)safeById(ALL_SAFE_VEHICLES[0].id)
 assert.equal(JSON.stringify(ALL_SAFE_VEHICLES),original)
})

test('C01真实业务API未经授权均拒绝，不存在伪成功写入',()=>{
 assert.throws(()=>unsignedApiAdapter.list(q(),1,'normal'),/API_SOURCE_GAP/)
 assert.throws(()=>unsignedApiAdapter.detail(ALL_SAFE_VEHICLES[0].id,'normal'),/API_SOURCE_GAP/)
 assert.equal(UNSIGNED_WRITE_OPERATIONS.length,7)
 assert.deepEqual(mockReadAdapter.list(q(),1,'normal'),queryFeed())
})
test('C01演示身份只由隔离会话维护，不由分享路由参数授予',()=>{
 resetMockTier();assert.equal(getMockTier(),'limited')
 setMockTier('fan');assert.equal(getMockTier(),'fan')
 resetMockTier();assert.equal(getMockTier(),'limited')
})
test('C01车型筛选和上牌条件为独立 AND，取消品牌不改变年份',()=>{
 const f={...EMPTY_FILTERS,brand:'奥迪',yearMin:'2024'}
 const a=queryFeed(q({filters:f}))
 assert.ok(a.items.every(v=>v.brand==='奥迪'&&v.registrationYear>=2024))
 const b=queryFeed(q({filters:{...f,brand:''}}))
 assert.ok(b.total>=a.total)
})
test('C01紧急权限拒绝时不能通过历史详情恢复旧图片',()=>{
 const id=ALL_SAFE_VEHICLES[0].id
 assert.ok(mockReadAdapter.detail(id,'normal'))
 assert.equal(mockReadAdapter.detail(id,'revoked'),null)
 assert.equal(mockReadAdapter.detail(id,'error'),null)
})
