# PDM-10｜价格 / 查价 / 客户展示价覆盖｜最终完整规则

> 日期：2026-10-04  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> 业务权威语言：中文（zh-CN）  
> 说明：本文件是 PDM-10 经 Batch 1～4、全量覆盖校验、跨 PDM 冲突收口与用户最终批准后的正式当前规则；2026-10-05 已完成 Legacy Final Integrity Audit，并新增用户裁决 3A（UNLIMITED 与当天临时追加额度关系）。后续 PDM 不得静默推翻；发现真实跨域冲突必须显式重新裁决。

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

每个客户等级都可以在后台独立配置**批发车价格查看权益**。当前价格域支持两种正式模式：

### 7.1 LIMITED｜有限额

LIMITED 适用于需要每日查价额度控制的等级，当前业务基线中的普通客户属于这一类。

- daily base quota 由后台配置，产品规则不写死固定值；
- “每日 20 台”属于当前可配置业务示例，不是算法常量；
- 每日额度**只保护批发车数字价格**；
- 名邦 / 4S 人工车正常客户价格不消耗该额度；
- 批发车列表页不向 LIMITED 客户直接展示精确数字客户价格；
- LIMITED 客户主动进入批发车详情页时，如该车当前周期尚未解锁、存在合法数字客户价格且当天仍有剩余额度，则**自动完成单车解锁并直接展示数字价格**；
- 不再要求客户在详情页额外点击一次“查看价格”按钮；
- 同一 customer + vehicle + listing_cycle 已经解锁后，后续再次进入详情直接展示当前最新合法数字客户价格，不重复扣额；
- 当天 quota 已耗尽且该车当前周期此前未解锁时，详情页价格主字段显示 **`--万`**，并进入 `DAILY_PRICE_QUOTA_EXHAUSTED` 业务状态；
- 如果车辆本身没有合法数字客户价格，不显示 `--万`，继续显示 **“价格咨询”**。

### 7.2 UNLIMITED｜不限量

UNLIMITED 是正式不限量业务语义，不使用超大数字模拟。

当前等级为 UNLIMITED 时：

- 批发车列表页直接显示当前合法数字客户展示价；
- 批发车详情页直接显示当前合法数字客户展示价；
- 不受每日查价次数限制；
- 浏览不增加 `today_consumed_new_vehicle_unlocks`；
- 不因为普通浏览批量制造永久单车解锁权；
- 当前车辆无合法数字客户价格时仍显示“价格咨询”。

粉丝 / VIP 等等级可在后台配置为 UNLIMITED；后续扩展等级同样读取当前等级配置，不把等级名称写死进价格算法。

### 7.3 Customer Level 是权益集合，不是价格算法

客户等级可以同时承载多个独立 entitlement；价格域只消费“批发车价格查看模式 / daily quota”等价格权益。

PDM-11 已于 2026-10-05 冻结：

- 正式找车资格也是客户等级权益之一；
- 找车资格与价格权益彼此独立，不得互相替代；
- 普通客户当前不具备正式找车权益；需要正式开通找车时通过等级调整进入具备该权益的等级；
- 不建设“普通客户保持普通等级，但单独人工增加 find-car entitlement”的第二套长期授权模型。

客户等级只控制“能不能看 / 能看多少 / 是否具备相应业务资格”，绝不参与车辆售价计算；同一车辆同一时刻只有一个客户展示价。

---

## 8. 客户等级当天变化

等级变化立即按新等级权益生效。

### 8.1 有限额 → 有限额

当天剩余额度：

> max(0, current_today_base_quota + today_temp_additions - today_consumed_new_vehicle_unlocks)

### 8.2 有限额 → 不限量

立即获得不限量价格查看权益。

用户于 2026-10-05 选择 **3A**，因此：

- 切到 UNLIMITED 不清除当天已经合法存在的 `today_temp_additions`；
- UNLIMITED 生效期间不再允许新增“临时增加当天查价次数”；
- UNLIMITED 期间浏览批发车数字价格不计入 `today_consumed_new_vehicle_unlocks`；
- UNLIMITED 浏览本身不批量创建 `customer + vehicle + listing_cycle` 单车查价权。

### 8.3 不限量 → 有限额

立即恢复新等级的有限额规则。

