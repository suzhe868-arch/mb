# 名邦汽车 V1｜F03-2-2I B工程完整自验与A独立复核交接

> **日期：2026-10-10（新加坡）** ｜**B_SELF_TESTED / READY_FOR_A_REVIEW（以本报告所在最终HEAD同SHA CI 12/12 success为生效门禁）**｜**NEXT_OWNER=A**｜**PRODUCT_BASELINE=NOT_READY**。
>
> 本文件只对本批隔离 PostgreSQL 16（PG16）合成演练负责。B 未创建/合并正式PR，未修改主分支，也未接触生产数据库、真实客户或第三方系统。A必须核验本文件所在最终分支SHA及对应最新全部成功CI，不得直接把早期源码/取证运行当作末次同SHA CI。

## 一、授权来源、分支与受检版本

- 仓库 `suzhe868-arch/mb`，A正式施工单 `07_重建工作区/F03-2-2I_A主控SG06_Demand负责人单域移交与Priority派生责任完整施工单_2026-10-10.md`。
- 分支 `feat/f03-demand-responsible-handover-2i`；真实建支起点 main `76878f3bdc2d255390ada72d82f31fe8d25cb939`（已合并2H PR #16）。本报告及最终SHA只以实时分支引用为准，禁止把这里的历史B功能源码提交当作最终交接SHA。
- 冻结依据：PDM-02/03/11/13 Final，现行 A/B/C 协作规范，以及已验收 2E/2F/2G/2H。
- 授权新增仅 `engineering/f03/runtime-demand-responsible-handover/**` 和 `.github/workflows/f03-2-2i-demand-responsible-handover.yml`。逐路径与main比较：全部为 **added**；原main代码、产品Authority、000001～000008迁移、旧Guard、CI工作流均无修改/删除。

## 二、实施事实（本批真正完成的最小Domain）

1. `prepareDemandResponsibleHandover` 只读，使用真实当前受控合成PC会话，核实SG06可信batch/item、精确Demand对象/Customer、原负责人、待接替人、当前精确Team/Store许可和对象状态。只有 `active` / `paused` 可走正式交接；`completed` / `cancelled` / 对象关系不全直接DENY；无可重放提交令牌。
2. `commitDemandResponsibleHandover` 以本批CI **独立合成注册** `demand.responsible.transfer` 许可、个人拒绝优先、合法当前角色与Team/store绑定、当前Team成员资格和Customer对象范围执行。没有借 `employee.manage`、`customer.owner.transfer` 或职位名升权。经理精确显式跨店Team正例和同店无绑定负例真实通过；店长只在本店合法授权范围。操作人暂停接客不自动撤权；正式已有Demand人工交接承接人可与自然注册轮询的接客开关分层。
3. 单PG事务真实 `SELECT ... FOR UPDATE` 加同SG06旧治理锁与本域锁、Demand负责人旧值CAS，只修改 `public.demands.responsible_employee_id`。同事务写真实员工操作者的 `audit_events` 和一张不可变Demand逐项收据。所有注错点产生整体rollback，无半条历史。
4. `readDemandResponsibleHandoverReceipt` 和 `retryDemandResponsibleHandover`：同item/同Key/同意图幂等只返先前收据；异Key、异item、异batch、异Customer撞键拒绝。收据具有物理UNIQUE(item)、全表UNIQUE(key SHA256)、UNIQUE(audit)、外键和UPDATE/DELETE禁止触发器；读取同时校对旧可信待办、当前Demand、来源与关联审计语义，单靠FK齐全的伪造收据被DENY。
5. `readPriorityDerivedResponsibility` 严格只读检查Priority→trigger Demand→当前合法responsible与Customer/Match及TTL；合法 active/current Match 推导当前负责人，ended/到期、paused或完成Demand、失效Match等只返回重验/保守拒绝；Priority行、创建人/TTL、Recommendation/Match、其它六类负责人一律不变。**不把任何单域收据写成整个SG06已完成**。

## 三、真实数据库物理迁移与原始证明

| 项目 | 已批准冻结000008后 | 本批000009后 |
|---|---|---|
| PG16业务表 | 89 | **90** |
| 列 | 548 | **560** |
| 约束 | 360 | **375** |
| 索引 | 143 | **147** |
| 完整目录定义键 | 1890 | **1936（授权新增46）** |
| 结构指纹SHA256 | `2ffb014e044173837b1a2ce081e518e68b9e723cf440a08c063779c4db9ac0ac` | `1532f5b34379e5ec207d9a2b909a11322d0eb6755cc23d6dfc7a419ea6d13eb0` |

