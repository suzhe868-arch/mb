# 名邦汽车 V1｜F06 Issue164｜B 阶段交接与可信 Issuer（发行者）阻断技术裁决申请

> 状态：**`BLOCKED_TRUSTED_F06_ISSUER_RUNTIME_GAP`**；未达到 `B_SELF_TESTED / READY_FOR_A_REVIEW` 的全链合格标准。  
> 唯一正式任务：`F06_NONPROD_SINGLE_RUNTIME_TRUSTED_SOURCE_INTEGRATION_01`，Issue [#164](https://github.com/suzhe868-arch/mb/issues/164)，只限非生产合成数据。  
> B 开工 main：`b77f2912dfafae58d5c2c5d5e9d8dad8641bfc3c`；原已A验PR162与父 PR139/146/150/153/156不重复建设。  
> 本报告**不是对F06的最终验收或生产放行**，如无A新增白名单，不得继续对冻结父服务改写。

## 一、本次已合法实现的实物

1. 在 A 指定分支 `feat/f06-nonprod-single-runtime-trusted-source-01`，只增加 `engineering/src/f06-nonprod-composite-runtime.mjs`、原`engineering/src/server.mjs`的最小opt-in分支、新集成验证目录和一份独立CI工作流，没有写旧财务/Transaction、冻结SQL、F03源码、公共DDL、主线或生产服务。
2. `F06_COMPOSITE_TEST_CONSENT=I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY` 和原 `F06_LOCK_TEST_CONSENT` 双明确同意、test模式、127.0.0.1、固定非超级用户 `f06_lock_ci` 可销毁数据库必须同时满足。现有完整 `createIsolatedF06LockRuntime` 仍原生检验24迁移/公共表/源签，未删除任何门禁。
3. `createFoundationServer` 同一 Node 进程下可挂接 Lock Handler 与安全拒绝Adapter，Lock业务**仅在满足原父真实PG16数据库条件时才可能就绪**。历史交易/资金的生产路径、旧CI源直接请求、未签版本化API全部 `503 F06_COMPOSITE_SIGNED_SOURCE_GAP`，不接受HTTP自报Issuer/Role/Admin绕过，不生成资金/Transaction。
4. 签名数据没有伪造、`GITHUB_REF/GITHUB_SHA/GITHUB_ACTIONS/GITHUB_RUN_ID`没有赋值/重写；没有创建旧PR146签名、真实退款、`completed`或`refunded`。

## 二、真实执行结果（限已执行部分）

- 官方非生产 Push Run：[39513978259](https://github.com/suzhe868-arch/mb/actions/runs/39513978259)，同所提交代码 SHA `6a795c113bf1e9190fa7870d4b3c37451750f029`，`completed/success`。
- **32/32** 新原生 Node HTTP安全/装配场景、**6/6** 新真实非超级用户 PostgreSQL16 （原生backend PID 87，16.15）环境源缺失/严格拒绝场景；`0 failures, 0 skips`，各TAP由单独脚本严格验证。
- 此 Run 的PG16没有F06原生签名父表，预期必须阻断装配；**不是**通过真实 LockRequest→Lock→Deposit→Tx→Handoff→Cancel→Refund完整链的测试；该链真实正向执行**0项，NOT_RUN**。此前 PR162 130/130 与跨OID Seal 只作历史已验事实，本轮未重新执行，不能借来充本次正向通过。
- 源矩阵以真实运行边界为准：

| 子链路 | 当前使用的已验入口/信任主事实 | 本包实际状态 |
|---|---|---|
| LockRequest / Lock / Lifecycle | `engineering/src/f06-lock-runtime.mjs` 原 PG16 签名表、员工/客户Session | `LOCK_RUNTIME_EXISTING`；受控原生数据库具备时可挂载，但本Run只测缺签拒绝 |
| Deposit 3A | `engineering/f06/deposit-ledger-ci/service.mjs` / 原生3A签名财务来源 | `SIGNED_SOURCE_GAP` |
| PR139 Tx | `engineering/f06/lock-transaction-http-pg16/service.mjs` 原不可变Origin/Key/Event | `SIGNED_SOURCE_GAP` |
| PR153 Handoff | `engineering/f06/transaction-handoff-http-pg16/service.mjs` 真版本签链/员工权限 | `SIGNED_SOURCE_GAP` |
| PR156 Cancel | `engineering/f06/post-handoff-cancel-http-pg16/service.mjs` 原不可变Cancel签名 | `SIGNED_SOURCE_GAP` |
| PR162 Refund pending/closed | `engineering/f06/transaction-refund-http-pg16/service.mjs` 同一受控余额核心 | `SIGNED_SOURCE_GAP` |

## 三、已由冻结源码明确证明的阻断，不可使用短路或假测试解决

**阻断 A：不同历史GitHub分支的硬门禁不可能由一个真实应用请求同时满足。**

- PR139 `assertCIServiceGate()` 固定 `GITHUB_REF='refs/heads/feat/f06-3a-deposit-ledger-ci'`，并绑定历史单独 `F06_TX_ENTRY_REF`；
- PR153 `gate()` 固定 `GITHUB_REF='refs/heads/feat/f06-3c1-refund-pending-close-ci'`，绑定历史 `F06_HANDOFF_ENTRY_REF`；
- PR156、PR150/162 Refund同样要求既定 `GITHUB_REF` / 旧 Entry / `GITHUB_SHA`、`RUN_ID`、`GITHUB_ACTIONS`，原签名源验证不可取消。
- 本 Issue 正式分支 `feat/f06-nonprod-single-runtime-trusted-source-01` 是真实GitHub Push，但该 `GITHUB_REF` 不可能既等于PR139历史3A分支又等于PR153历史3C1分支。使用旧 `worker.mjs` 方式覆盖进程env变量或拦截guard会构成**A已明确禁止的伪造父Branch**。新目录不能为旧父模块合法签发源。

**阻断 B：签名事实在不同冻结数据库合同中，未授权跨库复制/迁移。**

- 现有原 Lock runtime 必须 `f06_lock_test / f06_lock_ci`，原PG16读取24迁移和真实Lock侧车；
- 原 PR139/153/156/162 服务固定 `f03_auth_test / f03_ci`，使用另外一套同源签名历史。
- 现有隔离F03登录服务`verifyAuthDatabase`只接受最初80表/1迁移的独立F03测试身份基线，不能直接把这个库声明为具有24迁移的F06财务账本。不同DB与来源签名无法仅靠同一个Node进程转成**同一可信PG16事务**。把锁/资金数据跨库假INSERT，或声称两库原子提交均超出本单白名单。

**阻断 C：原生财务余额/Refund结果不能通过只读投影伪造。** 新包不能改动PR139/150/153/156/162冻结Service及3A/SQL/签名Issuer，也禁止复制另一套退款状态机。因此目前没有合法新增一个不需要裁决的“统一签名源产生者”。

## 四、请A对一个整体包做一次最小技术裁决

**建议A先独立确认以下最小受控设计，不要求用户逐项参与一般代码细节：**

1. 授权一个**原生非生产 Composite Issuer 与 Signed Source Adapter**：必须由内部可信持久化原生数据库事实与真实F03独立有效员工Session共同签发，按PR139→PR153→PR156→PR162每步父签名、Version/Actor/RequestKey/Audit、原3A净余额保持原生核验；不允许 HTTP 自报 `issuer`、单个 `trusted=true` 或任意 `GITHUB_REF` 假造。
2. 明确 **F06一份同一PG16数据库与事务边界**：如何把目前隔离在 `f06_lock_test` 与 `f03_auth_test` 的合法Lock/财务父签名事实归并至可销毁新数据库，同时维护原161张父表+24迁移Seal，以及禁止双账本/跨DB伪原子。需要A明确新数据库、权限、签发和冻结父只读如何共存的精确方式。
3. 精确放行受影响源入口与最小共享可信Issuer接口的**文件白名单**（无新PDM业务规则），并明确签名门禁保留/新增的真实PG16迁移、旧入口FailClosed和必要父回归。只在A签字后B按新白名单接着完成≥20正反业务集成与完整跨OID Seal；旧测试保持有效，但不能冒充新业务成功。

**优先原则：不要通过伪造历史GITHUB_REF、改资金数额、复制三套状态机、放开生产Issuer/真实支付来“完成”这项单Runtime验收。**

## 五、此刻工程状态与接力

| 检查项 | 真实结论 |
|---|---|
| 当前包已授权合法代码/安全拒绝 | **部分完成** |
| 新HTTP拒绝安全测试 | **32/32 PASS**（真实HTTP，但不等于完整集成业务） |
| 真实非超管PG16缺签拒绝 | **6/6 PASS** |
| 真签Lock→Deposit→Tx→Handoff→Cancel→Refund | **NOT_RUN/阻断，0个正向新场景** |
| 同事务财务/两Backend业务竞争/注错真实Rollback | **NOT_RUN** |
| 161父表/24迁移跨OID新包Seal | **NOT_RUN** |
| `READY_FOR_A_REVIEW` | **不得标记** |
| `main` / 旧PR / 真钱生产权限 | **未变更** |

责任接力：**A技术裁决**。不是已经完成全包，也不请求用户重新批准已有普通工程工作；A应据此定向决断可合法实现统一可信Issuer的最小签名边界。A放行后B沿原Issue164相应分支继续，不重新调查F01～F05。
