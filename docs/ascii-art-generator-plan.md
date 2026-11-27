# 星舵工坊 · ASCII 艺术生成器规划 / StarRudder ASCII Art Generator Plan

> 状态：v1 已实现；v2 图片模式已实现，待本地实测 / Status: v1 shipped; v2 image mode implemented, pending local QA
> 来源 / Source: `docs/tool-ideas.md` 候选 #4 ASCII 艺术生成器 / Candidate #4
> 日期 / Date: 2026-11-27
> 说明：原文为规划稿；§10 记录了 2026-11-27 追加的「图片转 ASCII」需求与实现范围。

---

## 0. 决策摘要 / Decisions at a glance

| 项目 / Item | 提议 / Proposal |
| --- | --- |
| 工具名 / Name | 中文「ASCII 艺术生成器」，英文 `ASCII Art Generator`（功能名，不用 Studio）；繁中词条「ASCII 藝術產生器」 |
| 路由 / Route | `/tools/ascii-art-generator`（无前缀英文）/ `/zh-Hant/tools/ascii-art-generator`（繁中） |
| 核心 / Core | 输入短句 → 选字体风格与宽度 → 实时字符画预览 → 复制纯文本或导出 PNG；全部在浏览器本地完成 |
| 字体数据 / Fonts | 内置 6 种精简 figlet 字体（静态数据，**零运行时依赖**）；非 ASCII 字符回退为 `?` 并提示 |
| 状态存放 / State | 文本、字体、间距、对齐、导出背景写入 URL；不写 localStorage、不发网络请求 / URL-only, no storage, no network |
| 分类 / Category | 归入工具页「内容创作 Content」领域（该领域第 2 个工具） |
| 改造范围 / Scope | 新增一个 feature + section + 双路由 + OG，接入首页/工具页卡片、sitemap、SEO 基线、代理白名单、e2e |

**核心命题 / Core idea**：把字符画做成一件可复现的航海电报机——打字、选字体、定宽度，立刻看到字符组成的标题；复制纯文本到处分享，链接本身携带完整配方。输入不上传、结果不留存。

> 命名约定：英文一律用功能名（不用 Studio），繁中一律用「產生器」（不用「生成器」）。本工具名已按 2026-11-26 的命名统一规则拟定。

---

## 1. 产品定义 / Product definition

### 1.1 是什么 / What it is

**中文**：ASCII 艺术生成器是一个完全在浏览器里运行的文字工具。输入一句短话，选择字体风格和字符间距，实时看到由字符拼成的标题画；可以复制纯文本贴到聊天、评论、README，也可以导出 PNG 图片。所有渲染在本机完成，不注册、不上传、不保存任何数据。

**English**: ASCII Art Generator is a browser-only text tool. Type a short phrase, pick a font style and character spacing, and watch a character-built headline appear live. Copy the plain text into chats, comments, or a README, or export it as a PNG. Everything renders on your device — no signup, no uploads, no stored data.

### 1.2 怎么用 / How to use

**中文**：输入文字（建议 1–18 个字符）→ 选一种字体风格 → 调间距与对齐 → 复制文本或下载 PNG。同一组参数永远得到同一张字符画，分享链接打开即完全复现。

**English**: Type a phrase (1–18 characters works best) → choose a font style → adjust spacing and alignment → copy the text or download a PNG. The same parameters always reproduce the same art, and a shared link restores the exact setup.

### 1.3 用户故事 / User stories

1. 作为社交用户，我想把昵称变成字符画，复制到评论区而不上传任何内容。
2. 作为开发者，我想给 README 或终端输出加一个大字标题，直接复制纯文本。
3. 作为内容创作者，我想导出一张字符画 PNG，配到帖子或视频封面里。
4. 作为注重隐私的用户，我要求输入的文字不离开设备、不写入历史记录。
5. 作为繁中用户，我想在繁中界面完成同样操作，且文案不混入简体或英文残留。

### 1.4 非目标 / Non-goals

- ~~不做图片转字符画（亮度映射）~~ — 已在 §10 的 v2 中实现，此条仅保留为 v1 历史记录。
- 不做账号、历史记录、云端模板、字体上传（与「不保存用户数据」冲突）。
- 不做 ANSI 彩色终端输出、动画字符画、多行手写排版（保持工具轻量，见 §8 待决项 6）。
- 不做商用字体嵌入；内置字体仅使用公有领域的经典 figlet 字形数据并精简。

---

## 2. 功能范围 / Feature scope

