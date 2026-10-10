# F04-1｜旧接口来源缺口与阶段依赖

## 溯源方式
- 原始证据为 `09_历史工程资产基线/01_ENGINEERING_STARTER_LEGACY/packages/contracts/openapi.yaml`，源文件有 18,459 行。
- 提取到 **198 个不同路径、218 个 HTTP method + path 对（其中62个合法含冒号操作路径）**，见 `legacy-endpoint-inventory.tsv` 的 LEGACY-001～LEGACY-218，逐条真实 source_line 与 operationId 核对；62个曾被错误归属到相邻路径的项目见 `62条冒号路径修正对照.tsv`。
- 每行保存原始行号、HTTP 方法、路径、operationId、原安全域、权限、scope、DTO、幂等字段和建议后续归属；`parse-legacy-openapi.mjs` 采用严格限定的独立 `paths` YAML结构解析，包含 `:authorize`、`:unlock`、`:test` 等合法冒号后缀，严格拒绝重复键/重复method/重复operationId与错误缩进；`contracts-inventory.test.mjs` 以**源HTTP方法行+完整path+operationId**逐行复验，加入结构损坏、相邻多method及全部62行变化的反例。
- 数量与旧调查目标218相符，无数量缺失。**已正式禁恢复的3个Collector旧接口明确 `RETIRE/FORBIDDEN`，其余215项按 `UNREVIEWED_SOURCE_GAP/SOURCE_GAP` 保留**。旧实现与最新PDM Final、Current IA对应的页面动作未逐项证实，绝不能把这215项标为已确认KEEP/MODIFY或已允许生产的接口。
- 禁恢复3项：GET/PATCH `/admin/integrations/collector/connection` 和 POST `/admin/integrations/collector/connection:test`，依据 `IA_V5_ACTION_CONTRACT.md` 中 `IA-GLOBAL-B4-ACTION`、F04-1 A-F04-02正式整改单。禁重命名/包装恢复。旧OpenAPI不是当前权威；215项 `UNREVIEWED_SOURCE_GAP` 是**尚未裁定**而非新的第六种已签业务决策；已批准五类KEEP/MODIFY/RETIRE/REPLACE/ADD仅在有逐行Authority证据后记录。

## 当前可运行范围
- F04-R01：隔离PG16/HTTPS中通过冻结F03-1会话确认，仅返回受限证明；不是生产登录。
- F04-R02：以M94及F03-P对象授权完整签名为前置测试员工车辆字段出口。旧M94无法证明vehicle→Team/4S业务归属，**只允许安全拒绝**，绝不能当员工车辆阅读/导出已完成。
- F04-R03：现时员工是目标Customer当前owner且**现时 `crm.customer.view` 能力绑定到同一 Customer 的明确 `scope_kind=object/scope_reference_id=customer_id`**（真实M94表＋当前role/personal deny、动态生效/结束时间、客户状态）时，隔离测试只返回最小customerId；任意Team/store scope均不得代替目标对象授权。用原F03-2预存employee1+scope102+customer302对象能力验证合法正向，无新增假的object-scope fixture。过期/变owner/个人deny/旧token立即拒绝；显式object授权允许跨店，不按员工store猜测。
- R04～R09为严格 `OPEN_DEPENDENCY` 合同；未接入真实Customer/Vehicle/价格/Lock/Transaction/Refund/采集发行人。

## 明确不满足的正向依赖
1. F04：System Admin与4S账号正式控制面、角色和实际客户对象授权/业务HTTP/audit仍无正式数据来源；当前只允许已有**可信对象级scope**的本人客户ID受限正向证明，不提供完整客户资料或任何正式生产CRM读/写。
2. F05：真实车辆→员工Team或4S商户归属、独立Vehicle权限、内部价`internal.price.view`及正常编辑权限，以及等级/每日账本/原子解锁均待签可验来源。
3. F06：LockRequest 六小时门禁、候补、交易转换、付款与Refund原子真实业务生命周期，不能由合成F03负责人移交证明代替。
4. F07：JYT源端publisher_id、合法取号、图片CDN和Collector链；不得恢复car_code取电话。
5. H03/H04：小程序/员工端/后台消费界面及撤权缓存/三端联调必须以C/H01正式高保真与授权业务域为前提。

## 禁止借口
不恢复旧218接口的原路径供生产调用；不把旧OpenAPI DTO、`created_by`、客户端`teamId`/等级/旧缓存、仅CRM Team访问能力作为业务对象权限；不发真实HTTP、生产资金或上游请求。本轮没有新增DDL、迁移或旧业务服务修改。

状态：**F04_1_A_REWORK_IN_PROGRESS / FINAL_SAME_SHA_CI_REQUIRED / PRODUCT_BASELINE_NOT_READY**。