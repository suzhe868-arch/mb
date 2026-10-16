import type {Feed,QueryState,SafeVehicle,Scenario} from './domain'
import {queryFeed,safeById} from './query'
import {getMockTier} from './session'
import {mockPublicStats} from './mock'
/** 客户只读消费者合同（UI从不直接接受后端原始Vehicle行）。 */
export interface CustomerVehicleReadAdapter {
 list(q:QueryState,page:number,scenario:Scenario):Feed
 detail(id:string,scenario:Scenario):SafeVehicle|null
 publicStats():{publicTotal:number;todayNew:number}
}
export const mockReadAdapter:CustomerVehicleReadAdapter=Object.freeze({
 list:(q:QueryState,page:number,scenario:Scenario):Feed=>queryFeed(q,page,scenario,getMockTier()),
 detail:(id:string,scenario:Scenario):SafeVehicle|null=>safeById(id,scenario,getMockTier()),
 publicStats:()=>mockPublicStats()
})
/** 生产联调尚未经 A 签字，明确 fail-closed，杜绝自动降级到未签名 API。 */
export const unsignedApiAdapter:CustomerVehicleReadAdapter=Object.freeze({
 list:()=>{throw new Error('API_SOURCE_GAP: 正式读取端点未授权')},
 detail:()=>{throw new Error('API_SOURCE_GAP: 正式详情权限未授权')},
 publicStats:()=>{throw new Error('API_SOURCE_GAP: 正式统计接口未授权')}
})
export const UNSIGNED_WRITE_OPERATIONS=Object.freeze(['favorite','consultation','lockRequest','waitlist','transaction','deposit','shareAttribution'])
