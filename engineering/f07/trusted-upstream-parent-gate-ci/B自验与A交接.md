# F07-3｜B工程隔离CI阶段记录与待终验交接

> 工程包：F07-3 上游来源身份、已签 F03 Session/权限、已签 F05 转换与电话图片跨域硬拒。A授权仅限 `engineering/f07/trusted-upstream-parent-gate-ci/**` 和 `.github/workflows/f07-3-*.yml`。本文件属于**静态设计/自查记录**；真实完成状态必须以后续 PR 中最后同SHA官方CI核对为准，不能把“计划”冒充已成功。
>
> **当前不可预签** `B_SELF_TESTED / READY_FOR_A_REVIEW`，除非原生两Job最后SHA真正成功且Artifact元数据完整。

## 冻结Authority与实现边界

- `08_最终业务基线` PDM-02/04/07/08/09 Final：个人DENY优先、上游publisher复合身份、同Vehicle/ListingCycle转换、报告当前客户可见、图片相对路径/双成功。F07-3不改变这些产品规则。
- 实际复用冻结代码：`engineering/src/f03-auth-service.mjs` 的 `IsolatedAuth.login/withSession`、`engineering/f03/runtime-facts/current-facts.mjs` 的 `readCurrentFacts`、`engineering/f05/wholesale-to-mingbang-conversion/service.mjs` 的 `convertWholesaleToMingbang` 和 `migration.mjs` 的 `verify`。只读导入，不修改父模块。
- `gate.mjs` 把回环PG16、GitHub真实Push仓库分支、当次Run、独立非超级用户和固定DSN设为前置硬门禁；父Session每次签名事实重读、业务始终DENY。签名正确的合成Collector仍须 `PRODUCTION_JYT_JOB_ISSUER_SOURCE_GAP`；无正式技术别名绝不构造allow。
- `server.mjs` 只启动127.0.0.1的临时HTTPS，所有敏感接口只返回统一拒绝；拒绝旧Token、异常/重编码URL、转发字段、Host欺骗，禁止普通客户端获取电话、VIN、报告原件和图片上游域。
- 真PG16 Source：先建立F03-1签名独立库并调用冻结迁移与fixture；之后从零建立**另一个物理OID**，运行冻结F05-3C完整上游父链与000018父迁移；读取父转换关系、只读事务、行锁、错误SQLSTATE、拒绝时审计计数。真实迁移仅可销毁PG16；无生产数据库写入。
- 同一F07-3分支独立PG16 HTTPS：独立Runner启动临时PG16数据库、原F03真Session、一次性回环证书，逐请求重验。至少17条黑箱。

## 业务测试矩阵与预期

- `tests/f03-source.test.mjs`：34条真实PG16+合成Collector来源安全场景。
- `tests/f05-source.test.mjs`：20条真F05已签服务/迁移/只读表结构/并发及硬拒场景。
- `tests/https.test.mjs`：17条真实PG16回环TLS黑箱场景。
- `来源与签名父权限矩阵.tsv`：对父签可验证、只负证、合成、SOURCE_GAP逐项分级。
- `跨域有效场景矩阵.tsv`：全部71条场景的精确测试文件索引，**仅为预期清单，不声称尚未执行的场景PASS**。

## 反向安全审查记录

1. 上游 `car_code` 无法作为电话publisher缓存索引，`vehicle_id`亦不可单独授电话；测试仅合成JYT/Job，永不外呼。
2. `TECH_ALIAS_PENDING_A` 不能通过本CI的模板insert临时提升正式发布人电话敏感权限；F03当前facts即使物理permission存在仍拒绝最终操作。
3. F05父转换仍须本人当前团队Scope、Lock/Transaction业务对象和完整签名Issuing证据。没有这些父源前提时仅可测试真实拒绝，不得造出“真合法转换成功”。
4. 3A、CDN与对象存储、报告`customer_visible`、H5历史URL缺正式物理数据/授权时全部 `SOURCE_GAP`，不能将F07-2 Mock复制成真实图片授权。
5. 当前已签父表只读；对话与日志不输出会话Token、随机HMAC密钥和原件。出站HTTPS只绑定本地回环。
6. 此包不修改`main`、旧Workflow、公共数据库迁移、F03/F05父源码、PDM或生产权限；不使用真实JYT、客户、微信、资金。

## 未闭环依赖和责任

- `SIGNED_F03_PHONE_ALLOW_SOURCE_GAP`：正式敏感能力Alias尚未被A签映射，F03当前Scope/Object没有终态业务授权。
- `PRODUCTION_JYT_JOB_ISSUER_SOURCE_GAP`：缺真实Collector/JYT签发、回传Job/nonce持久化和生产Integration入口。
- `F05_CURRENT_OBJECT_SCOPE / ISSUER_SOURCE_GAP`：转换正向需要业务签名的真实Lock/Transaction上下文，不能拿合成行冒充。
- `IMAGE_CDN_OSS_REPORT_GATEWAY_SOURCE_GAP`：没有真实图片/OSS/CDN、H5私有网关、报告可见性资料和受控回源。
- `H03_H04_F08_SOURCE_GAP`：UI/H03、三端联调、F08总验收、真实UAT/发布均未授权。
- F05/F06/F07与V1保持 `NOT_READY`，从不宣称生产READY。**B禁止合并main**。

## 原生CI与最终签章

本报告设计基线已落在授权分支，最终唯一提交、两Job运行状态、真实OID、通过数量、官方Artifact ID和SHA256、遗留红灯及是否 `READY_FOR_A_REVIEW`，以同末次HEAD核验后PR正式B交接评论为唯一动态证据；本静态文档不填写虚假Run数字。
