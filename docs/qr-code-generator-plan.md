# 星舵工坊 · QR 碼產生器規劃 / StarRudder QR Code Generator Plan

> 狀態：已確認，待本地實測 / Status: Confirmed, awaiting local verification
> 來源 / Source: `docs/tool-ideas.md` 候選 #2 QR 碼生成器 / Candidate #2
> 日期 / Date: 2026-11-26
> §8 五項待決全部按提議執行（透明背景、方形預設、Logo 不入 URL、分享連結含原文並提示、不做批次）。

---

## 0. 決策摘要 / Decisions at a glance

| 項目 / Item | 提議 / Proposal |
| --- | --- |
| 工具名 / Name | 中文「QR 碼產生器」，英文 `QR Code Generator`（功能名，不用 Studio） |
| 路由 / Route | `/tools/qr-code-generator`（無前綴英文）/ `/zh-Hant/tools/qr-code-generator`（繁中） |
| 核心 / Core | 文字或連結 → 即時 QR → 樣式調整 → 匯出 PNG / SVG，內容不離開瀏覽器 |
| 狀態存放 / State | 內容與樣式寫进 URL query；不寫 localStorage、不发网络请求 / URL-only, no storage, no network |
| 依賴 / Dependencies | 新增 `qrcode-generator@2`（零依賴、內建 TS 類型）；渲染與匯出自研 |
| 改造範圍 / Scope | 新增一個 feature + section + 雙路由 + OG，接入首頁/工具頁卡片、sitemap、SEO 基線、e2e、代理白名單 |

**核心命題 / Core idea**：把 QR 做成一件可離線使用的航海儀器——輸入即出碼，樣式所見即所得，連結本身攜帶完整設定；內容、Logo、歷史都不上傳、不保存。

> 命名約定：英文一律用功能名（不用 Studio），繁中一律用「產生器」（不用「生成器」）。本工具名已按 2026-11-26 的命名統一規則確定。

---

## 1. 產品定義 / Product definition

### 1.1 是什麼 / What it is

**中文**：QR 碼產生器是一個完全在瀏覽器中運行的靜態二維碼工具。輸入文字或連結，即時得到可掃描的 QR 碼；可調前景/背景色、圓點樣式、容錯級別與尺寸，並可嵌入中心 Logo。所有編碼在本機完成，不註冊、不上傳、不保存任何資料。

**English**: QR Code Generator is a browser-only tool for creating static QR codes. Type text or paste a link and get a scannable code instantly, with control over colors, dot style, error-correction level, size and an optional center logo. Encoding happens entirely on your device — no signup, no uploads, no stored data.

### 1.2 怎麼用 / How to use

**中文**：輸入內容 → 選容量/容錯與樣式 → 即時預覽並用手机實測 → 下載 PNG 或 SVG，或複製帶完整設定的分享連結。同一內容與設定永遠產生同一張碼。

**English**: Enter content → pick error correction and style → preview and test-scan with a phone → download PNG/SVG or copy a shareable link that encodes the full setup. The same input and settings always reproduce the same code.

### 1.3 用戶故事 / User stories

1. 作为活动组织者，我想把报名链接变成可印刷的二维码，且不带第三方水印。
2. 作为小店店主，我想用品牌色和 Logo 做一张能贴在店里的码，同时保证扫得出来。
3. 作为注重隐私的用户，我要求链接内容绝不上传到任何服务器。
4. 作为开发者，我想导出 SVG 用于印刷与放大而不失真。
5. 作为内容创作者，我想把「内容 + 样式」通过一条链接发给同事，对方打开即完全一致。

### 1.4 非目標 / Non-goals

- 不做動態碼/短連結/後台改指向/掃描統計（需服务器，与纯浏览器定位冲突）。
- 不做 QR 解碼/扫码识別（独立工具范畴，见 ideas 后续候选）。
- 不做账号、历史记录、收藏、云端模板。
- 不做需要外链下载字体或图标的样式（全部本地资源）。

---

## 2. 功能範圍 / Feature scope

### 2.1 輸入 / Input

