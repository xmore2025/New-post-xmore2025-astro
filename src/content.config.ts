import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
});

export const collections = { posts, pages };
