/* xmore —— 交互脚本（无依赖） */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* ---------------- 主题 ---------------- */
  function setTheme(next) {
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {}
  }

  var themeBtn = $('[data-theme-toggle]');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) {
    mq.addEventListener('change', function (e) {
      var saved = null;
      try {
        saved = localStorage.getItem('theme');
      } catch (err) {}
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
    $$('a', mobileNav).forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
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
  var posts = null;
  var loading = false;
  var active = -1;
  var lastFocus = null;

  function loadPosts() {
    if (posts) return Promise.resolve(posts);
    if (loading) return Promise.resolve([]);
    loading = true;
    return fetch('/search.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        posts = data || [];
        loading = false;
        return posts;
      })
      .catch(function () {
        posts = [];
        loading = false;
        return posts;
      });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render(query) {
    if (!listEl) return;
    var all = posts || [];
    var q = String(query || '').trim().toLowerCase();
    var hits = q
      ? all.filter(function (p) {
          return (
            p.t.toLowerCase().indexOf(q) > -1 ||
            (p.d || '').toLowerCase().indexOf(q) > -1 ||
            (p.g || []).join(' ').toLowerCase().indexOf(q) > -1
          );
        })
      : all;

    active = -1;

    if (!hits.length) {
      listEl.innerHTML =
        '<li class="search-empty">' + (all.length ? '没有匹配的文章' : '正在载入索引…') + '</li>';
      return;
    }

    listEl.innerHTML = hits
      .slice(0, 12)
      .map(function (p, i) {
        return (
          '<li class="search-item" data-index="' + i + '">' +
          '<a href="' + escapeHtml(p.u) + '">' +
          '<span class="st">' + escapeHtml(p.t) + '</span>' +
          '<span class="sm">' + escapeHtml(p.y) + ' · ' + escapeHtml((p.g || []).join(' / ')) +
          '</span></a></li>'
        );
      })
      .join('');
  }

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
    loadPosts().then(function () {
      if (input) render(input.value);
    });
  }

  function closeSearch() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function move(delta) {
    var items = $$('.search-item', listEl);
    if (!items.length) return;
    active = (active + delta + items.length) % items.length;
    items.forEach(function (el, i) {
      if (i === active) el.setAttribute('data-active', '');
      else el.removeAttribute('data-active');
    });
    var a = items[active].querySelector('a');
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
    input.addEventListener('input', function () {
      render(input.value);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        move(-1);
      } else if (e.key === 'Enter') {
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
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(
      (document.activeElement || {}).tagName || ''
    );
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
  var COPY_ICON =
    '<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a2.5 2.5 0 0 0-2.5 2.5v6.5A2.5 2.5 0 0 0 6 14.5"/></svg></span>';

  $$('.prose pre').forEach(function (pre) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.innerHTML = COPY_ICON + '<span class="txt">复制</span>';
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      var text = code ? code.textContent : '';
      var label = btn.querySelector('.txt');
      var done = function () {
        label.textContent = '已复制';
        setTimeout(function () {
          label.textContent = '复制';
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
    pre.appendChild(btn);
  });

  /* ---------------- 外部链接标记 ---------------- */
  $$('.prose a[target="_blank"]').forEach(function (a) {
    if (!a.querySelector('svg')) {
      a.insertAdjacentHTML('beforeend', ' <span aria-hidden="true">↗</span>');
    }
  });
})();
