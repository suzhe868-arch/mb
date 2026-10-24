/** 唯一可供客户端 UI 消费的安全投影；不存在内部价、VIN、电话、凭证、客户或 Priority 属性。 */
export type Source = 'wholesale' | 'mingbang' | 'dealer4s'
export type Tier = 'limited' | 'fan' | 'vip'
export type SortKey = 'newest'|'price_asc'|'price_desc'|'year_desc'|'year_asc'|'mileage_asc'|'mileage_desc'
export type LockViewState = 'available'|'pending'|'other_locked'|'waitlisted'|'mine_locked'|'transaction'|'sold'|'offline'
export type Scenario = 'normal'|'loading'|'empty'|'error'|'no_banner'|'no_image'|'revoked'
export interface SafeVehicle {
  id: string; source: Source; brand: string; series: string; modelYear: number
  name: string; registrationYear: number; mileageKm: number; city: string
  transmission: string; energy: string; color: string; innerColor?: string; displacement?: string
  modelName?: string; conditionTags?: string[]; publicReports?: {title:string;source:string}[]; advisorName?: string|null; galleryUrls?: string[]
  listedAt: string; customerPriceWan: number | null; priceProjection?: 'masked'|'numeric'|'consultation'
  photoUrl: string | null; visible: boolean; publicAvailable: boolean
}
export interface Filters {
  brand: string; series: string; modelYear: string; modelName: string; priceMin: string; priceMax: string; yearMin: string; yearMax: string
  mileageMin: string; mileageMax: string; energy: string; displacement: string; color: string; transmission: string
}
export interface QueryState {
  source: Source; city: string; keyword: string; sort: SortKey; filters: Filters
}
export const EMPTY_FILTERS: Filters = {
  brand:'',series:'',modelYear:'',modelName:'',priceMin:'',priceMax:'',yearMin:'',yearMax:'',mileageMin:'',mileageMax:'',energy:'',displacement:'',color:'',transmission:''
}
export const DEFAULT_QUERY: QueryState = { source:'wholesale',city:'全国',keyword:'',sort:'newest',filters:{...EMPTY_FILTERS} }
export const SOURCES: {key:Source;label:string}[] = [
  {key:'wholesale',label:'批发车源'},{key:'mingbang',label:'名邦车源'},{key:'dealer4s',label:'4S店车源'}
]
export const SORTS: {key:SortKey; label:string}[] = [
  {key:'newest',label:'最新上架'},{key:'price_asc',label:'价格低→高'},
  {key:'price_desc',label:'价格高→低'},{key:'year_desc',label:'年份新→旧'},
  {key:'year_asc',label:'年份旧→新'},{key:'mileage_asc',label:'里程少→多'},
  {key:'mileage_desc',label:'里程多→少'}
]
export type Feed = { items: SafeVehicle[]; opportunityMingbang: SafeVehicle[]; opportunity4s: SafeVehicle[]; total:number; hasMore:boolean; banner:boolean }
export type Result<T> = {ok:true;value:T}|{ok:false;code:'NETWORK_ERROR'|'NO_PERMISSION'|'NOT_FOUND'}
export function priceText(v:SafeVehicle,tier:Tier):string {
  if(v.priceProjection === 'masked' || (tier === 'limited' && v.source === 'wholesale' && v.customerPriceWan !== null))return '--万'
  if(v.customerPriceWan === null)return '价格咨询'
  return Number(v.customerPriceWan.toFixed(2)).toString() + '万'
}
export function dateText(v:SafeVehicle) { return v.listedAt.slice(0,10) }
export function kmText(km:number) {return Number((km/10000).toFixed(2)).toString()+'万公里'}