如果仍在同一个 UTC+8 自然日，则重新按：

> `max(0, current_today_base_quota + today_temp_additions - today_consumed_new_vehicle_unlocks)`

计算当前剩余额度；此前合法追加的当天次数继续有效，不因中间进入过 UNLIMITED 被删除。

但以下既有权利不追回：

- 已明确建立的 customer + vehicle + listing_cycle 单车查价权；
- Recommendation 已授予的当前 listing_cycle 免费查价权。

仅仅因为客户曾处于不限量等级并浏览过车辆，不把浏览记录批量转化为永久单车解锁权。

自然日边界：UTC+8 00:00；进入新业务日后 `today_temp_additions` 正常归零。

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

### 9A. LIMITED 详情页自动解锁与扣额触发

取消客户“进入详情后再点一次查看价格”的二次动作。

LIMITED 客户的扣额触发必须满足：

1. 客户真实、主动进入该批发车详情页；
2. 当前 customer + vehicle + listing_cycle 尚未解锁；
3. 当前存在合法数字客户价格；
4. 当前仍有可用 quota，或存在合法免费查价权；
5. 后端成功完成对应价格授权 / 返回。

只有满足并成功完成首次数字价格解锁时，才按既有规则消耗一次每日额度。

以下行为不得因为技术预加载而偷扣额度：

- 列表页预取详情数据；
- 图片 / 页面预加载；
- 缓存刷新；
- 后台任务；
- 非客户主动详情访问产生的接口调用；
- 失败 / timeout / 幂等重试。

Recommendation 已授当前 listing_cycle 免费查价权时，可直接显示数字价格且不消耗普通 daily quota。

### 9.1 客户账号停用 / 恢复的上层 Guard

继承 PDM-01：Customer 停用不删除查价事实，但暂停依赖 Customer 身份 / 权益的价格能力。

Customer 处于停用状态时：

- 不允许发起新的批发车数字查价；
- 不消耗每日 quota；
- 不使用当前等级 LIMITED / UNLIMITED 权益；
- 已经成立的 `customer + vehicle + listing_cycle` 单车查价权不删除；
- Recommendation 已授予的当前周期免费查价权不删除；
- 公开车辆浏览仍按 PDM-01 公开浏览规则处理，但不得借公开浏览绕过价格权益暂停。

Customer 恢复后：

- 继续使用原 `customer_id`；
- 仅恢复到恢复时仍自然有效的查价事实与当前等级权益；
- 已结束 listing_cycle、已自然失效或已经终止的权利不得因恢复而复活。

因此：

> **Customer 停用是查价能力的上层可用性 Guard，不改写查价权的产生、listing_cycle 边界与历史。**

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

该能力是客户服务权益补充，**对客户免费**；V1 不建设“购买临时查价次数 / 按次收费”业务。员工执行追加不得向客户收取查价次数费用。

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

### 11.1 与 UNLIMITED 的关系｜3A

- 当前客户等级权益为 UNLIMITED 时，不允许继续新增临时查价次数，员工端对应动作应隐藏 / 禁用；
- LIMITED → UNLIMITED 不清除当天已存在的 `today_temp_additions`；
- 同一 UTC+8 自然日内 UNLIMITED → LIMITED 后，原有 `today_temp_additions` 重新参与剩余额度计算；
- UNLIMITED 期间浏览不增加 `today_consumed_new_vehicle_unlocks`；
- UTC+8 次日后，旧 `today_temp_additions` 按正常日切规则失效。

不强制填写原因，备注可选。

审计至少记录：客户、操作人、时间、增加次数、操作前后剩余额度、当天累计追加量。

---

## 12. LIMITED 未解锁价格的列表 / 筛选 / 排序

精确价格可见权与后台查询计算分离。

对于尚未解锁的批发车：

- LIMITED 客户列表页不得直接显示精确数字客户价格；
- 不再以“查看价格”按钮作为必须二次点击的解锁入口；
- 客户主动进入详情页后，按 §9A 自动判断并完成首次解锁；
- 后台仍可使用当前真实客户展示价参与价格排序；
- 数字价格区间筛选同样使用真实客户展示价；
- 解锁状态不得改变排序位置；
- 筛选 / 排序本身不建立查价权、不消耗额度；
- 列表响应与其他未授权 payload 不得向 LIMITED 客户泄露精确数字价格。

