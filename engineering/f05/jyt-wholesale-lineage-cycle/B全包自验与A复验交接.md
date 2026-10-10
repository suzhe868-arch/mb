# 名邦汽车 V1｜F05-3B B全包自验与A复验交接

> 工作范围：F05-3B A正式施工单。状态：B已实施源码与独立CI闭环；最终交A的必要条件为最终分支HEAD=PR HEAD=本分支专用40/40成功run.head_sha。本报告不得替代A独立验收，不授权生产。

## 一、来源、分支、边界

- 正式起点：2026-10-11 最新 main 55d3fb2c54d9a4aac5a4fdb0121a2a4d035de212；F05-3A PR32已合并、旧38个真PG16作业成功。
- 专用工程分支：feat/f05-3b-jyt-wholesale-lineage-cycle。没有修改main。
- 允许差异：engineering/f05/jyt-wholesale-lineage-cycle/** 及 .github/workflows/f05-3b-jyt-wholesale-lineage-cycle.yml。未修改000001～000016、已签38旧CI工作流、PDM Final/IA/Low-Fi、旧工程、production server、C设计。
- 来源依据：PDM-04 Final 第3～5、11～13、16节；PDM-02、06、09、22及A正式施工单。真实JYT Token、电话和资金未读取或调用。
- 新000017仅一次性隔离PG16追加DDL。仅带CI/GITHUB_ACTIONS/test/特定数据库/非特权账户及封印才能运行；实生产DDL禁止。

## 二、实现合同与防回归

1. 受信身份：真实F03 System Admin Session 只做控制平面签发/停用名邦合成同步API凭据。后续请求使用独立高熵名邦API Credential，数据库只存SHA256散列；不拿员工登录/JYT上游Token/Collector电话授权当同步凭据。
2. 数据模型：来源唯一(JYT,car_code)与稳定vehicle_id绑定，源身份核心brand/series/model/year不可回写；上游模型映射必须真实物理一致；事件收据、控制面审计、HTTPS调用日志不可修改/删除。
3. 周期：首次JYT入库同事务创建Vehicle、ListingCycle、lineage及收据；同car_code更新不新建；offline结束当前Cycle；offline→active在同Vehicle新建Cycle；hidden/普通更新不产生新Cycle。
4. 安全隔离：上游同步不覆盖hidden、已有Customer/Lock/Waitlist/Transaction等本地业务；错误核心身份拒绝并留来源异常收据；历史已转名邦的car_code即使核心身份冲突也优先自动屏蔽，不人工恢复批发、不新建Vehicle。
5. 三固定接口：新增更新、批量下架、在售源集合；独立启停，真实TLS环回，仅来源Credential可调用，严格请求字段、方法、Host/Origin/大小及本机请求频率边界；分页安全字段仅carCode/vehicleId/listingCycleId。
6. 审计：合法同步事件只记INTEGRATION；System Admin控制平面签发单独记SYSTEM_ADMIN；TLS被拒绝和通过调用均记方法、接口、数量、状态，不存明文凭据、VIN、用户行或发布人电话。

## 三、真实测试矩阵与正式来源

- 2026-10-11 首轮隔离CI [Actions #38091494812](https://github.com/suzhe868-arch/mb/actions/runs/38091494812)：run.head_sha=c6e37db05f1ba21cd13cd3743eea7cb4b26a4385，官方40/40独立PG16 jobs全部success，包括新A物理与新B真实TLS。此轮后又增加了B自审定向整改，因此**首轮run不能替代最终同SHA验收**。
- 最终专用工作流：.github/workflows/f05-3b-jyt-wholesale-lineage-cycle.yml，保留旧38个作业原文不变，新增A/B两个实际独立PG16环境、不同后台会话、独立原生Actions Artifacts。
- 新A测试：隔离000017注入回滚、真实版本目录、System Admin角色与凭据隔离、三接口开关、模型数据源空缺、首次导入/去重/幂等/hidden、offline/relist周期、核心冲突及转名邦抑制、批量下架、两个不同PG backend通过55P03真实争锁、credential撤销及不可逆。
- 新B测试：真实环回TLS受信System Admin发Credential、3个固定端点、伪造JYT/Employee/Cookie/Host/Origin/Header负例、分页字段脱敏、实下架与源再查询、撤权/跨身份、不可变HTTPS成功与失败调用日志。
- 原生证据应包含原生PG16测试日志、schema-only.sql、full-catalog.json、inventory.json、versions-and-source-diff.json、SHA256文件、权限来源矩阵以及CI自身head_sha；不能以本Markdown或测试断言文本冒充Artifacts。

## 四、B反向安全自审

- 未改旧签收工作流和迁移，没有回写冻结Authority或恢复已废弃权限；只新增本批白名单内文件。
- JYT car_code不可当名邦VehicleID/Owner/publisher电话授权；System Admin不参加员工Vehicle业务执行；4S不获得批发敏感价/Token。
- 更新与批量下架持现时凭据+接口开关读锁，并按car_code获取PG advisory事务锁；管理端关停/吊销与在途请求可通过行锁序列化，不能凭旧授权复活。
- 真实来源凭据和请求体没有写入日志；HTTP 审计错误时不返回业务成功。敏感账户字段、内部价、VIN及资金数据不进入API输出。
- 源转换后特殊冲突处理优先级已经额外定向复核，并新增与普通异常不同的正反回归。

## 五、SOURCE_GAP及交A门禁

**SOURCE_GAP_BLOCKED_FOR_PRODUCTION**：本工程只创建已登录、已签版本验证的CI合成名邦同步主体，不拥有真实JYT/Collector账号、生产名邦同步控制面凭据、真实采集事件、真实图片或资金。不能将CI 40/40与真实业务上线相混淆。任何需要生产API或真实第三方连接的工作须单独授权；F05-3C一键转名邦不得开始。

交A条件：必须在最终代码/报告/Workflow全部提交后再确认同一最终SHA的40/40成功运行、两新原生Artifacts未过期、旧38 job原文不变、PR差异只在新白名单内、PR HEAD/branch HEAD/run.head_sha相等。条件满足则状态为 READY_FOR_A_REVIEW / NEXT_OWNER=A；否则维持B整改，不得报PASS。

F05全域、F04真实生产API、C/H01高保真设计和V1整体基线仍为 NOT_READY。
