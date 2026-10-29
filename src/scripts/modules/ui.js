/**
 * 页面外壳行为：顶栏描边、回到顶部。
 */

import { $, $$, on, rafThrottle, prefersReducedMotion } from './dom.js';

const initHeader = () => {
  const header = $('#site-header');
  if (!header) return;

  let scrolled = false;
  const update = rafThrottle(() => {
    const next = window.scrollY > 4;
    if (next === scrolled) return;
    scrolled = next;
    header.setAttribute('data-scrolled', String(next));
  });

  update();
  on(window, 'scroll', update, { passive: true });
};

/**
 * 回到顶部
 *
 * 不能只依赖锚点：顶栏是 position: sticky，它永远停在视口顶部，
 * 浏览器判定"目标已在视口内"，只会按 scroll-padding-top 微调几十像素
 * （实测只上移 78px），所以点了看起来"没反应"。
 * 这里直接接管滚动，锚点退化为无 JS 时的兜底。
 */
const initBackToTop = () => {
  const links = $$('[data-back-to-top]');
  if (!links.length) return;

  links.forEach((link) => {
    on(link, 'click', (event) => {
      // 修饰键点击保持浏览器原生行为（新标签打开等）
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

      // 清掉地址栏里的 #top，避免重复点击时 hash 残留
      if (window.location.hash) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`
        );
      }

      // 键盘用户：焦点也回到页首，否则仍停留在页脚
      const main = $('#main');
      if (!main) return;
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
    });
  });
};

export function initShell() {
  initHeader();
  initBackToTop();
}
