# xmore · 极简博客

> 一个用 Astro 承载、样式全部手写的极简开发者博客 —— 没有 UI 框架，没有 Tailwind，没有多余的一层。

[![Deploy](https://github.com/xmore2025/New-post-xmore2025-astro/actions/workflows/deploy.yml/badge.svg)](https://github.com/xmore2025/New-post-xmore2025-astro/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-1a5da8)](./LICENSE)
[![Astro](https://img.shields.io/badge/astro-7.4-1a5da8)](https://astro.build)
[![Node](https://img.shields.io/badge/node-%E2%89%A5%2022.23.4-1a5da8)](https://nodejs.org)

**[🌐 在线预览](https://web2046.xmorexz.dpdns.org)** · **[📄 优化说明](./OPTIMIZATION.md)**

![站点预览](./docs/preview.png)

---

## ✨ 特性

|                              |                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| **3 个运行时依赖**           | `astro` · `@astrojs/rss` · `@astrojs/sitemap`；字体与工具链都在 devDependencies                         |
| **零 UI 框架**               | 无 React / Vue / Tailwind，样式是 1 份分层手写 CSS                                                      |
| **自托管字体，只带需要的字** | Noto Sans SC + JetBrains Mono 按内容子集化：**2 个 woff2 / 225 KB**，不再拉 16 片 879 KB                |
| **首屏零阻塞**               | 样式内联进 HTML（约 7 KB gzip），不产生渲染阻塞请求                                                     |
| **排版优先**                 | 4 级字阶 · 15px 正文 / 1.9 行高 · 约 45 汉字行宽 · 发丝分隔线                                           |
| **明暗主题**                 | 跟随系统、可切换、`localStorage` 记忆、首屏无闪烁、地址栏颜色同步                                       |
| **页面切换**                 | 原生 View Transition + Speculation Rules 预渲染，点击近乎瞬时，零运行时                                 |
| **SEO**                      | WebSite / Organization / BlogPosting / BreadcrumbList 结构化数据 · sitemap `lastmod` · OG/Twitter · RSS |
| **可访问**                   | axe-core 全站扫描 **0 违规**（WCAG 2.1 A/AA）· skip link · 焦点管理 · `prefers-reduced-motion`          |
| **代码规范**                 | `astro check` 0 错误 · Prettier 统一风格 · CI 会在构建前跑三项校验                                      |

---

## 🚀 快速开始

需要 **Node.js ≥ 22.23.4**（Astro 7 的要求）。

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
├── site.config.json               # 站点配置：标题 / 作者 / 域名 / 导航 / 社交
├── .prettierrc.mjs                # 代码风格（含 astro 插件）
├── .prettierignore
├── tools/
│   ├── build-fonts.mjs            # 字体子集化：扫描源码 → 产出 woff2 + @font-face
│   └── og-card.html               # 分享图源文件
├── public/
│   ├── fonts/*.woff2              # 子集字体（文件名带内容哈希）
│   ├── _headers                   # 缓存与安全响应头
│   ├── og.png                     # 1200×630 分享图
│   ├── favicon.svg · robots.txt · manifest.webmanifest
├── src/
│   ├── config.ts                  # 读取 site.config.json 并给出类型
│   ├── content.config.ts          # 内容集合 schema（title/date/updated/tags…）
│   ├── content/                   # posts/*.md · pages/about.md
│   ├── layouts/BaseLayout.astro   # <head> / SEO / JSON-LD / 主题脚本 / 预渲染规则
│   ├── components/                # Header · NavLinks · Footer · PostRow · TagList · Icon …
│   ├── lib/
│   │   ├── posts.js               # 取文章 / 标签、阅读时长、日期格式化
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

本项目改为**按内容子集化**：

1. `tools/build-fonts.mjs` 扫描 `src/**` 与 `site.config.json`，收集真正会被渲染的字符；
2. 用 `subset-font`（HarfBuzz）把可变字体裁成 1 个 woff2：字重轴收到 `400–650`（站点实际只用 400–620），并去掉 OpenType 排版特性与 hinting——同样字形，体积再减 21%；
3. 文件名带内容哈希 → 可以 `immutable` 长缓存；
4. `npm run fonts:check` 在 CI 中校验「内容字符 ⊆ 子集」，忘记重建会直接失败。

| 方案                | 请求数 | 传输量       |
| ------------------- | ------ | ------------ |
| fontsource 全量分片 | 16     | ≈ 879 KB     |
| 内容子集（本项目）  | **2**  | **≈ 225 KB** |

写新文章后如果出现子集外的生僻字，浏览器会自动回退到系统字体（不会豆腐块）；跑一次 `npm run fonts` 即可把新字并入子集。

> 试过 `rel="preload"` 预加载字体：在有系统中文字体的浏览器里，Chrome 会因预加载而延长字体阻塞期，FCP 反而从 590 ms 涨到 1050 ms，因此**没有采用**。字体体积本身才是关键变量。

---

## 🎨 设计系统

所有视觉决策都收敛在 `src/styles/tokens.css`。

### 字阶（舒展版）

| 变量                   | 值                       | 用途                     |
| ---------------------- | ------------------------ | ------------------------ |
| `--fs-lg`              | 15px                     | 正文（行高 1.9）         |
| `--fs-xl`              | 16px（宽屏 17px）        | 列表标题                 |
| `--fs-2xl`             | 18–21px                  | 卡片标题                 |
| `--fs-3xl`             | 22–29px                  | 页面标题                 |
| `--fs-4xl`             | 26–36px                  | 文章标题                 |
| `--fs-hero`            | 31–50px                  | 首页大标题               |
| `--fs-2xs` … `--fs-md` | 10 / 11 / 12 / 13 / 14px | 元信息、标签、导航、导语 |

字号全部用 `rem`，想整体再小一档只改一行：

```css
html {
  font-size: 93.75%; /* 15px 基准，全站等比缩小 6.25% */
}
```

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
| 字体           | 16 个 / 879 KB | **2 个 / 226 KB** | −74%           |
| CLS            | 0.0003         | 0.0004            | 基本持平（≈0） |

做法：

- **样式内联**：`build.inlineStylesheets: 'always'`，HTML 到达即可绘制，首屏没有阻塞 CSS 请求；
- **字体子集 + `font-display: swap` + 内容哈希缓存**；
- **正文样式按需**：`prose.css` 只在文章 / 关于页引入，其余页面不下载；
- **长列表 `content-visibility: auto`**；滚动统一 `requestAnimationFrame`；
- **搜索索引空闲预取**，首屏不承担搜索成本；
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

| 字段                                                | 说明                                       |
| --------------------------------------------------- | ------------------------------------------ |
| `title` / `titleSuffix` / `tagline` / `description` | 站点名、标题后缀、首页大标题、默认描述     |
| `author`                                            | 作者名                                     |
| `url`                                               | 正式域名（canonical / OG / RSS / Sitemap） |
| `social`                                            | GitHub / X / 邮箱，留空则不渲染            |
| `nav`                                               | 顶部导航项                                 |

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
| `astro build`                    | 20 页，约 1–2 s     |
| `astro check`                    | 0 error / 0 warning |
| `prettier --check`               | 全部通过            |
| axe-core（7 页 × 明暗）          | 0 违规              |
| 响应式（320–1920 × 8 档 × 明暗） | 0 处横向溢出        |

### 📦 体积

| 项                      | 大小                    |
| ----------------------- | ----------------------- |
| 首屏 HTML（含内联样式） | 42.3 KB（gzip 11.2 KB） |
| 文章页 HTML             | 57.6 KB（gzip 15.0 KB） |
| JS（1 个文件）          | 8.6 KB（gzip 3.4 KB）   |
| 字体（2 个 woff2）      | 225 KB                  |
| `dist/` 全部            | 32 个文件 / 1.3 MB      |

---

## 📄 许可证

[MIT](./LICENSE) © 2026 [xmore](https://github.com/xmore2025)