- 單一文字輸入框，支援 URL、純文字、電話、郵件等；即時生成（debounce 約 150ms）。
- 內容为空时的初始状态：显示占位示例（如 `https://starrudder.cc`）并提示可直接改写，避免空白页。
- 容量提示：依所选容错级别显示还可容纳的字符数；超出上限时明确报错而非静默截断。
- 不强制把输入自动补成 `https://`——用户可生成任意文本码；但提供「当作网址打开」的可选说明。

### 2.2 樣式控制 / Style controls

| 控制項 / Control | 選項 / Options | 備註 / Notes |
| --- | --- | --- |
| 容錯級別 / Error correction | L / M / Q / H | 默认 M；嵌 Logo 时自动提示升级到 H |
| 尺寸 / Size | 256 / 512 / 1024 px | 导出像素；预览按容器缩放 |
| 前景色 / Foreground | 颜色选择器 | 默认深空蓝，需校验与背景对比 |
| 背景色 / Background | 颜色选择器 | 默认近白；提供透明背景选项（仅 PNG） |
| 點樣式 / Dot style | 方形 / 圆点 / 圆角方形 | 自研渲染，默认方形保证可扫 |
| 靜區 / Quiet zone | 固定 4 模块 | 不可关闭，保证扫描率 |
| 中心 Logo | 上传图片或关闭 | 仅在本地读取为 data URL，不上传；自动限制尺寸 |

**可掃描性保護 / Scannability guard**：当前景与背景对比不足，或 Logo 遮挡超过安全区时，显示警告但不阻止导出——用户可见风险，决策权留给用户。参考業界慣例：Logo 宽度 ≤ 碼宽 1/5、中心预留 20–30% 区域。

### 2.3 輸出 / Output

- **PNG**：canvas 绘製，`toBlob` 下载；可选择透明背景。
- **SVG**：矢量输出，文字以 path/rect 表达，不依赖外部字体，适合印刷与放大。
- **分享連結**：把内容（base64url）+ 样式参数写入 URL，复制即分享。
- **复制内容**：一键复制原始输入文本。

---

## 3. UX 與版面 / UX and layout

沿用 Image Studio 已验证的「所見即所得」布局，减少说明文字：

1. **上部並排**：左侧输入与控件，右侧实时预览，各占一半；控件自解释，不堆叠介绍文案。
2. **即時反饋**：输入即出码；样式改变立即反映在预览上，这是本工具最关键的体验。
3. **高度一致**：「继续加入」入口与结果卡片等高（沿用 Image Studio 的修复经验）。
4. **滚动条美化**：复用 `.scrollbar-slim`。
5. **移动端**：上下堆叠，预览固定在上方，避免编辑时看不到结果。

---

## 4. 技術方案 / Technical approach

### 4.1 依賴選型 / Dependency choice

| 方案 / Option | 優點 / Pros | 缺點 / Cons |
| --- | --- | --- |
| **`qrcode-generator@2`（推薦）** | 零依賴、內建 TypeScript 類型、约 10KB；提供 `getModuleCount()` / `isDark()` 原始矩阵，便于自研圆点与 Logo 渲染、直接产出 SVG | API 偏底层，渲染层需自己写 |
| `qrcode@1.5` + `@types/qrcode` | API 完整，内建 toCanvas/toDataURL/SVG | 依赖较重、类型需额外包、自定义样式受其绘制器限制 |

**結論 / Decision**：选 `qrcode-generator`。核心只需要「内容 → 布尔矩阵」，所有视觉样式与导出由自研代码负责，才能做到圆点、Logo、SVG 与站点风格一致，且保持零运行时依赖扩张。

### 4.2 資料流 / Data flow

```
input text + settings (URL state)
        ↓
  qrcode-generator → boolean[][] matrix
        ↓
  自研 renderer → <canvas> 預覽 / SVG 字串
        ↓
  toBlob → PNG  |  SVG → 下载  |  params → 分享連結
```

### 4.3 檔案結構 / File structure

