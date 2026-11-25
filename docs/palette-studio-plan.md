# 星舵工坊 · 配色方案生成器规划 / StarRudder Palette Studio Plan

> 状态：待审阅 / Status: Awaiting review
> 来源 / Source: `docs/tool-ideas.md` 候选 #1 / Candidate #1
> 日期 / Date: 2026-11-25

---

## 0. 决策摘要 / Decisions at a glance

| 项目 / Item | 提议 / Proposal |
| --- | --- |
| 工具名 / Name | 中文「配色方案生成器」，英文 `Palette Studio` |
| 路由 / Route | `/tools/palette-studio`（无前缀英文）/ `/zh-Hant/tools/palette-studio`（繁中） |
| 核心 / Core | 种子色 → OKLCH 和谐配色 → 对比度与色盲检查 → 复制 / 导出 / URL 分享 |
| 状态存放 / State | 完全在 URL query，不写 localStorage、不发网络请求 / URL-only, no storage, no network |
| 依赖 / Dependencies | 零新增运行时依赖，色彩转换自研并单测 / Zero new runtime dependencies |
| 改造范围 / Scope | 新增一个 feature + section + 双路由 + OG，接入首页/工具页卡片、sitemap、SEO 基线、e2e |

**核心命题 / Core idea**：把「调色盘」做成一件可复现的航海仪器——给一个种子色，得到一套和谐、可读、可分享的配色；整套计算留在浏览器里，链接本身就是配方。

---

## 1. 产品定义 / Product definition

### 1.1 是什么 / What it is

**中文**：配色方案生成器是一个在浏览器里运行的在线调色工具。输入一个种子色，它按色彩和谐规则生成一整组配色，并即时标出每个颜色在白字/黑字下的 WCAG 对比度与色盲模拟效果。不注册、不上传、不保存任何数据。

**English**: Palette Studio is an online color palette generator that runs entirely in your browser. Give it one seed color and it produces a harmonious palette with WCAG contrast ratings and color-blind simulation for every swatch — no signup, no uploads, no stored data.

### 1.2 怎么用 / How to use

**中文**：输入或拾取一个种子色 → 选择配色规则与颜色数量 → 点色块复制色值，或查看对比度与色盲模拟 → 一键复制 CSS 变量 / Tailwind token，或复制带有完整配置的分享链接。同一样子色与规则永远生成同一套配色。

**English**: Pick a seed color → choose a harmony rule and swatch count → click a swatch to copy its hex, inspect contrast and color-blind previews → copy CSS variables / Tailwind tokens, or share a link that encodes the full configuration. The same seed and rule always reproduce the same palette.

### 1.3 用户故事 / User stories

1. 作为前端开发者，我想快速得到一套和谐的配色并直接复制成 CSS 变量。
2. 作为设计师，我想确认每个颜色配白字/黑字是否达到 WCAG AA/AAA。
3. 作为色觉差异用户，我想看到配色在三类色盲模拟下的样子。
4. 作为内容创作者，我想把配色配方通过一条链接发给同事，对方打开即完全一致。
5. 作为注重隐私的用户，我要求颜色输入不离开设备、不进任何日志。

### 1.4 非目标 / Non-goals

- 不做账号、云同步、历史记录、收藏夹（与「不保存用户数据」冲突）。
- 不做图片取色/调色盘提取（可作为后续独立工具，见 ideas #3/#5）。
- 不引入 UI 组件库之外的第三方色彩库（见 §7 待决项 1）。
- 不做画布级渐变编辑（属于 ideas #3 的独立范围）。

---

## 2. 功能规格 / Feature spec

### 2.1 输入 / Inputs

| 输入 / Input | 形式 / Control | URL 参数 / Param | 默认 / Default |
| --- | --- | --- | --- |
| 种子色 / Seed color | `input[type=color]` + hex 文本框 | `color`（不含 `#`） | `#3E5C9E`（品牌航海蓝） |
| 配色规则 / Harmony | ToggleGroup | `harmony` | `analogous` |
| 颜色数量 / Count | Slider 3–6 | `count` | `5` |
| 色盲模拟 / Simulation | ToggleGroup（关 / 红 / 绿 / 蓝） | 不写入 URL（仅预览） | 关 |

