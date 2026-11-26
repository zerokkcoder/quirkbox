# 星舵工坊 · 渐变背景壁纸生成器规划 / StarRudder Gradient Wallpaper Generator Plan

> 状态：已确认，待本地实测 / Status: Confirmed, awaiting local verification
> 来源 / Source: `docs/tool-ideas.md` 候选 #3 渐变背景生成器 / Candidate #3
> 日期 / Date: 2026-11-26
> §8 八项待决全部按提议执行（功能名命名、三种渐变、2–5 色标、三种和谐规则、6 尺寸、文字叠加开关、不做噪点、首页文案同步）。

---

## 0. 决策摘要 / Decisions at a glance

| 项目 / Item | 提议 / Proposal |
| --- | --- |
| 工具名 / Name | 中文「渐变背景壁纸生成器」，英文 `Gradient Wallpaper Generator`（功能名，不用 Studio）；繁中词条「漸層壁紙產生器」 |
| 路由 / Route | `/tools/gradient-wallpaper-generator`（无前缀英文）/ `/zh-Hant/tools/gradient-wallpaper-generator`（繁中） |
| 核心 / Core | 可视化调色标 + 角度/中心 → 实时渐变预览 → 复制 CSS 或导出高清壁纸 PNG；随机种子一键出图 |
| 状态存放 / State | 色标、类型、角度、尺寸写入 URL；不写 localStorage、不发网络请求 / URL-only, no storage, no network |
| 依赖 / Dependencies | **零新增运行时依赖**：CSS 字符串与 canvas 渐变均用浏览器原生 API，自研渲染与种子算法 |
| 分类 / Category | 归入工具页「设计 Design」领域（成为该领域第 5 个工具） |
| 改造范围 / Scope | 新增一个 feature + section + 双路由 + OG，接入首页/工具页卡片、sitemap、SEO 基线、代理白名单、e2e |

**核心命题 / Core idea**：把渐变壁纸做成一件可复现的航海仪器——拖动色标、调角度，所见即所得；一键随机给出和谐配色，链接本身携带完整配方；图片与配色只在本机生成，不上传、不保存。

> 命名约定：英文一律用功能名（不用 Studio），繁中一律用「產生器」（不用「生成器」）。本工具名已按 2026-11-26 的命名统一规则拟定。

---

## 1. 产品定义 / Product definition

### 1.1 是什么 / What it is

**中文**：渐变背景壁纸生成器是一个完全在浏览器里运行的视觉工具。拖动色标、切换线性/径向/锥形渐变、调整角度与壁纸尺寸，实时预览结果；可复制 CSS 代码，或导出手机/桌面高清 PNG 壁纸。所有计算在本机完成，不注册、不上传、不保存任何数据。

**English**: Gradient Wallpaper Generator is a browser-only visual tool. Drag color stops, switch between linear/radial/conic gradients, adjust the angle and wallpaper size, and preview the result live. Copy the CSS or export a high-resolution PNG wallpaper for phone or desktop. Everything runs on your device — no signup, no uploads, no stored data.

### 1.2 怎么用 / How to use

**中文**：点「随机」得到一个和谐配色 → 拖动色标或改角度微调 → 选壁纸尺寸 → 下载 PNG 或复制 CSS。同一组参数永远得到同一张图，分享链接打开即完全复现。

**English**: Hit Shuffle for a harmonious palette → fine-tune stops and angle → pick a wallpaper size → download PNG or copy CSS. The same parameters always reproduce the same image, and a shared link restores the exact setup.

### 1.3 用户故事 / User stories

1. 作为手机用户，我想要一张高分辨率渐变壁纸，且不用把任何图片上传到网站。
2. 作为前端开发者，我想调出渐变后直接复制 CSS `linear-gradient(...)` 代码。
3. 作为设计师，我想要一个和谐配色的起点，再手动微调色标位置。
4. 作为注重隐私的用户，我要求配色与图片都不离开设备。
5. 作为内容创作者，我想把「配方链接」发给同事，对方打开即看到同一张渐变。

### 1.4 非目标 / Non-goals

- 不做账号、历史记录、收藏、云端模板（与「不保存用户数据」冲突）。
- 不做图片取色/从图片提取渐变（独立工具范畴；颜色输入只接受手动拾取与随机生成）。
- 不做动画渐变、多图层叠加、噪点/纹理（保持工具轻量；可在 §8 决定是否加噪点）。
- 不做 SVG 导出（CSS 可表达完整渐变，SVG 锥形渐变不通用；导出聚焦 PNG + CSS）。

