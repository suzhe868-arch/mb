# PDM-04｜三类车源 / JYT 同步 / 车辆身份 / Listing Cycle / 隐藏 / 下架 / 重上架 / 一键转名邦｜最终完整规则

> 日期：2026-09-24  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> 说明：本文件汇总 PDM-04 Batch 1～4 经用户逐批裁决并经最终总览批准后的**正式当前规则**；2026-10-05 已完成 Legacy Final Integrity Audit，并同步 PDM-05～PDM-10 已完成承接。  
> IA / Low-Fi 仅登记 `STALE_CARRIER`，统一延后到 PDM-25 完成并通过 PDM-01～25 全局最终总复核后集中对齐。

---

## 1. PDM-04 范围与三类车源

V1 当前只存在三类正式车源：

1. **批发车源**：由 JYT / 上游集成产生；
2. **名邦车源**：人工车源体系；
3. **4S 合作车源**：人工车源体系。

不得在本域自行增加第四种正式车源类型。

批发来源不能通过普通人工编辑产生；人工车只能在本域允许的名邦 / 4S 规则下变更来源。

---

## 2. Vehicle 状态必须分层

不得使用一个巨大 `vehicle_status` 同时表达全部含义。

至少分为三层：

1. **真实资源 / 可售事实**
   - 批发来源至少区分真实 active / offline；
   - 人工来源至少区分 available / unavailable / sold_external 等真实业务事实。
2. **平台展示状态**
   - visible；
   - hidden。
3. **业务占用 / 交易事实**
   - Lock；
   - Waitlist；
   - Transaction；
   - 其他正式业务对象自身状态。

`hidden` 不等于真实下架；Lock / Transaction 也不应反写成车辆唯一总状态。

### 2.1 locked / trading 不冻结真实车辆事实

车辆处于 `locked` / `trading` 只表示当前业务占用 / 交易事实，不代表现实中的车辆事实停止变化。

因此，有权限且满足当前 permission + data scope + object state 的人员，仍允许记录真实发生的车辆事实变化，包括适用的：

- 真实价格变化；
- 真实车况变化；
- 里程 / 车辆资料变化；
- 供应事实变化。

处理边界：

1. 真实事实变化不得因为车辆已经 locked / trading 而被禁止记录；
2. 重大价格、车况或供应变化可以触发 Supply Anomaly；
3. 事实更新本身不自动取消已有 Lock / Waitlist / Transaction；
4. 不覆盖既有 Lock price snapshot；
5. 不删除 Deposit / 资金事实；
6. 不回写已经形成的 Transaction 历史或成交历史；
7. 页面 / API Guard 不得使用 `biz_status != normal → 禁止一切真实车辆事实更新` 这种粗粒度规则。

该规则与“一键转名邦是否允许”是不同动作边界；一键转名邦继续服从本文件 §15 的专门状态规则。

---

## 3. JYT 上游事实与同步边界

### 3.1 上游事实只读

JYT 上游原始车辆事实与上游原始价格属于来源事实：

- 可由上游集成按允许字段同步更新；
- 普通员工不得直接改写；
- 上游同步不得覆盖名邦本地业务字段；
- 不得覆盖人工 hidden；
- 不得覆盖客户、Lock、Transaction 等本地业务关系。

### 3.2 同步 Actor

JYT 导入 / 普通同步的 Actor 是上游集成服务，不虚构人工逐车操作员。

系统同步至少应保留：

- 来源；
- 同步时间；
- 处理结果；
- 异常 / 屏蔽结果。

人工只处理配置、异常及确有人工业务动作的事项。

### 3.3 JYT / 外部采集的三个固定车源业务 API

V1 对外部采集 / 检测程序与名邦之间的车源同步业务固定保留三个接口边界：

1. **新增 / 更新车源 API**：提交完整或允许更新的车辆来源事实；不存在则新增，已存在则按当前 identity / lifecycle 规则更新；
2. **批量确认下架 API**：批量提交真实不可售 / 下架结果，最终处理仍服从 vehicle identity 与 listing_cycle 规则；
3. **获取当前名邦仍在售批发车源 API**：供外部采集 / 检测程序获取当前需要持续核验的批发车源集合。

固定边界：

