# 星舵工坊 · 品牌重塑方案 / StarRudder Rebrand Plan

> 状态：待审阅 / Status: Awaiting review
> 域名 / Domain: `starrudder.cc`
> 日期 / Date: 2026-11-25

---

## 0. 决策摘要 / Decisions at a glance

| 项目 / Item | 决定 / Decision |
| --- | --- |
| 品牌名 / Brand name | 中文「星舵工坊」，英文 `StarRudder`，域名 `starrudder.cc` |
| 视觉调性 / Tone | 深空航海 · 星金 / Deep-space navigation with star-gold accents |
| 改造范围 / Scope | 全量：可见品牌 + 技术标识 + 数据迁移 / Full: visible brand + technical IDs + data migration |
| 品牌图形 / Mark | 定制「舵轮 + 北极星」SVG，替换 Sparkles、favicon、OG / Custom rudder + Polaris SVG replacing Sparkles, favicon, OG |

**核心命题 / Core idea**：从「怪奇玩具箱」转为「以星为舵，探索小工具宇宙」。工具本身不变，改的是它们被讲述的方式——每一个工具都是一次可分享的微型航行。

---

## 1. 品牌释义 / Brand meaning

**中文**：星为引路之标，舵为掌向之器。「星舵工坊」是一间以星导航的小工坊——不承诺宏大旅程，只提供几件趁手的小工具，帮你把一次命名、一张头像、一段足迹变成可以分享的成果。

**English**: A star to steer by, a rudder to hold the course. StarRudder is a small workshop for browser-sized voyages — no grand promises, just a handful of tools that turn a name, an avatar, or a route into something worth sharing.

**语气规则 / Voice rules**
- 用「航行 / 坐标 / 罗盘 / 掌舵 / 落脚点」，不用「玩具箱 / 怪奇 / 实验场」。
- Use *voyage, coordinates, compass, steer, waypoint*; avoid *toybox, quirky, playground*.
- 保留轻松感，但基调更沉稳、有方向感。Keep it light but purposeful, never whimsical for its own sake.

---

## 2. 视觉系统 / Visual system

### 2.1 配色 / Palette
把 `:root` 从近白紫蓝改为深空靛蓝，星金作为主色。`oklch` 值示意（实施时按实际对比度微调）：

| Token | 现状 / Current | 目标 / Target | 用途 / Use |
| --- | --- | --- | --- |
| `--background` | 近白 / near-white | 深空靛蓝 / deep indigo | 整站底 / Page base |
| `--foreground` | 深灰 / dark gray | 星白 / star white | 正文 / Body text |
| `--primary` | 紫蓝 / violet-blue | 星金 / star gold | 按钮、链接 / Buttons, links |
| `--accent` | 琥珀 / amber | 航海蓝辉光 / navigation blue glow | 悬停、强调 / Hover, highlights |
| `--border` | 浅灰 / light gray | 低对比星尘 / low-contrast stardust | 分割线 / Dividers |

`.dark` 需重新定义：既然浅色变为深空色，`.dark` 应作为「更深一档」的夜间航海模式，而非反向。地图组件依赖 `documentElement` 判断底图主题，必须同步验证底图仍为暗色。

> 风险 / Risk: 整站深色会影响可读性。验收必须在首页、工具页、About、移动端四套截图上逐一检查对比度。

### 2.2 字体 / Typography
保留 Geist / Geist Mono。`--font-heading` 维持与 sans 同源，不额外引入字体以避免加载负担。

### 2.3 品牌图形 / Brand mark
新建 `src/components/shared/brand-mark.tsx`：SVG 舵轮 + 北极星组合。要求：
- 单色 `currentColor`，适配星金主色与深色底；
- 提供 `size` 参数，页头 9、页脚 7、favicon 独立导出；
- 保留 `aria-hidden`，语义由旁边文字承担。

替换点：页头 `SparklesIcon`、页脚 `SparklesIcon`、首页 badge `SparklesIcon`、favicon（生成 ICO + 可选 SVG）。

### 2.4 OG 图 / Open Graph
5 张 OG（首页 + 4 工具）统一改为深空渐变 + 星金文字 + 品牌图形，底部徽标由 `QuirkBox` 改为 `StarRudder / 星舵工坊`。工具页保留各自的示意元素。

---

## 3. 编号变更清单 / Numbered change list

### A. 品牌定义与配置 / Brand definition
1. 新建 `docs/brand.md`（中英双语品牌规范：名称、释义、语气、配色、Logo 用法）。本方案文档保留为决策记录。
2. 改 `src/config/site.ts`：`name: "StarRudder"`，中文名常量 `nameZh: "星舵工坊"`，`title` / `description` 双语化并指向 `starrudder.cc`。`NEXT_PUBLIC_SITE_URL` 默认改为 `https://starrudder.cc`。
3. 改 `src/app/layout.tsx`：metadata 用新品牌，`applicationName: "StarRudder"`。
4. 改 `src/lib/seo.ts`：标题后缀、siteName 跟随 `siteConfig.name`（自动生效，需核对）。
5. 改 `src/app/about/page.tsx` keywords：`["starrudder", "star rudder", "tool collection", "星舵工坊"]`。

