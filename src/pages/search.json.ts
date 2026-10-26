import type { APIRoute } from 'astro';
import { getPosts, isoDate } from '../lib/posts';

/**
 * 客户端搜索索引。
 * 字段极简以压缩体积：t=标题 d=描述 u=链接 g=标签 y=年份
 */
export const GET: APIRoute = async () => {
  const posts = await getPosts();

  const data = posts.map((post) => ({
    t: post.title,
    d: post.description,
    u: `/posts/${post.slug}/`,
    g: post.tags.map((tag) => tag.name),
    y: isoDate(post.date).slice(0, 4),
  }));

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
