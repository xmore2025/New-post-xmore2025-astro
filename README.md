# xmore · 极简博客

> 一个零依赖的极简开发者博客 —— 手写 HTML / CSS / JS，没有任何框架与构建负担。

[![Deploy](https://github.com/xmore2025/New-post-xmore2025-astro/actions/workflows/deploy.yml/badge.svg)](https://github.com/xmore2025/New-post-xmore2025-astro/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-1a5da8)](./LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-0-1a5da8)](./package.json)
[![Node](https://img.shields.io/badge/node-%E2%89%A5%2018-1a5da8)](https://nodejs.org)

**[🌐 在线预览](https://web2046.xmorexz.dpdns.org)** · **[📄 优化说明](./OPTIMIZATION.md)**

![站点预览](./docs/preview.png)

---

## ✨ 特性

| | |
| --- | --- |
| **零依赖** | `package.json` 没有 `dependencies`，构建只用 Node 内置模块 |
| **零框架** | 无 React / Vue / Astro / Tailwind，只有 3 个手写文件 |
| **排版优先** | 单强调色 · 发丝分隔线 · 8pt 间距刻度 · `clamp()` 流式字号 |
| **完整 SEO** | canonical · OG / Twitter Card · Sitemap · RSS |
| **明暗主题** | 跟随系统，可手动切换，`localStorage` 记忆 |
| **站内搜索** | `⌘K` 唤起，纯前端，数据内联，无网络请求 |
| **可访问** | skip link · 语义标签 · `aria-current` · `:focus-visible` · 尊重 `prefers-reduced-motion` |
| **随处可跑** | 相对路径，`file://` 直接打开也能看 |

---

## 🚀 快速开始

需要 Node.js 18 以上，**不需要 `npm install`**。

```bash
node build.mjs && node server.js      # 构建 + 启动
```

打开 <http://localhost:4321>。换端口：

```bash
PORT=8080 node server.js
```

<details>
<summary>没有 Node 时的替代方案</summary>

```bash
node build.mjs                       # 构建仍需 Node（仅一次）
cd dist && python -m http.server 4321
```

</details>

---

## 📁 目录结构

```text
.
├── .github/workflows/deploy.yml   # push 即构建并部署到 Cloudflare Pages
├── build.mjs                      # 构建：Markdown → dist/
├── server.js                      # 本地静态服务器（零依赖）
├── site.config.json               # 站点配置：标题 / 作者 / 域名 / 导航 / 社交
├── wrangler.toml                  # Cloudflare Pages 配置
├── content/
│   ├── posts/*.md                 # 文章（文件名即 URL slug）
│   └── pages/about.md             # 关于页
├── public/                        # 原样复制进 dist/
│   ├── _headers                   #   Cloudflare 响应头（缓存 / 安全）
│   ├── og.png                     #   1200×630 分享图
│   └── robots.txt
├── src/
│   ├── render.mjs                 # 极简 Markdown 渲染器（含表格）
│   ├── templates.mjs              # 页面模板
│   ├── styles/main.css            # 全部样式
│   └── scripts/app.js             # 全部交互（≈4 KB）
├── tools/og-card.html             # 分享图源文件
└── dist/                          # 构建产物（已 gitignore）
```

---

## ✍️ 写一篇新文章

在 `content/posts/` 新建 `my-post.md`：

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

运行 `node build.mjs`，URL 自动是 `/posts/my-post/`。

| 字段 | 作用 |
| --- | --- |
| `featured: true` | 进入首页「置顶」卡片（只取第一篇） |
| `draft: true` | 构建时跳过 |
| `tags` | 无需登记，自动汇总并生成 `/tags/<tag>/` 页面 |

阅读时长按中文 380 字/分钟自动计算。

---

## ⚙️ 站点配置

编辑 `site.config.json`，改完重新 `node build.mjs`。

| 字段 | 说明 |
| --- | --- |
| `title` | 站点名，显示在左上角与页脚 |
| `tagline` | 首页大标题（建议 ≤ 10 个汉字） |
| `description` | 首页副标题 + 默认 SEO 描述 |
| `author` | 作者名 |
| `url` | 正式域名，影响 canonical / OG / RSS / Sitemap |
| `social` | GitHub / X / 邮箱，留空则不渲染 |
| `nav` | 顶部导航项 |

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

推送到 `main` → Actions 构建 → 部署到 Pages。所需 Secret 已配置：

| Secret | 说明 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Pages:Edit 权限的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | 见上表 |

### 手动发布

```bash
node build.mjs
npx wrangler pages deploy dist --project-name new-post-xmore2025-astro --branch main
```

### 换域名时记得改两处

1. `site.config.json` → `url`
2. `public/robots.txt` → `Sitemap` 地址

然后重新构建发布，否则 canonical / OG / Sitemap 会指向旧域名。

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

- **零运行时依赖**：构建只用 `node:fs` / `node:path` / `node:crypto`
- **相对路径**：内部链接按层级生成 `../`，因此子目录部署与 `file://` 都能工作；只有 `404.html` 用绝对路径（它可能出现在任意层级）
- **资源版本号**：`assets/main.css?v=<sha1:8>` 由内容哈希生成，配合 `_headers` 的 `immutable` 长缓存
- **SEO 完整**：每页独立 `canonical`、`og:url`、`og:type`（文章页为 `article`）、`og:image`

### 📦 体积

| 项 | 大小 |
| --- | --- |
| `dist/` 全部（27 个文件） | ≈ 270 KB |
| 首屏 HTML | ≈ 12 KB |
| `main.css` | ≈ 18 KB |
| `app.js` | ≈ 4 KB |
| 字体 / 图片请求 | 0 |

---

## 🔍 与原站的差异

| | [原站](https://devosfera.vercel.app/) | 本项目 |
| --- | --- | --- |
| 框架 | Astro 6 + Tailwind + Pagefind | 手写 HTML / CSS / JS |
| 构建依赖 | 数百个 npm 包 | **0** |
| 交互 | 终端、电台、音效、Matrix、Konami | 主题、搜索、进度、复制 |
| 字体 | 自托管 3 款 | 系统字体栈，0 请求 |
| 语言 | 英 / 西双语 | 中文 |
| 首屏体积 | 数百 KB | ≈ 30 KB |

取舍理由见 [OPTIMIZATION.md](./OPTIMIZATION.md)。

---

## 📄 许可证

[MIT](./LICENSE) © 2026 [xmore](https://github.com/xmore2025)
