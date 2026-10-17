# F05真实业务整改：首条车辆目录非生产纵切（B阶段部分交付）

**状态：B_IN_PROGRESS / PG16_NOT_TESTED / NO_PR / NOT_READY_FOR_A_REVIEW（2026-10-18 本轮续作审计）。** 此包没有满足F05全部真实业务验收，禁止以已通过的Node HTTP测试替代原PG16测试。

## 代码范围

- `engineering/src/app.mjs`/`server.mjs`：在现有F01单一服务加入仅测试环境可启用的catalog；保留F03 HTTPS独立认证路径。
- `engineering/src/catalog-readiness.mjs`：数据库必须是本机/专属`f05_catalog_test`、用户`f05_catalog_ci`、PostgreSQL 16、实体表真实存在；APP_ENV=test、loopback与精确同意短语必填。**无真实账号时严格无法启服务**。
- `engineering/src/catalog-service.mjs`：物理`vehicles` + `vehicle_listing_cycles`，仅当匿名可见证据存在、没有Priority等显式保护、上架状态正确且未结束归档时200；安全字段白名单、15台Keyset、HMAC不透明游标、当前周期的started_at，默认全国批发。只作安全小范围查询，不伪称7类排序、全部PDM20筛选已实现。
- `engineering/catalog/000027_catalog_disposable_test_only.sql`：**独立临时测试侧表**用于验证物理PG、保护否决、过期和回滚；没有真实业务Issuer，不能上线。原F02/M94/frozen schema未改。
- `engineering/tests/catalog.test.mjs`：Node实际监听127.0.0.1，通过真实HTTP请求，但数据库是注入的替身；必须明确为HTTP单测不是PG16实测。新增 `catalog-regression.test.mjs` 对微秒分页、BIGINT、错位双周期、HMAC及分支权限作攻击回归。
- `engineering/integration/catalog.pg16.test.mjs`：需要真实独立PG16和已播种的M94车辆+当前周期，缺失即非零退出；物理BEGIN/ROLLBACK、HTTP 200、Priority阻断、过期拒绝和泄漏负例。
- `F05_1_to_11_真实交付核对矩阵.tsv`：明确各模块真正未补的生产Issuer及业务接口。

## 自验

```sh
node --test engineering/tests/catalog.test.mjs engineering/tests/catalog-regression.test.mjs
node --check engineering/src/server.mjs
# 仅在拥有独立PG16可销毁测试库时；无PG16不允许声称PASS：
export APP_ENV=test NODE_ENV=test API_HOST=127.0.0.1
export F05_CATALOG_TEST_CONSENT=I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY
export F05_CATALOG_DATABASE_URL='postgres://f05_catalog_ci:...@127.0.0.1:5432/f05_catalog_test'
# 在已封印M94 schema且充分播种业务FK后，以隔离测试身份执行 v27 DDL
export F05_CATALOG_TEST_VEHICLE_ID=<已播种真实VehicleId>
export F05_CATALOG_TEST_CYCLE_ID=<该车当前ListingCycleId>
node --test engineering/integration/catalog.pg16.test.mjs
```

HTTP测试只证明真实Node HTTP协议和响应安全，不证明PG16真实业务。当前运行容器无`postgres`、`pg_ctl`、`psql`、`pg` Node模块，软件包源不可达；PG16集成测试**未执行成功**。
本轮改写真正PG16集成为**writer Client/HTTP reader Pool两条独立后端连接**，先校验事务未提交时对外不可见、后提交可见、Priority写入未提交不改变对外读取、提交后拒绝、撤销恢复、过期拒绝、最后清理自身临时侧表；测试库必须先确认不已有同车测试侧表。该逻辑只有实际PG16可运行后才可计合格。
本轮增加 `pg_catalog.pg_attribute / pg_constraint` 物理字段类型和外键验证，以冻结M94真实字段为基线。测试环境 URI 必须是127.0.0.1:5432、f05_catalog_test、f05_catalog_ci、非空口令，不接受查询参数中host/hostaddr/sslmode覆写或fragment，且严格 APP_ENV=test、NODE_ENV=test。正式Customer/员工Issuer、完整Priority及推荐业务均缺，故F05不可能在本子单标完成，F06按用户最新决策仍暂停。

## 遗留安全与测试

1. **旧历史**Run39035485532仍65/66 + 1 BLOCKED_EQUIVALENCE，PR113仍23/28；这是保留事实，不是本HEAD测试通过。
2. PostgreSQL真实安装/迁移及权限正反例均未在本工作环境运行；A需要审查本子包是否允许在合法独立CI内运行临时PG16，保持Github Actions费用$0。
3. 有效生产Customer身份与图片可信发布/CDN/JYT上游均未授权；不能通过伪造账号/编辑cookie/JWT绕过。
4. **客户端C PR68不会自动可用**，本包无微信实测。

## 本轮新增可验证缺陷修复（相对上一轮10文件候选）

1. 当前上架周期分页游标传递PostgreSQL微秒精度，避免JS Date毫秒截断导致同秒翻页遗漏；真实PG16的SQL语义尚待环境复核。
2. 车辆与周期ID按PostgreSQL有符号64位上界验证，不再将合法BIGINT转换为`Number`。
3. 两个同时活跃的上架周期按**严格拒绝**处理，避免任取一个周期造成越权展示。
4. 健康探针每次检验真实PG16版本、隔离数据库/用户和4张基础/侧表；不再以`SELECT 1`冒充车辆业务就绪。
5. 测试新增输入篡改、跨来源游标重放、敏感字段、断链、双周期、禁写方法与真实HTTP负例，本轮54/54条Node通过，0 skipped。

**正式验收硬界：** 未安装PG16和`pg`驱动、未建立受控测试库/M94种子、未具备可信Customer/正式车辆Scope/外部Publisher，因此尚无“PG16业务真通过”记录。整个F05-1～11非生产全功能仍不具备READY条件，五正式Source和生产继续禁用。

## 2026-10-18 续作（B进度，不是验收）

- **Node本轮：54/54 PASS，0 FAIL，0 SKIP**。仅验证真实 HTTP + 注入式数据库响应；并非原生 PG16。
- **隔离PG16：未真实运行**。两连接语义、物理FK/字段校验、非持久测试侧表清理已写在可执行脚本中；需要真实PG16 + M94测试fixture + `pg@8.23.0`，缺任一应非零失败。
- **实际正式Customer/Employee信任Issuer、F05全模块业务正例、完整查询排序及C联调**：仍未完成。客户非生产查询永远返回`price:null`、`productionReady:false`；未接来源授权的新写操作不予开放。
- **旧Oracle**保持`65/66 + BLOCKED_EQUIVALENCE`，PR113旧签源`23/28`，不可改写。B不启动旧66或F06，不签发Source，不发布生产。
- GitHub分支/PR须在本阶段真正可交付功能和CI路径/费用预检后创建；本地自测不是A验收，不能写`READY_FOR_A_REVIEW`。