- 所有输入变化通过 `replaceSearchState` 同步进 URL；刷新与分享都能复现。
- 非法 hex / 未知规则 / 越界 count 一律回退到默认值，不抛错。
- `/` 字符与 `#` 不直接出现在 query 中：`color` 存 6 位 hex，无需编码。

### 2.2 配色规则 / Harmony rules

在 OKLCH 空间做色相旋转与明度阶梯，保证感知均匀（比 HSL 混色更少「脏色」）：

| 规则 / Rule | 色相偏移 / Hue offsets | 说明 / Description |
| --- | --- | --- |
| `analogous` 邻近色 | −30, −15, 0, +15, +30 | 统一、稳妥的主色系 |
| `complementary` 互补色 | 0, ±12, 180, ±192 | 两族对撞，强调对比 |
| `split` 分裂互补 | 0, ±12, 150, 210 | 对比更柔和 |
| `triadic` 三角色 | 0, ±12, 120, 240 | 活泼且平衡 |
| `tetradic` 四角色 | 0, 90, 180, 270 | 最丰富，适合多状态 UI |
| `mono` 单色 | 色相不变，明度阶梯 0.28 → 0.86 | 极简、层级清晰 |

- 输出数量按 `count` 在上述骨架上均匀取样；明度做交错（如 0.42 / 0.64 / 0.52 / 0.76 / 0.34），避免色块「一样亮」。
- 色度（chroma）按目标明度自适应并做 gamut 映射，保证能在 sRGB 中显示。

### 2.3 输出与导出 / Outputs & exports

1. **色块条 / Swatch strip**：横排 5（或 3–6）个色块，显示 hex，点击即复制，焦点与 hover 有明确反馈。
2. **CSS 变量**：`:root { --palette-1: #xxxxxx; … }`
3. **Tailwind v4 token**：`@theme { --color-palette-1: #xxxxxx; … }`
4. **JSON**：`{ "seed": "#xxxxxx", "harmony": "analogous", "colors": ["#…"] }`
5. **PNG 色卡**：canvas 绘制色块 + hex 标签，导出 `starrudder-palette-<seed>.png`。
6. **分享链接**：`?color=&harmony=&count=` 完整编码，复制按钮 + 站点既有 X 分享按钮。

### 2.4 无障碍 / Accessibility

| 检查 / Check | 规则 / Rule | 呈现 / UI |
| --- | --- | --- |
| WCAG 对比度 / Contrast | 相对亮度比 ≥ 4.5（AA 正文）、≥ 3（AA 大字）、≥ 7（AAA） | 每个色块标注「白字 x.x:1 / 黑字 y.y:1」与 AA/AAA 徽章 |
| 自动前景色 / Auto foreground | 在白/黑中选对比度更高者 | 色块内 hex 文字自动取色，保证始终可读 |
| 色盲模拟 / CVD simulation | 红色盲 / 绿色盲 / 蓝色盲（线性 RGB 矩阵变换） | 切换后整条色块即时重绘 |
| 键盘操作 / Keyboard | 色块可 Tab 聚焦、Enter 复制 | 与现有工具同一焦点样式 |
| 国际化 / Locale | 界面文案双语，色值不受语言影响 | 无前缀英文 / `/zh-Hant` 繁中 |

### 2.5 URL 状态 / URL state

沿用 `src/lib/url-state.ts` 的 `replaceSearchState`；组件从服务端 `searchParams` 读 `initialState`，客户端变化只 `replaceState`，不触发导航、不产生历史堆栈。

---

## 3. 技术方案 / Technical design

### 3.1 色彩管线 / Color pipeline

