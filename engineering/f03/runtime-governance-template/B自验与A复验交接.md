# F03-2-2A｜B工程自验与A独立复验交接

状态：**B_CODE_PREPARED / REAL_CI_REQUIRED / A_ACCEPTANCE_PENDING**。禁止把未运行测试写成通过；CI结果必须由A按最终SHA复核。

- 执行基线：2026-10-09 A正式放行的main `2f7bd9a3d6eb0f7cca656c43e3f198f86d52311a`；新分支`feat/f03-governance-template-2a`。
- 允许目录：仅新增`engineering/f03/runtime-governance-template/**`及`.github/workflows/f03-2-2a-governance-template.yml`；无旧结构或产品规则修改。
- 最小动作：可信System Admin活跃正常PC会话设置`sales × customer.phone.manage`模板`enabled=true`，当前模板、不可变history和脱敏audit在同一个F03-1已验收账号→会话锁事务内提交；角色行锁在模板行不存在时也保护双Admin并发；当前true严格NO_OP；测试失败注入只在CI启用。
- T01～T10目标：真实PG16新版守卫、当前/历史/审计逐行对比、初次插入及false更新、两Admin并发、阶段故障回滚、非法身份与越界拒绝、原Employee同一会话实时权限效果、原F03-1认证与HTTPS两份独立PG16回归、81表及三版本物理结构原文。真实作业结果待CI提交后填写，A不得仅凭本文件宣布通过。
- 非本批：模板降权/删除、其它角色/permission、接客和最后Admin保护、离职调店与handover、SG02～08、正式业务接口、电话修改和真实/生产数据库。
- 自测实物：`enable-template.mjs`、`fixtures.mjs`、`tests/integration.test.mjs`、`测试覆盖与边界表.tsv`、独立3-job workflow。审查必须关注原80表回归是否仍独立、条件拒绝与真实审计一致性，以及工作流是否确实是最终B SHA成功。