---

## 2. 功能范围 / Feature scope

### 2.1 渐变类型 / Gradient types

| 类型 / Type | 参数 / Parameters | 默认 / Default |
| --- | --- | --- |
| 线性 `linear` | 角度 0–360° | 135° |
| 径向 `radial` | 形状（圆 / 椭圆）、中心位置（预设 9 宫格） | 圆、正中 |
| 锥形 `conic` | 起始角度 0–360°、中心位置（预设 9 宫格） | 0°、正中 |

- 用 ToggleGroup 切换三种类型；切换时保留已有色标，只替换角度/位置控件。
- 锥形依赖 `canvas.createConicGradient`，需特性检测；不支持时禁用该选项并给出说明（Chrome 99+ / Safari 16+ / Firefox 117+）。

### 2.2 色标编辑 / Color stops

- 2–5 个色标，每个含 `hex` 颜色 + `position`（0–100%）。
- 横向色带轨道：点击轨道新增色标（上限 5），拖动色标改位置；选中色标后用 `input[type=color]` + hex 文本框改颜色，可删除（下限 2）。
- 色标在轨道上的位置与预览同步；首尾色标默认 0% / 100%，可自由拖动。
- 非法 hex / 越界 position 一律回退默认值，不抛错。

### 2.3 随机种子 / Shuffle

- 复用 `@/lib/seeds` 的 `hashSeed`：同一个种子字符串永远得到同一组色标（纯函数、可单测）。
- 算法：从种子派生基准色相，按「邻近色 / 分裂互补 / 三角色」三种和谐规则之一生成 3–5 个色标，色相错位、明度做阶梯，避免灰扑扑。
- 点「随机」生成新种子并更新色标；「复制分享链接」保留当前色标（所见即所得），种子仅作为生成入口写入 URL 供复现。
- 种子参数遵循站点现有 seed 分享惯例（emoji 壁纸 / 随机名字）。

### 2.4 尺寸与输出 / Sizes & outputs

- **尺寸预设**：复用 `src/features/emoji-wallpaper/lib/ratios.ts` 的模式，按壁纸场景扩展：
  - 手机：`9:16` 2160×3840、`9:19.5` 2160×4680、`9:20` 2160×4800
  - 桌面：`16:9` 3840×2160、`16:10` 2560×1600、`4:3` 2048×1536
  - 预设不足时可在 §8 决定是否加自定义宽高。
- **预览**：小尺寸 canvas 按容器缩放，保持比例，避免大图预览卡顿。
- **导出 PNG**：导出时用离屏 canvas 按目标分辨率重绘，`toBlob` 下载；文件名 `starrudder-gradient-<ratio>-<seed>.png`。
- **复制 CSS**：输出标准 CSS 渐变值（如 `linear-gradient(135deg, #3e5c9e 0%, #a8c0e0 55%, #f4f7fb 100%)`），一键复制；复制失败回退到选中文本提示。
- **分享链接**：`type` / `angle` / `stops` / `ratio` / `seed` 写入 URL query；刷新与分享完整复现。

### 2.5 无障碍 / Accessibility

- 色标轨道支持键盘操作：Tab 聚焦、方向键移动位置、Delete 删除；焦点环与站点一致。
- 颜色选择器同时提供 hex 文本输入，便于精确输入与屏幕阅读器识别。
- 渐变是装饰性图像，不做 WCAG 对比度强制校验，但提供「文字可读性提示」开关（在预览上叠加示例文字，帮助用户判断能否放桌面图标文字）——见 §8 待决项。

---

## 3. UX 与布局 / UX and layout

沿用 Image Studio / QR 已验证的「操作区与预览区并排、各占一半、控件自解释」布局，减少说明文字：

```
┌──────────────────────────┬──────────────────────────┐
│ 左：操作区                │ 右：实时预览              │
│  类型 ToggleGroup         │                          │
│  色标轨道（可拖/增删改）  │    渐变壁纸预览           │
│  角度 / 中心位置          │    （按比例缩放）         │
│  尺寸预设                 │                          │
│  随机 / 重置              │                          │
├──────────────────────────┴──────────────────────────┤
│  下载 PNG | 复制 CSS | 分享链接                     │
└───────────────────────────────────────────────────────┘
```

