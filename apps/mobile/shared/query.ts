import {ALL_SAFE_VEHICLES, DENIED_FIXTURES} from './mock'
import {DEFAULT_QUERY, type SafeVehicle,type QueryState,type Filters,type SortKey,type Feed,type Scenario} from './domain'
function numberOrNull(s:string):number|null { const n=Number(s); return s.trim()!==''&&Number.isFinite(n)?n:null }
export function parsedKeyword(keyword:string):{brand?:string;series?:string;modelYear?:number;plain?:string} {
 const raw=keyword.trim().replace(/\s+/g,' ')
 if(!raw) return {}
 const year=raw.match(/(?:20)?(\d{2})款/)
 const modelYear=year ? 2000+Number(year[1]):undefined
 const brand=['奥迪','宝马','奔驰','丰田','大众','特斯拉','比亚迪','雷克萨斯'].find(b=>raw.includes(b))
 const series=['Model 3','A6','5系','C级','凯美瑞','帕萨特','汉','ES'].find(s=>raw.includes(s))
 if(brand||series||modelYear) {
  // 只消耗已解析的明确词元，余下未知词元必须继续严格过滤，不能无声丢弃。
  let rest=raw
  if(year)rest=rest.replace(year[0],' ')
  if(brand)rest=rest.replace(brand,' ')
  if(series)rest=rest.replace(series,' ')
  rest=rest.trim().toLowerCase()
  return {...(brand?{brand}:{}),...(series?{series}:{}),...(modelYear?{modelYear}:{}),...(rest?{plain:rest}:{})}
 }
 return {plain:raw.toLowerCase()}
}
export function matches(v:SafeVehicle,q:QueryState):boolean {
 if(!v.visible||!v.publicAvailable) return false
 if(q.city!=='全国'&&v.city!==q.city) return false
 const p=parsedKeyword(q.keyword),f=q.filters
 if(p.brand&&v.brand!==p.brand) return false
 if(p.series&&v.series!==p.series) return false
 if(p.modelYear&&v.modelYear!==p.modelYear) return false
 if(p.plain&&!v.name.toLowerCase().includes(p.plain)) return false
 if(f.brand&&v.brand!==f.brand) return false
 if(f.series&&v.series!==f.series) return false
 if(f.modelYear&&String(v.modelYear)!==f.modelYear) return false
 if(f.modelName&&v.modelName!==f.modelName) return false
 if(f.displacement&&v.displacement!==f.displacement) return false
 if(f.color&&v.color!==f.color) return false
 if(f.energy&&v.energy!==f.energy) return false
 if(f.transmission&&v.transmission!==f.transmission) return false
 const minPrice=numberOrNull(f.priceMin),maxPrice=numberOrNull(f.priceMax)
 // 明确价格区间：没有合法数字价格的车不纳入结果
 if((minPrice!==null||maxPrice!==null)&&v.customerPriceWan===null)return false
 if(minPrice!==null&&(v.customerPriceWan as number)<minPrice)return false
 if(maxPrice!==null&&(v.customerPriceWan as number)>maxPrice)return false
 const minYear=numberOrNull(f.yearMin),maxYear=numberOrNull(f.yearMax)
 if(minYear!==null&&v.registrationYear<minYear)return false
 if(maxYear!==null&&v.registrationYear>maxYear)return false
 const minKm=numberOrNull(f.mileageMin)
 if(minKm!==null&&v.mileageKm<minKm*10000)return false
 const maxKm=numberOrNull(f.mileageMax)
 if(maxKm!==null&&v.mileageKm>maxKm*10000)return false
 return true
}
export function orderRows(rows:SafeVehicle[],sort:SortKey) {
 return [...rows].sort((a,b)=>{
  const newest=b.listedAt.localeCompare(a.listedAt)
  if(sort==='newest')return newest
  if(sort.startsWith('price')) {
   if(a.customerPriceWan===null)return b.customerPriceWan===null?newest:1
   if(b.customerPriceWan===null)return -1
   return (sort==='price_asc'?1:-1)*(a.customerPriceWan-b.customerPriceWan)||newest
  }
  if(sort==='year_desc')return b.registrationYear-a.registrationYear||newest
  if(sort==='year_asc')return a.registrationYear-b.registrationYear||newest
  if(sort==='mileage_asc')return a.mileageKm-b.mileageKm||newest
  return b.mileageKm-a.mileageKm||newest
 })
}
/** 模拟提供端先完成内部价格排序，再投递角色安全字段；不能在UI端利用隐藏原价。 */
function project(v:SafeVehicle,tier:'limited'|'fan'|'vip'):SafeVehicle {
 if(tier==='limited'&&v.source==='wholesale'&&v.customerPriceWan!==null)
  return {...v,customerPriceWan:null,priceProjection:'masked'}
 return {...v,priceProjection:v.customerPriceWan===null?'consultation':'numeric'}
}
export function queryFeed(q:QueryState=DEFAULT_QUERY,page=1,scenario:Scenario='normal',tier:'limited'|'fan'|'vip'='limited'):Feed {
 if(scenario==='loading'||scenario==='error')return {items:[],opportunityMingbang:[],opportunity4s:[],total:0,hasMore:false,banner:false}
 const candidate=ALL_SAFE_VEHICLES.concat(DENIED_FIXTURES)
 const wantsPrice=!!(q.filters.priceMin||q.filters.priceMax)
 // 客户不可见的数值价格不能通过价格区间结果反推；正式价格读取需 G2 授权。
 const eligible=candidate.filter(v=>matches(v,q)&&!(tier==='limited'&&wantsPrice&&v.source==='wholesale'))
 const channel=orderRows(eligible.filter(v=>v.source===q.source),q.sort)
 const other=(src:SafeVehicle['source'])=> q.source==='wholesale'?orderRows(eligible.filter(v=>v.source===src),q.sort).slice(0,1):[]
 const empty=scenario==='empty'
 const rows=empty?[]:channel
 const limit=Math.max(1,Math.floor(page))*15
 return {items:rows.slice(0,limit).map(v=>project(scenario==='no_image'?{...v,photoUrl:null}:v,tier)),
   opportunityMingbang:empty?[]:other('mingbang').map(v=>project(scenario==='no_image'?{...v,photoUrl:null}:v,tier)),opportunity4s:empty?[]:other('dealer4s').map(v=>project(scenario==='no_image'?{...v,photoUrl:null}:v,tier)),
   total:rows.length,hasMore:rows.length>limit,banner:scenario!=='no_banner'&&scenario!=='empty'}
}
export function safeById(id:string,scenario:Scenario='normal',tier:'limited'|'fan'|'vip'='limited'):SafeVehicle|null {
 if(scenario==='revoked'||scenario==='error')return null
 const v=ALL_SAFE_VEHICLES.find(v=>v.id===id)
 return v&&v.visible&&v.publicAvailable?project(v,tier):null
}
export function validateFilters(f:Filters):boolean {
 const nums=[f.priceMin,f.priceMax,f.yearMin,f.yearMax,f.mileageMin,f.mileageMax].filter(Boolean)
 if(nums.some(s=>!Number.isFinite(Number(s))||Number(s)<0))return false
 return !(f.priceMin&&f.priceMax&&Number(f.priceMin)>Number(f.priceMax)) &&
 !(f.yearMin&&f.yearMax&&Number(f.yearMin)>Number(f.yearMax)) &&
 !(f.mileageMin&&f.mileageMax&&Number(f.mileageMin)>Number(f.mileageMax))
}