### B. 文案 / Copy (i18n)
6. `messages/en.json` 与 `messages/zh-Hant.json`：
   - `site.title` / `site.description` → 深空航海叙事；
   - `home.badge` / `home.title` / `home.description` → 新版 Hero；
   - `home.preview.label` → 「航行预览 / A look at the workshop」；
   - `home.features.eyebrow`、`items` → 三条价值改为「无需罗盘 / 即刻起航」「坐标可分享」「自由无界」；
   - `home.faq`、`home.cta`、`about.*` → 同步新语气；
   - `tools.description` → 工具集合描述改为「微型航行工具」。
   - 结构必须与 en 严格对齐（现有校验脚本已覆盖）。

### C. 组件与页面 / Components
7. 新建 `brand-mark.tsx`，替换 `site-header.tsx`、`site-footer.tsx`、`home-page.tsx` 的 SparklesIcon。
8. `src/app/globals.css`：按 2.1 改 `:root` 与 `.dark` 的色板，核对 `--chart-*`、`--sidebar-*`、`--sidebar-primary-*` 一并更新。
9. 5 个 `opengraph-image.tsx`：深空渐变 + 星金 + 新徽标。
10. `src/app/favicon.ico`：用新图形生成，保留 ICO 多尺寸。
11. `README.md`：标题、介绍、部署说明中的品牌名与域名更新；保留技术栈与脚本说明。

### D. 技术标识与数据迁移 / Technical IDs & migration
12. `package.json` / `package-lock.json`：`name` 改为 `star-rudder`（npm 包名用连字符）。
13. 存储键迁移（`storage.ts`）：
    - 新键 `starrudder:travel-footprint:v1`；
    - `readTravelFootprintState()` 先读新键，缺失时读旧键 `quirkbox:travel-footprint:v1` 并**写入新键**；
    - **保留旧键不删除**，作为回滚备份；
    - 新增单测：旧键有数据、新键无数据 → 读旧并迁移；两键都有 → 优先新键；均损坏 → 默认空状态。
14. 导出格式迁移（`data-transfer.ts`）：
    - `TravelFootprintFile.app` 类型改为 `"quirkbox" | "starrudder"`，新导出写 `"starrudder"`；
    - `parseTravelFootprintFile()` 同时接受两个 app 值（旧文件可导入）；
    - 新增单测覆盖旧文件导入。
15. 导出文件名（`export.ts`、`data-transfer.ts`、`pixel-avatar-tool.tsx`、`emoji-wallpaper/lib/render.ts`）：
    - `quirkbox-*` → `starrudder-*`（PNG / JSON）；
    - 相应更新 e2e 文件名断言。
16. `src/lib/seeds.test.ts`、`generate-avatar.test.ts` 里的 `quirkbox` 字符串改为 `starrudder`（测试夹具，无用户影响）。
17. e2e：`travel-footprint.spec.ts` 注入 key 改为新键，并新增一条「旧键数据可迁移」测试。

### E. 验收 / Verification
18. 静态：双语 key 结构校验、`tsc --noEmit`、`eslint .`、`vitest`、`next build`。
19. e2e：全量 20+ 条，含数据迁移与旧文件导入。
20. 视觉：首页 / 工具页 / About / 移动端四套截图；重点检查深色下文字对比、地图底图、按钮可辨识度。
21. 启动生产服务并确认 bundle 中无残留 `QuirkBox` / `quirkbox:*` 键（历史文档除外）。

---

## 4. 明确不动的部分 / Out of scope

- `.trae/specs/**`、`.workbuddy/memory/**`、`.screenshots/**`：历史记录与临时产物，保持原样。
- 四个工具的功能逻辑、API 路由、测试主体：仅改品牌标识与文案，不改行为。
- `.github/workflows/ci.yml`、`deploy/nginx.conf`：无品牌字符串，无需改。
- 域名 DNS / 部署平台配置：本方案只改代码，域名解析由你自行配置。

---

## 5. 风险与回滚 / Risks & rollback

| 风险 / Risk | 缓解 / Mitigation |
| --- | --- |
| 深色主题下工具可读性下降 | 四套截图逐页验收；必要时工具卡片单独用更亮 surface |
| 老用户数据丢失 | 旧键保留 + 新键迁移 + 双键单测，迁移逻辑只写不删 |
| 旧导出文件无法导入 | `app` 字段双值兼容，新旧单测都跑 |
| 地图底图与深色主题不匹配 | 浏览器实测验证 MapLibre 暗色底图仍生效 |
| 中英文案结构漂移 | 现有 key 对齐脚本 + 全量单测 |

回滚：品牌层改动可通过 git revert 整体回退；数据层因旧键保留，回退代码后旧数据仍可读。

---

## 6. 交付物 / Deliverables

- 品牌规范文档 `docs/brand.md`（中英双语）
- 定制 SVG 品牌图形组件与 favicon
- 5 张深空风格 OG 图
- 全站文案与配色更新
- 数据迁移逻辑与测试
- 验收截图与测试报告

---

**请审阅以上方案。确认后我按 A → E 顺序实施；若有想调整的地方（尤其是配色深浅与迁移策略），告诉我具体条目编号。**
