# 名邦汽车 V1｜F06 Issue #164｜单PG16可信 Composite Issuer 与冻结服务双入口｜A 主控技术裁决补充单

> **裁决结果**：`A_RULING_APPROVED_NONPROD_COMPOSITE_DUAL_GATE_B_CONTINUE`。
> **责任窗口**：B 接续原分支 `feat/f06-nonprod-single-runtime-trusted-source-01`、原 Issue #164，**不重建原PR139/146/150/153/156/162、不重开工程包、不强推**。
> **裁决证据**：B SHA `7058779956438009fbc49a8f100ddcf5f7e17192`、[Run39514294355](https://github.com/suzhe868-arch/mb/actions/runs/39514294355) / Job118942621386 为 **32/32 隔离HTTP拒绝 + 6/6 PG16 缺签拒绝**，只是已授权合法范围的成功，**全链真实成功0项**，不得标 `READY_FOR_A_REVIEW`。B 详细报告见 `engineering/f06/nonprod-single-runtime-integration/B阶段交接与可信Issuer阻断技术裁决申请.md`。
> **优先级**：此补充单仅对原 [F06单应用隔离Runtime可信源接线工作单](F06单应用隔离Runtime可信源接线与业务闭环_A主控B正式施工单_2026-10-21.md) 中互斥的 GitHub历史分支/旧双库与技术白名单作精确覆盖；其它业务、安全、测试、非生产限制维持原约束。本文件**标准合入 main 后**才授权 B 按新白名单开始修改。

## 一、A 独立源码核实与技术判断

1. **历史分支门禁并非业务来源证明**：`lock-transaction-http-pg16/service.mjs` 要求旧 `GITHUB_REF=refs/heads/feat/f06-3a-deposit-ledger-ci`；`transaction-handoff-http-pg16/service.mjs`、`post-handoff-cancel-http-pg16/service.mjs`、`transaction-refund-http-pg16/service.mjs` 却要求旧 `GITHUB_REF=refs/heads/feat/f06-3c1-refund-pending-close-ci`。单次合法 Issue164 Push 不可能同时等于这两个历史分支。原 `withF062()` 等函数也会暂时重写进程 `GITHUB_REF`，**该历史做法不能作为本新 Runtime 的合法 Issuer 方案**。
2. **固定旧测试物理库彼此独立**：`engineering/src/f06-lock-readiness.mjs` 和 Lock 服务绑定 `f06_lock_test/f06_lock_ci`，旧PR139/153/156/162与独立F03身份则绑定 `f03_auth_test/f03_ci`；`verifyAuthDatabase()`又明确要求裸F03的80表/1迁移，不能把已叠加24迁移的F06交易数据库反称为裸F03库。因此**单Node进程≠单PG事务**，两个PG库不能通过客户端映射凭空变为原子资金业务。
3. **真实余额必须沿用已验服务**：原 PR150 与PR162共享的资金/3A历史/Refund `pending→closed`内核不能再复制。源端新 `COMPOSITE` 标识绝不豁免 F03有效员工会话、最新Permission/Capability/Scope、PR139/153/156版本化签名、不可变Origin/Key/Event/Audit、车辆与Lock占用、资金余额与原生事务守卫。原PR146旧入口对PR156新签名继续`FailClosed`。
4. B 在冻结白名单内正确停止并报告 `BLOCKED_TRUSTED_F06_ISSUER_RUNTIME_GAP`；这是A原工作单的物理不兼容，不要求用户批准日常非生产技术细化，也不允许把旧38项拒绝测试说成真正的财务全链交付。

## 二、正式选定的安全技术方案（拒绝另外两条捷径）

**选定：一库、双信任模式、单份业务核心。** 历史的 `CI_LEGACY` 模式保留原分支、库名、签名与父来源检查，之前 A 通过的原生测试和安全拒绝不能被新授权关闭。新增唯一 `COMPOSITE_NONPROD_SIGNED_V1` 模式仅供**本真实GitHub Push SHA的新分支、127.0.0.1、可销毁 PG16、非超级用户**，经显式 `F06_COMPOSITE_TEST_CONSENT` 与不同于历史旧Issuer的本地受控信任配置选用，不能由 HTTP body/header/client Token 自报选择。不可用任意参数`trusted=true`代替签名核验。

1. **物理单库选型**：优先使用受控原签名交易库 `f03_auth_test/f03_ci`（其已验24迁移及PR139/150/153/156/162子表为既有交易链主源），而不是把这份资金/Transaction事实复制到 `f06_lock_test`。仅在可销毁真PG16中，在**同一物理数据库**通过原有合法签名SQL/来源Issuer建立并验证 Lock 需要的受控事实；`f06_real_lock_test` 如需落入该物理库，必须是**独立新增的真实签名非生产源**，不能把过去其它物理库的数据转储当同一PG事务，也不能通过 UPDATE `f06_1_lock_ci`、PR139 Origin、原3A Ledger 等表拼接造假。要求真实F03员工单Session的身份与Lock员工现行 Scope/Role/Session做同物理行事实验证。原 `f06_lock_test` 默认 Runtime 不允许被此新模式覆盖。
2. **真Issuer模型**：新Composite信任入口需由**真实当前GH Run 的 `GITHUB_REF/GITHUB_SHA/GITHUB_RUN_ID`与已验证版本化服务代码、完整签名公共Schema/24迁移、同物理PG后台、父源 Attestation、F03员工签名会话共同构成**。新增独立 `COMPOSITE_NONPROD_SIGNED_V1` 发行者事实/Key/Event/Audit和不可变Digest（如果业务动作需要，可在本Issue新增目录内以私有隔离sidecar.sql实现，仅非生产独立schema，不修改公共DDL、旧资金sidecar或24迁移）。信任源由服务端内部构造，HTTP只传业务参数和原F03 session token，不得用人为伪造旧 `GITHUB_REF`、绕开旧 `gate()`、调用旧worker传假元数据、插旧PR146 Origin、绕过真实SourceDigest来取PASS。
3. **受控双入口，而不是原门禁变宽**：B允许将受影响的历史 `CI_LEGACY` 分支门禁与业务/签名检查分开，抽取唯一被复用的**私有核心函数**。旧函数/导出API的历史代码路径仍调用原强 `gate`；新受控 `COMPOSITE_NONPROD_SIGNED_V1` API独立检查新issuer/当前实际GH SHA/同PG、原有完整父签名，并调用**相同**签名、金额、Permission、Lock/Transaction、退款业务函数。**禁止**写成 `if(process.env.F06_COMPOSITE_TEST_CONSENT) return` 使旧API自动跳过原 gate；禁止改旧正例/拒绝的预期语义。原旧各层可能继续使用历史ref切换做旧CI，但新Composite调用链**不得**为通过门禁去覆盖 `process.env.GITHUB_REF`或父 `ENTRY_REF`。
4. **顺序与同事务**：单数据库单连接，按 `Vehicle → Transaction → Lock → Refund` 约定锁序及相关签名来源、Event/Key、3A历史水位/余额重验，操作与新不可变私有Issuer事实在**同PG事务**提交或全部Rollback；异库成功/失败不得被报告为“一体闭环”。每一来源链真实生成和被验，旧PR150 Refund Legacy对新来源继续强拒；未签来源一律 `SIGNED_SOURCE_GAP`。

**明确否决**：(a) 改写 `GITHUB_REF`/伪造历史 `CI`/用旧Key冒名；(b) 继续Lock库与Tx库跨物理数据库事务并声称单库原子；(c) 复制PR150另一份资金计算/独立状态机或填入假PR139/PR146/PR156签名以通过父校验。

## 三、A 对 Issue164 的精确白名单修订（仅适用于选定方案）

**原 Issue164 新增和 Runtime 装配白名单全部保留。为拆分历史环境门禁与真实受控非生产业务核心，只在下列精确现有文件允许最小改动，不表示全部文件必须修改：**

### A类：单库 Runtime 与 Lock 受控接线

- `engineering/src/f06-lock-readiness.mjs`
- `engineering/src/f06-lock-runtime.mjs`
- `engineering/src/f06-lock-service.mjs`
- `engineering/src/f06-lock-lifecycle-service.mjs`
- `engineering/src/f06-lock-http.mjs`
- `engineering/src/f06-lock-lifecycle-http.mjs`

仅允许新增`COMPOSITE_NONPROD_SIGNED_V1`选择、同库校验、必要现时F03员工签名会话适配；默认旧Lock单库/既有URL和权限/签名规则保持完全不变，现有公共表/TTL/Waitlist状态机不可重写。若不需要改这些文件则应不修改。

### B类：已验F06资金/Transaction的环境入口与父签名验真接线

- `engineering/f06/lockrequest-approval-waitlist-ci/migration.mjs`
- `engineering/f06/lock-lifecycle-ci/migration.mjs`
- `engineering/f06/deposit-ledger-ci/migration.mjs`
- `engineering/f06/deposit-ledger-ci/service.mjs`
- `engineering/f06/lock-transaction-ci/migration.mjs`
- `engineering/f06/lock-transaction-http-pg16/service.mjs`
- `engineering/f06/refund-pending-ci/migration.mjs`
- `engineering/f06/transaction-cancel-http-pg16/service.mjs`
- `engineering/f06/transaction-refund-http-pg16/service.mjs`
- `engineering/f06/transaction-handoff-http-pg16/service.mjs`
- `engineering/f06/post-handoff-cancel-http-pg16/service.mjs`
- `engineering/f06/post-handoff-refund-bridge-http-pg16/签名来源只读核验.mjs`

**限定用途**：仅拆分/增加新的`COMPOSITE_NONPROD_SIGNED_V1`可信Source入口、同库签名Verifier委托或把原私有签名/资金主业务核心提取为一个复用点；不得编辑原有公共SQL、旧签名sidecar、`Attestation`旧来源值、历史Key/Event/Audit、旧API拒绝逻辑、资金/退款金额公式。允许的新 `migration.mjs` 改动只应是入口验证而非改原旧SQL字节/签名算法。任何遇到下游 F05、F03、F02 冻结模块也要求改写时 **立即列成一个准确 `BLOCKED_COMPOSITE_PARENT_AUTHORITY_DEPENDENCY`**, 不擅自越级扩大到全部旧阶段。

### C类：本Issue新资产与CI

- 保留`engineering/f06/nonprod-single-runtime-integration/**`（可在此新增版本化且严格非生产的Composite issuer private sidecar、contract、测试）
- 保留`engineering/src/f06-nonprod-composite-runtime.mjs`、`engineering/src/server.mjs`、必要时`engineering/src/app.mjs`
- 保留且仅一份`.github/workflows/f06-nonprod-single-runtime-onejob.yml`；必须从旧“只有缺签拒绝”升级成**真实签名正例+安全负例**的同SHA原生PG16/HTTP门禁后才可称完成

**始终严禁写入**：`engineering/f02*/**`、`engineering/f03*/**`、`engineering/f05*/**`、旧冻结的任何 `sidecar.sql`、24公共签名迁移、老工作流及required checks、PDM Final/IA、正式生产Issuer/支付与客户数据、C PR68。任何需扩大生产、真实资金或产品规则的事项不属于A本技术裁决权限。

## 四、B 继续施工与验收门禁（一次性做完整包，不反复切Issue）

1. **恢复原分支**：B以原SHA`7058779956438009fbc49a8f100ddcf5f7e17192`已有合法成果为基线，安全同步本A治理PR合并后的最新main；保留原本32/32 HTTP及6/6真实PG16源缺失强拒，禁止强推、重建分支或另建平行工程。
2. **先只读判定必要改动链**：依 A/B/C协作规范在现有 Issue164 同包内给出可核验的真实「源入口→最小改动方法→旧入口稳定对照→本单真实PG数据和请求」映射。B自主完成本单准许白名单内的必要修复与测试，不要求用户逐项批准普通工程。
3. **新PG真正正例**：在真实本次GITHUB Push建立合法单物理PG16、必要不可变父签名与F03员工独立Scope/Session，至少20个新增业务集成/负例，其中应有真实`Lock→3A合成Deposit→PR139 Tx→PR153 Handoff→PR156 Cancel→PR162 Refund pending→0付款closed`链路。不得从历史CI artifact复制已签款项假造“真实本轮产生”。
4. **强制安全与父回归**：旧各模块分支/来源/DB门禁仍`FailClosed`；原PR150/162 Refund合法净额+请求后3A修正R1、旧PR146来源与新PR156不能混、两Backend同资金/同车竞争、一致锁序、至少三处错误注错原生Rollback、越权/撤权/Session/对象上下游失效、`refunded/completed/生产支付`硬拒。涉及161张父表/24迁移必须真签验证前后Seal/不同数据库OID（本次新运行独立取，不嫁接历史旧Run）。
5. **CI与证据**：专用工作流只触发本Issue变更（涵盖以上精确修改路径），严格解析原生TAP不允许`0/0`伪绿，旧 Run39514294355 仍只是拒绝测试历史点；所有本轮成功须是**本最终B SHA** GitHub原生Push Run/Job success，有完整真实PG16事务、业务正例及拒绝证据。
6. **一次交 A**：达 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A` 后统一中文交接；若证明在上述精确范围仍需改变F03/F05/F02旧身份、PDM或公共迁移，不得伪造成功。要么交 **一份** `BLOCKED_COMPOSITE_PARENT_AUTHORITY_DEPENDENCY`（原符号/函数/测试、确切无法跨越原因与最小建议），要么提出独立真实产品/真钱裁决。A再集中审核，不接受子任务每步都请求“继续”。
7. F06/F07/F08/V1当前继续`NOT_READY`，F07和F08是后续B独立工程阶段；F08经A正常验收后B后端整体终验归A。非生产本轮不会让客户/员工手机端获得真实支付能力。

## 五、确认非生产技术裁决，不伪称工程已通过

- 本次A裁决只扩大准确受控白名单、明确**唯一选定的Composite Issuer方案**。不能因为A批准就写`B_SELF_TESTED`或`A_ACCEPTED`。
- B当前已真正完成**38个合法拒绝和装配测试**；财务/交易完整链测试尚为`NOT_RUN`，需在同Issue164继续整改。
- **生效门槛**：该正式裁决及对应主线状态同步经A普通GitHub PR标准合并到`main`后生效；Issue164保持Open，B接续当前分支。
