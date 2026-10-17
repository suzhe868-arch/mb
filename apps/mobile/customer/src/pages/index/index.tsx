import {useMemo,useState,useRef,useEffect} from 'react'
import {View,Text,Input,Image,Button,Picker,ScrollView} from '@tarojs/components'
import Taro,{usePullDownRefresh,useReachBottom,useDidShow,usePageScroll} from '@tarojs/taro'
import {DEFAULT_QUERY,EMPTY_FILTERS,SOURCES,SORTS,priceText,dateText,kmText,type QueryState,type Filters,type SafeVehicle,type Tier,type Scenario,type SortKey} from '../../shared/domain'
import {MOCK_MODEL_OPTIONS} from '../../shared/mock'
import {validateFilters} from '../../shared/query'
import {mockReadAdapter} from '../../shared/adapter'
import {setMockTier} from '../../shared/session'
import './index.css'

const CITIES=['全国','上海','杭州','苏州','北京','广州','成都']
const TESTS:Scenario[]=['normal','loading','empty','error','no_banner','no_image','revoked']
const TIERS:Tier[]=['limited','fan','vip']
const FILTER_NAMES:Record<keyof Filters,string>={brand:'品牌',series:'车系',modelYear:'年款',modelName:'款型',priceMin:'最低价',priceMax:'最高价',yearMin:'上牌起始',yearMax:'上牌截止',mileageMin:'里程最低',mileageMax:'里程最高',energy:'能源',displacement:'排量',color:'颜色',transmission:'变速箱'}
let remembered:{q:QueryState;page:number;tier:Tier;scenario:Scenario}|null=null
let rememberedScroll=0
function notice(text:string){Taro.showToast({title:text,icon:'none',duration:2200})}
function Picture({car}:{car:SafeVehicle}){
 const [failed,setFailed]=useState(false)
 useEffect(()=>setFailed(false),[car.photoUrl])
 return <View className='car-picture'>
  {car.photoUrl&&!failed?<Image src={car.photoUrl} mode='aspectFill' lazyLoad className='car-image' onError={()=>setFailed(true)}/>:
  <View className='vehicle-placeholder'>
   <View className='vehicle-drawing'><View className='vehicle-roof'/><View className='vehicle-body'/><View className='vehicle-wheel one'/><View className='vehicle-wheel two'/></View>
   <Text className='placeholder-model'>{car.brand} {car.series}</Text><Text className='placeholder-note'>暂无实车图片</Text>
  </View>}
 </View>
}
function Car({car,tier,open}:{car:SafeVehicle;tier:Tier;open:(id:string)=>void}){
 return <View className='car' onClick={()=>open(car.id)}>
  <Picture car={car}/>
  <View className='car-content'>
   <Text className='car-name'>{car.name}</Text>
   <Text className='car-spec'>{car.registrationYear}年上牌 · {kmText(car.mileageKm)}</Text>
   <Text className='car-spec'>{car.energy} · {car.transmission}</Text>
   <View className='car-price-row'><Text className='card-city'>{car.city}</Text><Text className='price'>{priceText(car,tier)}</Text></View>
   <View className='car-meta'><Text>{dateText(car)}</Text><Text className='favorite-action' onClick={e=>{e.stopPropagation();notice('收藏服务暂不可用，未保存')}}>♡ 收藏</Text></View>
  </View>
 </View>
}
function Sheet({type,current,filters,close,applyFilters,applySort}:{type:'filter'|'sort';current:SortKey;filters:Filters;close:()=>void;applyFilters:(f:Filters)=>void;applySort:(s:SortKey)=>void}){
 const [draft,setDraft]=useState<Filters>({...filters})
 const [invalid,setInvalid]=useState(false)
 const set=(k:keyof Filters,v:string)=>{
  setInvalid(false)
  setDraft(p=>{
   const next={...p,[k]:v}
   if(k==='brand'){next.series='';next.modelYear='';next.modelName=''}
   if(k==='series'){next.modelYear='';next.modelName=''}
   if(k==='modelYear')next.modelName=''
   return next
  })
 }
 const unique=(list:string[])=>Array.from(new Set(list))
 const brands=unique(MOCK_MODEL_OPTIONS.map(x=>x.brand))
 const series=unique(MOCK_MODEL_OPTIONS.filter(x=>x.brand===draft.brand).map(x=>x.series))
 const years=unique(MOCK_MODEL_OPTIONS.filter(x=>x.brand===draft.brand&&x.series===draft.series).map(x=>x.modelYear))
 const models=unique(MOCK_MODEL_OPTIONS.filter(x=>x.brand===draft.brand&&x.series===draft.series&&x.modelYear===draft.modelYear).map(x=>x.modelName))
 const choices=(k:keyof Filters,values:string[],empty='不限')=><View className='chips'>{['',...values].map(v=><Text key={v||'empty'} className={'chip '+(draft[k]===v?'picked':'')} onClick={()=>set(k,v)}>{v||empty}</Text>)}</View>
 const numeric=(k:keyof Filters,ph:string)=><Input type='digit' value={draft[k]} placeholder={ph} onInput={e=>set(k,e.detail.value)}/>
 return <View className='shade' onClick={close}><View className='sheet' onClick={e=>e.stopPropagation()}>
  <View className='sheet-head'><Text className='sheet-heading'>{type==='filter'?'筛选车辆':'排序方式'}</Text><Text className='sheet-close' onClick={close}>关闭 ✕</Text></View>
  {type==='sort'?<ScrollView scrollY className='sheet-scroll'>{SORTS.map(s=><View key={s.key} className={'sort-choice '+(current===s.key?'chosen':'')} onClick={()=>applySort(s.key)}><Text>{s.label}</Text><Text>{current===s.key?'✓':''}</Text></View>)}</ScrollView>:
  <>
   <ScrollView scrollY className='sheet-scroll'>
    <Text className='sheet-label'>品牌</Text>{choices('brand',brands,'全部品牌')}
    <Text className='sheet-label'>车系</Text>{draft.brand?choices('series',series,'全部车系'):<Text className='sheet-hint'>请先选择品牌</Text>}
    <Text className='sheet-label'>年款（不是首次上牌年份）</Text>{draft.series?choices('modelYear',years,'全部年款'):<Text className='sheet-hint'>请先选择车系</Text>}
    <Text className='sheet-label'>具体款型</Text>{draft.modelYear?choices('modelName',models,'全部款型'):<Text className='sheet-hint'>请先选择年款</Text>}
    <Text className='sheet-label'>价格区间（万元）</Text><View className='input-row'>{numeric('priceMin','最低价')}{numeric('priceMax','最高价')}</View>
    <Text className='sheet-label'>首次上牌年份</Text><View className='input-row'>{numeric('yearMin','最早年份')}{numeric('yearMax','最晚年份')}</View>
    <Text className='sheet-label'>表显里程（万公里）</Text><View className='input-row'>{numeric('mileageMin','最低里程')}{numeric('mileageMax','最高里程')}</View>
    <Text className='sheet-label'>能源类型</Text>{choices('energy',['汽油','纯电','插电混动'])}
    <Text className='sheet-label'>排量</Text>{choices('displacement',['1.5T','2.0T'])}
    <Text className='sheet-label'>车身颜色</Text>{choices('color',['曜石黑','珍珠白','银灰'])}
    <Text className='sheet-label'>变速箱</Text>{choices('transmission',['自动','单速变速箱'])}
    {invalid?<Text className='invalid'>数字或区间不合法，请检查后重试</Text>:null}
   </ScrollView>
   <View className='sheet-buttons'><Button onClick={()=>{setDraft({...EMPTY_FILTERS});setInvalid(false)}}>重置</Button><Button className='apply' onClick={()=>validateFilters(draft)?applyFilters(draft):setInvalid(true)}>查看符合条件的车辆</Button></View>
  </>}
 </View></View>
}
export default function Home(){
 const routeParams=Taro.getCurrentInstance().router?.params||{}
 const qa=String(routeParams.qa||'')==='1'
 const [q,setQ]=useState<QueryState>(()=>remembered?.q||{...DEFAULT_QUERY,filters:{...EMPTY_FILTERS}})
 const [page,setPage]=useState(remembered?.page||1)
 const [tier,setTier]=useState<Tier>(remembered?.tier||'limited')
 const [scenario,setScenario]=useState<Scenario>(()=>qa&&TESTS.includes(String(routeParams.scenario) as Scenario)?String(routeParams.scenario) as Scenario:remembered?.scenario||'normal')
 const [sheet,setSheet]=useState<'filter'|'sort'|null>(null)
 const [cities,setCities]=useState(false)
 const openingRef=useRef(false),pagingRef=useRef(false)
 const feed=useMemo(()=>mockReadAdapter.list(q,page,scenario),[q,page,scenario,tier])
 useEffect(()=>{remembered={q,page,tier,scenario};pagingRef.current=false},[q,page,tier,scenario])
 function change(patch:Partial<QueryState>){setQ(old=>({...old,...patch}));setPage(1);rememberedScroll=0;Taro.pageScrollTo({scrollTop:0,duration:0}).catch(()=>{})}
 function open(id:string){
  if(openingRef.current)return
  openingRef.current=true
  remembered={q,page,tier,scenario}
  Taro.navigateTo({url:'/pages/detail/index?id='+encodeURIComponent(id)+(qa?'&qa=1':'')+(scenario==='revoked'?'&scenario=revoked':'')}).catch(()=>{openingRef.current=false})
 }
 usePullDownRefresh(()=>{setPage(1);Taro.stopPullDownRefresh();notice('已按当前条件刷新')})
 function loadMore(){if(pagingRef.current||!feed.hasMore||scenario==='loading'||scenario==='error')return;pagingRef.current=true;setPage(p=>p+1)}
 useReachBottom(loadMore)
 usePageScroll(e=>{rememberedScroll=e.scrollTop})
 useDidShow(()=>{openingRef.current=false;if(rememberedScroll>0)Taro.pageScrollTo({scrollTop:rememberedScroll,duration:0}).catch(()=>{})})
 const {publicTotal:count,todayNew:today}=mockReadAdapter.publicStats()
 const selected=Object.entries(q.filters).filter(([,v])=>v) as [keyof Filters,string][]
 function remove(k:keyof Filters){
  const next={...q.filters,[k]:''}
  if(k==='brand'){next.series='';next.modelYear='';next.modelName=''}
  if(k==='series'){next.modelYear='';next.modelName=''}
  if(k==='modelYear')next.modelName=''
  change({filters:next})
 }
 return <View className='home'>
  <View className='safe-top'/>
  <View className='search-row'><Text className='city' onClick={()=>setCities(p=>!p)}>{q.city}⌄</Text><View className='search-box'><Text className='search-icon'>⌕</Text><Input confirmType='search' value={q.keyword} placeholder='搜索品牌 / 车系 / 年款 / 车型' onInput={e=>change({keyword:e.detail.value})}/></View></View>
  {cities?<View className='city-popup'><Text className='sheet-hint'>选择车源地区</Text><View className='chips'>{CITIES.map(c=><Text className={'chip '+(q.city===c?'picked':'')} key={c} onClick={()=>{change({city:c});setCities(false)}}>{c}</Text>)}</View></View>:null}
  <View className='channels'>{SOURCES.map(s=><View key={s.key} className={'channel '+(q.source===s.key?'active':'')} onClick={()=>change({source:s.key})}>{s.label}</View>)}</View>
  <View className='stats'><Text>全国公开在售 {count} 台</Text><Text className='stat-dot'>·</Text><Text>今日新增 {today} 台</Text></View>
  <View className='tools'><View><Text className='strong'>在售车源</Text><Text className='total'> {feed.total} 台</Text></View><View className='tool-right'><Text className='filter-trigger' onClick={()=>setSheet('filter')}>筛选 {selected.length?'('+selected.length+')':''} ⌄</Text><Text className='sort-trigger' onClick={()=>setSheet('sort')}>{SORTS.find(s=>s.key===q.sort)?.label} ⌄</Text></View></View>
  {selected.length>0?<View className='chips used'>{selected.map(([key,val])=><Text className='chip picked' key={key} onClick={()=>remove(key)}>{FILTER_NAMES[key]} {val} ×</Text>)}<Text className='chip' onClick={()=>change({filters:{...EMPTY_FILTERS}})}>清空条件</Text></View>:null}
  {scenario==='loading'?<View className='status'><Text>车源加载中…</Text>{qa?<Button onClick={()=>setScenario('normal')}>结束加载</Button>:null}</View>:scenario==='error'?<View className='status'><Text>车源暂时无法加载</Text><Button onClick={()=>setScenario('normal')}>重试</Button></View>:
  <>
   {q.source==='wholesale'&&feed.opportunityMingbang.length>0?<View className='car-group'><View className='section'><Text className='section-name'>名邦车源</Text><Text className='section-sub'>符合当前条件</Text></View>{feed.opportunityMingbang.map(c=><Car key={c.id} car={c} tier={tier} open={open}/>)}</View>:null}
   {q.source==='wholesale'&&feed.opportunity4s.length>0?<View className='car-group'><View className='section'><Text className='section-name'>4S店车源</Text><Text className='section-sub'>符合当前条件</Text></View>{feed.opportunity4s.map(c=><Car key={c.id} car={c} tier={tier} open={open}/>)}</View>:null}
   {feed.items.length>0?<View className='car-group'>{feed.items.map(c=><Car key={c.id} car={c} tier={tier} open={open}/>)}
    {feed.hasMore?<Button className='more' onClick={loadMore}>查看更多车源</Button>:<Text className='all-done'>已展示全部符合条件的车辆</Text>}</View>:
   <View className='status'><Text>暂无符合条件的车辆</Text><Text className='sheet-hint'>可调整条件后重新筛选，系统不会自动扩大范围</Text><Button onClick={()=>setSheet('filter')}>调整筛选</Button></View>}
  </>}
  <Text className='preview-disclaimer'>页面车辆资料仅用于界面预览，不代表真实在售车源</Text>
  <View className='nav'><View className='nav-item here'><Text className='nav-icon'>⌂</Text><Text>车源</Text></View><View className='nav-item' onClick={()=>notice('找车服务暂未开放')}><Text className='nav-icon'>⌕</Text><Text>找车</Text></View><View className='nav-item' onClick={()=>notice('个人中心暂未开放')}><Text className='nav-icon'>◯</Text><Text>我的</Text></View></View>
  {qa?<View className='qa-panel'><Text>隔离测试入口</Text><Picker mode='selector' range={TESTS} onChange={e=>{setScenario(TESTS[Number(e.detail.value)]);setPage(1)}}><Text>场景：{scenario}⌄</Text></Picker><Picker mode='selector' range={['普通客户','粉丝','VIP']} onChange={e=>{const next=TIERS[Number(e.detail.value)];setTier(next);setMockTier(next)}}><Text>角色：{tier}⌄</Text></Picker></View>:null}
  {sheet?<Sheet key={sheet} type={sheet} filters={q.filters} current={q.sort} close={()=>setSheet(null)} applySort={s=>{change({sort:s});setSheet(null)}} applyFilters={f=>{change({filters:f});setSheet(null)}}/>:null}
 </View>
}
