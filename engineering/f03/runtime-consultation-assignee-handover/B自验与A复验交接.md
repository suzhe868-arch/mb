# F03-2-2J｜A-J-01 旧 I90 独立回归定向整改最新结论

> **A-J-01 已由B整改并在真实PG16 13/13首轮复测通过，交A复验须以最终文档提交HEAD同SHA 13/13成功CI为准。** 本节为最新唯一验收口径；下方原交接的“12/12也覆盖旧I90”属于已被A驳回的历史叙述，**不得再作为验收事实**。当前 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。

## 1. 来源、问题与限定授权

- A正式签发：`07_重建工作区/F03-2-2J_A主控独立复核旧I90表回归缺失定向整改单_2026-10-10.md`，状态`A_CHANGES_REQUESTED / NOT_ACCEPTED / NEXT_OWNER=B`。
- A确认初版J91自身27项测试、H/I/J三域锁与SLA保持均通过，但初版12项CI **根本没有运行旧I原模块完整27项集成测试的独立90表作业**；之前B声称已覆盖I90是不准确的。新J91内执行I迁移或部分H/I兼容用例不能替代旧I独立回归。
- 本轮仅在**现有分支**`feat/f03-consultation-assignee-handover-2j`修改 **本批新增专用工作流** `.github/workflows/f03-2-2j-consultation-assignee-handover.yml`，增加一个真正的`f03-2i-demand-responsible-handover-pg16`独立PG16 job，其他原12个job名称与测试命令全部保留。没有修改任何旧H/I源代码、旧测试、旧工作流、迁移000001～000010、PDM Final、生产接口或权限种子。
- I90 job完整复用经A签收旧I工作流的数据库初始化/封印/注错回滚/000009 apply-rollback-apply/合成fixture/原始I27项`node --test f03/runtime-demand-responsible-handover/tests/integration.test.mjs`/真实pg_dump/schema-only/全目录inventory/原始sha256归档检验步骤，只将旧I专用“首次归档推送”换成**冻结SOURCE存在性与归档核验（只读，不重推旧2I分支）**；权限收窄为`contents: read`。并提供**自己独立的I90 CI artifact**，不会使用J91的物理快照作I证据。
- 新I作业独立`postgres:16-alpine`官方容器镜像（ECR官方镜像分发）、专属全新非超级管理员PG16数据库`f03_auth_test`、合成F03-1员工会话；**只施加到000009**，全程不运行J的000010，所以I90的完整旧封印`verify`仍严格有效。

## 2. 首轮真实整改成功运行与两个独立证据流

