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

|                              |                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| **3 个运行时依赖**           | `astro` · `@astrojs/rss` · `@astrojs/sitemap`；字体与工具链都在 devDependencies                         |
| **零 UI 框架**               | 无 React / Vue / Tailwind，样式是 1 份分层手写 CSS                                                      |
| **自托管字体，只带需要的字** | 霞鹜文楷（400 正文 / 600 标题）+ Inter + 等宽按内容子集化；首屏只预加载正文与等宽 2 个（约 243 KB）     |
| **首屏零阻塞**               | 样式内联进 HTML（约 7 KB gzip），不产生渲染阻塞请求                                                     |
| **排版优先**                 | 最小 12px · 6 级字阶 · 17px 楷体正文 / 1.75 行高 · 约 37 汉字行宽 · 发丝分隔线                          |
| **排印实验室**               | `/typography/`：5 套完整方案 + 可编辑样张（改一处全卡同步）+ 5 条硬规则实时校验 + 一键生成 CSS          |
| **明暗主题**                 | 跟随系统、可切换、`localStorage` 记忆、首屏无闪烁、地址栏颜色同步                                       |
| **页面切换**                 | 原生 View Transition + Speculation Rules 预渲染，点击近乎瞬时，零运行时                                 |
| **SEO**                      | WebSite / Organization / BlogPosting / BreadcrumbList 结构化数据 · sitemap `lastmod` · OG/Twitter · RSS |
| **可访问**                   | axe-core 全站扫描 **0 违规**（WCAG 2.1 A/AA）· skip link · 焦点管理 · `prefers-reduced-motion`          |

---

## 🚀 快速开始

需要 **Node.js ≥ 24**（Astro 7 的要求）。

```bash
npm install
npm run dev          # 开发服务器 http://localhost:4321
npm run build        # 构建到 dist/（21 个页面，约 1–2 秒）

npm run check        # TypeScript / Astro 类型检查
npm run format       # Prettier 格式化
npm run fonts        # 内容更新后重建字体子集（首次运行会下载约 70 MB 源字体）
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
│   │                              # TypeSample（可编辑样张）· TypeSpecimen（样张卡）
│   ├── lib/
│   │   ├── posts.js               # 取文章 / 标签、阅读时长、日期格式化
│   │   ├── fonts.ts               # 解析生成的 @font-face，产出首屏 preload 列表
│   │   ├── specimens.ts           # 五套排印方案的参数与共享示例文字
│   │   └── types.ts               # PostSummary / TagRef 共享类型
│   ├── pages/
│   │   ├── index.astro            # 首页
│   │   ├── typography.astro       # 排印实验室（5 套方案 / 可编辑样张 / 实时校验）
│   │   ├── posts/index.astro      # 归档
│   │   ├── posts/[...slug].astro  # 文章（BlogPosting + BreadcrumbList）
│   │   ├── categories/index.astro # 分类（Bento 网格）
│   │   ├── tags/ · about · 404
│   │   ├── rss.xml.ts · search.json.ts
│   ├── scripts/                   # 交互（Vite 合并为 1 个文件）
│   │   ├── app.js                 #   入口
│   │   └── modules/               #   dom / theme / nav / search / article / ui / specimen
│   └── styles/
│       ├── main.css               #   入口（@import 顺序）
│       ├── font-face.css          #   生成的 @font-face（勿手改）
│       ├── tokens.css             #   设计令牌（颜色 / 字阶 / 间距 / 动效）
│       ├── base.css · layout.css · components.css · prose.css
│       ├── typography.css         #   排印实验室（仅该页加载）
└── dist/                          # 构建产物（gitignore）
```

---

## 🔤 字体策略

中文 Web 字体的体积是这类站点最大的性能变量。`@fontsource` 的按频率分片在**内容很少**的站点上反而浪费：一篇文章仍会触发 16 个分片、约 879 KB。本项目改为**按内容子集化**：`tools/build-fonts.mjs` 扫描 `src/**` 与 `site.config.json` 收集真正会被渲染的字符，用 `subset-font`（HarfBuzz）裁出子集，文件名带内容哈希以便 `immutable` 长缓存；`npm run fonts:check` 在 CI 中校验「内容字符 ⊆ 子集」，忘记重建会直接失败。

**主字体是霞鹜文楷（标准版）**，中文与拉丁都由它渲染 —— 文楷自带拉丁字形，正文英文不需要额外字体。三个取舍值得记下来：

- **标准版而非 Screen 版**：Screen 版笔画细、适合高 DPI，但 Windows 的 DirectWrite 渲染 17px 时明显发虚，这是换回标准版的原因。
- **两个字重**：Regular（400，正文）+ Medium（谎报为 600，标题 / strong）。让 `font-weight: 600` 命中真实字形，而不是浏览器描边合成的假粗 —— 中文合成粗体会糊、字距不均；`body` 上另有 `font-synthesis-weight: none` 兜底。
- **保留 hinting 与 `kern/liga/calt`**：Windows 渲染小字号中文靠 hinting 做网格对齐，剥掉笔画就发灰。

**回退顺序是刻意排的**：`LXGW WenKai → Inter Variable → 系统楷体 → 黑体系`。Inter 不含 CJK，中文字符会自动跳过它、只兜拉丁缺字；系统楷体（`Kaiti SC` / `KaiTi` …）接力，保证子集外的生僻字仍是楷体，不会在一行里跳成黑体；黑体系只作"系统连楷体都没有"时的极端兜底。

