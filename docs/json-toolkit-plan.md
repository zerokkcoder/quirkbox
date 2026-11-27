# 星舵工坊 · JSON 工具箱规划 / StarRudder JSON Toolkit Plan

> 状态：待审阅，确认后按 §9 实施 / Status: awaiting review, implement per §9
> 来源 / Source: `docs/tool-ideas.md` 候选 #6 JSON 工具箱 / Candidate #6
> 日期 / Date: 2026-11-27
> 方法 / Method: `/grill-with-docs` 两轮访谈；设计树已走到底，§8 为决策记录，**无待决项**
> 范式基准 / Skeleton reference: ASCII 艺术生成器（`731737e`）

---

## 0. 决策摘要 / Decisions at a glance

| 项目 / Item | 决策 / Decision |
| --- | --- |
| 工具名 / Name | 中文「JSON 工具箱」，英文 `JSON Toolkit`（功能名，不用 Studio）；繁中「JSON 工具箱」 |
| 路由 / Route | `/tools/json-toolkit`（无前缀英文）/ `/zh-Hant/tools/json-toolkit`（繁中） |
| 核心 / Core | 粘贴或拖入 JSON → 实时格式化 / 校验 / minify → 一键复制；JSON ↔ CSV/TSV 双向转换；全程在浏览器本地 |
| 功能范围 / Scope | 格式化 / 校验 / minify + JSON↔CSV/TSV 转换；**砍掉路径查询**（低频、需新依赖） |
| 页面形态 / Shape | 单页双 tab（格式化 / 转换），沿用 ASCII 的模式切换骨架，SEO 主词集中 |
| 分享边界 / URL state | **只编码配置**，输入内容永不进 URL（比 ascii 更保守） |
| 「压缩」语义 / Minify | 去空白与换行，输出仍是合法 JSON 文本；**不是 gzip/base64** |
| 分类 / Category | 工具页「开发 Development」领域第 1 个工具（该组原为空）；首页领域卡从 4 张增至 5 张 |
| 依赖 / Dependencies | 零新增运行时依赖；原生 `JSON.parse`/`stringify` + 自写 CSV 状态机 |
| 改造范围 / Footprint | 新增 feature + section + 双路由 + OG；接入首页、工具页、sitemap、proxy 白名单、双语、SEO 基线、e2e |

**核心命题 / Core idea**：把 JSON 工具做成一只密封的航海日志袋——数据进来、整理好、复制走，全程不出浏览器；分享出去的链接只带设置，不带数据。

> 命名约定：英文用功能名（不用 Studio），繁中沿用「工具箱」（繁简同形）。链接的隐私边界是卖点而非缺陷——UI 要明确告诉用户「分享链接不含你的数据」。

---

## 1. 产品定义 / Product definition

### 1.1 是什么 / What it is

**中文**：JSON 工具箱是一个完全在浏览器里运行的开发者工具。粘贴或拖入 JSON，实时格式化、校验并定位错误，一键 minify；也可以把 JSON 与 CSV/TSV 互相转换。所有处理在本机完成，不注册、不上传、不保存任何数据，分享链接只包含你选的设置。

**English**: JSON Toolkit is a browser-only developer tool. Paste or drop JSON to format it, validate it with line-and-column error locations, and minify it in one click. You can also convert JSON to and from CSV/TSV. Everything runs on your device — no signup, no uploads, no stored data, and share links carry settings only.

### 1.2 怎么用 / How to use

**中文**：粘贴 JSON（或拖入 `.json`/`.txt`）→ 选缩进与是否排序 → 读取格式化结果或错误位置 → 复制结果。需要转换时切到「转换」tab，选方向与分隔符，复制 CSV/TSV 或 JSON。

**English**: Paste JSON (or drop a `.json`/`.txt` file) → pick indentation and key ordering → read the formatted result or the error location → copy it. For conversion, switch to the Convert tab, choose a direction and delimiter, then copy the CSV/TSV or JSON.

### 1.3 用户故事 / User stories

1. 作为开发者，我想把压缩的 API 响应变成可读格式，直接复制进代码评审。
2. 作为调试者，我想在语法错误时看到 `行:列`，而不是一句含糊的 "Unexpected token"。
3. 作为数据分析者，我想把对象数组转成 CSV 贴进表格软件，嵌套字段原样保留。
4. 作为注重隐私的用户，我要求粘贴的 JSON 不离开设备、不进 URL、不进历史记录。
5. 作为繁中用户，我想在繁中界面完成同样操作，文案不混入简体或英文残留。

