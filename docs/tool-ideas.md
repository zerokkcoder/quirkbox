# 工具选题池 / Tool Idea Backlog

> 状态 / Status: 选题池，待逐个挑选规划 / Backlog, pick one to plan
> 日期 / Date: 2026-11-25

---

## 0. 选题原则 / Selection principles

每个候选都必须符合本站已有的产品约束：

1. **纯浏览器**：全部计算在客户端完成，无后端、无账号、无上传、无用户数据留存。
2. **可分享**：状态能编码进 URL（种子、配置），打开链接即可复现结果。
3. **SEO 可承接**：有稳定搜索词，页面能用「是什么 / 怎么用」写清楚，可挂 `SoftwareApplication` 结构化数据。
4. **复用现有骨架**：沿用 `src/features/<tool>` + `src/components/sections/<tool>-page` + 双路由（无前缀英文 / `[locale]`）+ OG 卡 + `ToolPageIntro` + 审计闸门。

Each candidate must stay browser-only, URL-shareable, SEO-friendly, and fit the
existing feature/section/route/OG/audit skeleton without new infrastructure.

---

## A. 创意生成器类 / Creative generators

### 1. 配色方案生成器 — Palette Studio ⭐ 已选 / Selected

- **是什么 / What it is**：输入一个种子色，生成 5 色和谐配色，附 WCAG 对比度检查与色盲模拟。
- **怎么用 / How to use**：选种子色 → 切换配色规则 → 复制 CSS 变量 / Tailwind token，或把种子写进 URL 分享。
- **契合点 / Fit**：完全无状态，配色藏进 URL；SEO 词 `color palette generator`、`tailwind color generator`。
- **复杂度 / Effort**：低—中 / Low–medium。

### 2. QR 码生成器 — QR Studio

- **是什么 / What it is**：把文字或链接转成二维码，可定制圆点样式、前景背景色、居中 Logo，无水印。
- **怎么用 / How to use**：输入内容 → 调样式 → 导出 PNG / SVG。
- **契合点 / Fit**：内容不上传、不在服务器生成，正好击中隐私痛点；SEO 词 `qr code generator`、`custom qr code`。
- **复杂度 / Effort**：中 / Medium。

### 3. 渐变背景生成器 — Gradient Studio

- **是什么 / What it is**：可视化调色标与角度，生成 CSS 渐变，支持随机种子。
- **怎么用 / How to use**：拖动色标 → 选线性 / 径向 / 锥形 → 复制 CSS 或导出壁纸图。
- **契合点 / Fit**：与 Emoji 壁纸同属「视觉生成器 + 种子分享」模式，复用成本低。
- **复杂度 / Effort**：低 / Low。

### 4. ASCII 艺术生成器 — Text Art

- **是什么 / What it is**：把文字或短句转成字符画，可调字体风格与宽度。
- **怎么用 / How to use**：输入文字 → 选风格 → 复制纯文本到处分享。
- **契合点 / Fit**：分享性极强、零依赖；SEO 词 `ascii art generator`。
- **复杂度 / Effort**：低 / Low。

---

## B. 开发者实用类 / Developer utilities

### 5. 图片格式转换器 — Image Studio ⭐ 推荐 / Recommended

- **是什么 / What it is**：在浏览器里把图片转成 WebP / PNG / JPEG，调质量与尺寸，可批量。
- **怎么用 / How to use**：拖入图片（不上传）→ 选格式与参数 → 下载。
- **契合点 / Fit**：「文件不离开设备」是最强差异化，直接呼应站点核心定位；SEO 词 `image converter`、`png to webp`。
- **复杂度 / Effort**：中 / Medium。

### 6. JSON 工具箱 — JSON Toolkit ⭐ 推荐 / Recommended

- **是什么 / What it is**：格式化、校验、压缩、JSON ↔ CSV/TSV 转换、路径查询。
- **怎么用 / How to use**：粘贴或拖入 JSON → 实时格式化 / 报错定位 → 复制结果。
- **契合点 / Fit**：纯本地处理，开发者高频刚需；SEO 词 `json formatter`、`json validator`。
- **复杂度 / Effort**：低—中 / Low–medium。

### 7. 密码 / 口令生成器 — Passphrase Lab

- **是什么 / What it is**：生成高强度随机密码或可读口令，带强度指示与生成逻辑说明。
- **怎么用 / How to use**：调长度与字符规则 → 生成 → 一键复制（密码本身不进 URL、不留存）。
- **契合点 / Fit**：本地 CSPRNG 生成、无网络请求是信任卖点；SEO 词 `password generator`。
- **复杂度 / Effort**：低 / Low。

### 8. 时间戳转换工具 — Epoch Converter

- **是什么 / What it is**：Unix 时间戳 ↔ 各时区日期互转，支持秒 / 毫秒。
- **怎么用 / How to use**：输入任一格式 → 实时看到所有表示。
- **契合点 / Fit**：开发者 + SEO 双命中，实现极简；SEO 词 `unix timestamp converter`。
- **复杂度 / Effort**：低 / Low。

---

## 决策记录 / Decision log

| 日期 / Date | 决定 / Decision |
| --- | --- |
| 2026-11-25 | 从 8 个候选中选择 **#1 配色方案生成器 Palette Studio** 进入规划；其余保留在本池。 |
| 2026-11-25 | 优先序参考：#5 图片格式转换器 > #6 JSON 工具箱 > #2 QR 码生成器 > 其余。 |
