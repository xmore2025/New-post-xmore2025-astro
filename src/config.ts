import config from '../site.config.json';

export interface SiteConfig {
  title: string;
  titleSuffix: string;
  tagline: string;
  description: string;
  author: string;
  lang: string;
  url: string;
  ogImage?: string;
  comments?: {
    repo: string;
    repoId: string;
    category: string;
    categoryId: string;
    /** giscus 服务地址：官方实例或自托管域名 */
    origin?: string;
  };
  social: { github?: string; x?: string; telegram?: string; email?: string };
  nav: { label: string; href: string }[];
}

/** 全站配置的唯一来源：根目录的 site.config.json */
export const site = config as SiteConfig;
