import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../config';
import { getPosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    items: posts.slice(0, 20).map((post) => ({
      title: post.title,
      description: post.description,
      link: `/posts/${post.slug}/`,
      pubDate: post.date,
      categories: post.tags.map((tag) => tag.name),
    })),
    // 订阅器据此判断是否有更新；ttl 提示轮询频率
    customData:
      `<language>${site.lang}</language>` +
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>` +
      `<ttl>60</ttl>`,
  });
}
