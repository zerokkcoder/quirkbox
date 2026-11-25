# 星舵工坊 · 图片格式转换器规划 / StarRudder Image Studio Plan

> 状态：已确认，全部按推荐实现 / Status: Confirmed — all recommendations adopted
> 来源 / Source: `docs/tool-ideas.md` 候选 #5 / Candidate #5
> 日期 / Date: 2026-11-25

> **实现变更 / Implementation notes（2026-11-26）**
> 下文原计划中的「快捷预设 / Quick presets」已在实现后**按用户决定移除**（方案 C）。原因：预设只是把「格式 + 质量 + 尺寸」打包，界面多一排按钮和说明，反而增加理解成本；改为**选中即实时出结果**后，预设可以完全由格式芯片 + 进阶微调替代。
> The "Quick presets" section described below was **removed after implementation** by product decision (option C). With live preview (the selected image is re-encoded ~350 ms after any settings change), presets became redundant: the format chips and the collapsed fine-tuning panel cover the same ground with less interface noise.
>
> 随之调整 / Resulting changes：
> - 布局：上传与预览**左右并列各占一半**，位于设置区之上 / upload and preview side by side, above the settings
> - `lib/presets.ts` → `lib/settings.ts`（URL 参数解析 + 格式能力判断）/ renamed, presets dropped
> - URL 不再带 `preset` 参数；旧链接因同时写入了 `format`/`quality`/`width` 仍能正确复现 / legacy `preset=` links still resolve through their explicit parameters
> - 不适用于当前格式的控件直接置灰（质量、背景色），不再用说明文字解释 / inapplicable controls grey out instead of being explained in prose

---

## 0. 决策摘要 / Decisions at a glance

| 项目 / Item | 提议 / Proposal |
| --- | --- |
| 工具名 / Name | 中文「圖片格式轉換器」，英文 `Image Studio` |
| 路由 / Route | `/tools/image-studio`（无前缀英文）/ `/zh-Hant/tools/image-studio`（繁中） |
| 核心 / Core | 拖入图片 → 选目标格式/预设 → 一键批量转换 → 下载，全程留在浏览器 |
| 输入格式 / Input | PNG / JPEG / WebP / GIF / BMP / AVIF / ICO / SVG（栅格化） |
| 输出格式 / Output | PNG / JPEG / WebP（原生）+ AVIF（探测）+ ICO / BMP（手写封装）+ GIF（静态，轻量编码库） |
| 状态存放 / State | URL 只存转换参数，**不存图片字节**；图片只在内存，不写 localStorage |
| 依赖 / Dependencies | 推荐 1 个极小编码依赖（`gifenc`）用于 GIF 输出；其余零新增 |
| 改造范围 / Scope | 新增一个 feature + section + 双路由 + OG，接入首页/工具页卡片、sitemap、SEO 基线、e2e |

**核心命题 / Core idea**：把「格式转换」做成一座不靠服务器的码头——文件拖进来就转，转完直接拿走；图片和参数都不离开用户的设备。

> 说明：SVG → 位图可以，位图 → SVG 不是真正的矢量转换，本期不做，避免误导用户（见 §9 待决项 3）。

---

## 1. 产品定义 / Product definition

### 1.1 是什么 / What it is

**中文**：图片格式转换器是一个在浏览器里运行的本地图片转换台。支持常见图片格式之间互转，可批量处理、调整尺寸与压缩质量，并即时看到体积变化。图片不上传、不进服务器、不写本地存储，关掉页面就没了。

**English**: Image Studio is a browser-only image converter. It converts between common image formats, handles batches, resizes and compresses, and shows the size difference before you download. Nothing is uploaded or stored — close the tab and it's gone.

### 1.2 怎么用 / How to use

**中文**：把图片拖进页面（或点击选择、从剪贴板粘贴）→ 选一个快捷预设或目标格式 → 点「全部转换」→ 逐张下载或打包下载。分享链接保留的是转换参数，对方打开后放入自己的图片即可复现同样设置。

**English**: Drop images onto the page (or browse / paste from clipboard) → pick a quick preset or target format → hit "Convert all" → download files individually or as a ZIP. Shared links carry the settings, not the images, so the recipient gets the same recipe with their own files.

### 1.3 用户故事 / User stories

1. 作为前端开发者，我想把 PNG 截图批量转成 WebP，减少页面体积。
2. 作为设计师，我想把透明 PNG 转成白底 JPEG，且不希望背景变黑。
3. 作为运营，我想把一批商品图压到 1600px 以内再上传 CMS。
4. 作为注重隐私的用户，我要求图片绝不离开设备，页面不发任何网络请求。
5. 作为移动端用户，我想直接拍照/粘贴截图就能转换，不用先传到云端。

