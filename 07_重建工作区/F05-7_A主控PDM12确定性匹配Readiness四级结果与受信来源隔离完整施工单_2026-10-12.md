# F05-7｜A主控正式完整施工单：PDM-12 Matching Readiness、确定性规则解析、四级结果、同源受信隔离（CI-only）

> **正式放行：`F05_7_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B / CI_ONLY / V1_NOT_READY`**（2026-10-12）。B仅在本施工单覆盖的新CI专属目录与新workflow内施工，从执行时GitHub最新`main`创建指定`feat/f05-7-deterministic-matching-readiness-four-tier`；施工包内部开发、测试、修复、原生PG16证据和中文交接一次性完成，不逐项请求用户批准。未经A正式独立验收及标准合并不进入F05-8、F06、生产。

## 一、当前真实依赖及唯一产品Authority

1. 一级正式产品权威：`07_重建工作区/PDM-12_最终完整规则.md` §§1–34，尤其§§2–9匹配资格/四级结果，§§10–16字段/来源证据，§§17–20 hidden/Lock/下游关系，§§21–30 Rule Dictionary/权限/当前结果/事件重算，§§32–33共用解析与搜索差异。联动`PDM-11`已通过的Application≠Demand、Demand `active`≠`matching-ready`、PDM-10客户展示价格、PDM-02/F03权限、PDM-04 Vehicle listing_cycle、PDM-13/14 Priority及Recommendation不自动授予、PDM-18 Lock、PDM-25不可变审计；工程路线`B工程完整施工路线图_F01至F08.md`。
2. 继承main经A正式标准合并PR45的F05-6 CI v22独立Application/Demand、有效Customer/find entitlement与真实Employee Session；历史F05-3B至K Vehicle/Preference兼容、F05-4 v20价格权益、F05-5 v21 Employee免费加次。**必须先通过原M94及全部已签v15～v22历史20版本/cat SHA，不重新写原迁移、业务源或旧CI。**
3. 本批只授权**PDM-12确定性Matching最小可信业务内核/物理来源审计**。不在同批一口气实现整个Rule管理后台、真实Vehicle数据采集、所有车况规范化、规模化重算任务或F05-8 Recommendation/CRM；没有生产受信源的地方必须保守拒绝并准确报告SOURCE_GAP，可用签名合成只在完全隔离PG16证明算法，不得将`CI_SYNTHETIC_*`命名为生产Issuer。

## 二、F05-7A｜真实受信物理对象与Rule来源审计

1. 在M94+v22**真实非superuser独立PG16**上查找并据实建立`Demand/MatchingReadiness/Matching Conditions/Matching Result/Rule Dictionary/Vehicle/listing_cycle/平台hidden/真实可售/active Lock/客户展示价`的物理对象与当前列名、索引及审计、身份/Scope能力来源矩阵。**严禁凭文件标题猜表、猜列、猜Role/写Permission已存在。** 输出`F05-7_PDM12规则匹配受信物理来源矩阵.tsv`、`Readiness四级结果与SourceGap裁决.md`、`Rule_Dictionary确定性优先级与事实provenance时序表.md`。
2. Customer合法active + CustomerLevel 当前找车entitlement ON + 正式active Demand + **真实销售匹配描述已保存** + Rule Dictionary确定性解析得到合法可执行标准条件，才`matching-ready`；新F05-6仅创建的active Demand没有matching-ready，不得凭Customer原始文字/AI猜/默认模板自动通过；pending Application/paused/completed/cancelled Demand一律不能生成current Match Result。受信描述、规则或find权益Issuer缺失时必须显式SOURCE_GAP，不能伪造生产规则许可。
3. Rule Dictionary要求准确区分作用域优先级**具体车型+年款 > 车系+年款范围 > 车系 > 品牌 > 全局**；同级冲突标记pending/unknown，不可按更新时间随机挑胜者；本批至少用合成规则在PG16原生行验证“多值OR、跨字段AND、hard/preferred/tolerance、正反向、缺项不限”、确认unknown局部性。Rule读/改业务Issuer没签的，不暴露生产Rule写；授权Actor必须activeEmployee+独立`matching.rule.manage`/当前DataScope，SystemAdmin与4S业务无自动写权。
4. Vehicle及上游JYT明确车型原始事实与本地mapping分层，local model mapping pending**不能**把明确品牌/车系/年款车型降为unknown；字段证据优先级：结构化事实 > 检测结果 > 详细车况描述 > 模糊词，保留provenance、不覆盖原始来源，同级真冲突才局部unknown；hidden只是不公开，**真实可售+有效cycle**依然可内部匹配，offline/sold/unavailable与草稿不得列入普通Matching；active Lock不禁产Match Result，但不得借此新Priority或抢Lock，返回合法占用事实。
5. 正式Matching只使用由PDM-10授权的客户展示价，不使用批发价/收车价/内部价；当Demand有预算但最终数字客户价Issuer欠缺，应局部`confirmation_needed`（前提其他hard已合规）；没有预算则不能因为“价格咨询”自动unknown；CI合成合法客户展示价专门标识非生产，预算**≤预算 high、预算内(预算,1.05预算] acceptable、>1.05预算 no_match**，用固定分单位和边界值验算并防浮点越界。不得从客户页面是否已解锁价格推导服务端是否有数字价。
6. 只将真实**匹配结果**和权利授予分离：四级`high/acceptable/confirmation_needed/no_match`，任一已定义hard条件明确失败→no_match；没有硬失败但已定义hard事实不确定→confirmation_needed；hard通过但preferred不符/合法tolerance→acceptable；全满足→high。**不许**看到high立即创建Recommendation、Priority、Customer visibility grant、Lock、交易、价格扣额、Customer owner变更。

