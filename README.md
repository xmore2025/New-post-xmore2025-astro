# xmore · 极简博客

> 一个用 Astro 承载、样式全部手写的极简开发者博客 —— 没有 UI 框架，没有 Tailwind，没有多余的一层。

[![Deploy](https://github.com/xmore2025/New-post-xmore2025-astro/actions/workflows/deploy.yml/badge.svg)](https://github.com/xmore2025/New-post-xmore2025-astro/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-1a5da8)](./LICENSE)
[![Astro](https://img.shields.io/badge/astro-7.4-1a5da8)](https://astro.build)
[![Node](https://img.shields.io/badge/node-%E2%89%A5%2024-1a5da8)](https://nodejs.org)

**[🌐 在线预览](https://web2046.xmorexz.dpdns.org)** · **[📄 优化说明](./OPTIMIZATION.md)**

![站点预览](./docs/preview.png)

---

## ✨ 特性

|                              |                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **3 个运行时依赖**           | `astro` · `@astrojs/rss` · `@astrojs/sitemap`；字体与工具链都在 devDependencies                                      |
| **零 UI 框架**               | 无 React / Vue / Tailwind，样式是 1 份分层手写 CSS                                                                   |
| **自托管字体，只带需要的字** | 霞鹜文楷 + Inter + JetBrains Mono 按内容子集化：**4 个 woff2 / 约 458 KB**；首屏只预加载正文与等宽 2 个（约 234 KB） |
| **首屏零阻塞**               | 样式内联进 HTML（约 7 KB gzip），不产生渲染阻塞请求                                                                  |
| **排版优先**                 | 最小 12px · 6 级字阶 · 16px 楷体正文 / 1.8 行高 · 约 45 汉字行宽 · 发丝分隔线                                        |
| **明暗主题**                 | 跟随系统、可切换、`localStorage` 记忆、首屏无闪烁、地址栏颜色同步                                                    |
| **页面切换**                 | 原生 View Transition + Speculation Rules 预渲染，点击近乎瞬时，零运行时                                              |
| **SEO**                      | WebSite / Organization / BlogPosting / BreadcrumbList 结构化数据 · sitemap `lastmod` · OG/Twitter · RSS              |
| **可访问**                   | axe-core 全站扫描 **0 违规**（WCAG 2.1 A/AA）· skip link · 焦点管理 · `prefers-reduced-motion`                       |
| **代码规范**                 | `astro check` 0 错误 · Prettier 统一风格 · CI 会在构建前跑三项校验                                                   |

---

## 🚀 快速开始

需要 **Node.js ≥ 24**（Astro 7 的要求）。

```bash
npm install
npm run dev          # 开发服务器 http://localhost:4321
npm run build        # 构建到 dist/（20 个页面，约 1–2 秒）

npm run check        # TypeScript / Astro 类型检查
npm run format       # Prettier 格式化
npm run fonts        # 内容更新后重建字体子集（需要下载一次 17 MB 源字体）
npm run fonts:check  # 校验字体子集是否覆盖当前内容（CI 用）
```

---

## 📁 目录结构

```text
.
├── astro.config.mjs               # site / 内联样式 / sitemap(lastmod) / Shiki 双主题
├── site.config.json               # 站点配置：标题 / 作者 / 域名 / 分享图 / 导航 / 社交 / 评论
├── .prettierrc.mjs                # 代码风格（含 astro 插件）
├── .prettierignore
├── tools/
│   ├── build-fonts.mjs            # 字体子集化：扫描源码 → 产出 woff2 + @font-face
│   └── og-card.html               # 分享图源文件
├── public/
│   ├── fonts/*.woff2              # 子集字体（文件名带内容哈希）
│   ├── _headers                   # 缓存与安全响应头
│   ├── og-card-v2.png             # 1200×630 分享图（通过 site.config.json 配置）
│   ├── favicon.svg · robots.txt · manifest.webmanifest
├── src/
│   ├── config.ts                  # 读取 site.config.json 并给出类型
│   ├── content.config.ts          # 内容集合 schema（title/date/updated/tags…）
│   ├── content/                   # posts/*.md · pages/about.md
│   ├── layouts/BaseLayout.astro   # <head> / SEO / JSON-LD / 主题脚本 / 预渲染规则
│   ├── components/                # Header · NavLinks · Footer · PostRow · TagList · GiscusComments …
│   ├── lib/
│   │   ├── posts.js               # 取文章 / 标签、阅读时长、日期格式化
│   │   ├── fonts.ts               # 解析生成的 @font-face，产出首屏 preload 列表
│   │   └── types.ts               # PostSummary / TagRef 共享类型
│   ├── pages/
│   │   ├── index.astro            # 首页
│   │   ├── posts/index.astro      # 归档
│   │   ├── posts/[...slug].astro  # 文章（BlogPosting + BreadcrumbList）
│   │   ├── categories/index.astro # 分类（Bento 网格）
│   │   ├── tags/ · about · 404
│   │   ├── rss.xml.ts · search.json.ts
│   ├── scripts/                   # 交互（Vite 合并为 1 个文件）
│   │   ├── app.js                 #   入口
│   │   └── modules/               #   dom / theme / nav / search / article / ui
│   └── styles/
│       ├── main.css               #   入口（@import 顺序）
│       ├── font-face.css          #   生成的 @font-face（勿手改）
│       ├── tokens.css             #   设计令牌（颜色 / 字阶 / 间距 / 动效）
│       ├── base.css · layout.css · components.css · prose.css
└── dist/                          # 构建产物（gitignore）
```

---

## 🔤 字体策略

中文 Web 字体的体积是这类站点最大的性能变量。`@fontsource` 的分片方案在**内容很少**的站点上反而浪费：一篇文章仍会触发 16 个分片、约 879 KB。

本项目改为**按内容子集化**。字体栈与 mundi-xu.github.io 保持一致：**霞鹜文楷（LXGW WenKai Screen）排第一位，中文和拉丁字母都由它渲染** —— 霞鹜文楷自带楷体风格的拉丁字形，参考站实测正文英文的宽度与 LXGW 完全一致。Inter、Noto Sans SC 只在子集缺字时兜底，正常访问不会下载：

1. `tools/build-fonts.mjs` 扫描 `src/**` 与 `site.config.json`，收集真正会被渲染的字符；
2. 用 `subset-font`（HarfBuzz）把霞鹜文楷、Inter、Noto Sans SC 与 JetBrains Mono 裁成内容子集：霞鹜文楷覆盖中文与全部 ASCII（含拉丁字母、数字、标点、箭头等符号），Inter 只保留 Latin 作为缺字兜底；可变字体把字重轴收到 `400–650`（霞鹜文楷上游只有静态 Regular，600 字重由浏览器合成），并去掉不需要的 OpenType 特性与 hinting；
3. 文件名带内容哈希 → 可以 `immutable` 长缓存；
4. `npm run fonts:check` 在 CI 中校验「内容字符 ⊆ 子集」，忘记重建会直接失败。

| 方案                | 请求数 | 传输量   |
| ------------------- | ------ | -------- |
| fontsource 全量分片 | 16     | ≈ 879 KB |
| 内容子集（本项目）  | **4**  | ≈ 458 KB |

首屏只预加载霞鹜文楷与 JetBrains Mono 两个子集（约 234 KB）；Inter 与 Noto Sans SC 仅作缺字兜底。写新文章后如果出现子集外的生僻字，浏览器会自动回退到系统字体（不会豆腐块）；跑一次 `npm run fonts` 即可把新字并入子集。

首页及文章分享图源文件为 `tools/og-card.html`，生成后的 `public/og-card-v2.png` 由 `site.config.json` 中的 `ogImage` 配置引用。

> 字体 preload 的取舍：早期使用 @fontsource 的 100+ 条 `unicode-range` 分片时，preload 会同时拉起多个分片、延长字体阻塞期，实测 FCP 反而变差；现在合并为单个内容子集后，preload 只提前一个请求，能让首个文本绘制更早开始。如果以后换成按路由切分的多片子集，需要重新评估这一段。

### 💬 文章评论

文章详情页使用 [Giscus](https://giscus.app/zh-CN) 加载评论。先在 GitHub 仓库设置中启用 Discussions，然后打开 Giscus 配置页，选择当前仓库和一个 Discussions 分类，把分类名称和分类 ID 填入 `site.config.json` 的 `comments` 字段（仓库和仓库 ID 已预填）。配置完成后评论区会自动显示；当前未填写分类信息时，文章页会提示如何完成配置。

Giscus 的评论按文章路径关联，语言跟随站点设置，明暗主题跟随站点主题切换。

**加载策略**：评论区在页面最底部，`client.js` 与 iframe 里整套 Next.js 应用（一次完整加载约 19 个请求，还要等 GitHub Discussions API）不应该和首屏字体、文章正文抢带宽。因此：

1. **不随页面加载**：用 `IntersectionObserver`（提前 600px）只在读者接近评论区时才注入 `client.js`；带 `#comments` 锚点直达时立即加载；
2. **预渲染安全**：`document.prerendering` 期间不请求，Speculation Rules 预渲染出来的隐藏页面不会偷偷拉起评论；
3. **骨架占位**：加载前显示 220px 高的占位与状态文案，iframe 就绪后再撤掉，避免页面高度跳动；
4. **按需建连**：加载时才 `preconnect`，并给 iframe 加 `data-loading="lazy"` 作为无 `IntersectionObserver` 时的兜底；
5. **失败兜底**：10 秒仍未就绪时给出「前往 GitHub 讨论区」的链接。

如果主要读者在中国大陆，`giscus.app` 与 GitHub API 的往返会明显变慢。此时可以把 Giscus [自托管](https://github.com/giscus/giscus/blob/main/SELF-HOSTING.md) 到自己的域名，并修改 `site.config.json`：

```json
"comments": { "origin": "https://giscus.example.com" }
```

组件会从该地址加载 `client.js` 并把 iframe 指向它；也可以直接换成 [Waline](https://waline.js.org/) / [Twikoo](https://twikoo.js.org/) 这类自托管评论，彻底去掉 GitHub OAuth 与跨洋 API 的依赖。

---

## 🎨 设计系统

所有视觉决策都收敛在 `src/styles/tokens.css`。

### 字阶（最小 12px）

| 变量           | 值      | 用途                         |
| -------------- | ------- | ---------------------------- |
| `--fs-xs`      | 12px    | 日期、标签、辅助信息（最小） |
| `--fs-sm`      | 14px    | 导航、摘要、次级说明、代码块 |
| `--fs-base`    | 16px    | 正文、列表标题               |
| `--fs-lg`      | 18px    | 重点卡片、正文二级标题       |
| `--fs-title`   | 24–36px | 内页标题                     |
| `--fs-display` | 32–50px | 首页主标题                   |

字号使用 `rem` 和响应式 `clamp()`；正文行高为 1.8，代码使用 JetBrains Mono。正文行内代码会继承正文尺寸，但不低于 12px；避免全站缩放破坏最小字号约定。

### 颜色与对比度

| 变量       | 亮色      | 暗色      | 对比度（亮 / 暗）          |
| ---------- | --------- | --------- | -------------------------- |
| `--fg`     | `#1b1b1e` | `#e8e6e1` | 16.9:1 / 14.4:1            |
| `--muted`  | `#5e5e67` | `#a8a59d` | 6.4:1 / 8.2:1              |
| `--faint`  | `#70707a` | `#8f8d85` | 4.6:1 / 5.9:1              |
| `--accent` | `#1a5da8` | `#8ab2ee` | 链接 / 当前导航 / 置顶序号 |

全站只有一个强调色；`--muted` / `--faint` 是按 WCAG AA 反推的，axe 扫描 0 违规。

---

## ⚡️ 性能

在 **Slow 4G（1.6 Mbps / 150 ms）+ 4× CPU 降速** 的无头 Chrome 中测量（同机对比）：

| 指标           | 优化前         | 现在              | 变化           |
| -------------- | -------------- | ----------------- | -------------- |
| 首页 FCP       | 1228 ms        | **592 ms**        | −52%           |
| 首页 LCP       | 1228 ms        | **940 ms**        | −23%           |
| 文章页 LCP     | 1084 ms        | **768 ms**        | −29%           |
| 请求数（首页） | 23             | **6**             | −74%           |
| 传输量（首页） | 1035 KB        | **239 KB**        | −77%           |
| 字体           | 16 个 / 879 KB | **2 个 / 234 KB** | −74%           |
| CLS            | 0.0003         | 0.0004            | 基本持平（≈0） |

以上是上一轮的基线；本轮改动集中在文章页的评论与预渲染流量，首屏指标保持不变。

做法：

- **样式内联**：`build.inlineStylesheets: 'always'`，HTML 到达即可绘制，首屏没有阻塞 CSS 请求；
- **字体子集 + `font-display: swap` + 内容哈希缓存**；
- **正文样式按需**：`prose.css` 只在文章 / 关于页引入，其余页面不下载；
- **长列表 `content-visibility: auto`**；滚动统一 `requestAnimationFrame`；
- **搜索索引空闲预取**，首屏不承担搜索成本；
- **评论按需加载**：`IntersectionObserver` 提前 600px 触发，不再和首屏抢带宽；
- **预渲染按意图**：Speculation Rules 从 `eager` 改为 `moderate`，悬停 / 触摸时才预渲染，避免在隐藏文档里执行脚本与拉起评论；
- 构建产物文件名带哈希，`/_astro/*`、`/fonts/*` 均为 `immutable` 长缓存。

---

## 🔍 SEO

- **结构化数据**：`BaseLayout` 输出 `WebSite` + `Organization`；文章页追加 `BlogPosting`（含 `dateModified` / `wordCount` / `timeRequired` / `articleSection`）与 `BreadcrumbList`；
- **sitemap**：`lastmod` 取自 frontmatter（支持 `updated`），404 与 `search.json` 已排除；
- **canonical / OG / Twitter**：每页生成，`og:image` 固定 1200×630（`image/png`）；
- **robots**：`index, follow, max-image-preview:large, max-snippet:-1`；404 页 `noindex, nofollow`；
- **RSS**：含 `lastBuildDate` 与 `ttl`。

---

## ✍️ 写一篇新文章

在 `src/content/posts/` 新建 `my-post.md`：

```markdown
---
title: 文章标题
description: 一句话摘要，会出现在列表与 SEO 描述里
date: 2026-10-01
updated: 2026-10-05 # 可选，用于 sitemap lastmod 与 dateModified
tags: [design, css]
featured: false
---

正文从这里开始。
```

保存后 `npm run fonts` 重建字体子集（新增了生僻字才需要），再 `npm run build`。

| 字段                    | 类型       | 作用                                  |
| ----------------------- | ---------- | ------------------------------------- |
| `title` / `description` | `string`   | 必填；标题与摘要（同时用于 SEO 描述） |
| `date`                  | `date`     | 必填，`YYYY-MM-DD`                    |
| `updated`               | `date`     | 可选，修订日期                        |
| `tags`                  | `string[]` | 自动汇总并生成 `/tags/<tag>/`         |
| `featured`              | `boolean`  | 首页「置顶」卡片（取第一篇）          |
| `draft`                 | `boolean`  | `true` 时构建跳过                     |

---

## ⚙️ 站点配置

`site.config.json` 是唯一的事实来源：

| 字段                                                | 说明                                               |
| --------------------------------------------------- | -------------------------------------------------- |
| `title` / `titleSuffix` / `tagline` / `description` | 站点名、标题后缀、首页大标题、默认描述             |
| `author`                                            | 作者名                                             |
| `url`                                               | 正式域名（canonical / OG / RSS / Sitemap）         |
| `ogImage`                                           | 可选分享图路径；设置后生成 OG / Twitter 图片元数据 |
| `social`                                            | GitHub / X / Telegram / 邮箱，留空则不渲染         |
| `nav`                                               | 顶部导航项                                         |
| `comments`                                          | Giscus 仓库 / 分类 / 可选 `origin`（自托管地址）   |

---

## ☁️ 部署

**线上地址：<https://web2046.xmorexz.dpdns.org>**

推送到 `main` → GitHub Actions 依次执行 `npm ci` → `fonts:check` → `check` → `format:check` → `build` → `wrangler pages deploy dist`。

| Secret                  | 说明                              |
| ----------------------- | --------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Pages:Edit 权限的 API Token       |
| `CLOUDFLARE_ACCOUNT_ID` | 见 `wrangler.toml` / 仓库 Secrets |

换域名时改两处：`site.config.json` 的 `url`、`public/robots.txt` 的 `Sitemap` 地址。

---

## ⌨️ 快捷键

| 键              | 行为                       |
| --------------- | -------------------------- |
| `⌘K` / `Ctrl K` | 打开搜索                   |
| `/`             | 打开搜索（不在输入框内时） |
| `↑` `↓` `↵`     | 搜索结果导航               |
| `Esc`           | 关闭搜索 / 菜单            |

---

## 🧱 工程约定

- **样式分层**：`font-face → tokens → base → layout → components → prose`，`main.css` 只负责顺序；
- **脚本按职责拆分**：`src/scripts/modules/*`，入口只做初始化；全部渐进增强；
- **类型**：`.astro` 使用 TS，组件 props 用 `interface Props`；共享类型放 `src/lib/types.ts`；
- **规范**：Prettier（`npm run format`）、`astro check`（`npm run check`），CI 强制；
- **URL 稳定**：`trailingSlash: 'always'` + `build.format: 'directory'`。

### ✅ 校验

| 项                               | 结果                |
| -------------------------------- | ------------------- |
| `astro build`                    | 20 页，约 1 s       |
| `astro check`                    | 0 error / 0 warning |
| `prettier --check`               | 全部通过            |
| `fonts:check`                    | 字表与内容一致      |
| axe-core（7 页 × 明暗）          | 0 违规              |
| 响应式（320–1920 × 8 档 × 明暗） | 0 处横向溢出        |

### 📦 体积

| 项                      | 大小                      |
| ----------------------- | ------------------------- |
| 首屏 HTML（含内联样式） | 42.7 KB（gzip 11.2 KB）   |
| 文章页 HTML             | 74.2 KB（gzip 17.1 KB）   |
| JS（1 个入口文件）      | 7.9 KB（gzip 3.5 KB）     |
| 字体（4 个子集）        | 458 KB；首屏预加载 234 KB |
| `dist/` 全部            | 36 个文件 / 1.47 MB       |

---

## 📄 许可证

[MIT](./LICENSE) © 2026 [xmore](https://github.com/xmore2025)
