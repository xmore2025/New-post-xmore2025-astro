/**
 * 阅读相关增强：进度条、目录高亮、代码复制、分享复制、外链标记
 * 全部渐进增强：脚本失效时页面依然可读。
 */

import { $, $$, on, rafThrottle } from './dom.js';

const COPY_ICON =
  '<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a2.5 2.5 0 0 0-2.5 2.5v6.5A2.5 2.5 0 0 0 6 14.5"/></svg></span>';

/* ---------------- 阅读进度 ---------------- */
const initProgress = () => {
  const bar = $('[data-progress]');
  const article = $('.article');
  if (!bar || !article) return;

  const update = rafThrottle(() => {
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight + 160;
    const scrolled = -rect.top + 80;
    const ratio = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
    bar.style.width = `${(ratio * 100).toFixed(2)}%`;
  });

  update();
  on(window, 'scroll', update, { passive: true });
  on(window, 'resize', update);
};

/* ---------------- 目录高亮 ---------------- */
const initToc = () => {
  const links = $$('.article-toc a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const entries = links
    .map((link) => {
      const raw = link.getAttribute('href').slice(1);
      let id = raw;
      try {
        id = decodeURIComponent(raw);
      } catch {
        id = raw;
      }
      const heading = document.getElementById(id);
      return heading ? { link, heading } : null;
    })
    .filter(Boolean);

  if (!entries.length) return;

  const visible = new Set();

  const activate = () => {
    let current = entries.find((entry) => visible.has(entry.heading));
    if (!current) {
      // 还没滚到任何标题时，按位置取最近的一个
      current = entries
        .filter((entry) => entry.heading.getBoundingClientRect().top <= 120)
        .pop();
    }
    links.forEach((link) => {
      link.classList.remove('is-active');
      link.removeAttribute('aria-current');
    });
    if (!current) return;
    current.link.classList.add('is-active');
    current.link.setAttribute('aria-current', 'location');
  };

  const observer = new IntersectionObserver(
    (records) => {
      records.forEach((record) => {
        if (record.isIntersecting) visible.add(record.target);
        else visible.delete(record.target);
      });
      activate();
    },
    { rootMargin: '-72px 0px -62% 0px', threshold: [0, 1] }
  );

  entries.forEach((entry) => observer.observe(entry.heading));
  activate();
};

/* ---------------- 代码复制 ---------------- */
const copyText = (text) =>
  new Promise((resolve) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => resolve(true),
        () => resolve(false)
      );
      return;
    }

    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(area);
    resolve(ok);
  });

const initCodeCopy = () => {
  $$('.prose pre').forEach((pre) => {
    if (pre.querySelector('.code-copy')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.innerHTML = `${COPY_ICON}<span class="txt">复制</span>`;
    button.setAttribute('aria-label', '复制代码');

    on(button, 'click', async () => {
      const text = pre.querySelector('code')?.textContent ?? '';
      const ok = await copyText(text);
      const label = button.querySelector('.txt');
      label.textContent = ok ? '已复制' : '复制失败';
      button.classList.toggle('is-done', ok);
      window.setTimeout(() => {
        label.textContent = '复制';
        button.classList.remove('is-done');
      }, 1600);
    });

    pre.appendChild(button);
  });
};

/* ---------------- 分享 / 复制链接 ---------------- */
const initShare = () => {
  const button = $('[data-share-copy]');
  const status = $('[data-share-status]');
  if (!button) return;

  on(button, 'click', async () => {
    const ok = await copyText(window.location.href);
    if (status) status.textContent = ok ? '链接已复制' : '复制失败，请手动复制地址栏';
    if (!ok) return;

    const label = button.querySelector('.txt');
    const original = label?.textContent ?? '';
    if (label) label.textContent = '已复制';
    window.setTimeout(() => {
      if (label) label.textContent = original;
      if (status) status.textContent = '';
    }, 1800);
  });
};

/* ---------------- 外链标记 ---------------- */
const initExternalLinks = () => {
  $$('.prose a[target="_blank"]').forEach((link) => {
    if (link.querySelector('svg')) return;
    link.insertAdjacentHTML('beforeend', ' <span class="external-mark" aria-hidden="true">↗</span>');
  });
};

export function initArticle() {
  initProgress();
  initToc();
  initCodeCopy();
  initShare();
  initExternalLinks();
}
