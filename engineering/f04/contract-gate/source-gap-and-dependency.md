# F04-1｜旧接口来源缺口与阶段依赖

## 溯源方式
- 原始证据为 `09_历史工程资产基线/01_ENGINEERING_STARTER_LEGACY/packages/contracts/openapi.yaml`，源文件有 18,459 行。
- 提取到 **136 个不同路径、218 个 HTTP method + path 对**，见 `legacy-endpoint-inventory.tsv` 的 LEGACY-001～LEGACY-218。
- 每行保存原始行号、HTTP 方法、路径、operationId、原安全域、权限、scope、DTO、幂等字段和建议后续归属；`contracts-inventory.test.mjs` 逐行回到真实源文件验证。
- 数量与旧调查目标218相符，因此当前无**数量性** SOURCE_GAP；但旧实现代码覆盖和与PDM最新Final的业务对应尚不完整，所有218项仍为 `CONTRACT_ONLY`，不可宣称可用或生产安全。
- 原旧 OpenAPI 不是当前权威；`review_action=MODIFY` 仅表示需要逐项核对后重建，`suggested_domain` 为初步技术分流，不能替代 A/产品正式裁决。

## 当前可运行范围
- F04-R01：隔离PG16/HTTPS中通过冻结F03-1会话确认，仅返回受限证明；不是生产登录。
- F04-R02：以M94及F03-P对象授权完整签名为前置测试员工车辆字段出口。旧M94无法证明vehicle→Team/4S业务归属，**只允许安全拒绝**，绝不能当员工车辆阅读/导出已完成。
- F04-R03：仅在员工为客户**当前负责人**、CRM独立能力和个人deny/动态Team范围可证时，返回最小customerId且仅CI，绝无电话/历史资料；非法对象一律拒绝。
- R04～R09为严格 `OPEN_DEPENDENCY` 合同；未接入真实Customer/Vehicle/价格/Lock/Transaction/Refund/采集发行人。

## 明确不满足的正向依赖
1. F04：System Admin与4S账号正式控制面、角色和实际客户对象授权/业务HTTP/audit仍无正式数据来源；当前只允许本人客户ID的受限正向证明，不提供完整客户资料或任何正式生产CRM读/写。
2. F05：真实车辆→员工Team或4S商户归属、独立Vehicle权限、内部价`internal.price.view`及正常编辑权限，以及等级/每日账本/原子解锁均待签可验来源。
3. F06：LockRequest 六小时门禁、候补、交易转换、付款与Refund原子真实业务生命周期，不能由合成F03负责人移交证明代替。
4. F07：JYT源端publisher_id、合法取号、图片CDN和Collector链；不得恢复car_code取电话。
5. H03/H04：小程序/员工端/后台消费界面及撤权缓存/三端联调必须以C/H01正式高保真与授权业务域为前提。

## 禁止借口
不恢复旧218接口的原路径供生产调用；不把旧OpenAPI DTO、`created_by`、客户端`teamId`/等级/旧缓存、仅CRM Team访问能力作为业务对象权限；不发真实HTTP、生产资金或上游请求。本轮没有新增DDL、迁移或旧业务服务修改。

状态：**F04_1_IMPLEMENTATION_IN_PROGRESS / B_CI_PENDING / PRODUCT_BASELINE_NOT_READY**。