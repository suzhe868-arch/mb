# 名邦汽车 V1｜Legacy Engineering Baseline（历史工程资产基线）

生成日期：2026-10-08  
历史来源：2026-09-17 CR007 工程基线；已通过 2026-09-22 全量快照历史链核验为同一工程基线。

## 1. 定位

本目录是**历史工程资产基线**，用于后续 Engineering Delta 与代码/数据复用。

它计划承载旧工程已形成的：

- PostgreSQL Schema / Migration / Seed；
- 车型主数据与导入资产；
- OpenAPI / Contract / operation ownership；
- Backend TypeScript 工程骨架；
- Foundation / Contract Tests；
- 数据库迁移、Contract 生成、Baseline 校验脚本；
- 旧 Workstream 工程拆分与工程状态资料。

## 2. 非 Authority 声明

**本目录不是当前产品 Authority，也不是当前可直接部署的最终代码。**

任何业务语义、状态机、权限、价格、锁车、Priority、图片、电话、车型映射等实现，在复用前都必须与当前 PDM-01～25 Final 做 Delta。

## 3. 权威优先级

从高到低：

1. 当前 PDM-01～25 Final：业务规则最高 Authority；
2. 后续冻结的 Current IA：能力归属 / 页面 / 导航 Authority；
3. 后续冻结的 Current Low-Fi：页面状态与交互投影 Authority；
4. 后续生成的 Current Engineering Baseline / Work Order：正式施工 Authority；
5. 本 Legacy Engineering Baseline：仅用于 KEEP / MODIFY / ADD / DEPRECATED Delta；
6. 更早历史资料：仅用于追溯证据。

冲突时，上层 Authority 永远覆盖下层历史资产。禁止用本目录反向修改 PDM Final。

## 4. 正确使用顺序

`PDM Final → Current IA → Current Low-Fi → Legacy Engineering Baseline → Engineering Delta → Current Engineering Baseline → Codex 施工`

旧资产逐项标记：

- `KEEP_DATA`：真实数据资产，原则上保留；
- `KEEP_CANDIDATE_VERIFY`：通用工程资产，验证后复用；
- `MODIFY_REQUIRED`：结构有价值，但必须按 Current Authority 修改；
- `ADD_REQUIRED`：当前规则需要、旧工程没有；
- `DEPRECATED_LOGIC_REFERENCE`：仅供差异审计，禁止恢复旧逻辑；
- `REFERENCE_ONLY`：只看历史成熟度/上下文，不作为施工依据。

## 5. 已知禁止直接恢复项

- 旧 `Mingbang → Collector Phone API` 调用方向；
- 旧 `Collector Base URL / Phone Path` 后台配置模型；
- 把旧 `vehicles.biz_status` 当成车辆业务状态唯一 Authority；
- 把旧品牌/车系 source ID 假设直接当成当前车型映射规则；
- 任何与当前 PDM Final 冲突的旧 API、权限、价格、Priority、锁车/候补、图片规则。

采集/Collector 程序本体已确认是独立正常运行系统，本目录不负责重写采集后台。名邦侧只按最终 Integration API Contract 与其联调。

## 6. 目录计划

- `00_治理规则/`：本目录的 Authority、复用边界、禁恢复项；
- `01_ENGINEERING_STARTER_LEGACY/`：9/17 CR007 提纯后的旧工程资产本体。

> 当前治理入口先行落库。大体积旧工程资产本体应解压后放入 `01_ENGINEERING_STARTER_LEGACY/`，不要只提交 ZIP。