### 2.1 字体风格 / Font styles

内置 6 种精简 figlet 字体，均以静态 TS 数据随包发布：

| ID | 名称 / Name | 特征 / Character | 适用场景 / Use case |
| --- | --- | --- | --- |
| `standard` | Standard | 经典块状轮廓，最通用 | 默认；README、评论 |
| `big` | Big | 粗笔画、强视觉冲击 | 标题、封面 |
| `slant` | Slant | 斜体连笔，动感 | 社交签名 |
| `small` | Small | 紧凑细笔画 | 长句、窄列 |
| `banner` | Banner | 横幅装饰感 | 活动海报文字 |
| `digital` | Digital | 数码管七段风格 | 技术、终端主题 |

- 每种字体覆盖 `A–Z`、`0–9` 与常用标点（`. , ! ? - _ 空格`），存为「字符 → 行数组」的查表结构。
- 非支持字符（含中文、emoji）统一回退为 `?`，并在输入框旁给出一行轻量提示：**建议先输入英文与数字**；不做静默丢弃。
- 字体切换保留输入文字，只重绘字符画；无网可离线使用。

### 2.2 输入与排版 / Input and layout

- **输入**：单行文本，上限 40 字符（防止字符画过宽、URL 过长）；超出上限截断并提示，不抛错。
- **间距**：字符间空列 0–3（默认 1），影响字符画总宽度。
- **对齐**：左 / 居中 / 右（默认左）；仅影响 `<pre>` 与 PNG 画布内的水平位置，不改变字符画本身。
- **换行**：不做自动折行。字符画按字体原始行输出，用横向滚动容器承载宽结果（`.scrollbar-slim`），避免破坏字形。
- **宽度提示**：实时显示当前字符画列数；超过 80 列时给出「适合宽屏」的轻量提示，不阻断操作。

### 2.3 输出 / Outputs

- **字符画预览**：`<pre>` 等宽字体渲染，纯文本、可选中；随输入/字体/间距/对齐即时更新。
- **复制文本**：`navigator.clipboard.writeText`；失败时回退「请手动选中复制」提示。复制内容为纯 ASCII 字符画，不含背景色等样式信息。
- **导出 PNG**：离屏 canvas 按行绘制等宽文字，2× 像素密度导出；前景色默认星金（`primary`），背景可选透明 / 深空 / 雾白三档；文件名 `starrudder-ascii-art-<font>.png`。
- **分享链接**：`text`（base64url UTF-8）、`font`、`gap`、`align`、`bg` 写入 URL query；刷新与分享完整复现。文本编码复用 QR 工具已验证的 UTF-8 → base64url 方案（见 §4.3）。

### 2.4 无障碍 / Accessibility

- 输入框有可见 label 与字符计数（`aria-live="polite"`），超限提示可被读屏捕获。
- 字体、间距、对齐控件均为可键盘操作的原生 button / select；焦点环与站点一致。
- `<pre>` 预览加 `aria-label`，让读屏用户知道这是生成的字符画；不逐字朗读。
- 复制与下载按钮沿用 `Button` 组件，保留按压反馈（`active:scale-[0.97]`）与 `--ease-out` 节奏。

---

## 3. UX 与布局 / UX and layout

沿用 QR / 渐变壁纸已验证的「操作区与预览区并排、各占一半、控件自解释」布局，减少说明文字：

```
┌──────────────────────────┬──────────────────────────┐
│ 左：操作区                │ 右：字符画预览            │
│  文本输入（含字数）       │                          │
│  字体风格 6 选 1          │    等宽字符画            │
│  间距 0–3 / 对齐 3 档     │    （横向可滚动）         │
│  导出背景 3 档            │                          │
│  非支持字符提示           │                          │
├──────────────────────────┴──────────────────────────┤
│  复制文本 | 下载 PNG | 分享链接                     │
└───────────────────────────────────────────────────────┘
```

1. **上部并排**：左操作、右预览，各半宽；默认示例文字 `HELLO` 直接出图，不留空白页。
2. **即时反馈**：任何输入/字体/间距/对齐变化立即重绘预览。
3. **高度一致**：操作卡片与预览卡片等高（沿用 Image Studio 修复经验）。
4. **移动端**：上下堆叠，预览在上方，编辑时仍能看见结果。
5. **滚动条**：预览区用 `.scrollbar-slim`，宽字符画横向滚动不撑破布局。

---

## 4. 技术方案 / Technical approach

### 4.1 依赖选型 / Dependency choice