1. **上部并排**：左操作、右预览，各半宽；默认打开即有渐变，不留空白页。
2. **即时反馈**：任何色标/角度/尺寸变化立即反映在预览上。
3. **高度一致**：操作卡片与预览卡片等高（沿用 Image Studio 修复经验）。
4. **移动端**：上下堆叠，预览固定在上方，避免编辑时看不到结果。
5. **滚动条**：复用 `.scrollbar-slim`（色标多时操作区可滚动）。

---

## 4. 技术方案 / Technical approach

### 4.1 依赖选型 / Dependency choice

| 方案 / Option | 优点 / Pros | 缺点 / Cons |
| --- | --- | --- |
| **零依赖自研（推荐）** | `canvas.createLinearGradient/createRadialGradient/createConicGradient` + 模板字符串生成 CSS；包体积零增长，与 Palette Studio 一致 | 锥形需特性检测；径向中心位置需自己换算坐标 |
| `css-gradient-parser` 等库 | 可解析任意 CSS 渐变字符串 | 本工具只需「生成」不需「解析」，引入纯属负担；依赖体积与维护成本增加 |

**结论 / Decision**：零新增依赖。所有视觉与导出由自研代码负责，保持站点「轻量、可离线」调性。

### 4.2 数据流 / Data flow

```
seed → hashSeed → 色标数组（纯函数）
URL params → settings（归一化）
        ↓
  stops + type + angle + size
        ↓
  CSS 字符串（复制） / canvas 渐变（预览 + 导出 PNG）
        ↓
  toBlob → PNG 下载  |  params → 分享链接
```

### 4.3 文件结构 / File structure

```
src/features/gradient-wallpaper-generator/
  lib/
    types.ts       # state、渐变类型、尺寸常量
    settings.ts    # URL <-> state 解析与序列化、默认值、归一化
    palette.ts     # seed -> 色标数组（三种和谐规则，纯函数）
    gradient.ts    # 色标 -> CSS 字符串、canvas 渐变坐标换算
    sizes.ts       # 壁纸尺寸预设与归一化
    export.ts      # 离屏 canvas 渲染、toBlob 下载、文件名
    *.test.ts      # 上述纯函数单测
  components/
    gradient-wallpaper-generator-tool.tsx
    color-stop-track.tsx   # 色标轨道（增删拖拽、键盘操作）
    gradient-preview.tsx   # canvas 预览 + 可选文字叠加
src/components/sections/gradient-wallpaper-generator-page.tsx
src/app/tools/gradient-wallpaper-generator/{page,opengraph-image}.tsx
src/app/[locale]/tools/gradient-wallpaper-generator/page.tsx
e2e/gradient-wallpaper-generator.spec.ts
```

### 4.4 URL state

- 参数：`type`（`linear|radial|conic`）、`angle`（0–360）、`stops`（`rrggbb@pos` 以 `,` 分隔，最多 5 项）、`ratio`（预设 id）、`seed`（随机种子）。
- 所有参数都是短字符串，无需 base64；非法值回退默认。
- 沿用 `replaceSearchState`（只在事件处理器/effect 中调用，不放 `setState` updater——Palette Studio 已踩坑）。
- 色标数量变化会改变 query 长度，但 5 组约 70 字符，远低于 URL 限制。

---

## 5. SEO 与文案 / SEO and copy

| 语种 / Locale | 标题 / Title | 描述 / Description |
| --- | --- | --- |
| en | `Gradient Wallpaper Generator — Free CSS Gradient Maker` | Design a gradient wallpaper in your browser. Drag color stops, switch linear/radial/conic, copy CSS or export high-res PNG. No upload, no account. |
| zh-Hant | `漸層壁紙產生器 — 在線 CSS 漸層背景製作` | 在瀏覽器拖動色標製作漸層壁紙，支援線性／徑向／錐形，複製 CSS 或匯出高清 PNG。不上傳、不註冊。 |

- 关键词：`gradient wallpaper generator`、`css gradient generator`、`gradient background maker`、`漸層壁紙產生器`。
- FAQ `<details>`（`<summary>` 含问号）配 `FAQPage` JSON-LD，通过 SEO 闸门。
- 结构化数据：`ToolPageIntro` 自动输出 `SoftwareApplication`。
- OG 卡：复用 `OGCard`，标题 `Gradient Wallpaper Generator`，强调「no upload / export PNG + CSS」。
- 更新 `sitemap.ts`（20→22 路由）、`proxy.ts` 白名单、`scripts/seo-baseline.json`、首页工具清单与工具页「设计」分类、README。

