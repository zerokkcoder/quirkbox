# 星舵工坊 · 品牌规范 / StarRudder Brand Guide

> 域名 / Domain: `starrudder.cc`
> 版本 / Version: 1.0 · 2026-11-25

---

## 1. 名称 / Names

| 语境 / Context | 用法 / Usage |
| --- | --- |
| 中文主名 / Chinese primary | 星舵工坊 |
| 英文主名 / English primary | StarRudder |
| 域名 / Domain | starrudder.cc |
| npm 包名 / Package | star-rudder |
| 存储键前缀 / Storage prefix | `starrudder:` |
| 导出文件前缀 / Export prefix | `starrudder-` |

**写法规则 / Usage rules**
- 英文始终写作 `StarRudder`（单一大写 S、R），不写 `Star Rudder`、`starrudder` 或 `StarRudder.cc`。
- 中文写作「星舵工坊」，不简写为「星舵」用于正式标题。
- 代码中 `siteConfig.name` 为 `StarRudder`；中文名通过 `siteConfig.nameZh` 提供。

---

## 2. 释义 / Meaning

**中文**：星为引路之标，舵为掌向之器。星舵工坊是一组放在浏览器里的纯工具——打开就能用，不注册、不上传、不保存任何用户数据。

**English**: A star to steer by, a rudder to hold the course. StarRudder is a set of pure browser tools — open and use them immediately, with no account, no uploads and no stored user data.

---

## 3. 语气 / Voice

**关键词 / Keywords**
- 中文：航行、坐标、罗盘、掌舵、落脚点、星图、工坊
- English: voyage, coordinates, compass, steer, waypoint, star chart, workshop

**避免 / Avoid**
- 中文：玩具箱、怪奇、实验场、玩玩看
- English: toybox, quirky, playground, just for fun

**原则 / Principles**
1. 沉稳但不严肃——像一位经验丰富的船长在讲路线，不喧哗，有把握。
2. 强调「可分享的成果」而非「工具本身」——用户带走的是一张图、一个名字、一条线。
3. 不承诺付费、AI 或账户——保持现有「免费、无需注册」的真实卖点。

---

## 4. 配色 / Palette

深空航海：靛蓝夜空为底，星金为引导色，航海蓝为辅助辉光。所有值以 OKLCH 定义，便于亮度微调。

| Token | 含义 / Meaning | 参考值 / Reference |
| --- | --- | --- |
| `--background` | 深空夜幕 / Deep space | `oklch(0.18 0.035 265)` |
| `--foreground` | 星白 / Star white | `oklch(0.96 0.012 255)` |
| `--primary` | 星金 / Star gold | `oklch(0.84 0.14 88)` |
| `--primary-foreground` | 深墨 / Deep ink | `oklch(0.19 0.03 265)` |
| `--accent` | 航海蓝辉 / Navigation glow | `oklch(0.55 0.13 235)` |
| `--accent-foreground` | 星白 / Star white | `oklch(0.96 0.012 255)` |
| `--border` | 星尘边界 / Stardust border | `oklch(1 0 0 / 14%)` |
| `--muted` | 暮光层 / Twilight surface | `oklch(0.24 0.03 265)` |
| `--muted-foreground` | 远星灰 / Distant star | `oklch(0.72 0.025 255)` |

**注意**：`.dark` 作为「更深一档的夜间模式」，浅色表面不再是默认。地图组件根据 `documentElement` 选择暗色底图，必须验证。

---

## 5. 品牌图形 / Brand mark

**构成 / Construction**：八角舵轮环 + 中心北极星。舵轮代表掌向，北极星代表不变的指引。

**用法 / Usage**
- 单色 `currentColor`，随主色变化；
- 页头 36px、页脚 28px、首页徽章 14px；
- 始终 `aria-hidden`，语义由相邻文字承担；
- 不拉伸、不改比例、不加阴影。

**文件 / Assets**
- 组件：`src/components/shared/brand-mark.tsx`
- 站点图标：`src/app/favicon.ico`

---

## 6. 文案示例 / Copy examples

| 场景 / Context | 英文 / English | 中文 / Chinese |
| --- | --- | --- |
| Hero 标题 | Tools that stay in your browser. | 工具，只留在你的浏览器。 |
| Hero 描述 | Small, fast tools that run on your device — no account, no uploads, no data saved. | 工具全部在你的装置上执行，不须账号、不须上传，也不会保存任何资料。 |
| 工具区眉标 | The tools | 工具清单 |
| 特性眉标 | Why StarRudder | 为什么是星舵工坊 |
| FAQ 眉标 | Good to know | 常见问题 |
| CTA | Open a tool | 打开一个工具 |

---

## 7. 禁止事项 / Don'ts

- 不要把品牌写成「星舵」单独用于正式标题（除非空间极度受限，如图标旁标签）。
- 不要在 OG 图或 UI 中混用旧配色（浅紫 + 琥珀）。
- 不要在导出文件或存储键里保留 `quirkbox` 前缀（旧数据兼容读取除外）。
- 不要给品牌图形加渐变、投影或描边——它必须在一个颜色下清晰可读。
