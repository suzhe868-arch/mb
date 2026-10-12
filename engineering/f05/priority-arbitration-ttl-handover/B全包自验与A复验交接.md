# F05-8｜B全包自验与A独立复验交接（CI-only）

> **性质：** B正式交接文档；仅限F05-8可抛弃非超级用户PostgreSQL16，不是生产资格、版本发布、真实Issuer或A验收结论。
> **当前工程已真实自验通过的代码SHA：** `3bc027dd7a01e17127a7a83c006b5fbe66a5d247`（8/8官方同SHA Push Workflow、68/68真实独立PG16作业PASS）。本交接文件为后补的**纯文档提交**，故交A的最终PR HEAD可能不同。**必须以最后PR HEAD对应的官方Actions八份Push运行再次全部成功且具四份Artifact才可正式宣告`READY_FOR_A_REVIEW`，实时回执以PR #47 B最后一条交审评论及GitHub API为准；不得把下述上轮成功拼为新SHA。**
> **PR：** https://github.com/suzhe868-arch/mb/pull/47；B不得合并main。产品基线`F05/C-H01/V1 NOT_READY`，真实账号、用户资金、微信/JYT/电话、发布生产接口继续`SOURCE_GAP`。

## 1. 正式Authority及工程边界

- A施工单：`07_重建工作区/F05-8_A主控PDM13_Priority资格仲裁TTL排他与责任交接CI隔离完整施工单_2026-10-12.md`；产品：`07_重建工作区/PDM-13_最终完整规则.md`，联动PDM11/12/14/18/19与现行Decision Register。
- 起点main：`59c191a2efccbbb15538bfa5e4234a1e561f99f6`，F05-7正式PR46已A验收合并；工作分支`feat/f05-8-priority-arbitration-ttl-handover`。
- 新增代码仅在`engineering/f05/priority-arbitration-ttl-handover/**`，新增CI仅8份`.github/workflows/f05-8-*.yml`。**main及F03/F04/F05-1～7已签文件、旧迁移、旧业务测试/工作流、PDM及设计没有修改。**
- 七份新增冻结工作流，从各自旧正式版`jobs:\n`至EOF逐字一致，总计 **64** Job（H52+I/J/K/F05-4/5/6各2）；第八份本批真实PG16新工作流 **4** Job（F05-7兼容Source 28 / HTTPS 7、Priority Source 20 / HTTPS），合计 **68**。
- F05-7旧分支专属`ci-verify-workflows.mjs`不能复用其原分支自指跨工作流统计；新`compat-job.sh`仅在Actions运行时产生临时脚本，执行完整原生旧F05-7真实业务测试，替换仅旧分支特有的审计环节为F05-8官方68-job只读审计，旧签源码不改。

## 2. Source Authority / v24 SQL与保护状态

- 来源矩阵：`F05-8_PDM13来源权限矩阵.tsv`；事件时序：`Priority_资格仲裁TTL与事件时序审计.md`。
- `000024_priority_ci.sql`新增真实原生CI约束：独立Customer资格、TTL全局默认86400秒/每条创建冻结、唯一active Priority、签名Match高优先级仲裁、同cycle suppression、不可变ending/history/event、trigger Demand负责人切换与handover失败账；由真实M94到v23签名链滚动到v24，历史原迁移不动。
- 真实旧表/Session保留：Customer/当前Demand.owner与原始created_at、PDM12当前Result tier/来源签名/周期、Vehicle、Lock、Transaction、F03真人工合成员工正常会话及个人deny/scope；无正式Customer端签发Issuer时fail-closed，不将合成控制平面写入生产。Priority不等于Recommendation、客户可见性grant、Lock、价格权、客户Owner。
- F05-8客户本人正式Lock成立结束`converted_to_lock`、其他客户Lock结束`lock_takeover`，真实有交易占用`transaction_started`；结束不得复活，Priority独占只在合法当前状态内，不解锁hidden车及价格。
- `F05_8_V24_REAL_PG16_INJECTION_ROLLBACK_PASS`；`F05_8_V24_VERIFIED`旧签名Ledger+新结构seal，v24 SQL SHA256 `512bb6e076871c6e452a5879edfdafaec1821714405840fe8942f61554187bce`，catalog SHA `c1ef96b0fe131254d176b0aea84f74c15fd125848c01d53946a06079cfc73521`（见原生Job日志、Artifact及校验清单）。

