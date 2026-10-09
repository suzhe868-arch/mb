# F03-2-1B｜逐能力客户范围的独立 81 表真实 Guard

仅限A于2026-10-09正式批准的SG01增量：一张五列绑定表、旧scope复合UNIQUE和批准的PK/FK/CHECK/索引。旧80表F02/F03-1迁移、Runner、Guard一字不改。基点 main `e6d7787829e04c0b150e0ff98748a4b52a40881a`，分支 `feat/f03-runtime-scope`。

`migration.mjs`、`000003.manifest.json`、`readiness.mjs`：新版本必须额外的完整81表物理指纹、追加版本行/校验和/run-seal；当前旧80表Guard在新库应拒绝。只对CI一次性新库用新迁移/回退。**不修改旧80表结构或数据**。

`customer-phone-guard.mjs`：限定`customer.phone.manage`对具体`customers.customer_id`的内部判定，仅通过已验收`IsolatedAuth.withSession(...,{normalOnly:true})`的可信服务端登录和会话锁；在同一短事务内**单条SQL语句快照**读取主体、权限、个人覆盖、绑定的每项能力scope、客户状态。只有当前名邦员工+有效能力+本人有效object scope+当前active客户全部满足，内部返回`allowed:true`；4S、系统管理员、其他操作、缺范围、假owner/同店/team/global、历史权限皆拒绝。没有电话业务更新，也不返回任何电话字段。可信target只接收校验过的BigInt字符串；不接收客户端actor。

本批不声明写提交TOCTOU保护，撤权/结束scope/客户失活被新独立请求看见，不保证已在执行中的判定可被撤回。没有真实电话字段修改、业务接口、正式server路由、治理日志/审计、已批准以外任何SG02～08结构。F03_2_1B_ACCEPTED=NO，F03_2_ACCEPTED=NO，PRODUCT_BASELINE=NOT_READY。
