# 名邦汽车 V1｜F06 Issue #171｜真实新分支 Composite 签名根五文件最小授权｜A 主控正式技术裁决补充单

> 日期：2026-10-21
> 责任：A主控作签名来源互斥裁决，B按原任务继续工程施工
> 核查基线：`main@9ae3bd49fcef58b0f9e560fce0a2700ac7b5b923`
> 当前B分支：`feat/f06-nonprod-composite-lock-lifecycle-01`，B阻断报告SHA `13b9cc580b0907d743414707d353d4b96f1ca39b`
> 工作单：`F06_NONPROD_COMPOSITE_LOCK_LIFECYCLE_INTEGRATION_01`，Issue [#171](https://github.com/suzhe868-arch/mb/issues/171)
> **裁决状态：`A_RULING_APPROVED_ISSUE171_EXACT_DUAL_REAL_PUSH_PROVENANCE_B_CONTINUE`；只有此补充单合并至main后生效。不是B工程自验通过，不代表F06全阶段完成。**

## 一、A独立核实的真实阻断（不仅两文件）

B没有提交可验业务交付；只有[中文阻断报告](https://github.com/suzhe868-arch/mb/blob/feat/f06-nonprod-composite-lock-lifecycle-01/engineering/f06/nonprod-composite-lock-lifecycle/B正式可信签名分支阻断与A最小裁决申请_2026-10-21.md)，没有本Issue业务新测试/官方CI/原生工件。A逐文件核查：

1. `engineering/f06/nonprod-single-runtime-integration/可信Composite签名根.mjs` 将`expectedBranch`固定为`feat/f06-nonprod-single-runtime-trusted-source-01`（Issue164），对真实`GITHUB_REF/GITHUB_REF_NAME`逐值硬校验，且`git rev-parse HEAD === GITHUB_SHA`。Issue171新分支天然无法通过，不准伪造或更改实际环境。
2. `engineering/f06/nonprod-single-runtime-integration/composite-issuer.mjs`再次调用上述门禁，计算含Lifecycle Service/Composite Runtime等的`SOURCE_FILES`不可变哈希，写入并验证`source_sha256/head_sha/run_id/github_ref/database_oid`的本次原生PG签名Attestation。新服务代码一旦改动，必须在**新最终SHA、本次真实Push、当前物理PG16**合法重新签发，不能复用Issue164旧SHA/Run/来源。
3. **额外实际门禁**：同目录的`composite-issuer.sql`在`f06_composite_v1.attestation.github_ref`的数据库CHECK中只允许旧Issue164分支。仅修1、2也不能让新分支真实插入签名。**本文件是Issue164的私有Composite sidecar，不是可编辑的旧公共DDL/资金侧车；此次仅此一处条件可添加一个确切新值**。
4. **原生证据链额外门禁**：`核对同Ref上游签名PG16.sh`开头及`父表161迁移24跨OID封印.mjs`的环境检查都强制旧Issue164 GitHub Ref。它们负责真实父24签名迁移、F05与F06原父侧车、161父表COUNT/MD5/独立物理OID，不能伪造Ref或复用旧Run的封印。其新分支校验也须作同一精确受控扩展，不能忽略B后续验收必需的原生证据。
5. `engineering/src/f06-nonprod-composite-runtime.mjs`也仅认旧分支；但它已经列于原Issue171有限白名单，允许仅新来源/生命周期接线必要的最小模式适配，不是新增解冻路径。
6. `.github/workflows/f06-nonprod-single-runtime-onejob.yml`原工作流只触发Issue164旧分支，应继续只读冻结；Issue171必须使用自己已授权的唯一新工作流，不得靠修改旧CI触发冒充原结果。
7. `composite-issuer.sql`还限制旧`issued_events.event_kind`集合；本次Lock Lifecycle的新增签名动作不得未经授权改写旧事件语义。**优先**在Issue171已授权新目录建立专有、可销毁、不可变Lifecycle Event/Key/Attestation私有侧车，和现有`f06_composite_v1.attestation`同事务校验。不能仅以新`public.audit_events`代表可信Lifecycle Issuer。

## 二、唯一批准方案：两条精确真实GitHub来源路径、同一个已验Composite资金核心

**不是创建任意用户可传Issuer，不是豁免验证。** 可在以下两条**精确**GitHub分支之间，根据**真实GitHub Push环境+本地检出的HEAD**选择不同的受控非生产来源profile，其他任何值强拒：

- `ISSUE164_COMPOSITE_NONPROD_V1`：`refs/heads/feat/f06-nonprod-single-runtime-trusted-source-01`（旧真实Push，原历史检查及可读来源严格保留）。
- `ISSUE171_COMPOSITE_LOCK_LIFECYCLE_NONPROD_V2`：`refs/heads/feat/f06-nonprod-composite-lock-lifecycle-01`（新真实Push，只能在本任务专用CI/loopback/可销毁单PG16/本SHA使用）。
- **profile是内部代码选择标签**，不得从HTTP、cookie、header、JWT自述、任意环境`TRUSTED=true`或自由字符串分支传入，不能将两者复用为生产Issuer。原`COMPOSITE_NONPROD_SIGNED_V1`签名schema/seal及原资金核心如果继续复用，则Attestation的`github_ref`必须绑定**实际**profile对应的分支，并与本次SHA/RunID、源码摘要、PG物理OID、24签名迁移/父Attestation一并强等值；不要篡改原签名号称旧Run授权新Run。

### 五个冻结文件的**精确新增路径 + 限定用途**

| 文件 | 本次新授权允许的唯一必要修改 | 永久禁止 |
|---|---|---|
| `engineering/f06/nonprod-single-runtime-integration/可信Composite签名根.mjs` | 增加两个确切分支的内部profile判定；`GITHUB_REF`、`GITHUB_REF_NAME`相符，真实`GITHUB_EVENT_NAME=push`、仓库/CI/test/loopback/数据库确认、`git rev-parse HEAD===GITHUB_SHA`、RunID保持原强规则，老profile不弱化；输出只读已验profile | 任意分支、手工改GH环境、忽略SHA、跳过Issuer/父签/PG权限 |
| `engineering/f06/nonprod-single-runtime-integration/composite-issuer.mjs` | 将上述两个**真实profile**绑定到本SHA、本Run、物理DB OID、同一完整签名迁移+父hash；现有SOURCE_FILES强绑定全部源码，不得削弱；新profile所需新增私有Lifecycle安全源码应增量签入哈希，并保持旧profile原SRC文件列表不缺项；不得用旧签名授予新SHA | 删除/减少已有`SOURCE_FILES`、绕过`verifyCompositeAttestation`、让客户端指定profile、复制历史已签事件或账户金额 |
| `engineering/f06/nonprod-single-runtime-integration/composite-issuer.sql` | 仅允许在**私有Composite Attestation 的 `github_ref` CHECK**增加Issue171**这一条确切**`refs/heads/feat/f06-nonprod-composite-lock-lifecycle-01`，旧分支继续保留；原V1 schema/Key/Event/Trigger/数据类型原样签封。新增Lifecycle事件优先在Issue171新目录新独立不可变私有sidecar实现 | 禁止修改公共DDL、任何旧资金sidecar.sql、旧Event/Key/Attestation定义、现有Event kind或放开正则泛化任意分支 |
| `engineering/f06/nonprod-single-runtime-integration/核对同Ref上游签名PG16.sh` | 仅将入口的旧单分支等值检查变为上述两条确切合法Push分支，**仍要检验Git HEAD/GH SHA、真实Push**及执行前后`GITHUB_REF/GITHUB_REF_NAME`恒定。原F05/24迁移/父签/PR139/150/153/156初始化原语不变 | 脚本中`export GITHUB_REF`伪造旧分支、跳过上游真实签名、修改F05/旧父代码、借此扩权启动无关旧CI |
| `engineering/f06/nonprod-single-runtime-integration/父表161迁移24跨OID封印.mjs` | 仅将现行环境分支检查限缩改成同样两条确切Push分支；保留161表全量COUNT/MD5、24迁移、跨三真实不同OID、前后证据SHA/RunID与表差异清单及FailClosed全套原生算法。新Issue171 CI必须生成**自己末SHA/RunID**原生Seal与工件 | 跳过全表/OID、改允许变更父表集合、重用Issue164归档文件、改变Seal算法、误认旧Run为本次成功 |

**新增文件外的边界不变**：原Issue171获准的`engineering/f06/nonprod-composite-lock-lifecycle/**`、唯一`.github/workflows/f06-nonprod-composite-lock-lifecycle-onejob.yml`以及已指定少数`engineering/src/f06-*.mjs`仍保持原用途授权；两份清单并集才是本单合法白名单。所有其它`engineering/f06/**`旧服务/SQL、旧workflow、旧公共迁移、F02/F03/F05业务源、PDM/IA、生产/真钱、C PR68继续只读。B若发现**其他确切冻结文件**不可合法跨过，必须报告新的精确阻断而非推定取得整目录写入权。

## 三、B同Issue同分支一次完成；不因本次裁决重建任务

- 使用**原Issue171和原分支**`feat/f06-nonprod-composite-lock-lifecycle-01`，**保留**B开工SHA `13b9cc580b0907d743414707d353d4b96f1ca39b`及其报告，安全同步本治理PR真实合并后的最新main，禁止强推/另开平行任务。
- 先以少量原生profile边界测试证明旧Issue164 profile只认其旧branch；新Issue171 profile只认其新branch；其他Ref/非Push、GH SHA与git HEAD不一致、RunID不合法、错误OID、改动签名源码、父迁移hash变化、取消权限、伪造身份，都必须强拒。**不强制在新分支伪造旧GITHUB_REF去运行原老分支的成功E2E**；对旧profile的可测契约做纯拒绝/选择测试，历史42/42+32/32+6/6、Legacy审计1/1保留历史有效结论，但新变更对其依赖需相应关联回归。
- 完成本Issue已正式批准的单Runtime普通无资金Lock`extend/release/cancel/expireOrdinary`、受控F03员工/Scope与客户/当前Lock权限、真实签名私有Lifecycle事件、幂等及原子性，PG时钟到期、Priority锁和真正资金存在时硬拒。不能以旧`synthetic_absence_confirmed`充新单库财务真相。**所有路径仍仅127.0.0.1/可销毁PG16/非超级用户。**
- 官方本分支最终Push SHA原生新PG16/HTTP **至少16项新增真实执行测试**，0失败0跳过，涵盖跨Backend、注错rollback/资金来源/签名与会话拒绝；定向旧Legacy生命周期与Issue164已验新Composite安全回归；每批`git diff --check`、全部改动JS`node --check`及Shell`bash -n`，范围路径+用途双门禁；新本Run 161父表/24迁移独立3OID Seal及有效Artifact；完成整包才`READY_FOR_A_REVIEW`。
- 如果合法新来源确实接不到冻结父依赖，集中一份`BLOCKED_F06_COMPOSITE_LIFECYCLE_SIGNED_SOURCE_GAP`具体源码/函数/证据报告交A，不将缺签强拒冒充正例成功。
- **F06/F07/F08/V1一律继续NOT_READY**。禁止真实收付款、退款到账`refunded`、成交`completed`、生产Issuer/上线或启动F07/F08；F08完成正常A验收后后端全项目终验仍由A另行进行。

## 四、生效及交接

本裁决只有通过A治理PR合并入最新`main`才生效；B在原Issue171继续不必询问用户日常批准，A不替B做业务实施。当前应为`NEXT_OWNER=B`、`NEXT_TASK=F06_NONPROD_COMPOSITE_LOCK_LIFECYCLE_INTEGRATION_01`、`NEXT_ISSUE=171`、`NEXT_BRANCH=feat/f06-nonprod-composite-lock-lifecycle-01`。本单授权可控扩展五个文件**并不证明B任何新业务/CI已成功**。
