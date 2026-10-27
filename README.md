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

| | |
| --- | --- |
| **3 个依赖** | `astro` · `@astrojs/rss` · `@astrojs/sitemap`，仅此而已 |
| **零 UI 框架** | 无 React / Vue / Tailwind，样式是 1 份手写 CSS |
| **排版优先** | 单强调色 · 发丝分隔线 · 8pt 间距刻度 · `clamp()` 流式字号 |
| **响应式宽屏** | 桌面内容区最大 1440px、文章正文最大 860px，移动端自动收束 |
| **内容集合** | Markdown + Zod schema 校验，字段写错构建就失败 |
| **完整 SEO** | canonical · OG / Twitter Card · Sitemap · RSS · 语义化 `og:type` |
| **明暗主题** | 跟随系统，可手动切换，`localStorage` 记忆，首屏无闪烁 |
| **站内搜索** | `⌘K` 唤起，按需拉取 `/search.json`，不阻塞首屏 |
| **可访问** | skip link · 语义标签 · `aria-current` · `:focus-visible` · 尊重 `prefers-reduced-motion` |
| **纯静态输出** | `astro build` 产出 19 个页面，无服务端运行时 |

---

## 🚀 快速开始

需要 **Node.js ≥ 22.23.4**（Astro 7 的要求）。

```bash
npm install
npm run dev        # 开发服务器 http://localhost:4321
npm run build      # 构建到 dist/
npm run preview    # 本地预览构建产物
```

---

## 📁 目录结构

```text
.
├── astro.config.mjs               # site / trailingSlash / sitemap / Shiki 双主题
├── site.config.json               # 站点配置：标题 / 作者 / 域名 / 导航 / 社交
├── tsconfig.json
├── wrangler.toml                  # Cloudflare Pages 配置
├── .github/workflows/deploy.yml   # push 即构建并部署到 Cloudflare Pages
├── public/                        # 原样复制进 dist/
│   ├── _headers                   #   Cloudflare 响应头（缓存 / 安全）
│   ├── favicon.svg
│   ├── og.png                     #   1200×630 分享图
│   └── robots.txt
├── src/
│   ├── config.ts                  # 读取 site.config.json 并给出类型
│   ├── content.config.ts          # 内容集合定义（posts / pages）
│   ├── content/
│   │   ├── posts/*.md             # 文章（文件名即 URL slug）
│   │   └── pages/about.md         # 关于页
│   ├── layouts/
│   │   └── BaseLayout.astro       # <head> / SEO / 主题脚本 / 全局骨架
│   ├── components/
│   │   ├── Icon.astro             # 图标注册表（10 个线性图标）
│   │   ├── Header.astro           # 品牌 / 导航 / 搜索 / 主题 / 移动菜单
│   │   ├── Footer.astro
│   │   ├── SearchModal.astro
│   │   ├── PostRow.astro          # 列表行（stretched link）
│   │   ├── SectionHead.astro
│   │   └── TagList.astro
│   ├── lib/posts.js               # 取文章 / 标签、阅读时长、日期格式化
│   ├── pages/
│   │   ├── index.astro            # 首页：hero + 置顶 + 最新
│   │   ├── posts/index.astro      # 归档（按年分组）
│   │   ├── posts/[...slug].astro  # 文章详情
│   │   ├── tags/index.astro       # 标签云
│   │   ├── tags/[tag].astro       # 标签详情
│   │   ├── about.astro
│   │   ├── 404.astro
│   │   ├── rss.xml.ts
│   │   └── search.json.ts         # 搜索索引端点
│   ├── scripts/app.js             # 全部交互（≈5 KB）
│   └── styles/main.css            # 全部样式
├── tools/og-card.html             # 分享图源文件
└── dist/                          # 构建产物（已 gitignore）
```

---

## ✍️ 写一篇新文章

在 `src/content/posts/` 新建 `my-post.md`：

```markdown
---
title: 文章标题
description: 一句话摘要，会出现在列表与 SEO 描述里
date: 2026-10-01
tags: [design, css]
featured: false
---

正文从这里开始，支持标题、列表、引用、代码块、表格、链接。
```

保存后开发服务器自动热更新，URL 是 `/posts/my-post/`。

| 字段 | 类型 | 作用 |
| --- | --- | --- |
| `title` | `string` | 必填，文章标题 |
| `description` | `string` | 必填，列表摘要 + 默认 SEO 描述 |
| `date` | `date` | 必填，`YYYY-MM-DD`，自动转成 `Date` |
| `tags` | `string[]` | 默认 `[]`，无需登记，自动汇总并生成 `/tags/<tag>/` |
| `featured` | `boolean` | 默认 `false`，`true` 时进首页「置顶」卡片（只取第一篇） |
| `draft` | `boolean` | 默认 `false`，`true` 时构建跳过 |

