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
