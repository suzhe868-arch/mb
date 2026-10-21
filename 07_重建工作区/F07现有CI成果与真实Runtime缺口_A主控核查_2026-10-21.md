# 名邦汽车 V1｜F07 已验收 CI 成果与真实 Runtime 缺口｜A 主控核查｜2026-10-21

> 核查性质：A 只读盘点、复用既有验收事实、为下一 B 阶段确定精确施工范围。没有新增产品规则、没有开放生产权限，也没有重新验收历史 F07 CI 包。

## 一、既有成果：直接复用，不重复施工

| 阶段包 | GitHub PR | 已合并 SHA | 已验收范围 |
|---|---:|---|---|
| F07-1 Collector 发布人电话回传与缓存权限合同 | [#64](https://github.com/suzhe868-arch/mb/pull/64) | `404c02c752e8bf6e4b27b8502ed4385027ff72e5` | 隔离 CI 合同；真实 F03 电话正向授权仍缺失 |
| F07-2 车辆图片路径、受控 CDN、资产化与报告权限 | [#65](https://github.com/suzhe868-arch/mb/pull/65) | `8ff3c5b4623585a33bb8f0bc733f94939eef7493` | Mock CDN/Storage 与真实 PG16 安全合同 |
| F07-3 F03/F05 签名父来源、电话/图片跨域门禁 | [#66](https://github.com/suzhe868-arch/mb/pull/66) | `d90fcaa8e4e636668d6b0c1d07b4f2609a0f6a6c` | 真实父来源拒绝与来源缺口分类；F05 转换正向源仍缺失 |
| F07-4 通知、SLA、DND、Incident 与 Mock 飞书 | [#67](https://github.com/suzhe868-arch/mb/pull/67) | `5f1e60ddd87472c7b90e230a8363db7c89a35911` | 非生产通知合同；无真实 Feishu/签名业务事件 |
| F08-1 跨域质量证据门禁 | [#69](https://github.com/suzhe868-arch/mb/pull/69) | `3c32c845939ce7b51dd18814e212c4bf0942aecf` | 非生产 Node+PG16 质量工具，后续直接复用 |

上述历史 PR 已关闭且合并。其测试和报告均为既有已验收资产；下一施工不得把它们重新复制成新包、重复跑全量历史套件或将旧 CI 结果冒充新 Runtime 证据。

## 二、A 对当前应用代码的差异核查

只读核对当前 `main=86f59431768f393232b8746cd3deb62f1044d85c`：

1. `engineering/src/app.mjs` 当前提供的 Handler 注入点覆盖 F03/F05/F06 等既有路由，但没有 F07 电话、图片、可信父来源、通知四域 Handler。
2. `engineering/src/server.mjs` 当前有 F03/F05/F06 的受控非生产 Runtime 分支，没有 F07 Runtime 启动分支。
3. 当前 `engineering/src/` 没有 F07 Runtime 模块；四个已验收 F07 实现仍位于 `engineering/f07/*-ci/**`，它们使用专用 CI 环境、独立侧车数据库和 Mock/合成来源，不能直接等同于主应用真实 Runtime。
4. `engineering/src/config.mjs` 保留 `F01_PRODUCTION_NOT_READY` 生产拒绝门禁，下一包必须只读保留，不得以“集成”为由解除。
5. 当前 F06 Issue171 已按 [最终报告](F06_Issue171_PR174最终独立验收与合并报告_2026-10-21.md)接受并合并；其非生产成果可作为父依赖，不重新施工。

## 三、必须保留的真实来源缺口

- **电话权限**：PDM-09 已冻结上游发布人身份、Collector→名邦回传方向及独立敏感能力要求。但当前已签 F03 能力目录未证明 `publisher.phone.sensitive` 的合法正向授权；`TECH_ALIAS_PENDING_A` 必须继续 FailClosed。不得自行新增/批准权限、直接调用 JYT 或把合成号码当真实号码。
- **F05 转换正例**：现有证据明确 `F05_CONVERSION_POSITIVE_SOURCE_GAP`；不能凭合成 Vehicle/ListingCycle/Lock/Transaction 生成可信转换事件，也不能据此启动真实图片资产化。
- **图片 CDN/OSS**：PDM-08 的 path、首次冻结、受控域名、双成功资产化与报告权限规则继续有效；真实 JYT 来源、CDN 回源、对象存储/密钥、私有报告网关及生产迁移没有授权。
- **通知来源**：PDM-23/25 继续是唯一产品规则。真实 NotificationConfig/Feishu Identity/Route 与签名业务事件源仍缺失；`INCIDENT_SIGNED_ISSUER_SOURCE_GAP`、`SLA_EVENT_SOURCE_GAP` 等不能改写成成功。禁止真实飞书 Webhook、外网发送或客户消息。
- **全局状态**：上述缺口意味着即使下一包非生产 Runtime 接线通过，也只能接受包级工程成果，不能宣告 F07 全域或 V1 生产 READY。

## 四、A 的下一阶段技术裁决

下一 B 包定为 `F07_NONPROD_RUNTIME_INTEGRATION_01`，只将四域合同接入当前应用入口，并以真实非特权 PG16、loopback TLS 和受控 consent 验证实际路由、来源复核、状态不变性、幂等/回滚及 FailClosed。已有四个 F07 CI 合同只作为规范和历史验收依据；新增测试只覆盖集成入口与受影响路径。

施工白名单限定为：

- 新增 `engineering/src/f07-runtime/**`；
- 新增 `engineering/f07/nonprod-runtime-integration/**`；
- 新增 `.github/workflows/f07-runtime-integration-nonprod.yml`；
- 对 `engineering/src/app.mjs`、`engineering/src/server.mjs` 作最小、可选、默认关闭的接线修改。

其他旧 F07 CI、F03/F05/F06 业务实现、正式 PDM、公共 Schema/Migration、生产配置和 C 轨均只读冻结。该包不接真实外部服务，不引入新产品规则，不批准缺失的正向权限；遇到缺失签名源时必须保留 `SOURCE_GAP` 并拒绝。

## 五、责任与验收边界

- Issue #178：[F07 真实应用 Runtime 四域接线](https://github.com/suzhe868-arch/mb/issues/178)。
- 指定 B 分支：`feat/f07-runtime-integration-nonprod-01`。
- 正式放行以包含施工单与状态更新的 A 治理 PR 合并 main 后生效。
- B 完成最终 SHA 的双真实 PG16 Job、HTTP 黑箱、精确路径/语法门禁与证据归档后交 A 独立验收；B 不合并 main、不修改主控状态文件。
- F06/F07/F08/V1 总体仍 `NOT_READY`。F08-1 已验收成果直接复用；F08 完整阶段正常验收后，B 后端最终整体验收、风险评估与后续调整由 A 独立负责。
