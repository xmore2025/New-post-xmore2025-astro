/**
 * 构建脚本：把 content/ 下的 Markdown 编译成 dist/ 静态站点
 * 运行：node build.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderMarkdown, readingTime, slugify } from './src/render.mjs';
import {
  layout,
  homePage,
  postsPage,
  postPage,
  tagsPage,
  tagPage,
  aboutPage,
  notFoundPage,
} from './src/templates.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');

/* ---------------- 工具 ---------------- */

async function rimraf(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function write(rel, content) {
  const file = path.join(DIST, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
  return rel;
}

/** 递归复制目录（用于 public/ 下的静态文件） */
async function copyDir(from, to) {
  let entries;
  try {
    entries = await fs.readdir(from, { withFileTypes: true });
  } catch {
    return [];
  }
  const copied = [];
  for (const entry of entries) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copied.push(...(await copyDir(src, dest)));
    } else {
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
      copied.push(path.relative(DIST, dest));
    }
  }
  return copied;
}

/** 解析 frontmatter（仅支持 key: value 与 [a, b]） */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (/^\[.*\]$/.test(value)) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    data[key] = value;
  }
  return { data, body: raw.slice(m[0].length) };
}

/* ---------------- 读取内容 ---------------- */

async function loadPosts() {
  const dir = path.join(ROOT, 'content/posts');
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const raw = await fs.readFile(path.join(dir, file), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    if (data.draft === 'true') continue;

    const slug = data.slug || file.replace(/\.md$/, '');
    const tags = (Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : []).map((t) => ({
      name: String(t).trim(),
      slug: slugify(String(t).trim()),
    }));

    posts.push({
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: String(data.date || '1970-01-01'),
      featured: data.featured === 'true',
      tags,
      readingTime: readingTime(body),
      body,
      html: renderMarkdown(body),
    });
  }

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

/* ---------------- RSS ---------------- */

function buildRss(site, posts) {
  const items = posts
    .slice(0, 20)
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${site.url}/posts/${p.slug}/</link>
      <guid>${site.url}/posts/${p.slug}/</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${escapeXml(p.description)}</description>
    </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>${site.lang}</language>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------------- Sitemap ---------------- */

function buildSitemap(site, posts, tags) {
  const urls = [
    { loc: '/', priority: '1.0' },
    { loc: '/posts/', priority: '0.9' },
    { loc: '/tags/', priority: '0.5' },
    { loc: '/about/', priority: '0.5' },
    ...posts.map((p) => ({
      loc: `/posts/${p.slug}/`,
      lastmod: p.date,
      priority: '0.8',
    })),
    ...tags.map((t) => ({ loc: `/tags/${t.slug}/`, priority: '0.3' })),
  ];

  const body = urls
    .map(
      (u) =>
        `  <url><loc>${escapeXml(site.url + u.loc)}</loc>${
          u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''
        }<priority>${u.priority}</priority></url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

/* ---------------- 构建 ---------------- */

async function build() {
  const t0 = Date.now();
  await rimraf(DIST);

  const site = JSON.parse(await fs.readFile(path.join(ROOT, 'site.config.json'), 'utf8'));
  const posts = await loadPosts();

  if (!posts.length) throw new Error('content/posts 下没有找到文章');

  const featured = posts.find((p) => p.featured) || null;

  // 搜索索引
  const searchData = posts.map((p) => ({
    t: p.title,
    d: p.description,
    u: `/posts/${p.slug}/`,
    g: p.tags.map((t) => t.name),
    y: p.date.slice(0, 4),
  }));

  // 静态资源（先读入，用于计算缓存版本号）
  const cssSource = await fs.readFile(path.join(ROOT, 'src/styles/main.css'), 'utf8');
  const jsSource = await fs.readFile(path.join(ROOT, 'src/scripts/app.js'), 'utf8');
  const assetVersion = createHash('sha1')
    .update(cssSource + jsSource)
    .digest('hex')
    .slice(0, 8);

  const render = (fn, data, { depth, active, bodyClass = '', absoluteBase = false, path = '' }) => {
    const { content, title, description } = fn({ site, posts, ...data });
    return layout({
      site,
      depth,
      active,
      title,
      description,
      bodyClass,
      content,
      searchData,
      absoluteBase,
      assetVersion,
      path,
    });
  };

  const written = [];

  // 首页
  written.push(
    await write(
      'index.html',
      render(homePage, { featured, posts }, {
        depth: 0,
        active: 'home',
        bodyClass: 'page-home',
        path: '/',
      })
    )
  );

  // 文章列表
  written.push(
    await write(
      'posts/index.html',
      render(postsPage, {}, { depth: 1, active: 'posts', path: '/posts/' })
    )
  );

  // 文章详情
  for (let i = 0; i < posts.length; i += 1) {
    const post = posts[i];
    const prev = posts[i - 1] || null;
    const next = posts[i + 1] || null;
    written.push(
      await write(
        `posts/${post.slug}/index.html`,
        render(
          postPage,
          { post, prev, next, html: post.html },
          { depth: 2, active: 'posts', bodyClass: 'page-post', path: `/posts/${post.slug}/` }
        )
      )
    );
  }

  // 标签
  const tagMap = new Map();
  for (const p of posts) {
    for (const t of p.tags) {
      if (!tagMap.has(t.slug)) tagMap.set(t.slug, { ...t, count: 0, posts: [] });
      const entry = tagMap.get(t.slug);
      entry.count += 1;
      entry.posts.push(p);
    }
  }
  const tags = [...tagMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  written.push(
    await write(
      'tags/index.html',
      render(tagsPage, { tags }, { depth: 1, active: 'tags', path: '/tags/' })
    )
  );

  for (const tag of tags) {
    written.push(
      await write(
        `tags/${tag.slug}/index.html`,
        render(tagPage, { tag, posts: tag.posts }, {
          depth: 2,
          active: 'tags',
          path: `/tags/${tag.slug}/`,
        })
      )
    );
  }

  // 关于
  const aboutRaw = await fs.readFile(path.join(ROOT, 'content/pages/about.md'), 'utf8');
  const aboutBody = parseFrontmatter(aboutRaw).body;
  written.push(
    await write(
      'about/index.html',
      render(aboutPage, { html: renderMarkdown(aboutBody) }, {
        depth: 1,
        active: 'about',
        path: '/about/',
      })
    )
  );

  // 404（可能出现在任意层级，资源路径用绝对路径）
  written.push(
    await write(
      '404.html',
      render(notFoundPage, {}, { depth: 0, active: '', absoluteBase: true })
    )
  );

  // RSS
  written.push(await write('rss.xml', buildRss(site, posts)));

  // 站点地图
  written.push(await write('sitemap.xml', buildSitemap(site, posts, tags)));

  // 静态资源
  written.push(await write('assets/main.css', cssSource));
  written.push(await write('assets/app.js', jsSource));

  // favicon
  written.push(
    await write(
      'assets/favicon.svg',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#17171b"/><path d="M16 6.5 25 16l-9 9.5L7 16l9-9.5Z" fill="none" stroke="#7aa9f0" stroke-width="1.6"/><path d="M16 6.5V25.5" stroke="#7aa9f0" stroke-width="1.6"/></svg>`
    )
  );

  // public/ 下的静态文件（_headers、robots.txt 等）原样复制
  const publicFiles = await copyDir(path.join(ROOT, 'public'), DIST);
  written.push(...publicFiles);

  console.log(`✓ 构建完成，共 ${written.length} 个文件，用时 ${Date.now() - t0}ms`);
  console.log(`  文章 ${posts.length} 篇 · 标签 ${tags.length} 个 · 资源版本 ${assetVersion}`);
  console.log(`  输出目录：${path.relative(process.cwd(), DIST) || '.'}`);
}

build().catch((err) => {
  console.error('构建失败：', err);
  process.exit(1);
});