- **整改工作流源码SHA**：`8a36d233c1a1801b2437e8569ceb383e7bbdb5c0`。独立真实PG16 [GitHub Actions run #37996442906](https://github.com/suzhe868-arch/mb/actions/runs/37996442906)：`completed / success / 13/13`，非模拟、非合并作业、无失败。
- **旧I独立90表 job**：`F03-2-2I FROZEN independent 90-table PG16 full 27 tests + archival source verification`，`success`，原I测试`27/27 PASS, 0 FAIL`。真实物理90表/560列/375约束/147索引、**1936目录对象**，结构SHA `1532f5b34379e5ec207d9a2b909a11322d0eb6755cc23d6dfc7a419ea6d13eb0`。I完整目录检查`F03_2I_EVIDENCE_FULL_CATALOG_PASS`和原始字节`F03_2I_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`均成功；原始归档SOURCE来源`37988363315`/SHA`b55aae85debd72d834de2943a95687b2eaa4564b`，冻结SQL源字节SHA256`557a741f23112c906456dacdb87baa63ff737aa4c3bc8d922dd1cab010047283`、inventory SHA256`70f04fcedfefcf500f58c4af4a0ff41a47214d2130a0f9d2115b195e89a369e4`。新运行pg_dump自带成对restrict随机键仅按既定规则归一，不放宽其它字节。
- **新J独立91表 job**：`F03-2-2J 90-to-91 PG16 Consultation protected one-table discovery`，`success`，J全量`27/27 PASS, 0 FAIL`。完整物理91表/572列/390约束/151索引、**1982目录对象**，只新增46个获批目录键、旧1936键一项未变，结构SHA`ef3bcd0c89c959225764d0853b203047116282c3bd6f976e41aff1cd7b95e735`。J目录检查`F03_2J_EVIDENCE_FULL_CATALOG_PASS`和`F03_2J_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`均成功；首次原始归档SOURCE运行`37994016455`/SHA`6c64aa5782dd87aa1bd018158bccce931a390bf0`，冻结inventory字节SHA256`59caa33c0ccc100c373eb1ba9722af3ff4d832b171a7443f1c9fb3417afc583e`。
- 两边分别产生独立GitHub Actions artifact：`f03-2-2i-real-pg16-90-demand-domain-immutable-receipt-evidence`与`f03-2-2j-real-pg16-91-consultation-assignee-sla-and-immutable-evidence`。没有生产数据、测试密码/会话凭证外泄。

## 3. 首轮运行 13 个原始作业名称及逐项结果

1. **F03-2-2G frozen 88-table SG06 preflight regression independent genuine PG16** — `success`
2. **F03-2-2B empty 82-table first-admin atomic bootstrap race** — `success`
3. **F03-2-2E frozen 88-table SG06 ledger regression on own PG16** — `success`
4. **F03-2-2H exact 89-table CI-only Customer Owner CAS/history/receipt on genuine PG16** — `success`
5. **F03-2-2J 90-to-91 PG16 Consultation protected one-table discovery** — `success`
6. **F03-2-2A sealed 81-table admin governance CI** — `success`
7. **F03-1 frozen HTTPS security - its OWN new PG16** — `success`
8. **F03-2-2C frozen 84-table authentic SG03 regression on own PG16** — `success`
9. **F03-2-2F frozen 88-table Team capability governance regression own PG16** — `success`
10. **F03-2-2B exact 82-table admin two-population / rollback / structure** — `success`
11. **F03-2-2D frozen 86-table Team Scope regression on own new PG16** — `success`
12. **F03-2-2I FROZEN independent 90-table PG16 full 27 tests + archival source verification** — `success`
13. **F03-1 frozen real security integration - its OWN new PG16** — `success`

## 4. 定向整改后的唯一验收条件和禁止事项

- A-J-01新增I90作业与J91作业及其它11个冻结旧作业总计13个，原I/J各27项独立全绿，源目录与字节均经PG16真实证据核验。
- **本报告是工作流成功首轮后的新增文档提交**，因此首轮`37996442906`的源码SHA不是报告的最终HEAD。B必须在报告提交后获取该**最新HEAD自己的**`completed/success` CI、13个jobs皆`success`、I27/27与J27/27且`run.head_sha`精确等于最终分支HEAD，才能正式交A；A应以该最终运行替代本节首轮作为同SHA签收凭证。
- 当前main由A维护、未合并本轮任何B代码；B不得自行PR合并、推进2K、触碰生产/客户/财务业务、修改旧001～010迁移或放宽权限。C/H01高保真和F03-2整体尚未通过，`PRODUCT_BASELINE=NOT_READY`。

**最终B归属：B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A（以前述最终同SHA 13/13、旧I27/27、新J27/27 全成功为门禁）。**

---

# 名邦汽车 V1｜F03-2-2J B自验与A复验交接

> 2026-10-10（Asia/Singapore）｜**B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A**；必须以本文件落库后的最新分支HEAD与同HEAD全部13/13新PG16 CI成功为最终签收条件。B不得自行PR合并main，不开启2K；完整F03-2与C/H01尚未验收，PRODUCT_BASELINE=NOT_READY。

## 1. Authority与施工范围

A正式单：`07_重建工作区/F03-2-2J_A主控SG06_Consultation咨询负责人单域移交与SLA保留完整施工单_2026-10-10.md`，2026-10-10 RELEASED_FOR_B。前置A验收PR17合并`9bc5e17be2153d4646816c808d6af77409513308`。指定B分支`feat/f03-consultation-assignee-handover-2j`，起点main `cb2bd91c77fcc384ffc66c68bd61044514d70d68`。

唯一实现边界是**专用CI全新非特权PG16与合成F03-1 PC员工会话**。J负责Consultation单域`prepare/commit/retry/read`、Consultation当前负责人CAS、完整不可变收据+审计历史、原始首响15分钟SLA不重置、H/I/J三域全局RequestKey一致性。没有新生产接口、无微信/JYT/飞书、无真实客户与正式商用权限种子。

## 2. 受控文件与安全最小例外

默认新增`engineering/f03/runtime-consultation-assignee-handover/**`，包含`000010.sql`、`000010.manifest.json`、`migration.mjs`、`runner.mjs`、`service.mjs`、`fixtures.mjs`、`tests/integration.test.mjs`、`evidence.mjs`、`evidence/SOURCE.md`和真实原始结构证据；专用新工作流`.github/workflows/f03-2-2j-consultation-assignee-handover.yml`。

**唯一旧文件修改**（在A正式施工单预授权内）：
- `engineering/f03/runtime-customer-owner-handover/service.mjs`：只在H单域`commit/retry`已存在的跨域请求Key入口追加`to_regclass`确认J表后的摘要反查；J新表存在时采用J的完整91表密封，旧89表直接H全封印、旧90表走I全封印。
- `engineering/f03/runtime-demand-responsible-handover/service.mjs`：I单域交接commit/retry入口按J表是否存在选择J91或旧I90完整封印；I的prepare/read/Priority派生读取仍严格沿用旧I90结构Guard；已有H摘要查重旁仅加J请求摘要反查。旧90表无J时全部原行为保持。

这两份旧文件的业务对象、旧角色+scope检查、原有receipt/audit和正式服务语义均未改。**旧000001～000009所有迁移、H/I测试、旧CI工作流、PDM Final及权限种子文件未修改**。共享SG06 advisory transaction lock 306/309保证H/I/J按原顺序串行，J另持有312专用锁，三方物理UNIQUE+双向冲突Guard保单意图。

## 3. J01-J10 合成PG16契约与实证

- J01：`000010`只新增Consultation append-only receipt表，完整版本/checksum/PG16身份/隔离Seal/目录密封、discover事务rollback、注错rollback、apply-verify、无收据时rollback后完整再apply。
- J02/J03：经理/店长独立`consultation.assignee.transfer`受控CI权限，不继承`employee.manage`、H或I能力；认证restricted/失活/无权账户拒绝；Team、store及精确scope和personal deny生效。Consultation pending/processing可转派，resolved/invalid、Customer失活、vehicle/listing_cycle失效、origin无效均拒绝。暂停接客操作者及接替员工不被错误当成手工转派失权；原负责人失活只认受控审批batch。
- J04：严格`consultations.assignee_employee_id`单列CAS；`source_relation`、`first_response_deadline`、`status`、`completed_at`、`close_reason`、Customer owner、Demand/Priority/Recommendation、Waitlist/Lock/Transaction、SG06 batch/item完全保留。audit+receipt同事务，五个故障点完整rollback，两个真实PC session并发只写一笔。
- J05：真实PG16 H→J、I→J、J→H、J→I、H→I、I→H全部双向原始Key跨域冲突拒绝；三域三参与者相同Key真实并发仅一笔成功，三个独立不同Key真实并发各自成功；同item+同Key幂等，换Key或跨item碰撞拒绝。
- J06：同一个Consultation在新batch/item合法7→4→5连续移交，两张不可变收据都依据原batch/item/audit及逐项前后链可审，原source失活不清除历史；无可信新收据的直接现任修改必拒绝；读取重新评估当前权限、scope和个人deny，不能泄露原咨询内容。
- J07：原有15分钟首响deadline只是原事实，任何转派不重置、不产生首响、不开新咨询；既有未终结唯一约束、Recommendation及隐藏车/价格权益独立。
- J08：新工作流共**13个真正隔离的PG16作业**：新J91、旧I90、旧H89、G/F/E88、D86、C84、B82双作业、A81及F03-1认证/HTTPS80；全部原测试、权限Guard不降级。
- J09：真实新91表全目录、旧90表全目录、pg_dump原始schema-only、version inventory及SHA256由首次成功的J job原样归档，不套用I旧结构字节。后续run以实际来源校验完整目录及restrict/unrestrict一对随机键规范化外的字节一致。
- J10：必须核实分支HEAD和最终GitHub Actions run.head_sha相等、13/13均completed/success且J 27个真实集成测试零失败。最终同SHA日志是本报告完成态的生效凭证。

## 4. 已取得的真实结构与首次通过证据

PG16真实discovery `37993373853`实际发出的`F03_2J_DISCOVERY_CANDIDATE`：`000010` SQL SHA256 `1ead4f8987aaa22e5f569b2e7da24eb496cb1d82b2aaee2db2b82df13271e297`；旧90表完整目录SHA `1532f5b34379e5ec207d9a2b909a11322d0eb6755cc23d6dfc7a419ea6d13eb0`。新91表/572列/390约束/151索引，完整目录SHA `ef3bcd0c89c959225764d0853b203047116282c3bd6f976e41aff1cd7b95e735`；旧1936目录项零修改、只新增46项批准键，新完整目录1982键。

首次全绿[GitHub Actions `37994016455`](https://github.com/suzhe868-arch/mb/actions/runs/37994016455)，代码SHA`6c64aa5782dd87aa1bd018158bccce931a390bf0`，12/12全部成功，J当时25/25；原始证据已由CI归档至本分支`evidence/`，`SOURCE.md`准确记录来源run/SHA。此后新增三域不同Key同时合法提交、人工转派接替人暂停接客及权限负例，**实测[GitHub Actions `37994196513`](https://github.com/suzhe868-arch/mb/actions/runs/37994196513)（SHA `9e0432b76a5c6200a30d62ecf69059a130d7a961`）12/12个独立真PG16作业全绿、J27/27、0失败**，完整目录及原字节跨run比对PASS。此后为A授权边界再次仅限I提交/重试缩小旧服务兼容入口，并补中文交接，**仍需本最终文档HEAD专属CI再全部13/13、I27/27、J27/27成功，旧run不冒充最终同SHA**。

## 5. 当前边界和A验收门禁

不触碰生产、真实外部请求、客户隐私、任何非Consultation域负责人或旧PG16目录对象；不能使Recommendation失效/重置、不能修改SLA、不能将单域收据当整个SG06 completed，不自动允许员工销号。C/H01和F03-2整体继续NOT_READY，A需独立代码+权限+PG16证据+旧H/I最小diff验收后才可走标准PR合并。

**交接：B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A（以前述最终同SHA13/13、I27/27、J27/27确认为准）。**