### 1.4 非目标 / Non-goals

- **不做路径查询（JSONPath）** — 低频、需新依赖，与零依赖调性冲突。
- **不做 JSON Schema 校验** — 需引入 `ajv` 类依赖，复杂度显著上升。
- **不处理 JSONC**（注释、尾逗号）— 非标准 JSON，报错即报错。
- **不做 gzip/base64 压缩** — 本工具「压缩」一律指 minify。
- **不做 CSV 类型推断** — `"007"` 必须保持字符串，不能悄悄变成 `7`。
- **不做账号、历史记录、云端同步、文件上传** — 与「不保存用户数据」冲突。
- **不做文件下载** — 结果以可复制文本呈现，保持工具轻量。

---

## 2. 功能范围 / Feature scope

### 2.1 Tab 1 · 格式化 / Format

- **解析与缩进**：`JSON.parse` → `JSON.stringify(value, replacer, indent)`；缩进默认 2 空格，可选 4 空格 / tab。
- **key 排序**：开关，递归对所有对象的 key 按字典序排列；默认关闭。
- **minify**：同一份解析结果用 `JSON.stringify(value)` 输出，去空白与换行，仍是合法 JSON 文本。
- **校验与定位**：解析失败时从 `error.message` 正则提取 `position` / `line` / `column`，显示为 `行 5:列 3`；提取失败时回退显示原生 message。不做源码高亮引擎。
- **实时反馈**：输入变化即重算；状态行显示 `Valid JSON · N chars` 或错误位置。

### 2.2 Tab 2 · 转换 / Convert

- **方向**：JSON → CSV/TSV、CSV/TSV → JSON，双向切换。
- **分隔符**：CSV 用逗号，TSV 用制表符（同一套逻辑，仅分隔符不同）。
- **JSON → 表格**：
  - 输入为对象数组，或单个对象（视为一行）。
  - 表头取所有对象的 key 并集，按首次出现顺序排列。
  - 标量值直接 `String(value)`；`null` 输出空串；数组与对象用 `JSON.stringify` 序列化为单元格字符串（**无损但单向**）。
  - 含逗号、引号、换行的单元格用双引号包裹，内部 `"` 转义为 `""`（RFC 4180）。
- **表格 → JSON**：
  - 自写 CSV 状态机解析，支持引号包裹、双引号转义、引号内换行。
  - 第一行作表头；**所有单元格一律作为字符串**，不推断数字/布尔/null。
  - 输出对象数组。
- **有损提示**：UI 明示「CSV 单元格按字符串导入，嵌套结构以 JSON 文本保留」；`null → 空串` 的单向损失一并说明。

### 2.3 输入 / Input

- 粘贴框为主，拖入 `.json` / `.txt` 文件为辅，纯本地 `FileReader`，不上传。
- 输入内容**永不写入 URL**，也不写 localStorage。
- 大输入（> 1 MB）给出性能提示，不阻断处理。

### 2.4 输出 / Output

- `<pre>` 等宽预览格式化结果或 CSV/TSV 文本，可选中、可一键复制。
- 复制失败时回退「请手动选中复制」提示。
- 不提供文件下载（见 §1.4）。

### 2.5 无障碍 / Accessibility

- 输入框、tab、缩进、排序开关、方向、分隔符均有可见 label 与键盘可操作性。
- 校验状态与错误位置用 `aria-live="polite"` 播报。
- tab 沿用站点 ToggleGroup 范式，焦点环与 `--ease-out` 节奏一致。

---

## 3. UX 与布局 / UX and layout

沿用 ASCII 的「操作区与预览区并排、各半宽、控件自解释」布局：

```
┌─────────────────────────────┬─────────────────────────────┐
│ [ Format ] [ Convert ]      │                             │
│                             │  格式化 JSON / CSV 结果      │
│  左：输入                    │                             │
│   粘贴 / 拖入 .json/.txt     │  （等宽、可滚动、可选中）     │
│   [ Clear ]                 │                             │
│                             │                             │
│  缩进 2 / 4 / tab            │                             │
│  排序 key [ ]               │                             │
│  （Convert 时换成：          │                             │
│    方向 / 分隔符）            │                             │
├─────────────────────────────┴─────────────────────────────┤
│ 状态：Valid JSON · 1,234 chars  |  复制结果  |  复制分享链接 │
└─────────────────────────────────────────────────────────────┘
```

