# 证据清单（对应工单 2388 验收标准）

本目录为 `/commission/records/:id` 详情页的验收证据，全部由自动化脚本从 `npm run build` 后的
生产构建（`vite preview`，端口 5178）上以 Chromium 1360×980 / DPR 2 截取，未做任何后期修饰。

| 文件 | 对应验收标准 | 内容 |
| --- | --- | --- |
| `01-accrual-record.png` | AC 1 | 计提记录 `/commission/records/1` 整页，金额 ¥5,703.26 |
| `02-clawback-record.png` | AC 1 | 扣回记录 `/commission/records/2` 整页，金额显示为红色负数 -¥5,703.26 |
| `03-adjustment-record.png` | AC 1 | 调整记录 `/commission/records/3` 整页，含三级审批链，金额 ¥7,594.87 |
| `04-rounding-tail-highlight.png` | AC 2 | 计算步骤区块特写：第 3 / 5 / 6 步橙色底 + 「取整」标签，第 7 步红色底 + 「尾差」标签 |
| `05-replay-consistent.png` | AC 3 | 默认模式点击「重放校验」后整页，绿色提示「重放校验：一致」 |
| `05b-replay-consistent-alert.png` | AC 3 | 上图的提示条特写，含「按规则 R-2026.09-v2 重放，逐步比对的 8 个计算步骤输出与落库值完全一致」 |
| `06-replay-diff.png` | AC 3 | `?replay=diff` 模式点击「重放校验」后整页，橙色提示「重放校验：发现差异」 |
| `06b-replay-diff-step.png` | AC 3 | 第一处差异步骤特写：第 2 步「计算提成总额（未取整）」标注「重放差异」，并列出落库值 814,752.2110 分与重放值 808,002.7844 分 |
| `07-replay-consistent.gif` | AC 3 | 重放校验「一致」全过程动图：进入页面 → 点击按钮 → 出现绿色一致提示 → 滚动到计算步骤 |
| `08-replay-diff.gif` | AC 3 | 重放校验「差异」全过程动图：以 `?replay=diff` 进入 → 点击按钮 → 出现差异提示 → 滚动到第 2 步的差异标记 |
| `09-step-section-fixed.png` | AC 2（返修后重出） | 第 ④ 区块整块：第 4 步公式为「主业务员份额 = 提成总额（未取整） × 主业务员占比」，输入列未取整总额 814,752.2110 分；第 6 步同口径；第 3 / 5 / 6 步橙底橙框、第 7 步红底红框 |
| `09b-step4-formula.png` | AC 2（返修后重出） | 第 4 步特写：公式、输入「提成总额（未取整） 814,752.2110 分 × 70.00%」、输出 570,326.5477 分，三者可手算对齐 |
| `shots.json` | — | 截图脚本写出的文件清单与字节数 |

01–08 为返修前取证，按要求原样保留（高亮样式与重放交互未改动）；第 ④ 区块的文字口径以返修后重出的 `09-step-section-fixed.png` / `09b-step4-formula.png` 为准。

## 两种重放返回的复现方式

- 一致：`http://localhost:5173/commission/records/1`，点击「重放校验」
- 差异：`http://localhost:5173/commission/records/1?replay=diff`，点击「重放校验」

动图为 36 帧、约 170ms/帧、约 6 秒一轮，由 puppeteer 风格的帧采集脚本逐帧截屏后在浏览器内用 gifenc 编码，
未依赖任何系统级录屏软件（本机无 ffmpeg 可用路径，故采用帧序列合成动图）。