### 1.4 非目标 / Non-goals

- 不做图片编辑（裁剪、滤镜、抠图）——不属于「格式转换」。
- 不做真正的位图转矢量 SVG，也不承诺保留 EXIF / GPS / ICC / 动图帧等元数据。
- 不做账号、云同步、历史记录（与「不保存用户数据」冲突）。
- 不在 URL 里编码图片内容（体积与隐私双重原因）。

---

## 2. 功能规格 / Feature spec

### 2.1 格式矩阵 / Format matrix

| 格式 / Format | 输入 / Decode | 输出 / Encode | 实现方式 / How |
| --- | --- | --- | --- |
| PNG | ✅ | ✅ | `canvas.toBlob("image/png")` |
| JPEG | ✅ | ✅ | `canvas.toBlob("image/jpeg", quality)` |
| WebP | ✅ | ✅ | `canvas.toBlob("image/webp", quality)` |
| AVIF | ✅（浏览器支持时） | ⚠️ 运行时探测 | 1×1 canvas 试编码，失败则隐藏该选项 |
| GIF | ✅（取第一帧） | ✅（静态） | 输入走原生解码；输出用 `gifenc` 量化编码 |
| BMP | ✅ | ✅ | 手写 24/32-bit BMP 文件头 + 像素数据 |
| ICO | ✅ | ✅（≤256×256） | 手写 ICO 容器，内部包 PNG（现代浏览器通用） |
| SVG | ✅（栅格化） | ❌ | `Image` + blob URL，禁用外部引用；输出位图而非矢量 |

- 每个格式选项在 UI 上标注真实能力，例如「GIF 仅取首帧」「ICO 限 256px」。
- 解码失败的文件单独标红并给出原因，不影响队列里其他文件。
- 输入格式从 MIME + 扩展名双重推断；未知扩展名仍尝试原生解码。

### 2.2 高频操作精简 / Reducing clicks

| 设计 / Design | 效果 / Benefit |
| --- | --- |
| 一个拖放区同时支持点击选择、多文件、剪贴板粘贴 | 不需要先找「上传」按钮 |
| 自动识别输入格式，给出智能默认目标格式 | 打开就能按「转换」 |
| 5 个快捷预设一键套用（见下） | 与 Palette Studio 一致，减少参数操作 |
| 「全部转换」+「全部下载」两个主按钮 | 批量流程只需两次点击 |
| 每张卡片显示原尺寸/体积 → 新尺寸/体积与节省百分比 | 不用下载后再比对 |

**快捷预设 / Quick presets**：

| 预设 / Preset | 参数 / Settings | 场景 / Use case |
| --- | --- | --- |
| 网页优化 / Web optimized | WebP, q80, 最长边 1600 | 截图、配图上线 |
| 社交头像 / Avatar | PNG, 512×512, 保持比例 | 头像、Logo |
| 白底 JPG / Flatten to JPG | JPEG, q85, 透明填白 | 证件照、印刷稿 |
| 无损归档 / Lossless archive | PNG, 原尺寸 | 需要保真 |
| 批量转 WebP / Batch WebP | WebP, q75, 原尺寸 | 整目录转换 |

### 2.3 参数 / Settings

| 参数 / Setting | 形式 / Control | URL 参数 / Param | 默认 / Default |
| --- | --- | --- | --- |
| 目标格式 / Format | 格式芯片（仅显示可用项） | `format` | 按输入智能推荐 |
| 质量 / Quality | 滑杆 1–100（仅 JPEG/WebP/AVIF/GIF 显示） | `quality` | `80` |
| 最大宽 / Max width | 数字输入，与高锁定比例 | `width` | `0`（不限） |
| 最大高 / Max height | 数字输入 | `height` | `0`（不限） |
| 透明背景填充 / Background | 颜色拾取器（仅转 JPEG 时显示） | `bg` | `ffffff` |
| 文件命名 / Naming | 后缀规则：保留原名 / 加格式后缀 | `suffix` | `1` |
| 快捷预设 / Preset | 按钮组 | `preset` | 无 |

- 所有变化通过 `replaceSearchState` 同步 URL；**只写参数，不写图片**。
- 非法参数一律回退默认值，不抛错。
- 质量滑杆对 PNG / ICO / BMP 隐藏，因为无损格式没有质量概念。

### 2.4 输出与下载 / Outputs & downloads

