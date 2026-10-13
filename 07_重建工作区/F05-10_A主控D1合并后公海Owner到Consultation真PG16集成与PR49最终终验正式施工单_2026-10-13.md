# 名邦汽车 V1｜F05-10 Final Integration 完整施工单：已验收D1合法公海Owner形成 → PDM15 Consultation真实创建（PR49原分支）

> **A正式放行：F05_10_D1_A_ACCEPTED_MERGED_PR50 / F05_10_FINAL_INTEGRATION_A_RELEASED_FOR_B / NEXT_OWNER=B / PR49_OPEN_NOT_MERGED / V1_NOT_READY。2026-10-13。**
>
> 本单在已批准PDM Final/隔离工程路线与持续技术授权范围内，无新产品权益、权限或资金决策。B工程唯一责任，从最新main与本完整单启动，连做完全部已授范围后才交A。**合入main的PR50不是PR49最终验收替代品**。

## 1. 唯一仓库、分支、依赖与产品Authority

- GitHub：suzhe868-arch/mb。A已按标准PR合并D1：PR [#50](https://github.com/suzhe868-arch/mb/pull/50) 已merged，B D1 HEAD `3edf40b7cda1ddf8cb4ca340f0fb33dfc0b0d50a`，实际D1合并SHA **9c9e73d5eaa8ab9aa15a45ba1be38b39d1dc7403**。开始B施工以**实际最新main**为准，不以本单旧SHA替代最新正式状态。D1只提供隔离CI Owner真正调用来源，生产Issuer仍SOURCE_GAP。
- B唯一目标原Pull Request [#49](https://github.com/suzhe868-arch/mb/pull/49)，保留原分支 **feat/f05-10-consultation-assignee-sla**，原已验收可执行部分HEAD `d280a37ef6337156ecc2301bbea7f1383d7d82e5`，该旧SHA下10Push/72真PG/Source30/HTTPS7/8 Artifact历史有效，但无合法D1跨域调用，**不能直接合并**。B必须将**最新正式main的已验收D1**安全纳入当前PR49工作基础（正常fetch/merge/rebase且不强推覆盖他人修改；遇保护冲突按当前权限合法路径处理），在本批CI-only白名单补集成；不要从PR50拷贝代码或重写Owner状态机。
- 严格现行PDM-15 Final §§3/4/10/11/12/13/14/17/19/23（Consultation）、PDM-17 Final §§4/7/8/9/10/13/14/17/18/19（公海合法形成Owner）、PDM-02/03 Final（身份、资格、当前范围）、PDM-13/14 Final（Priority、Recommendation、Grant）以及已验收R01–R04 A第三轮报告、PR50 A二轮正式验收报告。读取 README/CURRENT_PROJECT_STATE/NEXT_ACTION/PROJECT_STATE.json/Decision Register和现行A/B/C协作规范；不许更改Final。

## 2. 唯一白名单 / 强隔离 / 数据目录衔接

- **B可直接修改的F05-10本批白名单**：`engineering/f05/consultation-assignee-sla/**`、已有新增`.github/workflows/f05-10-*.yml`，但已合入main的`f05-10-d1-*.yml`属于**冻结D1**，不得借通配白名单修改D1 Workflow。正常将新main已签文件合入PR49属于引入**原生不变依赖**而非修改；在最终PR差异中不得出现F03/F04/F05-1～9、D1、旧Workflows、旧迁移或生产Issuer的任何实际修改。避免回写PR50已合并内容。
- PostgreSQL 16 全新可销毁、真实非超级用户、独立两个物理Backend时序、隔离合成账号与真实签名/Scope；不得连生产、真实微信/手机号、客户隐私、JYT、电话、飞书、资金。沿用原F05-10 v26隔离迁移和签名M94→v25→v26 Ledger/Catalog Seal、错误注入ROLLBACK。D1以独立`d1_owner_ci` CI-only sidecar保存合成公海合法来源，不占v26编号。
- **重要真实兼容限制（需B正面验证并只作本批CI最窄修正）**：已签D1`migration.mjs`的`signed()/verify()`按**v25 ledger（23项）**验证，F05-10`migration.mjs`在apply v26后要求**v26 ledger（24项）**；D1`connect()`允许仅`d1_owner_ci`额外Schema。要用**同一个真PG16 DB**，应优先在签名M94→v25完成后部署D1侧表并调用真正D1`claimCI/assignCI/serviceAssignCI`，固化真实owner source/历史/receipt，然后继续在**同库**应用F05-10 v26并创建Consultation；在v26前先验D1独立seal，v26后再验原先已签Ledger/catalog和既存D1 receipt/Owner/历史未被污染。只有确需在v26后发起D1时，才可在**本F05-10 CI范围内**规划保守适配与真PG证明，不得修改已验收D1签名Migration、伪造Ledger或改旧数据。现有F03/旧PG16环境若拒绝额外sidecar Schema，明确来源/实证后再做最小独立CI适配，不能直接关掉隔离门禁。

## 3. 必须实际跑通的正反例（真实D1 Service，不造Owner假字段）

1. **公海未领取前 fail-closed**：使用D1已签可调用CI合成Pool Cycle/来源与M94真Customer，当前owner=null / owner_assignment_state非assigned：PDM15正式Employee/Customer对象状态Guard拒绝建立负责Consultation，Consultation计数、Event、Lock、Price、Grant和Owner历史不因“尝试咨询”改变；普通Share、历史recommendation、未经签发Customer或旧actor不能暗中形成owner。
2. **合法Sales claim→Consultation创建**：在同一可丢弃PG16物理库中用当前独立Employee签名/Permission/Capability/Scope调用实际D1 `claimCI`，观察`current_owner_employee_id`由null→合法owner且`owner_assignment_state=assigned`，D1真实OwnerHistory、Audit、D1 immutable receipt形成；随后使用**真实F05-10 CI Service**由合法Customer/对象入口创建或复用`pending` Consultation，`assignee`按PDM15正式Recommendation→Demand→Owner→接客规则选择，direct source固定。不能仅SQL改Owner然后断言fake green。
3. **合法Manager指定分配→Consultation**：D1真实`assignCI`使用当前同Store/Team有显式Scope的业务Employee、目标active/eligible，形成唯一Owner及不可变claim/assignment历史后再由F05-10 Service建Consultation。当前非法System Admin/4S/无权Manager/对象越Scope/受保护Customer应在D1阶段拒绝，Consultation仍0；不能绕过D1直接承接。
4. **客户主动服务前置/全池无人**：使用D1真实CI签名`syntheticServiceRequest`（身份来源必须标合成，绝不对接真实微信/手机号）与`serviceAssignCI`；有效当下合格接客池能形成唯一Owner再触发Consultation；第一个不合格而第二个合格必须成功；全部合格人不存在→`owner_assignment_pending`、不建responsible=null Consultation，不伪造SystemAdmin owner，真实时间/来源/事件清晰。
5. **锁与交错并发、资格撤销**：至少两个独立PG Backend/PID/COMMIT在D1同Customer claim/assign与非法重复Consultation尝试、当前员工撤权/Owner状态变化/账户disabled或Priority保护竞争时验证唯一winner、权限fail closed、旧历史不清空、锁/交易/Grant等跨域事实没有意外写入。不能用同一Client、JS延时模拟代替物理PG race；若因CI Service边界采用串行分阶段D1→v26时序，须说明该物理前置同步点及所验证和未覆盖的竞争。
6. **跨域完整生命周期不变性**：保留原PR49已过Source30/HTTPS7、R01失效Pending、R02权限拒绝与责任递补、R03 DND/Hold/SLA并发及R04 Priority隔离、creat→touch→handover→close/invalid 9独立业务域count+全行hash。新增owner变更属D1独立合法写入，Consultation创建本身不得反向改变已经分配的Owner/receipt、Recommendation/Grant/Priority/PriceRight/Lock/Transaction/Demand；基线快照必须在合法owner形成之后取得，避免把D1 Owner本来应发生的合法写入误判为Consultation污染。源Customer终态、后补/share、Vehicle offline/hidden 仍拒绝越界。

## 4. 最终验证、GitHub CI结构与提交证据

- B**不得削弱任何既有已验收72 Job / Source30 / HTTPS7**。新Source必须有**超过30的真正独立PG16用例**，实际覆盖owner-null拒绝、D1 claim/assign/service独立合法Owner形成后成功、SystemAdmin/4S/个人deny/跨域scope负例、并发/保全与旧状态的双重责任分层。PG16 Source日志直接列出完整服务调用结果、当前Customer owner、D1 receipt以及最终Consultation ID和原生两个PID，不能以重命名测试/仅返回伪造值通过。
- 现行GitHub `f05-10-d1-*` Workflow的push分支过滤明确只指向**D1工程分支**；PR49原`f05-10-*` Workflow的push指向PR49分支。B检查真正Github push事件/Job ID、H52官方`jobs?per_page=100`全52、与PR49最终唯一HEAD完全相同，最终 **至少10组Push完整成功/≥72个独立非特权PG16 Job全部 success（0 fail/skip/pending）**，不得以PR事件凑数或用D1旧SHA原生证据冒充。D1独立70冻结回归已合入main，但PR49仍必须重新获取末次SHA的完整70旧Job与新F05-10 Source/HTTPS两Job的真实成功。
- **至少8份**PR49新最终SHA的GitHub真正Push、非空/未过期、带官方SHA256 Digest原生Artifact（F05-8旧4、F05-9旧2、F05-10新2），以及F05-10 v26 rollback、M94→v25→v26 Ledger/catalog seal、D1 CI Sidecar原始source/Owner receipt/Policy version哈希、成功/拒绝/撤权物理历史、Schema证据。旧 PR49 HEAD `d280a37...`及D1合入HEAD `3edf40b...`的成功CI是历史，不替代新HEAD测试。
- 提交完整`engineering/f05/consultation-assignee-sla/B自验与A交接.md`的实际唯一最后SHA对应中文交接（如改变文件产生新SHA，必须重新运行CI/更新PR最终正文而非使用旧SHA证据），PR49正文写清所有新实测用例/Run/Job/Artifact/current schema与显式SOURCE_GAP；写`F05_10_B_SELF_TESTED / READY_FOR_A_FINAL_INDEPENDENT_REVIEW / NEXT_OWNER=A`。B不得自合并PR49、不得改main、不得私自启动F06。

## 5. 退出与唯一下一责任

- **现在NEXT_OWNER=B，NEXT_TASK=F05_10_PR49_FINAL_INTEGRATION_AFTER_D1_MERGE**。一次性开发/物理两PG/完整回归/自审/归档后交A正式最终验收；有权限或真实环境阻断，在自己可解决的CI边界内先合法修复，确有不可移除已签来源限制才如实`BLOCKED_SOURCE`并附原生证据，绝不降业务门禁冒充通过。
- D1已作为**非生产CI独立Owner来源**被A验收合并；PR49未验收未合并，F05/C-H01/V1均`NOT_READY`，F06/真实微信、手机号、JYT、内部价格、电话/飞书、资金、线上迁移和UAT仍未正式放行。不能把完成D1/PR49 CI就称为完整V1已上线。
