/**
 * xmore · 交互入口
 *
 * 立即初始化：主题、导航、外壳（顶栏描边 / 回到顶部）、文章增强。
 * 搜索模块延迟加载：空闲时或用户第一次表达搜索意图（点击按钮 / ⌘K / /）
 * 时才 import()，首屏 JS 体积更小；就绪前的意图由代理捕获，不会丢失。
 */

import { $$ } from './modules/dom.js';
import { initTheme } from './modules/theme.js';
import { initMobileNav } from './modules/nav.js';
import { initArticle } from './modules/article.js';
import { initShell } from './modules/ui.js';

/** @type {Promise<void> | null} */
let searchPromise = null;
/** @type {{ open: () => void } | undefined} */
let searchApi = undefined;

const ensureSearch = () => {
  if (!searchPromise) {
    searchPromise = import('./modules/search.js').then((m) => {
      searchApi = m.initSearch();
      removeProxies();
    });
  }
  return searchPromise;
};

/* ---- 就绪前的意图代理：真实处理器绑定后立即自我移除 ---- */
const proxies = [];
const addProxy = (target, type, handler, options) => {
  target.addEventListener(type, handler, options);
  proxies.push(() => target.removeEventListener(type, handler, options));
};
const removeProxies = () => {
  while (proxies.length) proxies.pop()();
};

const triggerOpen = (event) => {
  if (event) event.preventDefault();
  ensureSearch().then(() => searchApi?.open());
};

const isTyping = () => {
  const target = document.activeElement;
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  );
};

const keyProxy = (event) => {
  const cmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
  const slash = event.key === '/' && !isTyping();
  if (!cmdK && !slash) return;
  removeProxies();
  triggerOpen(event);
};

const clickProxy = (event) => {
  removeProxies();
  triggerOpen(event);
};

const initSearchLazy = () => {
  // 键盘代理用捕获阶段：一定先于（尚未存在的）真实处理器
  addProxy(document, 'keydown', keyProxy, true);
  $$('[data-search-open]').forEach((btn) => addProxy(btn, 'click', clickProxy));

  // 没有任何交互时，空闲后加载，让下一次 ⌘K 即刻可用
  const idle = window.requestIdleCallback
    ? window.requestIdleCallback
    : (fn) => window.setTimeout(fn, 1500);
  idle(() => ensureSearch(), { timeout: 4000 });
};

const start = () => {
  initTheme();
  initMobileNav();
  initShell();
  initArticle();
  initSearchLazy();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