1. **默认有内容**：预置一段示例 JSON，打开即有结果，不留空白页。
2. **即时反馈**：输入或任何设置变化立即重算右侧结果。
3. **错误内联**：解析错误直接显示在结果区，不弹窗、不遮罩。
4. **移动端**：上下堆叠，结果在上方，编辑时仍看得见输出。
5. **长文本**：结果区用 `.scrollbar-slim` 承载，不撑破布局。

---

## 4. 技术方案 / Technical approach

### 4.1 依赖选型 / Dependency choice

| 方案 / Option | 优点 / Pros | 缺点 / Cons |
| --- | --- | --- |
| **原生 JSON API + 自写 CSV 状态机（推荐）** | 零运行时依赖、零网络请求、可离线；纯函数易单测 | CSV 引号/换行边界需自己覆盖测试 |
| `ajv` 做 Schema 校验 | 校验能力强 | 依赖体积大，本工具不提供 Schema 输入，用不上 |
| `jsonpath` / `jsonpath-plus` 做路径查询 | 功能完整 | 低频、增依赖，已砍出范围 |
| `papaparse` 做 CSV | 成熟、边界齐全 | 增加运行时依赖，与站点零依赖调性不符 |

**结论 / Decision**：零新增运行时依赖。所有变换为纯函数，用原生 `JSON.parse` / `JSON.stringify`，CSV 解析用自写有限状态机（约 60 行）。

### 4.2 数据流 / Data flow

```
输入 JSON / CSV 文本
        ↓  normalize（去 BOM、统一换行）
  parse()  →  成功：value → format / minify / toCsv
           →  失败：{ line, column, message }
        ↓
  <pre> 结果预览  |  navigator.clipboard.writeText
        ↓
  settings → URL params（只写配置，输入永不序列化）
```

### 4.3 文件结构 / File structure

```
src/features/json-toolkit/
  lib/
    types.ts        # tab、缩进、方向、分隔符枚举，state 与默认值
    format.ts       # 纯函数：parse + stringify（格式化 / minify / key 排序）
    validate.ts     # 纯函数：错误定位（position → 行:列，原生 message 回退）
    csv.ts          # 纯函数：JSON ↔ CSV/TSV（含 RFC 4180 状态机）
    settings.ts     # state 归一化 + URL 参数双向解析（只编码配置）
    *.test.ts       # 上述纯函数单测
  components/
    json-toolkit-tool.tsx
src/components/sections/json-toolkit-page.tsx
src/app/tools/json-toolkit/{page,opengraph-image}.tsx
src/app/[locale]/tools/json-toolkit/page.tsx
e2e/json-toolkit.spec.ts
```

### 4.4 核心算法 / Core algorithms

**格式化与 minify**：`JSON.parse(text)` 一次，随后 `JSON.stringify(value, replacer, indent)`；`replacer` 在 `sortKeys` 开启时递归返回排序后的对象；`minify` 用同一 `value` 但 `indent` 省略。解析只做一次，避免重复报错。

**错误定位**：捕获 `SyntaxError`，从 `error.message` 依次正则匹配 `line (\d+) column (\d+)`、`position (\d+)`；命中 position 时按原文换行切分换算行列；均未命中时返回 `line: 0, column: 0` 并保留原生 message。不依赖 V8 特有格式。

**JSON → CSV**：输入归一化为 `object[]` → 计算 key 并集 → 逐行生成单元格（`null → ""`，容器 `JSON.stringify`，标量 `String`）→ 按分隔符拼接 → 含特殊字符的单元格加引号并转义 `"` → 行间以 `\n` 连接。

**CSV → JSON**：有限状态机按字符扫描，跟踪 `inQuotes`；`""` 解析为字面引号；换行在引号内视为单元格内容；首行作表头，其余行按表头组装对象，所有值为字符串。

### 4.5 URL state

- 参数：`tab`（`format|convert`）、`indent`（`2|4|tab`）、`sort`（`1`）、`direction`（`to-csv|to-json`）、`delimiter`（`csv|tsv`）。
- 默认值不写入 URL；非法值回退默认；**输入内容永不序列化**。
- 沿用 `replaceSearchState`（`@/lib/url-state`），只在事件处理器 / effect 中调用，不放进 `setState` updater 或 render 阶段（Palette Studio 曾踩坑）。
- UI 提示：「分享链接只包含设置，不包含你输入的数据」——把隐私边界显式化。

