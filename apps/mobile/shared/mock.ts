import type {SafeVehicle,Source} from './domain'
/** 虚构样例。未取得可信实车素材且未逐车型校验时，不可冒充对应实车图片。 */
const photos: Record<string,string|null> = Object.create(null)
const templates = [
  { brand:'奥迪',series:'A6',modelYear:2026,model:'45 TFSI 豪华动感型',price:23.8 },
  { brand:'宝马',series:'5系',modelYear:2025,model:'525Li M运动套装',price:28.6 },
  { brand:'奔驰',series:'C级',modelYear:2024,model:'C 260 L 运动版',price:20.5 },
  { brand:'特斯拉',series:'Model 3',modelYear:2025,model:'后轮驱动版',price:17.9 },
  { brand:'丰田',series:'凯美瑞',modelYear:2024,model:'2.0G 尊贵版',price:12.4 },
  { brand:'大众',series:'帕萨特',modelYear:2025,model:'380TSI 星空旗舰版',price:14.9 },
  { brand:'比亚迪',series:'汉',modelYear:2025,model:'DM-i 尊荣型',price:13.8 },
  { brand:'雷克萨斯',series:'ES',modelYear:2023,model:'200 豪华版',price:18.2 }
]
const sourceOrder:Source[]=['wholesale','wholesale','mingbang','dealer4s']
export const ALL_SAFE_VEHICLES:SafeVehicle[] = Array.from({length:64},(_,i)=>{
 const v=templates[i%templates.length]
 const source=sourceOrder[i%4]
 const delta=i%9
 return {
  id:'MOCK-'+String(i+1).padStart(3,'0'),source,brand:v.brand,series:v.series,modelYear:v.modelYear,
  name:v.modelYear+'款 '+v.brand+v.series+' '+v.model+(i===43?' | 超长文案演示 · 原厂车况描述仅做排版测试，不代表真实在售车辆':''),
  registrationYear:Math.max(2020,v.modelYear-delta%3),mileageKm:9800+i*1730,
  city:['上海','杭州','苏州','北京','广州','成都'][i%6],
  modelName:v.model,transmission:v.brand==='特斯拉'?'单速变速箱':'自动',
  energy:v.brand==='特斯拉'?'纯电':v.brand==='比亚迪'?'插电混动':'汽油',
  displacement:v.brand==='特斯拉'?'':v.brand==='比亚迪'?'1.5T':'2.0T',
  color:['曜石黑','珍珠白','银灰'][i%3],innerColor:'深色',
  listedAt:'2026-10-'+String(16-i%14).padStart(2,'0')+'T10:00:00+08:00',
  customerPriceWan:i%11===9?null:Math.max(3.5,v.price+delta*.34),
  photoUrl:photos[v.brand]??null,galleryUrls:[],conditionTags:[],publicReports:[],advisorName:null,visible:true,publicAvailable:true
 }
})
/** 无权访问、已下架、受控车辆：即使在本地 fixture 中存在也不得暴露。 */
export const DENIED_FIXTURES:SafeVehicle[]=[
 {...ALL_SAFE_VEHICLES[0],id:'MOCK-HIDDEN',visible:false},
 {...ALL_SAFE_VEHICLES[1],id:'MOCK-OFFLINE',publicAvailable:false},
 {...ALL_SAFE_VEHICLES[2],id:'MOCK-REVOKED',visible:false,publicAvailable:false}
]

/** 示例「今日新增」按首次公开日期统计，与重复上架日期不同；固定演示业务日2026-10-16。 */
const FIRST_PUBLIC_DATE:Record<string,string>=Object.fromEntries(
 ALL_SAFE_VEHICLES.map((v,i)=>[v.id,i%8===0?v.listedAt.slice(0,10):'2026-09-01'])
)
export function mockPublicStats(today='2026-10-16'){
 const publicRows=ALL_SAFE_VEHICLES.filter(v=>v.visible&&v.publicAvailable)
 return {publicTotal:publicRows.length,todayNew:publicRows.filter(v=>FIRST_PUBLIC_DATE[v.id]===today).length}
}

/** 隔离演示四级车型目录。年款只是车型分组属性，正式车型字典仍须G2签署。 */
export const MOCK_MODEL_OPTIONS=templates.map(v=>({brand:v.brand,series:v.series,modelYear:String(v.modelYear),modelName:v.model}))
