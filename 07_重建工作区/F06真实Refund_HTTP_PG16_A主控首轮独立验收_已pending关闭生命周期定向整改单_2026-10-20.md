# 名邦汽车 V1｜F06真实Refund pending/closed HTTP+PG16｜A首轮独立验收及已pending关闭生命周期定向整改单

- 日期：2026-10-20
- 正式任务：`F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01`，[Issue #140](https://github.com/suzhe868-arch/mb/issues/140)
- A结论：`A_REVIEW_NOT_ACCEPTED / B_TARGETED_CLOSE_LIFECYCLE_REMEDIATION_REQUIRED / NEXT_OWNER=B / NO_BUSINESS_PR / NO_MERGE`
- A完整执行要求：[Issue #140 评论 #6288407435](https://github.com/suzhe868-arch/mb/issues/140#issuecomment-6288407435)
- B原分支：`feat/f06-real-refund-pending-closed-http-pg16-01`
- B受验 HEAD：`e660879fbaec21fbb8b1168c9be408a6d59deab0`
- 受验主线：`main@ad39b112033847ee18cc4736c53d144f7ece1d0a`
- GitHub相对main `ahead=1, behind=0`，8个**仅新增**文件均在`engineering/f06/refund-pending-closed-http-pg16/**` + 单`.github/workflows/f06-real-refund-pending-closed-pg16-onejob.yml`白名单，既有生产服务/DDL/父F06业务/24签名迁移未修改。

## 一、本轮已独立复核通过：不可将真实绿色CI误判为全面拒绝

1. [官方Push Run #39400797756](https://github.com/suzhe868-arch/mb/actions/runs/39400797756) / [Job #118554708402](https://github.com/suzhe868-arch/mb/actions/runs/39400797756/job/118554708402) `completed/success`；GitHub真实head_sha与B HEAD一致。继承真实父**319/319**、新Refund申请/关闭HTTP+非超管PG16**56/56**、新TLS生产资金拒绝**10/10**，合计**385/385**，全部0失败/跳过/取消。
2. 本Run原生F06-3B/3C1签名Apply/Verify通过，Frozen签名F06-3C1 Source SHA `b97fbb3ecaca9fdb75342f5efe80cacc30ccfbf703ea362aa8f03bb65c04e06d`；原父F06-3A四schema完整**161表**逐表COUNT/MD5、24迁移/公签Catalog及前置attestation，真实不同OID：源35233/审计39349/父恢复43594/Transaction恢复60893/本Refund恢复69612，完整行Seal `7be6b2ea571ff210a519c9d16a20383e4eed7814e9b54e4a48c74552ab166b2b`全段相同。
3. Refund pending前置签名/资金来源/现时Employee permission + capability/Team/Store/Scope、无付款closed、幂等/不可变历史、退款先提交→Transaction拒绝、Transaction先提交→旧Lock退款拒绝及Refund↔Transaction双PG业务backend PID1272/1273（1个pending/0交易）、双Refund PID1283/1284（仅一个pending）均有原生日志证明。340+1个Workflow真实预检Push命中1/PR0，标准免费Runner、单PG16服务/Job，不上传Artifact/无额外预算。
4. 双backend确实独立，但冻结`IsolatedAuth.withSession`可能先在同Employee Session行串行化；不能说双方同时竞争到了Vehicle行锁。此已注明并非本次拒验重点；生产/跨多主体授权前需要额外车行锁等待探针，避免过度宣称。

## 二、A查明的唯一核心业务生命周期缺陷

`engineering/f06/refund-pending-closed-http-pg16/worker.mjs`对**两种完全不同的业务动作**统一做：

```js
if (operation === 'request' || operation === 'close') {
  // 锁定Vehicle与来源Lock后：
  if (!cyc || cyc.ended_at || !live ||
      l.lock_status !== 'active' || expired.expired)
    return no('F06_REFUND_CURRENT_LOCK_REQUIRED');
}
```

- **pending新申请**必须检查现时锁车、合法车辆/Listing Cycle和真实有资格申请的资金来源，此约束合理。
- **已存在合法pending的close**不是重新锁车或再次申请退款。正式PDM-19 Final §§19、22～24只允许现时合法可处理Refund的员工凭签名来源/权限、无付款与`close_reason`终结待退款责任；未要求车辆必须继续在售、Lock在整个退款生命周期必须`active`且未到期。PDM-18 Final §§19、22～25承认供应异常、历史Lock生命周期与Deposit/退款职责独立，不允许以车源变化直接撤销原资金责任。
- 现有冻结`engineering/f06/refund-pending-ci/service.mjs` 的 `closeSyntheticRefundCI` 会查现时真实签名Refund来源、权限/Scope、原余额与无实际付款/无owning Transaction，并未对`closed`施加新适配器的live/active/未过期强约束。因此新`worker`早于冻结父服务的额外Guard会导致先合法pending后供应异常/车源暂时不可售/Lock合法状态转移时**无法closed**，客户仍受pending资金责任保护，造成不必要的长期卡死。这不能由仍active的第24项顺利关闭测试覆盖。
- 新HTTP测试#41–43仅注入**pending申请**的`AFTER_PENDING/AFTER_EVENT/AFTER_AUDIT`故障，并未针对无付款`closed`新HTTP跨进程路径测试父服务提供的`AFTER_CLOSE_THROW`或`AFTER_EVENT_THROW`异常后**真正PG16 rollback无半写**。

## 三、B定向修正与验收出口

1. 维持原分支、白名单和现行正式A施工单，其余冻结父源码与公共DDL/迁移/旧Workflow/PDM/生产权限全部只读。对新`request`保持严守当前Lock和资金申请门禁；对`close`在同事务保留真实签名Refund来源、当前合法处理人Session/permission/capability/Scope、无付款/无Transaction/余额/原始客户与周期关系，不能因为Vehicle临时不可售或来源Lock的普通TTL/合法状态变化就自行拒绝对**已签待退款**的无付款关闭。
2. 必须先创建合法受签原生`pending`，在隔离测试库中以合法父生命周期或可验证供应异常模拟来源后续车况/非在售变化，再通过本批真实loopback HTTP成功`closed`、资金支付事实仍0，源Refund/事件/幂等/审计不变，Customer未完资金保护随单条closed解除但其他真实职责不自动取消。若无法以当前父规则合法生成非active来源，须出具严格来源限制和可复验负例供A裁决，禁止篡改M94或伪造旧正式签名事实。
3. 新增本HTTP`closed`路径至少`AFTER_CLOSE_THROW`和`AFTER_EVENT_THROW`真实SQL错误注入用例，分别证明已签pending原行仍`pending`、没有新的closed事件/请求键/Audit/付款，也不修改Deposit/Transaction历史；合法重试正常完成后仍闭环。保证源错误码不是仅由HTTP伪造。
4. 最终同一新B HEAD的单官方Push Job **保留已有385项**、新增上述正反例，全部0失败/跳过/取消，签名父161张全表/24迁移/多OID Seal与独立PG backend证据不减，触发仍Push1/PR0，新增费用$0。中文B自验和Issue #140回报末次HEAD/Run/Job、测试计数与真实状态、关闭Rollback、遗漏生产来源缺口，`READY_FOR_A_REVIEW / NEXT_OWNER=A`后再交A。
5. **本次不创建B业务PR、不合并B分支，不提前放行后续F06/F07/F08或生产真实退款。** 真钱、`refunded`、`refund_payments`、微信/银行、生产Issuer/DDL/UAT/部署一律未授权，V1仍`NOT_READY`。A仅归档技术审查和现行阻断状态，不抹销已有绿色测试。
