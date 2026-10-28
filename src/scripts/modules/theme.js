/**
 * 主题：明暗切换 + 浏览器 UI 颜色同步
 *
 * 首屏的主题由 BaseLayout 里的内联脚本决定（避免闪烁），
 * 这里只负责之后的切换与系统偏好联动。
 */

import { $, $$, on } from './dom.js';

const KEY = 'theme';
const root = document.documentElement;
const button = $('[data-theme-toggle]');

const readStored = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const store = (value) => {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* 隐私模式下写入失败时忽略即可 */
  }
};

const current = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

/** 让地址栏 / 系统状态栏跟随手动切换，而不是只跟随系统偏好 */
const syncBrowserChrome = (theme) => {
  $$('meta[name="theme-color"]').forEach((meta) => {
    const target = meta.getAttribute('data-theme-color');
    // 没有标记的 meta 不参与切换，避免把两条都关掉
    if (!target) return;
    meta.setAttribute('media', target === theme ? 'all' : 'not all');
  });
};

const apply = (theme, { persist = true } = {}) => {
  root.setAttribute('data-theme', theme);
  if (persist) store(theme);
  syncBrowserChrome(theme);
  if (button) {
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute('aria-label', theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题');
  }
};

export function initTheme() {
  syncBrowserChrome(current());
  if (button) button.setAttribute('aria-pressed', String(current() === 'dark'));

  on(button, 'click', () => {
    apply(current() === 'dark' ? 'light' : 'dark');
    // 首次交互后才开启颜色过渡，避免首屏闪烁
    root.classList.add('theme-ready');
  });

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = (event) => {
    if (!readStored()) apply(event.matches ? 'dark' : 'light', { persist: false });
  };

  if (media.addEventListener) media.addEventListener('change', onSystemChange);
  else if (media.addListener) media.addListener(onSystemChange);
}
