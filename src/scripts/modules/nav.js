/**
 * 移动端菜单：只在小屏生效，键盘可达（Esc 关闭、焦点回到按钮）。
 */

import { $, on } from './dom.js';

export function initMobileNav() {
  const button = $('[data-menu-toggle]');
  const panel = $('#mobile-nav');
  if (!button || !panel) return;

  const desktop = window.matchMedia('(min-width: 901px)');

  const close = ({ restoreFocus = false } = {}) => {
    if (panel.hidden) return;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', '打开菜单');
    panel.hidden = true;
    if (restoreFocus) button.focus();
  };

  const open = () => {
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', '关闭菜单');
    panel.hidden = false;
    panel.querySelector('a')?.focus({ preventScroll: true });
  };

  on(button, 'click', () => {
    if (panel.hidden) open();
    else close({ restoreFocus: true });
  });

  panel.querySelectorAll('a').forEach((link) => on(link, 'click', () => close()));

  on(document, 'keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) close({ restoreFocus: true });
  });

  on(document, 'click', (event) => {
    if (panel.hidden) return;
    if (panel.contains(event.target) || button.contains(event.target)) return;
    close();
  });

  const onBreakpoint = (event) => {
    if (event.matches) close();
  };

  desktop.addEventListener('change', onBreakpoint);
}
