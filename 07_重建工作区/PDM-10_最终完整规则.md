# PDM-10｜价格 / 查价 / 客户展示价覆盖｜最终完整规则

> 日期：2026-10-04  
> 状态：COMPLETE  
> 业务权威语言：中文（zh-CN）  
> 说明：本文件是 PDM-10 经 Batch 1～4、全量覆盖校验、跨 PDM 冲突收口与用户最终批准后的正式当前规则。后续 PDM 不得静默推翻；发现真实跨域冲突必须显式重新裁决。

---

## 1. 价格对象与事实分层

### 1.1 JYT 批发车

必须分开保存：

- upstream_list_price：上游标价；
- upstream_wholesale_price：上游真实批发价；
- base_wholesale_price：用于当前批发加价计算的基础批发价；
- 当前客户展示价；
- 可选客户展示覆盖价。

base_wholesale_price：
1. 有 upstream_wholesale_price → 使用真实上游批发价；
2. 无真实批发价但有 upstream_list_price → 可按既定派生规则回退为基础计算值；
3. 两者均无合法数字 → null。

派生价格不得改写上游原始事实。base_wholesale_price 属于内部计算事实，不得直接作为客户兜底售价泄露。

### 1.2 名邦 / 4S 人工车

分别维护：

- customer_list_price：正常客户标价；
- internal_wholesale_price：内部批发价；
- 可选 customer display override：客户展示覆盖价。

customer_list_price、internal_wholesale_price 均允许为空。

customer_list_price 为空 → 客户显示“价格咨询”。
internal_wholesale_price 为空 → 不阻止正式发布，不伪造、不自动用其他价格补齐。

名邦 / 4S 不参加 JYT 阶梯加价体系。

---

## 2. JYT 当前客户展示价计算

优先级：

1. 有有效客户展示覆盖价 → 覆盖价；
2. 无覆盖 + 加价开启 → base_wholesale_price + 当前有效阶梯加价；
3. 无覆盖 + 加价关闭 → upstream_list_price；
4. 仍无合法数字客户价格 → “价格咨询”。

明确禁止：

- 加价关闭后一律“价格咨询”；
- 加价关闭后暴露真实批发价 / base_wholesale_price；
- 阶梯规则无效时用内部价格偷偷兜底。

---

## 3. 阶梯加价配置与生效

准备正式启用的规则必须：

- 区间不重叠；
- 声明范围内无空档；
- 任一适用 base_wholesale_price 唯一命中结果。

存在重叠、空档或无法唯一计算 → 不得启用。

采用“草稿 / 未生效版本 → 校验 → 正式启用”模型：

- 草稿修改不影响线上；
- 校验失败 / 保存失败不替换当前有效规则；
- 正式启用成功后新规则一次性成为当前有效规则；
- 旧规则退出当前有效身份但保留历史。

---

## 4. 客户展示价覆盖

### 4.1 适用车源

JYT、名邦、4S 三类车源均支持覆盖价数据能力。

### 4.2 覆盖语义

覆盖价只改变当前最终客户展示结果，不修改：

- upstream_list_price；
- upstream_wholesale_price；
- base_wholesale_price；
- customer_list_price；
- internal_wholesale_price。

覆盖期间底层价格事实仍可正常更新。

### 4.3 操作主体与权限

覆盖价属于名邦内部敏感运营能力。

名邦员工设置 / 修改 / 取消覆盖价必须满足：

- active 名邦员工；
- 具备覆盖价独立 permission；
- 目标车辆在 data scope；
- object state 允许；
- 提交时重新校验。

职位本身不自动授予覆盖权限。

4S 成员对覆盖价 HARD DENY，即使是本人可管理的 4S 车辆也不能设置、修改、取消覆盖价。

### 4.4 取消覆盖

- JYT：回到取消时刻的正常 JYT 当前展示价逻辑；
- 名邦 / 4S：回到取消时刻最新 customer_list_price；
- 无合法数字 → “价格咨询”。

新 listing_cycle 不自动继承旧周期覆盖价。

---

## 5. 正常价格编辑与独立“调价”模型取消

名邦 / 4S 的 customer_list_price、internal_wholesale_price 是车辆正常业务字段。

当前不再建立：

- 独立“调价 permission”；
- 独立“调价业务动作”。

具备正常车辆编辑 / 管理能力并满足 data scope、object state 的人员，通过普通车辆编辑“保存修改”提交正常价格字段。

JYT upstream_list_price、upstream_wholesale_price、base_wholesale_price 继续只读。

客户展示价覆盖仍是独立敏感动作与独立 permission。

### 5.1 internal_wholesale_price 字段级保护

