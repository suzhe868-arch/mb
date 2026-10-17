# 名邦汽车 V1｜F05/F08 受控真实工程 B 自验与A验收交接

**任务** F05_F08_BOUNDED_REAL_ENGINEERING_01；A_RELEASED_FOR_B_ACTUAL_CODE_AND_PG16_ONLY；基线 main `e0f800f1659c9eb1d8f7854f2f64c9a12ebd71c8`；分支 `feat/f05-f08-bounded-real-engineering-01`。

## 工程一：版本化来源与影响分析工具
proof.mjs 真实核查 repo/branch/SHA/event/attempt/workflow、GitHub Check与Job同run成功、分页完整、官方非空未过期Artifact；区分 PROVEN_EXACT_SHA / HISTORIC_DIFFERENT_SHA / REVALIDATION_REQUIRED / SOURCE_GAP。候选当前CI未结束时，只记 REVALIDATION_REQUIRED。即使验证了GitHub完整证明也明确 `formal_source_issuer_signed:false`，绝不代替旧五Source签发。
snapshot.mjs 从Git真实HEAD差分计算已知F05/06/07/08关联和未知共享依赖；保留先前A验收PR92/94历史成功为不同SHA，不以它冒充本候选真成功。命令 --verify 必须输入真正官方Run、Job、Check、Artifact元数据后才能将候选归类为 PROVEN_EXACT_SHA；不调用真实外部业务。

## 工程二：真实隔离非特权PG16跨域
在新建 `f08_bounded_test` 数据库的 `bounded_ci` CI-only schema 建立合成客户、Owner、车源、Recommendation Grant、咨询、Priority、锁车申请的真实关系约束。三组跨域物理场景：① Owner变更→F05匹配/隐藏Grant；② F05现存匹配规则→咨询幂等→F06待审批锁车与priority排他；③ F07 Publisher校验→F08正式Source Gap拒绝。复用现有F05 `eligibleVehicle/tierFor`、F06 `productionIssuerDeny`、F07 `validPublisher/mapSyntheticSyncApi` 与F08 `requireEvidence`。不冒充已实现原F06完整签名服务，集成适配器仅是受控CI测试数据，正式API、真实JYT/微信/资金/飞书均 NOT_IMPLEMENTED/MOCK_ONLY。

## 边界
新增仅 `.github/workflows/f05-f08-bounded-real-engineering.yml`、`engineering/f05/bounded-ci-engineering/**`、`engineering/f08/incremental-integration/**`。CI仅独立工作分支Push，2个任务分别Node最多10分钟、PG16最多20分钟；只读 `contents:read`，无Secrets及原来源执行。两份官方Artifact留档，最终同SHA原生Jobs证据交A。原旧H52及8冻结workflow不修改，五正式Source维持SOURCE_GAP/FAIL_CLOSED，旧F05-7 ref不Push，PHASE2仍NO_GO，C PR68仍Draft，生产NOT_READY。

**B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A**。最终Run ID/Job ID及两份Artifact以本PR最终SHA GitHub原生结果为准。