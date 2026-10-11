# 名邦汽车 V1｜F05-3E 自动隐藏与人工隐藏原因可信来源核证和安全拒绝交接

## 判定：TRUSTED_HIDE_REASON_SOURCE_AUDIT_COMPLETED_SOURCE_GAP

A正式施工单：`07_重建工作区/F05-3E_A主控自动隐藏与人工原因可信来源及转换重算隔离完整施工单_2026-10-11.md`。本包只核PG16当前可信来源、演示真实并发保护和保守安全拒绝，**没有宣称自动/人工多原因的完整可见性重算已经成立，更没有开放生产解除隐藏。**

- 已签PDM04 Final规定source_scope显式、规则间OR/规则内不同字段AND/同字段多值OR。现有M94已签`vehicle_hide_rules`虽有`conditions_json`和`source_scope_json`、`is_enabled`、更新员工FK与时间，但缺本包可核已签rule issuer/event、版本或不可变治理审计；`vehicles`只有`model_id`、`platform_visibility`等，缺可证明品牌/年款/地区/关键词组合且可信映射。JSONB格式也不能作为已签字段语义或确实命中。未核证当前人工hidden/其他原因的具体事件、撤销权/优先级和持续有效Carrier。静态`hidden`聚合标记不能逆推出人工原因，更不能支持自动恢复visible。
- `auditCurrentHideCarriers`只读核真实非特权PG16`pg_catalog`、现有规则与当前Vehicle字段，不猜测是否可以visible；`auditRecalculation`使用真Employee Session、read/manage、个人deny、Team/数据Scope、真实当前Vehicle/Cycle的行级`FOR SHARE`及有效hide_rules行`FOR SHARE`，只返回`HIDE_REASON_RECALCULATION_SOURCE_GAP`或更严格拒绝，**绝不UPDATE任何车辆可见性、规则或历史、不会签发新的Owner/暗造新Cycle**。对没有授权的匿名/JYT/4S/SystemAdmin和伪publisher/owner/hide reason同样拒绝。
- 新原生PG16 source测试E-A01～08：真实Schema字段及未知来源、已转换JYT源`mingbang/available/hidden`、唯一旧Cycle和转换收据不变、合成JSON规则只证明不能给业务授权、员工个人deny、真双backend`55P03`规则停用与Vehicle改visible竞争、主体伪造负例。合成JSON样例**不是可发行当前规则**，从不被宣称规则正向matcher已通过。
- 新真实TLS测试E-B01～07：只建立loopback`/__ci__/f05-3e/...`，真Session/CSRF、角色/鉴权/伪header、坏DTO/非法方法/路径、敏感出口及转名邦后继续hidden，拒绝响应是无敏感字段最小DTO。绝不正式生产注册路由。
- **工程修改白名单**：指定新分支`feat/f05-3e-hide-reason-trust-recalculation`只新增`engineering/f05/hide-reason-trust-recalculation/**`和单个专属workflow；旧签000001～000018和F03～F05-3D源码/原44个CI Job/PDM/IA/Low-Fi/生产/C零修改。未新建000019，因为没有可信来源供正向签发或真实多因果结构增量。
- **CI验收门槛**：新工作流必须保留旧44独立Job全文逐字冻结，追加2真实隔离PG16 source/TLS审计，最终官方46/46 success+B HEAD=PR HEAD=run.head_sha、两份未过期Native Artifacts（schema-only/full-catalog/inventory/checksum/源矩阵/真原生日志）。实际run和SHA必须待官方核验后补PR评论，不提前冒充完成。
- 非本包依然留`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`、`IMAGE_LOCALIZATION_SOURCE_GAP`、`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`、`F05_3C_V18_NEW_CAR_SOURCE_MAPPING_GAP`、`SOURCE_GAP_BLOCKED_FOR_PRODUCTION`。不能因为本包测试绿灯就宣称生产或V1基线READY。A独立验收只按**隐藏原因物理来源审计与安全拒绝**范围签收，并集中裁定后续合法原因Carrier与规则可信签发源。
