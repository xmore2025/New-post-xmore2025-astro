/**
 * 页面外壳行为：顶栏描边、回到顶部。
 */

import { $, on, rafThrottle, prefersReducedMotion, delay } from './dom.js';

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

const initToTop = () => {
  const button = $('[data-to-top]');
  if (!button) return;

  let visible = false;
  let hideTimer = () => {};

  const show = () => {
    hideTimer();
    button.hidden = false;
    requestAnimationFrame(() => button.classList.add('is-visible'));
  };

  const hide = () => {
    button.classList.remove('is-visible');
    hideTimer = delay(() => {
      button.hidden = true;
    }, prefersReducedMotion() ? 0 : 220);
  };

  const update = rafThrottle(() => {
    const next = window.scrollY > window.innerHeight * 0.6;
    if (next === visible) return;
    visible = next;
    next ? show() : hide();
  });

  update();
  on(window, 'scroll', update, { passive: true });

  on(button, 'click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  });
};

export function initShell() {
  initHeader();
  initToTop();
}
