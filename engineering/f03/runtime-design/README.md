# 名邦汽车 V1｜F03-2-G0｜当前事实与事务合同（静态批）

**状态：B_STATIC_IMPLEMENTED / F03_2_G0_ACCEPTED=NO / F03_2_ACCEPTED=NO / PRODUCT_BASELINE=NOT_READY**。

A 正式放行：`07_重建工作区/F03-2-G0_A主控事实映射与事务方案施工放行_2026-10-09.md`。本分支从最新main `57ab53611ffe213c9917443c83133d527383f792` 建立；只做§§4～7静态规则追溯、合成事实/治理并发模型、结构缺口建议与假数据自动检查。

## 交付与边界

- `authority-fact-map.tsv`：45/45项F03-G0 permission-contract逐条映射原Final、既有现行表列、缺口、拟后续可信loader及用例。
- `capability-scope-contract.tsv`：45/45项每能力独立scope、当前模板/个人覆盖优先级、对象状态与延期硬拒绝。
- `governance-action-contract.tsv`：14组治理动作（包含模板、覆盖、scope、员工/接客、System Admin、4S、客户和车型控制面、handover）。
- `transaction-and-revocation.md`：只读后端事实加载、账号/会话/模板/对象的锁和提交重验、正常/突然失权及Admin/接客交错。
- `schema-physical-claims.tsv`：按已验收原始SQL机械反查九项结构状态，防止已存在表误报为缺口。
- `schema-gap-and-migration-advice.md`：基于冻结F02 464 INCLUDE字段与F03-1精确追加结构的证据和未来独立迁移建议（本批不执行）。
- `model.mjs`：只接受显式`trustedSyntheticFixture=true`的合成状态，不接收客户端角色、global或handover完成旗标。模型中`approvedOperationMappings`及`capabilityScopeProofs`只是假设A未来批准并可信加载的实验输入，**不是当前持久事实，不产生真实业务allow**。
- `tests/`：零数据库、无登录、无HTTP；加测A的R1～R5语义负例及历史物理表反向探针。
- `verify-contract.mjs`：冻结字段及全45动作反向校验、无外部副作用检查。
- `A首轮R1-R5整改闭合表.tsv`：A五项阻断逐条事实、修复、正反例、残余风险、待A复验状态。
- `authority-test-coverage.tsv`与`B自验与A复验交接.md`：G0-01～12覆盖/结果、待A技术裁定及残余。

## 执行（独立无数据库）

```sh
cd engineering
node f03/runtime-design/verify-contract.mjs
node --test f03/runtime-design/tests/*.test.mjs
node f03/verify-contract.mjs
node --test f03/tests/*.test.mjs
```

独立CI：`.github/workflows/f03-2-g0-runtime-design.yml`，不定义PG服务、不读数据库URL、不加载`pg`、不启HTTP/TLS或会话/业务路由、不导出结构。保留F02、F03-G0和F03-1所有已验收工程源码、manifest/迁移、工作流及证据，不修改PDM/IA/Low-Fi、main或C分支。

## 受信/不受信边界

真实的`Employee`必须由F03-1正常会话中PC account映射的当前`employees.employee_id`与`roles.role_code`证明；System Admin始终独立`system_admin_id`，4S仍是Employee。当前模板生效来自`role_permission_defaults.enabled`，个人`employee_permission_overrides.decision`必须现查；历史不可做授权。**4S PC入口继续沿用已验收F03-1：必须有当前个人明确`allow(pc.four_s.vehicle.manage)`，模板默认不能替代；deny/revoke后旧会话所有PC业务均拒绝。**所有scope需当前`employee_data_scopes`及目标关系证明：该表**没有permission_id**，不能宣称现成的逐能力scope链接已经实现。团队关系、独立eligible字段、handover batch及对象明细也未获实物证明，故`DEFER_DENY`或提出后续单独版本建议。

## 未执行
- **NOT_RUN** 真实PG16连接、DB Guard、SQL DDL/迁移/数据回滚、真实会话撤权、HTTPS、并发数据库写事务、完整交接、正式字段投影/业务路由、JYT/微信、生产部署及正式前端。
- **NOT_AUTHORIZED** F03-2-1/2/3、F03-3、F02-2/3/4、F04、main/C合并及业务和生产库。

静态通过只能交A独立复验`F03_2_G0_ACCEPTED`，不得冒称`F03_2_ACCEPTED`。
