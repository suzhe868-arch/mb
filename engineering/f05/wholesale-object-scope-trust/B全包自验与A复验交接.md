# 名邦汽车 V1｜F05-3D 普通批发车对象Scope可信来源核查与安全拒绝

## 当前技术结论

**TRUSTED_SCOPE_AUDIT_COMPLETED_SOURCE_GAP**：正式F05-3D施工单明确“没有可信一般批发车对象Owner来源就不得构造正向”。本批依据冻结000015～000018的实际PG16约束，发现`public.vehicle_current_responsibilities.source_snapshot`通过CHECK仅允许`mingbang/four_s`；合法现时JYT `f05_3b_sync_lineages`仅提供独立上游来源身份，并不是Employee Vehicle管理Owner签发凭据。Team/Role/Capability、JYT发布人/car_code以及员工上传者字段都不足以证明特定普通批发车所有权。因此不创造任何新增授予或假成功转换，不新增000019或生产接口。

## A工作单执行边界

- 正式起点main `382fe3429cfd810c91843f653ea3826489c208af`；指定新分支 `feat/f05-3d-wholesale-object-scope-trust`；只新增本包目录和一个专属Workflow，旧冻结42个Job逐项正文保持原字节；不修改F05-3C代码、000001～000018、PDM/IA/Low-Fi、生产、C设计、`main`。
- `audit.mjs`通过真正隔离PG16当前完整来源约束验证，核正式来源签发是否存在；`checkGeneralWholesaleScope`只产生fail-closed结果`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP`，不能批准转换。对有效名邦Employee还必须验现时Session、个人deny优先级、vehicle.read/manage、Team与数据Scope及带锁的真实JYT车/cycle；未经证明的Employee、SystemAdmin、4S、JYT Token一律拒绝。
- 旧F05-3C有既成本人Lock/活动Transaction的条件式正向**继续按原已签代码实现**，本新包不得替换、重建或虚构扩展。无资金/真实JYT/对象存储行为。

## 真实CI测试及负例

- **新增PG16 source**：D-A01～D-A08，包括真实pg_constraint拒绝人工伪造JYT批发Owner、签源Vehicle/Cycle但无现时对象Scope时拒绝且状态不动、活跃员工也不能从Team推断Owner、现时个人权限deny、两真实PG16 Backend并发对Employee撤权/Vehicle下架的原生55P03竞争，保留先验F05-3C 18/18回归。
- **新增TLS**：D-B01～D-B07，复用原已验收loopback CI-only TLS Handler，对无当前Lock/交易的已签JYT来源一律403；匿名、有效SystemAdmin/4S/JYT Token、无效CSRF、伪publisher/owner、未授权字段、敏感出口/非正式HTTP路线都拒绝，Vehicle/Cycle及现有转换收据真实不变。保留先验C-B01～C-B07 7/7。
- 两Job必须各自独立的非特权PG16服务，按M94→000017真实旧Admin签源→000018原子升级；原生`pg_dump --schema-only`、full-catalog/inventory、sha256sum、原生日志及来源矩阵作为两个独立Artifacts，验证最终B HEAD=PR HEAD=run.head_sha且44/44官方 success后方可交A。

## 需要A独立裁决的唯一来源缺口

要让没有本人Lock/活动Transaction的普通批发车真正出现合法转名邦正例，后续必须正式确定“谁有权签发当前名邦经营责任，签发所依据的业务证据是什么”，并有可追溯、可吊销且与Vehicle/Cycle及员工/Team绑定的**真受信签发Carrier和审计因果**；若没有原始可信依据不得仅凭登录、Team、JYT publisher、车源列表关联或后台人工勾选开关扩权。该缺口应由A依据PDM Final集中判定是否存在技术可解决的可信上游业务来源，确有新产品语义时才交用户集中决定。

**不可关闭的非本包缺口**：`IMAGE_LOCALIZATION_SOURCE_GAP`、`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`、`CURRENT_WHOLESALE_OBJECT_SCOPE_SOURCE_GAP`、`F05_3C_V18_NEW_CAR_SOURCE_MAPPING_GAP`、`SOURCE_GAP_BLOCKED_FOR_PRODUCTION`。

本报告记录的是授权来源缺失时的安全审计成果，不得把测试全部通过写成“普通JYT批发车正式可无锁转换”或V1生产READY。F05/H01/V1继续NOT_READY。最终GitHub验证通过后在PR评论中记载确切SHA、Actions和Artifact IDs并转 `NEXT_OWNER=A`。
