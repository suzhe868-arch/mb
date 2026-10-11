# F05-3J｜B工程受信JYT跨下架新Cycle与v19 Favorite保全交接

## 唯一正式施工范围

A已放行F05-3J：原签v19中存在Favorite Current/ADD Event后，原F05-3B受信API执行JYT active→offline（旧上架周期end_at）→active重新上架（同Vehicle，不同listing_cycle）；旧Favorite整行和全部历史SHA256原样、旧客户查价周期权不带入新周期、旧Priority/hidden不泄露，后续合法REMOVE/ADD不丢事件。

原有源码只修改 `engineering/f05/jyt-wholesale-lineage-cycle/contract.mjs` 的ready受信版本入口及 `ci-router.mjs` handler启动版本入口：静态识别真实PG16完整有序迁移记录版本15/16/17，分别调用原v17、v18、v19完整签名校验，不引入任意调用方替换回调；其余SystemAdmin控制、Credential签发撤销、三个JYT API、车型真实性、历史Receipt、source锁、批发状态、所有权和审计HTTP正文全部冻结。保留严格fail-closed。

## 真PG16/TLS强制自验

- 本包Source J-A01～10（真PG16隔离合成管理员与Customer）、HTTPS J-B01～07（仅loopback端点），两作业各独立重复前序F05-3C旧v18真实18表相关回归、v19结构验签、真实旧Cycle权与新Cycle价格授权隔离。
- Source中的实际JSON哈希证据：`verified-cycle-favorite-preservation.json`包含Favorite Current/Event前后、老周期价权Hash及不同Cycle/FK事实；HTTPS也有独立`verified-cycle-favorite-preservation.json`、不可更改原Source receipt与原安全接口。
- 新增三工作流必须在B最终同一个完整40位SHA运行：冻结52/52 + 原F05-3I i2/2 + 新J2/2 = 56/56；旧52及i2每个Job完整`jobs:\n`到EOF按字节拷贝，单字不能变。
- 所有官方run均completed/success；新原生source和HTTPS Artifacts必须非空、未过期，含真实PG16 schema-only/catalog、迁移签名账、转前/中/后SQL哈希、PG16来源矩阵、完整日志及sha256。不得将历史SHA成功当作新SHA验收证据。

## 产品上线边界

Customer真微信Session尚缺受信issuer；普通无Lock/交易批发车经营Owner不授；隐藏原因重算、图片资产化、真实JYT upstream、真实微信、资金、电话、生产server均未授权。F05/F04生产/C-H01/V1基线维持`NOT_READY`。B不能自行合并main或擅自开始后批。

**本文件只是工程验收材料的固定说明，最终READY_FOR_A_REVIEW只有实际56/56全绿并交PR原始证据后才成立。**
