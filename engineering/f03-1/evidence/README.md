# F03-1｜PostgreSQL 16 原始 CI 证据归档

## 来源与版本

- **来源 CI 运行**：GitHub Actions [37863317173](https://github.com/suzhe868-arch/mb/actions/runs/37863317173)
- **运行结果**：`completed / success`；作业编号：`113603999025`
- **运行对应 SHA**：`0c2a9d3c998149fb086a5eac19639a1a0ca9e71a`
- **来源工作分支**：`feat/f03-login-impl`
- **来源附件**：`f03-1-pg16-auth-and-schema`
- **来源附件 ID**：`11587760762`；[附件下载页](https://github.com/suzhe868-arch/mb/actions/runs/37863317173/artifacts/11587760762)
- **原始 ZIP 大小**：37,382 字节；**ZIP SHA-256**：`b6d8399a9094100451472cfc6dd6b7970e9c31783af657a22ab6e9229992e29f`

## 原样解压的证据文件

下列两个文件直接来自上述成功 CI 附件的 ZIP 内部，**字节未改动**；未重新执行数据库导出、未格式化、未修改换行或结构。

| 文件 | 原始大小（字节） | SHA-256 | Git Blob SHA-1 |
|---|---:|---|---|
| `pg16_schema_only.sql` | 133772 | `422bac4f54e938daa003e1b105356360f0b371dfa335771a7bbc781166bd0972` | `aa50492b55482de384f3c0ef6daa1ebf32a9d1e9` |
| `pg16_inventory.json` | 180215 | `98c8bbe019ba5025504873c8a77d73ef3a28382449a3bda199dedb4dd47e7119` | `e4bec9f2c633e012a331d359b8045ad528c369d3` |

## 复验操作

在本目录执行：
```bash
sha256sum pg16_schema_only.sql pg16_inventory.json
git hash-object pg16_schema_only.sql
git hash-object pg16_inventory.json
```
把结果与上表逐项比对，再核对来源运行号、成功 CI 与 artifact ID。

## 严格边界

本提交仅增加 `engineering/f03-1/evidence/` 下的两个原始证据文件及本来源说明；
不修改工程源码、迁移 SQL、数据库或正式产品规则；**不进行任何新数据库导出**。
证据归档提交使用 `[skip ci]`，防止因纯归档提交触发既有数据库导出工作流。
本归档用于 A 独立复验，**不代表 A 已签发 `F03_1_ACCEPTED`**，不合并 `main`，不进入下一批。
