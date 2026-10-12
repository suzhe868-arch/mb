# F05-8｜A主控三轮独立验收：同SHA 68/68 真PG16 全绿，但 Priority 交接权威责任与对象Scope失配（2026-10-12）

> **正式裁决**：`F05_8_A_THIRD_REVIEW_CHANGES_REQUESTED_B_REWORK / PR47_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。
>
> 本轮A根据B新实际提交独立查看最新main、PR47、同SHA GitHub Actions及原生Job日志，并针对前轮R05～R07补做PDM-13 Final §24/25/26/31的**源代码反向安全审查**。工程成功门禁全部认可；以下两项属于已用户批准的产品事实与员工权限边界，不是新增规则，不得以CI全绿替代。

## 一、唯一最新受验工程身份及已通过项目

- GitHub仓库：`suzhe868-arch/mb`，正式main在本轮审核起点：`6eee6d97f0b6fa16f48d4e08572443d57f77200e`。B指定分支`feat/f05-8-priority-arbitration-ttl-handover`，PR [#47](https://github.com/suzhe868-arch/mb/pull/47)，本轮唯一受验HEAD：`8b46d25be418160bee08dffa878c425485f88ffa`。PR仍Open/未合并；相对main为ahead48/behind12、23个**全新增、且均在原F05-8唯一白名单**的文件，没有更改旧签F03/F04/F05-1～7、PDM、旧迁移或历史CI。B PR正文最上方仍自报 `B_REWORK_R05_R07_CI_IN_PROGRESS`，缺该最终SHA的最新正式`READY_FOR_A_RE_RE_REVIEW`交接；但A不因此跳过实际已成功的工程证据。
- 八份真正GitHub官方Push工作流 **均同本HEAD且completed/success**：冻结H52 run `38212636374` **52/52**（attempt2），冻结I2 `38212636372`、J2 `38212636299`、K2 `38212636403`、F05-4 `38212636380`、F05-5 `38212636389`、F05-6 `38212636376`各**2/2**，本批F05-8 `38212636369` **4/4**；A直查H52官方jobs with `per_page=100`确为52个，而非首30条。合计**68/68独立PG16作业success、0skip/fail**，不拼接任何旧SHA。
- A直读真实Job日志：新Priority Source Job `114690047713` **34/34**、Priority HTTPS Job `114690047578` **10/10**；前批F05-7兼容Source `114690047869` **28/28**、HTTPS `114690047774` **7/7**。真PG独立Backend竞争PID263/271、SQLSTATE **55P03**，后续R07双PGVehicle锁等待PID272、同一Priority且TTL不扩展；可抛弃v24注错回滚 `F05_8_V24_REAL_PG16_INJECTION_ROLLBACK_PASS`；v24 SQL checksum `dd30a8cd31a6bccd3dd038b0b756a2c18359f413956539b1cb13185caa3a4b4c`，结构catalog SHA以本次同HEAD原生 `F05_8_V24_VERIFIED`日志为准。
- 同最新HEAD四份官方非空未过期、具有SHA256 digest的原生Artifacts：Priority HTTPS `11730350811` 112089B；兼容HTTPS `11730225983` 99437B；兼容Source `11729847696` 109018B；Priority Source `11729553952` 118796B，全部本HEAD的run `38212636369`产出。旧64冻结的七个新增workflow依旧在合法F05-8范围内，原签工作流未修改，原生日志保留。
- 二轮R05已见真实PG16 事件恢复范围查询与无active重新仲裁、R06已见Transaction/Lock退出重仲裁及不复活旧lease、R07已见源COMMIT自动建立Handover行、失效期间保护、同一TTL、两个真实PG后端锁竞态及不可变尝试；**这些既有工程成果保留，整改仅补下述未防护的业务身份和对象范围，不推倒原68Job**。
- 额外`pull_request`触发的旧F05-7分支专属审计失败，按首次A书面兼容裁决仍不计入8个指定Push Workflow的合同，绝不因本单删除历史Workflow、也不得借此掩饰真实业务问题。

## 二、第三轮仍未闭环的两项已批准PDM规则与确定性代码事实

### A-F05-8-R08：交接完成后Priority responsible与trigger Demand真实current responsible分离，且无受信签发链

**正式Authority**：`07_重建工作区/PDM-13_最终完整规则.md` §24规定“Priority current responsible 跟随 trigger Demand 当前合法 responsible employee”，§25规定合法新负责人接手当前业务责任、保留original历史，§26规定新负责人只接原剩余TTL；§31要求Identity＋Permission＋Scope＋Object state。不得用Priority自身临时手写负责人代替真正受信Demand/责任来源。

**实际代码/反例**：
- `engineering/f05/priority-arbitration-ttl-handover/service.mjs` 中`retryHandoverCI()`约第318～326行，校验目标员工active和`f05_8_responsible_authorized_ci(targetEmployeeId)`之后，只运行`UPDATE public.f05_8_priority_ci SET responsible_employee_id=$2`，**没有验证、完成或消费已经签名的Demand current responsible handover**，也不保证 `targetEmployeeId === demands.responsible_employee_id`。
- 新`000024_priority_ci.sql`之`f05_8_handover_source_valid_ci()`第245～250行仍认定Customer current owner等于**原**Demand responsible，只校验Trigger Demand/source签名合法，不验证新 `f05_8_priority_ci.responsible_employee_id`与其一致。后续`f05_8_reconcile_scope_ci()`第298～310行在已完成Handover时直接`RETURN`，刻意绕过按真实Demand responsible重绑定，造成持久的业务责任双源。
- 新`tests/source.test.mjs` `8-R07 Employee invalidation ...`第365～415行：造独立目标Employee **8997501**，在未更改客户current_owner或签名Demand current responsible事实的情况下，仅`retryHandoverCI(target)`改Priority负责人并断言成功；之后又断言显式`arb()`也应保留这种背离。真PG16 **34/34绿灯恰好证明此无受信来源的转移被当前用例放过**，不是证明PDM-13 §24通过。
- `priorityProjectionCI()`返回的`employeeWorkVisible`依据Priority自身负责人授权，进一步可能把本无签名Demand责任来源的对象操作机会赋予target。该风险不是“历史source旧负责人可以展示”之类文案差异，而是现时控制权不一致。

**B一次性修复/真PG要求**：Priority的completed handover须绑定已经存在并核实的**合法当前trigger Demand责任转移事实**，或明确在原已批准F03-2 Demand handover合同中完成可追溯合法转移后消费它；未获取受信新responsible及有效current Match/权益前，不能仅凭目标员工active权限将Priority责任赋予任意人。保持合法Pending Batch、失效员工即刻deny及剩余TTL、合法handover在旧Match失效时fail-closed/重签，而不是改旧F05-7或生产Authority来硬凑测试。新增真实PG16正反例：无真实Demand交接的Target即使权限合法也不得完成/不可见；合法签名Demand交接后当前Priority负责人与trigger Demand current responsible严格一致，Customer owner不可被Priority独自暗改，历史original preserved，后续source事件/仲裁不回退、TTL不延期，两PG争抢无越权。

### A-F05-8-R09：目标Employee目标对象的Team/Store/Data-Scope未被核验，存在跨作用域接管

**正式Authority**：PDM-13 Final §31员工操作服从当前`identity + permission + data scope + object state`；PDM-02通用业务对象范围不可用“员工在别处有某项能力”代替此次Customer、Demand、Vehicle和所属团队的范围权。

**实际代码/反例**：
- `000024_priority_ci.sql`的`f05_8_responsible_authorized_ci(eid BIGINT)`第266～285行只判断员工是否active且**存在任意一组**`matching.rule.manage.ci.synthetic`、Team/Store、Scope未过期；函数**没有**接受待交接Priority、trigger Demand、teamId或object scope参数，因此对一个只管理另一个团队/门店的Employee也可能返回true。
- `retryHandoverCI()`第319～323行只以`targetEmployeeId`调用上述全局型布尔函数。调用者的`session(teamId)`本身约束的是**发起操作的actor**，不会把目标对象scope传递给`target`。当前34条Source没有“target在其他门店/团队但在本次业务对象无Scope”的真实反例。
- 因R08完成后可把目标写进Priority负责字段，R09可进而扩展为跨scope的Priority对象操作暴露。新目标不能因自身别处有独立能力就接管任意Customer与Vehicle。

**B一次性修复/真PG要求**：以真实`trigger Demand / Customer owner / team-store`关系和目标员工当前合法权限与数据范围的交集判定Target对象接任资格，检查个人deny/Scope撤销与现场并发；只允许本次业务范围内的合法Target完成，越范围Target完成必须fail-closed且0写入Priority责任、Handover completed、审计成功记录。新增同一PG16两位员工不同team/store的正反例及权限撤权交错，必须校验成功日志、数据库行/事件和后续visibility Guard；不扩大普通销售全局管理权、不借4S权限跨业务域。

## 三、正式处理和退出门禁

1. **本轮A不签`A_ACCEPTED`，不合并PR #47**。R05～R07已取得独立工程证据，但R08/R09违反明确PDM13§24/25/31，不得因68/68全绿跳过。B第三轮最新HEAD `8b46d25...` 的旧绿灯不能充当下一提交门禁。
2. 唯一下一责任窗口**B**，仍在指定`feat/f05-8-priority-arbitration-ttl-handover`分支，**只修改已放行F05-8独立新增白名单**并一次性整改R08～R09，复核对R01～R07影响。若签名Demand/Owner current来源缺必要合法issuer或本白名单确实不能在CI-only里完成受信交接，需明示`BLOCKED_SOURCE_OR_SCOPE`和缺口，不能自行修改旧签F03/F05-7源迁移或伪造生产权。此为已签Authority实现缺口，原则上无需用户作新产品裁决。
3. B更新中文完整自验、PR最后实际HEAD状态`READY_FOR_A_RE_RE_RE_REVIEW / NEXT_OWNER=A`、全部新的**8个官方push run与最新SHA一致，68/68真正PG16 Jobs success，零skip/fail/pending**、四份新官方同SHA原生非空未过期Artifact、原封原64冻结Job和旧F05-7 28/7、Priority原34条Source及10 HTTPS不得删弱、旧账/v24校验、真实两PG PID/SQLSTATE、新R08/R09可信权限/范围反例原生日志，一次交A独立复验。B不得自行合并main或启动F05-9/F06。
4. A验收通过后才标准PR合并并更新五项main权威文件/签发下一批。生产真实微信手机号、Priority Issuer、JYT电话图片、数字价、资金UAT等仍`SOURCE_GAP`；F05、C-H01、V1总体`NOT_READY`，本批只是可抛弃PG16 CI工程合同。
