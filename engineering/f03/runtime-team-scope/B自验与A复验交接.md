# F03-2-2D｜B工程完整自验与A独立验收交接

> 日期：2026-10-10（新加坡时间）｜B分支：`feat/f03-team-scope-2d`｜**最终生效门禁：本分支最后HEAD同SHA七个独立PG16 CI作业全部success。** 核验前仅是B自验材料，不是A签发或合并凭证。

## 一、来源和安全范围

- A放行单：`07_重建工作区/F03-2-2D_A主控SG02团队关系与可信范围完整工程施工单_2026-10-10.md`；B基线main `99f00b7814a0fd8b44e21d2b1352c0b1ecdce16c`（含A已验收PR #11）。
- 仅新增`engineering/f03/runtime-team-scope/**`与`.github/workflows/f03-2-2d-team-scope.yml`；未改旧`000001～000005`的文件、manifest、守卫、旧CI或PDM/IA/Low-Fi。
- GitHub Actions为一次性非特权PG16 `f03_auth_test`、`f03_ci`，真实事务竞争使用完全合成员工及管理员。没有生产数据库/客户资料/正式HTTP/微信JYT飞书/业务写入。

## 二、实现结论（只限SG02内部证据）

1. **独立显式团队**：新`000006`只追加`teams`与`employee_team_memberships`两表。团队有真实Team ID/关联门店元数据、active/inactive与`membership_version`；成员关系有真实Employee ID、起始/终止时间与可信System Admin修改人，FK、时间CHECK及同team+employee单条OPEN部分唯一索引。版本随成员实际事务改变，历史成员区间不物理删除。同店、manager模板、created_by、客户owner均不能代替成员事实。合成角色仅在CI fixture设置。
2. **可信System Admin写入口**：`setTeamMembership`只允许正常、当前active、凭证enabled且独立System Admin身份；请求字段精确白名单。使用已验收F03-1账号→会话事务锁、统一`pg_advisory_xact_lock(20261010,306)`后对team/target/成员加锁；统一对同team+employee窗口重验。并发双Admin加入只产生一个真实修改；结束/重加保留历史且不产生重叠开放成员。实际修改、脱敏audit、`teams.membership_version+1`完全同事务，NO_OP没有成功审计，四点故障注入完整回滚。
3. **受限只读Team Scope证明**：`canManageTargetTeamScope`只核验原F03-1正常Employee会话 + DB当前manager主角色、active/有效登录 + 明确可追的当前`employee.manage`权限（个人deny高于allow/role default）+ 当前真实`employee_data_scopes.scope_kind='team'`/正确team_id + 同一permission_id的当前有效`employee_capability_scope_bindings` + 团队及门店active + manager与target各自真实当前有效membership + target合法角色和active。所有条件必须同时成立；只返回内部读证，不写SG03/员工/客户业务，不因经理身份或同店自动授权。缺scope、错误capability、过期scope、未来/结束成员、4S/Admin、伪造范围一律拒绝。
4. **原始结构封印**：冻结`000001→000006`完整版本和旧目录逐对象一致性，旧版84表/502列/314约束/129索引→**86表/513列/323约束/132索引**。原目录1719项不变，只追加42个已批准的精确目录键，总计1761；新版完整SHA `b5e4c698ffa648d5ab7af4d7e389c23a40eb080849a812e0fc50699b4687e572`，SQL SHA `77f22227c1e8bcec118c54b6f1b707c07c641307b51d10ade3ca392592a799af`。从旧84表注入后可回滚且旧Guard仍通过，新版本被使用后拒绝危险rollback，未知schema/历史checksum变更拒绝。
5. **审查故障边界**：真实PG16测试`tests/integration.test.mjs`九项9/9，包括D01结构/旧guard、D02可信Admin和身份篡改、D03同店/未来member、D04/D05精确permission/team scope、D06两种并发真实竞争、D07四点故障与NO_OP、D08失活/伪造/额外schema、D10历史版本篡改恢复。D09由七作业中旧80/81/82/84版本的独立新PG16回归提供。

## 三、原始证据及最终CI复验

- 真实原始结构来源成功运行：[37964222741](https://github.com/suzhe868-arch/mb/actions/runs/37964222741)，B来源SHA `d7e0a418e57981907dcea12b9bcd1777b0fb7d74`；`evidence/SOURCE.md`固定此来源。正式归档`old-structure.json`、`new-structure.json`、`pg16_schema_only.sql`、`pg16_inventory.json`和`sha256sums.txt`，均为CI原始字节，不含实际客户记录/密码。
- 后续每个同SHA CI均由**七个独立全新PG16数据库**执行：86表2D九测试；84表2C SG03真实11/11；82表2B治理10/10和首次bootstrap1/1；81表2A模板9/9；80表F03-1认证11/11和HTTPS4/4。旧Guard仍拒绝新物理结构，无所谓“兼容84/86”修改。
- 86表作业重算本轮`schema-only SQL`/inventory真实SHA256；旧/new全目录和inventory与归档逐字节对比，SQL只允许pg_dump一对随机`restrict/unrestrict`键差异。没有成功的**最新HEAD同SHA七作业**不得宣称B交接完成；严禁用来源运行的绿灯冒充最新HEAD。
- 本分支基于授权main的tree差异只应包含**新目录和一个专用工作流**。所有成功记录、结论和SHA以GitHub运行结果核对为准。

## 四、真实未完成范围

- 当前仅为SG02独立内部Team Scope证据、System Admin合成事务管理；**绝不等于已开放正式经理员工管理写权限、跨门店业务管理、默认manager权限、SG03经理代操作或SG07正式业务提交。** 对真实团队归属/员工治理的迁移、员工离职/调店/角色/权限及Customer Owner交接尚未施工；没有接入正式PC API。
- 原有`employee_data_scopes`和`employee_capability_scope_bindings`不改结构，读取证据不是业务权限授予。任何SG04/06/07/08、F04后续扩展，需独立A施工单和写事务提交时再次核实。
- `PRODUCT_BASELINE=NOT_READY`、`F03_2_ACCEPTED=NO`；C/H01独立视觉尚待审查。B不能代A签发`A_ACCEPTED`、不能自行合并main。

**交接终态：若最新HEAD同SHA七作业成功，则`STATUS=READY_FOR_A_REVIEW`，`NEXT_OWNER=A`。A按标准PR签收合并并更新main五项状态；B不合并。**
