# 名邦汽车 V1｜F03 工作包 G｜B 全包自验与 A 复验交接

> 工程包：G1 SG06 项目/批次正式安全收口、G2 计划停用/降权/调店、G3 突发失活/复职。签发依据：`07_重建工作区/F03工作包G_A主控SG06真实收口与F03-2-3员工治理完整施工单_2026-10-10.md`。
>
> 交接状态：**B_SELF_TESTED / READY_FOR_A_REVIEW（以本交接最终 HEAD 的 CI 20/20 success 为准）**。交 A 独立审查，**未经 A 验收不得合并 main**。仅非特权一次性 PG16 合成环境；正式员工业务、资金与线上服务仍不开放。

## 1. 工程范围与独立源码审查

- G 独立分支：`feat/f03-package-g-governance-closure`，基于已正式合并 2N 的 `main` 提交 `fb2aed9013452e2d3fff3689cca9f923626a712b`。
- 仅新建 `engineering/f03/runtime-governance-closure/**` 和独立 CI `.github/workflows/f03-package-g-governance-closure.yml`。已核对 PR diff 无其它历史工程目录/PDM Final/旧工作流修改；旧 H～N 服务、000001～000013 SQL 和历史权限模板没有改写。独立 P 包不作为依赖。
- `migration.mjs`/ `000014.sql`/manifest：只扩 `handover_items_status_check` 和 `handover_batches_status_check` 两个 CHECK，使其允许 `completed`。未改变原表字段、其余约束、触发器或权限。隔离 PG16 原结构：94表／608列／435约束／163索引／2120完整目录，原 SHA `7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659`；真实新结构只有以上两个定义变化且仍2120项，新SHA `863538a8dd81e85c8f50bec2d18ad714f6c3d87abf3b10844a3c80421d54cdb1`，SQL SHA `a07b5635ad887cd73905d3df64b25a5b77f187a04b83d38dcca9ccef64793c66`。
- `service.mjs`：在真实 PG16 且当前 F03-1 受控会话中，对六域收据与 Priority 同批 Demand 来源、操作人/Team范围/个人 deny、当前对象/账务状态重新证明，项目 CAS 完成 + 审计一事务提交；整批先查所有项目、异常资金/现有职责和不可变历史链，拒绝乐观放行。带有关键节点失败注入、同一请求幂等和跨域 RequestKey 碰撞防护；读/prepare不授予写 Token。
- `governance.mjs`：G2 的计划员工治理必须先有已完成的 SG06 批次及真实 item/原始 receipt/audit 链，并无遗留活跃客户责任/资金；经理权限不等于角色调整，店长范围受限，跨店调动由独立 System Admin 控制平面处理。撤权同时处理旧PC会话、credential epoch、数据 scope 与 Team membership。G3 突发 inactive 先撤权再交接；active 恢复不使旧会话/旧客户业务责任/旧permission/接客资格复活。
- 审查重点：所有授权依**当前服务端事实**，而不是请求里的角色/旧Token、2N只读结论或`handoverComplete`；重点检查前后双重事务验证、在途Refund、真实 Lock/Transaction 来源、Priority TTL、跨批次历史接续、并发唯一胜者，以及控权面 System Admin 不能变成员工业务角色。对证据无法覆盖之处保持拒绝或后续工程限制。

## 2. 原始真实数据库与测试证据

