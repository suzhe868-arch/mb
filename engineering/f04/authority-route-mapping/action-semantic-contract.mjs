// F04-2 A独立审查整改：严格批准的只读现行动作证据白名单，不为任何旧URL授权。
export const ACTION_PROOFS=Object.freeze({
  "LEGACY-115": {
    "navLine": 165,
    "pdmFile": "07_重建工作区/PDM-17_最终完整规则.md",
    "pdmLine": 172,
    "pageLine": 125,
    "pageId": "P06-05",
    "navAction": "放入公海",
    "subject": "AUTHORIZED_EMPLOYEE",
    "intent": "PUBLIC_POOL_PUT"
  },
  "LEGACY-117": {
    "navLine": 275,
    "pdmFile": "07_重建工作区/PDM-02_最终完整规则.md",
    "pdmLine": 91,
    "pageLine": 110,
    "pageId": "P04-01",
    "navAction": "新增/停用/恢复普通员工",
    "subject": "EMPLOYEE_MANAGER",
    "intent": "EMPLOYEE_DEACTIVATE"
  },
  "LEGACY-118": {
    "navLine": 275,
    "pdmFile": "07_重建工作区/PDM-02_最终完整规则.md",
    "pdmLine": 194,
    "pageLine": 110,
    "pageId": "P04-01",
    "navAction": "新增/停用/恢复普通员工",
    "subject": "EMPLOYEE_MANAGER",
    "intent": "EMPLOYEE_REACTIVATE"
  },
  "LEGACY-119": {
    "navLine": 276,
    "pdmFile": "07_重建工作区/PDM-02_最终完整规则.md",
    "pdmLine": 54,
    "pageLine": 112,
    "pageId": "P04-03",
    "navAction": "设置角色/权限覆盖/数据范围/接客状态",
    "subject": "EMPLOYEE_MANAGER",
    "intent": "PERMISSION_OVERRIDE"
  },
  "LEGACY-120": {
    "navLine": 276,
    "pdmFile": "07_重建工作区/PDM-02_最终完整规则.md",
    "pdmLine": 54,
    "pageLine": 113,
    "pageId": "P04-04",
    "navAction": "设置角色/权限覆盖/数据范围/接客状态",
    "subject": "EMPLOYEE_MANAGER",
    "intent": "DATA_SCOPE_CONFIG"
  },
  "LEGACY-121": {
    "navLine": 276,
    "pdmFile": "07_重建工作区/PDM-02_最终完整规则.md",
    "pdmLine": 211,
    "pageLine": 113,
    "pageId": "P04-04",
    "navAction": "设置角色/权限覆盖/数据范围/接客状态",
    "subject": "EMPLOYEE_MANAGER",
    "intent": "RECEIVING_CONFIG"
  },
  "LEGACY-138": {
    "navLine": 170,
    "pdmFile": "07_重建工作区/PDM-24_最终完整规则.md",
    "pdmLine": 23,
    "pageLine": 149,
    "pageId": "P10-01",
    "navAction": "启用/停用公告",
    "subject": "AUTHORIZED_ADMIN",
    "intent": "ANNOUNCEMENT_ENABLE"
  },
  "LEGACY-139": {
    "navLine": 170,
    "pdmFile": "07_重建工作区/PDM-24_最终完整规则.md",
    "pdmLine": 23,
    "pageLine": 149,
    "pageId": "P10-01",
    "navAction": "启用/停用公告",
    "subject": "AUTHORIZED_ADMIN",
    "intent": "ANNOUNCEMENT_DISABLE"
  },
  "LEGACY-142": {
    "navLine": 171,
    "pdmFile": "07_重建工作区/PDM-24_最终完整规则.md",
    "pdmLine": 104,
    "pageLine": 152,
    "pageId": "P12-01",
    "navAction": "保存/启用 Banner",
    "subject": "AUTHORIZED_ADMIN",
    "intent": "BANNER_CREATE"
  },
  "LEGACY-143": {
    "navLine": 171,
    "pdmFile": "07_重建工作区/PDM-24_最终完整规则.md",
    "pdmLine": 104,
    "pageLine": 152,
    "pageId": "P12-01",
    "navAction": "保存/启用 Banner",
    "subject": "AUTHORIZED_ADMIN",
    "intent": "BANNER_EDIT"
  },
  "LEGACY-144": {
    "navLine": 203,
    "pdmFile": "07_重建工作区/PDM-24_最终完整规则.md",
    "pdmLine": 104,
    "pageLine": 152,
    "pageId": "P12-01",
    "navAction": "启用/停用",
    "subject": "AUTHORIZED_ADMIN",
    "intent": "BANNER_ENABLE"
  },
  "LEGACY-145": {
    "navLine": 203,
    "pdmFile": "07_重建工作区/PDM-24_最终完整规则.md",
    "pdmLine": 122,
    "pageLine": 152,
    "pageId": "P12-01",
    "navAction": "启用/停用",
    "subject": "AUTHORIZED_ADMIN",
    "intent": "BANNER_DISABLE"
  },
  "LEGACY-007": {
    "navLine": 70,
    "pdmFile": "07_重建工作区/PDM-20_最终完整规则.md",
    "pdmLine": 517,
    "pageLine": 43,
    "pageId": "C01-01",
    "navAction": "收藏/取消收藏",
    "subject": "CUSTOMER",
    "intent": "FAVORITE_TOGGLE"
  },
  "LEGACY-008": {
    "navLine": 70,
    "pdmFile": "07_重建工作区/PDM-20_最终完整规则.md",
    "pdmLine": 517,
    "pageLine": 43,
    "pageId": "C01-01",
    "navAction": "收藏/取消收藏",
    "subject": "CUSTOMER",
    "intent": "FAVORITE_TOGGLE"
  },
  "LEGACY-019": {
    "navLine": 82,
    "pdmFile": "07_重建工作区/PDM-15_最终完整规则.md",
    "pdmLine": 72,
    "pageLine": 50,
    "pageId": "C03-03",
    "navAction": "提交咨询",
    "subject": "CUSTOMER",
    "intent": "CONSULTATION_CREATE"
  },
  "LEGACY-020": {
    "navLine": 77,
    "pdmFile": "07_重建工作区/PDM-18_最终完整规则.md",
    "pdmLine": 154,
    "pageLine": 171,
    "pageId": "C01-M02",
    "navAction": "确认登记候补",
    "subject": "CUSTOMER",
    "intent": "WAITLIST_REGISTER"
  },
  "LEGACY-069": {
    "navLine": 125,
    "pdmFile": "07_重建工作区/PDM-15_最终完整规则.md",
    "pdmLine": 128,
    "pageLine": 87,
    "pageId": "E06-02",
    "navAction": "开始处理/标记处理中",
    "subject": "EMPLOYEE",
    "intent": "CONSULTATION_PROCESS"
  },
  "LEGACY-070": {
    "navLine": 127,
    "pdmFile": "07_重建工作区/PDM-15_最终完整规则.md",
    "pdmLine": 497,
    "pageLine": 87,
    "pageId": "E06-02",
    "navAction": "解决",
    "subject": "EMPLOYEE",
    "intent": "CONSULTATION_RESOLVE"
  },
  "LEGACY-071": {
    "navLine": 128,
    "pdmFile": "07_重建工作区/PDM-15_最终完整规则.md",
    "pdmLine": 505,
    "pageLine": 87,
    "pageId": "E06-02",
    "navAction": "无效",
    "subject": "EMPLOYEE",
    "intent": "CONSULTATION_INVALIDATE"
  },
  "LEGACY-072": {
    "navLine": 130,
    "pdmFile": "07_重建工作区/PDM-15_最终完整规则.md",
    "pdmLine": 294,
    "pageLine": 87,
    "pageId": "E06-02",
    "navAction": "转派",
    "subject": "EMPLOYEE",
    "intent": "CONSULTATION_REASSIGN"
  },
  "LEGACY-079": {
    "navLine": 174,
    "pdmFile": "07_重建工作区/PDM-06_最终完整规则.md",
    "pdmLine": 109,
    "pageLine": 66,
    "pageId": "E02-02",
    "navAction": "发布",
    "subject": "EMPLOYEE",
    "intent": "VEHICLE_PUBLISH"
  },
  "LEGACY-087": {
    "navLine": 179,
    "pdmFile": "07_重建工作区/PDM-09_最终完整规则.md",
    "pdmLine": 43,
    "pageLine": 65,
    "pageId": "E02-M01",
    "navAction": "最新电话",
    "subject": "EMPLOYEE",
    "intent": "PUBLISHER_PHONE_REFRESH"
  },
  "LEGACY-088": {
    "navLine": 90,
    "pdmFile": "07_重建工作区/PDM-21_最终完整规则.md",
    "pdmLine": 278,
    "pageLine": 64,
    "pageId": "E02-01",
    "navAction": "一键转名邦",
    "subject": "EMPLOYEE",
    "intent": "VEHICLE_CONVERT_SOURCE"
  }
});
export function currentBusinessDomain(path){
 if(/consultations/.test(path))return ["PDM-15","OWNER_REVIEW_GAP"];
 if(/waitlists?|locks?/.test(path))return ["PDM-18","F06"];
 if(/transactions?|refunds?|deposits?/.test(path))return ["PDM-19","F06"];
 if(/price|pricing|quota|markup/.test(path))return ["PDM-10","F05"];
 if(/recommendations?/.test(path))return ["PDM-14","F06"];
 if(/demands?|find-car|matching|priorities/.test(path))return ["PDM-11/13","F06"];
 if(/jyt|collector|integration|upstream-phone|publisher/.test(path))return ["PDM-09","F07"];
 if(/public-pool/.test(path))return ["PDM-17","F04"];
 if(/announcement|banner/.test(path))return ["PDM-24","F04"];
 if(/vehicles?|vehicle-catalog|model-match/.test(path))return ["PDM-04/06","F05"];
 if(/employees?|roles?|permissions?|system-admin/.test(path))return ["PDM-02","F04"];
 if(/customer|crm|followup/.test(path))return ["PDM-01/16","F04"];
 return ["OWNER_REVIEW_GAP","OWNER_REVIEW_GAP"];
}