```
hex → sRGB linear → OKLab → OKLCH (L, C, H)
     → 按 harmony 规则旋转 H、设定 L/C 阶梯
     → gamut 映射（逐次降低 C 直到所有通道落在 [0,1]）
     → OKLab → sRGB linear → gamma → hex
```

- 转换矩阵采用 Björn Ottosson 的 OKLab 常量（公开算法，非第三方依赖）。
- gamut 映射用二分/迭代降 C，保证输出一定可显示；单测覆盖极端种子色（纯黑、纯白、高饱和荧光色）。
- 色盲模拟在线性 RGB 上套 Viénot/Brettel 简化矩阵，再回到 sRGB。

### 3.2 模块划分 / Modules

```
src/features/palette-studio/
├── lib/
│   ├── types.ts            # HarmonyId、PaletteState、Swatch 类型与规则常量
│   ├── color.ts            # hex ↔ OKLCH、gamut 映射、gamma
│   ├── harmony.ts          # 规则 → 颜色序列（纯函数，可单测）
│   ├── contrast.ts         # WCAG 相对亮度、对比度、自动前景色
│   ├── color-blind.ts      # 三类模拟矩阵
│   ├── export.ts           # CSS / Tailwind / JSON / PNG 文本生成
│   └── *.test.ts           # 上列纯函数单测
└── components/
    ├── palette-studio-tool.tsx   # 主交互，URL 同步、复制、分享
    └── swatch.tsx                # 单个色块（对比度徽章、点击复制）
```

- 所有 `lib/*` 都是**纯函数**，不依赖 React / DOM，便于 Vitest 覆盖。
- PNG 绘制留在组件层（`canvas`），`export.ts` 只产出数据结构与文本。

### 3.3 交互与布局 / UI layout

沿用旅行足迹的「上预览、下操作」结构，避免长列表撑坏布局：

```
┌──────────────────────────────────────────┐
│  Palette strip（横向色块，点击复制 hex） │
├──────────────────┬───────────────────────┤
│ 左列 / Controls  │ 右列 / Inspection     │
│ 种子色拾取+hex   │ 对比度表 + AA/AAA     │
│ 规则 ToggleGroup │ 色盲模拟切换          │
│ 数量 Slider      │ 导出按钮组            │
│ 随机按钮         │ 分享链接              │
└──────────────────┴───────────────────────┘
```

- 移动端单列：预览区 → 操作区 → 检查区。
- 深空主题下色块保留真实颜色，边框用 `--border`，文字用自动前景色，避免「暗底暗字」。

---

## 4. 文件清单 / File checklist

### 4.1 新增 / Add

| 文件 / File | 用途 / Purpose |
| --- | --- |
| `src/features/palette-studio/lib/types.ts` | `HarmonyId` / `PaletteState` / `Swatch` |
| `src/features/palette-studio/lib/color.ts` | hex ↔ OKLCH、gamut 映射 |
| `src/features/palette-studio/lib/harmony.ts` | 六种规则的纯函数生成 |
| `src/features/palette-studio/lib/contrast.ts` | WCAG 对比度、自动前景色 |
| `src/features/palette-studio/lib/color-blind.ts` | 三类色盲模拟 |
| `src/features/palette-studio/lib/export.ts` | CSS / Tailwind / JSON / PNG 数据 |
| `src/features/palette-studio/lib/*.test.ts` | 上述纯函数单测（预计 25–35 例） |
| `src/features/palette-studio/components/swatch.tsx` | 色块组件 |
| `src/features/palette-studio/components/palette-studio-tool.tsx` | 主交互组件 |
| `src/components/sections/palette-studio-page.tsx` | 页面 section（PageHeader + ToolPageIntro + Tool） |
| `src/app/tools/palette-studio/page.tsx` | 英文路由 + metadata |
| `src/app/[locale]/tools/palette-studio/page.tsx` | 繁中路由 + generateMetadata |
| `src/app/tools/palette-studio/opengraph-image.tsx` | OG 卡 |
| `e2e/palette-studio.spec.ts` | 交互、复制、导出、URL 复现、双语 |

