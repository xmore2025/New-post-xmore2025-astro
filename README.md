# Devosfera · Minimal

对 [devosfera.vercel.app](https://devosfera.vercel.app/) 的**零依赖复刻版**：保留它的视觉骨架（居中大标题、终端提示语、网格背景、置顶卡 + 文章列表），去掉 LOFI 电台、终端模拟器、Matrix 雨、音效与彩蛋，改成一套更安静、更适合长文阅读的排版系统。

- 无框架、无构建工具链、无 `npm install`
- 全站 6 类页面 + RSS + Sitemap，产物约 **260 KB**
- 明暗主题、`⌘K` 搜索、阅读进度、代码复制
- 支持 `file://` 直接打开（相对路径）
- 部署目标：**Cloudflare Pages**

---

## 一、本地运行

需要 Node.js 18+。在项目根目录：

```bash
# 一条命令：构建 + 启动
node build.mjs && node server.js

# 或分两步
node build.mjs        # 生成 dist/
node server.js        # 启动静态服务
```

打开 <http://localhost:4321>。换端口：

```bash
PORT=8080 node server.js
```

**没有 Node 也行**，构建一次后用 Python 起服务：

```bash
node build.mjs
cd dist && python -m http.server 4321
```

> 构建只做一件事：把 Markdown 拼成 HTML。产物在 `dist/`，纯静态，任何 Web 服务器都能托管。

---

## 二、目录结构

```
.
├── build.mjs               # 构建：Markdown → dist/
├── server.js               # 本地静态服务器（零依赖）
├── site.config.json        # 站点配置：标题、作者、导航、社交链接
├── wrangler.toml           # Cloudflare Pages 配置（输出目录 dist）
├── content/
│   ├── posts/*.md          # 文章（文件名即 URL slug）
│   └── pages/about.md      # 关于页
├── public/                 # 原样复制到 dist/ 的静态文件
│   ├── _headers            #   Cloudflare 响应头（缓存 / 安全）
│   └── robots.txt
├── src/
│   ├── render.mjs          # 极简 Markdown 渲染器
│   ├── templates.mjs       # 页面模板
│   ├── styles/main.css     # 全部样式
│   └── scripts/app.js      # 全部交互（约 4 KB）
└── dist/                   # 构建产物（已 gitignore）
```

---

## 三、写一篇新文章

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

然后 `node build.mjs`，URL 自动是 `/posts/my-post/`。

- `featured: true` → 出现在首页"置顶"卡片（只取第一篇）
- `draft: true` → 构建时跳过
- 阅读时长按中文 380 字/分钟自动计算
- 标签无需登记，构建时自动汇总并生成 `/tags/<tag>/` 页面

---

## 四、改配置

`site.config.json`：

| 字段 | 说明 |
| --- | --- |
| `title` | 站点名，显示在左上角与页脚 |
| `tagline` | 首页大标题（建议 ≤ 10 个汉字） |
| `description` | 首页副标题 + 全站默认 SEO 描述 |
| `author` | 作者名 |
| `url` | 部署后的正式域名，影响 RSS / Sitemap / OG |
| `social` | GitHub / X / 邮箱 |
| `nav` | 顶部导航项 |

改完重新 `node build.mjs`。

---

## 五、部署到 Cloudflare Pages

### 方式 A：Git 集成（推荐，推代码自动发布）

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选择仓库 `xmore2025/New-post-xmore2025-astro`
3. 构建设置填：

   | 项 | 值 |
   | --- | --- |
   | Framework preset | `None` |
   | Build command | `node build.mjs` |
   | Build output directory | `dist` |
   | 环境变量 | `NODE_VERSION=20`（可选） |

4. **Save and Deploy**。之后每次 `git push` 到 `main` 都会自动构建发布。

### 方式 B：命令行直传

```bash
npx wrangler pages deploy dist --project-name new-post-xmore2025-astro
```

`wrangler.toml` 里已声明 `pages_build_output_dir = "dist"`，所以直接 `npx wrangler pages deploy` 也可以。

### 上线后建议

- 到 **Custom domains** 绑定自己的域名，然后把 `site.config.json` 的 `url` 和 `public/robots.txt` 里的 Sitemap 地址一起改掉
- Cloudflare Pages 会自动把 `/posts/foo/` 映射到 `/posts/foo/index.html`，并把 `404.html` 作为兜底页，无需额外配置

---

## 六、快捷键

| 键 | 行为 |
| --- | --- |
| `⌘K` / `Ctrl K` | 打开搜索 |
| `/` | 打开搜索（不在输入框内时） |
| `↑` `↓` `↵` | 搜索结果导航 |
| `Esc` | 关闭搜索 / 菜单 |

---

## 七、工程约定

- **零运行时依赖**：`package.json` 没有 `dependencies`，构建只用到 Node 内置模块
- **相对路径**：页面内部链接按层级生成 `../`，因此子目录部署与本地 `file://` 都能工作；只有 `404.html` 用绝对路径（它可能出现在任意层级）
- **资源版本号**：`assets/main.css?v=<hash>` 由构建时内容哈希生成，配合 `_headers` 里的 `immutable` 长缓存
- **可访问性**：skip link、语义标签、`aria-current`、`:focus-visible`、`prefers-reduced-motion` 全覆盖

---

## 八、与原站的差异

| | 原站 | 本项目 |
| --- | --- | --- |
| 框架 | Astro 6 + Tailwind + Pagefind | 手写 HTML/CSS/JS |
| 构建依赖 | 数百个 npm 包 | 0 个 |
| 交互 | 终端、电台、音效、Matrix、Konami | 主题、搜索、进度、复制 |
| 字体 | Wotfard / Sriracha / Fira Code（自托管） | 系统字体栈，0 网络请求 |
| 语言 | 英 / 西双语 | 中文 |
| 首屏体积 | 数百 KB | 约 30 KB |

功能取舍的理由见 [OPTIMIZATION.md](./OPTIMIZATION.md)。

---

## 许可证

[MIT](./LICENSE) © 2026 xmore2025
