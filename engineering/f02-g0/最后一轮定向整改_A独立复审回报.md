# F02-G0｜最后一轮定向整改与A独立复审回报

> 2026-10-08；B分支 `feat/f02-schema`；F02-G0静态模型候选，**未签发G0_ACCEPTED**；不执行业务DDL、任何数据库迁移、种子或真实业务库操作。

## 本轮实际落实

1. Consultation：补`listing_cycle_id`、车辆非空、cycle/Vehicle复合关系和pending/processing非终结部分唯一。
2. 角色/权限：当前有效投影唯一，独立角色权限与个人覆盖历史事件两表各7列、append-only候选；F03仍负责运行权限。
3. 查价：客户每日额度6字段、单车周期权7字段、独立幂等扣额8字段；旧混合表8候选明确排除，保留原始编号。
4. Refund：Lock/Transaction XOR、同Customer/Vehicle/cycle身份一致性物理候选；余额、pending冲突、并发归后续TX Guard。
5. 4S：不建独立组织，旧组织3候选全部排除，保留追溯。
6. 28技术HOLD逐项制定可空、外键、责任层、负例及A待签状态；原80 REVIEW、33 P0、376字段来源均保留。
7. 新增37个字段F02-F-0382～0418，总计413候选；`field-freeze-candidates.tsv`逐项413/413全部`PENDING_A_FINAL_FREEZE`。其中明确延期、排除项不视为F02-1可施工字段。
8. 增加11项G0候选模型静态回归及负例，原F01/G0安全回归保留；正式测试证据以新GitHub CI及对应提交为准。

## 交付给A的文件
- `field-matrix.tsv`、`field-tiers-376.tsv`、`field-freeze-candidates.tsv`；
- `nullable-review-80.tsv`、`hold-resolution-28.tsv`、`core-constraint-contract.tsv`；
- `跨对象权限与查价承载合同.md`、`tests/model-freeze.test.mjs`及现有校验/回归脚本。

## 残余风险/门禁
- 所有413字段仍只是技术冻结候选，A需逐项签`ACCEPT/CHANGE/DEFER/EXCLUDE`，尤其A_TECHNICAL_HOLD28项、权限历史、复合约束和当日并发消费。
- PostgreSQL16真实Current DDL/迁移/外键唯一性并发测试属于F02-1，**NOT_RUN**；当前G0 CI通过不等于这些测试通过。
- C/H01、main、PDM Final、Current IA、Low-Fi均未改动；F02-2/3/4与F03/F04业务、已迁/生产库、历史清库均未执行。
- 只有A明确签发`G0_ACCEPTED`，B才进入条件授权的F02-1。
