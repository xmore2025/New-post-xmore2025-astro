// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import siteConfig from './site.config.json' with { type: 'json' };

export default defineConfig({
  site: siteConfig.url,

  // 与旧版 URL 保持一致：/posts/foo/ 而不是 /posts/foo
  trailingSlash: 'always',
  build: { format: 'directory' },

  integrations: [sitemap()],

  markdown: {
    // 明暗双主题，具体颜色由 main.css 接管
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
});
