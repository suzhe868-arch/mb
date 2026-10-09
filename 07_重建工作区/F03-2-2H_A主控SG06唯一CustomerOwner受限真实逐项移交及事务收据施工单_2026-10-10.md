# F03-2-2H｜A主控正式施工单：SG06唯一Customer Owner受限逐项真实移交与事务收据

> 2026-10-10（Asia/Singapore）｜**A_TECH_ADJUDICATED / RELEASED_FOR_B / B_NOT_STARTED**。
> B指定分支：`feat/f03-customer-owner-handover-2h`，**从执行时最新main**创建，已存在则先核对SHA并沿用、不得重置；B施工自测全部闭环后`READY_FOR_A_REVIEW`交A；B不得自行合并main。无需用户逐项确认。

## 一、唯一产品Authority和本次范围

- 冻结：PDM-02 Final §§4、7、9（真实identity+permission+data scope+object state；账户/角色/团队即时撤权及硬性禁止）、PDM-03 Final §§1、11～14（Customer唯一正式current owner；source/历史分离；不能自动修改其它Demand/Priority/Consultation/Waitlist/Lock/Transaction负责人；有正式业务资格的经理/店长且权限和范围覆盖才能改owner；交接必须保留历史并支持部分失败/幂等）；适用PDM-13、15、18、19相应生命周期规则但**不授权这些域写**。
- 已验收先决：F03-2-2E PR13 SG06 pending-only账本、2F PR14 SG04 Team个人/能力当前事实、2G PR15 SG06严格只读跨域预检；最后main合并PR15 SHA `b405e83cfadf9f0f6d89ada32ae2f45b5b20a6bd`。不得修改旧模块/旧迁移/旧CI的合法Guard来规避新测试。
- 本批只实施**Customer current_owner_employee_id这一个域**的完整合成隔离PG16敏感受控提交适配器、原子owner历史和独立不可变逐项收据模型。**不得执行其它七域负责人迁移、不能声称整个Handover Batch完成、不能将System Admin授权等同实际员工业务写**。
- 实现时必须先独立核查已有`permissions`注册及当前PDM产品边界。**必须存在正式区别于`employee.manage`的敏感Customer Owner移交能力（本批CI合成fixture可用示例命名`customer.owner.transfer`），不允许通过manager角色、现有employee.manage或读预检替代。此命名仅是本批合成技术能力验证，不直接固定生产permission默认种子/角色权限；如与正式产品权限映射冲突，停在fail-closed并在A交接列明，不能静默向旧真实表灌生产权限。**
- 工程仅授权新增 `engineering/f03/runtime-customer-owner-handover/**` 和独立 `.github/workflows/f03-2-2h-customer-owner-handover.yml`。可提出本批专用新迁移`000008`，**最多新增一张不可变逐项交接收据表**且必须由该新模块内隔离执行/回滚/校验；不可改000001～000007旧迁移、旧checksum、旧业务表原字段或旧约束。CI必须独立证明旧88表/536列/344约束/138索引的原始SHA不变，并对新增完整catalog delta/外键/幂等键/不可变性做明确A审核。若一张新表无法满足原子幂等，应审查证明并保守拒绝，不得弱化收据设计或偷改旧表。

## 二、B必须实现的四项受限函数

1. **`prepareCustomerOwnerHandover`（只读+原始账本核实）**：接收固定已存在SG06 batch_id、其唯一合法Customer item_id、当前source与recipient，精确确认batch发起经理当前有效受控会话、经理合法管理source的团队、当前Customer的`current_owner_employee_id=source`与`owner_assignment_state='assigned'`、目标employee当前active+eligible+receiving+合法Team归属及唯一性。只返回时点报告，不签发任何可复用提交令牌；源突发inactive且合法Team范围仍可证明则允许检查但**不给来源失效员工操作权限**。其它关联域存在时保留逐项待交接，不得错误抹除。
2. **`commitCustomerOwnerHandover`（隔离PG16合成权限写）**：只允许当前真实非restricted manager/store_head员工PC会话、当前**独立Customer owner写permission**（个人deny优先，精确scope，绝不靠employee.manage借权）、合法current customer/source/recipient/Team及2E待办item。单PG16事务按受控锁序重新查`account+PC session → 权限/显式scope → batch/item → Customer行 → source/recipient`，并发争抢必须CAS确保单一owner。只更改`customers.current_owner_employee_id`，并在同事务新增原有`customer_owner_history`不可变事实、`audit_events`带当前员工actor及原/新owner、及单域不可变交接收据。历史`change_reason`不强迫用户输入，允许来自有据batch reason和合成技术上下文；不允许隐式修改source/referral/原始归因、任何其它业务负责人、Priority TTL、客户等级及权限。
3. **`readCustomerOwnerHandoverReceipt`（只读合法收据）**：只允许当前合法经理在已授权客户/Team范围读取指定batch/item的最小不可变单域事实；固定旧owner、新owner、时间、角色/审计关联和单次幂等Key哈希，不泄露手机号、财务/密码等数据。需区分“Customer本域已转移”与“其它Demand/Priority等仍有待办”；不得回写或声明`handover_batches`、`handover_items`已`completed`，该旧账本没有正式成功态。
4. **`retryCustomerOwnerHandover`（幂等与部分失败）**：对同一`item_id + client_request_key`同参数重试返回先前受保护单域收据且不再产生history/audit/owner写；同Key不同to/source/batch必须`COLLISION_DENY`，不同Key重复已成功交接不得新增事件；多个真正Admin/manager并发只能一个客户Owner转移成功，其他安全NOOP或冲突拒绝，不能形成重复历史。对已是新owner但没有真实收据的脏数据不得据此“补造已完成收据”。

