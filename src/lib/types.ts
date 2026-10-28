/** 文章 / 标签的共享类型：供组件 props 与 lib 使用，避免 any 扩散 */

export interface TagRef {
  name: string;
  slug: string;
}

export interface PostSummary {
  slug: string;
  title: string;
  description: string;
  date: Date;
  /** 最后修订时间（没有 updated 时等于 date） */
  updated: Date;
  featured: boolean;
  tags: TagRef[];
  readingTime: number;
  /** 正文字符数（用于结构化数据 wordCount） */
  wordCount: number;
}