- 新 `000009.sql` SHA256：`9df7e45b338add71cc05aace8d9a42d6e6664bd5ae0c0bf980d2f11ab6cc797b`。只有一张新不可变收据表及其约束/索引/触发器，不改旧89张表的任何目录定义。
- 新模块 `migration.mjs` 必须核实一次性新库非特权身份、旧000001～000008真实版本及物理封印后才准apply；支持事务内真实discover并rollback、注错回滚、正式apply→verify→无使用收据时rollback→旧89 Guard验证→重新apply。旧89表Guard面对90表仍严格拒绝。
- 首次来源 **真实PG16成功CI [#37988363315](https://github.com/suzhe868-arch/mb/actions/runs/37988363315)**，`source_commit_sha=b55aae85debd72d834de2943a95687b2eaa4564b`，已由GitHub Actions自动提交到本B分支 `evidence/`：`SOURCE.md`、`old-structure.json`、`new-structure.json`、`pg16_inventory.json`、`pg16_schema_only.sql`、`sha256sums.txt`。
- 归档源原始结构 SQL SHA256 `557a741f23112c906456dacdb87baa63ff737aa4c3bc8d922dd1cab010047283`；库存原始SHA256 `70f04fcedfefcf500f58c4af4a0ff41a47214d2130a0f9d2115b195e89a369e4`。后续同版本run真实对比通过 `F03_2I_EVIDENCE_FULL_CATALOG_PASS` 与 `F03_2I_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`；仅Pg_dump成对的原生restrict/unrestrict随机保护标记受控归一，不改其余SQL字节。旧1890个目录定义键逐个完全不变，新增46键全部在manifest白名单。

## 四、最新真实执行矩阵（交接前独立验证）

- 增强后的源代码受检 SHA `68a61284c584d778fb1ec2878d5817b8333ec635`；对应真实[PG16 CI #37988987626](https://github.com/suzhe868-arch/mb/actions/runs/37988987626)：**12/12独立作业成功**、本批 **21/21** 新PG16集成测试成功、失败0。
- 新I专用PG16：90表迁移与旧封印、manager/store_head/4S/SystemAdmin/普通销售/受限会话、个人deny/旧登录态/即时失活/角色变动/Team权限撤销、显式跨店正例/越界负例、暂停接客、来源sudden_inactive合法受控交接、active和paused/终结状态、Customer owner独立、Priority实时推导及到期/ended/Match无效、全局同Key跨item/batch/Customer并发冲突、同域2会话单胜幂等、不可变审计/伪造收据拒绝、五个事务故障注入及快照、原始结构与证据均实测。
- 其余11个作业各自真正建立**全新隔离非特权PG16**并成功：F03-2-2H（89表）、2G/2F/2E（各88表）、2D（86表）、2C（84表）、2B治理+首次引导双作业（各82表）、2A（81表）、F03-1认证与HTTPS安全（各80表）。**不是仅在新90表上对旧测试放宽Guard。**
- 本报告提交后GitHub将对**最终报告HEAD**再运行全部12作业；**只有最终run.head_sha与报告所在实际HEAD完全一致、completed/success且每个job success，才生效顶部的`READY_FOR_A_REVIEW`**。历史source run、先前源码run都不能取代末次同SHA验证。A独立验收时应复核真实最新run_id。

## 五、严格禁止及仍未实施的业务范围

- 只执行**合成PG16中的Demand当前负责人单域**，不新增实际生产角色默认权限、不触碰业务/生产库、不开放正式PC/员工端HTTP接口。无真实用户交接、外部第三方系统调用、正式线上资金/权限操作。
- 不更改Customer Owner与来源，不能动Recommendation创建人/可见权、Consultation/Waitlist/Lock/Transaction、任何Match/Priority业务事实。Priority当前负责人的读取派生不是Priority续租、结束、重仲裁或责任转移适配器。
- 只做已批准Demand逐项成功收据；旧`handover_batches/items`继续pending/retry，不写completed、不宣称SG06整体完成，不可据本收据批准员工调店、停用、离职降权。未来其它Domain受控提交与真实系统权限映射必须单独A门禁。历次成功收据不可删除/回滚。
- 保守DENY策略：未获正式当前Team/store范围、无法证明Demand-客户-Trigger Priority一致、客户或员工失活、超范围跨店、未知业务状态等均不放行。新的H以外未来业务Domain请求Key全局映射需要后续适配器另行验证，不将本单域模拟系统冒称完整多Domain上线。
- **F03-2整体与C/H01高保真尚未最终验收，产品基线持续`NOT_READY`。**

**B交接结论：本批授权工程、自验、结构和来源归档已完成；最后以本报告HEAD同SHA 12作业全部success作为最终可交A条件。A下一轮独立验收并决定标准PR合并；B不自行合并、不启动2J。**

`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`
