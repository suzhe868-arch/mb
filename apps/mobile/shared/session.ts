import type {Tier} from './domain'
/** 仅当前JavaScript会话里的Mock展示身份，绝不能作为真实服务端权限。 */
let scenarioTier:Tier='limited'
export function getMockTier():Tier{return scenarioTier}
export function setMockTier(tier:Tier):void{scenarioTier=tier}
export function resetMockTier():void{scenarioTier='limited'}
