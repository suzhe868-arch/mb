# Decision Register｜产品基线重建

> 仅记录本轮重新确认后的真实业务裁决。旧 FROZEN / SUPERSEDED 判断不得自动复制进来。

| ID | 产品域 | 规则原子 | 裁决 | 替代/排除 | 证据 | 日期 |
|---|---|---|---|---|---|---|
| PDM01-DEC-A04 | PDM-01 | P01-A04 | 用户确认：新客户首次进入先建立/识别 `customer_id`；若无有效销售分享、直接转介绍等优先归属来源，则立即进入自然注册自动分配，从当前 active + eligible + accepting 接客池产生唯一 `current owner`；若通过有效直接转介绍进入，则记录直接推荐关系，由推荐人在事件发生时的 `current owner` 承接，不参加普通自然注册轮询；普通客户侧车源转发仍为 `SOURCE_ONLY`，不据此分配或改变 owner。 | 替代旧“首次进入不自动分配 owner”的过度简化表述；不改变客户侧普通转发 `SOURCE_ONLY` 边界。 | 9/19 R5/R10 + IA Current `natural registration / auto-round-robin` + R5 §7 直接转介绍规则 + 2026-09-24 用户明确确认“A04通过” | 2026-09-24 |
