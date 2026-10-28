// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import siteConfig from './site.config.json' with { type: 'json' };

/**
 * 从文章 frontmatter 里取日期，供 sitemap 的 <lastmod> 使用。
 * 在配置阶段直接读文件：Astro 的 content API 此时还不可用。
 */
function readPostDates() {
  const dir = path.join(process.cwd(), 'src', 'content', 'posts');
  /** @type {Map<string, string>} */
  const dates = new Map();
  if (!fs.existsSync(dir)) return dates;

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    const date = /^date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/m.exec(source)?.[1];
    const updated = /^updated:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/m.exec(source)?.[1];
    const lastmod = updated ?? date;
    if (lastmod) dates.set(file.replace(/\.md$/, ''), lastmod);
  }
  return dates;
}

const postDates = readPostDates();

export default defineConfig({
  site: siteConfig.url,

  // 与旧版 URL 保持一致：/posts/foo/ 而不是 /posts/foo
  trailingSlash: 'always',

  build: {
    format: 'directory',
    // 样式总量不到 30 KB（gzip 约 7 KB）：直接内联进 HTML，
    // 首屏少一次阻塞请求，换来的是"HTML 到即可绘制"。
    inlineStylesheets: 'always',
  },

  integrations: [
    sitemap({
      // 404 与搜索索引不属于内容页
      filter: (page) => !/\/(404|search\.json)\/?$/.test(page),
      serialize(item) {
        const post = /\/posts\/([^/]+)\/$/.exec(item.url);
        const lastmod = post ? postDates.get(decodeURIComponent(post[1])) : undefined;
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],

  markdown: {
    // 明暗双主题，具体颜色由 main.css 接管
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
});
