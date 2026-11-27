# funy-tool 技术栈规划

## Summary
- 目标：从零搭建一个“有意思的工具集合站点”，首批上线两个工具：`随机名字生成器` 与 `随机像素风格头像生成器`。
- 当前阶段：仓库仍为空目录，尚未存在前端脚手架、`docs` 目录或既有技术约束，适合直接按 MVP + 内容包装优先的思路设计架构。
- 推荐技术路线：`Next.js 16.x（最新版 Active LTS） + TypeScript + Tailwind CSS + shadcn/ui + MDX + Canvas`，在自有服务器上以 Node 方式部署；首版不引入数据库，工具结果以前端状态和 URL 参数为主。
- 核心原则：先把“好玩、可传播、SEO 友好”做出来，再预留后续接入账号、收藏、AI 增强和多语言的扩展位。

## Current State Analysis
- 项目根目录当前为空，未检测到源码、配置文件或已有框架。
- `docs` 目录当前不存在。
- 当前已确认的产品偏好：
  - 部署方式：`自有服务器`
  - 首版策略：`先重内容包装`
  - 随机名字生成方式：`规则 + 名字库`
- 这意味着首版技术栈需要同时满足：
  - 对 SEO、首屏性能和页面可运营性友好
  - 具备少量服务端能力，方便后续扩展接口
  - 工具核心逻辑尽量本地化、低成本、可控

## Proposed Changes

### 1. 工程基础

#### 文件
- `/package.json`
- `/next.config.ts`
- `/tsconfig.json`
- `/tailwind.config.ts`
- `/postcss.config.js`
- `/components.json`
- `/.env.example`
- `/README.md`

#### 方案
- 使用 `Next.js 16.x`（最新版 App Router）作为全站框架。
- 使用 `TypeScript` 统一页面、组件、工具算法和接口类型。
- 使用 `Tailwind CSS` 做快速样式搭建。
- 使用 `shadcn/ui` 作为基础 UI 组件层，减少表单、弹层、Tabs、Toast、卡片等重复造轮子。

#### 原因
- Next.js 对内容站、工具页、SEO、SSR/SSG、API 路由都比较均衡，适合“工具站 + 落地页 + 后续内容页”这种混合形态。
- 自有服务器部署时，Next.js 既能当 Web 站，也能提供轻量接口，不需要首版再拆前后端。
- shadcn/ui 与 Tailwind 组合在设计表达上自由度高，比较适合“有趣”风格站点。

### 1.1 版本策略

#### 方案
- 框架版本固定为 `Next.js 最新稳定大版本`，当前按 `16.x` 规划。
- 锁定 Node 运行时版本到 LTS，并在 CI 中校验版本一致性。

#### 原因
- 你已经明确要求使用最新版 Next.js，因此首版直接以当前稳定主版本为基线，避免初始化后马上再做升级迁移。
- 对内容站和工具站来说，升级框架往往会牵动构建、缓存和 metadata 行为，首版就把版本口径定清楚更稳。

### 2. 站点结构与内容层

#### 文件
- `/src/app/layout.tsx`
- `/src/app/page.tsx`
- `/src/app/tools/page.tsx`
- `/src/app/tools/random-name/page.tsx`
- `/src/app/tools/pixel-avatar/page.tsx`
- `/src/app/about/page.tsx`
- `/src/content/landing/*.mdx`
- `/src/components/sections/*`
- `/src/components/shared/*`
- `/src/i18n/routing.ts`
- `/src/i18n/navigation.ts`
- `/messages/en.json`
- `/messages/zh-Hant.json`

#### 方案
- 首页采用“品牌落地页 + 工具入口卡片 + FAQ + 分享引导”的结构。
- 工具页单独做可索引路由，便于搜索引擎收录。
- 内容文案使用 `MDX` 管理，承载首页模块文案、FAQ、玩法说明和后续博客/专题页。
- 国际化从首版开始接入，默认语言为 `English`，首批支持 `English` 与 `Traditional Chinese`。
- 建议使用 `next-intl` 管理多语言路由和文案资源。

#### 原因
- 你明确希望首版先重内容包装，MDX 能让页面运营内容和 React 组件共存，后续加专题页成本低。
- 每个工具独立 URL 更利于 SEO、社交分享和后续投放。
- 语言策略已经明确为英语默认 + 繁体中文，因此首版就应该把 i18n 基础打好，避免后续大改路由和文案组织。

### 3. 随机名字生成器

#### 文件
- `/src/features/random-name/components/*`
- `/src/features/random-name/lib/generator.ts`
- `/src/features/random-name/lib/rules.ts`
- `/src/features/random-name/lib/types.ts`
- `/src/features/random-name/data/names/*.json`
- `/src/app/api/random-name/route.ts`

#### 方案
- 首版采用 `规则 + 名字库`：
  - 维护多国家/语言的常见名字库（如英文名、日文名、韩文名、法文名等）。
  - 输入维度建议包含：原国籍/目标风格、性别倾向、正式/可爱/酷感、是否要带含义。
  - 生成逻辑通过筛选 + 权重随机 + 少量规则修饰完成。
