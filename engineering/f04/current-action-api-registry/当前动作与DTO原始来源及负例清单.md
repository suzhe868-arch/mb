# F04-3｜A定向整改后的Current动作、DTO字段、权限语义与负例清单

## 当前权威与不可恢复边界

唯一产品权威：PDM-01～25 Final、Current IA动作/权限/守卫合同及Low-Fi导航/页面。F04-2 A已验收原`ACTION_PROOFS`只证明23个业务动作同主体/证据对应，不批准218旧HTTP方法。本批另有215逐项桥接（23 EVIDENCE_MATCHED+192 SOURCE_GAP）和3条RETIRE/FORBIDDEN Collector连接路径；每个旧候选继续UNDECIDED/CONTRACT_ONLY。

本次按A-F04-3-01改为**32条CI-only候选**：23个原F04-2证明的Current动作、6个新Current动作、1个已签F04-1真实PG16最小Customer对象读，新增2个PDM02 §6.2 SystemAdmin控制平面员工启用/停用候选。原始旧编号只留`source_legacy_id`做不变历史链接，新HTTP path通过当前业务主体、目标资源及动作独立给出（`current-route-contracts.tsv`）。

## 独立可执行的DTO/Schema与真实不足

- `dto-contract-lock.json`存32条严格请求/响应模型；每个模型有身份主体、resourceKind、Domain Authority、每字段类型/required/最小范围/来源文件行/证据状态及有限拒绝响应；`current-openapi.json`给一一对应的OpenAPI 3.1 operations、components/requestBody、响应schema和分主体authentication。
- `source-guard.mjs`做本地原始PDM/IA/LowFi真实行与动作proof校验及合同、DTO、OpenAPI、组件Schema双向一致性校验，不是只看一个v1前缀。未知必填、数据类型、另加VIN/电话/内部价格/非法错误码、伪造200/权限认证或旧URI均在新PG16负例拒绝。
- **字段证据不可扩大解释**：当前只给被真实Final支撑的最小对象标识/状态字段CI候选类型。完整商品发布表单、Vehicle/4S真实归属、页面所有字段、交易资金/客服资料/Customer真实Session均未确定实现，字段来源记录按`fieldSources`逐项标CURRENT CI引用或SOURCE_GAP，不得推断已拥有生产DTO准入。
- 发布正式目标是**草稿draftId**（PDM06 §4/§6）；Banner placement是`HOME_TOP|VEHICLE_DETAIL`正式枚举（PDM24 §6）；LockRequest查看路径包含`lockRequestId`且不代表approve；这三项附单独源字段/Schema变异负例。
- Customer端动作不可能使用PC Cookie作合法Customer认证；OpenAPI显示`CUSTOMER_AUTH_DEPENDENCY_BLOCKED`，future客户方案明确DISABLED，当前实际HTTPS拒绝假Customer Header/PC Cookie/前端VIP。
- 员工业务manager/运营配置actor不能靠角色名代替权限与scope。SystemAdmin仅控制平面账号/permission配置，PDM02 §6.2双新增候选与普通业务经理路径分开；真实target account scope无凭据时一律403，不反向授其Consultation/Lock/CRM/价格能力。

## 同主体现行新动作语义封印

`current-action-semantic-lock.json`每条固定（**Final原文文件行 + Navigation动作与condition原文 + 页面原文 + Actor + 资源 + state + Domain/owner**）。本批6项分别为：
- LOCKREQUEST_PENDING_CREATE：Customer/LockRequest.PENDING/PDM18/F06；只是客户申请不是锁成功
- LOCKREQUEST_REVIEW_OPEN：Employee只读待审LockRequest /PDM18/F06；不是审批完成
- APPLICATION_PENDING_WITHDRAW：Customer本人pending Application/PDM11/F06；不是Demand直接结束
- EMPLOYEE_SELF_RECEIVING：Employee本人有效接客资格及不得关闭最后接客人/PDM02/F04
- PRICE_QUOTA_CONFIG：被授权的业务管理人员配置等级当日查价权益/PDM10/F05；非SystemAdmin执行业务售价
- CONSULTATION_NORMAL_CLOSE：Employee合法Consultation负责人将工单置resolved NORMAL_CLOSED/PDM15；实现Owner尚需A确定

另外SYSTEM_ADMIN_EMPLOYEE_DISABLE/ENABLE精确锚定PDM02 §6.2员工账号治理；A-F04-3-02/03真实负例针对同一文件不同动作、业务对象状态与领域错配、SystemAdmin/经理/Customer混淆。

## 正反例与阶段边界

源码测试`tests/source-registry.test.mjs`+`tests/a-rectification-contract.test.mjs`；真TLS测试`tests/current-router.test.mjs`。代码层仅限PG16非特权全目录封印与HTTPS localhost CI；唯一已签F04-1合成最小CRM CustomerId读可200，其他合成业务需真实依赖时只能403/501，无非授权业务写入，不代表客户端/销售端/PC端整体上线。原28冻结PG16全工作流仍逐项运行，新增2个各自独立PG16 run与原生Artifacts，最后以GitHub最新run与HEAD严格相同为准。

仍缺的正式实施：F04账号/商户可信关系/真实Customer会话、F05车辆与查价权益、F06锁车/咨询实施Owner与交易、F07 publisher_id电话/CDN、H01视觉与H03/H04联调，全部NOT_READY。