等宽字体默认 JetBrains Mono（npm 依赖，开箱可用）。想换成 **Maple Mono CN**：从 [maple-font releases](https://github.com/subframe7536/maple-font/releases/latest) 下载 `MapleMono-CN.zip`，解压出 `MapleMono-CN-Regular.ttf` 放到 `tools/.cache/` 再跑 `npm run fonts`（上游只发 140 MB 的 zip，没有单文件直链，故不做自动下载）。

首屏只预加载正文与等宽两个子集（约 243 KB），字体栈里其余字体仅作缺字兜底、正常访问不下载。新增文章后跑一次 `npm run fonts` 把新字并入子集即可。

首页与文章分享图的源文件是 `tools/og-card.html`，生成后的 `public/og-card-v2.png` 由 `site.config.json` 的 `ogImage` 引用。

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
| `--fs-base`    | 17px    | 正文、列表标题               |
| `--fs-lg`      | 19px    | 重点卡片、正文二级标题       |
| `--fs-title`   | 24–36px | 内页标题                     |
| `--fs-display` | 32–50px | 首页主标题                   |

字号使用 `rem` 与响应式 `clamp()`；最小档 12px 用 `max(0.75rem, 12px)` 兜底 —— 用户把浏览器默认字号调小时也不会塌到 12px 以下。正文行高 1.75，行内代码继承正文尺寸但不低于 12px。`--fs-base` 取 17px 而非 16px，是因为楷体中宫小、字面比黑体小，17px 楷体的视觉大小约等于 16px 黑体。

行宽分三档：基础 40rem（640px ≈ 37 字），`≥1280px` 放宽到 41rem（38.6 字），`≥1440px` 到 42.5rem（680px ≈ 40 字）并同步放大目录与栏间距。上限刻意卡在 40 字 —— 再宽就要用头跟着字转，多出来的空间留给留白而不是拉长行；窄于 640px 时 max-width 不生效，宽度由 `--gutter` 接管，手机端无需额外适配。

### 排印实验室（`/typography/`）

把"排版参数"从口头建议变成可验证的对照表。五项硬规则写在两处：`src/lib/specimens.ts` 负责渲染，`src/scripts/modules/specimen.js` 负责校验，任何一项越界都会在页面上标红。

| 参数 | 区间       | 为什么是它                                                                                  |
| ---- | ---------- | ------------------------------------------------------------------------------------------- |
| 字号 | 10.5–13 pt | 区间上限按楷体留了 1pt 补偿：屏幕端 17px 楷体 = 12.75pt，视觉大小约等于 Word 里的 11pt 楷体 |
| 行距 | 1.5–1.75   | 中文 1.6 起步；楷体笔画细，1.75 才不散、1.5 以下会闷                                        |
| 行宽 | 30–40 字   | 眼睛从行尾折返行首不会丢行的距离                                                            |
| 段距 | 0.5–1 行   | 太小段落粘连，太大文章被切成碎片                                                            |
| 字体 | ≤ 3 种     | 正文 / 标题 / 等宽，三种已足够表达全部层级                                                  |

五张样张（经典正式 / 现代商务 / 人文阅读 / 演示大屏 / 技术文档）都是真实渲染的 DOM，不是截图。正文 `contenteditable`，改一处按 `data-sync` 键广播到全部卡片并写进 `localStorage`；点「套用到试验台」把该方案的参数搬进滑杆，反过来拖滑杆也能看样张怎么变。

两处刻意的实现选择：

- **行宽读数取实测**（纸面宽度 ÷ 字号），不是滑杆的声明值。纸面装不下 34em 时它会被压成 32 字，读数必须跟着变；窄屏（< 900px）例外，按声明值报 —— 手机上的纸面本来就只有 300px，量出来必然"不合规"，那是屏幕的错。
- **样张纸面宽度 = 字数 × 字号 + 内边距**，边界即行宽边界。行宽因此是看得见的，右边不会留一截说不清来历的空白。

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
| 字体           | 16 个 / 879 KB | **2 个 / 243 KB** | −72%           |
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
| `astro build`                    | 21 页，约 1 s       |
| `astro check`                    | 0 error / 0 warning |
| `prettier --check`               | 全部通过            |
| `fonts:check`                    | 字表与内容一致      |
| axe-core（7 页 × 明暗）          | 0 违规              |
| 响应式（320–1920 × 8 档 × 明暗） | 0 处横向溢出        |

### 📦 体积

| 项                      | 大小                                      |
| ----------------------- | ----------------------------------------- |
| 首屏 HTML（含内联样式） | 43.1 KB（gzip 11.3 KB）                   |
| 文章页 HTML             | 66.6 KB（gzip 17.1 KB）                   |
| 排印页 HTML             | 85.5 KB（gzip 17.9 KB）                   |
| JS（入口 + 搜索）       | 11.4 KB（gzip 5.2 KB）；排印页另加 5.6 KB |
| 字体（5 个子集）        | 710 KB；首屏预加载 243 KB                 |
| `dist/` 全部            | 40 个文件 / 1.81 MB                       |

---

## 📄 许可证

[MIT](./LICENSE) © 2026 [xmore](https://github.com/xmore2025)
