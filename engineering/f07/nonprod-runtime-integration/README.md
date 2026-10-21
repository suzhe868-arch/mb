# F07 非生产 Runtime 四域接线

## 目标与边界

本目录为 F07_NONPROD_RUNTIME_INTEGRATION_01 提供应用入口级集成证据。复用已验收的 F07-1～F07-4 合同工具，不修改旧 sidecar、F03/F05/F06、正式 PDM、公共 Schema/Migration 或生产配置。

专属路由统一位于 /__ci__/f07-runtime/**，只有同时满足以下条件才会注册：

- F07_RUNTIME_TEST_CONSENT=I_AUTHORIZE_DISPOSABLE_F07_RUNTIME_ONLY
- GitHub Actions 的真实 push 事件、指定仓库、指定分支及真实 Run ID
- 固定 loopback PostgreSQL 16 测试 DSN、真实数据库身份和非超级用户角色
- APP_ENV=test、NODE_ENV=test、本地 HTTPS 证书和隔离的 F03 测试库

无 consent 时，原应用路由不变；production / NODE_ENV=production 仍由原 F01_PRODUCTION_NOT_READY 拒绝。Runtime 不连接 JYT、Collector、CDN、OSS、Feishu、微信或公网，也不发起系统拨号。

## 四域入口

- 电话回调：复用 F07-1 验签与时间窗合同，使用 source_platform + upstream_publisher_id 作为复合身份，只接受 TEST-123456 类合成值；缓存不向 latest/dial 暴露。
- 图片 path/CDN/资产化：复用 F07-2 path/CDN 合同与本地 MockStorage/MockCDN；资产化仅允许 CI_SYNTHETIC_ONLY，验证双成功、幂等、原始顺序冻结及失败补偿。
- 可信父来源与电话权限：每次调用当前 F03 读取器，并尝试核对 F05 当前转换迁移/车辆链。当前缺少电话敏感能力正向授权、合法 F05 转换正向源和对象 scope，因此必须 FailClosed。
- 通知/SLA/Incident：复用 F07-4 allowlist、DND 和 deep-link 守卫；仅写入隔离数据库中的 QUEUED_LOCAL_ONLY，没有 Feishu 发件器。SLA 和 Incident 缺少已签父事件时保留 SOURCE_GAP。

## 官方验证

本 Runtime 有意要求真实 GitHub Push Run 的 Ref/Run、PG16 物理身份和 TLS 路径，不能通过伪造环境变量宣称通过。正式证据由 f07-runtime-integration-nonprod.yml 的两个独立 PostgreSQL 16 Job 生成。

此包的接受状态不等于 F07 全域、F08 或 V1 READY。所有来源缺口见 SOURCE_GAP与外部授权依赖台账.tsv。