UNLIMITED 客户不适用上述隐藏规则：只要当前车辆存在合法数字客户价格，批发车列表页与详情页均直接显示数字价格。

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

## 15. 价格展示格式与客户查价状态

客户主要数字价格使用“万”：

- 128000 → 12.8万；
- 180000 → 18万；
- 125800 → 12.58万；
- 不强制 .0；
- 主要展示不用冗余“万元”。

批发车客户侧必须严格区分以下状态：

1. **车辆本身没有合法数字客户价格** → “价格咨询”；
2. **LIMITED + 列表页 + 存在合法数字价格** → 不显示精确数字价格；
3. **LIMITED + 主动进入详情 + 当前周期未解锁 + quota 可用** → 自动解锁并直接显示当前合法数字价格，不要求二次点击；
4. **LIMITED + 当前周期已解锁** → 直接显示当前合法数字价格，不重复扣额；
5. **LIMITED + 当前周期未解锁 + 当日 quota 已耗尽** → 价格主字段显示 **`--万`**，业务状态为 `DAILY_PRICE_QUOTA_EXHAUSTED`；
6. **UNLIMITED + 存在合法数字价格** → 列表页和详情页均直接显示当前合法数字价格，不受 daily quota 限制。

### 15.1 DAILY_PRICE_QUOTA_EXHAUSTED 客户提示

额度耗尽时，价格主字段保持简洁：

> **`--万`**

不得用长篇“您无权限查看价格”等文字替代价格主字段。

价格区域之外应提供明确权益提示，当前业务语义至少包括：

- 当前为普通 / LIMITED 客户；
- 今日批发车数字价格查看次数已用完；
- 升级为粉丝 / VIP 或其他当前配置为 UNLIMITED 的等级后，可不限量查看批发车数字价格；
- 也可联系顾问**免费增加今日查看次数**。

当前建议文案语义：

> **今日价格查看次数已用完。您当前为普通客户，升级为粉丝或 VIP 后可不限量查看车源价格；也可联系顾问免费增加今日查看次数。**

“联系顾问”本身不自动增加额度，也不绕过 §11 的 current owner / permission / data scope / object state Guard；真正追加后才改变 customer-day quota。

`--万` 与“价格咨询”不得混淆：

- `--万` = 当前存在合法数字价格，但该 LIMITED 客户当前无可用解锁额度且本周期尚未取得查看权；
- “价格咨询” = 当前车辆本身没有合法数字客户价格。

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

## 21. Cross-PDM 承接状态与显式 supersession

### 21.1 已完成 incoming handoff

- `HO-P01-P10-001 = HANDOFF_CLOSED / source_backwrite=YES`：Customer 停用只暂停查价能力，不删除既有查价权；恢复只恢复仍自然有效事实；
- `HO-P02-P10-001 = HANDOFF_CLOSED / source_backwrite=YES`：取消独立调价 permission/action；内部价字段仍按独立查看 permission 保护；
- `HO-P03-P10-001 = HANDOFF_CLOSED / source_backwrite=YES`：普通分享/收藏不授价，Recommendation 才授当前 cycle 免费查价权；
- `HO-P04-P10-001 = HANDOFF_CLOSED / source_backwrite=YES`：一键转名邦价格快照、同 vehicle/listing_cycle、内部价初始化与查价权继续；
- `HO-P06-P10-001 = HANDOFF_CLOSED / source_backwrite=YES`：人工车价格非发布硬门槛，正常价格编辑走保存修改。

### 21.2 本 PDM 显式 supersession

- PDM-02 中“调价作为独立敏感 permission”的旧表述 → 由本 PDM §5 覆盖；
- PDM-06 中“调价不得混入保存修改”的旧表述 → 由本 PDM §5 覆盖。

### 21.3 仍待后续 PDM 承接

