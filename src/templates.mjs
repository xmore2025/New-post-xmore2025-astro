/** 页面模板（纯字符串，零依赖） */

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const baseOf = (depth) => (depth === 0 ? './' : '../'.repeat(depth));
const link = (depth, p) => baseOf(depth) + String(p).replace(/^\//, '');

const ICONS = {
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.2A8.6 8.6 0 1 1 9.8 3.5a6.7 6.7 0 0 0 10.7 10.7z"/></svg>',
  arrowRight:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12h14M13 6.5l5.5 5.5L13 17.5"/></svg>',
  arrowUpRight:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8.5 7H17v8.5"/></svg>',
  rss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4.5 11.5a8 8 0 0 1 8 8M4.5 4.5a15 15 0 0 1 15 15"/><circle cx="5.2" cy="18.8" r="1.5" fill="currentColor" stroke="none"/></svg>',
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a2.5 2.5 0 0 0-2.5 2.5v6.5A2.5 2.5 0 0 0 6 14.5"/></svg>',
  mark:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2.8 21 12l-9 9.2L3 12l9-9.2Z"/><path d="M12 2.8V21.2"/></svg>',
};

export const icon = (name, cls = '') =>
  `<span class="ico ${cls}" aria-hidden="true">${ICONS[name] || ''}</span>`;

/* ------------------------------------------------------------------ */
/* 布局                                                                */
/* ------------------------------------------------------------------ */

export function layout({
  site,
  depth = 0,
  active = '',
  title = '',
  description = '',
  bodyClass = '',
  head = '',
  content = '',
  searchData = [],
  absoluteBase = false,
  assetVersion = '',
  path = '',
}) {
  const b = absoluteBase ? '/' : baseOf(depth);
  const v = assetVersion ? `?v=${assetVersion}` : '';
  const canonical = path ? `${site.url}${path}` : '';
  const ogType = /^\/posts\/[^/]+\/$/.test(path) ? 'article' : 'website';
  const pageTitle = title ? `${title} · ${site.titleSuffix}` : `${site.title} — ${site.tagline}`;
  const desc = description || site.description;
  const navItems = site.nav
    .map((item) => {
      const isActive = item.href.includes(active) && active;
      return `<a href="${b}${item.href.replace(/^\//, '')}"${isActive ? ' aria-current="page"' : ''}>${esc(item.label)}</a>`;
    })
    .join('');

  const json = JSON.stringify(searchData).replace(/</g, '\\u003c');

  // 只渲染已配置的社交链接，避免出现空占位
  const social = site.social || {};
  const socialLinks = [
    social.github
      ? `<a href="${esc(social.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>`
      : '',
    social.x
      ? `<a href="${esc(social.x)}" target="_blank" rel="noopener noreferrer">X</a>`
      : '',
    social.email ? `<a href="mailto:${esc(social.email)}">邮箱</a>` : '',
  ]
    .filter(Boolean)
    .join('\n      ');

  return `<!DOCTYPE html>
<html lang="${esc(site.lang)}" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>(function(){try{var t=localStorage.getItem('theme');if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="${esc(site.author)}">
<meta name="theme-color" content="#fbfaf8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0b0d" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:site_name" content="${esc(site.title)}">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
<meta property="og:image" content="${esc(site.url)}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="zh_CN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(pageTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(site.url)}/og.png">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<link rel="alternate" type="application/rss+xml" title="${esc(site.title)}" href="${b}rss.xml">
<link rel="icon" href="${b}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${b}assets/main.css${v}">
${head}
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">跳到正文</a>
<div class="backdrop" aria-hidden="true"><div class="backdrop-grid"></div></div>

<header class="site-header" id="site-header">
  <div class="shell header-inner">
    <a class="brand" href="${b}" aria-label="${esc(site.title)} 首页">
      <span class="brand-mark">${icon('mark')}</span>
      <span class="brand-text">${esc(site.title)}</span>
      <span class="brand-sub">笔记</span>
    </a>

    <nav class="nav nav--desktop" aria-label="主导航">${navItems}</nav>

    <div class="header-actions">
      <button class="icon-btn search-trigger" type="button" aria-label="搜索文章" data-search-open>
        ${icon('search')}<kbd>⌘K</kbd>
      </button>
      <button class="icon-btn theme-btn" type="button" aria-label="切换明暗主题" data-theme-toggle>
        <span class="theme-icon theme-icon--light">${icon('sun')}</span>
        <span class="theme-icon theme-icon--dark">${icon('moon')}</span>
      </button>
      <button class="icon-btn menu-btn" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="mobile-nav" data-menu-toggle>
        <span class="menu-icon menu-icon--open">${icon('menu')}</span>
        <span class="menu-icon menu-icon--close">${icon('close')}</span>
      </button>
    </div>
  </div>
  <div class="mobile-nav" id="mobile-nav" hidden>
    <div class="shell">${navItems}</div>
  </div>
</header>

<main id="main">
${content}
</main>

<footer class="site-footer">
  <div class="shell footer-inner">
    <p class="footer-copy">© ${new Date().getFullYear()} ${esc(site.title)} · 手写 HTML / CSS，没有构建负担</p>
    <div class="footer-links">
      <a href="${b}rss.xml">RSS</a>
      ${socialLinks}
      <a href="#top">回到顶部</a>
    </div>
  </div>
</footer>

<div class="search-modal" id="search-modal" hidden>
  <div class="search-panel" role="dialog" aria-modal="true" aria-label="搜索文章">
    <div class="search-bar">
      ${icon('search', 'search-bar-ico')}
      <input class="search-input" type="search" placeholder="搜索标题、摘要或标签…" autocomplete="off" spellcheck="false" data-search-input>
      <kbd class="search-esc">ESC</kbd>
    </div>
    <ul class="search-results" data-search-results></ul>
    <div class="search-hint">↑ ↓ 选择 · ↵ 打开 · ESC 关闭</div>
  </div>
</div>

<script type="application/json" id="search-data">${json}</script>
<script src="${b}assets/app.js${v}" defer></script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* 小组件                                                              */
/* ------------------------------------------------------------------ */

const fmtDate = (iso) => String(iso).slice(0, 10).replace(/-/g, '.');

const tagLinks = (depth, tags) =>
  `<ul class="tags">${tags
    .map((t) => `<li><a class="tag" href="${link(depth, `tags/${t.slug}/`)}">${esc(t.name)}</a></li>`)
    .join('')}</ul>`;

function postRow(depth, post, { withDesc = false, withTags = false } = {}) {
  return `<li class="post-row${withDesc ? ' post-row--full' : ''}">
  <time class="post-date" datetime="${esc(post.date)}">${fmtDate(post.date)}</time>
  <div class="post-main">
    <h3 class="post-title"><a class="post-link" href="${link(depth, `posts/${post.slug}/`)}">${esc(post.title)}</a></h3>
    ${withDesc ? `<p class="post-desc">${esc(post.description)}</p>` : ''}
    ${withTags ? tagLinks(depth, post.tags) : ''}
  </div>
  <span class="post-read">${post.readingTime} 分钟</span>
</li>`;
}

const sectionHead = (label, { more, href } = {}) => `<div class="section-head">
  <h2>${esc(label)}</h2>
  <span class="rule" aria-hidden="true"></span>
  ${more ? `<a class="section-more" href="${href}">${esc(more)}</a>` : ''}
</div>`;

/* ------------------------------------------------------------------ */
/* 首页                                                                */
/* ------------------------------------------------------------------ */

export function homePage({ site, posts, featured }) {
  const depth = 0;
  const latest = posts.filter((p) => !p.featured).slice(0, 6);

  const hero = `<section class="hero">
  <div class="shell hero-inner">
    <div class="eyebrow">
      <span class="dot" aria-hidden="true"></span>
      <span class="path">~/writing</span>
      <span class="caret" aria-hidden="true">_</span>
    </div>
    <h1>${esc(site.tagline)}</h1>
    <p class="lede">${esc(site.description)}</p>
    <div class="hero-meta">
      <span>${esc(site.author)}</span>
      <span class="sep" aria-hidden="true"></span>
      <span>${posts.length} 篇文章</span>
      <span class="sep" aria-hidden="true"></span>
      <a href="./rss.xml">${icon('rss')}RSS</a>
      ${
        site.social?.github
          ? `<span class="sep" aria-hidden="true"></span>
      <a href="${esc(site.social.github)}" target="_blank" rel="noopener noreferrer">${icon('github')}GitHub</a>`
          : ''
      }
    </div>
  </div>
</section>`;

  const featuredBlock = featured
    ? `<section class="section">
  <div class="shell">
    ${sectionHead('置顶')}
    <a class="featured" href="${link(depth, `posts/${featured.slug}/`)}">
      <span class="featured-idx">01</span>
      <span class="featured-body">
        <span class="featured-title">${esc(featured.title)}</span>
        <span class="featured-desc">${esc(featured.description)}</span>
        <span class="featured-meta">
          <time datetime="${esc(featured.date)}">${fmtDate(featured.date)}</time>
          <span>${featured.readingTime} 分钟</span>
          ${featured.tags.map((t) => `<span class="dot-sep">·</span><span>${esc(t.name)}</span>`).join('')}
        </span>
      </span>
      <span class="featured-arrow">${icon('arrowUpRight')}</span>
    </a>
  </div>
</section>`
    : '';

  const latestBlock = `<section class="section">
  <div class="shell">
    ${sectionHead('最新', { more: '全部文章', href: './posts/' })}
    <ul class="post-list">${latest.map((p) => postRow(depth, p)).join('\n')}</ul>
  </div>
</section>`;

  return { content: hero + featuredBlock + latestBlock, title: '', description: site.description };
}

/* ------------------------------------------------------------------ */
/* 文章列表                                                            */
/* ------------------------------------------------------------------ */

export function postsPage({ site, posts }) {
  const depth = 1;
  const years = [...new Set(posts.map((p) => p.date.slice(0, 4)))].sort((a, b) => b - a);

  const groups = years
    .map((y) => {
      const rows = posts.filter((p) => p.date.startsWith(y));
      return `<section class="year-group">
  <div class="section-head">
    <h2>${y}</h2>
    <span class="rule" aria-hidden="true"></span>
    <span class="count">${rows.length}</span>
  </div>
  <ul class="post-list">${rows.map((p) => postRow(depth, p, { withDesc: true, withTags: true })).join('\n')}</ul>
</section>`;
    })
    .join('\n');

  const content = `<div class="shell">
  <header class="page-head">
    <p class="kicker">ARCHIVE</p>
    <h1>文章</h1>
    <p class="page-lede">共 ${posts.length} 篇，按时间倒序排列。</p>
  </header>
  ${groups}
</div>`;

  return { content, title: '文章', description: `${site.title} 的全部文章归档` };
}

/* ------------------------------------------------------------------ */
/* 文章详情                                                            */
/* ------------------------------------------------------------------ */

export function postPage({ site, post, prev, next, html }) {
  const depth = 2;
  const content = `<div class="progress" data-progress aria-hidden="true"></div>
<article class="shell">
  <div class="article">
    <header class="article-head">
      <nav class="crumb" aria-label="面包屑">
        <a href="${link(depth, 'posts/')}">文章</a>
        <span aria-hidden="true">/</span>
        <span>${esc(post.tags[0]?.name || '随笔')}</span>
      </nav>
      <h1>${esc(post.title)}</h1>
      <p class="article-desc">${esc(post.description)}</p>
      <div class="article-meta">
        <time datetime="${esc(post.date)}">${fmtDate(post.date)}</time>
        <span class="sep" aria-hidden="true"></span>
        <span>${post.readingTime} 分钟阅读</span>
        <span class="sep" aria-hidden="true"></span>
        <span>${esc(site.author)}</span>
      </div>
      ${tagLinks(depth, post.tags)}
    </header>

    <div class="prose">${html}</div>

    <nav class="article-nav" aria-label="上一篇 / 下一篇">
      ${
        prev
          ? `<a href="${link(depth, `posts/${prev.slug}/`)}"><span class="label">← 更新</span><span class="t">${esc(prev.title)}</span></a>`
          : '<span></span>'
      }
      ${
        next
          ? `<a href="${link(depth, `posts/${next.slug}/`)}" class="next"><span class="label">更早 →</span><span class="t">${esc(next.title)}</span></a>`
          : '<span></span>'
      }
    </nav>
  </div>
</article>`;

  return { content, title: post.title, description: post.description };
}

/* ------------------------------------------------------------------ */
/* 标签                                                                */
/* ------------------------------------------------------------------ */

export function tagsPage({ site, tags }) {
  const depth = 1;
  const content = `<div class="shell">
  <header class="page-head">
    <p class="kicker">TOPICS</p>
    <h1>标签</h1>
    <p class="page-lede">${tags.length} 个主题，${tags.reduce((n, t) => n + t.count, 0)} 次标记。</p>
  </header>
  <ul class="tag-cloud">
    ${tags
      .map(
        (t) => `<li><a class="tag-card" href="${link(depth, `tags/${t.slug}/`)}">
      <span class="tag-name">${esc(t.name)}</span>
      <span class="tag-count">${t.count}</span>
    </a></li>`
      )
      .join('\n')}
  </ul>
</div>`;
  return { content, title: '标签', description: `${site.title} 的全部标签` };
}

export function tagPage({ site, tag, posts }) {
  const depth = 2;
  const content = `<div class="shell">
  <header class="page-head">
    <p class="kicker">TAG</p>
    <h1>#${esc(tag.name)}</h1>
    <p class="page-lede">${posts.length} 篇文章 · <a href="${link(depth, 'tags/')}">查看全部标签</a></p>
  </header>
  <ul class="post-list">${posts.map((p) => postRow(depth, p, { withDesc: true })).join('\n')}</ul>
</div>`;
  return { content, title: `#${tag.name}`, description: `标签 ${tag.name} 下的全部文章` };
}

/* ------------------------------------------------------------------ */
/* 关于 / 404                                                          */
/* ------------------------------------------------------------------ */

export function aboutPage({ site, html }) {
  const content = `<div class="shell">
  <div class="article article--about">
    <header class="article-head">
      <p class="kicker">ABOUT</p>
      <h1>关于</h1>
    </header>
    <div class="prose">${html}</div>
  </div>
</div>`;
  return { content, title: '关于', description: `关于 ${site.title}` };
}

export function notFoundPage({ site }) {
  const content = `<div class="shell">
  <div class="notfound">
    <p class="kicker">ERROR</p>
    <h1>404</h1>
    <p class="page-lede">这个地址不存在，也许它已经被重写、移动，或者从未存在过。</p>
    <p><a class="btn" href="/">返回首页 ${icon('arrowRight')}</a></p>
  </div>
</div>`;
  return { content, title: '404', description: '页面不存在' };
}