## 三、F05-7B｜最小CI-only结果物理签名与并发安全

1. 如真实既有Matching/Rule/Result物理结构足以支持当前实例，使用原签表；不足时**仅本批可抛弃CI隔离库**在全新目录添加`000023`顺序CI-only合成来源/条件/不可变Match Result版本与原因链物理约束（先验完整M94→v22旧20次迁移、catalog SHA和旧迁移账，写后注入回滚及v23完整结构Seal）；绝不篡改原有生产通用Rule表或使生产结果状态看似已成功。
2. 对同一个**Demand×Vehicle×listing_cycle**，使用真实两个独立PG16 backend事务锁/唯一键证明同一匹配事实同一版本只产生一个current result，重复事件/相同requestKey幂等；Rule版本、Demand标准条件或Vehicle事实改变后，旧current结果必须进入历史`stale/invalidated`，其后任何新下游业务只能消费更新的current legal结果；出现重算失败则按PDM-12记录pending retry/failed fact，旧结果不得继续冒充current，避免同时出现两current匹配或用历史高等级争Priority。
3. **真实数据库并发不许mock**：合法重算进行时Customer账号停用/Find entitlement撤权/Demand暂停/Vehicle下架/Rule变更至少覆盖身份或数据权限及对象状态两个独立PG backend锁竞争；给出两个不同`pg_backend_pid()`、真正SQLSTATE `55P03`（或明确可复现SQL级事务顺序）、当前结果生效/失效次序、最终行数/immutable event和原生时钟证据。无法证明正式业务Issuer的更新只用于合成CI可抛弃库，不向生产授权。
4. 明确安全隔离：`matchResult != Recommendation != Priority != grant != Lock`；合成`high`必须不改变Customer详情visibility，不能自动发送推荐/消息。历史Favorite、F05-4价格扣额及F05-5加次账、F05-6 Application/Demand激活/负责人、已有交易和资金行SHA不变。Rule Dictionary测试解析、测试匹配无业务副作用；matching-ready Demand无条件时不得造形式上high的默认结果。
5. 输出完整原生物理`schema-only.sql`、含v23时的新旧迁移链签名+catalog seal、原SQL/data hash、确定性解析解释链（原始描述、规则命中、标准条件、vehicle fact provenance、hard/preferred/tolerance原因、最终tier）、真实双PG进程并发/失效、各类安全SOURCE_GAP与测试原始日志/sha256sums；合法合成正例须显著标记`CI_SYNTHETIC_MATCHING_INPUTS_NOT_PRODUCTION`。

## 四、F05-7C｜Source/HTTPS门禁及完整工程交接

