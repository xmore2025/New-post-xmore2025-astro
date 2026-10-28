/**
 * 页面外壳行为：顶栏描边。
 */

import { $, on, rafThrottle } from './dom.js';

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

export function initShell() {
  initHeader();
}
