import {useMemo,useState,useEffect} from 'react'
import {View,Text,Image,Button} from '@tarojs/components'
import Taro,{useShareAppMessage} from '@tarojs/taro'
import {priceText,kmText,dateText,type Tier,type Scenario,type LockViewState} from '../../shared/domain'
import {mockReadAdapter} from '../../shared/adapter'
import {getMockTier} from '../../shared/session'
import './index.css'

const STATE_LABELS:Record<LockViewState,string>={
 available:'锁车',pending:'锁车申请中',other_locked:'申请候补',waitlisted:'我的候补',
 mine_locked:'我的锁车',transaction:'查看交易',sold:'已售出',offline:'已下架'
}
function blocked(action:string){Taro.showToast({title:action+'服务暂不可用，未提交任何申请',icon:'none',duration:2400})}
export default function Detail(){
 const params=Taro.getCurrentInstance().router?.params||{}
 const id=String(params.id||'')
 const tier:Tier=getMockTier()
 const scenario:Scenario=params.scenario==='revoked'?'revoked':'normal'
 const qa=String(params.qa||'')==='1'
 const share=String(params.share||'')==='1'
 const state=(qa&&['available','pending','other_locked','waitlisted','mine_locked','transaction','sold','offline'].includes(String(params.state||''))?String(params.state):'available') as LockViewState
 // 真实页面状态必须从授权服务端状态投影取值；URL状态仅隔离qa测试使用，不能触发操作或价格权。
 const car=useMemo(()=>mockReadAdapter.detail(id,scenario),[id,scenario])
 const [broken,setBroken]=useState(false)
 const [photoIndex,setPhotoIndex]=useState(0)
 useEffect(()=>{setBroken(false);setPhotoIndex(0)},[id])
 const photoUrls=car?[car.photoUrl,...(car.galleryUrls||[])].filter((x):x is string=>Boolean(x)): []
 const photo=photoUrls[photoIndex]||null
 useShareAppMessage(()=>({
  title:car?car.name+' · 查看车辆详情':'查看更多车源',
  path:car?'/pages/detail/index?id='+encodeURIComponent(car.id)+'&share=1':'/pages/index/index',
  imageUrl:photo||''
 }))
 function back(){Taro.navigateBack({delta:1}).catch(()=>Taro.redirectTo({url:'/pages/index/index'}))}
 function toHome(){Taro.redirectTo({url:'/pages/index/index'})}
 function preview(){
  if(photo&&!broken)Taro.previewImage({urls:photoUrls,current:photo}).catch(()=>Taro.showToast({title:'图片暂不可预览',icon:'none'}))
  else Taro.showToast({title:'暂无可预览的车辆图片',icon:'none'})
 }
 function changePhoto(delta:number){setBroken(false);setPhotoIndex(x=>(x+delta+photoUrls.length)%photoUrls.length)}
 return <View className='detail'>
  <View className='detail-safe'/>
  <View className='detail-header'><Text className={'back '+(share?'back-home':'')} onClick={share?toHome:back}>{share?'主页':'‹'}</Text><Text className='detail-head-title'>车辆详情</Text><View className='detail-header-space'/></View>
  {!car?<View className='denied'><Text className='denied-title'>当前车源不可查看</Text><Text>车辆可能已下架，或查看权限已发生变化。旧链接与转发链接不会授予额外查看权限。</Text><Button onClick={toHome}>查看更多车源</Button></View>:
  <>
   <View className='detail-image' onClick={preview}>
    {photo&&!broken?<Image src={photo} mode='aspectFill' className='detail-photo' onError={()=>setBroken(true)}/>:
    <View className='detail-placeholder'><View className='detail-car-art'><View className='art-roof'/><View className='art-body'/><View className='art-wheel art-left'/><View className='art-wheel art-right'/></View><Text className='art-model'>{car.brand} {car.series}</Text><Text className='art-note'>暂无实车图片</Text></View>}
    {photoUrls.length>1?<View className='gallery-controls'><Text onClick={e=>{e.stopPropagation();changePhoto(-1)}}>‹ 上一张</Text><Text onClick={e=>{e.stopPropagation();changePhoto(1)}}>下一张 ›</Text></View>:null}
    <Text className='image-count'>{photoUrls.length?photoIndex+1:0} / {photoUrls.length}</Text>
   </View>
   <View className='detail-main section-box'>
    <Text className='detail-name'>{car.name}</Text>
    <View className='detail-location'><Text>{car.city}</Text><Text className='thin-divider'>|</Text><Text>{car.source==='mingbang'?'名邦车源':car.source==='dealer4s'?'4S店车源':'批发车源'}</Text></View>
    <View className='price-line'><Text className='detail-price'>{priceText(car,tier)}</Text><Text className='detail-price-label'>客户参考标价 · 非一口价</Text></View>
    {tier==='limited'&&car.priceProjection==='masked'?<Text className='price-note'>升级为粉丝或VIP可享更多价格查看权益，也可联系顾问了解详情。</Text>:null}
    <View className='summary-row'><Text>{car.registrationYear}年上牌</Text><Text>{kmText(car.mileageKm)}</Text><Text>{car.energy}</Text></View>
   </View>
   <View className='section-box'>
    <Text className='section-title'>车辆基本信息</Text>
    <View className='info-grid'>
     {([['首次上牌',car.registrationYear+'年'],['表显里程',kmText(car.mileageKm)],['变速箱',car.transmission],['能源类型',car.energy],['排量',car.displacement||''],['车身颜色',car.color],['内饰颜色',car.innerColor||''],['车辆所在地',car.city]] as [string,string][]).filter(([,v])=>!!v).map(([label,value])=><View className='info-item' key={label}><Text className='key'>{label}</Text><Text className='val'>{value}</Text></View>)}
    </View>
   </View>
   {car.conditionTags&&car.conditionTags.length>0?<View className='section-box'><Text className='section-title'>车辆车况</Text><View className='condition-tags'>{car.conditionTags.map(x=><Text key={x} className='condition-tag'>{x}</Text>)}</View></View>:null}
   {car.publicReports&&car.publicReports.length>0?<View className='section-box'><Text className='section-title'>车况资料与检测报告</Text>{car.publicReports.map(x=><View className='report-row' key={x.title}><Text>{x.title}</Text><Text className='report-source'>{x.source}</Text></View>)}</View>:null}
   <View className='section-box advisor-box'><Text className='section-title'>服务顾问</Text><View className='advisor-row'><View className='advisor-avatar'>顾问</View><View className='advisor-text'><Text className='advisor-name'>{car.advisorName||'暂无服务顾问'}</Text><Text className='advisor-desc'>{car.advisorName?'可咨询车辆与成交事宜':'可使用下方咨询入口了解服务'}</Text></View></View></View>
   <View className='section-box date-box'><Text>上架日期</Text><Text>{dateText(car)}</Text></View>
   <View className='secondary-share'><Text>发现合适的车源？</Text><Button className='share-inline' openType='share' onClick={()=>{if(Taro.getEnv()===Taro.ENV_TYPE.WEB)Taro.showToast({title:'请在微信小程序内使用分享功能',icon:'none'})}}>分享车源 ›</Button></View>
   <Text className='bottom-guidance'>实际车辆信息与成交条件以线下核实结果为准</Text>
   <View className={'detail-bottom '+(share?'share-mode':'')}>
    {share?<Button className='bottom-more' onClick={toHome}>更多车源</Button>:null}
    <View className='bottom-favorite' onClick={()=>blocked('收藏')}><Text className='favorite-icon'>♡</Text><Text>收藏</Text></View>
    <Button className='bottom-consult' onClick={()=>blocked('咨询')}>咨询</Button>
    <Button disabled={state==='sold'||state==='offline'} className={'bottom-lock '+(state==='available'||state==='other_locked'?'primary':'passive')} onClick={()=>blocked(state==='other_locked'?'候补':state==='available'?'锁车':'状态查看')}>{STATE_LABELS[state]}</Button>
   </View>
  </>}
 </View>
}