| 方案 / Option | 优点 / Pros | 缺点 / Cons |
| --- | --- | --- |
| **内置精简 figlet 数据 + 自研渲染（推荐）** | 零运行时依赖、零网络请求、可离线；字体数据可裁剪到 6 种常用字形；纯函数易单测 | 需一次性录入字体数据；非 ASCII 字符需回退策略 |
| `figlet` npm 包 | 字体齐全、成熟 | 增加运行时体积；需处理字体文件加载；与「轻量离线」调性不符 |
| canvas 像素采样转字符 | 无需字体数据，任意文字都能转 | 产出只是点阵粗糙字形，不是经典 figlet 大字；效果不达预期 |

**结论 / Decision**：零新增运行时依赖。字体数据作为静态 TS 常量提交，渲染器为纯函数；不加载远程字体、不发起任何网络请求。

### 4.2 数据流 / Data flow

```
输入文本 + 字体 ID + 间距 + 对齐
        ↓  normalize（非支持字符 → ?，长度截断）
  renderAscii(state) → string[]（逐行字符画）
        ↓
  <pre> 预览  |  canvas 绘制 → toBlob → PNG 下载
        ↓
  state → URL params（分享 / 刷新复现）
```

### 4.3 文件结构 / File structure

```
src/features/ascii-art-generator/
  lib/
    types.ts        # state、字体 ID、间距/对齐/背景枚举与默认值
    fonts.ts        # 6 种精简 figlet 字体数据（字符 → 行数组）+ 元数据
    render.ts       # 纯函数：文本 → 字符画行数组（含回退、间距、对齐）
    settings.ts     # URL <-> state 解析与序列化、归一化、base64url 文本编解码
    export.ts       # 离屏 canvas 绘制与 PNG 下载
    *.test.ts       # 上述纯函数单测
  components/
    ascii-art-generator-tool.tsx
    ascii-preview.tsx        # <pre> 预览 + 横向滚动
src/components/sections/ascii-art-generator-page.tsx
src/app/tools/ascii-art-generator/{page,opengraph-image}.tsx
src/app/[locale]/tools/ascii-art-generator/page.tsx
e2e/ascii-art-generator.spec.ts
```

### 4.4 字体数据与渲染算法 / Font data and renderer

- 字体数据结构：`Record<FontId, { label: string; glyphs: Record<string, string[]> }>`；每个 glyph 是等宽行数组，行宽由字体自身决定。
- 渲染：按字符查 glyph → 逐行横向拼接（字符间插入 `gap` 个空格）→ 按 `align` 对每行做左侧填充（以字体最宽行作为对齐基准）→ 输出行数组。
- 不支持字符回退 `?` 的 glyph；输入含非支持字符时返回提示标志，UI 显示一行提示。
- 渲染结果确定性强：相同 `(text, font, gap, align)` 永远得到相同行数组，便于快照单测。
- 字体数据录入来源：公有领域 figlet 字体（standard / big / slant / small / banner / digital），只取 A–Z、0–9 与常用标点，转成 TS 常量；不引入运行时解析器。

### 4.5 URL state

- 参数：`text`（base64url UTF-8，复用 `@/features/qr-code-generator/lib/utf8` 的编码方案或抽公共模块）、`font`、`gap`（0–3）、`align`（`left|center|right`）、`bg`（`transparent|space|mist`）。
- 默认值不写入 URL；非法值回退默认。
- 沿用 `replaceSearchState`（只在事件处理器/effect 中调用，不放 `setState` updater——Palette Studio 已踩坑）。
- 40 字符文本编码后约 54 字符，加参数总长仍在安全范围。

---

## 5. SEO 与文案 / SEO and copy

| 语种 / Locale | 标题 / Title | 描述 / Description |
| --- | --- | --- |
| en | `ASCII Art Generator — Free Text to ASCII Art` | Turn text into ASCII art in your browser. Choose a font style and width, copy plain text or export a PNG. No signup, no upload. |
| zh-Hant | `ASCII 藝術產生器 — 線上文字轉字符畫` | 在瀏覽器把文字轉成 ASCII 字符畫。選字型與寬度，複製純文字或匯出 PNG。免註冊、不上傳。 |

- 关键词：`ascii art generator`、`text to ascii art`、`ascii art maker`、`ASCII 藝術產生器`。
- FAQ `<details>`（`<summary>` 含问号）配 `FAQPage` JSON-LD，通过 SEO 闸门：
  - 什么是 ASCII 艺术？ How do I make ASCII art from text?
  - 字符画能直接复制吗？ Can I copy the art as plain text?
  - 文字会被上传吗？ Is my text uploaded anywhere?