## 三、真实性、业务和完整性门禁（必须全部通过）

- H01：**不触碰生产、老数据库、真实客户**。所有写仅GitHub Actions的全新本机非特权`f03_ci` PostgreSQL16、真实F03-1受控PC会话及合成fixture；旧000001～000007封印和物理88表在新增前精确一致（SHA `96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd`）。000008若启用，仅追加已批准的收据表及严格迁移元数据，不篡改或弱化旧结构守卫。
- H02：独立当前Customer敏感写permission不能被`employee.manage`、默认经理、System Admin、4S、普通销售、失活/旧session、过期Team、个人deny、缺当前scope、跨店同名/伪造来源绕过。店长本店合法能力亦仅按真事实授权（不能把已实现经理Team proof误冒充店长写权限）。
- H03：一个客户只有一个当前Owner；`CAS`与FOR UPDATE防竞争，目标必须合法；原始来源/转介绍及已有其它Domain负责人不变。历史至少before/after/actor/time/batch/item/key摘要可核验；行级写、审计、收据在一个事务内，共同回滚。
- H04：单域收据append-only、重复Key严格幂等与冲突碰撞、不能因失败重写已成功收据或删除成功历史；注错点覆盖before_owner_update/after_owner_update/after_history/after_receipt/after_audit/before_commit，并对两manager并发、失败后重新执行做真实PG16数据快照比对。
- H05：已有2G影响清单指出的Demand/Priority/Recommendation/Consultation/Waitlist/Lock/Transaction**全部不得自动改变**，由后续域专门适配器处理。优先级TTL不中断、不重置。Owner单域成功不放行调店/停用/降权，更不放行全SG06`completed`。
- H06：明确记录无法覆盖的Customer/域、权限和scope失效、未验收域收据，按`DEFER_DENY`处理；删除/篡改迁移、额外schema、伪造audit/receipt、未授权业务表写等均DENY。收据的确切物理约束、SQL对象、catalog SHA、迁移前后数量列入测试覆盖TSV与B交接。
- H07：历史F03-1认证/HTTPS、2A、2B双工作流、2C、2D、2E、2F、2G冻结独立各自原表数/原结构Guard**全绿**；本批自己的PG16在000008新结构上有独立专用严格`--verify`，不得强迫旧工作流接受新89表或改变旧Guard。
- H08：专用工作流须上传数据库原始pg_dump schema-only、新旧完整物理目录定义、版本inventory、checksums和SOURCE中run+SHA，末次同SHA成功CI重新核验源结构字节（pg_dump restrict随机标记成对归一时必须解释）与授权新迁移delta，数据敏感性审计，不传真实客户值。
- H09：A独立代码、分支diff与证据复验；仅两个新目录add、旧文件未修改、严格新PG16可验、CI run head_sha=分支最新HEAD、每个job success、B中文交接说明失效情形与未授权边界，才允许`READY_FOR_A_REVIEW`。

## 四、禁止恢复与交接

**不可**把`employee.manage`或SG04控制平面权限当作Owner提交写权限；不可允许System Admin充当当前owner；不可通过对2E pending-only账本写`completed`来假造跨域成功；不可整体回滚已成功的独立Owner域收据来“修补”其他域失败；不可让旧登录态跨越即时撤权；不可修改旧80～88表guard或原SQL迁移；不可提前开放PC/员工端业务路由、生产/微信/JYT/飞书。

B应在此严格受限技术施工单范围内一次性完整实施、修正所有测试失败、归档结构和交接材料。若发现正式权限能力或收据物理结构冲突，先保守停在可验证安全态并在B交接向A提出唯一技术冲突，不得擅改产品Final。A独立验收后才可能PR合并；**F03-2整体/H01视觉/产品基线仍未验收，`PRODUCT_BASELINE=NOT_READY`**。

**NEXT_OWNER=B；NEXT_TASK=F03-2-2H_SG06_SYNTHETIC_CUSTOMER_OWNER_SINGLE_DOMAIN_TRANSACTION_RECEIPT_PG16_READY_FOR_A。**
