import { getCollection } from 'astro:content';

/** 标签 slug：中文保留，空格转连字符，去掉标点 */
export function slugifyTag(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** 阅读时长：中文 380 字/分钟，英文 200 词/分钟 */
export function readingTime(body = '') {
  const plain = String(body).replace(/```[\s\S]*?```/g, ' ');
  const cjk = (plain.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = (plain.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.round(cjk / 380 + words / 200));
}

/** 2026-09-05 → 2026.09.05 */
export function fmtDate(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '.');
}

/** 2026-09-05 */
export function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

/** 取全部已发布文章，按时间倒序 */
export async function getPosts() {
  const entries = await getCollection('posts', ({ data }) => !data.draft);

  const posts = entries.map((entry) => ({
    entry,
    slug: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    date: entry.data.date,
    updated: entry.data.updated ?? entry.data.date,
    featured: entry.data.featured ?? false,
    tags: (entry.data.tags ?? []).map((name) => ({ name, slug: slugifyTag(name) })),
    readingTime: readingTime(entry.body ?? ''),
    wordCount: (entry.body ?? '').replace(/\s+/g, '').length,
  }));

  return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** 汇总标签，按文章数倒序 */
export async function getTags() {
  const posts = await getPosts();
  /** @type {Map<string, {name: string, slug: string, count: number, posts: any[]}>} */
  const map = new Map();

  for (const post of posts) {
    for (const tag of post.tags) {
      if (!map.has(tag.slug)) map.set(tag.slug, { ...tag, count: 0, posts: [] });
      const item = map.get(tag.slug);
      item.count += 1;
      item.posts.push(post);
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
