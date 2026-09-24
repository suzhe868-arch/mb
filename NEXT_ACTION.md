# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-09-24

## 当前唯一优先动作

> **审查 PDM-04《最终完整规则总览｜待用户批准》。**

最终总览文件：

> `07_重建工作区/PDM-04_最终完整规则总览_待用户批准.md`

## 当前状态

- PDM-01：`COMPLETE`
- PDM-02：`COMPLETE`
- PDM-03：`COMPLETE`
- PDM-04 Batch 1：`COMPLETE_USER_CONFIRMED`
- PDM-04 Batch 2：`COMPLETE_USER_CONFIRMED`
- PDM-04 Batch 3：`COMPLETE_USER_CONFIRMED`
- PDM-04 Batch 4：`COMPLETE_USER_CONFIRMED`
- PDM-04：`FINAL_REVIEW_PENDING`

## Batch 4 最终结果

- P04-B4-01｜继续当前 listing_cycle，不因批发→名邦转换新建 cycle；
- P04-B4-02｜按新 source_type + source_scope 重算自动 hidden，人工 hidden 与其他有效 hidden 原因保留；
- P04-B4-03｜locked / trading 允许转名邦，completed 禁止；
- P04-B4-04｜已转名邦历史 car_code 出现明显不同实体身份时，自动屏蔽/抑制冲突上游记录，不进入人工决断；
- P04-B4-05｜批发→名邦为单向转换，不提供转回批发。

## 门禁

只有用户明确批准 PDM-04 最终完整规则总览后，才允许：

1. 将 PDM-04 标记 `COMPLETE`；
2. 生成 `07_重建工作区/PDM-04_最终完整规则.md`；
3. 更新 Decision Register Final Gate；
4. 进入 PDM-05。

当前仍不修改 IA / Low-Fi / Engineering。
