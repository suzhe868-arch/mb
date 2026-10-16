# F08-1｜跨域工程质量证据门禁（只读 / 非生产）

本目录是 A 正式放行的跨域**证据质量**工具，不是 F08 最终验收、正式业务系统或生产部署。

## 运行入口

- `node engineering/f08/quality-evidence-gate-ci/quality.mjs report`：以**实际当前 Git HEAD** 和 `git ls-files` 检查真实源码是否存在、校验覆盖/缺口/旧CI历史矩阵，生成仓库根目录临时文件 `f08-1-quality-evidence.json`。历史SHA只是来源标签，不能冒充本次HEAD业务验收结果。
- `node --test engineering/f08/quality-evidence-gate-ci/tests/quality.test.mjs`：62个分离的Node安全正反例（另一个完成标记测试，不混算）。
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
