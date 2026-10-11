# F05-3I｜B工程v19既存Favorite→原一键转名邦兼容自验与A交接

## 施工依据及精确改动

A授权仅修改`engineering/f05/wholesale-to-mingbang-conversion/service.mjs`的受信版本前置校验入口。本次新增静态`verifyExactCurrentConversionSchema()`：查真实隔离PG16有序迁移账，仅精确16条、尾部000018时调用原v18完整verifier，精确17条、尾部000018与000019时调用v19完整verifier；其余版本、校验和、结构漂移、历史账签名不匹配一律拒绝。原服务`capability`、`objectScope`、Employee/Team/Lock/Transaction、JYT lineage、CAS、事务、幂等、反向禁止、隐藏与图片缺口均未修改。

## 真实业务集成

在v19已签真实PG16内，先用受限`SYNTHETIC_CUSTOMER_CONTEXT_CI_ONLY`创建Customer+Vehicle Favorite Current与不可变ADD Event；再用原`convertWholesaleToMingbang()`及真实当前有效Employee与同Vehicle/Cycle活动Lock做批发转名邦；对包含Favorite/Events、Customer、Lock、Recommendation、查价周期、交易、展示授权、图片、原ListingCycle/JYT lineage等真实PG16行的结构化哈希、row_count作前后比对；验证原Vehicle/Cycle不变、转换receipt仅一份、原历史不损、合法REMOVE/ADD仍有效。另测无对象Owner即使有Favorite仍拒绝、SystemAdmin/4S/JYT、改v19真实checksum、两独立PG后端`55P03`锁冲突、v18旧测试回归和TLS敏感路由。

## 现时验收进展

**A要求在一个新workflow中原52个Job正文逐字冻结且新增2个Job并保持GitHub实际54/54、两原生Artifacts。** 前版`f05-3h...` YAML UTF8已占511,990 bytes，GitHub工作流解析实际触发上限约512,000 bytes，剩余10 bytes；完全冻结前52个Job定义后根本无法字节级塞入两个新独立Job。严禁偷改旧Job或拿已有旧run冒充同SHA 54/54。此障碍是CI形式约束，不应降低来源与真实业务安全要求。实际本批GitHub新作业结果与证据以Actions运行回执为准，达不到正式54/54时只能标`CI_GATE_BLOCKED_NEEDS_A_TECHNICAL_DECISION`，不能宣称`READY_FOR_A_REVIEW`。

## 持续Source Gaps

无真实Customer微信会话`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`，普通无Lock/未完成Transaction的JYT车`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`，隐藏原因、图片、真实支付、生产JYT/电话等未签；F05/F04生产/C-H01/V1基线均NOT_READY。
