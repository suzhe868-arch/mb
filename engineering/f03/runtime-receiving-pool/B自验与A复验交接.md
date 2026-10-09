# F03-2-2C｜B工程完整自验与A独立复验交接

**日期：2026-10-10｜状态：READY_FOR_A_REVIEW（须按本报告末尾的最终同SHA成功CI核验）｜NEXT_OWNER=A。**

## 一、来源、分支和权限边界

- GitHub：`suzhe868-arch/mb`。B工作分支：`feat/f03-receiving-pool-2c`，从最新已放行main `c76a26a9f71bb86776cfd02d13954d9a933ce343` 建立。不得合并main，A签发验收及正常PR归A负责。
- A完整施工单：`07_重建工作区/F03-2-2C_A主控接客资格与最后接客池完整施工单_2026-10-10.md`；以现行`A_B_C三窗口协作与验收规范.md`的一次施工完整闭环为执行方式。
- **唯一变更边界**：新增`engineering/f03/runtime-receiving-pool/**`和`.github/workflows/f03-2-2c-receiving-pool.yml`；冻结F02 000001/F03-1 000002/SG01 000003/SG05 000004、旧80/81/82物理Guard和既有服务代码保持原字节。
- 仅真实GitHub Actions新建一次性本机PG16非特权`f03_ci`、运行封印及纯合成员工/Admin。无生产库、正式注册、微信/JYT/飞书连接、客户数据或正式路由。

## 二、完成工程与冻结结构实证

1. **SG03资格事实**：新增`employee_receiving_eligibility(employee_id,eligible,version,decided_at,decided_by_system_admin_id)`，两条可信FK、主键和正版本约束；不存在资格行即拒绝，`receiving`字符串、角色或门店并不会自动授予资格。明确允许主角色字符串`sales/manager/store_head`，4S和System Admin不能进入员工接客池。经理/店长角色仅在本批合成fixture添加，不给既有业务数据自动补种。
2. **接客池事务序列化**：独立新增`receiving_pool_guards(guard_name,version)`单例`receiving_pool`，不同于SG05只允许`system_admin`的已冻结管理员守卫。F03-1真实正常会话按账号→会话锁序，随后所有SG03治理进入同一`FOR UPDATE`全池锁，再锁目标员工和资格，提交前重验active+eligible+receiving及合格角色；1→0的正常下线/撤资格全部拒绝。外部异常导致0池仅安全报告，恢复0→1允许。
3. **两个受限内部动作**：真实正常System Admin仅可对一个现有合法active员工设置`eligible=true/false`；Employee仅能以自身正常会话ON/OFF当前`receiving_status='receiving'/'paused'`，角色变更/非本人/伪Actor/4S/受限会话/缺资格/不明状态硬拒绝。经理/店长代理下属因SG02可信团队尚未施工而拒绝。
4. **原子审计**：合法实际状态改变、脱敏`audit_events`与单例`version+1`在同一真实PG16事务；重复同值无业务审计；四个阶段故障注入均证明任何变化回滚。使用跨Employee并发OFF/OFF、撤资格与OFF交错、ON/OFF交错真实事务竞态，未出现正常业务同时将最后合格接客数降为0。
5. **准确物理新增**：只追加`000005_employee_receiving_pool_eligibility`。原82表结构指纹`555ddc5bffa745014e68eab79fa83312c9b18ed06f484434fc5d76e2064336ea`，真实PG16追加后84表精确指纹`c90b94247b5ad1d8f4a9a63ffed94cab47d9ec147f0ad852329eb8cc4625d97a`，物理计数**84表、502列、314约束、129索引**；旧对象1697个全部定义不变，只新增经manifest固定的22个目录对象，新对象1719个。幂等apply、旧checksum/额外schema漂移拒绝、注入后旧Guard恢复、已用数据库rollback拒绝全部实测。

## 三、真实测试和最终CI门禁

- 2C新增真实PG16`tests/integration.test.mjs`覆盖S03-01～S03-08及历史迁移/命名空间负例，**11/11通过**；特别验证没有独立资格不能接客，两人竞态只允许安全提交，经理/店长合法资格参与，自身开关不代理他人，真实0池恢复不改客户owner。
- CI使用六个互相隔离、独立新建PG16的作业：**84表2C**、**82表SG05管理员人口回归**、**82表首次完整bootstrap回归**、**81表2A限定角色模板回归9/9**、**80表F03-1真实认证11/11**、**80表原HTTPS安全4/4**。旧守卫没有被修改以兼容84表。
- 原始结构归档于`engineering/f03/runtime-receiving-pool/evidence/`，包括`old-structure.json`、`new-structure.json`、`pg16_schema_only.sql`、`pg16_inventory.json`、`sha256sums.txt`和`SOURCE.md`。**真实来源CI 37959226368、来源SHA `343cf5223c018a7174fa665eafda00805e239397`**。同批最终CI独立重算原始字节SHA256、old/new结构对象一致和本次完整SQL；仅允许pg_dump成对随机restrict key的预期差异。
- 最终验收实证的 **B SHA 以GitHub本分支最终HEAD为准**；GitHub工作流`f03-2-2c-receiving-pool.yml`的最终运行必须为**同一SHA下全部六作业`completed/success`**。来源run是原始字节来源而非最终HEAD证据，不能混淆。

## 四、残余风险、明确未实现和下一负责人

- 本批合成CI内部安全操作不等于正式P04/PC/微信控制面、自然注册Owner分配、客户转移、Demand/Priority/Consultation/Lock/Transaction责任写入。外部失活使0池时，仅返回`empty=true`诊断；自动补分、队列告警、已有客户owner与`owner_assignment_pending`后续由F04/F05和SG06按独立施工单执行。
- 外部其它未纳入本批的Employee状态/门店/角色变更入口尚**不共享**新的SG03锁协议；不能据隔离CI宣称完整生产全系统并发不变量。经理/店长代理操作须待独立permission、scope和SG02团队权威成立。SG02、SG04、SG06～08、F04、生产/数据部署均DEFER_DENY。
- **`PRODUCT_BASELINE=NOT_READY`、`F03_2_ACCEPTED=NO`**。本交接仅为B提交A独立验收，不是A_ACCEPTED，不表示已合并main。

**STATUS=READY_FOR_A_REVIEW（以最新B HEAD的6/6同SHA成功CI为生效门槛）｜NEXT_OWNER=A｜NEXT_TASK=A独立检查文件边界、真实PG16日志、22对象结构差异、风险及最终同SHA实证；符合门禁后按标准PR合并main。**
