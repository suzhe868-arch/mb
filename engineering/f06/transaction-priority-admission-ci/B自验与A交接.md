# 名邦汽车 V1｜F06-5C B 工程全包自验与 A 独立验收交接报告

> 日期：2026-10-14。业务及权限边界：**CI_ONLY / F05_F06_V1_NOT_READY / PRODUCTION_NOT_AUTHORIZED**。
>
> **截至代码提交 `47eba0b7b827c120e56c69055bf15235de78b891`：B_SELF_TESTED，22/22 Push、96/96 非特权 PG16 Job 已官方全绿。**
>
> 本报告提交本身将产生更新的 HEAD；**必须对该最终 HEAD 再核实相同门槛，并在 PR #62 留下同 SHA 签署后，才将 PR 标记 `READY_FOR_A_REVIEW / NEXT_OWNER=A`。** 旧历史 BLOCKED 状态仅为下方故障归档，不代表代码 SHA47eba 当前失败。A 尚未独立验收，禁止 B 合并 main。

## 一、仓库与严格授权

- 主线来源：`main` 的 A 正式放行 `708697bd2cabd3dfbd14adb79e04ba0a2af3058e`；A 的完整工作单和 2026-10-14 补充裁决不改变产品规则。
- 唯一工作分支：`feat/f06-5c-transaction-priority-admission-ci`；[PR #62](https://github.com/suzhe868-arch/mb/pull/62)。
- PR 与 main 对比：34 个文件，全部在 `engineering/f06/transaction-priority-admission-ci/**` 和 `.github/workflows/f06-5c-*.yml` 白名单。无旧 F05/F06 父服务、正式 24 迁移、公签 DDL 或生产资金 API 改动。
- 原优先推荐仍只在隔离 PG16 使用真实 F03 签名员工会话、原 F05-7 Match 和原 F05-8 仲裁；不得开启生产 Priority/Transaction/Refund/财务签发器。

## 二、B 实施与代码自审

1. **A 裁决更正旧父表封印：**原错误 `>=192` 改为实际严格 **190 张旧父表**（5B 前 188 + 5B 两张）。本批 Sidecar 新增 `f06_5c_ci.attestation` **1 张**，不混入旧父计数。逐表完整 COUNT+MD5、D1、旧 F06 Sidecar、24 Ledger 与公共 Catalog 均在真实 PG16 保存封印；注错 DDL 回滚无残留。
2. **同一物理事务签发：**F06-5C 受限 `auth.withSession` 包装器先对目标 Vehicle `FOR UPDATE`，在原 F03 会话同一 PostgreSQL Client/BEGIN/COMMIT 内复验双源 Transaction、Lock、Customer、Permission、Scope、Match、Qualification、旧 Priority 历史，再调用冻结原 `arbitrateCI`。禁止手工 `INSERT Priority`；核对签名 `created` 事件、合法胜者、同 PID/txid。错胜者抛错导致事务 ROLLBACK，不落半写。
3. **真实来源正反与业务回归：**原 5B 签名安全 Transaction 占用拒绝；原 3B 冻结错误转换历史保留且不漂白；真正 F03 Token、锁冲突及两 Backend；客户失活/员工失活/拒绝非当前资格与现存 Priority 重放；合法 F05-7 原签 Match 和 F05-8 资格之后，使用原 PostgreSQL `clock_timestamp/pg_sleep` 自然跨越 CI 合成 Lock 到期，调用冻结 F05-8 原子签发合法新 Priority，校验 TTL/事件/唯一性及 F06-2 系统最终终结，禁止旧 Priority 复活、真实退款与支付。
4. **端口竞争工程修复：**仅在 F06-5C 名称工作流的 Runner 上为 TLS 测试预留 `49000-49100` 端口范围，避免与 Linux 出站临时端口分配冲突；旧父 HTTPS9 的任何断言都没有删减或替换。冻结 F06-2 CI 分支环境使用原 `withF062` 临时受限转发，不伪造官方 Push/SHA。

## 三、真实官方 CI 最终已核实代码提交（47eba0b7...）

| 门槛 | 官方实际结果 |
| --- | --- |
| 22 条真正 GitHub Push 工作流 | **22/22 SUCCESS**，均为 `47eba0b7b827c120e56c69055bf15235de78b891` |
| 真实 PG16 Job | **96/96 SUCCESS**；其中 H52 独立真实 Job **52/52** |
| F06-5C Source | **56/56 PASS**，`# fail 0`，[Run 38593574178](https://github.com/suzhe868-arch/mb/actions/runs/38593574178)，Job `115954422609` |
| F06-5C HTTPS | **9/9 PASS**；同 Run，Job `115954422954` |
| 旧父190表双物理数据库Seal | **PASS**，Scenario OID `68453`；Audit OID `73476`；PG PID `1429` / `1583` |
| 旧父全行 Digest | `5d8d341c8967bdecd2ca1078d1074e8d7e243204807048b16d9262c6a9659f81` |
| 24 Ledger SHA256 | `b9beed2d9e5fda2511bef6cbcd6d050862971714b9464624dc6439888c118033` |
| 原公共 Catalog SHA256 | `5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4` |
| Artifact 元数据 | **96/96 非空、未过期、同 SHA**，无失效项 |
| Artifact ZIP 实物 SHA256 抽验 | 下载 **32/32** 份原生官方 ZIP；逐条对照 `sha256sums.txt`，内部 **239/239** 个文件哈希通过，0 无清单或篡改 |

### 32 份真实 ZIP 哈希校验工件 ID

`11908652296`, `11908292925`, `11909610616`, `11908582302`, `11909670527`, `11909070864`, `11909865259`, `11908522840`, `11909200614`, `11908622363`, `11908577313`, `11908238143`, `11908835684`, `11908258087`, `11909270474`, `11908522497`, `11909855017`, `11908726705`, `11908951030`, `11908288039`, `11909195970`, `11908672011`, `11909820239`, `11908203540`, `11909345933`, `11908313161`, `11909905077`, `11908697227`, `11909330893`, `11909135765`, `11908826442`, `11908557638`

上述 32 份均在 GitHub Actions 对应 Run 真实下载，并分别将 ZIP 中 `sha256sums.txt` 的 SHA256 与逐文件原始字节重新计算逐项核对；不是仅把 Artifact 非空当作哈希验证。

## 四、历史真实失败与已整改链路

- A 原错误旧父数 `192`：真实 PG 仅190，A 已正式裁决更正，未造假表。
- `b06d670f86cf` 时 5C shell 断裂、原 HTTPS Fail；已修复并保留历史。
- `f840b6156c79` 时 19/22 成功，3B/5B/5C 失败分别为 inherited TLS `EADDRINUSE` 和 F06-2 GITHUB_REF 兼容错误；现最新真实回归 22/22。
- `5cc5d66fd594` 时 Source56 的 S51/S52/S53 因真正 Lock 关闭引发原 Match stale；采用原 PG 时钟自然到期、期间保留原 F05-7 当前签名，`47eba0b7` 官方 Source56 已全部真实 PASS。
- 这些故障和失败 Run 保留作历史，不把失败宣称成功，也不回写冻结父源来掩盖。

## 五、A 独立验收与责任移交门槛

A 必须以 PR **实际最新 HEAD** 为准重读六份 main 正式状态及完整施工单，确认新的最终 SHA 自己满足 **22/22 Push、96/96 Job、真实 H52、Source56/HTTPS9、双 OID 旧父190张全量Seal、>=32有效同 SHA 官方 sha256证据**，而不能误用本报告引用的上一代码 SHA 为最终 HEAD。

只有上述最终 HEAD 确认为全绿且 PR 的独立最终交接评论签署 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`，B 才准将 PR 草稿转为待审。**A 自行独立代码审查、复验、合规合并及主线状态更新；B 一律不合并 main**。F05/F06总体、C/H01、V1仍 `NOT_READY`；生产权限、真实支付、完成成交、已退款、外部身份与部署继续禁止。
