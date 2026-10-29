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
  social: { github?: string; x?: string; email?: string };
  nav: { label: string; href: string }[];
}

/** 全站配置的唯一来源：根目录的 site.config.json */
export const site = config as SiteConfig;