---

## 6. 测试计划 / Test plan

- **单元测试**：种子→色标确定性、三种和谐规则、URL 参数往返（含非法值回退）、CSS 字符串输出、尺寸归一化、canvas 坐标换算（纯函数部分）。
- **e2e**：默认即有预览、拖色标/改角度后 CSS 变化、三种类型切换、随机可复现、PNG 下载、CSS 复制、分享链接复现、繁中路由、外链阻断下仍可用。
- **SEO 闸门**：20→22 路由审计，baseline 新增 2 条；FAQ 问号摘要与可见字数通过。
- **人工**：手机壁纸尺寸导出后用系统相册打开确认清晰；桌面 16:9 确认无拉伸。

---

## 7. 风险与缓解 / Risks and mitigations

| 风险 / Risk | 缓解 / Mitigation |
| --- | --- |
| 锥形渐变 `createConicGradient` 兼容性 | 运行时特性检测，不支持时禁用并提示；CSS 仍可复制 |
| 4K/5K 大图导出内存占用 | 预览用小 canvas，导出才用离屏全尺寸 canvas；导出后释放引用 |
| 色标拖拽与键盘操作冲突 | 轨道用受控组件 + 指针事件；键盘单独处理方向键与 Delete |
| 随机配色「脏色」 | 在 HSL/OKLCH 空间做明度阶梯与色度约束，单测固定种子快照 |
| 繁中描述混入英文与空格导致 SEO 计数漂移 | 文案定稿后一次性刷新 baseline；之后改动走 baseline 命令 |
| 色标参数写入 URL 后链接略长 | 5 组约 70 字符，可接受；不写图片 data URL |

---

## 8. 待决项 / Open questions（请审阅时按编号回复）

> 已確認：八項全部按提議執行，實作已完成，等待使用者本地實測後再跑單測／e2e／SEO 審計並提交。

以下项目已有推荐默认值，如无异议将按推荐执行：

1. **工具名**：A. `Gradient Wallpaper Generator` /「漸層壁紙產生器」（推荐，贴合「壁纸」定位） / B. `Gradient Background Generator` /「漸層背景產生器」（更贴近 CSS 背景）。
2. **渐变类型**：A. 线性 + 径向 + 锥形全做（推荐，锥形带特性检测） / B. 只做线性 + 径向（最稳，改动最小）。
3. **色标数量**：A. 2–5 个可增删拖动（推荐） / B. 固定 3 个（实现最简）。
4. **随机规则**：A. 三种和谐规则（邻近 / 分裂互补 / 三角色）按种子选择（推荐） / B. 单一邻近色规则。
5. **尺寸预设**：A. 手机 3 种 + 桌面 3 种（推荐） / B. 再增加自定义宽高输入。
6. **文字可读性提示**：A. 加一个「示例文字叠加」开关（推荐，帮助用户判断壁纸可读性） / B. 不做，保持界面简洁。
7. **噪点/纹理**：A. 不做（推荐，避免界面与实现膨胀） / B. 加一档细微颗粒滑块。
8. **首页预览区文案**：A. 同步微调「设计」卡描述，加入渐变壁纸（推荐，保持首页与工具页一致） / B. 不改首页文案，只加工具卡链接。

---

## 9. 实施顺序 / Implementation order

审阅通过后按此编号清单推进：

1. 新增 `types.ts` / `settings.ts` / `palette.ts` 与单测，先让种子→色标与 URL 往返可验证。
2. 新增 `gradient.ts` / `sizes.ts` / `export.ts` 与单测。
3. 实现 `color-stop-track.tsx` 与 `gradient-preview.tsx`，含键盘操作与特性检测。
4. 实现主工具组件，接通 URL 状态、随机、复制 CSS、下载 PNG、分享。
5. 新增 section 与两个路由页、metadata、OG 卡。
6. 补齐中英文案、首页/工具页卡片（设计分类）、sitemap、proxy 白名单、README、SEO 基线。
7. 新增 e2e 用例。
8. **先交给你本地实测**；确认后再按约定顺序跑单测 → lint → build → SEO 审计 → e2e → 提交推送。
