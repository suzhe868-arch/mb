# F05-3C｜A首次定向整改的 B工程完整来源核账

> 当前：B已实施双阶段v17→v18真实源与兼容适配；**新最终42/42和同SHA仍须官方CI证实，不可提前报PASS**。全部仅用于独立非生产PG16。

## 已执行的A技术裁决

- 正式 A 整改单：`07_重建工作区/F05-3C_A主控首次独立验收跨版本兼容技术裁决与原PR34完整定向整改单_2026-10-11.md`；[A审核评论](https://github.com/suzhe868-arch/mb/pull/34#issuecomment-6104424172)。首轮失败[Actions #38097826807](https://github.com/suzhe868-arch/mb/actions/runs/38097826807)不能冒充成功。
- ① `ci-prepare.mjs` 在新PG16严格走正式旧版本M94→000017，`ci-run.mjs` 在000018应用前用原F05-3B签收服务及F03真SystemAdmin Session签发独立同步Credential，并由原`syncUpsert`在同PG16创建真实合成JYT Vehicle/Cycle/INTEGRATION收据。此时旧v17链全通过。短期密钥只在同一测试Node进程与被控制子进程内传递，严禁进入文件、Workflow env与制品。
- ② 同一个PG16实际新增000018（含注入事务回滚）、核精确16版schema SHA/版本；旧v17在v18拒绝被保留为正常fail-closed，不篡改000001～000017或冻结38/40旧测试。
- ③ 本包全新`v18-sync.mjs`是**仅CI**的精确v18同步兼容适配，三接口每次实证原受信Credential SHA、撤销与每个API开关，使用同`car_code` advisory锁和原lineage/cycle；普通已受信批发车更新/下架/重上架/分页及转换后旧编号自动抑制做原生正反PG16测试；来源无可信车型映射的新车仍保留新车来源缺口，不冒称旧v17程序可直接在v18运行。
- ④ `service.mjs`仍要求实际名邦Employee Session、vehicle.read/manage+team scope及当前Lock/活动Transaction责任对象；同Vehicle/Cycle、completed拒绝、不会因转换授予上游电话/价格敏感权限，原客户、价格、推荐和查价表按实际存在的物理关系做前后hash。`ci-router.mjs`为环回TLS单动作、CSRF与跨身份拒绝。
- ⑤ 已使用GitHub逐块检查新Workflow的**旧40个Job正文原文完全一致**，清除A指出的唯一多余空行；只追加2个真正非特权PG16 Job。新测试必须产生两原生Artifacts与实际42/42。

## 尚需保持的真实差异

- `IMAGE_LOCALIZATION_SOURCE_GAP`：无真实对象存储字节和object_key双成功，不宣称资产化完成；转换与图片子任务按PDM08 Final解耦。
- `HIDE_REASON_RECALCULATION_SOURCE_GAP`：隐藏原因缺真实物理多原因matcher；保守hidden，不假设人工hidden可解锁。
- `FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`：M94无可核当前Favorite实体。
- `CURRENT_WHOLESALE_OBJECT_SCOPE_SOURCE_GAP`：没有合法当前Lock/活动Transaction承责事实的普通批发车不能凭Team/publisher/car_code推断管理范围。
- `SOURCE_GAP_BLOCKED_FOR_PRODUCTION`：JYT生产、对象存储/真实资金/电话/用户均未连通。v18尚未证明未知新来源车型映射的全量签发能力，仍是条件式CI正向。

## 正式交A门禁

最终分支HEAD=PR34 HEAD=GitHub Actions成功run.head_sha，官方42/42全部success、两份新增Artifacts未过期、schema-only/catalog/inventory/checksum+PG16/TLS原生日志与来源矩阵齐全、文件差异全部在许可目录后，才可声明`READY_FOR_A_REVIEW / NEXT_OWNER=A`。未满足不改main、不标PASS。

---

# 名邦汽车 V1｜F05-3C B全包自验与A复验交接

> 状态：B施工与隔离测试，最终须验证同SHA官方42/42+两份原生Artifacts，再转READY_FOR_A_REVIEW。此文档不是A签收或生产准入。

## 1. 正式边界与分支

- 2026-10-11基线 main `0605319c227cfff2a10b2feb71c678cc0250353a`，由A正式合并PR33并放行F05-3C。指定B分支 `feat/f05-3c-convert-wholesale-to-mingbang`。
- 只新增 engineering/f05/wholesale-to-mingbang-conversion/** 和 .github/workflows/f05-3c-wholesale-to-mingbang-conversion.yml。旧迁移000001～000017、旧40独立作业、旧签工程、Final/IA/Low-Fi、生产Server、C设计未更改。
- 权威来自 PDM-02/04/06/08/09/10/25 Final。没有新增转名邦专用permission，没有以SystemAdmin、4S、JYT的Token代表Employee操作。

## 2. 实现及真实来源范围

- CI-only 000018只附加不可变单向转换收据与审计并守卫原Vehicle不能反向wholesale；没有新建第二个Vehicle或重建ListingCycle。
- 业务动作使用真实F03 Employee Session，经现时team membership、`vehicle.manage`+`vehicle.read`个人allow/role默认/deny、当前Scope绑定和目标对象state校验。
- **对象级Trust证据采用当期现有合法Lock或活动Transaction上已落库的responsible_employee_id与同vehicle+cycle的关系**。此路径的合成正向说明数据库与可信Session/已成立业务关系组合可行；对没有这类对象关联的普通批发车，不能靠`car_code`、JYT sync或人员Team直接虚构经营owner，仍返回 `F05_3C_CURRENT_WHOLESALE_OBJECT_SCOPE_SOURCE_GAP`。真实环境业务对象的建立合法性仍需上游验收，未当作生产车辆Owner许可证。
- 锁车/活动trading允许，已完成completed交易禁止。真实PG16 55P03证明同car_code转换/JYT同步并发争锁，第二次转换拒绝或同event幂等。
- 转换从wholesale/active改成mingbang/available，same vehicle/cycle。现时lineage/car_code、已签历史锁车、交易、推荐、周期查价、原始图片与价格快照均不删除/重写。
- 为避免错误自动visible，现阶段维持转换车辆 `hidden` 且标记 HIDE_REASON_RECALCULATION_SOURCE_GAP。当前M94保存自动规则，但不具备可信的人工/自动多原因组合和完整匹配carrier；不能仅凭source_type直接清除hidden。
- 图片状态明确 IMAGE_LOCALIZATION_SOURCE_GAP。未写入对象存储、未伪造图片object_key/已资产化、未调用JYT/CDN；遵守PDM08转换/资产化分离。不将图片失败倒转Vehicle来源。

## 3. 真实原生CI及复验门禁

- F05-3B旧40个独立非特权PG16作业文本逐job全文冻结，新建2个独立非特权PG16作业，总数42。
- 新A：000018实际PG16注入回滚、结构校验；真F03 SystemAdmin/Employee/4S源、真实权限和对象范围；已有Lock/Transaction/completed、历史对象哈希、当前cycle、转换幂等、旧JYT自动抑制；独立PG backend锁超时55P03、撤权、不可变Actor和历史。
- 新B：真实环回TLS单POST动作、CSRF、有效Employee Cookie、4S/Admin/JYT混淆、publisher/owner伪头、所有敏感业务出口、合法200与转换后原资源状态。
- 两个新增原生Artifacts应含PG16日志、HTTPS日志、full-catalog.json、inventory.json、versions-and-source-diff.json、schema-only.sql、sha256sums.txt、来源与业务历史物理缺口矩阵。
- A复核必须独立核对B branch HEAD=PR HEAD=Actions run.head_sha、42/42官方success、两份新Artifacts未过期、GitHub diff白名单零越界，然后判断是否可分阶段承认可信条件式正向与仍有的业务来源缺口。

## 4. 显式未闭环项

- `SOURCE_GAP`: 普通无现成当前员工业务对象关联的JYT批发车，缺可信可授权Employee当前Vehicle对象Scope，不自创Owner或SystemAdmin赋能路径。
- `IMAGE_LOCALIZATION_SOURCE_GAP`: 真实外部图片对象存储写入和持久证明尚不能执行。
- `HIDE_REASON_RECALCULATION_SOURCE_GAP`: 隐藏原因及规则引擎未形成可信当前有效来源签发。
- `FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`: 冻结M94目录中未找到当前Favorite实体，不能宣称已实证该类关联。
- `SOURCE_GAP_BLOCKED_FOR_PRODUCTION`: 仍无真实JYT、对象存储、生产身份系统和真实客户资金，42/42只是隔离CI工程。

**A独立验收前B不合并main、不开放生产路由、不启动下一F05阶段；F05/F04生产/C-H01/V1整体继续NOT_READY。**