- 外部程序不得持有名邦数据库账号；
- 使用名邦车源同步 API Token / API Key 调用这三个接口；
- 该 credential 不是 JYT 上游登录 Token；
- 该 credential 与 Collector 电话接口内部鉴权分离，不得混用；
- 三个业务接口分别具有独立启停开关；
- 调用日志至少记录调用时间、接口名、成功 / 失败及提交 / 返回 / 处理数量等必要运行事实。

跨域承接：

- PC 配置、启停、credential、调用统计与运行状态管理 → PDM-22；
- Incident、飞书、SLA、夜间免打扰、通知与异常日志 → PDM-23；
- 上述后续域不得改变本节三个固定车源业务 API 的产品边界。

---

## 4. 车辆身份与 car_code

### 4.1 正常 car_code 复用

正常同步时，同一 JYT `car_code` 默认复用既有车辆身份，不因普通更新或再次出现而静默新建第二个同源 vehicle。

### 4.2 一般身份冲突

若尚未涉及“已转名邦历史 car_code”这一特殊场景，而同一 `car_code` 出现品牌、车系、具体车型、年款等核心身份明显冲突：

- 不得静默覆盖既有车辆；
- 进入车辆身份异常处理；
- 一般异常可按既有身份核验机制处理。

### 4.3 已转名邦历史 car_code 的特殊异常

如果某辆批发车已经完成“批发 → 名邦”转换，而其历史 `car_code` 后续又出现明显不同核心车辆身份：

> **系统直接自动屏蔽 / 抑制该冲突上游记录，不进入人工决断。**

具体规则：

- 不公开展示；
- 不进入正常匹配；
- 不覆盖原名邦 vehicle；
- 不把原名邦 vehicle 恢复成批发；
- 不自动创建新的可售批发 vehicle；
- 仅保留冲突 / 屏蔽日志。

该场景按极低概率异常处理，不建设人工放行 / 人工归属裁决流程。

---

## 5. 批发车真实下架 / offline

JYT 确认车辆真实下架 / offline 后：

1. 退出正常可售；
2. 不再公开展示；
3. 不再参与正常匹配；
4. 不再新增普通销售业务。

但已有：

- Lock；
- Waitlist；
- Transaction；
- 已成立历史关系；

不得被车辆下架动作直接删除，应继续由各自业务生命周期处理。

---

## 5A. 供应异常

供应异常作为独立风险事实管理，不与车辆真实上下架、hidden、Lock、Transaction 混为一个状态。

可触发异常的情况包括但不限于：

- 上游确认下架 / 不可售；
- 4S 撤回；
- 重大价格变化；
- 重大车况变化；
- 其他足以影响当前销售承诺的供应风险。

处理规则：

1. 系统发现明确异常事实时可以自动标记供应异常；
2. 供应异常出现后，可通知当前相关销售 / 负责人；
3. **Supply Anomaly 本身是风险告警状态，不统一阻断新增业务。**是否允许新增 Recommendation / Consultation / Waitlist / Lock / Transaction 等具体业务，继续由车辆当前真实 `source/resource` 可售事实、visibility、业务对象自身 Guard 与对应 PDM 规则判断；
4. 当底层车辆已经明确进入 `offline / unavailable` 等真实不可售状态时，按照真实不可售规则硬性禁止新增普通销售业务；此时阻断原因来自真实不可售事实，而不是“存在 anomaly”这一标签本身；
5. 供应异常本身不自动取消已有 Lock / Waitlist / Transaction；
6. 不删除既有 Deposit / 价格快照 / 历史业务事实；
7. 系统能够明确确认风险已经恢复时，可以自动解除当前异常；
8. **允许有权限人员人工处理并解除供应异常**；
9. 人工解除前必须基于当前实际证据重新核验车辆 / 上游状态，不允许仅凭主观判断直接清除；
10. 人工处理至少保留：处理人、处理时间、处理结果，以及适用时的证据 / 说明；
11. 异常解除只结束“当前异常”状态，不删除历史异常记录；
12. 后续再次发生新的异常时，建立新的异常事实 / 记录。

> 供应异常的“人工处理”属于受权限控制的异常处置能力，不等于人工创建任意异常。

---

## 6. Listing Cycle

### 6.1 新 cycle 的唯一业务条件

`listing_cycle` 只在：

> **真实不可售 / 失效 → 再次真实可售**

时开启新周期。

以下情况**不新建 cycle**：

- hidden → visible；
- 普通资料编辑；
- 改价；
- 自动隐藏规则变化；
- 人工 hidden / 恢复；
- 批发 → 名邦来源转换。