1. **逐张下载**：每张卡片独立「下载」按钮，文件名 `原名.目标扩展名`。
2. **打包下载**：手写 store-only ZIP（无压缩，纯 TS + CRC32），一次拿到全部结果；不引入压缩库。
3. **转换前后对比**：缩略图并排 + 体积差 + 节省百分比。
4. **失败项保留**：失败文件仍留在列表里，可移除后重转。

### 2.5 隐私与生命周期 / Privacy & lifecycle

- 所有解码/编码在 `File` / `Blob` / `ImageBitmap` / `OffscreenCanvas` 内存中进行。
- 不发网络请求、不写 localStorage / IndexedDB / Cookie。
- `URL.createObjectURL` 产生的预览地址在卡片移除、重转、组件卸载时 `revokeObjectURL`。
- `ImageBitmap.close()` 在每次编码后释放，避免大图批量转换时内存堆积。
- EXIF / GPS 等元数据不会保留——这是隐私优势，需在文案里说明。

---

## 3. 技术方案 / Technical design

### 3.1 转换管线 / Pipeline

```
File / ClipboardItem
  → 识别 MIME + 扩展名
  → decode（createImageBitmap；SVG/ICO 回退 Image + blob URL）
  → ImageBitmap（EXIF 方向默认 from-image）
  → 计算目标尺寸（等比缩放，默认不放大）
  → 透明处理（转 JPEG 时按 bg 填充）
  → encode：
      PNG/JPEG/WebP/AVIF → canvas.toBlob（AVIF 先探测）
      ICO → PNG payload + 手写 6 字节头 +目录项
      BMP → 手写 BITMAPFILEHEADER / BITMAPINFOHEADER + BGRA 像素
      GIF → gifenc 量化 + LZW
  → Blob + 下载文件名
  → 预览 / 体积对比 / ZIP 打包
```

### 3.2 运行时能力探测 / Capability detection

```ts
// 伪代码：不靠浏览器白名单，避免版本变化导致误判
async function isEncodable(mime: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, 0.8)
  );
  return blob?.type === mime && blob.size > 0;
}
```

- `image/avif` 只在探测通过时加入格式芯片；探测结果缓存一次。
- 解码失败（例如某些浏览器的 AVIF / ICO）给明确文案，不静默降级成错误图片。

### 3.3 模块划分 / Modules

```
src/features/image-studio/
├── lib/
│   ├── types.ts          # FormatId、PresetId、ConversionState、JobStatus
│   ├── formats.ts        # 格式元数据、扩展名/MIME 映射、能力探测
│   ├── decode.ts         # File → ImageBitmap，SVG/ICO 回退
│   ├── resize.ts         # 等比缩放、尺寸约束、不放大策略
│   ├── encode.ts         # toBlob 原生编码 + ICO/BMP/GIF 辅助编码
│   ├── zip.ts            # store-only ZIP 写入 + CRC32
│   ├── presets.ts        # 5 个快捷预设 + parseImageStudioState
│   └── *.test.ts         # 上述纯函数单测
└── components/
    ├── image-studio-tool.tsx   # 主交互、队列、URL 状态
    ├── drop-zone.tsx           # 拖放/选择/粘贴
    ├── format-picker.tsx       # 可用格式芯片
    └── job-card.tsx            # 单文件预览、状态、下载
```

- `lib/*` 尽量保持纯函数；DOM 相关（`canvas`、`Image`）集中在 `decode.ts` / `encode.ts`，便于 Vitest + jsdom 覆盖。
- 批处理默认在主线程逐项 `await`，每项间让出一次事件循环，避免长任务卡 UI；Web Worker 方案列为后续优化（§9 待决项 6）。

### 3.4 交互与布局 / UI layout

```
┌──────────────────────────────────────────┐
│ 拖放区：拖入 / 点击选择 / 剪贴板粘贴      │
├──────────────────────────────────────────┤
│ 快捷预设（5 个）→ 目标格式芯片 → 参数     │
├──────────────────────────────────────────┤
│ [全部转换]  [全部下载 ZIP]  [清空]        │
├──────────────────────────────────────────┤
│ 文件卡片列表：缩略图 / 原→新 / 状态 / 下载 │
└──────────────────────────────────────────┘
```

- 移动端单列：拖放区 → 预设/参数 → 主按钮 → 卡片列表。
- 空状态给出明确引导：「把图片拖到这里，或点这里选择」。
- 格式芯片禁用态显示原因（如「当前浏览器不支持 AVIF 编码」），不要只灰色了事。

---

## 4. 文件清单 / File checklist

