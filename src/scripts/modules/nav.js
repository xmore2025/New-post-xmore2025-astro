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

/**
 * 顶栏下拉分组（如「实用工具」）。
 *
 * 只用点击切换，不做悬停打开：悬停打开会和点击互相打架（悬停已开时点击变关闭），
 * 触屏上也没有 hover 可依。点击 + Enter/Space（button 原生）+ Esc + 点外部关闭，
 * 四种设备行为一致。
 */
export function initNavDropdowns() {
  const roots = document.querySelectorAll('[data-nav-dropdown]');
  if (!roots.length) return;

  roots.forEach((root) => {
    const trigger = root.querySelector('[data-dropdown-trigger]');
    const panel = root.querySelector('[data-dropdown-panel]');
    if (!trigger || !panel) return;

    const setOpen = (open) => {
      trigger.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    };

    on(trigger, 'click', (event) => {
      event.stopPropagation();
      setOpen(panel.hidden);
    });

    // 焦点离开整个分组（含 Tab 到下一个导航项）时收起
    on(root, 'focusout', (event) => {
      if (!root.contains(event.relatedTarget)) setOpen(false);
    });

    on(document, 'click', (event) => {
      if (!panel.hidden && !root.contains(event.target)) setOpen(false);
    });

    on(document, 'keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) {
        setOpen(false);
        trigger.focus();
      }
    });
  });
}
