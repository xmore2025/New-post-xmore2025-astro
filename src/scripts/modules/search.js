/**
 * 站内搜索：按需加载索引 + 键盘导航 + 焦点管理
 *
 * 索引只在空闲时预取一次（/search.json 约几 KB），
 * 因此首屏不承担任何搜索成本，第一次按 ⌘K 也几乎无等待。
 */

import { $, $$, on, prefersReducedMotion } from './dom.js';

const RESULT_LIMIT = 12;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlight = (text, query) => {
  const safe = escapeHtml(text);
  if (!query) return safe;
  try {
    return safe.replace(new RegExp(`(${escapeRegExp(query)})`, 'gi'), '<mark>$1</mark>');
  } catch {
    return safe;
  }
};

export function initSearch() {
  const modal = $('#search-modal');
  const panel = $('.search-panel', modal);
  const input = $('[data-search-input]', modal);
  const list = $('[data-search-results]', modal);
  const status = $('[data-search-status]', modal);

  if (!modal || !panel || !input || !list) return;

  /** @type {{t:string,d:string,u:string,g:string[],y:string}[] | null} */
  let index = null;
  let loading = false;

  const load = () => {
    if (index || loading) return;
    loading = true;
    fetch('/search.json', { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        index = Array.isArray(data) ? data : [];
      })
      .catch(() => {
        index = [];
      })
      .finally(() => {
        loading = false;
        if (!modal.hidden) render(input.value);
      });
  };

  let activeIndex = -1;

  const matches = (query) => {
    const all = index ?? [];
    if (!query) return all;
    return all.filter((post) => {
      const haystack = `${post.t} ${post.d ?? ''} ${(post.g ?? []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  };

  const setActive = (items, next) => {
    if (!items.length) return;
    activeIndex = (next + items.length) % items.length;
    items.forEach((item, i) => {
      if (i === activeIndex) item.setAttribute('data-active', '');
      else item.removeAttribute('data-active');
    });
    items[activeIndex]
      .querySelector('a')
      ?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const render = (rawQuery) => {
    const query = String(rawQuery ?? '')
      .trim()
      .toLowerCase();
    activeIndex = -1;

    if (!index) {
      list.innerHTML = '<li class="search-empty">正在载入索引…</li>';
      if (status) status.textContent = '正在载入索引';
      return;
    }

    const hits = matches(query);
    if (!hits.length) {
      list.innerHTML = `<li class="search-empty">没有找到与「${escapeHtml(rawQuery.trim())}」相关的文章</li>`;
      if (status) status.textContent = '没有找到相关文章';
      return;
    }

    list.innerHTML = hits
      .slice(0, RESULT_LIMIT)
      .map((post, i) => {
        const desc = String(post.d ?? '');
        const snippet = desc.length > 96 ? `${desc.slice(0, 96)}…` : desc;
        return (
          `<li class="search-item" data-index="${i}"><a href="${escapeHtml(post.u)}">` +
          `<span class="st">${highlight(post.t, query)}</span>` +
          (snippet ? `<span class="sd">${highlight(snippet, query)}</span>` : '') +
          `<span class="sm">${escapeHtml(post.y)} · ${highlight((post.g ?? []).join(' / '), query)}</span>` +
          '</a></li>'
        );
      })
      .join('');

    if (status) status.textContent = `找到 ${Math.min(hits.length, RESULT_LIMIT)} 篇文章`;
  };

  const focusables = () =>
    $$('a, button, input, [tabindex]:not([tabindex="-1"])', panel).filter(
      (el) => !el.hasAttribute('disabled')
    );

  let lastFocused = null;

  const open = () => {
    if (!modal.hidden) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add('is-search-open');
    $$('[data-search-open]').forEach((btn) => btn.setAttribute('aria-expanded', 'true'));
    input.value = '';
    input.focus({ preventScroll: true });
    render('');
    load();
  };

  const close = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    document.documentElement.classList.remove('is-search-open');
    $$('[data-search-open]').forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
    if (lastFocused instanceof HTMLElement) lastFocused.focus({ preventScroll: true });
  };

  $$('[data-search-open]').forEach((btn) => on(btn, 'click', open));

  on(modal, 'click', (event) => {
    if (event.target === modal) close();
  });

  on(input, 'input', () => render(input.value));

  on(panel, 'keydown', (event) => {
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  on(input, 'keydown', (event) => {
    const items = $$('.search-item', list);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(items, activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
      return;
    }

    if (event.key === 'Enter') {
      const target = items[activeIndex] ?? items[0];
      const link = target?.querySelector('a');
      if (link) window.location.assign(link.getAttribute('href'));
    }
  });

  on(document, 'keydown', (event) => {
    const target = event.target;
    const typing =
      target instanceof HTMLElement &&
      (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      modal.hidden ? open() : close();
      return;
    }

    if (event.key === '/' && !typing && modal.hidden) {
      event.preventDefault();
      open();
      return;
    }

    if (event.key === 'Escape' && !modal.hidden) {
      event.preventDefault();
      close();
    }
  });

  // 索引预热推迟到 load 之后：首屏带宽优先给字体与样式，
  // 用户一旦表现出搜索意图（悬停按钮、聚焦输入框）就立刻加载。
  const warm = () => {
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback
      : (fn) => window.setTimeout(fn, 1500);
    idle(load, { timeout: 4000 });
  };

  if (document.readyState === 'complete') warm();
  else window.addEventListener('load', warm, { once: true });

  $$('[data-search-open]').forEach((btn) => {
    on(btn, 'pointerenter', load);
    on(btn, 'focus', load);
  });
  on(input, 'focus', load);
}