- 服务端提供一个轻量接口 `/api/random-name`，前端也保留纯函数逻辑，便于未来切换为 Edge/Server 或加 AI 增强层。

#### 原因
- 首版不接 AI 时，规则系统最可控，结果稳定，也没有调用成本。
- 放在 feature 目录中，后续如果要扩展“解释名字含义”“生成对应姓氏”“AI 起名建议”时，不会和页面代码耦合。

### 4. 随机像素风格头像生成器

#### 文件
- `/src/features/pixel-avatar/components/*`
- `/src/features/pixel-avatar/lib/generate-avatar.ts`
- `/src/features/pixel-avatar/lib/palettes.ts`
- `/src/features/pixel-avatar/lib/seeds.ts`
- `/src/features/pixel-avatar/lib/export.ts`
- `/src/app/api/og/pixel-avatar/route.ts`（可选，二期）

#### 方案
- 首版使用 `Canvas API` 在前端生成像素头像。
- 生成逻辑采用 `seeded random`，保证相同 seed 能复现同一头像。
- 可配置项建议包含：配色主题、脸型模板、眼睛/嘴巴/发型/饰品、背景样式、像素尺寸。
- 支持导出 PNG；二期再补服务端 OG 图或分享图生成。

#### 原因
- 像素头像生成更适合直接在浏览器端完成，交互即时、无需占用服务器算力。
- seed 机制既能增强“随机有趣感”，也利于分享和复刻。

### 5. 状态管理与数据流

#### 文件
- `/src/lib/url-state.ts`
- `/src/lib/seo.ts`
- `/src/lib/analytics.ts`
- `/src/store/*`（仅在需要时）

#### 方案
- 首版尽量使用 `React 本地状态 + URLSearchParams`，把可分享的筛选条件和 seed 写进 URL。
- 不引入数据库，不做登录，不做用户历史记录。
- 如果局部交互复杂，再引入轻量状态库 `Zustand`，仅用于工具页局部状态。

#### 原因
- 当前两个工具都可以无账号运行，首版不需要把复杂度拉高。
- URL 可分享状态非常适合工具站传播。

### 6. 设计系统与体验

#### 文件
- `/src/styles/globals.css`
- `/src/config/site.ts`
- `/src/config/theme.ts`

#### 方案
- 视觉风格建议：简洁基础框架 + 一点复古像素或 playful 元素。
- 首页与工具页使用统一设计 token，避免“内容站”和“工具页”割裂。
- 使用 `next/font` 管理主字体；像素风标题可选局部展示，不建议全站通用。

#### 原因
- 工具站最怕“有趣但不好用”或“好用但不记得住”。设计应保证识别度，但不能牺牲交互清晰度。

### 7. SEO、分享与运营能力

#### 文件
- `/src/app/sitemap.ts`
- `/src/app/robots.ts`
- `/src/app/opengraph-image.tsx`
- `/src/app/tools/random-name/opengraph-image.tsx`
- `/src/app/tools/pixel-avatar/opengraph-image.tsx`

#### 方案
- 使用 Next.js Metadata API 管理标题、描述、OG 信息。
- 自动生成 sitemap、robots。
- 每个工具页配置独立文案和分享图。
- FAQ、使用场景、热门推荐词放在工具页正文中，支撑长尾搜索。

#### 原因
- 你当前优先级是“内容包装”，因此首版就应该把自然流量和分享链路打通。

### 8. 测试与质量保障

#### 文件
- `/vitest.config.ts`
- `/playwright.config.ts`
- `/src/**/*.test.ts`
- `/e2e/*.spec.ts`

#### 方案
- 单元测试：`Vitest`
- 组件测试：`React Testing Library`
- 端到端测试：`Playwright`
- 代码规范：`ESLint + Prettier`

#### 首版最低覆盖
- 随机名字规则筛选和结果结构正确
- 相同 seed 的像素头像可复现
- 工具页核心流程可用：输入/点击生成/刷新结果/导出图片
- 关键 SEO 元数据存在

#### 原因
- 两个工具的核心价值都很依赖“生成稳定性”和“分享体验”，测试应围绕这两点。

### 9. 部署与运维

#### 文件
- `/.github/workflows/ci.yml`
- `/deploy/nginx.conf`

#### 方案
- 部署形态：`Node.js + Nginx`
- CI：GitHub Actions 负责 lint、test、build
- 运行方式：源码上传到自有服务器，`npm ci && npm run build` 后用进程管理器重启 `npm run start`
- 统计方案：优先选 `Umami` 或 `Plausible` 的自托管模式

#### 原因
- 你已经明确选择自有服务器，直接用 Node 进程托管最简单，也少一层构建缓存。
- 自托管统计和工具站定位匹配，也能避免过早绑定第三方平台。

### 10. 文档落地

#### 文件
- `/docs/tech-stack-plan.md`
- `/docs/product-scope.md`
- `/docs/content-outline.md`

#### 方案
- 执行阶段创建 `docs` 目录，并把本规划整理为面向项目的正式文档 `tech-stack-plan.md`。
- 同步补两份短文档：
  - `product-scope.md`：首版功能边界与后续迭代清单
  - `content-outline.md`：首页与工具页的内容结构大纲