### 4.2 修改 / Edit

| 文件 / File | 改动 / Change |
| --- | --- |
| `messages/en.json` | 新增 `paletteStudio.*`（seoTitle / description / intro / howTo / keywords + UI 文案），`tools.paletteStudio.title`，`home.tools.paletteStudio` |
| `messages/zh-Hant.json` | 同上繁中版本，key 完全对齐 |
| `src/app/sitemap.ts` | routes 加入 `/tools/palette-studio`，`lastModified` 更新为发布日 |
| `src/proxy.ts` | `toolSlugs` 白名单加入 `palette-studio`，否则繁中路由被 404 拦截 |
| `src/components/sections/tools-page.tsx` | 增加一张工具卡（图标建议 `PaletteIcon`） |
| `src/components/sections/home-page.tsx` | 首页工具列表增加一项；描述不涉及「四种工具」硬编码 |
| `src/config/site.ts` | 站点描述加入 palettes 关键词（需与 OG 卡同步） |
| `src/app/opengraph-image.tsx` | 若站点 tagline 变动则同步 |
| `README.md` | 工具清单增加 Palette Studio |
| `scripts/seo-baseline.json` | 刷新（新增 2 个路由；其他页面描述若变动一并更新） |
| `e2e/home.spec.ts` / `e2e/share-to-x.spec.ts` | 若卡片数量或分享用例需覆盖新工具 |

> 需修改 `src/proxy.ts` 的 `toolSlugs` 白名单加入 `palette-studio`，否则 `/zh-Hant/tools/palette-studio`
> 会被 locale 守卫判为未知路径并返回 404（实施时已确认并修正）。
> 不修改存储相关代码：本站没有 localStorage 用户数据机制，本工具也不引入。

---

## 5. 文案与 SEO / Copy & SEO

### 5.1 Metadata（提案 / proposed）

| 语言 / Locale | title | description | keywords |
| --- | --- | --- | --- |
| en | `Color Palette Generator — Free Online Palette Maker` | `Generate a harmonious color palette from one seed color. Check WCAG contrast, simulate color blindness, and copy CSS variables or Tailwind tokens — no signup.` | `color palette generator`, `online palette maker`, `tailwind color generator`, `accessible color palette`, `oklch palette` |
| zh-Hant | `配色方案生成器 — 在線調色盤與色卡匯出` | `輸入一個種子色即可產生和諧配色，即時檢查 WCAG 對比度與色盲模擬，並複製 CSS 變數或 Tailwind token。免註冊、全部在瀏覽器完成。` | `配色方案生成器`, `在線調色盤`, `色卡產生器`, `無障礙配色`, `tailwind 配色` |

- 描述长度符合审计闸门区间（英文 40–170、繁中 12–120 字符）。
- `ToolPageIntro` 自动输出 `SoftwareApplication` JSON-LD，无需手写。

### 5.2 关键文案 / Key copy

| Key | en | zh-Hant |
| --- | --- | --- |
| `intro` | A browser-based color palette generator that turns one seed color into a harmonious, accessible palette you can copy or share. | 在瀏覽器執行的配色方案生成器，把一個種子色變成和諧、可讀、可複製與分享的配色。 |
| `howTo` | Enter a seed color, choose a harmony rule, then copy any hex or export CSS and Tailwind tokens. The URL keeps your exact settings. | 輸入種子色、選擇配色規則，再複製任一色值或匯出 CSS 與 Tailwind token。網址會保留完整設定。 |

### 5.3 审计对接 / Audit integration

- sitemap 从 14 条 URL 增至 **16 条**（2 语言 × 新增路由）；`seo:audit` 必须为 **0 warning / 0 error**。
- 首页与新工具页互链，满足「每个 URL 至少一条入链」的静态检查。
- 新页面正文需通过句子重叠 <15% 与最少词数检查（intro + howTo + UI 文案已足够）。

---

## 6. 验收标准 / Acceptance criteria