修改 internal_wholesale_price 还必须具备“内部价查看”独立 permission。

没有该 permission：

- 后端不返回该字段；
- 页面不展示该字段；
- 不得通过接口提交修改。

修改 customer_list_price 不要求内部价查看 permission，只服从正常车辆编辑 / 管理能力及 data scope / object state。

本节显式 supersede：
- PDM-02 中把调价作为独立敏感 permission 的旧描述；
- PDM-06 中“调价不得混入保存修改”的旧描述；
- R11 / Current 相应旧 carrier。

---

## 6. 内部价 / 批发价查看权限

“查看名邦内部价 / 批发价”是后台可配置独立 permission。

统一权限计算：

> 角色模板默认 + 员工个人明确 allow / deny + data scope + object state

名邦员工查看内部价还必须处于合法内部模式 / 内部工具投影。

普通销售、经理、店长均不因职位自动获得。

4S 成员查看名邦内部价 / 批发价 HARD DENY。

能查看内部价不自动获得覆盖价、电话、上下架或其他敏感能力。

客户安全视图不能只靠前端隐藏；敏感价格字段必须在后端响应层按 identity / permission / scope 隔离。

---

## 7. 客户等级与批发查价权益

每个客户等级都可以在后台独立配置批发车价格查看权益，包括普通注册客户、粉丝、VIP 及后续扩展等级。

支持两种模式：

### 7.1 LIMITED｜有限额

配置每天可成功解锁的新批发车数字价格数量。

具体次数不在产品规则中写死，由后台配置。

### 7.2 UNLIMITED｜不限量

当前等级不受每日次数限制：

- 列表页直接显示当前合法数字客户展示价；
- 详情页直接显示当前合法数字客户展示价。

当前无合法数字价格仍显示“价格咨询”。

不限量必须作为独立业务语义，不使用超大数字模拟。

客户等级只控制“能不能看 / 能看多少”，绝不参与车辆售价计算；同一车辆同一时刻只有一个客户展示价。

---

## 8. 客户等级当天变化

等级变化立即按新等级权益生效。

### 8.1 有限额 → 有限额

当天剩余额度：

> max(0, current_today_base_quota + today_temp_additions - today_consumed_new_vehicle_unlocks)

### 8.2 有限额 → 不限量

立即获得不限量价格查看权益。

### 8.3 不限量 → 有限额

立即恢复新等级的有限额规则。

但以下既有权利不追回：

- 已明确建立的 customer + vehicle + listing_cycle 单车查价权；
- Recommendation 已授予的当前 listing_cycle 免费查价权。

仅仅因为客户曾处于不限量等级并浏览过车辆，不把浏览记录批量转化为永久单车解锁权。

自然日边界：UTC+8 00:00。

---

## 9. 批发车查价权与扣额

普通单车查价权以：

> customer + vehicle + listing_cycle

共同确定。

同一客户同一车辆同一周期第一次成功解锁后：

- 本周期重复查看不再扣；
- 上游调价、阶梯变化、覆盖价变化不重新扣；
- 查价权代表“可看当前最新价格”，不是冻结首次价格。

真实下架后重新上架形成新 listing_cycle → 旧周期查价权不自动跨周期。

只有“此前未解锁 + 当前周期 + 成功得到数字客户展示价”的客户侧批发车查看才消耗一次每日额度。

以下不扣：

- 权限拒绝；
- 请求失败；
- timeout；
- 幂等重试；
- 当前只能得到“价格咨询”；
- 本周期已经解锁；
- 已有合法免费查价权；
- 员工按员工身份查看价格。

每日普通查价额度只保护批发车价格；名邦 / 4S 人工车正常客户价格不消耗该额度。

---

## 10. Recommendation 免费查价权

正式 Recommendation 免费授予：

> 对应 customer + vehicle + 当前 listing_cycle

的批发车价格查看权，不消耗每日普通额度。

该权利：

- 只限被推荐车辆；
- 不解锁整个批发库；
- 普通分享不授价；
- 收藏不授价；
- 不允许二次分享转移价格权。

Recommendation 创建时若车辆只有“价格咨询”，本周期免费权仍立即成立；同周期以后出现数字价格可直接查看。

Recommendation 后续结束、owner / 负责人变化、原销售离职均不追回已经取得的当前周期免费权；持续到当前 listing_cycle 结束。

---

## 11. 临时增加客户当天查价次数

追加对象是 customer-day quota，不属于销售个人。

### 普通销售
必须：
- 是客户 current owner；
- 具备“增加当天查价次数” permission；
- object state 允许。

### 经理 / 店长
不要求本人是 current owner，但必须：
- active；
- 具备对应 permission；
- 客户在 data scope；
- object state 允许。

