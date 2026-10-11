# F05-7｜B 工程完整自验、真实 PG16 回归及 A 独立验收交接

> 日期：2026-10-12（Asia/Singapore）  
> 指定仓库：`suzhe868-arch/mb`  
> 唯一 B 分支：`feat/f05-7-deterministic-matching-readiness-four-tier`  
> 审查对象：PDM-12 确定性规则匹配 Readiness、四级结果与真 PostgreSQL 16 来源隔离。  
> **限 CI-only；正式生产找车/匹配/Rule Issuer 未启用，F05/C-H01/V1 均为 `NOT_READY`。**

## 一、授权及施工边界

A 正式施工单：`07_重建工作区/F05-7_A主控PDM12确定性匹配Readiness四级结果与受信来源隔离完整施工单_2026-10-12.md`；正式 PDM Authority：`07_重建工作区/PDM-12_最终完整规则.md`，联动 PDM-10/11、F03 真实 Employee Session 与数据 Scope、F05-6 v22 应用/正式 Demand 分离及历史车辆周期事实。

本分支只**新增** `engineering/f05/deterministic-matching-readiness-four-tier/**` 以及**八个** `.github/workflows/f05-7-*.yml`。未覆盖或修改 `main`、PDM/IA/Low-Fi、C 高保真、生产服务、M94 或正式迁移 000001～000022、已签 F03/F04/F05 源码、历史 Workflow。CI 使用由 GitHub Actions 创建的非超级用户临时 PG16，拒绝真实生产 URL；绝未接触正式客户、微信、上游 JYT 密钥或交易资金。

## 二、完成的工程与来源约束

1. `000023_matching_ci.sql` 只在隔离测试库追加 CI-only v23：受控词典、经合法 Employee 签名的销售描述与标准条件、车辆事实及 provenance、唯一当前结果/不可变历史、源失效触发器、迁移签名封印。先校验旧 M94→v22 的**20 条完整签名迁移**，v23 后 **21 条**、旧 Ledger 不变，且注入失败回滚完整。
2. `contract.mjs` 为纯确定性解析，词典优先级**具体车型年款 > 车系年款 > 车系 > 品牌 > 全局**；同级冲突不以时间或随机选择，对该条件保留局部 hard unknown；支持同字段合法多值 OR、跨字段 AND、hard/preferred/排除/tolerance、没有条件＝不限、排除 V1 六类未准许自动评分字段、车龄与上牌年份分离、最高里程而非最低里程。预算以整数分 `BigInt` 验算 `100%`/`105%` 边界，不以内部批发价替代客户合法展示价。
3. 结果固定四级 `high`、`acceptable`、`confirmation_needed`、`no_match`。任一 hard 明确不符优先 no_match；hard 事实局部缺失 confirmation_needed；非硬偏好不符/合法 5% 宽容 acceptable；全部已定义条件满足 high。没有正式 Sales 描述/合法 Rule 可执行条件的 active Demand 仍不可 Matching；pending Application 更不可。
4. `service.mjs` 必须通过原 F03 正常 Employee Session、当前 active Customer/Level 找车权益/正式 active Demand/当前 owner、个人 allow/deny、权限 Scope 和 Team 的 PG16 当前真实行锁后才能在**CI 合成许可**下计算。真实 Vehicle、ListingCycle 状态、过期/售出下架守卫与平台 hidden 分层，隐藏但真实可售的车辆可内部匹配，active Lock 不自动争取优先级。
5. 匹配结果采用 `Demand × Vehicle × ListingCycle` 单当前 unique 与历史 stale，仅当前且同版本签名才能消费；源 Rule、Sales 条件、Vehicle fact、Customer、等级权益、Demand/Vehicle 状态变化由原生 PG 触发器主动废止旧 current，不能用旧幂等 key 恢复 stale，不能自动创建 Recommendation/Priority/Visibility Grant/Lock/Transaction/价格扣费。
6. `/__ci__/f05-7/**` 是仅隔离 HTTPS loopback 的拒绝路由；正式 `/api` 没有正向 Rule/Matching 入口；假客户身份、手机号、价格、AI 推测、4S/SystemAdmin、越权 Cookie、跨 Origin、CSRF 和内部 VIN/价格字段输入全部 fail-closed。

## 三、真实运行过的 Source 24 项、HTTPS 7 项及并发

在同分支上一轮候选 SHA `ccffcdf63d772d47d580dee75881f308cd8b0fa6` 的 **GitHub 原生真实 PG16 执行**中：

