# F05-3K｜B工程自验与A独立复验交接

## 本批施工目标与冻结范围
根据A正式F05-3K完整施工单，本批只新增CI独立测试、证据和4份新Workflow：原F05-3B真实JYT同步、F05-3C真实Employee合法Lock转换、F05-3G/v19既有Customer Favorite在同一真实隔离PG16库组合。原业务代码、旧000001～000019迁移、原工作流及PDM Final不改。仅测试Synthetic Customer，不接真实微信或JYT。

## 源业务与安全门禁
源测试执行已签v18真实准备并原样增量v19，确保已有JYT carCode经原API Credential同步、Customer Favorite Current/ADD Event先行COMMIT，再以原Employee合法Current Lock/Team/capability真实convertWholesaleToMingbang。原Vehicle ID/ListingCycle ID不变、mingbang+hidden并留原Conversion Receipt/Audit。转换后原car_code active重放、不同车型、幂等重试、batch offline和current查批发均不能复活/复制/下架名邦车；全关系SQL row_to_json+SHA256在重放前后原样，只有受信Source Receipt/调用审计允许正常增加。两真实PG16 backend在原转换checkpoint争抢JYT Advisory Lock返回55P03，原Source/Conversion/Favorite不可变防篡改仍有效。HTTPS同时使用原F05-3B路由和F05-3I（封装原F05-3C）路由，所有真正权限、Origin、CSRF/Cookie及业务响应由原受信代码执行，新路由仅做CI路径映射。

## 同SHA GitHub独立回归门禁
- 旧H 52/52、I 2/2、J 2/2三组jobs:到EOF严格原样逐字不变，仅新增专属触发header。
- K独立source/https各1个非特权真PG16作业：F05-3K新增K-A01..10、K-B01..07，所有运行需显示原生# fail 0、同SHA真实结构/来源/并发证据。
- 本文件并不单独宣布成功。只有官方4个Actions run全部completed/success、52+2+2+2=58/58且B HEAD=PR HEAD=run.head_sha、两新非空未过期Artifacts和中文PR正式评论都核实，才可正式记READY_FOR_A_REVIEW/NEXT_OWNER=A。无法拿到真实CI结果时标BLOCKED，不以代码存在代替测试。

## 保留缺口
CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP、GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION、HIDE_REASON_RECALCULATION_SOURCE_GAP、IMAGE_LOCALIZATION_SOURCE_GAP持续保留。无真实生产JYT同步/图片/资金/电话/微信；F05/F04生产/C-H01/V1仍NOT_READY。