---

## 5. SEO 与文案 / SEO and copy

| 语种 / Locale | 标题 / Title | 描述 / Description |
| --- | --- | --- |
| en | `JSON Formatter & Validator — Format, Validate and Convert JSON` | Format, validate and minify JSON in your browser. Convert JSON to CSV or TSV and back. No signup, no upload — your data never leaves your device. |
| zh-Hant | `JSON 格式化與驗證工具 — 線上 JSON 轉 CSV` | 在瀏覽器格式化、驗證與壓縮 JSON，並支援 JSON 與 CSV/TSV 雙向轉換。免註冊、不上傳，資料不離開你的裝置。 |

- 关键词：`json formatter`、`json validator`、`json minify`、`json to csv`、`JSON 格式化`、`JSON 驗證`。
- FAQ `<details>`（`<summary>` 含问号）配 `FAQPage` JSON-LD，通过 SEO 闸门：
  - What is a JSON formatter? / 什么是 JSON 格式化工具？
  - Is my JSON uploaded anywhere? / 我的 JSON 会被上传吗？
  - How do I convert JSON to CSV? / JSON 怎么转 CSV？
- 结构化数据：`ToolPageIntro` 自动输出 `SoftwareApplication`。
- OG 卡：复用 `OGCard`，强调「no upload / settings-only share link」。

### 5.1 注册清单 / Registration checklist（8 处，逐项核对）

| # | 文件 | 改动 |
|---|---|---|
| 1 | `src/components/sections/tools-page.tsx` | 「开发 Development」组的空数组加入 JSON Toolkit 卡片（`Code2Icon`） |
| 2 | `src/components/sections/home-page.tsx` | `tools` 数组加工具卡；**`focusTiles` 增加第 5 张 development tile**，取 `labels.preview.focus[4]` |
| 3 | `messages/en.json` | `home.tools.jsonToolkit`、`tools.jsonToolkit.title`、顶层 `jsonToolkit`、`home.preview.focus` 增第 5 项、`footnote` 工具数 9→10 |
| 4 | `messages/zh-Hant.json` | 与 #3 结构逐键对齐（繁中文案） |
| 5 | `src/app/sitemap.ts` | `routes` 12→13 条；`lastModified` 更新为固定日期常量 |
| 6 | `src/proxy.ts` | `toolSlugs` 加 `json-toolkit` — **漏加则繁中路由直接 404** |
| 7 | `scripts/seo-baseline.json` | 文案定稿后跑 `npm run seo:audit:baseline` 刷新（新增 2 条路由 + 首页描述漂移） |
| 8 | `README.md` / `docs/tool-ideas.md` | 工具清单与决策记录同步 |

> 首页领域卡从 4 张变 5 张是**连带改动**：`development` 原本是空组，未出现在 `focusTiles`；现在它有了工具，必须与 design/marketing/content/travel 并列展示，否则首页与工具页不一致。

---

## 6. 测试计划 / Test plan

- **单元测试**（`src/features/json-toolkit/lib/*.test.ts`）：
  - 格式化：2/4/tab 缩进、key 排序、minify 仍是合法 JSON、确定性输出。
  - 校验：合法 JSON 通过；各类语法错误定位到正确 `行:列`；非 V8 格式 message 回退。
  - CSV：嵌套值序列化、含逗号/引号/换行单元格的转义、引号内换行往返、TSV 分隔符、表头并集、空单元格、CSV→JSON 不做类型推断（`"007"` 保持字符串）。
  - settings：URL 参数往返、非法值回退、默认值省略、**输入内容不进 URL**。
- **e2e**（`e2e/json-toolkit.spec.ts`）：默认有结果、粘贴后格式化、故意语法错误显示行列、缩进/排序切换、minify、双 tab 切换、JSON→CSV、CSV→JSON、拖入文件、分享链接只复现配置、繁中路由、外链阻断下仍可用。
- **SEO 闸门**：路由 24→26，baseline 新增 2 条；FAQ 问号摘要与可见字数通过；英文标题 ≤ 70 字符。
- **人工**：1 MB JSON 响应时间可接受；CSV 引号边界在表格软件中打开正确；浅色/深色主题可读性；手机端上下堆叠布局。

