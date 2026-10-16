import {useMemo,useState,useRef,useEffect} from 'react'
import {View,Text,Input,Image,Button,Picker,ScrollView} from '@tarojs/components'
import Taro,{usePullDownRefresh,useReachBottom,useDidShow,usePageScroll} from '@tarojs/taro'
import {DEFAULT_QUERY,EMPTY_FILTERS,SOURCES,SORTS,priceText,dateText,kmText,type QueryState,type Filters,type SafeVehicle,type Tier,type Scenario,type SortKey} from '../../../../shared/domain'
import {validateFilters} from '../../../../shared/query'
import {mockReadAdapter} from '../../../../shared/adapter'
import {setMockTier} from '../../../../shared/session'
import './index.css'

const CITIES=['全国','上海','杭州','苏州','北京','广州','成都']
const TESTS:Scenario[]=['normal','loading','empty','error','no_banner','no_image','revoked']
const TIERS:Tier[]=['limited','fan','vip']
const BRAND=['','奥迪','宝马','奔驰','丰田','大众','特斯拉','比亚迪','雷克萨斯']
let remembered:{q:QueryState;page:number;tier:Tier;scenario:Scenario}|null=null
let rememberedScroll=0

function Picture({car}:{car:SafeVehicle}){
 const [failed,setFailed]=useState(false)
 useEffect(()=>setFailed(false),[car.photoUrl])
 return <View className='car-picture'>{car.photoUrl&&!failed?<Image src={car.photoUrl} onError={()=>setFailed(true)} mode='aspectFill' lazyLoad className='car-image'/>:<View className='no-image'>暂无车辆图片</View>}</View>
}
function Car({car,tier,open}:{car:SafeVehicle;tier:Tier;open:(id:string)=>void}){
 return <View className='car' onClick={()=>open(car.id)}>
  <Picture car={car}/>
  <View className='car-content'><Text className='car-name'>{car.name}</Text><Text className='car-spec'>{car.registrationYear}年上牌 · {kmText(car.mileageKm)}</Text>
   <View className='car-price-row'><Text>{car.city}</Text><Text className='price'>{priceText(car,tier)}</Text></View>
   <View className='car-meta'><Text>{dateText(car)}</Text><Text className='favorite-demo' onClick={e=>{e.stopPropagation();Taro.showToast({title:'收藏尚未接入，未保存任何数据',icon:'none'})}}>♡ 收藏待接入</Text><Text>详情 ›</Text></View>
  </View>
 </View>
}
function Sheet({type,current,filters,close,applyFilters,applySort}:{type:'filter'|'sort';current:SortKey;filters:Filters;close:()=>void;applyFilters:(f:Filters)=>void;applySort:(s:SortKey)=>void}){
 const [draft,setDraft]=useState({...filters}),[invalid,setInvalid]=useState(false)
 const set=(k:keyof Filters,v:string)=>setDraft(p=>({...p,[k]:v}))
 return <View className='shade' onClick={close}><View className='sheet' onClick={e=>e.stopPropagation()}>
   <View className='sheet-head'><Text className='sheet-heading'>{type==='filter'?'筛选车辆':'排序方式'}</Text><Text className='sheet-close' onClick={close}>关闭 ✕</Text></View>
   {type==='sort'?SORTS.map(s=><View key={s.key} className={'sort-choice '+(current===s.key?'chosen':'')} onClick={()=>applySort(s.key)}><Text>{s.label}</Text><Text>{current===s.key?'✓':''}</Text></View>):
   <><ScrollView scrollY className='sheet-scroll'>
    <Text className='sheet-label'>品牌</Text><View className='chips'>{BRAND.map(b=><Text key={b} className={'chip '+(draft.brand===b?'picked':'')} onClick={()=>set('brand',b)}>{b||'全部'}</Text>)}</View>
    <Text className='sheet-label'>价格（万）</Text>
    <View className='input-row'><Input type='digit' placeholder='最低价格' value={draft.priceMin} onInput={e=>set('priceMin',e.detail.value)}/><Input type='digit' placeholder='最高价格' value={draft.priceMax} onInput={e=>set('priceMax',e.detail.value)}/></View>
    <Text className='sheet-label'>首次上牌年份</Text>
    <View className='input-row'><Input type='number' placeholder='最早年份' value={draft.yearMin} onInput={e=>set('yearMin',e.detail.value)}/><Input type='number' placeholder='最晚年份' value={draft.yearMax} onInput={e=>set('yearMax',e.detail.value)}/></View>
    <Text className='sheet-label'>表显里程</Text><View className='input-row'><Input type='digit' placeholder='最多万公里' value={draft.mileageMax} onInput={e=>set('mileageMax',e.detail.value)}/></View>
    <Text className='sheet-label'>能源类型</Text><View className='chips'>{['','汽油','纯电'].map(x=><Text key={x} className={'chip '+(draft.energy===x?'picked':'')} onClick={()=>set('energy',x)}>{x||'不限'}</Text>)}</View>
    <Text className='sheet-label'>变速箱</Text><View className='chips'>{['','自动','单速变速箱'].map(x=><Text key={x} className={'chip '+(draft.transmission===x?'picked':'')} onClick={()=>set('transmission',x)}>{x||'不限'}</Text>)}</View>
    {invalid?<Text className='invalid'>数字或区间不合法</Text>:null}
   </ScrollView><View className='sheet-buttons'><Button onClick={()=>{setDraft({...EMPTY_FILTERS});setInvalid(false)}}>重置</Button><Button className='apply' onClick={()=>validateFilters(draft)?applyFilters(draft):setInvalid(true)}>应用筛选</Button></View></>}
 </View></View>
}
export default function Home(){
 const [q,setQ]=useState<QueryState>(()=>remembered?.q||{...DEFAULT_QUERY,filters:{...EMPTY_FILTERS}})
 const [page,setPage]=useState(remembered?.page||1),[tier,setTier]=useState<Tier>(remembered?.tier||'limited')
 const [scenario,setScenario]=useState<Scenario>(remembered?.scenario||'normal')
 const [sheet,setSheet]=useState<'filter'|'sort'|null>(null)
 const [cities,setCities]=useState(false),[notice,setNotice]=useState('')
 const openingRef=useRef(false)
 const pagingRef=useRef(false)

 const feed=useMemo(()=>mockReadAdapter.list(q,page,scenario),[q,page,scenario,tier])
 useEffect(()=>{remembered={q,page,tier,scenario};pagingRef.current=false},[q,page,tier,scenario])
 function change(patch:Partial<QueryState>){setQ(old=>({...old,...patch}));setPage(1);rememberedScroll=0;Taro.pageScrollTo({scrollTop:0,duration:0}).catch(()=>{})}
 function open(id:string){
  if(openingRef.current)return
  openingRef.current=true
  remembered={q,page,tier,scenario}
  Taro.navigateTo({url:'/pages/detail/index?id='+encodeURIComponent(id)+'&scenario='+scenario}).catch(()=>{openingRef.current=false})
 }
 usePullDownRefresh(()=>{setPage(1);Taro.stopPullDownRefresh();setNotice('已按当前条件刷新模拟车源')})
 function loadMore(){if(pagingRef.current||!feed.hasMore||scenario==='loading'||scenario==='error')return;pagingRef.current=true;setPage(p=>p+1)}
 useReachBottom(loadMore)
 usePageScroll(e=>{rememberedScroll=e.scrollTop})
 useDidShow(()=>{openingRef.current=false;if(rememberedScroll>0)Taro.pageScrollTo({scrollTop:rememberedScroll,duration:0}).catch(()=>{})})
 const {publicTotal:count,todayNew:today}=mockReadAdapter.publicStats()
 return <View className='home'>
  <View className='safe-top'/><View className='accent'/>
  <View className='search-row'><Text className='city' onClick={()=>setCities(!cities)}>{q.city}⌄</Text><View className='search-box'><Text>⌕</Text><Input confirmType='search' value={q.keyword} placeholder='搜品牌、车型、年款' onInput={e=>change({keyword:e.detail.value})}/></View></View>
  {cities?<View className='city-popup'><Text>手动选地区，不自动扩大范围</Text><View className='chips'>{CITIES.map(c=><Text className={'chip '+(q.city===c?'picked':'')} key={c} onClick={()=>{change({city:c});setCities(false)}}>{c}</Text>)}</View><Text className='sim-denied' onClick={()=>{change({city:'全国'});setCities(false);setNotice('模拟定位拒绝，保持全国')}}>模拟拒绝定位（保持全国）</Text></View>:null}
  <View className='channels'>{SOURCES.map(s=><View key={s.key} className={'channel '+(q.source===s.key?'active':'')} onClick={()=>change({source:s.key})}>{s.label}</View>)}</View>
  <View className='demo'><Text>Mock 虚构车源 · 非真实在售</Text><Picker mode='selector' range={TESTS.map(t=>({normal:'正常',loading:'加载中',empty:'空',error:'错误',no_banner:'无Banner',no_image:'无图片',revoked:'权限撤销'}[t]))} onChange={e=>{setScenario(TESTS[Number(e.detail.value)]);setPage(1)}}><Text>场景：{scenario} ⌄</Text></Picker></View>
  {feed.banner&&scenario!=='loading'&&scenario!=='error'?<View className='hero'><Text className='hero-tag'>精选好车 · 清晰透明</Text><Text className='hero-head'>找到适合你的下一辆车</Text><Text className='hero-sub'>跨渠道筛选 · 车况以实车为准</Text><Text className='hero-mark'>MB</Text></View>:null}
  <View className='stats'><View className='stat-column'><Text className='stat-number'>{count}</Text><Text>在售车源</Text></View><View className='stat-divide'/><View className='stat-column'><Text className='stat-number'>{today}</Text><Text>今日新增</Text></View><View className='grow'/><Picker mode='selector' range={['普通客户','粉丝','VIP']} onChange={e=>{const next=TIERS[Number(e.detail.value)];setTier(next);setMockTier(next)}}><Text className='tier'>演示身份：{tier==='limited'?'普通':tier}⌄</Text></Picker></View>
  <View className='tools'><View><Text className='strong'>{SOURCES.find(s=>s.key===q.source)?.label}</Text><Text className='total'> {feed.total} 台</Text></View><View className='tool-right'><Text className='filter-trigger' onClick={()=>setSheet('filter')}>筛选 {Object.values(q.filters).some(Boolean)?'●':''} ⌄</Text><Text className='sort-trigger' onClick={()=>setSheet('sort')}>{SORTS.find(s=>s.key===q.sort)?.label} ⌄</Text></View></View>
  {Object.values(q.filters).some(Boolean)?<View className='chips used'>{Object.entries(q.filters).filter(([,v])=>v).map(([key,val])=><Text className='chip picked' key={key} onClick={()=>change({filters:{...q.filters,[key]:''}})}>{val} ×</Text>)}<Text className='chip' onClick={()=>change({filters:{...EMPTY_FILTERS}})}>清空</Text></View>:null}
  {notice?<View className='notice' onClick={()=>setNotice('')}>{notice} · 点此收起</View>:null}
  {scenario==='loading'?<View className='status'>模拟加载中…<Button onClick={()=>setScenario('normal')}>完成加载</Button></View>:scenario==='error'?<View className='status'><Text>加载失败 · 模拟网络异常</Text><Button onClick={()=>setScenario('normal')}>重试</Button></View>:
  <>
   {q.source==='wholesale'&&feed.opportunityMingbang.length>0?<View><View className='section'><Text className='section-name'>名邦精选</Text><Text className='section-sub'>匹配当前筛选</Text></View>{feed.opportunityMingbang.map(c=><Car key={c.id} car={c} tier={tier} open={open}/>)}</View>:null}
   {q.source==='wholesale'&&feed.opportunity4s.length>0?<View><View className='section'><Text className='section-name'>4S 店精选</Text><Text className='section-sub'>匹配当前筛选</Text></View>{feed.opportunity4s.map(c=><Car key={c.id} car={c} tier={tier} open={open}/>)}</View>:null}
   {feed.items.length>0?<View>{feed.items.map(c=><Car key={c.id} car={c} tier={tier} open={open}/>)}
    {feed.hasMore?<Button className='more' onClick={loadMore}>继续加载（每次15台）</Button>:<Text className='all-done'>已展示全部符合条件的车源</Text>}</View>:
   <View className='status'><Text>暂无符合条件的车辆，系统不会自动扩大范围</Text><Button onClick={()=>setSheet('filter')}>调整筛选</Button></View>}
  </>}
  <View className='nav'><Text className='here'>⌂ 车源</Text><Text onClick={()=>setNotice('找车页面尚未获批，本次不制作空壳')}>找车 · 待开发</Text><Text onClick={()=>setNotice('我的页面尚未获批，本次不制作空壳')}>我的 · 待开发</Text></View>
  {sheet?<Sheet key={sheet} type={sheet} filters={q.filters} current={q.sort} close={()=>setSheet(null)} applySort={s=>{change({sort:s});setSheet(null)}} applyFilters={f=>{change({filters:f});setSheet(null)}}/>:null}
 </View>
}