### 6.2 同一人工车重新在售

名邦 / 4S 人工车真实下架后再次正式在售，只要确认仍是同一真实车辆：

- 复用原 `vehicle_id`；
- 新建 `listing_cycle`；
- 不创建第二个 vehicle。

旧 cycle 永久保留历史。

### 6.3 当前 cycle 开始时间与车辆时间事实

`listing_started_at` 表示**当前 listing_cycle 的正式上架 / 重新上架时间**，不等于车辆上传时间，也不等于名邦第一次收录 JYT 车辆的时间。

新 listing_cycle 的开始时间按以下业务事实取值：

1. 能取得可信的本次真实上架 / 重新上架时间时，使用该真实时间；
2. 无法取得可信上游真实时间时，使用名邦首次确认本次“真实不可售 → 再次真实可售”的时间；
3. 名邦 / 4S 人工车辆首次正式发布或真实重新上架成功时，使用该正式发布 / 重新上架成功时间。

同时必须分离以下时间事实：

- `listing_started_at`：当前 listing_cycle 上架时间；
- 人工车上传 / 首次创建时间：名邦 / 4S 人工录入事实；
- JYT `first_seen_at` / 平台收录时间：名邦第一次接入 / 收录该 JYT 车辆的事实。

不得把 JYT `first_seen_at` 伪称为“上游真实上传时间”。

派生口径：

- “最新上架”排序使用当前 cycle 的 `listing_started_at`；
- “今日新增”只统计今天**第一次进入名邦系统并正式在售 / 公开可用**的车辆；
- 历史车辆今天真实下架后重新上架，可以记为“重新上架”，但不得因此被重新计为“今日新增车辆”。

客户端 / 员工端 / PC 最终如何展示这些时间标签，分别由对应体验 / 后台 PDM 承接，但不得改变本节底层时间事实。

---

## 7. hidden 与真实下架严格分离

`hidden` 只控制平台公开性，不改变底层真实在售事实。

因此：

- hidden 的批发车仍可接受正常 JYT 资料同步；
- 普通上游同步不得自动解除人工 hidden；
- hidden / visible 本身不新建 listing_cycle；
- offline 车辆不能因为“解除隐藏”而被错误恢复成在售。

---

## 8. 自动 / 批量隐藏规则中心

### 8.1 适用车源范围 source_scope

每条自动 / 批量隐藏规则必须显式选择适用车源范围，可多选：

- 批发车源；
- 名邦车源；
- 4S 店车源。

要求：

- 至少选择一类；
- 未选择不得生效；
- 不得默认三类全部生效。

原“采集批发车自动隐藏”继续成立，但只是：

> `source_scope = 批发车源`

的一种规则配置。

### 8.2 条件组合

每条规则可以按以下字段配置：

- 地区 / 城市；
- 品牌；
- 车系；
- 年款；
- 具体车型；
- 关键词；
- 后续本域允许的其他车辆条件。

组合逻辑固定：

- **多条规则之间：OR**；
- **单条规则内不同字段：AND**；
- **单条规则内同一字段多个值：OR**。

例如：

- 批发 + 赤峰 → 只隐藏赤峰批发车；
- 名邦 + 沃尔沃 → 只隐藏名邦沃尔沃；
- 批发 + 名邦 + S90 → 两类来源中的 S90 都隐藏；
- 三类全选 + S60 → 三类来源中的 S60 都隐藏。

### 8.3 生效与恢复

规则既可作用：

- 后续新进入车源；
- 当前存量车源重算。

系统应记录全部命中规则 / 原因。

规则停用、删除、条件变化或车辆 `source_type` 变化后，重新计算当前命中集合。

只有同时满足以下条件才可恢复 visible：

1. 不再命中任何适用于当前来源的自动隐藏规则；
2. 没有人工 hidden；
3. 没有其他仍有效 hidden 原因；
4. 车辆仍真实在售。

---

## 9. 人工名邦 / 4S source_type 修改

正式人工车允许：

> **名邦 ↔ 4S**

后续修改 `source_type`。

规则：

