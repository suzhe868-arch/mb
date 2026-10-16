# F08-1｜跨域工程质量证据门禁（只读 / 非生产）

本目录是 A 正式放行的跨域**证据质量**工具，不是 F08 最终验收、正式业务系统或生产部署。

## 运行入口

- `node engineering/f08/quality-evidence-gate-ci/quality.mjs report`：以**实际当前 Git HEAD** 和 `git ls-files` 检查真实源码是否存在、校验覆盖/缺口/旧CI历史矩阵，生成仓库根目录临时文件 `f08-1-quality-evidence.json`。历史SHA只是来源标签，不能冒充本次HEAD业务验收结果。
- `node --test engineering/f08/quality-evidence-gate-ci/tests/quality.test.mjs`：101个分离的Node安全正反例（另一个完成标记测试，不混算）。
- 真PG16用例**只在本分支的真实隔离GitHub Actions**运行，脚本 `tests/pg.test.mjs` 对环境、分支、独立非特权PG16、库名和地址严格FailClosed。禁止把它指向生产库，禁止修改真实公共业务schema。
- GitHub新建工作流 `.github/workflows/f08-1-cross-domain-quality.yml` 两Job独立：Node只读扫描 + Node质量断言，另一个只在 `f08_1_ci` 临时schema验证PG16数据约束、rollback和并发测试。通过后产出每Job一份同SHA官方工件。

## 数据与证据语义

`F01_F08真实证据覆盖矩阵.tsv`：F01～F08与C的确有的仓库源码路径、测试入口与历史来源等级；目录/测试存在仅为可索引，不等于已运行或产品通过。C Draft PR68只在C分支，因此在最新main的Source仍记为`SOURCE_GAP`。F07-4历史PR67只证明**隔离Mock通知128项、10项真签父负证**。

`SOURCE_GAP与质量阻断台账.tsv`：逐项列未授权的第三方/资金/微信构建/Chromium/正式E2E/UAT及其责任和解锁条件；禁止变相抹成`READY`。

`旧CI检查状态矩阵.tsv`：PR67历史SHA `692e4c...` 28项旧F05 Queue的**有时间界限的历史快照**。它不查询也不代理最后本分支真实GitHub Check；最后提交的真实Run/Job/Artifact和旧F05状态以A/B每次动态GitHub独立复查为准。

## 绝不允许的跨越

- 只有 `SIGNED_PARENT_VERIFIED` **并且**真实SHA/Run证据充分且单一Check真实`completed/success`，才可能成为“已签父正例”的证据；`SIGNED_PARENT_NEGATIVE_ONLY`不升级为父业务positive。
- `CI_SYNTHETIC_ONLY`、`STATIC_CONTRACT_ONLY`、`NOT_RUN`、`SOURCE_GAP` 不得因为测试数量、路径存在或GitHub队列排队而升级。
- `queued/in_progress/skipped/cancelled/missing/failure` 都不是 `success`，不得跨SHA转移检查结果。
- 本质量工具一律 `NO_PRODUCTION / NO_UAT`；没有真实飞书、JYT、Collector、微信、客户、支付及正式迁移权限。

工作单：`07_重建工作区/F08-1_A主控跨域工程质量证据门禁非生产正式施工单_2026-10-16.md`。

## A首轮定向整改（2026-10-16）

- A01：历史检查的失败、排队、进行中、跳过、取消、缺失六种非成功状态一律拒绝成功声明，历史成功仍须另行提供独立GitHub检查来源。
- A02：五种非父签正例级别均拒绝父正例，合法正例也必须由只读独立同SHA完成成功Check核证。Q78仅测试结构，不构成真实父签正例。
- A03：新增 PR69_A首轮旧CI真实检查历史快照_2026-10-16.tsv 固定A受验旧HEAD的30项官方检查结果；audit-ci.mjs 在最新真实Push读取GitHub Checks官方API并保存当时同SHA状态为运行期工件 f08-1-current-checks.json。运行中可能含排队/进行中，绝不是最终成功证明。最终成功与旧F05状态须对最终HEAD重新查询GitHub写于PR正式交接评论。旧PR67历史TSV不得冒充当前事实。分支保护仍标UNKNOWN。
- 未更改冻结F05旧workflow、父业务、生产和C端；F08全域及V1仍NOT_READY。

## R2｜可信父正例（2026-10-16）

- `trusted-parent.mjs` 通过模块私有WeakMap管理只读核验回执，调用者不能传入provenance字符串或手造 `{sha,state:'success'}` 获得正式`SIGNED_PARENT_POSITIVE`资格。
- 真GitHub只读适配器固定官方仓库、固定注册的父Issuer、固定SHA/Run/Workflow/Check/Job，并要求全部`completed/success`且Check属于Run，附10分钟回执时效。结构测试`validateParentGithubBinding`只返回`CI_BINDING_STRUCTURE_ONLY`、`eligible:false`，不颁发真实可信回执。
- **当前无A批准的父正例Issuer**，`ISSUER_REGISTRY`明确为空，因此`obtainTrustedParentReceipt`默认拒绝；无权宣称父业务正例。授权须由A未来独立施工单签发，不允许由本批将合成Job当真实父Issuer。
- `requireEvidence`和`validateCoverage`只认内部真正发行的受信回执，Q14/Q78先前的伪成功通道均已改成拒绝；旧历史CI的手造`provenance`字符串不再可提权。
