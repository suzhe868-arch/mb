# F03-2-2A｜System Admin限定角色模板启用 / 真实原子审计

仅实现 A 已单次放行的 `sales × customer.phone.manage → enabled=true` 内部治理事务。复用原F03-1 `IsolatedAuth.withSession`正常已登录System Admin及旧账号→会话锁，复用1B已验收PG16 81表结构Guard。角色行`FOR UPDATE`覆盖模板行缺失时并发插入，现有值false更新true/不存在插入true/已true NO_OP，只有真实状态改变时才同TX追加不可变`role_default_permission_history`与`audit_events`。无正式路由、没有电话字段修改、没有新DDL、其它角色能力和false/降权皆拒绝。

只允许 CI 全新一次性PG16及合成员工/客户/独立Admin。部署、已有库、业务库、微信/JYT、完整System Admin治理/账号停用/接客/调店/交接、SG02～SG08、完整F03-2都不在本批。测试覆盖表及真CI日志为交A独立复验依据，旧F03-1登录及HTTPS回归各在独立新80表PG16执行。

运行（仅符合CI隔离环境）：

```sh
node f03-1/runner.mjs --bootstrap
node f03-1/runner.mjs --apply
node f03/runtime-scope/runner.mjs --apply
node f03-1/fixtures.mjs
node f03/runtime-scope/fixtures.mjs
node f03/runtime-governance-template/fixtures.mjs
node --test f03/runtime-governance-template/tests/*.test.mjs
```

业务API未添加，调用是内部测试模块`enableApprovedTemplate(auth,token,{roleCode:'sales',permissionCode:'customer.phone.manage',enabled:true})`。结果`TEMPLATE_ENABLED`表示真实修改、`TEMPLATE_ALREADY_ENABLED`表示合法无变更，其它输入安全拒绝。故障注入仅在GitHub Actions CI环境启用，不能用作正式业务入口。
