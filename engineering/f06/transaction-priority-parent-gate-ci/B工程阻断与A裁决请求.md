# 名邦汽车 V1｜F06-5C-PG1｜B工程实做、红证与A裁决请求

> 状态：**B_IN_PROGRESS / NOT_READY_FOR_A_REVIEW / POSSIBLE_BLOCKED_UPSTREAM_SIGNED_CATALOG**。本文件是施工/阻断材料，**不是B验收通过报告**。

> **2026-10-15已核销原裁决请求**：A已在`main`最新`NEXT_ACTION.md`/正式补充施工单放行PR63同白名单下的版本化三对象目录验证与安全4A/4C等价入口。本文件是**当时父Catalog冲突的历史红证及原裁决请求**，不代表当前仍待A签发授权。B正在真实PG16原生复验；**尚未通过全部门禁，状态B_IN_PROGRESS、NEXT_OWNER=B**。参见同目录`B工程阶段自验与未闭环证据_2026-10-15.md`最新续工节。

## 1. 主线与严格范围

- A 权威基线：main `ca42b72f2b1308bdbef01a465ba35b54474534bd`，A 施工单 `07_重建工作区/F06-5C-PG1_A主控冻结F05-8父自动签发跨域越权_版本化补丁与独立原生PG16修复正式施工单_2026-10-15.md`。
- 当前分支：`fix/f06-5c-pg1-parent-priority-guard-ci`；独立草稿 [PR #63](https://github.com/suzhe868-arch/mb/pull/63)，对比 main，未合并。
- 原安全红证（本分支实施前）：[PR62 C01–C03 原生PG16真实RED](https://github.com/suzhe868-arch/mb/actions/runs/38641938789)；3项失败不得删、改期望值、改用mock。
- 仅新增 `engineering/f06/transaction-priority-parent-gate-ci/**`、`.github/workflows/f06-5c-pg1-*.yml`。没有修改原签 `000024_priority_ci.sql`、旧24 Ledger、旧F05/F06父实现、生产或原PR62。

## 2. 已实现的非生产技术尝试

1. 新版 `sidecar.sql` 将 `BEFORE INSERT public.f05_8_priority_ci` 门禁放在旧F05-8真实签发边界。遇有效候补、无签/未知交易、退款、资金异动等返回禁止发行，不通过旧已取消行的public状态偷放权。
2. 合法4A/4C取消顺序是先更新public交易状态、后写取消origin/event/request-key。新增 `DEFERRABLE INITIALLY DEFERRED` 事务末校验，兼顾早期阻断发行与在真实签名齐备后重新调用原签发函数。
3. 只针对旧父 `source-create:` 自动触发路径采用 `RETURN NULL` 抑制提前Priority INSERT；未知/人工来源直接安全失败，不静默成功。
4. 新增 `诊断父签名冲突.mjs` 封印190个原父业务表的逐表 `COUNT + MD5`、旧F05-8关键函数定义、旧触发器定义、24 Ledger；在安装新增对象后逐项复验并列举Catalog新对象，绝不声称新旧Catalog字节完全相同。
5. 为真实PG16诊断准备隔离工作流 `f06-5c-pg1-parent-signature-red.yml`。流程调用现存5B父级Source真实回归、两OID恢复审计，随后重新安装5B到190表冻结基线，在同一非特权PG16安装PG1并检查原5B验签结果。为保留真实红证，发现未闭合兼容错误时工作流保持红灯，证据独立上传。

## 3. 已查明的严格父级合同冲突（需原生证明才能定案）

- 已冻结 `engineering/f02-1/schema-integrity.mjs` 的 `getPublicStructure()` **逐个纳入 `public` 表的全部非内部触发器定义**，返回其哈希。
- 冻结 `engineering/f06/lock-refund-conversion-guard-ci/migration.mjs` 的 `signed()` 要求 `getPublicStructure(c).sha256` 等于原固定Catalog SHA `5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4`；`verify()` 再次强制相同。4A/4C及其它签名父模块亦通过自身/上游verify检查旧Catalog。
- PG1安装 `pg1_signed_priority_insert` 和 `pg1_deferred_signed_cancel` 必然为public表增加两个触发器，因此新Catalog SHA必然变化，虽然旧定义与业务行可全部不变。**不可拿旧Catalog SHA当新签名，也不可假装旧Service可以绕过严格父验签。**
- 该冲突与旧F05-8真实业务漏洞是不同阻断：即使PG1本身拦住C01—C03，合法4A/4C现存Service也可能先因父Catalog验证失败而拒绝执行。测试门禁不能以“拒绝了合法取消”冒充修好安全漏洞。

## 4. B 需要 A 裁决的最小技术边界

仅当PG16运行实证确认上述父签名接口不兼容、在当前白名单内无法同时通过C01—C03与合法4A/4C时，由A签发**新版有签Catalog增量验证与对应安全入口**的明确例外/独立工程单：必须保留旧24 Ledger、旧v24 SQL、旧父源码历史SHA、旧190表与审计不变，对两个新触发器独立签名审查，而不是降低校验或静默忽略触发器。新版本验证必须覆盖实际4A/4C/5B调用路径与权限。B不会自行修改冻结签名验证器或原PR62代码。

## 5. 尚缺失的验收实证（全部列为阻断，不虚报）

| 门禁 | 真实状态 |
|---|---|
| C01 真候补+真Match+5B+4A 合法取消，零非法Priority | **未通过本分支原生复验** |
| C02 伪public取消在UPDATE/COMMIT/重入都无非法Priority | **未通过本分支原生复验** |
| C03 待退款+伪public取消及4A/4C拒绝路径 | **未通过本分支原生复验** |
| R01无候补全有签的唯一合法新Priority；4B→4C | **未通过本分支原生复验** |
| 双Backend真实PID/txid竞争和失败回滚 | **未通过本分支原生复验** |
| 190旧父全表Seal、24 Ledger、旧函数和新增签名对象精确Diff | **原生诊断工作流验证中，未签PASS** |
| 全体应有Push工作流及最终同SHA Artifact | **未满足** |

原PR62仍安全RED且未合并，F05/F06/V1保持NOT_READY。不得升级为`B_SELF_TESTED`、`READY_FOR_A_REVIEW`或`A_ACCEPTED`。需A独立核查 [PR #63](https://github.com/suzhe868-arch/mb/pull/63) 的真实原生结果后才可下达边界裁决。