### 4.1 新增 / Add

| 文件 / File | 用途 / Purpose |
| --- | --- |
| `src/features/image-studio/lib/{types,formats,decode,resize,encode,zip,presets}.ts` | 格式、转换、打包、URL 状态纯逻辑 |
| `src/features/image-studio/lib/*.test.ts` | 格式映射、尺寸、编码头、ZIP、URL 解析单测 |
| `src/features/image-studio/components/{image-studio-tool,drop-zone,format-picker,job-card}.tsx` | 交互组件 |
| `src/components/sections/image-studio-page.tsx` | 页面 section（PageHeader + ToolPageIntro + Tool） |
| `src/app/tools/image-studio/page.tsx` | 英文路由 + metadata |
| `src/app/[locale]/tools/image-studio/page.tsx` | 繁中路由 + generateMetadata |
| `src/app/tools/image-studio/opengraph-image.tsx` | OG 卡 |
| `e2e/image-studio.spec.ts` | 转换、批量、URL、双语、无网络请求 |

### 4.2 修改 / Edit

| 文件 / File | 改动 / Change |
| --- | --- |
| `messages/en.json` / `messages/zh-Hant.json` | 新增 `imageStudio.*` 双语 SEO/UI 文案；`tools` / `home` 增一张卡 |
| `src/proxy.ts` | `toolSlugs` 加入 `image-studio`，否则繁中路由被 404 |
| `src/app/sitemap.ts` | routes 加入 `/tools/image-studio`；`lastModified` 按发布日提升 |
| `src/components/sections/home-page.tsx` / `tools-page.tsx` | 增加工具卡（`ImageIcon`） |
| `src/config/site.ts` | 站点描述加入图片转换关键词（若 §9-5 选 A） |
| `src/app/opengraph-image.tsx` | 站点 tagline 变动时同步 |
| `README.md` | 工具清单增加 Image Studio |
| `scripts/seo-baseline.json` | 文案定稿后刷新（新增 2 路由，站点描述若改则全量刷新） |
| `docs/tool-ideas.md` | 决策记录标注 #5 已规划 |

---

## 5. 文案与 SEO / Copy & SEO

### 5.1 Metadata（提案 / proposed）

| 语言 / Locale | title | description | keywords |
| --- | --- | --- | --- |
| en | `Image Converter — Convert PNG, JPG, WebP & More Online` | `Convert images between PNG, JPEG, WebP, AVIF, GIF, ICO and BMP entirely in your browser. Batch convert, resize and compress locally — no uploads, no signup.` | `image converter`, `png to webp`, `jpg to png`, `webp to jpg`, `batch image converter` |
| zh-Hant | `圖片格式轉換器 — 在線 PNG/JPG/WebP 互轉` | `在瀏覽器中將圖片於 PNG、JPG、WebP、AVIF、GIF、ICO、BMP 間互轉，支援批量、壓縮與尺寸調整。不上傳、不註冊。` | `圖片格式轉換器`, `png 轉 webp`, `jpg 轉 png`, `在線圖片轉換`, `批量圖片壓縮` |

- 描述长度符合审计闸门（英文 40–170、繁中 12–120 字符）。
- `ToolPageIntro` 自动输出 `SoftwareApplication` JSON-LD，无需手写。
- 必须明确写「链接只带参数、不带图片」，否则用户会误以为分享链接能传图。

### 5.2 关键文案 / Key copy

| Key | en | zh-Hant |
| --- | --- | --- |
| `intro` | A browser-only image converter that turns one format into another, resizes and compresses in batch, and never uploads your files. | 在瀏覽器中執行的圖片轉換器，支援格式互轉、批量縮放與壓縮，圖片完全不上傳。 |
| `howTo` | Drop or paste images, pick a preset or target format, convert all, then download individually or as a ZIP. Links carry settings only, never images. | 拖入或貼上圖片，選取預設或目標格式，一鍵全部轉換後逐張下載或打包。連結只包含設定，不包含圖片。 |

---

## 6. 验收标准 / Acceptance criteria

> **执行时机**：按用户约定，以下验证全部放在用户本地实测确认之后；提交/推送为最后一步。