- **最终代码受检版本** `cdd55299392a29437c66acdf7732d49e56bc804d`。
- 与该版本一致的 GitHub Actions 运行 [#38021801214](https://github.com/suzhe868-arch/mb/actions/runs/38021801214)：`completed/success`，**20/20 独立真实 PostgreSQL 16 作业成功**，其中 G1 **15/15**、G2 **7/7**、G3 **4/4**。
- 旧版17项独立新库原样回归，包括 N94 21/21、M94 31/31、L93/K92各29/29、J91/I90各27/27以及其余原版H/G/F/E/D/C/B/A与F03-1身份/HTTPS80。G的三个独立新作业均先验证封印的M94和原始归档字节，再用旧H真实交接源形成不可变收据，才在新 000014 下测试 G1/G2/G3。
- 真实 PG16 物理发现源 [#38020114437](https://github.com/suzhe868-arch/mb/actions/runs/38020114437) 证明精确两项 CHECK 差异、表列约束索引数量全不变；本次最终 #38021801214 的 G1/G2/G3 原始作业日志均打印 `G_M94_THREE_ACTUAL_H_RECEIPTS_BEFORE_000014_PASS`、`G_000014_TWO_CHECK_FULL_CATALOG_PASS` 与 `F03_2N_ORIGINAL_FULL_CATALOG_AND_INVENTORY_BYTE_PASS`。
- 原始文件**存储位置**：本次真实 GitHub Actions #38021801214 的三个独立 `f03-package-g1/g2/g3-true-pg16-000014-physical-and-tests` 工件，分别含 G 子测试日志、`g1/g2/g3-full-catalog.json`、`g1/g2/g3-schema-only.sql`、`g1/g2/g3-sha256sums.txt`；同运行还保存原 M94/N 的 schema-only、inventory、完整 catalog 和旧17项隔离测试证据。按源 Run ID、Job、Artifact 固定，不将重新生成文件冒充原字节。GitHub Actions 工件按现有工作流保留期限为 **30天**；归档有效性及A复核下载须在到期前完成。

## 3. G1/G2/G3 权限、回滚与实测矩阵

| 单元 | 真正实测（成功与拒绝） | 残余交接 |
| --- | --- | --- |
| G1 | 原H收据合法完成单项与批次、幂等历史不重复；跨批次旧来源/非法角色/跨Team/请求Key冒用拒绝；CAS前/后、审计后、最终提交前故障完全回滚；owner 漂移、退款阻断、两名经理并发仅单人成功 | 真实生产调度及历史“无需再交接”复杂分类不得凭本包直接放行 |
| G2 | 未完成批次不能调店/降权/停用；已完成单据链允许计划停用、合法店长降权、System Admin 独立跨店操作；撤销旧凭据、历史Team/scope不恢复；经理或本人越权拒绝 | 真实员工系统启用/权限重授与CRM/F04接口仍未施工 |
| G3 | 突发inactive撤旧会话且SG06未完成项保留；普通员工复职拒绝；System Admin 复职不恢复旧session/Team/scope/接客；重复失活不能重复审计 | 真正异常接客池、外部通知/审批及端到端业务衔接仍待F04～F07 |

## 4. 数据保护和风险界限

1. 只承认隔离 PG16 中使用合成用户/车辆/合同的受控状态事务，不允许正式微信/PC对外API、支付、JYT、真实电话、正式员工离职或生产SQL变更。
2. 对客户/业务责任、Priority、财务保护以现行PDM及数据库当前事实为准；未有可信终态/来源时安全拒绝，不能通过外部补送“已完成”绕过。
3. 真实系统集成、复杂历史最终状态、人员离职真实审批权和断网重试，仍需 A 对本包逐项独立复核；A 若发现任何未授权状态或空白，按正式整改单在原分支整改。CI通过不等于生产或A已签收。
4. C/H01 高保真独立继续；F03整体、V1产品基线保持 `NOT_READY`；后续工作包 V 仅预规划，**未获A施工授权**。P包已在独立分支自验 19/19，G/P需集中交 A，分开独立评审与按依赖合并。

## 5. 交接门禁与负责人

- 本交接提交后 GitHub Actions 将产生**新的最终 HEAD 对应完整 20/20 CI**；只有其最终状态仍为 `completed/success` 且 `run.head_sha === 当前G分支HEAD` 才是最终 B 验收交付证据。本报告中 #38021801214 是提交报告之前的**功能最终代码受检来源**，不能替代交接提交后的同SHA验证。
- 验证通过后：**G = B_SELF_TESTED / READY_FOR_A_REVIEW**；P 同条件已通过；**NEXT_OWNER=A**。B 不自行合并 main、不开 V 工作包及生产流量。

## 六、A-G-01 首轮A退回：现时完整负责人链与计划员工治理二轮整改

A正式整改单：`07_重建工作区/F03多任务包G_P_A主控首次独立审查与两项定向整改清单_2026-10-10.md`。前轮20/20 CI及000014真实封印保持原样，但原`governance.mjs batchAuditProven`仅查起始批次的immutable收据/audit、未核对**业务对象当下真负责人和全部后继因果链**，因此A判定`A_CHANGES_REQUESTED`。

### 已整改的不可缩减安全事实

- 新`service.mjs::verifyLiveHandoverChain`严格只读、在G2当前事务内执行：根据原批`item.object_kind/object_id`重取Customer/Demand/Consultation/Waitlist/Lock/Transaction物理对象，调用原已受检`proof()`，其逐张验证Domain receipt的真实batch、item、source、dest、customer、actor、历史Team/RequestKey、原审计before/after/time、前后交接连续性及**完整最后合法收据的to必须等于此刻对象实际owner/responsible**。既不能用原批目标负责人硬判终态，也不能在有人无审计直接更新当前responsible后继续放行。
- Priority仍**无独立交接收据**，要求当前active/TTL未过期、来源match有效、客户/车辆/挂牌周期全同、同批真正Demand item/receipt原source/目标/Team一致，且触发Demand通过连续的原始+后续收据链并证明当前负责人active；过期或无权威历史证据必须拒绝。
- G2原`batchAuditProven`保留全部原审计和历史完整性保护，并额外对每个已completed item调用`verifyLiveHandoverChain`。计划停用、计划降权和System Admin计划调店在任何员工状态、credentials、session、scope发生变更**之前**必验，完成写入/追加人员审计之后及`before_commit`检查点**再次验**，若对象漂移则**抛异常ROLLBACK整事务**，绝不返回一个已经有副作用的DENY。历史事实不可证时 fail closed。
- 各当前业务对象使用PG行锁`FOR SHARE`，各关联客户行锁`FOR UPDATE`，确保与另一PG16会话争用当前负责人、有效财务Customer FK和Priority来源对象时按真实锁次序串行化或超时回滚。现存`lock_timeout`、SG06 advisory及最终审计门禁保留。
- 突发inactive是防风险紧急撤权，不被误改成必须先完成所有交接的计划动作；复职不自动恢复旧会话、顾客归属、权限、Team、接客资格。**没有**修改旧000001～000014 SQL/manifest、冻结旧H～N服务、旧CI或PDM产品规则，也未跨用P分支。

### 新增与保留的真实合成PG16自验

- G-01-a 合法原H收据及已完成batch仍能计划性停用76、店长降权77、System Admin调店78。
- G-01-b 原source已无承责，但人为把当前Customer owner改给没有下一笔收据的第三人，三种治理都拒绝，员工账号/会话与组织快照不变。
- G-01-c 在原M94数据库结构下，通过**已验收的原H业务服务**为Customer37602形成顺序真实`77→4→6`双收据+原历史/audit，后续G已完成第一个批次后仍可证明当下负责人6合法，计划降权不因原批目标4而误拒。
- G-01-d 当前Team capability结束、已转出原source的Customer仍有在途Refund时均阻断计划停用；Priority派生完整当前Demand链、有效match、TTL等已有严格helper守卫，无法证明则拒绝。
- G-01-e 在人员治理证据核查与正式提交之间，以**独立第二PG16会话**更新锁定客户遇到真实lock_timeout；同一事务内注入最终COMMIT前客户负责人漂移，验证完整旧账号/员工/组织/审计/当前owner回滚。计划员工治理与控制平面调店两条路径均已加入此门禁。
- 原G1/G2/G3全部测试与17个旧独立模块的结构封印/原始Source/真正非特权PG16完整回归必须继续保持。

**二轮最终门禁**：此报告落库也产生分支新HEAD。只有对应新HEAD的最新GitHub Actions **20/20独立真实PG16 Job `completed/success`**、新`000014`两CHECK/2120目录封印无delta及全部原始旧证据PASS，才能再宣布`B_SELF_TESTED / READY_FOR_A_REVIEW`，同时P独立分支也要19/19同SHA成功后一次性交A。此前20/20 Run38022820421仅是A首轮受检证据，不得用来代替本整改最终版本证明。F03整体及V1基线依旧`NOT_READY`，B不得合并或启动V。
