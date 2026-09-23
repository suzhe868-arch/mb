# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-09-23

## 当前唯一优先动作

执行：

> **PDM-01｜客户身份 / 微信 / 手机号 / 资料 / 客户生命周期｜规则原子重建。**

全域覆盖地图完整性校验已经完成并 PASS，不再重复做第 0 阶段。

## 固定证据顺序

### Step 1｜9/19 正向规则

重点读取：

- R5｜客户注册 / 归属 / 分享 / 转介绍 / 离职交接；
- R7｜Recommendation / 分享 / 咨询 / 客户解锁中涉及 Customer 身份边界；
- R10｜客户端首次进入、手机号门槛、个人资料、客户生命周期相关规则；
- Phase1 Final Merge 对 Customer 的最终承接。

### Step 2｜向前 HISTORY

只为确认：

- 9/19 是否遗漏更完整定义；
- 同一微信客户与手机号关系；
- 重复 Customer / 合并边界；
- 停用 / 注销 / 恢复身份；
- 头像昵称提醒与关键业务不中断；
- 是否存在明确废弃规则。

### Step 3｜001～078 雷达

固定读取 M01 的 6 个单元：

- M01-001～M01-006。

旧 `STILL_VALID / SUPERSEDED / HISTORICAL_RULE_LOSS` 等判断一律不直接继承。

### Step 4｜9/19 → 9/22 后续扫描

必须同时核对：

- 9/22 冻结台账；
- IA V5 / Current；
- 实际 Low-Fi；
- 工程总闭环待执行 Delta。

### Step 5｜知情修改测试

后续规则只要与 9/19 / 更早稳定规则不同，必须判定：

- `POST_919_INFORMED_CHANGE_CANDIDATE`
- 或 `POST_919_UNINFORMED_CONFLICT`

不能因为时间更晚或标记 FROZEN 就自动覆盖旧规则。

### Step 6｜形成候选规则原子

每个规则原子只能进入：

- `STABLE_CONSISTENT`
- `PRE_919_OMISSION_CANDIDATE`
- `POST_919_INFORMED_CHANGE_CANDIDATE`
- `POST_919_UNINFORMED_CONFLICT`
- `IA_LOWFI_ONLY`
- `HISTORICAL_UNRESOLVED`
- `EVIDENCE_INCOMPLETE`

## 本轮输出要求

生成 PDM-01 的重建工作文件，至少包含：

- 规则原子清单；
- 前史 → 9/19 → 9/22/IA/Low-Fi/Delta 的证据链；
- 稳定一致项；
- 真正遗漏项；
- 后续变化项；
- 知情修改测试结果；
- NEEDS_DECISION 项；
- 暂定最终规则骨架。

## 当前不要做

- 不直接修改 Decision Register，除非已经形成新的真实用户裁决；
- 不施工 IA / Low-Fi / Engineering；
- 不提前进入 PDM-02；
- 不把页面现状反向当作产品规则。