### 4S 成员
HARD DENY。

### System Admin
可从控制平面配置 permission，不以销售身份直接执行该业务动作。

提交时重新校验 identity + permission + data scope + object state。

同一天可多次追加并累计；UTC+8 次日清零。owner 变化、原销售暂停接客或离职不撤销已追加次数；有权限的新责任人员可继续追加。

不强制填写原因，备注可选。

审计至少记录：客户、操作人、时间、增加次数、操作前后剩余额度、当天累计追加量。

---

## 12. 未解锁价格的筛选 / 排序

精确价格可见权与后台查询计算分离。

尚未解锁的批发车：

- 客户 UI 显示“查看价格”；
- 后台仍用当前真实客户展示价参与价格排序；
- 数字价格区间筛选同样使用真实客户展示价；
- 解锁状态不得改变排序位置；
- 筛选 / 排序本身不建立查价权、不消耗额度；
- 响应不得向未授权客户返回精确数字价格。

“价格咨询”车辆：
- 不进入明确数字价格区间；
- 数字价格排序时位于所有数字价格之后；
- 其内部顺序由后续客户端 / Feed 排序规则承载。

产品明确接受价格区间筛选可能带来的粗粒度价格范围推断。

---

## 13. 一键 JYT → 名邦的价格处理

继承 PDM-04：

> 同一 vehicle_id + 同一 listing_cycle 的来源转换

不创建第二辆车，不单独新建价格周期。

转换瞬间保存不可变快照，至少包括：
- upstream_list_price；
- upstream_wholesale_price；
- base_wholesale_price；
- 阶梯计算结果；
- 当时最终客户展示价；
- 是否存在覆盖价；
- 转换时间；
- 操作人。

转换后：
- 停止 JYT 当前阶梯价格计算；
- JYT 后续普通价格变化不再自动改变名邦当前价格；
- 上游原始价格只作为 Source Data / 历史事实；
- 名邦 customer_list_price 不自动继承转换前批发车客户展示价；
- 同周期有效覆盖价继续生效；
- 后续取消覆盖且 customer_list_price 为空 → “价格咨询”；
- 当前周期既有查价权继续有效；
- Favorite / Recommendation / Lock / Waitlist / Transaction 等继续绑定原 vehicle_id；
- 已形成的业务价格快照不重算。

internal_wholesale_price 初始化：
- 有真实 upstream_wholesale_price → 复制真实上游批发价；
- 无真实 upstream_wholesale_price → null。

明确禁止用 upstream_list_price 或派生 base_wholesale_price 冒充真实内部批发价。

---

## 14. 低价风险

允许合法业务人员设置低于内部基准的客户价格，不做产品级硬拦截：

- JYT 覆盖价 < base_wholesale_price → 允许 + 明显风险警告；
- 名邦 / 4S customer_list_price < internal_wholesale_price → 允许 + 警告；
- 名邦 / 4S 覆盖价 < internal_wholesale_price → 允许 + 警告。

比较基准为空 → 不比较、不警告，不用 0 或其他价格伪造基准。

不强制经理 / 店长审批，不强制亏损理由。

必须审计 before / after / baseline / risk flag / actor / time / listing_cycle / operation type。

---

## 15. 价格展示格式

客户主要数字价格使用“万”：

- 128000 → 12.8万；
- 180000 → 18万；
- 125800 → 12.58万；
- 不强制 .0；
- 主要展示不用冗余“万元”。

无数字客户价格 → “价格咨询”。
批发价尚未解锁 → “查看价格”。

员工内部展示必须明确区分：
- 当前客户展示价；
- 客户标价；
- 内部批发价；
- JYT 上游标价；
- JYT 上游批发价；
- 当前覆盖价（如存在）。

不得使用含糊标签导致不同价格事实混淆。

---

## 16. 4S 车辆管理与价格边界

4S 成员共用员工端，但不是整体 DENY 车辆管理。

正确模型：

> 可以进入自己有权管理的 4S 车辆管理视图，再按 4S hard DENY 裁剪具体能力。

允许在合法范围内维护正常车辆资料与 customer_list_price。

继续禁止：
- 管理名邦车；
- 管理 JYT 批发车；
- 查看名邦内部价 / 批发价；
- 一键转名邦；
- 客户展示价覆盖；
- 越过自己的 4S data scope。

Current IA 中“4S member | internal mode | DENY”的整体角色门禁属于 stale carrier，后续 PDM-21 / IA 对齐时修正。

---

## 17. 历史、审计与不可变快照

价格业务至少可追溯：

