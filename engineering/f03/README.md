# F03-G0｜限定权限合同与纯决策模块

状态：`B_IMPLEMENTATION / NOT_A_ACCEPTED`。A签发的唯一范围是 `07_重建工作区/F03-G0_A主控正式施工放行_2026-10-09.md`。

本目录：
- `permission-contract.tsv`：45项代表动作及跨域责任映射。列明 Final 来源、actor、capability/代码映射、hard DENY、当前 scope、对象状态、字段投影、实现责任与明确 NOT_RUN。
- `identity-session-contract.md`：Employee/4S/System Admin/Customer 身份边界和 F03-1 会话待裁定事项；非真正认证实现。
- `policy.mjs`：Node ESM 纯权限决策 `authorize(operation, currentFacts)` 及小范围字段白名单 `projectRecord`，由受信的未来服务端事实解析器提供输入；未知或缺失事实默认拒绝。
- `authority-test-traceability.md`：Final → 合同 → 测试的覆盖及延期交接。
- `tests/*.test.mjs`：假数据允许/拒绝、4S/System Admin隔离、电话价格字段过滤、撤销事实、hard DENY/scope突变敏感性。
- `verify-contract.mjs`：未引入数据库/网络/业务路由的只读安全边界检查。
- `F03-G0_B自验与A复验报告.md`：工程与 CI、自验限制及风险。

运行命令（仅在 CI 无数据库环境）：

```sh
cd engineering
node f03/verify-contract.mjs
node --test f03/tests/*.test.mjs
```

**本批不得**使用真实用户/凭证、连接数据库、上线会话、添加 F04 业务 API、建立完整角色默认种子或越阶段。若测试通过，也只说明静态假数据决策，而非实际撤权/交易/接口端到端验收。