## 3. 本轮真实PG16失败与闭环

- 已修复F03子shell隔离环境变量未继承的确定性缺陷（新工作脚本明确重新导出原F03确认，不解除CI/PG环境门禁）。
- 真实PG16原生Source曾失败三例：`8-A01` v24资格未开通却被测试误写期望已有Priority；`8-A09` 释放前按Demand变化主动重新绑定签名，原测试错误比对更新前签名；`8-A12` 测试引用不存在的第5辆可用车。已在`3bc027dd7a01e17127a7a83c006b5fbe66a5d247`一次性修正为准确的数据库当前签名、四车物理fixture及未授权负例，**保留所有真库正反例、未删测试**。
- 新提交的Source真PG16：**20/20 PASS、0 fail/0 skip**，F05-7源回归**28/28**、HTTPS**7/7**、Priority HTTPS全绿；本批Source原生双后端PID **247/255**，真实锁冲突**SQLSTATE55P03**，完整插桩日志及Source审计证据入原生Artifact。Priority另含交易开始、Lock接管、handover失败重试不可变、Employee个人deny及单独qualification权限deny、公开量排他/hidden不穿透。
- GitHub公共容器镜像仓库曾出现`toomanyrequests: Data limit exceeded / Rate exceeded`，具体Frozen J2 `38199485767` 单失败PG作业官方同SHA重试attempt2成功，Frozen H52 `38199485765` 的h-https attempt1/2遇容器限流，attempt3同SHA重试成功；**旧冻结Job没有任何降级或改写**。
- CI静态语法检查/仅读取GitHub API不能替代独立PG16，本批必须以GitHub实际同SHA运行Job计数及原生证据为准。请A独立核SQL seal、并发真实PID、权限、审计、原有签名链、禁恢复项及CI-only来源边界。

## 4. 上一真实成功代码SHA的官方审计回执（不可跨SHA替代最终验收）

| 运行名称 | 原生Run ID | 最终attempt | 同SHA真实成功Jobs |
| --- | ---: | ---: | ---: |
| H52冻结真实PG16 | 38199485765 | 3 | 52/52 |
| I2冻结PG16 | 38199485812 | 1 | 2/2 |
| J2冻结PG16 | 38199485767 | 2 | 2/2 |
| K2冻结PG16 | 38199485783 | 1 | 2/2 |
| F05-4冻结PG16 | 38199485816 | 1 | 2/2 |
| F05-5冻结PG16 | 38199485775 | 1 | 2/2 |
| F05-6冻结PG16 | 38199485749 | 1 | 2/2 |
| F05-8新增四独立PG16 | 38199485774 | 2 | 4/4 |
| **合计** | **8官方Push Run** | | **68/68 SUCCESS, 0skip** |

上轮同SHA原生四份未过期证据附件：

| 原生Artifact | ID | Size |
| --- | ---: | ---: |
| `f05-8-compat-source-native-evidence` | 11724109005 | 109025 B |
| `f05-8-compat-https-native-evidence` | 11724588875 | 99439 B |
| `f05-8-priority-source-native-evidence` | 11725225299 | 100457 B |
| `f05-8-priority-https-native-evidence` | 11724104005 | 96431 B |

每个Artifact含原生测试、结构/迁移/来源/事件、作业自身`sha256sums.txt`等文件；需A复验非空性、未过期与内容。**此处是上一代码SHA的证据；文档落库后新PR HEAD必须再拿同SHA的八运行、68工作与四Artifacts。** 该最终动态验证结果和时间戳记入[PR #47](https://github.com/suzhe868-arch/mb/pull/47) B交审评论，避免为在Git tracked文档中追加新run ID不断产生SHA并失效门禁。

## 5. 合并/生产禁令与唯一下一步

- B仅限当前指定分支施工、自验、交审；**任何时候不能自行合并main**。待本文件形成的最终B HEAD 68/68官方同SHA再次成功、四原生证据有效，B才可解除Draft、提交`READY_FOR_A_REVIEW / NEXT_OWNER=A`并由A独立验收。
- 未实际具备正式线上Priority资格Issuer、微信Customer身份、JYT电话、数字报价/价格权限、生产资金及独立现场UAT；项目、F05和C-H01仍`NOT_READY`。本轮无生产上线、迁移或外部业务写操作。