---

## 7. 风险与缓解 / Risks and mitigations

| 风险 / Risk | 缓解 / Mitigation |
| --- | --- |
| 大 JSON 阻塞主线程 | 输入防抖 + 超过 1 MB 提示；不引入 Worker 以保持轻量 |
| CSV 嵌套序列化后往返类型丢失 | UI 明示「单元格按字符串导入」；表头与值都用 JSON 文本保留结构，不假装可逆 |
| 原生 `SyntaxError` message 跨浏览器不一致 | 正则多模式匹配 + 原生 message 回退，测试覆盖非 V8 字符串 |
| 只编码配置导致分享复现性弱 | 明确标注为隐私特性；UI 提示链接不含数据 |
| `proxy.ts` 的 `toolSlugs` 漏加 | 注册清单显式列出；e2e 加繁中路由用例 |
| 首页领域卡数量变化引起文案漂移 | `preview.focus` 与 `footnote` 同步改；最后统一刷新 SEO baseline |
| 改文案后 pre-commit 拒绝漂移的 baseline | 按 `AGENTS.md` 的 Shipping checks，文案定稿后先跑 `npm run seo:audit:baseline` |
| CSV 状态机边界（BOM、CRLF、尾随换行） | 单测覆盖 BOM/CRLF/空行；`normalize` 统一换行后再解析 |

---

## 8. 决策记录 / Decision log（访谈结论，无待决项）

本工具经 `/grill-with-docs` 两轮访谈把设计树走到底，以下为最终决策，实现阶段不再悬而未决：

| 编号 | 问题 | 结论 |
| --- | --- | --- |
| Q1 | 5 项能力哪些进第一版 | **核心四件套**：格式化/校验/minify + JSON↔CSV/TSV；砍路径查询 |
| Q2 | 页面形态 | **单页双 tab**（格式化 / 转换），沿用 ASCII 的模式切换骨架 |
| Q3 | 分享边界 | **只编码配置**，输入内容永不进 URL（比推荐的「带上限编码内容」更保守） |
| Q4 | 文档落点 | 先写本文档，确认后再实现；按需落 GLOSSARY，不建 ADR |
| Q5 | 「压缩」语义 | **minify**（去空白、仍是合法 JSON），不是 gzip |
| Q6 | CSV 嵌套处理 | `JSON.stringify` 序列化为单元格字符串；反向导入不推断类型 |
| Q7 | 输入方式 | 粘贴框 + 拖入 `.json`/`.txt`，纯本地 `FileReader` |
| Q8 | SEO 主词 | `json formatter` 为主，标题含 Validator，CSV 为次级词 |

**默认项**（未在访谈中单独提问，随上述决策一并采纳）：

- 2 空格缩进为默认，可选 4 / tab；key 排序开关默认关闭。
- 校验错误显示 `行:列` + 原生 message，不做源码高亮引擎。
- CSV 默认逗号分隔，TSV 用制表符；表头取所有对象的 key 并集。
- 反向 CSV→JSON 所有单元格作字符串，不做类型推断。
- 不处理 JSONC（注释、尾逗号）。

**ADR 判断**：三项条件（难逆转 / 无上下文会困惑 / 真实取舍）均不满足，不建 ADR。`GLOSSARY.md` 懒创建，仅收录 `minify` 一条术语。

---

## 9. 实施顺序 / Implementation order

审阅通过后按此编号清单推进：

1. `types.ts` + `format.ts` / `validate.ts` 与单测，先让格式化与错误定位可验证。
2. `csv.ts` 与单测，覆盖引号、换行、TSV、表头并集、不推断类型。
3. `settings.ts` 与单测，确认 URL 只写配置、输入不进 URL。
4. `json-toolkit-tool.tsx`，接通双 tab、粘贴/拖入、复制、分享链接。
5. section + 两个路由页 + metadata + OG 卡。
6. 双语三处文案 + 首页两张卡（`tools` 与 `focusTiles`）+ 工具页 development 组 + sitemap + `proxy.ts` + README。
7. e2e 用例。
8. 文案定稿后跑 `npm run seo:audit:baseline` 刷新基线。
9. **先交给你本地实测**；确认后再按约定顺序跑单测 → lint → build → SEO 审计 → e2e → 提交推送。
