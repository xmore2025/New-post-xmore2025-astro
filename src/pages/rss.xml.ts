import rss from '@astrojs/rss';
import { marked } from 'marked';
import type { APIContext } from 'astro';
import { site } from '../config';
import { getPosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  // 全文输出：订阅器里直接可读。@astrojs/rss 会把 content
  // 映射为 content:encoded，并自动声明对应的命名空间。
  // markdown → HTML 用 marked：RSS 里不需要 Shiki 高亮，
  // 纯 HTML 更小也更快；相对链接在这里统一补成绝对地址。
  const items = posts.slice(0, 20).map((post) => {
    const html = marked.parse(post.entry.body ?? '', { async: false });
    const content = html.replace(/(src|href)="\/(?!\/)/g, `$1="${site.url}/`);
    return {
      title: post.title,
      description: post.description,
      link: `/posts/${post.slug}/`,
      pubDate: post.date,
      categories: post.tags.map((tag) => tag.name),
      content,
    };
  });

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    items,
    // 订阅器据此判断是否有更新；ttl 提示轮询频率
    customData:
      `<language>${site.lang}</language>` +
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>` +
      `<ttl>60</ttl>`,
  });
}
