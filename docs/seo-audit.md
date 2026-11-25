# SSR SEO 审计闸门 / SSR SEO Audit Gate

本仓库的 SEO 闸门参考
[How I Built a Pre-Merge SSR SEO Audit Gate for Next.js 16 Content Pages](https://dev.to/tarotfortunecards/how-i-built-a-pre-merge-ssr-seo-audit-gate-for-nextjs-16-content-pages-271i)
实现，并针对本站（Next.js 16 App Router + 双语言 + 无 Vercel Preview 的本地提交场景）做了调整：
第二阶段不是访问线上预览，而是启动本地 production build，直接抓取爬虫拿到的原始 SSR HTML。

The gate follows the article's two-stage design, adapted for local pre-commit use:
stage 2 serves a local production build and fetches raw SSR HTML instead of a
deployed Vercel preview.

## 阻断项 / Blocking checks

| 阶段 Stage | 检查 Check | 规则 Rule |
| --- | --- | --- |
| Static | Sitemap coverage | `src/app/sitemap.ts` 中每个路由 × 每个语言都必须出现在 `sitemap.xml` |
| Static | Template overlap | 相邻页面正文句子 Jaccard 相似度 `< 15%`（忽略 header/footer/nav 与短句） |
| Static | Inbound links | 除首页外每个 URL 至少被另一个页面链接 |
| Static | Primary visuals | 首屏图必须为 WebP、`<= 60 KB`、带 `width`/`height`、不得 `loading="lazy"` |
| Static | Protected pages | `scripts/seo-baseline.json` 中的 title / description / h1 不得意外变化 |
| SSR | Response | HTTP 200，HTML 含站点名，`robots` 不得 `noindex` |
| SSR | Head | title / description 存在且全站唯一；canonical 与 sitemap URL 完全一致 |
| SSR | Headings | 恰好一个 `<h1>`，不得跳级（h1 → h3） |
| SSR | Content | 正文达到最少词数；FAQ 问题位于真实 `<h3>` 中 |
| SSR | Structured data | 每个 JSON-LD 块可解析；含 WebSite；有 FAQ 的页面含 FAQPage |
| SSR | Discovery | `robots.txt` 声明 Sitemap，且没有 `Disallow: /` |

标题 15–70（英文）/ 10–45（繁中）、描述 40–170 / 12–120（字符）、最少词数
属于警告；`--strict` 会把它们升级为阻断项。这些区间比原文的 30–60 / 120–160 宽松，
因为本站是工具页而非长文内容页。

Title / description length and minimum word count are warnings by default;
`--strict` promotes them to errors. The ranges are deliberately wider than the
article's 30–60 / 120–160 because this site publishes short tool pages, not
long-form reference articles.

## 使用 / Usage

```bash
npm run seo:audit                 # build + local SSR audit (used by pre-commit)
npm run seo:audit -- --skip-build # reuse an existing .next build (used by CI)
npm run seo:audit:baseline        # refresh the protected SEO snapshot
SEO_AUDIT_URL=https://… npm run seo:audit -- --skip-build  # audit a preview URL
```

`npm install` runs `prepare` and sets `core.hooksPath` to the committed
`.githooks/` directory. The hook only runs the audit when staged files can
change rendered HTML.