- Source 本批 `7-A01～7-A24` **24/24 PASS、#fail0/skipped0**。包含签名迁移/注入回滚、待处理申请/active 尚未 ready、权限、四级结果、两端价格精确边界、Rule 冲突/OR-AND/preferred、真实源车辆与状态、历史唯一/不可篡改、下游无副作用。
- HTTPS `7-B01～7-B07` **7/7 PASS、#fail0/skipped0**；生产真实性缺环均 403/404，防敏感信息泄露。
- Customer 停用与当前 Matching 事务竞争：真实原生两个不同 PG backend **208/209**、SQLSTATE **55P03**；Vehicle 下架与当前匹配竞争：PID **208/216**、SQLSTATE **55P03**。成功事务先提交，后续合法状态撤销即刻 stale；无第二当前结果、不允许撤销后继续匹配。
- 本批 v23 真实 PG16 签名 SQL checksum `21dbd41efac371d2cb43ef483dcb46718ef8d9abd2a8d2ec30acec11a2af3217`；catalog SHA `09ad3faaf112682663a0176a325c10bdda60cbefbb75b96174252e54c60aa344`。
- 官方成功 Source/HTTPS 新工作流 [Actions #38185523287](https://github.com/suzhe868-arch/mb/actions/runs/38185523287) ，初次公共 PostgreSQL 镜像 `toomanyrequests` 干扰 Source 未进入测试，以官方**同 SHA**失败作业重跑完成，未改业务用例。原生 Artifact：Source `11719148950`（90489 B，未过期）、HTTPS `11719446792`（87780 B，未过期）。

**特别注意：以上是记录真实完成的上一 SHA 证据。本文档自身提交会改变 HEAD，因而以上成功结果不得充作本文档提交后的同 SHA 放行。最终 B/PR 末 HEAD、完整新运行编号与有效最终 Artifact 必须以 PR #46 最终正式 B 交接评论、原生官方运行与 `official-github-actions-same-sha-66-audit.json` 为唯一来源，才可改状态 `READY_FOR_A_REVIEW`。**

## 四、七组旧历史 64 项字节级防回归与新 2 项

B 以 GitHub `main` 原始 Workflow 与七份 F05-7 新冻结 Workflow 逐字比对从 `jobs:\n` 到 EOF，**七组均完全相同**，真实长度分别：

| 正式旧回归批次 | Job 数 | 完整冻结正文字符数 |
|---|---:|---:|
| H52 | 52 | 510382 |
| I2 | 2 | 1969 |
| J2 | 2 | 1981 |
| K2 | 2 | 2012 |
| F05-4 | 2 | 2015 |
| F05-5 | 2 | 2012 |
| F05-6 | 2 | 2045 |
| **旧合计** | **64** | **100% 逐字符一致** |

第八份新增 Workflow 为 `match-source` 与 `match-https` 两项真实独立 PG16 Job，总门禁 **66/66**，最终必须是八个同一末 SHA 的官方完整 success，**0 skip/fail/pending**。

原 H52 本身接近 GitHub YAML **512000 字节**极限：不能缩短冻结正文，只将新 Workflow 的触发头写为窄分支 glob `feat/f05-7-deterministic-matching-readiness-four-*`，实际整个 YAML **511999 字节**，包含指定 B 分支但不改变源签历史 Job 一字。该触发头仅属于新增 F05-7 工作流，A 应独立复核是否仍符合授权范围。没有改动旧 H52 本体。

本批还引入**只读** GitHub Actions 原生 REST 审计 `ci-verify-workflows.mjs`，由新 Source Job 的最小 `actions:read` `GITHUB_TOKEN` 检查**同最终 SHA**的七旧工作流/每个原生 Job、当前新增 HTTPS Job 真正成功，所有审计都写进本批新 Source 原生 artifact。该脚本不批准合并、不修改仓库、不会记入任何生产权限。

## 五、生产 SOURCE_GAP 与禁止宣称事项

- 微信 Customer 会话/身份签发与真实手机号授权未闭环；
- 正式 CustomerLevel 找车权益/Employee 人工激活、销售描述及 Rule Dictionary 管理权限 Issuer 未闭环；
- 正式客户展示数字售价/Recommendation 免费查价来源和 Employee 加次真实 Issuer 未闭环；
- 普通批发车通用 Owner Scope、隐藏原因重算、图片本地化、JYT/电话/资金及生产集成未放行；
- 不能把高 `Match Result` 自动变成 Recommendation、Priority、Grant、Lock/资金或 Customer 详情可见；
- CI 完成只表示可抛弃 PG16/本地 TLS 安全合同通过，**不是 F05 全域、C-H01、高保真或 V1 产品上线验收**。

## 六、B 最终交接程序

1. 以本文档所在提交及其后最新 B 分支 HEAD 为唯一目标 SHA，运行全部八组真实 Actions；不能将本文件提交前的 Actions 凑进最终 66 项。
2. 由 GitHub 原生只读审计自动核七旧组 64/64、新 Source/HTTPS 2/2，且**同 B/PR 终 SHA**，两份本批 artifact 非空未过期；逐项核原生真正 PG16 与哈希/SQLSTATE。
3. B 在 PR #46 的中文最终交接评论提供完整 SHA、八 RunID/计数、两个 Artifact ID/字节与 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`，解除 Draft 后由 A 独立验收；未到门禁则维持 Draft 与 `B_IN_PROGRESS`。
4. **B 不自行合并 `main`，不启动 F05-8/F06 或生产。**
