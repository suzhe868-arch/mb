# PDM-10｜全量 Decision Coverage / 未映射检查报告

> 日期：2026-10-04  
> 结论：PASS

## 1. 覆盖范围

已检查：
- P10-A01～A14；
- P10-A15 撤回 / reclassify 链；
- P10-B2-01～B2-12；
- P10-B4-01～B4-10；
- 001～078 中 M11-001～M11-017；
- R4 / CN11 关键价格规则；
- PDM-02 / 03 / 04 / 06 跨域约束；
- Current / IA / Low-Fi 中价格相关 carrier。

## 2. M11 反向差集去向

| M11 | 主题 | 最终去向 |
|---|---|---|
| 001 | 临时追加当日查价次数 | Final §11 |
| 002 | 完整价格体系 / 覆盖 / 查价 / 快照 | Final §1～§14、§17 |
| 003 | 阶梯空档 / markup 开关 | Final §2～§3 |
| 004 | 详情核心参数 | 非 PDM-10 价格核心；PDM-20 客户详情 handoff |
| 005 | 收藏 | PDM-10 只冻结“收藏不授价”；其他归收藏/客户端域 |
| 006 | 按车源类型裁剪内部操作 | Final §4、§5、§16；员工端 carrier → PDM-21 |
| 007 | 机会块完整查询条件 | 查询上下文 → PDM-20；价格筛选 Guard 由 Final §12 提供 |
| 008 | 价格展示格式 | Final §15 |
| 009 | 详情车源类型标签 | 客户端/员工端 carrier → PDM-20/21 |
| 010 | 分享卡片 | Final 明确普通分享不授价；安全 payload → PDM-20 |
| 011 | 未解锁真实价格排序 | Final §12 |
| 012 | customer-safe / 后端字段隔离 | Final §6、§18 |
| 013 | 4S internal-mode 冲突 | Final §16，carrier → PDM-21 |
| 014 | 内部价独立 permission | Final §6，B4-01 |
| 015 | 调价独立 permission | B4-06 明确 supersede；Final §5 |
| 016 | 覆盖价员工动作缺口 | Final §4；carrier → PDM-21 |
| 017 | P02 车源管理 / 价格历史 | 价格历史规则 Final §17；PC carrier → PDM-22/25 |

M11 单元全部有明确最终去向：17/17。

## 3. 关键 supersession 链

- P10-B2-10 原“不得恢复内部价独立 permission” → INVALID → P10-B4-01。
- P10-A15 原“取消内部价独立 permission” → WITHDRAWN → P10-B4-01。
- R4 一键转名邦“新车继承客户展示价”旧模型 → PDM-04 same vehicle 模型 + P10-B4-02 当前价格转换规则。
- R11 独立调价 permission → P10-B4-06 取消。
- PDM-06 §15 “调价不进保存修改” → P10-B4-06 supersede。
- 4S internal mode 全局 DENY carrier → P10-B4-09 supersede。

## 4. 本轮 Final Review 补全

覆盖检查额外抓出并已由用户批准：
- A10：每个客户等级可配置 LIMITED / UNLIMITED；等级当天变化立即生效；
- B4-03：普通销售 current owner；经理 / 店长 permission + data scope；
- B4-10：internal_wholesale_price 修改需内部价查看 permission。

这些细节已进入正式 Final，未停留在聊天。

## 5. 门禁结果

SOURCE_DECISION_COVERAGE = 100%  
M11_COVERAGE = 17/17  
UNMAPPED = 0  
FINAL_TO_SOURCE_TRACEABILITY = 100%  
CROSS_PDM_CONFLICT = 0（显式 supersession 后）  
GLOBAL_INVARIANT_CONFLICT = 0

结论：PASS。