1. 名邦内部员工只要对该车辆具备正常管理能力，即可通过专门业务动作修改；
2. 不限定必须经理 / 店长 / 特殊纠错角色；
3. 记录修改前值、修改后值、操作人、操作时间；
4. 不强制填写修改原因；
5. 修改后立即按新来源重新计算权限、可操作能力、自动隐藏规则等；
6. 若当前负责人因来源变化失去承责资格，进入正式责任交接；
7. 4S 成员本人上传的车辆固定为 4S，不能自行改成名邦；
8. 普通人工编辑不能把任何人工车改成“批发”。
9. `source_type = 4S` 只是车辆当前经营来源类型，不等于把该车辆自动授权给任意 4S 成员；名邦员工上传并选择为 4S 合作车源的车辆属于名邦公司的业务资产，4S 成员仍只能操作自己当前真正有权管理范围内的车辆。

批发来源只能由 JYT 集成产生。

---

## 10. 4S 车辆与 4S 成员失效

### 10.1 不恢复周期性在售确认

4S 车源不再执行：

- 定期在售确认；
- 超期自动暂停；
- 名邦代确认。

车辆状态只因真实业务事件变化。

### 10.2 4S 成员 inactive / 停止合作

若 4S 成员失去有效合作 / 账号资格，其当前负责且仍在售车辆：

1. 先暂停正常展示与匹配；
2. 已有 Lock / Transaction 不自动取消；
3. 名邦可重新指定负责人 / 管理责任；
4. 若车辆仍真实有效，可恢复业务；
5. 不重建 vehicle；
6. 来源仍保持 4S，除非后续发生合法 source_type 修改。

---

## 11. 一键转名邦｜核心数据模型

一键转名邦固定采用：

> **同一真实车辆 + 同一 `vehicle_id` + 来源转换**

不再采用“双 vehicle + conversion relation”模型。

转换前：

- 当前来源为批发 / JYT。

转换后：

- 当前来源成为名邦；
- 不创建第二个 Mingbang vehicle；
- 不保留另一条可售 wholesale vehicle。

永久保留：

- 原 `car_code`；
- JYT 来源 lineage；
- 转换前来源事实 / 快照；
- 转换时间；
- 操作人；
- 必要转换审计。

转换后，名邦业务数据独立维护，JYT 后续普通同步不得把当前来源改回批发。

---

## 12. 一键转名邦｜幂等与不可逆

### 12.1 幂等

对同一 vehicle 重复点击 / 并发执行一键转名邦：

- 不得重复创建 vehicle；
- 不得重复执行来源转换；
- 已完成转换时返回既有结果或拒绝重复转换。

### 12.2 单向转换

批发 → 名邦是一项**单向经营转换**。

转换后：

- 可以按人工车规则在名邦 ↔ 4S 之间合法调整来源；
- 不提供“转回批发”；
- 不能人工把名邦 / 4S 改成批发。

批发来源只能由 JYT 集成产生。

---

## 13. 一键转名邦｜Listing Cycle

批发 → 名邦时：

- 继续当前 `listing_cycle`；
- 不因为 source conversion 单独新建 cycle；
- 继续原 `listing_started_at`；
- 继续本周期已有业务关联。

只有未来发生真实：

> 不可售 / 失效 → 再次真实可售

时，才新建 listing_cycle。

---

## 14. 一键转名邦｜hidden 处理

一键转名邦成功表示车辆进入名邦可售业务状态，但：

> **可售 ≠ 必然 visible。**

转换完成后，按新的 `source_type` 重新计算自动隐藏规则。

### 14.1 自动隐藏

- 仅适用于批发的规则：转换成名邦后不再命中；
- `source_scope` 包含名邦且条件仍满足：继续 hidden。

### 14.2 人工 hidden

人工 hidden 不因来源转换自动解除。

必须由有权限人员执行合法恢复动作。

### 14.3 其他 hidden

其他仍有效 hidden 原因继续保留。

只有不存在任何有效 hidden 原因且车辆仍真实在售时，才 visible。

---

## 15. 一键转名邦｜业务状态允许范围

### 15.1 locked

已有有效 Lock 的批发车允许直接转名邦。

因为 `vehicle_id` 不变：

- 原 Lock；
- 客户；
- 负责人；
- 锁车快照；
- 后续业务；

继续绑定同一 vehicle，不迁移、不重建。

### 15.2 trading

处于 trading / 活动 Transaction 阶段的车辆也允许在同一 `vehicle_id` 上转名邦。

已有：

- Lock；
- Waitlist；
- Transaction；
- 历史价格快照；

