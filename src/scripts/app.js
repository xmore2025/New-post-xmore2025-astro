/**
 * xmore · 交互入口
 *
 * 只做一件事：在 DOM 就绪后按需初始化各模块。
 * 每个模块自己判断所需元素是否存在，因此全站共用同一份脚本。
 */

import { initTheme } from './modules/theme.js';
import { initMobileNav } from './modules/nav.js';
import { initSearch } from './modules/search.js';
import { initArticle } from './modules/article.js';
import { initShell } from './modules/ui.js';

const start = () => {
  initTheme();
  initMobileNav();
  initShell();
  initSearch();
  initArticle();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
