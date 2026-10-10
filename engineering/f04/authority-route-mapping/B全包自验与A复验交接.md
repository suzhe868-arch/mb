# 名邦汽车 V1｜F04-2 A整改交接与原生CI验收门禁

本次修正A-F04-2-01及A-F04-2-02：105条旧簇级匹配全量逐项审查，23条保留同动作Final/IA/Low-Fi三方引用，82条降SOURCE_GAP；全215条目前23匹配、192证据缺口，旧218/198/62、禁恢复3条不变。新增跨领域Owner及动作白名单、真实但不相关的文档负例。

Consultation=PDM-15且业务实施责任暂记OWNER_REVIEW_GAP，Waitlist=PDM-18/F06，所有F04合同与业务Owner分开；不得根据URL含vehicle便归F05。旧独立price-override路径仍未获合法恢复决定。

原F04-1旧26独立非特权PG16工作不改、4S HTTPS 9个测试逻辑不改、旧M94/G14封印不改。CI继续要求完整28/28独立PG16，同最终提交SHA的Actions真正success、原生PG16目录/来源/Artifacts和新增Authority负例实测无误后，才能`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。在CI完成前仅标`B_CI_PENDING`；本文件不伪造运行号。

仅改`engineering/f04/authority-route-mapping/**`；无SQL DDL/旧服务/正式规则/生产接入修改。F04整体/C-H01/产品仍NOT_READY；B不合并main或启用F04-3。

**当前状态：B_CODE_RECTIFIED / B_CI_PENDING**。