全部继续绑定原 vehicle，不因转换重建或修改历史快照。

### 15.2.1 客户侧既有关系不处理

一键转名邦只是同一真实车辆在后台发生经营来源 / `source_type` 变化：

- `vehicle_id` 不变；
- 当前 `listing_cycle` 不变；
- 不新建第二辆 Vehicle；
- 客户前端仍然面对同一辆车。

因此既有：

- Favorite / 收藏；
- Recommendation；
- 当前 listing_cycle 已成立的查价关系 / 权益；
- 其他已经绑定该 vehicle 的客户侧业务关系；

均继续绑定原 `vehicle_id` 原样有效。

> **不迁移、不重建、不清空，也不因为 source_type 改变而单独做前端关系处理。**

该规则不代表不同 listing_cycle 之间的权益自动延续；跨 listing_cycle 规则仍由对应价格 / Recommendation 域定义。

### 15.3 completed

Transaction 已 completed 后属于终态历史：

> **不允许再执行经营来源转换。**

若 Transaction 后续合法 cancelled / correction 后，车辆重新恢复真实可售状态，再按当时正常规则判断是否允许转换。

---

## 16. 一键转名邦｜发布与权限

### 16.1 不走草稿二次发布

一键转名邦成功后：

- 不生成草稿等待二次发布；
- 不要求员工再执行一次“发布”；
- 同一 vehicle 直接进入名邦可售业务状态。

是否 visible 仍按 hidden 规则独立判断。

### 16.2 不设置额外独立 permission

一键转名邦不再设置专门独立 permission。

active 名邦员工只要：

- 对目标车辆有正常管理 / 查看范围；
- 对象状态允许；

即可执行。

同时：

- 4S 成员 hard DENY；
- 内部模式只提供入口，不授予权限；
- 最终动作仍受身份、范围、对象状态约束。

---

## 17. 不做模糊跨来源自动 merge

没有可靠唯一身份依据时，不得仅凭：

- 品牌；
- 车型；
- 年款；
- 里程；
- 图片相似；
- 其他模糊相似度；

自动认定批发 / 名邦 / 4S 记录属于同一实体并 merge。

批发 → 名邦是一项明确业务来源转换，不属于模糊自动 merge。

---

## 18. 明确 DO_NOT_RESTORE

以下旧方向不得恢复：

1. 一个巨大 `vehicle_status` 表达全部资源 / 展示 / Lock / Transaction；
2. 把 hidden 当成 offline；
3. hidden / visible 就结束或新建 listing_cycle；
4. 普通编辑、改价、资料更新算“重新上架”；
5. 同一人工车 relist 时新建第二个 `vehicle_id`；
6. 一键转名邦采用“双 vehicle + conversion relation”；
7. 重复 / 并发转换制造第二、第三条车辆记录；
8. 已转名邦 `car_code` 被 JYT 普通同步重新复活成批发在售；
9. 普通上游更新自动解除人工 hidden；
10. 普通员工直接修改 JYT 原始车辆事实 / 原始价格；
11. 无可靠唯一身份时按相似度自动跨来源 merge；
12. 恢复 4S 周期性在售确认；
13. 只有 4S 成员停用后名邦才第一次获得管理能力；
14. 一键转名邦先生成草稿、再二次发布；
15. 名邦 / 4S 人工车通过普通编辑改成批发；
16. 一键转名邦后再“转回批发”；
17. 已转名邦历史 car_code 冲突再建设人工裁决出口——当前统一自动屏蔽。

---

## 19. 历史、审计与真实性

本域至少应能够追溯：

- vehicle 身份；
- 来源类型变化；
- JYT `car_code` 与 lineage；
- listing_cycle 历史；
- hidden / visible 变化；
- 自动隐藏命中规则；
- source_scope；
- 人工 hidden；
- JYT 同步结果；
- car_code 冲突自动屏蔽记录；
- 批发 → 名邦转换时间与操作人；
- 名邦 ↔ 4S source_type 修改前后值；
- 车辆真实下架 / 重上架事实。

后续当前值变化不得反向覆盖历史事实。

---

## 20. 与其他 PDM 的跨域承接状态

PDM-04 当前只冻结车辆 / 车源 / 来源 / listing cycle / hidden / 一键转名邦的业务底座。

### 20.1 已完成承接

以下目标 PDM 已经 COMPLETE，不再继续显示为“以后再做”：

