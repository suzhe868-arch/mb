# 名邦汽车 V1｜F08-1 B工程执行与A独立验收交接

> 批次：`F08_1_CROSS_DOMAIN_QUALITY_EVIDENCE_CI_ONLY`。本文件随原分支落库，最终真实HEAD、CI/Job及工件动态事实**以PR最终同SHA评论为准**。任意中间Push上本文件存在不代表已经`READY_FOR_A_REVIEW`。

## 1. 工程边界

- 源基线：A已合并F07-4 PR67后的**开工时最新main**，独立新分支 `feat/f08-1-cross-domain-quality-evidence-gate-ci`，独立PR只向main提请A审核。
- 仅新增 `engineering/f08/quality-evidence-gate-ci/**` 及 `.github/workflows/f08-1-*.yml`。旧业务源码/旧CI/PDM Final/生产Schema/C手机端均原封不动。
- 代码只读枚举Git HEAD/Tracked files和原生测试入口；不进行`npm start`真实业务调用或外部API写入；只在本批临时PG16创建`f08_1_ci`。

## 2. 本批可复核工程成果

- `quality.mjs`：6级来源事实校验、7类CI状态原样记录、强制同SHA校验、TSV矩阵字段/唯一性/责任归属校验、动态Git跟踪树覆盖扫描及其可审计JSON输出。遇未知状态/缺失源/来源升级/伪生产声明，FailClosed。
- `tests/quality.test.mjs`：Node 60个独立断言覆盖CI队列/取消/失败/缺失/不同SHA、防冒充正例、未签正例、未运行、C草稿、来源缺口、真实Git树、必备产品域及历史快照等；另有一条完成标记，不能当作额外业务案例。
- `tests/pg.test.mjs`：24个非特权原生PG16合成安全断言覆盖角色非超管、v16、专属库/schema、真实唯一约束/来源枚举、各业务域隔离、父正例恶意升级、回滚、并发插入、public内容COUNT/MD5不改变；不会声称在正式父源已经生成真实正向证据。
- 三份中文TSV：`F01_F08真实证据覆盖矩阵.tsv`、`SOURCE_GAP与质量阻断台账.tsv`、`旧CI检查状态矩阵.tsv`，严格不统计生产完成率。

## 3. CI验证原则及未闭环

- GitHub Actions两个独立Job：Node只读门禁+真PG16独立库；均要求真实 `event=push`、末SHA `completed/success`、独立非空有效 `sha256` 工件。任何未跑出最终结果时必须登记 `CI_PENDING` 而不是 PASS。
- 本分支新Push可能触发旧F05工作流；旧CI三态与本次工作流的实际状态必须分别核对，不自动套用PR67限定性技术裁决。
- 当前未获授权：真实签名业务Issuer、Collector/JYT电话链、OSS/CDN图片、Feishu正式路由、客户与资金、C-APP-01真实双端构建及Chromium四视口、F01-F07正式跨域E2E、UAT和生产部署。
- 本文不是A验收意见。真实完成后由B在PR附最终SHA、源文件白名单、测试日志、Job、两Artifact及`B_SELF_TESTED/READY_FOR_A_REVIEW/NEXT_OWNER=A`，**A审核通过前B不合并main**。

## 4. 不可混计结果

F07-4 PR67的128项是**历史独立CI模拟业务回归**；不能与本包Node60/PG16 24例混计为“真实跨域联通案例”。F08-1 Node负例验证的是证据防伪合同；PG测试验证的是临时本包数据库约束；**F08最终验收并未完成**。