1. 本批Source原生用例至少：Application pending、active非ready、找车Level OFF、Customer disable、paused Demand均不Match；sales匹配描述+实际Rule版本READY；OR/AND、hard/preferred/tolerance/多值、未知hard与no hard限制/空字段不限、四级全覆盖；年款与首次上牌分离、最高里程非最低、颜色/排量/动力/车况排除hard与内饰preferred、六类PDM12排除字段不升级hard；预算100%、105%、>105%/缺正式数字价/无预算；JYT原事实优于本地mapping gap，provenance结构化/检测/描述/模糊词排序；hidden但可售/activeLock可Match，offline/sold/draft不可；同级Rule冲突不猜、同事实输入决定性、Rule有效期修改后旧result stale、部分重算失败只重试失败集合、双PG竞争真锁/幂等唯一性；不动其他业务域数据。
2. HTTPS仅可新建`/__ci__/f05-7/**` loopback非生产入口；Customer伪造Session/微信Code/模型推断权限、员工Cookie和SystemAdmin/4S自行申报Rule权限、任意HTTP输入可控客户展示价或JYT内部价、跨Origin/CSRF/重复Cookie/错误Method/path traversal均失败；未签正式匹配/规则写Issuer时线上HTTP不开放正向/保持403或404。严禁在本批开放真实`/api`规则写/Matching成功端点，或连接真实JYT/微信/电话/钱。
3. 每个本批新独立PG16 Job必须导出原生`schema-only.sql`、完整PG catalog、先前签名历史与新追加时v23 Seal、Source/HTTPS原生日志真实`#fail0`和零skip，两个真实PG16 Backend/SQLSTATE证据、签名规则/Vehicle facts/需求条件/结果解释与version hash、所有源缺口、sha256sums、中文B交接；GitHub**两份本批真实原生Artifacts非空未过期**且同唯一最终B/PR HEAD。

## 五、严格白名单、七组冻结64＋本批2=66同SHA CI强制验收

- **唯一指定B分支**：`feat/f05-7-deterministic-matching-readiness-four-tier`。只允许**新增**`engineering/f05/deterministic-matching-readiness-four-tier/**`和**8个全新专属Workflow**：
  1. `.github/workflows/f05-7-frozen-h52-revalidation.yml`
  2. `.github/workflows/f05-7-frozen-i2-revalidation.yml`
  3. `.github/workflows/f05-7-frozen-j2-revalidation.yml`
  4. `.github/workflows/f05-7-frozen-k2-revalidation.yml`
  5. `.github/workflows/f05-7-frozen-f05-4-2-revalidation.yml`
  6. `.github/workflows/f05-7-frozen-f05-5-2-revalidation.yml`
  7. `.github/workflows/f05-7-frozen-f05-6-2-revalidation.yml`
  8. `.github/workflows/f05-7-deterministic-matching-readiness-four-tier.yml`
- 七组历史正式H52/I2/J2/K2/F05-4/F05-5/F05-6合计**52+2+2+2+2+2+2=64真正PG16 Jobs**，其新增冻结复制品从**最新main对应已签原YAML`jobs:\n`直到文件EOF原封逐字符复制**，只有新workflow触发头改为F05-7分支；H52正文极接近GitHub 512000 bytes YAML上限，**须使用等价最短workflow触发头**而不能删减旧Jobs、注释/脚本或更换为静态矩阵展示。旧迁移000001~000022及任何既有Workflow永久只读。新第八个Workflow恰好2个分别Source/HTTPS完全独立真实非超级用户PostgreSQL16。
- **八条**官方Actions run最终同`head_sha==PR_HEAD==B_final_HEAD`、`completed/success`且作业合计 **52+2+2+2+2+2+2+2=66/66，0 failed/skipped/pending**；旧公共PG16镜像拉取速率限流只允许GitHub官方同SHA成功补跑并留记录。最终两份新Source+HTTPS原生Artifact从最新SHA Run输出且非空有效，真实日志包含ZIP SHA256与Artifact ID；保留本批所有中文B工程交接、测试用例、证据完整性与旧Jobs全文逐字核对。
- B完成工程研发→真PG16测试→自我代码审查→一轮集中缺陷整改→七旧＋一新完整回归→证据归档→PR中文交接，一次做到`READY_FOR_A_REVIEW / NEXT_OWNER=A`；B不得自行合并main或启动下一批，严禁旧F03/F04/F05已签源码/迁移/PDM/C/生产修改。历史CI失败须如实处理，不得借source gap把本应测试的确定性规则全变成静态文案断言；可证实的CI-safe规则必须有真实PG16执行，来源不能签者安全阻断。
- **生产基线继续**：Customer微信/手机号真实授权、find entitlement正式Issuer、Employee人工开通/Rule管理Issuer、正式客户数字价/Recommendation免费Issuer、Employee增额、普通批发Owner范围、隐藏原因重算与图片资产化、外部JYT/电话/资金/C-H01均未放行；F05/F04生产和名邦V1仍为`NOT_READY`。