1. **PDM-05｜车型主数据 / JYT 车型映射｜HANDOFF_CLOSED**
   - JYT `model_id` 通过 source mapping 解析到本地 `vehicle_model_id`；
   - 无法映射时不得丢失 JYT 车辆 / source facts；
   - 当 JYT 自身车型事实足够明确时，不应仅因本地映射缺失错误阻断允许的精确检索 / 业务判断；
   - 车型主数据 / mapping 的管理继续由 PDM-05 当前权限规则控制。
2. **PDM-06｜人工车辆草稿 / 发布 / VIN / 删除 / source_type｜HANDOFF_CLOSED**
   - 人工入口只创建名邦 / 4S，批发只能由集成产生；
   - 名邦员工按权限可发布名邦或 4S，4S 成员固定发布 4S；
   - 正式人工车名邦 ↔ 4S 的 source_type 修改继续继承本 PDM 的同 vehicle / 历史保留规则；
   - 已正式发布 Vehicle 不恢复普通物理删除。
3. **PDM-07｜车辆档案 / 车况｜HANDOFF_CLOSED**
   - 车辆档案、车况、报告与客户可见边界由 PDM-07 当前 Final 承接；
   - 不得反向改写 PDM-04 的 vehicle_id / source_type / listing_cycle / availability 事实。
4. **PDM-08｜图片 URL / CDN / 资产化 / 失败重试｜HANDOFF_CLOSED**
   - 批发 → 名邦仍是同一 `vehicle_id`、同一当前 `listing_cycle`；
   - 来源转换合法完成后，图片资产化作为独立子任务；
   - 图片 processing / partial_failed / failed 不得回滚车辆来源转换，不得改回批发，不得重建 vehicle_id / listing_cycle；
   - 失败图片可以后续重试，既有 Lock / Transaction / Favorite / Recommendation 等关系不受图片子任务结果影响。
5. **PDM-09｜上游发布人电话｜HANDOFF_CLOSED**
   - 上游电话按当前 `source_platform + upstream_publisher_id` 等 PDM-09 当前规则定位；
   - `car_code` 只属于车辆 / 来源身份语境，不得重新作为电话获取唯一依据；
   - Internal Mode 本身不授电话能力。
6. **PDM-10｜价格 / 查价 / 覆盖价 / 转换价格语义｜HANDOFF_CLOSED**
   - 一键转名邦保持同一 vehicle_id + 同一 listing_cycle；
   - 转换前保存当前价格不可变快照；
   - 转换后停止把 JYT 阶梯计算继续作为名邦当前价格；
   - 名邦 `customer_list_price` 不自动继承转换前批发客户展示价；
   - 同周期有效覆盖价与已成立查价权继续按 PDM-10 当前规则生效；
   - `internal_wholesale_price` 只有存在真实 `upstream_wholesale_price` 时才复制真实值，否则为 null，不得用上游标价或派生 base price 冒充真实内部批发价。

上述已完成事项的目标 Authority 已存在，来源 PDM-04 不得继续把它们写成未知 / 待后续。

PDM-12 已完成承接并 source backwrite：

> `HO-P04-P12-001 = HANDOFF_CLOSED / target=PDM-12 Final §§17-18,29 / source_backwrite=YES`

### 20.2 仍待后续 PDM 承接

