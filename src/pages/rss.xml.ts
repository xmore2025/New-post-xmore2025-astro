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
    customData: `<language>${site.lang}</language>`,
  });
}
