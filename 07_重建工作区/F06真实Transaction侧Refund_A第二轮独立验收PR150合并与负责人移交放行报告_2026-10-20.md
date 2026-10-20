# 名邦汽车 V1｜F06真实Transaction侧Refund｜A第二轮独立验收、PR150合并与下一包正式放行报告｜2026-10-20

> 裁决：`A_ACCEPTED_NONPRODUCTION_HTTP_PG16_PR150_STANDARD_MERGED`。下一责任：`B`；生产/真钱/完成成交及F06/F07/F08/V1整体`NOT_READY`。

## 一、对象与已完成的证据核对
- A正式任务 [Issue #147](https://github.com/suzhe868-arch/mb/issues/147) 已关闭，责任分支 `feat/f06-real-transaction-refund-http-pg16-01`；最终B受验HEAD **`f774bc49407b7e2b8918347c03989b1b7230770d`**。上轮A退改HEAD `38135893...`；本轮新增一次提交仅改本白名单内4文件：`service.mjs`、`sidecar.sql`、`tests/http.test.mjs`、中文交接。
- A以GitHub实时[官方Push Run #39436527215](https://github.com/suzhe868-arch/mb/actions/runs/39436527215) / [Job #118674868785](https://github.com/suzhe868-arch/mb/actions/runs/39436527215/job/118674868785)原日志独立确认最终 `GITHUB_SHA=f774bc49...`，单Job `completed/success`；完整继承父 **445/445** + 新PG16/HTTP **79/79**（原65+新14）+ TLS10/10 = **534/534**，失败0/跳过0/取消0，无拼接旧Run。
- GitHub compare `main@a3841c84e85e765e835dc796406bc170591aed8d` 与B分支：ahead9/behind7（behind7均A治理PR149，无业务文件冲突）；总不同文件11个**全部新建于唯一白名单** `engineering/f06/transaction-refund-http-pg16/**` + 专属OneJob Workflow，不改旧父代码/Public M94/24签名迁移/PDM或生产API。专用预检 Workflow343、push_matches=1/pr_matches=0；同Run父业务/PG签名仍完整执行，旧父路径预检的临时shim严格限历史branch变化路径，后续新入口自身预检真实运行两次。
- 真PG16非超管、PR139/PR146/3A/3B/3C1原签兼容矩阵、Origin/Event/Key/Audit同Session真实事务，注错Rollback、幂等、权限/Team/Store/Capability撤权、4S/伪Token、禁用Customer、未知Deposit、原Lock退款不可转绑、真假付款/异常关闭FailClosed均有实际业务证据。两PG Backend PID **1821/1822**仅一成功，明确未宣称“两人同时已持有Vehicle锁”，因为相同Employee Session可能先串行化。
- 161张原生签父表逐表COUNT/MD5、24迁移、原Catalog Seal，父source OID **78558**、最终独立恢复source OID **87832**、audit OID **39349**；完整签父全行Seal两次均 `7ab2090ea5ed9fba2ba8a2829b0f74136b522409063b60a347fa29719ef6b757`，新退款Sidecar没有伪装加入原父161。

## 二、A首次拒验R1本轮真实闭环
冻结原生3A `correctSyntheticDepositCI()`可经独立财务纠错授权在已converted Lock继续追加Correction/Reversal，而旧B创建时Digest同**当前所有调整**Digest强制相等，导致合法pending后资金修正误报 `F06_TX_REFUND_CASE_SOURCE_DRIFT`。A在治理PR149退B补真用例。

B新`f06_real_tx_refund_ci.deposit_snapshots`每Refund唯一，首次合法pending在与Public Refund/Origin/Event/Key/Audit**同一PG16认证Session事务**内写入原3A Receipt/Provenance/Adjustment+原签Key完整JSON、原净额SHA256、最大调整ID水位、时间；Sidecar表有append-only拒UPDATE/DELETE。历史Refund不改 `origin.source_deposit_digest`：`verifyDepositHistory()`仍比对原快照SHA与原不可变Origin摘要、当前原Receipt/Provenance全字节一致、每笔初始调整和Key全字节相同；对水位之后的每一笔追加，必须由原生3A签名RequestKey证明actor/Lock/deposit/amount、调整ID递增、调整与Key时间均严格晚于快照。未知、无Key、插入伪造或真实付款继续FailClosed。
真实HTTP新测试 #64–77 覆盖已签pending后+1500/−3000/完整Reversal净额归零仍可无付款closed、旧closed后追加+3000与Request/Close原Key幂等、后续新退款按最新13500/11000/15000或0正确核额、快照与3A历史不可篡改、原生3A故障注错真实Rollback、无签Adjustment关闭拒绝。全部实际Run通过，不以B文字自述替代。

## 三、正式流程与安全限制
- A建立标准业务[PR #150](https://github.com/suzhe868-arch/mb/pull/150)，GitHub可合并，按明确受验Head SHA执行标准Merge；实际业务merge commit **`cc2542a18ed8498ba549ff0f4cefd5e8beeedd8d`**。正式Issue #147已关闭。
- 仅**非生产合成已合法cancelled Transaction-side pending退款和无付款closed**受验；真实`refunded`、银行/微信/资金入账、`completed`成交及价款、纠错、生产Issuer/Public Schema变更、UAT、真实客户均**没有授权**。旧F06-3B直接路径及4A/4C同PR139真实新源的不兼容历史仍不能被本次结果当作修复。
- A下一批正式放行 [Issue #151](https://github.com/suzhe868-arch/mb/issues/151)：`F06_REAL_TRANSACTION_RESPONSIBLE_HANDOFF_HTTP_PG16_01`，仅非生产合成PR139 `in_progress` Transaction现时负责人正式签名handoff、历史不可变与当前独立permission/scope，唯一施工单《F06真实Transaction负责人移交HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md》；B从执行时最新main起步，新分支 `feat/f06-real-transaction-handoff-http-pg16-01`，保留旧父534真实重跑，新增真PG16至少30/TLS10、跨OID161父表Seal一致，`READY_FOR_A_REVIEW`交A。Handoff后的Cancel/Refund若冻结父不兼容，须明确FailClosed，不能擅自修旧父或放行真实服务。
