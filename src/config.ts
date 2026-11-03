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
  nav: NavItem[];
}

/** 导航项。带 items 时渲染成下拉分组，否则是一个普通链接 */
export interface NavItem {
  label: string;
  /** 普通项必填；分组项可省略 */
  href?: string;
  /** 二级说明，只在下拉面板里显示 */
  desc?: string;
  /** 站外链接：新标签打开、不做当前页高亮 */
  external?: boolean;
  /** 二级菜单项 */
  items?: NavItem[];
}

/** 全站配置的唯一来源：根目录的 site.config.json */
export const site = config as SiteConfig;
