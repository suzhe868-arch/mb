import {useMemo,useState} from 'react'
import {View,Text,Image,Button} from '@tarojs/components'
import Taro,{useShareAppMessage} from '@tarojs/taro'
import {priceText,kmText,type Tier,type Scenario} from '../../../../shared/domain'
import {mockReadAdapter} from '../../../../shared/adapter'
import {getMockTier} from '../../../../shared/session'
import './index.css'

export default function Detail(){
 const params=Taro.getCurrentInstance().router?.params||{}
 const id=String(params.id||'')
 const tier:Tier=getMockTier()
 const scenario:Scenario=params.scenario==='revoked'?'revoked':'normal'
 const car=useMemo(()=>mockReadAdapter.detail(id,scenario),[id,scenario])
 const [broken,setBroken]=useState(false)
 // 分享链接只含车辆ID。真实打开时后端还须按当前Customer/cycle/visibility重新鉴权。
 useShareAppMessage(()=>({
  title:car?car.name+' · 查看车辆详情':'查看更多车源',
  path:car?'/pages/detail/index?id='+encodeURIComponent(car.id):'/pages/index/index',
  imageUrl:car?.photoUrl||''
 }))
 function back(){Taro.navigateBack({delta:1}).catch(()=>Taro.redirectTo({url:'/pages/index/index'}))}
 function viewPhoto(){if(car?.photoUrl&&!broken)Taro.previewImage({urls:[car.photoUrl],current:car.photoUrl}).catch(()=>Taro.showToast({title:'图片暂不可预览',icon:'none'}))}
 return <View className='detail'>
  <View className='detail-safe'/>
  <View className='detail-header'><Text onClick={back}>‹ 返回车源</Text><Text>车辆详情 · Mock 只读</Text></View>
  {!car?<View className='denied'><Text className='denied-title'>当前车源不可查看</Text><Text>车辆可能已下架，或当前查看权限已经失效。分享链接不授予额外权限。</Text><Button onClick={()=>Taro.redirectTo({url:'/pages/index/index'})}>查看更多车源</Button></View>:
  <>
   <View className='detail-image' onClick={viewPhoto}>{car.photoUrl&&!broken?<Image src={car.photoUrl} mode='aspectFill' className='detail-photo' onError={()=>setBroken(true)}/>:<View className='fallback'>暂无车辆图片</View>}<Text className='image-count'>1 / 1 · 点击查看大图</Text></View>
   <View className='section-box'><Text className='detail-name'>{car.name}</Text><View className='price-line'><Text>{priceText(car,tier)}</Text><Text>{car.city}</Text></View>
   {tier==='limited'&&car.source==='wholesale'&&car.customerPriceWan!==null?<Text className='price-note'>普通客户真实详情自动解锁及额度判断尚未接入。此处不创建查价记录，也不透露精确报价。</Text>:null}</View>
   <View className='section-box'><Text className='section-title'>车辆信息</Text><View className='info-grid'>
    {([['上牌年份',car.registrationYear+'年'],['表显里程',kmText(car.mileageKm)],['变速箱',car.transmission],['能源',car.energy],['车身颜色',car.color],['车辆位置',car.city]] as [string,string][]).map(([label,value])=><View key={label}><Text className='key'>{label}</Text><Text>{value}</Text></View>)}
   </View></View>
   <View className='section-box tip'>仅隔离模拟数据和示意照片；收藏、咨询、锁车、候补、交易功能均未接真实后端，不展示虚假完成状态。</View>
   <View className='detail-bottom'><Text onClick={back}>返回列表</Text><Button className='share-demo' openType='share' onClick={()=>{if(process.env.TARO_ENV==='h5')Taro.showToast({title:'仅微信小程序支持正式分享入口',icon:'none'})}}>分享车源</Button><Text className='disabled'>咨询 / 锁车未开放</Text></View>
  </>}
 </View>
}
