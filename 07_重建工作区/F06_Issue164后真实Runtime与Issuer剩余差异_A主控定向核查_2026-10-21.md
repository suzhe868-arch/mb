# 名邦汽车 V1｜Issue164验收后 F06 Runtime / 可信 Issuer 剩余差异｜A 主控定向独立核查

> 日期：2026-10-21
> 主线审查基线：`main@59f833caf2cd2ea4ad22645faf1120156e31c929`（业务PR169与治理PR170已经合并）
> 责任窗口：A
> 已完任务：`A_F06_POST_ISSUE164_REMAINING_RUNTIME_ISSUER_GAP_AUDIT_01`
> 决定：`A_F06_NONPROD_LIFECYCLE_GAP_CONFIRMED_B_SINGLE_PACKAGE_RELEASE`
> 已确认生产/真钱/F07/F08/V1仍未放行

## 1. 已验且严格复用的资产

- 已关闭[Issue164](https://github.com/suzhe868-arch/mb/issues/164)，已经合并[PR169](https://github.com/suzhe868-arch/mb/pull/169)；A验收B末SHA `1feb1e4efa8120252950e3d2d5b808a76a5bdb2c`，真实同SHA[Run39560892258](https://github.com/suzhe868-arch/mb/actions/runs/39560892258)/Job119091597788 completed/success，Composite纵向正反闭环42/42、HTTP强拒32/32、真实PG16缺签强拒6/6、独立Legacy PG16审计1/1，0 fail/skip/cancel；161父表、24迁移跨3真实OID证据已归档。
- `engineering/src/server.mjs` 已有显式`F06_COMPOSITE_TEST_CONSENT`隔离分支，`engineering/src/f06-nonprod-composite-runtime.mjs` 已在`f03_auth_test/f03_ci`真实本Run签名DB验证父Attestation/F03有效会话，显式组合LockRequest/Lock和合成Deposit→PR139Tx→PR153Handoff→PR156Cancel→PR162Refund pending/0付款closed。
- `engineering/src/f06-lock-service.mjs` 中LockRequest的6小时失效、同车原子竞争、冲突后自动候补和客户进度安全投影已有独立逻辑，**不是这次的实现空白**。
- `engineering/src/f06-lock-runtime.mjs`、`f06-lock-lifecycle-service.mjs`、`f06-lock-lifecycle-http.mjs`中，原单库隔离`CI_LEGACY`已有Lock延期/人工释放/取消/系统按PG时钟到期与既有财务只读保护；不得重建原状态机。

## 2. 现行新单Runtime确切未接线

A重新逐源码核对现行文件：
1. 新`createIsolatedF06CompositeRuntime` 只用`createIsolatedF06LockService`与`createIsolatedF06LockHandler`，叠加`createCompositeDenyHandler`以及6条Composite合成资金/交易服务入口；**没有在新Composite handler中安装Legacy已有Lifecycle Service/Handler**。
2. 旧`createIsolatedF06LockLifecycleService`的入口必须经过`assertF06TestEnvironment`和`verifyF06TestDatabase`，其`LOCK_SCHEMA='f06_real_lock_test'`、员工session表`f06_real_lock_test.employee_sessions`、来源`DISPOSABLE_TEST_ONLY`、finance proof表`f06_real_lock_test.lock_lifecycle_finance_proofs`全部按另一`f06_lock_test/f06_lock_ci`物理库设计。不能因已经在同一Node进程就把这些历史Issuer当作新Composite的真实来源。
3. 旧资金保护还要额外证明“确实不存在签名Deposit/Transaction/Refund事实”；其`synthetic_absence_confirmed`只适用于旧隔离来源，不是同库Composite里的当前财务真相。新单库Lifecycle直接套用旧服务可能产生缺表、错Issuer或不可信财务缺席结论。
4. Issue164 E2E已经对正式`/api/v1/transactions/*/complete`、`/api/v1/refund_cases/*/mark-refunded`、`/api/v1/refund-payments/*/pay`硬拒；此界限仍必要。当前`server.mjs`配置`production`或`NODE_ENV=production`明确`F01_PRODUCTION_NOT_READY`；即使新生命周期补上也不是生产服务。
5. F07 Collector/JYT/图片CDN/通知与 F08 贯穿质量按路线仍是**独立B阶段**；F06产品资金未授权不应重复生成旧PR资金代码或阻碍在后续独立工单中开展合法非生产F07准备/实施，但**本报告没有实际授权F07/F08开工**。

## 3. 分类结论（不偷换验收等级）

| 能力 | 最新主线实物 | 判定 | 责任 |
|---|---|---|---|
| 签名Composite单库Lock→无真钱Refund closed | PR169官方真PG16 42/42 | `A_ACCEPTED_NONPRODUCTION` | 只保留、必要关联回归 |
| 普通Lock Lifecycle独立隔离CI | `f06-lock-lifecycle-*.mjs` 已有 | `CI_LEGACY_EXISTING_REUSE` | 禁止重造 |
| **Composite同库普通Lock Lifecycle接线** | 新Composite runtime未装Lifecycle；旧Service绑定另一DB与Issuer | `CONFIRMED_COMPOSITE_LIFECYCLE_RUNTIME_WIRING_GAP` | 通过新Issue171在受限白名单做一次完整B包 |
| 客户LockRequest 6h、候补/进度 | 已有请求侧代码、旧资产可复用 | `EXISTING_ASSOCIATION_TEST_ONLY` | 只测与新生命周期交互 |
| 真正已收意向金后的资金事实、Transaction completed、refunded、真实退款/成交纠错 | 缺受批准的真实来源、授权、凭证/资金Actor | `TRUSTED_REAL_WORLD_SOURCE_AND_AUTHORIZATION_GAP` | A保留，禁止B用CI签名模拟正式付款 |
| F07/F08全阶段 | 路线已有、非生产子资产可能存在但本单未逐项验收 | `SEPARATE_STAGES_NOT_RELEASED` | 后续A独立依赖核查/放行 |

## 4. A 最小范围裁决

**当前不再对PR169逐块拆Issue；本次只新增一个和旧实物明确不同的F06非生产生命周期接线包**：[Issue171](https://github.com/suzhe868-arch/mb/issues/171)，正式施工单见[《F06 Composite普通Lock生命周期可信接线正式B施工单》](F06_Issue171_Composite普通Lock生命周期可信接线_A主控B正式施工单_2026-10-21.md)。

- B在本A治理PR标准合入`main`后，从最新main建立唯一指定分支；完整整包完成，统一自审后交A，不需要用户逐项“继续”。
- 限非生产、受控Loopback、真实可销毁非超管PG16、独立Composite本Run签名、真实F03会话、当前Permission/Scope、已有同库Lock/财务事实。严格保留旧Legacy语义；不能伪造历史`GITHUB_REF`/Issuer，不能改已验资金状态机、旧SQL/迁移。
- 重点普通无资金Lock延期、释放、取消、系统到期、Priority/资金/签名拒绝、并发事务一致；不可接通则交准确的同任务阻断证据，不虚报Pass。
- 真正有Deposit或Transaction/Refund时的延长/结束必须依现有PDM与可信现时资金事实强拒，不用“无款”原语绕过；不得实现真实支付/退款完成。
- F06/F07/F08/V1仍是`NOT_READY`。Issue171过A验收后再由A判断非生产F06残余边界与F07下一阶段的合法施工准备，不对既有F01～F05做一轮重复全审。

## 5. 任务交接

`NEXT_OWNER=B`；`NEXT_TASK=F06_NONPROD_COMPOSITE_LOCK_LIFECYCLE_INTEGRATION_01`；`NEXT_ISSUE=171`；`NEXT_BRANCH=feat/f06-nonprod-composite-lock-lifecycle-01`。实际放行仅在本报告及施工单通过A治理PR合入`main`后生效。