#### 原因
- 当前规划文件按工作流要求先放在 `.trae/documents/`。
- 真正项目内长期维护的规划文档应该进入 `docs/`，方便后续开发和协作。

### 11. 英文站名与域名策略

#### 关键词方向
- 站点名优先做“有趣的工具集合品牌名”，不直接绑定当前两个工具。
- 基于 Google Trends 的过去 12 个月全球对比，`random generator` 的搜索基础明显强于 `fun tools`，`toolbox` 也比 `fun tools` 更稳定，说明主品牌更适合靠近 `random / toolbox / lab / box` 这类集合感词汇。
- 具体工具页继续承接更明确的需求词：
  - `random name generator`
  - `name generator`
  - `avatar maker` / `avatar generator`
  - `pixel avatar maker`

#### 命名策略
- 采用“`品牌词 + SEO 副标题`”的方式。
- 主品牌名服务于记忆点和扩展性；SEO 流量主要由页面标题、描述、URL slug 和 FAQ 文案承接。
- 域名选择优先顺序：
  - `.com`
  - `.tools`
  - `.fun`
  - `.app`

#### 推荐站名候选
1. `BloopBox`
   - 更俏皮、记忆点强，天然带一点“打开盒子看惊喜工具”的感觉。
   - 适合作为域名：`bloopbox.tools` / `bloopbox.fun`
   - 站点标题建议：`BloopBox - Random Name Generator, Pixel Avatar Maker & More Fun Tools`
2. `QuirkBox`
   - 有趣但不过分跳脱，集合站感强，适合长期扩展更多小工具。
   - 适合作为域名：`quirkbox.tools` / `quirkbox.fun`
   - 站点标题建议：`QuirkBox - Random Name Generator, Pixel Avatar Maker & More Fun Tools`
3. `WinkLab`
   - 更轻盈、偏品牌化，适合做调性更清爽的趣味工具站。
   - 适合作为域名：`winklab.tools` / `winklab.fun`
   - 站点标题建议：`WinkLab - Random Name Generator, Pixel Avatar Maker & Playful Online Tools`
4. `JollyKit`
   - 更温暖可爱，适合做轻松治愈系的小工具集合。
   - 适合作为域名：`jollykit.tools` / `jollykit.fun`
   - 站点标题建议：`JollyKit - Random Name Generator, Pixel Avatar Maker & More Playful Tools`
5. `PlayPatch`
   - 有“工具拼贴”“功能补丁包”的感觉，适合持续扩充品类。
   - 适合作为域名：`playpatch.tools` / `playpatch.fun`
   - 站点标题建议：`PlayPatch - Random Name Generator, Pixel Avatar Maker & Creative Fun Tools`

#### 推荐落地方式
- 品牌主名建议优先：`QuirkBox`
- 站点标题建议：
  - `QuirkBox - Random Name Generator, Pixel Avatar Maker & More Fun Tools`
- 页面层 SEO 建议：
  - `/tools/random-name` 页面主标题聚焦 `Random Name Generator`
  - `/tools/pixel-avatar` 页面主标题聚焦 `Pixel Avatar Maker`

#### 原因
- 你的目标已经是“有趣的工具集合站”，因此主品牌名要优先保留扩展性和识别度。
- SEO 不应由域名一项硬扛，集合站更适合品牌化域名 + 具体工具页关键词的组合策略。

## Assumptions & Decisions
- 决定使用单仓全栈方案，而不是前后端分离。
- 决定首版不接数据库、不做登录、不做收藏与历史记录。
- 决定随机名字功能以规则引擎为主，不依赖大模型。
- 决定随机像素头像以浏览器端 Canvas 生成，不依赖外部图像服务。
- 决定内容运营能力首版即纳入设计，包括 SEO、FAQ、分享图和独立工具页。
- 决定默认语言为 `English`，首批多语言只支持 `English` 与 `Traditional Chinese`。
- 决定首版即接入 i18n 路由与文案资源管理，避免后续重构。
- 决定站点命名采用“英文品牌名 + 页面关键词 SEO”的双层策略，优先使用集合站品牌名，而不是绑定现有两个工具的组合词。

## Verification Steps
1. 确认项目初始化后存在 Next.js、TypeScript、Tailwind、shadcn/ui 的基础工程文件。
2. 确认 `English` 默认站点与 `Traditional Chinese` 语言路由都可访问，且文案资源可正常切换。
3. 确认首页、工具列表页、两个工具页路由可访问。
4. 确认随机名字接口在无数据库情况下可返回结构化结果。
5. 确认像素头像在相同 seed 下输出一致，且支持 PNG 导出。
6. 确认 sitemap、robots、页面 metadata 和 OG 图路由生效。
7. 确认 CI 能通过 `lint`、`test`、`build`。
8. 确认执行阶段将正式规划文档同步落到 `/docs` 目录。
9. 确认最终站点名与域名候选在搜索引擎和域名注册商侧没有明显冲突后再定版。