1. `npx tsc --noEmit`、`npm run lint`、`npm test` 全绿（新增纯函数单测覆盖六种规则、gamut、对比度、色盲矩阵、导出文本）。
2. `npm run build` 成功；两个新路由均产出静态 HTML。
3. `npm run seo:audit:baseline -- --skip-build` 刷新后 `npm run seo:audit -- --skip-build` 为 0 warning / 0 error。
4. `npm run test:e2e` 全绿；新增用例覆盖：种子色修改 → 色块变化、规则切换、复制 hex、导出 CSS、分享 URL 复现、`/zh-Hant` 页面全繁中。
5. 本地生产服务实测：`/tools/palette-studio` 与 `/zh-Hant/tools/palette-studio` 均 200、`<h1>` 唯一、canonical 正确；`/en/tools/palette-studio` 308 跳到无前缀路径。
6. 手动检查：色块在深空主题下对比清晰；键盘可聚焦并复制；移动端单列无溢出；数据流无网络请求、无 localStorage 写入。
7. 提交时 pre-commit 闸门自动运行并通过；随后推送到 `origin/main`（当前代理下若 git 传输受阻，走 GitHub API 发布，参照既有做法）。

---

## 7. 风险与取舍 / Risks & trade-offs

| 风险 / Risk | 应对 / Mitigation |
| --- | --- |
| 自研 OKLCH 转换出错导致颜色超出 sRGB | gamut 映射 + 极端色值单测；所有输出回读 hex 校验 |
| 六种规则在 `count=3..6` 下取样不均 | 规则骨架上均匀插值，单测断言色相间距与明度层次 |
| 色盲矩阵让颜色「失真」被误认为 bug | UI 明确标注为「模拟」且可一键关闭，默认关闭 |
| 复制权限在部分浏览器失败 | 使用 `navigator.clipboard`，失败时回退到选中文本提示 |
| SEO 基线因文案微调而漂移 | 文案定稿后一次性刷新基线；之后改动走 baseline 命令 |
| 首页工具卡增多导致拥挤 | `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`，5 张卡在 md 下自然换行 |

---

## 8. 待决项 / Open questions（请审阅时勾选 / please confirm）

以下六项已有推荐默认值，如无异议将按推荐执行：

1. **色彩算法**：A. 零依赖自研 OKLCH（推荐） / B. 引入 `culori` 依赖。
2. **颜色数量**：A. 可配置 3–6 色（推荐） / B. 固定 5 色。
3. **默认配色规则**：A. 邻近色 analogous（推荐，视觉最稳） / B. 互补色 complementary（更抢眼）。
4. **导出范围**：A. CSS + Tailwind + JSON + PNG 全量（推荐） / B. 仅 CSS + PNG。
5. **色盲模拟**：A. 三类全做（推荐） / B. 本期不做，留到后续。
6. **站点描述**：A. 同步加入 palettes 关键词（推荐，保持 SEO 一致） / B. 不改站点级描述，只改工具页。

---

## 9. 实施顺序 / Implementation order

审阅通过后按此编号清单推进：

1. 新增 `types.ts` / `color.ts` / `harmony.ts` 与对应单测，先让配色算法可验证。
2. 新增 `contrast.ts` / `color-blind.ts` / `export.ts` 与单测。
3. 实现 `swatch.tsx` 与 `palette-studio-tool.tsx`，接通 URL 状态、复制、分享、导出。
4. 新增 section 与两个路由页、metadata、OG 卡。
5. 补齐中英文案、首页/工具页卡片、sitemap、README、SEO 基线。
6. 新增 e2e 用例并跑全量验收（tsc / lint / unit / build / SEO audit / e2e）。
7. 提交（pre-commit 闸门）+ 推送到 GitHub；如需上线再走部署流程。

---

> 审阅意见请直接标注在第 8 节的编号上；确认后我即按第 9 节开始实现。
> Please annotate item numbers in §8 with your decisions; implementation starts on §9 once confirmed.
