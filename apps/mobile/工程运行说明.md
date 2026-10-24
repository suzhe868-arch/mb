# 名邦汽车 V1｜C-APP-01 客户手机端工程

> 正式边界：A_RELEASED_FOR_C_APP_01_MOCK_ONLY。此目录为 **虚构数据演示**，不是可用于真实客户、支付、身份、锁车、收藏或咨询的生产客户端。页面中的数字、照片不对应真实在售车辆。

## 工程结构

- `customer/`：Taro 4 + React + TypeScript 客户端，两个允许的页面：C01 首页和 C01-01 最小安全只读详情。
- `shared/`：客户安全 DTO、无敏感字段 Mock、QueryState 查询与筛选、七种排序、权限/分享可见性判定、模拟身份与明确拒绝的未签字真实接口。
- `evidence/`：真实 CI 浏览器截图归档目标；没有生成的截图不可宣称存在。

## 本地命令

从 `apps/mobile/customer` 运行（需联网安装 npm 包）：

```bash
npm ci
npm run test:static
npm test
npm run typecheck
npm run build:h5
npm run build:weapp
npm run dev:h5
```

截图：先将 H5 `dist` 目录通过本机静态服务器监听 `127.0.0.1:4173`，运行 `npx playwright install chromium` 和 `npm run test:browser`。脚本覆盖四种屏宽及频道/弹层/详情返回，成功后截图存放 `../evidence/浏览器截图/`。

## 受控 Mock 场景

顶部场景选择：正常、加载、空、网络错误、无 Banner、无图、撤权；模拟普通/粉丝/VIP仅用于视觉演示，**不是后端权益认证**。前端不得把本地数值、路由 query 参数、字符串比对或隐藏按钮解释成真实客户授权。

## 产品约束

默认批发频道、地域全国；仅用户主动切换城市；名邦和 4S 精选机会块按同一查询过滤，没有匹配即隐藏；条件没有结果不自动放宽。分页15条。小程序分享只携带车辆 ID，真实链接开启时必须再向合法后端读取当前可见性；C-APP-01 的本地 Mock 拒绝样例不等于真实后端已完成。

**缺口：** 真正 PDM-12 解析器、API Session/Scope/Object/价格额度与字段级 Projection、微信真机、生产图片/CDN/OSS、图片保存、全套 C01-01 业务状态、正式 C02/C03/E 页面，都未获本包放行。下一阶段由 A 再签发。
