# F03-V｜M94 与 G000014 两份真实 PostgreSQL 16 物理封印及安全组合边界

> 2026-10-10。唯一权威：A正式工作包V、M/N/G/P已A签收工程资料、PG16原生结构目录、迁移manifest和真实Actions工件。以下为CI合成隔离，不是生产授权。

## 两个版本不能混为一份

| 验证项 | M94/P/N 所用 000001～000013 | G 工作包所用 000001～000014 |
|---|---|---|
| 数据库 | 每Job独立非特权 PostgreSQL 16 `f03_auth_test/f03_ci` | 每Job另建独立非特权 PostgreSQL 16 `f03_auth_test/f03_ci` |
| 表 / 列 / 约束 / 索引 | 94 / 608 / 435 / 163 | 94 / 608 / 435 / 163 |
| 全目录对象 | 2120 | 2120 |
| 完整schema SHA | `7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659` | `863538a8dd81e85c8f50bec2d18ad714f6c3d87abf3b10844a3c80421d54cdb1` |
| 差异 | 原始已冻结 | 仅 `handover_batches.handover_batches_status_check`、`handover_items.handover_items_status_check` 的合法 `completed` 枚举 |
| 版本意义 | 原P车辆/客户价格投影与N七类只读账本、独立H～M各旧版本回归 | G 允许SG06项目/批次真正completed及人员计划治理CI受限路径 |

G新增迁移`engineering/f03/runtime-governance-closure/000014.sql`与`000014.manifest.json`属于**已正式A验收的旧文件**，V不编辑；其SQL checksum `a07b5635ad887cd73905d3df64b25a5b77f187a04b83d38dcca9ccef64793c66`。在每个V额外Job分别执行相应`migration.mjs verify()`和反向不匹配测试。**M94上验证G必须拒绝；G14上验证M94必须拒绝**；不能把M94 `verify()`放宽到G，也不能绕过M94 seal直接调用P服务冒充联合认证。

## CI作业与原始物理证据来源

1. 旧17项每项使用自身真实旧PG16新库，不能“在G14大库合并重跑旧测试”。
2. 新G1/G2/G3三个单独PG16库，先执行旧M94 N只读/不可变真实H收据链验证，再施加经A允许的两CHECK状态变更，再各自独立执行16/7/4原版PG16测试。
3. 新P1/P2两个单独PG16库，均止于M94，P1 10项和P2 11项原版PG16测试，旧来源字节/全目录封印完整。
4. V-Evidence在第23个独立新M94 PG16实例，先跑原P1全部测试，再运行V1的矩阵/当前授权/客户价格/4S对象拒绝/失活缓存/物理逆向版本测试；独立生成自己的原生schema-only SQL、full-catalog JSON、旧M94 inventory、SHA256与测试日志。
5. V-Composition在第24个独立新G000014 PG16实例，先跑原G1全部真实测试，再跑V2真实Customer收据→completed→人员计划撤权、Priority拒绝、合法后继和金钱不变断言；再次生成原生schema-only SQL、G14 full-catalog JSON、旧SOURCE、SHA256及新旧差异证明。

原来源Run：P #38024572379（M94）、G #38025357614（G14），N/M原始真实SOURCE归档在`engineering/f03/runtime-handover-reconciliation/evidence/`及M的evidence目录。V Job必须保留**自己的 GitHub Actions run ID + final HEAD + artifact ID**，不能把既有 G/P artifacts 当V新实测结果，不得截图或重采样替代原始SQL。

## 硬性拒绝和下游契约

- 新客户报价`entitlementAttested`仅为CI合成标签，不是微信身份认证或正式F05额度状态；未知正式模式、quote来源及可重用额度必须拒绝/推迟。
- G14有效H收据不能替代P所需的**真实Vehicle→Team/4S商户归属**，且Manager拥有CRM范围不能推导独立Vehicle读/导出权。原P员工对象出口在M94事实不足时只回`P_VEHICLE_SCOPE_UNPROVEN`且无`fields`。
- G合成账号停用/调店与真正业务HTTP、正式员工授权、资金退款、JYT发布人号码不等价。正式操作仍需要F04/F05/F06/F07新签消费者合同，**V不得迁移/上线生产**。

在V CI最终确认的真实24/24结果前，本文件仅描述受控验证设计；阶段接收权始终归A。
