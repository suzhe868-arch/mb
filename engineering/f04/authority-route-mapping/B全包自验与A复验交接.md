# 名邦汽车 V1｜F04-2 B全包自验、证据及A复验交接

## 权威与范围
- F04-2正式施工单：`07_重建工作区/F04-2_A主控现行215接口Authority映射与4S账号安全控制前置完整施工单_2026-10-10.md`。
- 分支`feat/f04-2-authority-route-mapping`始于已接受F04-1 PR26之后最新main `203a3b28af0ba74fad969c0dccde278d4db4a09f`；不改动旧F04-1/F03代码、测试、迁移和任何正式PDM或UI资产。
- 白名单仅`engineering/f04/authority-route-mapping/**`及`.github/workflows/f04-2-authority-route-mapping.yml`。
- 本包不实施业务生产API、微信/JYT/资金、4S账号真实治理，项目与H01仍NOT_READY。

## 2A｜215项当前Authority可核查分层
- 原始OpenAPI仍由冻结F04-1严格Parser验真，**198路径/218 method+path，其中62冒号path**。按原`legacy_id+method+full_path`精确取非禁恢复215条，不修改F04-1历史账本。
- 3个Collector旧GET/PATCH/TEST仍为RETIRE/FORBIDDEN且不在215行。
- 当前映射`current-authority-route-matrix.tsv`：**105条找到真实PDM Final/IA导航/Low-Fi页面的同簇/同主体三向引用；110条因来源不足标SOURCE_GAP**。每行都记录原路径/ID/身份/权限/DTO，现时引用文件、具体行和源原文片段，独立能力、对象范围、字段、deny、状态/审计、幂等与F04～F07承接。
- `EVIDENCE_MATCHED`仅证业务动作家族存在，不是旧HTTP复用批准。全部215的迁移decision均`UNDECIDED`、current stage`CONTRACT_ONLY`，不虚报KEEP/MODIFY/REPLACE；缺证处真实记录。
- `source-verifier.mjs`真实读取仓库原始Current文档验证字节行定位、218/3/215闭环及源OpenAPI method/path不可变；伪PDM行/捏造IA/历史禁恢复复活等负例均拒绝。

## 2B｜隔离4S当前控制面预检
- 独立`4s-preflight.mjs`仅在GitHub Actions的全新非特权PG16 M94、两层F04隔离开关及127.0.0.1 HTTPS打开。
- System Admin`admin_test`合法现时会话仅能得到治理身份最小自检`F04_4S_GOVERNANCE_AUTHENTICATED`；4S本人/销售/经理/匿名不进入，错误Origin/Host/Cookie/失效及强制改密立即拒绝。
- 目标4S账户缺独立、现时合作商户物理绑定，**即使System Admin请求已知4S账号，也必须`403 F04_4S_ACCOUNT_SCOPE_UNPROVEN`**，未知ID相同拒绝无泄露；不实现CRUD，不新增可信关系、DDL或生产账号。
- 原F04-1 CRM、Vehicle、Lock、资金、账号状态和安全拒绝不变。并行双当前Admin会话及禁止状态写入有真实PG16负例。

## 2C｜测试及归档
- F04-1既有26个独立PG16作业逐字保留于新工作流，新增两个真实独立PG16作业：Authority-source真仓库引用和4S实际loopback HTTPS。
- 新Authority测试包含8个原生Node测试；新4S HTTP测试包含9个原生Node测试；所有测试的结果以最终分支HEAD对应GitHub Actions真实run的28/28判定。
- 每个新作业输出`schema-only.sql`、`full-catalog.json`、`inventory.json`、`frozen-source.md`、`true-pg16-tests.log`、`sha256sums.txt`到GitHub Actions Artifacts，旧26个物理版本仍各自独立封印。
- 原始CI证据必须满足`run.head_sha=branch HEAD`且28作业均`completed/success`；本文件不凭以前运行结果提前宣告。
- 详见`route-cluster-authority-notes.md`、`4S商户归属与对象权限缺口证明.md`、`安全威胁与负例矩阵.tsv`、`Authority状态汇总.tsv`和当前矩阵。

## 明确仍未实施
真实F04 System Admin/4S控制面写、Customer完整CRM字段、F05车源归属/价权、F06 Lock/Refund/交易、F07 JYT Publisher/CDN、C/H01高保真及三端UAT均保持OPEN_DEPENDENCY或NOT_READY。无需用户逐项批准已授权技术整改；A保留所有产品跨域争议的正式最终裁决及合并权限。

**退出门禁：最新同SHA28/28成功后标`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`；未经通过仅`B_CI_PENDING`，不自行merge主线。**