字段写错（比如漏了 `description`）构建会直接报错，而不是悄悄生成一个空描述。

阅读时长按中文 380 字/分钟自动计算。

---

## ⚙️ 站点配置

`site.config.json` 是唯一的事实来源，改完重新构建即可。Astro 构建配置会直接读取其中的 `url`，无需再单独维护域名：

| 字段 | 说明 |
| --- | --- |
| `title` | 站点名，显示在左上角与页脚 |
| `titleSuffix` | 页面标题后缀，`<title>` 形如 `文章标题 · xmore` |
| `tagline` | 首页大标题（建议 ≤ 10 个汉字） |
| `description` | 首页副标题 + 默认 SEO 描述 |
| `author` | 作者名 |
| `url` | 正式域名，影响 canonical / OG / RSS / Sitemap |
| `social` | GitHub / X / 邮箱，留空则不渲染 |
| `nav` | 顶部导航项 |

`url` 会同时用于页面 canonical / OG、RSS、Sitemap 与 Astro 构建元数据，避免多处配置不一致。

---

## ☁️ 部署

**线上地址：<https://web2046.xmorexz.dpdns.org>**

| 项 | 值 |
| --- | --- |
| 托管 | Cloudflare Pages（Direct Upload） |
| Pages 项目 | `new-post-xmore2025-astro` |
| Account ID | `136ac8b333f04b6782da3395ed4110ad` |
| 自定义域名 | `web2046.xmorexz.dpdns.org` |
| 生产分支 | `main` |
| 自动部署 | GitHub Actions（`.github/workflows/deploy.yml`） |

### 自动发布（当前方式）

推送到 `main` → Actions 执行 `npm ci && npm run build` → `wrangler pages deploy dist`。所需 Secret 已配置：

| Secret | 说明 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Pages:Edit 权限的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | 见上表 |

### 手动发布

```bash
npm run build
npx wrangler pages deploy dist --project-name new-post-xmore2025-astro --branch main
```

### 换域名时记得改两处

1. `site.config.json` → `url`
2. `public/robots.txt` → `Sitemap` 地址

修改后重新构建发布；同时确认 `robots.txt` 中的 Sitemap 地址与新域名一致。

---

## ⌨️ 快捷键

| 键 | 行为 |
| --- | --- |
| `⌘K` / `Ctrl K` | 打开搜索 |
| `/` | 打开搜索（不在输入框内时） |
| `↑` `↓` `↵` | 搜索结果导航 |
| `Esc` | 关闭搜索 / 菜单 |

---

## 🧱 工程约定

- **样式只有一份**：`src/styles/main.css`，用 CSS 变量分层（色板 / 间距 / 字体 / 缓动），改主题只动 `:root` 与 `[data-theme="dark"]`
- **不引 UI 框架**：组件都是 `.astro`，产出零客户端 JS，除非它真的需要交互
- **交互集中在一个文件**：`src/scripts/app.js` 负责主题、搜索、菜单、阅读进度、代码复制，以渐进增强方式挂载
- **URL 稳定**：`trailingSlash: 'always'` + `build.format: 'directory'`，所有页面都以 `/` 结尾
- **代码高亮**：Shiki 双主题（`github-light` / `github-dark`），`defaultColor: false`，颜色由 CSS 变量按主题切换
- **资源长缓存**：产物文件名带内容哈希，`_headers` 对 `/_astro/*` 下发 `immutable`

### 📦 体积

| 项 | 大小 |
| --- | --- |
| `dist/` 全部（29 个文件） | ≈ 392 KB（含 108 KB 分享图） |
| 首屏 HTML | ≈ 10.6 KB |
| `main.css` | ≈ 20.2 KB |
| `app.js` | ≈ 5.1 KB |
| 字体请求 | 0（系统字体栈） |

---

## 🔍 与原站的差异

| | [原站](https://devosfera.vercel.app/) | 本项目 |
| --- | --- | --- |
| 框架 | Astro 6 + Tailwind + Pagefind | Astro 7 + 手写 CSS |
| 依赖包 | 数百个 | **3 个** |
| 装饰层 | 网格、光标光晕、噪点、电台、终端模拟器 | 一层静态网格背景 |
| 交互 | 终端、电台、音效、Matrix、Konami 码 | 主题、搜索、进度、复制 |
| 字体 | 自托管 3 款 | 系统字体栈，0 请求 |
| 语言 | 英 / 西双语 | 中文 |
| 首屏体积 | 数百 KB | ≈ 36 KB |

取舍理由见 [OPTIMIZATION.md](./OPTIMIZATION.md)。

---

## 📄 许可证

[MIT](./LICENSE) © 2026 [xmore](https://github.com/xmore2025)