- before / after；
- actor；
- time；
- listing_cycle；
- 价格来源 / 规则来源；
- 覆盖价设置 / 修改 / 取消；
- 临时额度追加；
- 低价风险事实；
- 一键转名邦转换前价格快照。

名邦 / 4S 正常价格修改不强制填写原因，备注可选。

Recommendation / Lock 等关键业务已经形成的价格快照属于不可变历史事实。后续上游调价、阶梯规则、覆盖价、人工价格、source_type 变化均不得回写。

客户侧默认只消费当前有效客户价格 / 当前“价格咨询”，不开放完整内部价格历史。

---

## 18. 客户安全与字段隔离

客户 / customer-safe 响应不得返回：
- 内部批发价；
- base_wholesale_price；
- 未授权的精确批发客户展示价；
- 内部价格历史。

不能只依赖前端隐藏敏感字段。字段返回层、页面展示、操作提交均必须服从当前身份与权限。

---

## 19. V1 不恢复第二套费用报价体系

不建设或恢复：
- 服务费；
- 物流费报价；
- 检测费报价；
- 过户费报价；
- 其他附加费用报价；
- 预计到手价 / 到手价测算；
- 后台费用规则。

成交阶段真实成交价属于 Transaction 事实，不因此引入第二套“预计到手价”。

---

## 20. 明确 DO_NOT_RESTORE

不得恢复：

1. 覆盖价只支持单一车源；
2. 加价关闭后一律价格咨询；
3. 加价关闭 / 规则异常时把真实内部批发价暴露给客户；
4. 不同客户等级看到同一车不同售价；
5. 普通分享 / 收藏授予批发查价权；
6. Recommendation 解锁整个库存；
7. 客户通过普通分享转移查价权；
8. 旧 listing_cycle 查价权跨新周期；
9. 同周期重复扣查价额度；
10. “价格咨询”也扣额度；
11. 员工查看价格消耗客户额度；
12. 无效阶梯规则上线；
13. 编辑中的阶梯草稿直接影响线上；
14. 新 listing_cycle 继承旧覆盖价；
15. 人工车被强制纳入 JYT 阶梯加价；
16. internal_wholesale_price 为空就禁止人工车后续业务；
17. 用内部批发价强填 customer_list_price；
18. 客户查看完整内部价格历史；
19. 服务费 / 到手价第二套报价；
20. 独立“调价 permission / 调价动作”；
21. 4S 成员整体无法进入自己车辆管理视图。

---

## 21. 跨 PDM 关系与显式 supersession

### 继承
- PDM-02：统一 identity / role / permission / data scope / hard DENY；
- PDM-03：current owner、离职 / owner 变化；
- PDM-04：vehicle_id、source_type、listing_cycle、一键转名邦同 vehicle 模型；
- PDM-06：人工车发布与正常车辆编辑基本模型。

### 本 PDM 显式覆盖
- PDM-02 中“调价作为独立敏感 permission”的旧表述 → 由本 PDM §5 覆盖；
- PDM-06 中“调价不得混入保存修改”的旧表述 → 由本 PDM §5 覆盖。

### 后续 handoff
- PDM-14：Recommendation 生命周期，但必须保留本 PDM 免费查价权边界；
- PDM-18：Lock 生命周期，但必须保留价格快照不可变边界；
- PDM-20：客户列表 / 详情“查看价格、价格咨询、万单位、真实价格排序筛选”交互承载；
- PDM-21：员工端正常价格编辑、覆盖价入口、4S 裁剪、内部价格标签；
- PDM-22：阶梯加价、等级额度、permission 与配置后台承载；
- PDM-25：价格 / 覆盖 / 临时额度 / 低价风险 / 转换快照统一审计规范。

这些 handoff 已有明确目标与 Guard；目标 PDM 后续不得遗漏或静默改写。

---

## 22. 最终门禁

PDM-10 经全量反向差集 M11-001～M11-017、历史 R4/CN11、Current/IA/Low-Fi、已完成 PDM 与本轮用户裁决双向核验后：

- SOURCE_DECISION_COVERAGE = 100%
- UNMAPPED = 0
- FINAL_TO_SOURCE_TRACEABILITY = 100%
- DEFERRED_HANDOFF_UNRESOLVED = 0（所有跨域事项已指定目标与完整 Guard）
- CROSS_PDM_CONFLICT = 0（PDM-02/PDM-06 旧冲突已显式 supersede）
- GLOBAL_INVARIANT_CONFLICT = 0
- SEMANTIC_INTEGRITY = PASS
- NEGATIVE_CLAIMS_VERIFIED = PASS
- USER_FINAL_APPROVED = YES
- IMPLEMENTATION_READY = PASS

当前状态：

> COMPLETE

正式当前规则即本文件。
