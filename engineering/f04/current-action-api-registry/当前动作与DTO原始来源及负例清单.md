# F04-3｜当前动作、DTO、证据来源与负例总审查

## 权威来源

原始 Current IA/Low-Fi 与 PDM-01～25 Final 为唯一业务规则来源。该批技术引用 `engineering/f04/authority-route-mapping/current-authority-route-matrix.tsv` 和 `action-semantic-contract.mjs` 为 F04-2 A 已签收的只读桥接证据。任何历史 OpenAPI URL 均不获准恢复。

已生成30条Current候选合同：23条由F04-2真实同动作、同主体、正确Domain三向引用派生；6条 `NEW_CURRENT_ACTION` 从真实导航/Final/页面产生，且不声称对应旧URL已批准；1条复用F04-1真正PG16当前Customer对象级scope最小CI读证明。所有合同 `HTTP_CONTRACT_REVIEW_STATE=NOT_APPROVED`、`PRODUCTION_ENABLEMENT_STATUS=NOT_PRODUCTION`，无200业务写合同，依赖未实现的返回 `DEPENDENCY_BLOCKED` 或对象权限拒绝。

版本化目录：`current-route-contracts.tsv`（唯一合同输入）、`current-openapi.json`（OpenAPI 3.1声明式产物）、`旧接口与Current动作桥接.tsv`（215条完整source lineage）以及`旧Collector禁恢复独立封印.tsv`。自动验证器检查215个历史候选完整覆盖、23/192、禁恢复3条、30个规范化新path、任意重复operationId/模板冲突、非法method、PDM/IA字节行来源和OpenAPI一一对应，若合同产物漂移会失败。

## 来源风险和语义边界

- Consultation F04合同由PDM-15约束；实施归属暂为`OWNER_REVIEW_GAP`交A裁，不得错误归F05车辆业务。
- Waitlist PDM-18，实施F06；独立LockRequest pending/approve/自动候补并未由本包实现。
- 客户等级、自动解锁及查价账本属于F05，价格受实时账户等级和日额度约束，不能从客户端传入VIP声明后直接放行。
- 4S System Admin账号控制面只保留上一批CI-only身份证明，无可信商户关系时硬拒。
- F04-1冻结CRM最小只读依赖当前account/session、crm.customer.view当前允许、对象实际owner与精确Customer data scope；此正例不是新生产业务接口。
- POST类动作需身份+CSRF+请求键，未获下游实现时仍不写库。数据库M94与G14不同物理版本，不能用相同schema封印偷换。

## 测试出口

两个独立新PG16作业分别测试真实来源+OpenAPI以及loopback TLS+F03 Session/object scope；原F04-2旧28个独立CI作业在新工作流中按原样保留。

完整威胁见`B端安全威胁矩阵.tsv`，最终结论以最新提交的真实CI结果、Artifacts ID、结构checksum和本分支完整交接为准。未被测试通过的项目不得宣告PASS。