- 结构化数据：`ToolPageIntro` 自动输出 `SoftwareApplication`。
- OG 卡：复用 `OGCard`，标题 `ASCII Art Generator`，强调「no upload / copy text + PNG」。
- 更新 `sitemap.ts`（11→12 条路由，各语言展开 22→24 条）、`proxy.ts` 若有静态资源需求则加白名单（本工具无新增静态图片，预计无需改）、`scripts/seo-baseline.json`、首页工具清单与工具页「内容创作」分类、README。

---

## 6. 测试计划 / Test plan

- **单元测试**：6 种字体 glyph 完整性、文本→字符画确定性快照、非支持字符回退、长度截断、间距/对齐输出、URL 参数往返（含非法值回退）、base64url 文本编解码（中文与 emoji 往返）。
- **e2e**：默认即有预览、输入文字后预览变化、6 种字体切换、间距/对齐变化、复制文本、PNG 下载、分享链接复现、繁中路由、外链阻断下仍可用。
- **SEO 闸门**：22→24 路由审计，baseline 新增 2 条；FAQ 问号摘要与可见字数通过；英文标题 ≤ 70 字符。
- **人工**：复制字符画到终端/README 看字形是否对齐；PNG 在浅色/深色背景上查看可读性；手机端横向滚动是否顺手。

---

## 7. 风险与缓解 / Risks and mitigations

| 风险 / Risk | 缓解 / Mitigation |
| --- | --- |
| 字体数据录入量大、易出错 | 只取 A–Z、0–9 与常用标点；写 glyph 完整性单测，缺字即失败 |
| 宽字符画撑破布局 | `<pre>` 包在横向滚动容器；不自动折行以免破坏字形 |
| 中文/emoji 输入无法成字 | 回退 `?` 并显示提示，不静默丢弃；URL 编码仍用 UTF-8 保证分享复现 |
| PNG 导出文字模糊 | 离屏 canvas 2× 像素密度 + 等宽字体；导出后释放引用 |
| 分享链接过长 | 文本上限 40 字符、默认值不写 URL；base64url 比原文略长但可控 |
| 繁中描述混入英文与空格导致 SEO 计数漂移 | 文案定稿后一次性刷新 baseline；之后改动走 baseline 命令 |
| 与已有随机名字工具同属「内容创作」，定位重叠 | 本工具强调「字符画标题/可复制文本」，与「名字生成」互补；首页文案同步说明 |

---

## 8. 待决项 / Open questions（请审阅时按编号回复）

以下项目已有推荐默认值，如无异议将按推荐执行：

1. **核心形态**：A. 文字 → 字符画 / B. 图片 → 字符画 / **C. 两者都做（用户 2026-11-27 确认，已实现）**。
2. **字体数量**：A. **6 种（推荐，覆盖经典 figlet 风格）** / B. 3 种最精简（standard / big / slant） / C. 8 种以上（数据录入与测试成本上升）。
3. **输入上限**：A. **40 字符（推荐，平衡表现力与 URL 长度）** / B. 18 字符（字符画更整齐，长句受限） / C. 80 字符（宽屏可用，但字符画极长）。
4. **导出背景**：A. **透明 / 深空 / 雾白三档（推荐，适配两种主题）** / B. 仅透明（最简） / C. 跟随当前主题自动取背景色。
5. **字符画上色**：A. **纯色星金（推荐，保持字符画可复制的纯粹性）** / B. 星金渐变上色（只影响 PNG，视觉更花） / C. 用户自选前景色。
6. **额外玩法**：A. **不做（推荐，保持轻量）** / B. 加 ANSI 彩色终端输出 / C. 加随机字符画种子按钮。
7. **工具页分类**：A. **内容创作 Content（推荐，字符画用于社交与文案）** / B. 设计 Design（与设计类视觉工具同组，但该领域已有 5 个工具）。
8. **首页文案**：A. **同步更新「内容创作」领域卡描述，加入字符画（推荐，首页与工具页一致）** / B. 只加工具卡链接，不改领域卡描述。

---

## 9. 实施顺序 / Implementation order

审阅通过后按此编号清单推进：

