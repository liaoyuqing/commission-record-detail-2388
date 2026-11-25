# 工作台 · 单笔提成计算过程详情页

会员空间平台招商业务员工作台的提成计算记录详情页实现，对应路由 `/commission/records/:id`。
页面把一笔提成记录从「输入」到「落账」的全过程摊开，供业务员与财务逐步核对，并提供「重放校验」按钮复算落库值。

## 技术栈

- Vite 5 + React 18 + TypeScript 5（`strict`）
- TDesign React 1.18（`tdesign-react`）
- React Router 6（`BrowserRouter`）
- Vitest 2 + Testing Library（jsdom 环境）

## 运行方法

```bash
npm install        # 安装依赖，约 212 个包
npm run dev        # 启动开发服务器，默认 http://localhost:5173
```

打开以下路由查看三种记录：

| 路由 | 记录类型 | 说明 |
| --- | --- | --- |
| `http://localhost:5173/commission/records/1` | 计提 | 金额为正，含完整 8 步计算链 |
| `http://localhost:5173/commission/records/2` | 扣回 | 金额为红色负数，关联原计提记录 |
| `http://localhost:5173/commission/records/3` | 调整 | 含三级审批链，10 步计算链 |

重放校验的两种返回用 URL 参数切换：

- 默认（不带参数）：点击「重放校验」后显示「一致」
- `http://localhost:5173/commission/records/1?replay=diff`：点击后显示第一处差异步骤

其他命令：

```bash
npm test           # vitest run，4 个测试文件 34 个用例
npm run typecheck  # tsc --noEmit
npm run build      # 生产构建，产物在 dist/
npm run preview    # 预览构建产物
```

## 页面结构

五个区块，字段名与工单原文一致：

1. **概要**：业务员、角色、金额（扣回显示为红色负数）、类型（计提 / 扣回 / 调整）、状态、所属月份
2. **输入**：回款信息（期次、到账日、实收金额、排除款项明细）、合同信息（编号、签约日、交易类型、会籍档位、空间类型、租期、折扣率、线索来源）、当月此前累计、合同已计提
3. **规则**：版本号与生效区间、命中规则行（可展开查看全部条件）、未命中行原因折叠列表
4. **计算步骤**：时间轴逐步展示公式、输入与输出；取整步骤（橙色底 + 「取整」标签）与尾差步骤（红色底 + 「尾差」标签）单独高亮
5. **关联**：被替代 / 替代的记录链、扣回对应的原计提记录、调整记录的审批链

## 金额口径

- 全流程金额以「分」存整数，展示层用 `src/lib/money.ts` 格式化，避免浮点误差
- 取整统一 `ROUND_HALF_UP`（`src/lib/calc.ts` 的 `divRoundHalfUp`，纯整数运算）
- 提成拆分恒等式：`主业务员份额取整 + 协同份额取整 + 尾差 = 取整总额`，尾差归集到主业务员，保证拆分合计与总额严格相等

以记录 1 为例：实收 ¥96,500.00 减排除款项 ¥79.62 得基数 ¥96,420.38，按 8.45% 计得未取整提成 814,752.2110 分；取整后总额 ¥8,147.52，主业务员份额未取整 570,326.5477 分、取整 ¥5,703.27，协同份额 ¥2,444.26，尾差 -¥0.01，最终落账 ¥5,703.26。

## 对接点（mock 说明）

本单按工单约定不接真实后端，所有数据来自 `src/mock/records.ts`，接口封装在 `src/api/commission.ts`。
替换为真实接口时只改这个文件，页面组件不感知数据来源：

| 函数 | 计划对接的接口 | 当前行为 |
| --- | --- | --- |
| `fetchRecord(id)` | `GET /api/v1/commission/records/{id}` | 从内存 mock 数组按 id 查找，延迟 320ms |
| `fetchRecordList()` | `GET /api/v1/commission/records` | 返回全部 mock 记录 |
| `replayRecord(record, mode)` | `POST /api/v1/commission/records/{id}/replay` | 本地重跑算式，`consistent` 模式返回一致，`diff` 模式返回第一处差异 |
| `resolveReplayMode(search)` | 无（页面开关） | 读 URL 查询串 `?replay=diff` |

依赖的上游工单同样以 mock 承接，真实接入时在这两处替换：

- **S2-IAM（身份、角色与数据范围）**：当前业务员身份硬编码在 `src/mock/records.ts` 的 `salesperson` 字段（虚构值「业务员 D-12 / E2026012」）。真实接入应从 S2-IAM 的当前用户上下文取，并按数据范围过滤记录可见性。
- **S2-WB（工作台前端框架）**：当前以独立的 `BrowserRouter` + 自定义页面骨架（`src/App.tsx`、`src/components/SectionCard.tsx`）承接，未挂到工作台的路由树与菜单里。真实接入时把 `/commission/records/:id` 注册进 S2-WB 的路由表，页面内的导航、面包屑与权限占位改由框架提供。

## 环境变量

本工程不需要任何环境变量、密钥或后端服务即可完整运行。若后续接入真实接口，约定的变量名如下（不写入仓库）：

- `VITE_COMMISSION_API_BASE`：提成模块接口根地址
- `VITE_IAM_API_BASE`：身份与数据范围接口根地址

## 测试

```bash
npm test
```

- `src/lib/money.test.ts`：金额格式化、负数、万分比换算
- `src/lib/calc.test.ts`：取整函数、拆分恒等式、计算步骤生成、重放校验的一致与差异定位
- `src/mock/records.test.ts`：mock 数据集覆盖三种类型、id 映射、扣回为负、审批链完整
- `src/pages/CommissionRecordDetail.test.tsx`：路由渲染、扣回红色负数、取整 / 尾差高亮属性、未命中原因、两种重放结果

## 证据

`evidence/` 目录存放验收截图与重放演示动图，清单见 `evidence/README.md`。