- Matching 对 hidden / availability 的资格与匹配规则 → PDM-12｜`HANDOFF_CLOSED`：PDM-12 Final 已冻结 hidden≠offline/unavailable；hidden 但真实可售可内部 Matching，真实 offline/unavailable/sold 等退出普通 Matching；active Lock 属占用事实，不自动等于不可 Matching。
- Priority 对 hidden / exclusive visibility / listing lifecycle 的关系 → PDM-13｜`HANDOFF_CLOSED`：PDM-13 Final §§5,15-19,29 已冻结 hidden 但真实可售可内部 Matching/Priority；Priority 不改 Vehicle/listing_cycle、不强制 unhide；Priority 本身不授 Customer visibility；active Priority 对普通公开入口形成排他，ended 后恢复底层真实状态并按当前事实重新仲裁；
- Recommendation 对 hidden 单车可见授权与生命周期 → PDM-14｜`HANDOFF_CLOSED`：PDM-14 Final 已冻结 hidden≠offline 条件下 active Recommendation 的 customer-specific visibility、visible↔hidden 同周期动态授权、listing_cycle end 不跨周期继承，以及 source_type/一键转名邦同 vehicle/listing_cycle 不重建 Recommendation；`HO-P04-P14-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- Lock / Waitlist 的完整生命周期 → PDM-18｜`HANDOFF_CLOSED`：PDM-18 Final 已正式承接 LockRequest / Lock / Waitlist 生命周期，并明确 vehicle source/visibility 变化不得静默抹除既有业务历史，hidden 本身不结束 Lock/Waitlist；`HO-P04-P18-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- Transaction / Refund / correction → PDM-19｜`HANDOFF_CLOSED`：PDM-19 Final 已正式承接 Transaction / Refund / correction，并明确 source_type / hidden / visibility / source conversion 不得静默删除或重建交易资金历史；误成交 correction 只有真实不可售后再可售才新建 listing_cycle；`HO-P04-P19-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- 客户端具体页面交互（包括 `listing_started_at` / 上传时间 / JYT 平台收录时间等展示语义）→ PDM-20｜`HANDOFF_CLOSED`：PDM-20 Final 已明确三类时间标签分离、relist 不伪造今日新增、Feed/Detail visibility 与历史详情边界；`HO-P04-P20-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- 员工端具体页面交互 → PDM-21｜`HANDOFF_OPEN`；
- PC 配置入口与管理界面，以及三个固定车源同步 API 的启停、credential、调用统计、运行状态 → PDM-22｜`HANDOFF_OPEN`；
- JYT / Supply Anomaly 相关 Incident、飞书、SLA、夜间免打扰、通知与异常日志 → PDM-23｜`HANDOFF_OPEN`；
- 统一审计横切规则 → PDM-25｜`HANDOFF_OPEN`。

所有正式跨域 handoff 统一以：

> `07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`

为状态总账。目标 PDM 关闭 handoff 后必须反向回写本节，禁止再次长期停留在“留后续”。

这些后续 PDM 可以补充自身规则，但不得静默推翻本 PDM 已经用户确认的业务底座；发现真实跨域冲突必须重新显式提交用户裁决。

### 20.3 IA / Low-Fi stale carrier

本轮确认但当前不修改的旧承载至少包括：

- 旧“双 Vehicle + conversion relation”一键转名邦模型；
- 旧“只有 `biz_status=normal` 才允许所有相关动作”的粗粒度 Guard；其中真实车辆事实更新必须服从 §2.1，不得与一键转名邦动作混淆；
- 旧 conversion relation / 原批发车 + 新名邦车两套身份；
- 旧价格 / 独立调价 permission / action carrier；
- 4S 车辆管理入口旧限制；
- P02 / P03 中车源、集成、车辆历史、Supply Anomaly、三个同步 API 等大量通用壳或不完整页面。

统一登记：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

这些 carrier 不具有产品 Authority，不得反向覆盖本 Final。

---

## 21. 最终状态

PDM-04 Batch 1～4 已完成用户逐批审查，最终完整规则总览已于 2026-09-24 获用户明确批准。

2026-10-05 Legacy Final Integrity Audit 重新关闭 11 组问题；其中 Supply Anomaly 新业务 Guard 经用户显式选择 **B**：anomaly 本身只作为风险告警，不统一阻断新增业务，真实 `offline / unavailable` 才按不可售事实硬阻断。

当前状态：

> **`COMPLETE / INTEGRITY_PASS`**

```text
MISSING_RULE_UNRESOLVED = 0
SEMANTIC_DETAIL_GAP_UNRESOLVED = 0
CROSS_PDM_CONFLICT = 0
HANDOFF_GAP_UNRESOLVED = 0
GLOBAL_INVARIANT_CONFLICT = 0
SOURCE_DECISION_COVERAGE = 100%
FINAL_TO_SOURCE_TRACEABILITY = 100%
SEMANTIC_INTEGRITY = PASS
NEGATIVE_CLAIMS_VERIFIED = PASS
IMPLEMENTATION_READY = PASS
HANDOFF_REGISTER_SYNC = PASS
```

正式规则文件即本文件：

> `07_重建工作区/PDM-04_最终完整规则.md`

下一审计域：

> **PDM-05｜Legacy Final Integrity Audit**

后续 PDM 不得静默改写本文件；若发现真实跨域冲突，必须重新显式提交用户裁决。

当前仍不修改 IA / Low-Fi / Engineering。
