# F03-2-1B｜逐能力客户范围的独立 81 表真实 Guard

仅限A于2026-10-09正式批准的SG01增量：一张五列绑定表、旧scope复合UNIQUE和批准的PK/FK/CHECK/索引。旧80表F02/F03-1迁移、Runner、Guard一字不改。基点 main `e6d7787829e04c0b150e0ff98748a4b52a40881a`，分支 `feat/f03-runtime-scope`。

`migration.mjs`、`000003.manifest.json`、`readiness.mjs`：新版本必须额外的完整81表物理指纹、追加版本行/校验和/run-seal；当前旧80表Guard在新库应拒绝。只对CI一次性新库用新迁移/回退。**不修改旧80表结构或数据**。

`customer-phone-guard.mjs`：限定`customer.phone.manage`对具体`customers.customer_id`的内部判定，仅通过已验收`IsolatedAuth.withSession(...,{normalOnly:true})`的可信服务端登录和会话锁；在同一短事务内**单条SQL语句快照**读取主体、权限、个人覆盖、绑定的每项能力scope、客户状态。只有当前名邦员工+有效能力+本人有效object scope+当前active客户全部满足，内部返回`allowed:true`；4S、系统管理员、其他操作、缺范围、假owner/同店/team/global、历史权限皆拒绝。没有电话业务更新，也不返回任何电话字段。可信target只接收校验过的BigInt字符串；不接收客户端actor。

本批不声明写提交TOCTOU保护，撤权/结束scope/客户失活被新独立请求看见，不保证已在执行中的判定可被撤回。没有真实电话字段修改、业务接口、正式server路由、治理日志/审计、已批准以外任何SG02～08结构。F03_2_1B_ACCEPTED=NO，F03_2_ACCEPTED=NO，PRODUCT_BASELINE=NOT_READY。

## A首轮复验整改 2026-10-09（R1／R2／R3／E1）

仅本批`runtime-scope`+独立CI工作流修改，旧代码与完整Final Authority保持。R1完整000001/2/3版本共享门禁与R2非public schema隔离均在所有verify/apply/rollback重验；R3精确CHECK/FK/PK、非空rollback及真实重新登录HTTPS越界/伪身份拒绝，测试文件参见`测试覆盖表.tsv`。E1从原成功CI37901077203通过GitHub Actions官方artifact恢复**原始字节**，归档`evidence/`包含完整old/new目录JSON、原始SQL、inventory、原始sha256sums及SOURCE.md，在当前CI对源和本次数据各自做真实SHA复算并全文比对。归档发生的自动提交只允许B分支，**归档后的新HEAD必须再次跑自身同SHA成功CI，不能拿源run代替**。

`A首轮R1-R2-R3-E1整改闭合表.tsv`列出A阻断、B修复、定向正反测试、残余风险和待A签状态。受限内部动作仍只有`customer.phone.manage`，无实际电话编辑、无业务接口、无额外物理表/范围，F03_2_1B_ACCEPTED=NO。