1. `npx tsc --noEmit`、`npm run lint`、Vitest 全绿（新增单测覆盖格式映射、尺寸计算、ICO/BMP 头部、ZIP CRC32、URL 参数、预设）。
2. `npm run build` 成功，两个新路由产出 SSR HTML。
3. `npm run seo:audit -- --skip-build` 为 0 warning / 0 error；sitemap 从 16 增至 18 条。
4. `npm run test:e2e` 全绿，新增用例覆盖：
   - 生成 PNG fixture → 转 WebP → 下载文件带 `RIFF....WEBP` magic；
   - 批量 3 张图 → 全部转换 → ZIP 内含 3 个结果；
   - 透明 PNG → JPEG 白底合成正确（角落像素接近白色）；
   - URL `?format=webp&quality=70` 刷新后参数保持；
   - `/zh-Hant` 页面无英文残留；
   - 拦截所有外部请求后工具仍正常（验证无上传）。
5. 本地生产实测：两个路由 200、`<h1>` 唯一、canonical 正确；`/en/tools/image-studio` 308 跳到无前缀路径。
6. 手动检查：大图批量转换时 UI 不长时间冻结；预览 blob 在清空/卸载后释放；移动端无横向溢出。
7. pre-commit SEO 闸门通过后提交并推送 `origin/main`；代理阻断时按既有 HTTP/1.1 兜底。

---

## 7. 风险与取舍 / Risks & trade-offs

| 风险 / Risk | 应对 / Mitigation |
| --- | --- |
| 用户以为「全格式互转」包含无损矢量/动图 | UI 明确标注「GIF 仅首帧」「SVG 输入会栅格化」「不提供 SVG 输出」 |
| 某浏览器 `toBlob(avif)` 静默回退 PNG | 运行时 1×1 探测 + 校验 blob.type，失败即隐藏选项 |
| 大图批量转换阻塞主线程 | 逐项 await + 让出事件循环；后续可迁 Web Worker |
| 透明 PNG 转 JPEG 出现黑底 | 转换前按 `bg` 填充，默认白色，并提供拾色器 |
| 多个下载被浏览器拦截 | 默认提供 store-only ZIP 打包，逐张下载作为补充 |
| `gifenc` 引入体积 | 仅用于 GIF 输出；按需动态 import，不进首屏包 |
| SEO 基线因站点描述变动漂移 | 文案定稿后一次性刷新基线，之后不再改 |

---

## 8. 待决项 / Open questions

以下六项已有推荐默认值，如无异议将按推荐执行（可直接在编号上标注选择）：

1. **输出格式范围**：A. 原生 + ICO/BMP 手写 + GIF 静态（推荐，覆盖最广、依赖极小） / B. 仅原生 PNG/JPEG/WebP/条件 AVIF（零依赖但不够「全」） / C. 再加 SVG 输出（不推荐，位图转 SVG 不是真矢量）。
2. **动图处理**：A. GIF 输入只取第一帧、输出静态 GIF（推荐，坦诚标注） / B. 保留动图帧（需更大依赖与更复杂编码，工期明显上升）。
3. **批量下载**：A. 手写 store-only ZIP + 逐张下载（推荐，零依赖） / B. 只提供逐张下载（最简单，但多文件可能被浏览器拦截）。
4. **SVG 输入**：A. 支持并栅格化，禁用外部引用（推荐，覆盖更多输入） / B. 不支持 SVG（更稳，少一类边界情况）。
5. **站点级描述**：A. 同步加入 image conversion 关键词（推荐，SEO 一致，需刷新全站基线） / B. 只改工具页描述（改动小，但首页关键词少一个）。
6. **批处理性能**：A. v1 主线程逐项 + 让出事件循环（推荐，够用且简单） / B. 直接上 Web Worker + OffscreenCanvas（更流畅，复杂度高）。

---

## 9. 实施顺序 / Implementation order

审阅通过后按此编号清单推进：

1. 在 §8 标注选择；确认后更新 `docs/tool-ideas.md` 决策记录。
2. 实现 `types.ts` / `formats.ts` / `resize.ts` 与单测，先锁定格式能力和尺寸算法。
3. 实现 `decode.ts` / `encode.ts` / `zip.ts` / `presets.ts` 与单测（含 ICO/BMP 头部、CRC32、URL 解析）。
4. 实现四个组件，接通拖放/粘贴、队列、预设、批量转换与下载。
5. 新增 section、双路由、metadata、OG 卡。
6. 补齐双语 SEO/UI 文案、首页与工具页卡片、sitemap、proxy 白名单、README、SEO 基线。
7. 新增 e2e 用例；**交付本地工作区给用户实测**。
8. 用户确认后按顺序跑：单测 → lint → build → SEO 审计 → e2e → 提交推送。

---

> 审阅意见请直接标注在 §8 的编号上；确认后按 §9 开始实现。
> Please annotate item numbers in §8 with your decisions; implementation starts on §9 once confirmed.
