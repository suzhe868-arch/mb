# F05 历史 CI 专项治理｜严格非生产
> A 正式单：`F05_LEGACY_CI_GOVERNANCE_01`；分支 `fix/f05-legacy-ci-governance-01`。
## 本批仅恢复基础设施
- 五份授权旧workflow共12个原生PostgreSQL服务从已证实429限流的 `public.ecr.aws/docker/library/postgres:16-alpine` 切到F08-1已真实使用成功的Docker Hub官方镜像 `postgres:16`，**主版本仍16**。这是浮动官方标签，不冒充固定digest；后续可由A审核供应链摘要后另行正式固定。
- 不改原12个 `ci-job.sh` 入口、不改任何原生安全用例、PostgreSQL非特权使用原则、Artifact必需、不改旧Push正式来源条件；旧工作流 `pull_request main` 保持不变，原因是GitHub App分支保护读权限403导致required checks未知。禁止贸然加paths造成永久Pending。
- 新工作流以真正的原生 `push` 在**独立B施工分支**运行：Node只读源码/历史CI状态审计+失败负例，PG16独立非特权测试含SQL约束、权限、回滚、并发锁，两Job都出官方SHA256工件，绝不是旧66/68/70项真实父证明替代品。
- `audit.mjs` 的GitHub API只读动态快照记录检查状态和运行期计数，绝不将 `queued/in_progress/failure` 标为成功；旧正式Push资格、66/68/70同SHA证明仍缺时归 `HISTORICAL_PARENT_PROOF_SOURCE_GAP`。
## 审核与剩余阻断
- 本包解决ECR配额风险及增设兼容性证明；**不能合法把旧PR上无原Push资格的Source Job伪改成PASS**。GitHub branch protection未知由A管理员界面核查后再决定触发器/required checks方案；若仍需另修，必须由A签发补充裁决。
- 禁止生产、真实客户、资金、正式PDM迁移、外部JYT/Collector/Feishu/CDN/OSS及UAT。不宣称F05/F08/V1业务全域Ready。

## A主控2026-10-16冻结重验证扩展授权
- 已从原PR70/原分支扩到总共10份旧F05工作流、28个独立真PG16服务，其中额外5份冻结revalidation工作流仅16项ECR服务镜像替换为DockerHub官方`postgres:16`并加Runner本地Tag验ID、同一单独容器；原测试、Source官方Push、`pull_request main`、正式工件全部保留。
- Node审计合同扩到45条独立测试覆盖28项原生Job以及失败注入；原主5份与冻5份均保留身份与PG16数量。来源证据66/68/70阈值不降低、正式父业务Issuer缺口不修饰，镜像为可变Tag、不是digest固定。
