/* Devosfera · Minimal —— 交互脚本（无依赖，约 4KB） */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* 相对根路径：根据样式表位置推导，保证 file:// 与子目录部署都能用 */
  var cssHref = ($('link[rel="stylesheet"]') || {}).getAttribute
    ? $('link[rel="stylesheet"]').getAttribute('href')
    : './assets/main.css';
  var BASE = cssHref.replace(/assets\/main\.css.*$/, '');

  /* ---------------- 主题 ---------------- */
  function setTheme(next) {
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  }

  var themeBtn = $('[data-theme-toggle]');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* 跟随系统（用户未手动选择时） */
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) {
    mq.addEventListener('change', function (e) {
      var saved = null;
      try { saved = localStorage.getItem('theme'); } catch (err) {}
      if (!saved) root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
  }

  /* ---------------- 顶栏描边 ---------------- */
  var header = $('#site-header');
  if (header) {
    var onScroll = function () {
      header.setAttribute('data-scrolled', window.scrollY > 6 ? 'true' : 'false');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- 移动端菜单 ---------------- */
  var menuBtn = $('[data-menu-toggle]');
  var mobileNav = $('#mobile-nav');
  if (menuBtn && mobileNav) {
    var closeMenu = function () {
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', '打开菜单');
      mobileNav.hidden = true;
    };
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      if (open) return closeMenu();
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', '关闭菜单');
      mobileNav.hidden = false;
    });
    $$('a', mobileNav).forEach(function (a) { a.addEventListener('click', closeMenu); });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileNav.hidden) closeMenu();
    });
  }

  /* ---------------- 搜索 ---------------- */
  var modal = $('#search-modal');
  var input = $('[data-search-input]');
  var listEl = $('[data-search-results]');
  var dataEl = $('#search-data');
  var posts = [];

  try {
    posts = JSON.parse(dataEl ? dataEl.textContent : '[]') || [];
  } catch (e) {
    posts = [];
  }

  var active = -1;
  var lastFocus = null;

  function openSearch() {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (input) {
      input.value = '';
      input.focus();
    }
    render('');
  }

  function closeSearch() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function hrefFor(post) {
    return BASE + String(post.u).replace(/^\//, '');
  }

  function render(query) {
    if (!listEl) return;
    var q = query.trim().toLowerCase();
    var hits = q
      ? posts.filter(function (p) {
          return (
            p.t.toLowerCase().indexOf(q) > -1 ||
            (p.d || '').toLowerCase().indexOf(q) > -1 ||
            (p.g || []).join(' ').toLowerCase().indexOf(q) > -1
          );
        })
      : posts;

    active = -1;

    if (!hits.length) {
      listEl.innerHTML = '<li class="search-empty">没有匹配的文章</li>';
      return;
    }

    listEl.innerHTML = hits
      .slice(0, 12)
      .map(function (p, i) {
        return (
          '<li class="search-item" data-index="' + i + '">' +
          '<a href="' + hrefFor(p) + '">' +
          '<span class="st">' + escapeHtml(p.t) + '</span>' +
          '<span class="sm">' + escapeHtml(p.y) + ' · ' + escapeHtml((p.g || []).join(' / ')) + '</span>' +
          '</a></li>'
        );
      })
      .join('');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function move(delta) {
    var items = $$('.search-item', listEl);
    if (!items.length) return;
    active = (active + delta + items.length) % items.length;
    items.forEach(function (el, i) {
      if (i === active) el.setAttribute('data-active', '');
      else el.removeAttribute('data-active');
    });
    var cur = items[active];
    var a = cur.querySelector('a');
    if (a) a.scrollIntoView({ block: 'nearest' });
  }

  $$('[data-search-open]').forEach(function (btn) {
    btn.addEventListener('click', openSearch);
  });

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeSearch();
    });
  }

  if (input) {
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        var items = $$('.search-item', listEl);
        var target = active > -1 ? items[active] : items[0];
        if (target) {
          var a = target.querySelector('a');
          if (a) window.location.href = a.getAttribute('href');
        }
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (modal && modal.hidden) openSearch();
      else closeSearch();
      return;
    }
    if (e.key === '/' && !typing && modal && modal.hidden) {
      e.preventDefault();
      openSearch();
      return;
    }
    if (e.key === 'Escape' && modal && !modal.hidden) closeSearch();
  });

  /* ---------------- 阅读进度 ---------------- */
  var progress = $('[data-progress]');
  var article = $('.article');
  if (progress && article) {
    var updateProgress = function () {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight + 200;
      var scrolled = -rect.top + 100;
      var ratio = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      progress.style.width = (ratio * 100).toFixed(2) + '%';
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
  }

  /* ---------------- 代码复制 ---------------- */
  $$('.prose pre').forEach(function (pre) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.innerHTML = '<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a2.5 2.5 0 0 0-2.5 2.5v6.5A2.5 2.5 0 0 0 6 14.5"/></svg></span><span class="txt">复制</span>';
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      var text = code ? code.textContent : '';
      var done = function () {
        btn.querySelector('.txt').textContent = '已复制';
        setTimeout(function () { btn.querySelector('.txt').textContent = '复制'; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
    pre.appendChild(btn);
  });

  /* ---------------- 外部链接标记 ---------------- */
  $$('.prose a[target="_blank"]').forEach(function (a) {
    if (!a.querySelector('svg')) a.insertAdjacentHTML('beforeend', ' <span aria-hidden="true">↗</span>');
  });
})();