```
src/features/qr-code-generator/
  lib/
    types.ts        # state、样式枚举、常量
    settings.ts     # URL <-> state 解析与序列化、默认值、容量估算
    matrix.ts       # 调用 qrcode-generator 生成布尔矩阵
    render.ts       # canvas 绘制（方/圆/圆角）、Logo 合成、对比度校验
    svg.ts          # 矩阵 -> SVG 字符串
    export.ts       # toBlob 下载、文件名
  components/
    qr-code-generator-tool.tsx
    qr-preview.tsx
src/components/sections/qr-code-generator-page.tsx
src/app/tools/qr-code-generator/{page,opengraph-image}.tsx
src/app/[locale]/tools/qr-code-generator/page.tsx
```

### 4.4 URL state

- 参数：`text`（base64url）、`ec`、`size`、`fg`、`bg`、`dots`、`logo`（可选 data URL，过大时不写入 URL）。
- 分享链接保留完整设置；与现有 Palette/Image Studio 行为一致。
- 注意内容可能很长：对超长内容写入 URL 时给出长度提示，避免生成不可用链接。

---

## 5. SEO 與文案 / SEO and copy

| 語種 / Locale | 標題 / Title | 描述 / Description |
| --- | --- | --- |
| en | `QR Code Generator — Free, Private, No Watermark` | Create scannable QR codes in your browser. Customize colors, dots and logo, export PNG or SVG. Nothing uploaded, no account, no watermark. |
| zh-Hant | `QR 碼產生器 — 免費、私密、無浮水印` | 在瀏覽器產生可掃描的 QR 碼，自訂顏色、點樣式與 Logo，匯出 PNG 或 SVG。不上傳、不註冊、無浮水印。 |

- 關鍵詞：`qr code generator`、`custom qr code`、`free qr code no watermark`、`qr 碼產生器`。
- FAQ `<details>`（含問號摘要）配 `FAQPage` JSON-LD，通过 SEO 闸门。
- 结构化数据：`SoftwareApplication`。
- OG 卡：复用 `OGCard`，标题 `QR Code Generator`，强调「no upload / no watermark」。
- 更新 `sitemap.ts`、`proxy.ts` 白名单、`scripts/seo-baseline.json`、首页与工具页卡片、README。

---

## 6. 測試計劃 / Test plan

- **單元測試**：URL 参数往返（含中文/emoji）、矩阵尺寸与容错、SVG 结构、容量边界、对比度警告阈值。
- **e2e**：输入即出码、样式切换后预览更新、PNG/SVG 下载、分享链接复现、繁中路由、外链全阻断下仍可用。
- **SEO 闸门**：18→20 路由审计，baseline 新增 2 条。
- **可掃描性**：用真实扫码器对默认样式与圆点+Logo 样式各验证一次（人工）。

---

## 7. 風險與緩解 / Risks and mitigations

| 風險 / Risk | 緩解 / Mitigation |
| --- | --- |
| 中国用户访问数据含中文时的编码問題 | `qrcode-generator` 的 `stringToBytes` 默认按 UTF-8；对中文做显式 UTF-8 编码并单测 |
| 圆点/Logo 降低识别率 | 默认方形+高对比；Logo 限制尺寸；对比不足与遮挡过大时警告 |
| 超长内容使 URL 过长 | 容量提示 + 长度警告；超限时建议缩短或关闭分享链接 |
| 依赖体积 | `qrcode-generator` 约 10KB 零依赖；仅动态 import 到工具页 |

---

## 8. 待決項 / Open questions

| # | 問題 / Question | 提議 / Proposal |
| --- | --- | --- |
| 1 | 是否允许透明背景？ | 允许，仅 PNG；SVG 用 `fill="none"`。增加一档复杂度但实用。 |
| 2 | 圆点样式是否默认开启？ | 默认方形（最稳）；圆点/圆角作为可选，用户主动选择。 |
| 3 | Logo 上传是否写入 URL？ | 不写入（data URL 过长）；仅本地会话使用，分享链接不含 Logo，并在 UI 说明。 |
| 4 | 分享链接是否编码原文本？ | 是。需在 UI 明确提示「連結含有你輸入的內容」——与站点「不保存」承诺不冲突（內容在連結里，由用户主动分享）。 |
| 5 | 是否加批次生成？ | 不加。保持单码专注，符合工具轻量定位。 |

> 已確認：五項全部按提議執行，實作已完成，等待使用者本地實測後再跑單測／e2e／SEO 審計並提交。
