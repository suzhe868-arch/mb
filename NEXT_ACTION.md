# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-09-23

## 当前唯一优先动作

完成：

> **PDM-01 的 4 项真实产品裁决。**

证据重建已经完成，不再重复扫描 PDM-01 已稳定规则。

## 待裁决 1｜PDM01-D01｜手机号变化是否保持原 Customer

历史证据候选规则：

> 同一微信 Customer 更换手机号仍使用原 `customer_id`；只更新当前手机号并保留必要修改历史；owner、权益、Demand、Consultation、Lock、Transaction 等已有业务不因换号重建或迁移。

需要裁决：

- `CONFIRM_RESTORE`
- `MODIFY`
- `REJECT`

## 待裁决 2｜PDM01-D02｜手机号换绑方式

可选业务方向：

- A｜仅允许微信手机号授权更新；
- B｜允许输入其他手机号，并使用短信验证码验证；
- C｜客户不开放自助换绑，仅授权后台人员处理；
- D｜用户明确的其他方案。

不得由 IA / Low-Fi 自行决定。

## 待裁决 3｜PDM01-D03｜Customer Merge 完整语义

9/19 已确认：

- 同手机号不能自动 merge；
- 只有确认属于同一自然人后才允许人工合并；
- 合并必须保留历史、来源与 owner 变化。

仍需补齐：

1. 疑似重复 Customer 如何进入人工合并候选；
2. 是否正式吸收 IA 当前的 active/paused Demand 阻断、merge permission/scope、显式确认；
3. 合并后保留哪个 customer_id；
4. 双方 owner / source / 权益 / 未结束业务冲突如何处理。

## 待裁决 4｜PDM01-D04｜客户停用 / 注销生命周期

已确认原则：

- 不物理删除业务历史；
- 重新确认原客户后不能制造新的“历史清空”Customer。

仍需补齐：

1. 客户是否可以自助注销；
2. 后台谁可停用 / 恢复；
3. active Demand / Consultation / Lock / Transaction 存在时如何处理；
4. 停用后浏览、人工服务、owner、Recommendation / 查价权益如何处理；
5. 恢复后哪些关系恢复、哪些只保留历史。

## 裁决完成后的自动动作

用户完成 D01～D04 后：

> 更新 Decision Register → 生成 PDM-01 最终自包含规则 → PDM-01 标记 COMPLETE → 同步 CURRENT_PROJECT_STATE / NEXT_ACTION / PROJECT_STATE → 再进入 PDM-02。

当前不要施工 IA / Low-Fi / Engineering。