1. 新增 `types.ts` / `fonts.ts`（6 种字体数据）与 glyph 完整性单测。
2. 新增 `render.ts` 与快照/回退/对齐单测，先让字符画生成可验证。
3. 新增 `settings.ts`（URL 往返与文本编解码）与单测。
4. 新增 `export.ts`（离屏 canvas PNG）与单测。
5. 实现 `ascii-preview.tsx` 与主工具组件，接通 URL 状态、复制、下载、分享。
6. 新增 section 与两个路由页、metadata、OG 卡。
7. 补齐中英文案、首页/工具页卡片（内容创作分类）、sitemap、SEO 基线、README。
8. 新增 e2e 用例。
9. **先交给你本地实测**；确认后再按约定顺序跑单测 → lint → build → SEO 审计 → e2e → 提交推送。

---

## 10. v2 · 图片转 ASCII + TAAG 文字排版 / Image mode & TAAG text options（2026-11-27）

**触发 / Trigger**：参考 `asciigenerators.com`，用户要求「文本和图片都可以」；随后指定文字模式参考 TAAG 的 Isometric2 / 横纵间距 / 翻转，并要求图片默认彩色、移除远程 URL。

### 10.1 已实现 / Implemented

| 能力 / Capability | 实现 / Approach |
| --- | --- |
| 双模式 | 顶部 Text / Image 切换；`mode=image` 写入 URL，默认文字模式保持干净 URL |
| 文字字体 | 原 6 种点阵风格 + 真实 FIGlet **Isometric2**（静态 glyph 数据，11×18 单元格）；共 7 种 |
| 文字排版 | 水平间距 0–6、垂直间距 0–4、水平翻转；对应 TAAG 的 `h` / `v` / `x=flip`，参数 `vgap` / `flip` 进 URL |
| 图片输入 | 仅本地文件选择、拖放、`Ctrl+V` 粘贴；**已移除远程 URL 入口**，文件只在浏览器解码 |
| 亮度映射 | 20–160 列；默认字符长宽比 1:2；5 种字符梯度（Classic / Blocks / Matrix / Minimal / Braille） |
| 点字模式 | 2×4 点阵映射为 U+2800–U+28FF，跨平台对齐稳定 |
| 色阶控制 | 亮度 −100…100、对比 0.5×…2×、反相；可选 Floyd–Steinberg 抖色 |
| 彩色输出 | **始终开启**：预览逐字符 `<span>` 还原原图颜色，PNG 逐字符 `fillText`；已移除「使用图片颜色」开关与 `color` URL 参数 |
| 背景选择 | 透明 / 深空 / 雾白三档同时作用于预览容器与导出 PNG；纯文本复制不受影响，颜色定义在 `lib/palette.ts` 共用 |
| URL 状态 | 图片设置全部序列化，**图片本身不写入 URL**；分享链接只复现设置 |
| 预览自适应 | 文字与图片预览共用容器测量 + 字号缩放，完整显示整张字符画，**无横向/纵向滚动条** |
| 控件布局 | 水平间距独占一行并可换行；对齐与垂直间距并列；避免与翻转按钮重叠；反相独立一行，无冗余彩色开关 |
| 隐私 | 解码上限 1400px，object URL 在替换/卸载时释放；无上传、无 localStorage |

### 10.2 未包含 / Out of scope

参考站的边缘检测、字符画缩放（Discord / YouTube / Twitch 预设）、SVG / ANSI / Markdown 导出、渐变着色与水印未纳入本轮，避免把轻量工具变成参数面板。若实测后需要，再按优先级补。

### 10.3 改动文件 / Files touched

- `src/features/ascii-art-generator/lib/`：`types.ts`、`settings.ts`、`render.ts`（间距/翻转 + 可选 `colors`）、`isometric2.ts`（FIGlet 字形数据）、`image-render.ts`、`image-source.ts`、`palette.ts`（预览/导出共用配色）及对应单测。
- `src/features/ascii-art-generator/components/`：`ascii-art-generator-tool.tsx`、`ascii-preview.tsx`。
- 双语文案 `messages/{en,zh-Hant}.json`（含工具卡描述与 SEO 文案）、`e2e/ascii-art-generator.spec.ts`。
- `docs/tool-ideas.md` 候选 #4 说明与本规划文档。

### 10.4 待验证 / Still pending（按项目约定）

改动先留在本地工作区；用户实测确认后再跑单测 → lint → build → SEO 审计 → e2e → 提交推送。
注意：本轮改了 SEO 标题/描述/工具卡文案，`scripts/seo-baseline.json` 需在文案定稿后刷新， Baseline 刷新前 SEO 审计会报文案漂移。
