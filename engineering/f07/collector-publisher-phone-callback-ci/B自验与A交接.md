# F07-1｜B工程自验与A独立验收交接报告

> 2026-10-15｜任务：`F07_1_COLLECTOR_TO_INTEGRATION_PUBLISHER_PHONE_CALLBACK_CACHE_SCOPE_CI_ONLY`
>
> **B结论：B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A（以本报告所在最终SHA的两项GitHub原生CI成功为生效条件）。**
>
> **产品/上线：F05 / F06 / F07全域 / V1 = NOT_READY；生产访问与正式Integration API接线均未授权。**

## 一、授权及分支边界

- 唯一基准：A现行正式施工单 `07_重建工作区/F07-1_A主控Collector发布人电话安全回传与缓存权限合同_CI隔离正式完整施工单_2026-10-15.md`；开工main `f8af03e45de11bf2ac3adda13027005c2939a5f0`。
- 本批分支：`feat/f07-1-collector-publisher-phone-callback-ci`；草稿PR [#64](https://github.com/suzhe868-arch/mb/pull/64)，对main，未合并。仅**新增**本目录及 `.github/workflows/f07-1-collector-publisher-phone.yml`；没有改主线、冻结父SQL、正式PDM/IA/Low-Fi、旧CI、正式生产API或权限位。
- 已签Authority：PDM-09 最终§1～14，PDM-02最终§4，PDM-04车源转换、F03 `engineering/f03/policy.mjs` 的 `vehicle.publisher_phone.read/latest/dial`（真实只读导入授权器），F04 当前路由及旧Collector禁恢复合同；PDM-25审计仅合成覆盖。

## 二、实际提交的业务行为

1. 入站方向严格 **Collector → 名邦隔离 HTTPS Handler**，模拟签名凭据；名邦不向Collector旧Phone API/JYT直接取号。强校验签名/HMAC、五分钟时间窗、nonce、唯一request_id、字段白名单、发布人和任务关联；恶意新字段、伪签、超时、跨发布人换键及同Key异Payload均拒绝。绝不涉及真实采集凭证或实际号码。
2. `source_platform + upstream_publisher_id` 为publisher缓存复合主键；缓存与历史分开、只允许 `TEST-123456` 类合成号码，单个publisher唯一pending请求；普通缓存命中不触发取号，主动latest真实建任务，无效或失败不删除旧缓存；旧回传不能覆盖更新结果。
3. 敏感操作时按数据库当前Employee、Session版本、role、个人DENY、数据范围、Vehicle `source_type=wholesale`、状态、listing重验，并调用F03已签 `authorize` 作额外拒绝门禁。拒绝4S/System Admin作为员工业务身份、撤权/旧会话、无权限、越scope、转名邦/4S、无publisher。只返回允许的当前缓存及 `SYSTEM_ONLY` 拨号器抽象；普通公开投影不带电话。
4. 独立非特权PostgreSQL16 sidecar的Publisher行锁、pending唯一索引、历史与审计同事务、收据nonce与request唯一约束、审计/收据/历史UPDATE与DELETE触发器拒绝；双Backend同request回调等待锁后重新检查已提交收据，保证单次写入、幂等重复与异体冲突拒绝。
5. 独立PG16服务容器**真实重启**，在前后比较缓存SHA、history、receipts、audit数量，验证重复签名回传不增写、旧issued_at回传不能倒灌。对伪造号码注错验证SQL事务ROLLBACK后缓存/history/audit SHA不漂移。

## 三、真正执行的测试及官方证据

### 完整功能代码冻结点

- 证据提交：`012df1b80d9297bd4701350c65c075ca9fe6886d`，原生 [Run 38702053603](https://github.com/suzhe868-arch/mb/actions/runs/38702053603) 为**push**触发且结论为`completed/success`。
- Source Job `116312343258`：40项独立业务安全、权限、并发PG16用例全过（Node Test Runner显示40子用例加1父套件：`41 pass / 0 fail`）；真实不同PG Backend PID `81 / 80`、txid `986 / 987`。
- HTTPS Job `116312343488`：15项loopback TLS黑箱用例全过（15子用例加1父套件：`16 pass / 0 fail`）。两Job均在GitHub服务`postgres:16`以`f07_ci`实际`rolsuper=f`运行，不是Map或伪PG。
- 真容器重启前PG启动时间 `2026-10-15T07:56:30.955Z`，重启后 `2026-10-15T07:56:48.676Z`；重启核验PID `84→34`，`F07_RESTART_REAL_PG16_PERSISTENCE_REPLAY_STALE_PASS`真实日志绿。
- 上述同SHA两官方工件均未过期、非空、有GitHub服务端SHA256：Source `11957335009`、2347字节、`a3e5174fff73cb7334ff5ee76da84c9770e3adeb916524f36ac16bc4e7a886b6`；HTTPS `11956975552`、1209字节、`bcc4a2cd68252e6ca12e2f37ba5a473b1dab89d638899a9c8e4cd020e33b2c48`。此系GitHub官方摘要元数据核验，未声称逐ZIP字节独立复算。
- 本报告提交将形成新的唯一PR HEAD；**必须重新核对该最终HEAD的两项新Push Job全部completed/success且对应非空未过期SHA256工件后才能正式交A。** 最终SHA、Run与工件ID在PR最终说明/评论登记，避免提前编造。

### CI问题与修复历史（红证如实保留）

- 首次新工作流因job环境引用不允许的`runner.temp`上下文，未实际登记F07 Run；修正为CI Runner中的固定`/tmp`测试证书路径。
- `8cd01878e022ee884303af3b1386c43c91f6a6c2` [Run 38701113975](https://github.com/suzhe868-arch/mb/actions/runs/38701113975) 真失败：两个Job的`rolsuper::text`返回`false`而脚本错误断言`f`；更正为PG标准布尔输出`rolsuper`，`a4f0d486ba2fda71ec3b8b38edfeac07e812a8ca` [Run 38701266887](https://github.com/suzhe868-arch/mb/actions/runs/38701266887) 两项真实success。
- 随后追加F03已签授权器导入、真数据库restart、双Backend幂等、审计不可修改，用最新`012df...`重跑，全部通过。不得把旧F05/F06历史CI替代F07或声称旧PR checks全部绿。

## 四、B反向安全自查

- 授权：无新`can_call_wholesale_phone`、无car_code电话缓存键、无Customer业务角色取号、无Internal Mode自动权限，操作时按当前事实复核，撤权后缓存留历史但入口拒绝。
- 数据：所有号码均为合成TEST前缀；模拟签名密钥在GitHub runner运行时随机生成，不回传JYT Token；审计不写电话号码，普通响应和公开视图不包含敏感字段。
- 原子性：实际行锁+唯一约束+PG事务ROLLBACK、故障注入、重启前后封印与重新验证；多publisher缓存隔离，同请求回调真正等待后幂等，不用进程内Map冒充。
- 冻结范围：compare验证新增文件均在授权白名单；不变更public物理迁移、F03/F04/F05/F06旧SQL和旧CI。
- B自查结论只涵盖本轮CI-only权限**合同**及合成Handler，不等于A独立验收、不等于生产可用。

## 五、明确未实施与责任边界

- **SOURCE_GAP / CONTRACT_ONLY**：正式Collector身份/来源证明、生产Integration API已有路由的实际上线接线、真正JYT令牌和采集请求、正式publisher缓存DDL、生产Employee/Session/scope数据库适配、真实终端拨号器、真实电话/个人信息/真实业务审计接线，均没有授权，本包不能宣布已连接。
- 未覆盖F07整域CDN/图片/通知/重试及F08、UAT、部署与资金链；F05/F06/F07/V1继续`NOT_READY`。
- 同PR的冻结旧分支工作流若有红灯或ECR基础设施限流，须保留其真实状态并由A评估适用性，本包绝不伪称整个PR所有历史Jobs success。

## 六、A验收建议和退出

A应独立对比main/PR64白名单、签名PDM09和F03的调用条件、真实PG16日志的Source40、HTTPS15、回滚/重启/两Backend、Artifacts最后同SHA及旧工作流实际红证，检查同请求异Payload、nonce、source转换/权限撤回后读拒绝；未通过时据实`A_CHANGES_REQUESTED`，B在同分支修复。

**当本报告所在唯一末次SHA的两项新PG16 Job及同SHA官方Artifacts均通过时：`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。不触发任何main合并、生产授权或V1完成状态。**
