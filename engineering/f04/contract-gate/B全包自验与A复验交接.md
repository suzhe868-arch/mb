# 名邦汽车 V1｜F04-1 B全包自验与A复验交接

日期：2026-10-10（Asia/Taipei）

## 1. 权威与施工边界

- A正式施工单：`07_重建工作区/F04-1_A主控接口合同与安全路由启动完整施工单_2026-10-10.md`。
- 分支：`feat/f04-1-contract-safety-gate`；基点最新main `3dc741b79965329ac20e075d79854af3813ff296`，已包含F03-V PR25。
- B提交仅限`engineering/f04/contract-gate/**`与`.github/workflows/f04-1-contract-gate.yml`，未修改F01/F02/F03业务服务、任何既有workflow、旧000001～000014迁移、冻结Final、正式server.mjs及角色权限种子。
- GitHub Actions每个作业独立新建非特权真实PostgreSQL16合成测试库；F03-1原会话登录保持冻结，F04只在隔离HTTPS 127.0.0.1受限注册。M94和G000014仍分别封印，未混用。
- 禁生产、资金、真实微信/JYT/飞书、客户资料或第三方账号写入；没有新DDL，没有正式生产路由。

## 2. F04-1A：旧218接口资产核账

- 原始`09_历史工程资产基线/01_ENGINEERING_STARTER_LEGACY/packages/contracts/openapi.yaml`共18,459行，**136路径、218组method+path**。
- `legacy-endpoint-inventory.tsv`逐项记录LEGACY-001～218原源文件及精确行、方法、路径、operationId、原声明identity/permission/scope/projection/idempotency，以及建议责任域。
- 所有218条均`CONTRACT_ONLY`，不是生产路由，也未推断业务实现。旧资产数量无数量性缺口；旧实现真实性、Current IA的页面到路由一一对应、PDM逐条产品最终授权尚不能仅由旧OpenAPI证明，仍按`SOURCE_GAP/OPEN_DEPENDENCY`留给F04后续路由批严格核定。
- 现行受限路由合同`current-route-contracts.tsv`：R01真实PC会话证明；R02员工车辆对象scope安全拒绝；R03当前员工为客户owner且独立CRM权限、个人deny和动态Team/Store均有效时才返回最小customerId；R04～R09不具备生产真实性，一律`OPEN_DEPENDENCY`。
- `contracts-inventory.test.mjs`逐行回读218组OpenAPI源行、真实PG16 M94及当前合同，不补造第219项。

## 3. F04-1B：安全路由测试

- 新`safe-router.mjs`不被正式`engineering/src/server.mjs`导入和注册，必须同时具备GitHub Actions + CI明确隔离环境、F03合法会话、127.0.0.1 TLS、可信Origin/Host和完整旧M94实体/原始迁移封印才允许测试启动。
- 原冻结Cookie解析、token撤销、账号当前状态、角色、当前owner/Team、个人deny和F03-P车辆投影对象拒绝真实调用。
- HTTP成功只为当前有效会话与**当前owner限定的最小CRM客户ID合成读**；不返回客户电话、历史、VIN、内部价、PublisherID或真实车辆字段。
- 客户车辆/会员价及所有未授权员工vehicle对象信息必拒；旧218路径不由F04新router恢复。未知publisherID / car_code、内部价无scope、4S互管、Lock/Transaction/Refund生产读写不开放。
- GET/POST方法、路径/DTO、重复参数、Origin/Host/HTTPS、Cookie重复、不可复用旧Session、角色/个人deny即时撤权、CSRF及请求键格式等通过显式真实HTTP负例测试；两个独立会话同RequestKey发起的未实现Transaction接口一律拒绝，不伪称已实现实际幂等账本或合法资金事务。

## 4. F04-1C：下游承接/明确未做

- `contract-consumers-F05-F06-F07-H03-H04.md`、`source-gap-and-dependency.md`、`安全拒绝矩阵.tsv`已列可信服务端来源、权限/个人deny、对象scope、不可重放字段、缺证拒绝、各域的未来实际责任。
- F04后续仍需正式System Admin/4S账号管理、客户完整CRM业务HTTP及审计。
- F05真实vehicle→Team/4S商户所属、内部价独立permission+正常编辑、客户等级/可配置每日额度及真实F05原子查价；当前`P_VEHICLE_SCOPE_UNPROVEN`保持硬拒。
- F06真实LockRequest 6h、自动候补、锁车/交易/退款、状态与资金来源、幂等事务仍依赖正式F06。
- F07上游publisher_id取号、图片/CDN、采集与非生产凭据边界待正式F07；H03/H04还需C/H01已通过高保真、消费方缓存撤权及三端联调。
- 这些明确`OPEN_DEPENDENCY`项**不计入F04-1允许实施的成功业务路由**，不宣称F04整体、F03全部业务或产品V1已经验收/上线。

## 5. 原始证据与CI交付验收门禁

- 工作流`.github/workflows/f04-1-contract-gate.yml`完整保留F03-V旧24个独立真实PG16 job及原版用例，新增Route-Security和Contracts-Inventory两个独立作业，共要求**26/26全成功**。
- 首轮已核验`Actions 38028779673`，对应当轮SHA `c70e24f8a597ea486c330f87b55de0bdc243f2c7`，26/26 completed/success，新增路由测试12/12、来源核账测试7/7；首轮是历史佐证，**不得代替最终分支HEAD的同SHA CI**。
- 末轮安全补强新增当前owner正向CRM、CSRF与Host/绝对URL防伪造及双会话拒写；所有受影响新测试必须在**最后B分支HEAD同SHA的GitHub Actions**再次完整成功。
- 每个新job保留原始M94 full-catalog/inventory/schema-only/sha256sums/true-pg16-tests日志，作为GitHub Actions 30天Artifact；旧24个各自独立原始Artifact不替换、不弱化。
- 原生PG16中严格保持94表、608列、435约束、163索引、2120全目录，以及原M94 SHA `7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659`，G14仍保持两个CHECK例外版本；任何结构漂移必须fail closed。
- 完成后审查要求：以分支最终HEAD验证Actions `head_sha`、26个独立job的`conclusion=success`及本单9+文件白名单，再提交A复验；如果末轮未成功，不得标`READY_FOR_A_REVIEW`。

## 6. B反向安全审查

- 已检查：源码路径白名单、业务默认DENY、伪造Origin/Team/4S/客户等级/RequestKey、非TLS、冻结授权与旧域未变、M94/G14物理隔离及跨域旧回归；未将合成成功当成生产权限。
- 所有正向数据仅限CI客户当前owner证明；客户敏感字段、真实Vehicle价格与资金的正向接口**未获授权**，真实下游调用仍保持关闭。
- 当前交付结论必须以最终HEAD同SHA26/26 CI实际结果为准。**若26/26最后通过，则 B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A；否则 B_CHANGES_REQUIRED / NEXT_OWNER=B。**
- B不会创建合并到main的提交，也不代表A独立验收通过。

产品状态：**PRODUCT_BASELINE_STATUS=NOT_READY**；C/H01高保真与正式三端UAT未最终验收。
