# F03-2-2B｜B完整工程自验与A独立复验交接

日期：2026-10-09（新加坡时间）。执行分支：`feat/f03-admin-population-2b`。**本文件为 B 交付范围说明，不替代最终同 SHA GitHub Actions 成功证明。最终头指针、同 SHA CI 运行号和三个历史基线回归以 GitHub 实时内容核对；仅满足全部成功时状态 READY_FOR_A_REVIEW。**

## 施工来源与不可突破的授权
- A完整施工单：`07_重建工作区/F03-2-2B_A主控技术裁决与完整工程施工单_2026-10-09.md`；正式施工基点 `main 37e35c837348f5d98f5001e13c28604fd536f684`，F03-2-2A 已验收合并。
- 本批新增范围 **仅** `engineering/f03/runtime-admin-population/**` 及 `.github/workflows/f03-2-2b-admin-population.yml`。旧 F02 000001、F03-1 000002、1B 000003、既有旧 Guard、F03-2-2A 和产品 Authority 均不改写。
- 不连接已有或生产库；只允许 GitHub Actions 新建一次性 PG16 `f03_auth_test` / 非特权 `f03_ci` / CI run seal；无正式 HTTP 路由、真实 System Admin、客户电话写入、员工管理 Admin 或 SG02～08 扩权。

## 完成内容
1. **000004精确追加迁移**：唯一新表 `governance_population_guards`，字段 `guard_name,version,bootstrap_claimed_at` 与受限单例 CHECK、PK；版本序列 `000001→000004`，原 81 表完整指纹 `229aa6dc...` 不变。新预期 **82表/495列/307约束/127索引**，全目录冻结指纹 `555ddc5bffa745014e68eab79fa83312c9b18ed06f484434fc5d76e2064336ea`；实际 81→82 前后逐对象对照，不动态采信漂移。已使用 claim 或存在 Admin 历史时拒绝回滚，未占用时在一次性库验证精确回退。
2. **持久双保底**：可信 F03-1 正常 System Admin 会话在同 TX 持有账号→会话锁、SG05 单例 `FOR UPDATE`、目标状态/凭证锁，在提交前重新统计 active Admin 与真实 enabled 有效凭证对应的 active Admin；任何一方归零均回滚；跨 Admin 交叉停用含死锁和序列化有界重试。合法内部停用使凭证 disabled、epoch+1、当前旧会话撤销、脱敏 append-only audit、guard.version+1 同提交。重复动作无历史/审计，非法及身份失效全部拒绝。
3. **首次完整 bootstrap**：只在独立 CI installer 环境下，锁独立单例，真实合成 `system_admins` + `pc_login_accounts` KDF 凭证 + 审计 + 时间不可重置 claim 同 TX；并发只有一次成功。首次受限会话真实改密后再正常登录；其后即使全部 inactive/disabled 仍拒绝重 bootstrap。四点失败注入证明身份、凭证、claim、审计全回滚。
4. **实测测试与回归**：`测试覆盖与边界表.tsv` 标注 A2B-01～10 及扩充负例；隔离 CI 五作业：82表主治理、82表空库首次认领、81表既有SG01/2A治理回归、80表原认证11项和原HTTPS4项安全回归。冻结旧守卫只在各自旧版本库实测，不能让旧80/81 Guard 接纳新82表。
5. **原始结构证据**：`evidence/` 存放 source-run 原始 `old-structure.json`、`new-structure.json`、`pg16_schema_only.sql`、`pg16_inventory.json`、`sha256sums.txt`、`SOURCE.md`。当次 CI 实际重算完整 SHA256，确保 old/new inventory 逐字节一致，SQL 仅允许同份 pg_dump 配对随机 restrict key 差异。所有产物只含结构无行数据、令牌、凭证或私钥。

## 正式交接与残余风险
- **最终 SHA 与同 SHA 成功运行必须取 `feat/f03-admin-population-2b` 最新 GitHub head，验收不采用首次结构发现 CI、失败 CI、证据归档提交之前的成功 CI**。参见 <https://github.com/suzhe868-arch/mb/actions/workflows/f03-2-2b-admin-population.yml>。
- 最终提交的五作业均 `completed/success`、真实迁移和并发/回滚/原始物理证据成功、旧冻结文件未改，且无待整改阻断时，B 状态为 **READY_FOR_A_REVIEW；NEXT_OWNER=A**。
- 仍未授权正式 P05/HTTP 控制面、真实账号和业务库、生产 bootstrap、重置/恢复管理员、SG03 接客池、SG02团队、SG04更多控制范围、SG06交接、SG07正式写提交、SG08上游发布人、模板降权、真实多节点压力测试。完整 `F03_2_ACCEPTED=NO`，`PRODUCT_BASELINE=NOT_READY`。A 独立复验签发前，本报告不是 `A_ACCEPTED` 或 `MERGED`。
