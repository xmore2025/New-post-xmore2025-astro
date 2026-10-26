---
title: 关于
---

这里记录三件事：**前端工程的细节**、**软件架构的判断**，以及那些想清楚了才敢写下来的观点。更新不规律，但每一篇都尽量做到可以直接拿去用。

## 我在做什么

- 维护几个小型的开源工具，偏好依赖精简、可读性优先的实现
- 研究 AI Agent 在真实工程流程里的边界——它在哪里真的有用，在哪里只是噪音
- 持续重构自己的写作系统，试图让"想清楚"这件事变便宜

## 这个站点

用 Astro 构建，样式手写、不引入 UI 框架，把复杂度留在排版本身：

- 内容：`src/content/posts/*.md`，content collections + Zod 校验
- 页面：`src/pages` 文件路由，`src/layouts` 与 `src/components` 复用骨架
- 样式：`src/styles/main.css`，单一强调色 + 发丝分隔线 + 8pt 间距刻度
- 交互：主题切换、`⌘K` 搜索、阅读进度、代码复制
- 输出：纯静态 HTML，`@astrojs/sitemap` 与 RSS 一并生成

源码在 [GitHub](https://github.com/xmore2025/New-post-xmore2025-astro)，可以直接拿去改。

## 联系方式

- GitHub：[xmore](https://github.com/xmore2025)

如果你也在折腾自己的站点，欢迎来聊。我尤其想知道：**你删掉了哪些东西，然后页面变好了。**