- PDM-14｜`HANDOFF_CLOSED`：PDM-14 Final 已承接 Recommendation 免费授 `customer + vehicle + current listing_cycle` 批发查价权；Recommendation end、owner/负责人变化、原销售离职不追回；Recommendation 创建时仅“价格咨询”也立即建立免费权，同 cycle 后续出现数字价不扣 daily quota；历史推荐价快照与当前价格分层；`HO-P10-P14-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-18｜`HANDOFF_CLOSED`：PDM-18 Final 已正式承接 Lock 创建价格快照；数字价保存真实数字，“价格咨询”保存明确事实，后续上游调价、阶梯、覆盖价、人工价格或 source_type 变化不得回写既有 Lock snapshot；`HO-P10-P18-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-20｜`HANDOFF_CLOSED`：PDM-20 Final 已正式承接 LIMITED/UNLIMITED 客户价格投影、详情自动解锁、quota exhausted=`--万`、权益升级/联系顾问加次数提示、价格咨询、筛选排序不泄露 payload 以及 Customer disable 价格权益暂停；`HO-P10-P20-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-21｜`HANDOFF_OPEN`：员工端 customer_list_price/internal_wholesale_price 保存修改、internal-price permission、override、临时追加次数、UNLIMITED 禁止追加、4S 正常价格编辑与 hard DENY 投影；
- PDM-22｜`HANDOFF_OPEN`：阶梯加价、markup ON/OFF、客户等级权益配置、LIMITED/UNLIMITED、daily base quota、找车权益等跨域 level entitlement 配置入口、permission 与相关后台承载；
- PDM-25｜`HANDOFF_OPEN`：价格/覆盖/临时额度/低价风险/转换快照/等级权益配置变化等统一审计与历史。

统一登记：

> `07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`

### 21.4 IA / Low-Fi stale carrier

当前只登记、不修改：

- `4S member | internal mode | DENY` 仍可能整体阻断 4S 本人车辆管理；
- internal-price permission 的角色投影仍可能与 PDM-10 当前独立可配置 permission 模型不一致；
- 独立“调价 permission / 调价动作”旧 carrier 残留；
- 员工端客户展示覆盖价真实操作入口不完整；
- P08 价格后台仍偏通用 CRUD 壳，LIMITED / UNLIMITED、markup、quota 等真实配置投影不完整；
- 临时增加当天查价次数员工入口不完整；
- `DAILY_PRICE_QUOTA_EXHAUSTED → 联系顾问` 缺完整 Current / Low-Fi 投影；
- Customer 停用后的价格权益暂停缺独立价格状态投影；
- 3A UNLIMITED / temp additions 切换规则缺 Current / Low-Fi 状态投影。

统一登记：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

IA / Low-Fi 不具有反向覆盖本 PDM Final 的产品 Authority。

---

## 22. Legacy Final Integrity Gate

2026-10-05 本域完成 Legacy Final Integrity Audit，共关闭 5 组问题：

1. 将 PDM-01 Customer 停用/恢复对查价能力的上层 Guard 真正写入 PDM-10 Final；
2. 原 Integrity Audit 恢复 M11-001 的 `DAILY_PRICE_QUOTA_EXHAUSTED → 联系顾问`；2026-10-05 后续用户裁决进一步 supersede “查看价格”二次点击：LIMITED 主动进入详情后有额度即自动解锁，额度耗尽显示 `--万`，车辆本身无数字价才显示“价格咨询”；
3. 用户批准 3A：UNLIMITED 时禁止新增临时次数，但当天既有 `today_temp_additions` 不删除，同日回 LIMITED 后继续有效，UNLIMITED 浏览不计 quota consumption；
4. 正式登记 PDM-14 / 18 / 20 / 21 / 22 / 25 future handoff；
5. 登记价格相关 IA / Low-Fi stale carrier。

### 22.1 Post-Integrity 后续用户裁决

本 Final 在原 Legacy Integrity PASS 之后又收到 PDM-11 Batch 4 联动裁决，已直接写入 §§7、9A、11、12、15，并同步 Decision Register / Handoff Register。当前 Authority 以这些更新后的正文为准；原历史 Integrity 报告中的“查看价格”仅保留审计轨迹，不再代表当前必需客户动作。

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

当前状态：

> **PDM-10 = COMPLETE / INTEGRITY_PASS**

下一阶段：

> **GLOBAL_PDM01_10_CROSS_PDM_AUDIT｜PDM-01～10 Cross-PDM / Handoff / Global Invariant 总复核**

PDM-11 继续 BLOCKED，直到上述全局总复核 PASS。

正式当前规则即本文件。
