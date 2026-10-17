# F05-7 V2｜独立签署影子门禁（仅离线）

状态：`READY_FOR_A_REVIEW_BLOCKED_FORMAL_ISSUER`（工程候选自测，不是A正式验收）。

## 职责边界

仅位于 `audit/f05-v2-source-shadow-trust/**`。此包没有GitHub工作流、GitHub API调用、真实签名、真实Source消费者写入、私有档案上传，也没有任何生产激活功能。五Source始终保持 `SOURCE_GAP_OPEN_FAIL_CLOSED`。

本影子软件用于让A审查下列接口及恶意输入处理，**不得以代码模拟对象代替账户独立身份**：

- 官方身份：固定 `repo_id=1382955791`、Run `39035485532`、SHA `bdffc492…`、`push/attempt1`，4个真实Artifact digest、66项唯一Job、931份原文件、`63 PG16 + 2 NonPG`真实成功、1项旧`match-source` `BLOCKED_EQUIVALENCE`。原旧66原生工作流签约从未全通过。
- 第一层：`official_shadow_manifest.py`复用仓库中已经由A受限合并的只读ZIP验真代码，检查四份**原始官方ZIP**的固定SHA、双层ZIP和931原文字节、66历史Job；只输出允许的去敏字段与hash。若原件过期或不在，`BLOCKED_EVIDENCE_EXPIRED`，不能把Mock说成GitHub真实证据。
- 第二层：`shadow_gate.mjs`固定审核事实、重新规范化去敏manifest摘要、约束Sigstore声明subject/repo/工作流等**接口形状**，并明确把真实加密信任根、受保护A审核人、不可变私有归档、官方REST、持久账本视为外部尚未建立。任何伪造字段、合法-looking Ed25519/Sigstore描述、模拟WORM或模拟外部台账都不会解锁。
- 第三层：对 `F05-7/F05-8/F05-9/F05-10-D1/F05-10` 影子消费者一律只读、五项都拒绝，任何迁移、少接一个消费者、回滚到旧PASS都会被拒绝。**正式五个Source程序一个字也未修改。**

## 实际离线运行

在仓库根目录：

```bash
python audit/f05-v2-source-shadow-trust/official_shadow_manifest.py --zip-dir /path/to/four-original-github-artifact-zips > /tmp/shadow-manifest.json
node audit/f05-v2-source-shadow-trust/shadow_gate.mjs /tmp/shadow-manifest.json
node --test audit/f05-v2-source-shadow-trust/test_shadow_gate.test.mjs
F05_V2_OFFICIAL_ARTIFACT_DIR=/path/to/four-original-github-artifact-zips python -m unittest discover -s audit/f05-v2-source-shadow-trust -p 'test_*.py' -v
```

演示JSON `official_shadow_manifest.json`是本轮使用真实原始ZIP计算的**已固定的去敏摘要快照**，不是永久保存原件或REST新实证；文件内显式写入 `online_github_rest_verified_by_A:false`。JS负例读取此去敏快照作测试夹具。Python正例必须提供原始四ZIP，**没有真实文件时不得声称这些测试通过**；负例使用临时ZIP仿品而且只验证明确的拒绝行为。

## 真实安全缺口 / A独立职责

- `BLOCKED_SIGNER_TRUST`：受保护Environment、不能由B改写的reviewer+OIDC信任锚及真实官方Sigstore验证尚未落实。Sigstore bundle伪造对象、测试生成公钥或本地Mock不能代替A独立来源。
- `BLOCKED_IMMUTABLE_ARCHIVE`：四份含原测试证据的ZIP仅被用户本地临时保存，**未**授权公开上传或可证明的非公开WORM长存。
- `BLOCKED_READONLY_END_TO_END_A_CONTEXT`：本包离线ZIP原文验证不等于A身份执行的GitHub REST分页及Step/Job/Artifact交叉核查。
- `BLOCKED_REPLAY_LEDGER`：`shadowReplayProbe`仅形状/攻击模拟，不宣称本地Set是耐久原子台账。
- `BLOCKED_LEGACY_ORACLE`：旧原生66来源并不全PASS，不得因为新审核而重写历史。
- 未获A新签约许可前不得在正式Source上挂载此包，不能开放生产。GitHub账户按用户要求保持 **$0 硬预算**，不触发CI，不上传新Artifact，不使用Token或Secrets。

## 自检与交接

测试精确命令和运行结果见 `B工程交接报告.md`。四份真实官方ZIP不进入任何本次代码包、Issue或公开GitHub目录；也不进入去敏快照。
