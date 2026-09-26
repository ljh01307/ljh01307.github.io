/* ============================================================
 * site.js —— 全站公共运行时
 *   · 注入侧栏 / 顶栏 / 页脚
 *   · 暗黑模式（CSS 变量切换 + localStorage 记忆）
 *   · 移动端抽屉导航
 *   · 站内搜索
 *   · 浏览量 / 点赞计数（纯前端，可切换第三方服务）
 *   · 代码块复制、回到顶部
 * 需在 data/site.js、data/posts.js 之后加载
 * ============================================================ */
(function () {
  'use strict';

  var SITE = window.SITE || {};
  var POSTS = window.BLOG_POSTS || [];
  var META = window.BLOG_META || { total: 0, categories: [], tags: [], totalWords: 0 };

  /* ==========================================================
   * 图标
   * ========================================================== */
  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.4.6L11.4 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6Z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    github: '<path d="M9 19c-4 1.5-4-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-1-2.6c3.2-.4 6.5-1.6 6.5-7.2A5.6 5.6 0 0 0 19 3.9 5.2 5.2 0 0 0 18.9.6S17.6.2 15 2a13.4 13.4 0 0 0-7 0C5.4.2 4.1.6 4.1.6A5.2 5.2 0 0 0 4 3.9 5.6 5.6 0 0 0 2.5 7.9c0 5.6 3.3 6.8 6.5 7.2A3.4 3.4 0 0 0 8 17.5V21"/>',
    mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 7 9 6 9-6"/>',
    rss: '<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
    'arrow-up': '<path d="M12 19V5"/><path d="m5.5 11.5 6.5-6.5 6.5 6.5"/>',
    'arrow-left': '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    heart: '<path d="M12 20s-7.5-4.7-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3c0 4.9-7.5 9.6-7.5 9.6Z"/>',
    pen: '<path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m14.5 5.5 4 4"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    dot: '<circle cx="12" cy="12" r="4"/>'
  };

  function icon(name, size) {
    var p = ICONS[name] || ICONS.dot;
    var s = size || 18;
    return '<svg class="icon" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" ' +
      'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  /* ==========================================================
   * 工具函数
   * ========================================================== */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(String(s || ''));
    if (!m) return new Date(0);
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  }

  function formatDate(s, style) {
    var d = parseDate(s);
    var y = d.getFullYear(), mo = d.getMonth() + 1, da = d.getDate();
    if (style === 'short') return y + '-' + pad(mo) + '-' + pad(da);
    if (style === 'cn') return y + ' 年 ' + mo + ' 月 ' + da + ' 日';
    if (style === 'md') return pad(mo) + '-' + pad(da);
    return y + '-' + pad(mo) + '-' + pad(da) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function relativeDate(s) {
    var d = parseDate(s);
    var diff = Date.now() - d.getTime();
    var day = 86400000;
    if (diff < 0) return formatDate(s, 'short');
    if (diff < 3600000) return Math.max(1, Math.floor(diff / 60000)) + ' 分钟前';
    if (diff < day) return Math.floor(diff / 3600000) + ' 小时前';
    if (diff < day * 2) return '昨天';
    if (diff < day * 30) return Math.floor(diff / day) + ' 天前';
    if (diff < day * 365) return Math.floor(diff / (day * 30)) + ' 个月前';
    return Math.floor(diff / (day * 365)) + ' 年前';
  }

  function bySlug(slug) {
    for (var i = 0; i < POSTS.length; i++) {
      if (POSTS[i].slug === slug) return POSTS[i];
    }
    return null;
  }

  function query(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }

  function truncate(text, n) {
    var s = String(text || '');
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  /* ==========================================================
   * 计数服务（浏览量 / 点赞）
   * 默认使用浏览器本地存储；如需全站统计，改 SITE.counter.provider
   * ========================================================== */
  var CKEY = 'dream-blog:counter';

  function readStore() {
    try { return JSON.parse(localStorage.getItem(CKEY)) || {}; }
    catch (e) { return {}; }
  }
  function writeStore(o) {
    try { localStorage.setItem(CKEY, JSON.stringify(o)); } catch (e) { /* 忽略隐私模式报错 */ }
  }

  var seed = (SITE.counter && SITE.counter.seed) || { views: 0, likes: 0 };

  var counter = {
    provider: (SITE.counter && SITE.counter.provider) || 'local',

    getViews: function (slug) {
      var s = readStore();
      return (seed.views || 0) + ((s.views && s.views[slug]) || 0);
    },

    /** 每次会话只记一次浏览次数 */
    hitView: function (slug) {
      var skey = 'dream-blog:hit:' + slug;
      try {
        if (sessionStorage.getItem(skey)) return this.getViews(slug);
        sessionStorage.setItem(skey, '1');
      } catch (e) { /* 忽略 */ }
      var s = readStore();
      s.views = s.views || {};
      s.views[slug] = (s.views[slug] || 0) + 1;
      writeStore(s);
      return this.getViews(slug);
    },

    getLikes: function (slug) {
      var s = readStore();
      return (seed.likes || 0) + ((s.likes && s.likes[slug]) || 0);
    },

    isLiked: function (slug) {
      var s = readStore();
      return !!(s.liked && s.liked[slug]);
    },

    toggleLike: function (slug) {
      var s = readStore();
      s.likes = s.likes || {};
      s.liked = s.liked || {};
      var liked = s.liked[slug];
      var cur = s.likes[slug] || 0;
      if (liked) {
        delete s.liked[slug];
        s.likes[slug] = Math.max(0, cur - 1);
      } else {
        s.liked[slug] = 1;
        s.likes[slug] = cur + 1;
      }
      writeStore(s);
      return { liked: !liked, count: this.getLikes(slug) };
    },

    getTotalViews: function () {
      var s = readStore();
      var n = 0;
      var v = s.views || {};
      for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) n += v[k];
      return n + (seed.views || 0) * POSTS.length;
    }
  };

  /* ==========================================================
   * 布局注入
   * ========================================================== */
  function sidebarHTML() {
    var nav = (SITE.nav || []).map(function (item) {
      return '<a class="nav-item" href="' + item.url + '" data-nav="' + item.url + '">' +
        icon(item.icon || 'dot', 18) + '<span>' + esc(item.name) + '</span></a>';
    }).join('');

    var recent = POSTS.slice(0, 5).map(function (p) {
      return '<a class="recent-item" href="post.html?slug=' + encodeURIComponent(p.slug) + '">' +
        '<span class="recent-dot"></span>' +
        '<span class="recent-title">' + esc(truncate(p.title, 20)) + '</span></a>';
    }).join('');

    var social = (SITE.social || []).map(function (s) {
      return '<a class="social-link" href="' + s.url + '" title="' + esc(s.name) + '" ' +
        (s.url.indexOf('http') === 0 ? 'target="_blank" rel="noopener noreferrer"' : '') + '>' +
        icon(s.icon || 'dot', 18) + '</a>';
    }).join('');

    var profile = SITE.profile || {};

    return '' +
      '<div class="sidebar-inner">' +
        '<div class="profile">' +
          '<a class="avatar" href="index.html">' +
            '<img src="' + (profile.avatar || 'assets/img/avatar.svg') + '" alt="' + esc(SITE.author) + '">' +
          '</a>' +
          '<a class="profile-name" href="index.html">' + esc(SITE.author) + '</a>' +
          '<p class="profile-bio">' + esc(profile.bio || '') + '</p>' +
        '</div>' +

        (SITE.features && SITE.features.search ?
          '<form class="side-search" role="search" data-search-form>' +
            icon('search', 16) +
            '<input type="search" name="q" placeholder="搜索文章…" aria-label="站内搜索" data-search-input>' +
          '</form>' : '') +

        '<nav class="side-nav" aria-label="主导航">' + nav + '</nav>' +

        '<div class="side-block">' +
          '<h3 class="side-title">' + icon('layers', 14) + '站点统计</h3>' +
          '<div class="stat-grid">' +
            '<div class="stat"><b>' + (META.total || POSTS.length) + '</b><span>文章</span></div>' +
            '<div class="stat"><b>' + ((META.categories || []).length) + '</b><span>分类</span></div>' +
            '<div class="stat"><b>' + ((META.tags || []).length) + '</b><span>标签</span></div>' +
            '<div class="stat"><b>' + formatWords(META.totalWords || 0) + '</b><span>总字数</span></div>' +
          '</div>' +
        '</div>' +

        (POSTS.length ?
          '<div class="side-block">' +
            '<h3 class="side-title">' + icon('pen', 14) + '最近文章</h3>' +
            '<div class="recent-list">' + recent + '</div>' +
          '</div>' : '') +

        '<div class="side-footer">' +
          '<div class="socials">' + social + '</div>' +
          (SITE.features && SITE.features.darkMode ?
            '<button class="theme-btn" type="button" data-theme-toggle aria-label="切换深浅色">' +
              '<span class="theme-icon-light">' + icon('sun', 16) + '</span>' +
              '<span class="theme-icon-dark">' + icon('moon', 16) + '</span>' +
            '</button>' : '') +
        '</div>' +
      '</div>';
  }

  function headerHTML() {
    return '' +
      '<div class="header-inner">' +
        '<button class="icon-btn" type="button" data-drawer-open aria-label="打开菜单">' + icon('menu', 20) + '</button>' +
        '<a class="header-title" href="index.html">' + esc(SITE.title) + '</a>' +
        '<div class="header-actions">' +
          (SITE.features && SITE.features.search ?
            '<a class="icon-btn" href="search.html" aria-label="搜索">' + icon('search', 20) + '</a>' : '') +
          (SITE.features && SITE.features.darkMode ?
            '<button class="icon-btn" type="button" data-theme-toggle aria-label="切换深浅色">' +
              '<span class="theme-icon-light">' + icon('sun', 20) + '</span>' +
              '<span class="theme-icon-dark">' + icon('moon', 20) + '</span>' +
            '</button>' : '') +
        '</div>' +
      '</div>';
  }

  function footerHTML() {
    var since = SITE.since || new Date().getFullYear();
    var now = new Date().getFullYear();
    var years = since < now ? since + ' – ' + now : String(since);
    return '' +
      '<div class="footer-inner">' +
        '<div class="footer-line">' +
          '© ' + years + ' ' + esc(SITE.author) + ' · ' + esc(SITE.title) +
        '</div>' +
        '<div class="footer-line footer-meta">' +
          '<span>' + (META.total || POSTS.length) + ' 篇文章 · ' + formatWords(META.totalWords || 0) + ' 字</span>' +
          '<span class="sep">·</span>' +
          '<span>累计阅读 <b data-total-views>—</b> 次</span>' +
          '<span class="sep">·</span>' +
          '<span>由 Markdown 驱动</span>' +
        '</div>' +
      '</div>';
  }

  function formatWords(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + ' 万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  /* ==========================================================
   * 主题
   * ========================================================== */
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) { /* 忽略 */ }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#16181c' : '#ffffff');
  }

  function initTheme() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-theme-toggle]') : null;
      if (!btn) return;
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  /* ==========================================================
   * 移动端抽屉
   * ========================================================== */
  function initDrawer(sidebar) {
    if (!sidebar) return;
    var mask = document.createElement('div');
    mask.className = 'drawer-mask';
    document.body.appendChild(mask);

    function open() { document.body.classList.add('drawer-open'); }
    function close() { document.body.classList.remove('drawer-open'); }

    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      if (e.target.closest('[data-drawer-open]')) { open(); return; }
      if (e.target.closest('[data-drawer-close]') || e.target === mask) { close(); return; }
      if (e.target.closest('.side-nav a')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ==========================================================
   * 搜索
   * ========================================================== */
  function initSearch() {
    document.addEventListener('submit', function (e) {
      var form = e.target.closest ? e.target.closest('[data-search-form]') : null;
      if (!form) return;
      e.preventDefault();
      var input = form.querySelector('[data-search-input]');
      var q = input ? input.value.trim() : '';
      if (!q) return;
      location.href = 'search.html?q=' + encodeURIComponent(q);
    });
  }

  function searchPosts(keyword) {
    var index = window.BLOG_SEARCH_INDEX || [];
    var q = String(keyword || '').trim().toLowerCase();
    if (!q) return [];
    var terms = q.split(/\s+/).filter(Boolean);

    return index.map(function (item) {
      var title = item.title.toLowerCase();
      var tags = (item.tags || []).join(' ').toLowerCase();
      var cats = (item.categories || []).join(' ').toLowerCase();
      var text = (item.text || '').toLowerCase();
      var score = 0;
      var matched = true;

      terms.forEach(function (t) {
        var s = 0;
        if (title.indexOf(t) !== -1) s += 100;
        if (title === t) s += 50;
        if (tags.indexOf(t) !== -1) s += 40;
        if (cats.indexOf(t) !== -1) s += 30;
        var idx = text.indexOf(t);
        if (idx !== -1) s += Math.max(6, 24 - Math.floor(idx / 200));
        if (s === 0) matched = false;
        score += s;
      });

      return matched && score > 0 ? { item: item, score: score } : null;
    })
      .filter(Boolean)
      .sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return a.item.date < b.item.date ? 1 : -1;
      })
      // 搜索索引只存了必要字段，这里换回完整文章对象，
      // 让列表卡片能拿到字数 / 阅读时长 / 分类等元信息
      .map(function (r) { return bySlug(r.item.slug) || r.item; });
  }

  /* ==========================================================
   * 代码复制 / 回到顶部
   * ========================================================== */
  function initCodeCopy(scope) {
    (scope || document).addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-copy]') : null;
      if (!btn) return;
      var block = btn.closest('.code-block');
      var code = block && block.querySelector('code');
      if (!code) return;
      var text = code.innerText;
      var done = function () {
        btn.textContent = '已复制';
        btn.classList.add('is-done');
        setTimeout(function () {
          btn.textContent = '复制';
          btn.classList.remove('is-done');
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* 忽略 */ }
    document.body.removeChild(ta);
  }

  function initBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;
    function sync() {
      if (window.scrollY > 400) btn.classList.add('is-visible');
      else btn.classList.remove('is-visible');
    }
    window.addEventListener('scroll', sync, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    sync();
  }

  /* ==========================================================
   * 组件片段
   * ========================================================== */
  function metaLine(post, opts) {
    opts = opts || {};
    var parts = [];
    parts.push('<span class="m-item">' + icon('calendar', 14) +
      '<time datetime="' + post.dateOnly + '">' +
      (opts.relative ? relativeDate(post.date) : formatDate(post.date, 'short')) +
      '</time></span>');

    if (post.categories && post.categories.length) {
      parts.push('<span class="m-item">' + icon('folder', 14) +
        post.categories.map(function (c) {
          return '<a class="m-link" href="category.html?name=' + encodeURIComponent(c) + '">' + esc(c) + '</a>';
        }).join('、') + '</span>');
    }

    if (SITE.features && SITE.features.readingTime) {
      parts.push('<span class="m-item">' + icon('clock', 14) +
        '<span>' + post.minutes + ' 分钟</span>' +
        '<span class="m-words">' + post.words + ' 字</span></span>');
    }
    return '<div class="meta-line">' + parts.join('') + '</div>';
  }

  function tagsHtml(tags) {
    if (!tags || !tags.length) return '';
    return '<div class="tag-line">' + tags.map(function (t) {
      return '<a class="tag" href="tag.html?name=' + encodeURIComponent(t) + '">' +
        '<span class="tag-hash">#</span>' + esc(t) + '</a>';
    }).join('') + '</div>';
  }

  function cardHtml(post, index) {
    return '' +
      '<article class="post-card" style="--i:' + (index || 0) + '">' +
        '<div class="card-accent" aria-hidden="true"></div>' +
        '<h2 class="card-title">' +
          '<a href="post.html?slug=' + encodeURIComponent(post.slug) + '">' + esc(post.title) + '</a>' +
        '</h2>' +
        metaLine(post, { relative: true }) +
        '<p class="card-excerpt">' + esc(post.excerpt) + '</p>' +
        '<div class="card-foot">' +
          tagsHtml(post.tags) +
          '<a class="read-more" href="post.html?slug=' + encodeURIComponent(post.slug) + '">' +
            '阅读全文' + icon('arrow-right', 14) + '</a>' +
        '</div>' +
      '</article>';
  }

  function emptyState(text, sub) {
    return '<div class="empty-state">' +
      '<div class="empty-icon">' + icon('search', 28) + '</div>' +
      '<p class="empty-title">' + esc(text) + '</p>' +
      (sub ? '<p class="empty-sub">' + esc(sub) + '</p>' : '') +
      '<a class="btn" href="index.html">返回首页</a>' +
      '</div>';
  }

  function paginationHtml(current, total, makeHref) {
    if (total <= 1) return '';
    var html = '<nav class="pagination" aria-label="分页">';

    html += current > 1
      ? '<a class="page-btn" href="' + makeHref(current - 1) + '">' + icon('arrow-left', 16) + '上一页</a>'
      : '<span class="page-btn is-disabled">' + icon('arrow-left', 16) + '上一页</span>';

    for (var i = 1; i <= total; i++) {
      html += i === current
        ? '<span class="page-num is-active">' + i + '</span>'
        : '<a class="page-num" href="' + makeHref(i) + '">' + i + '</a>';
    }

    html += current < total
      ? '<a class="page-btn" href="' + makeHref(current + 1) + '">下一页' + icon('arrow-right', 16) + '</a>'
      : '<span class="page-btn is-disabled">下一页' + icon('arrow-right', 16) + '</span>';

    return html + '</nav>';
  }

  function headingHtml(title, sub, iconName) {
    return '<div class="page-head">' +
      '<h1 class="page-title">' + (iconName ? icon(iconName, 22) : '') + esc(title) + '</h1>' +
      (sub ? '<p class="page-sub">' + esc(sub) + '</p>' : '') +
      '</div>';
  }

  /* ==========================================================
   * 初始化
   * ========================================================== */
  function markActiveNav() {
    var page = document.body.getAttribute('data-page');
    var map = {
      home: 'index.html',
      archive: 'archive.html',
      categories: 'categories.html',
      category: 'categories.html',
      tags: 'tags.html',
      tag: 'tags.html',
      about: 'about.html',
      search: 'search.html'
    };
    var target = map[page];
    if (!target) return;
    var link = document.querySelector('[data-nav="' + target + '"]');
    if (link) link.classList.add('is-active');
  }

  function renderLayout() {
    var header = document.getElementById('site-header');
    var sidebar = document.getElementById('site-sidebar');
    var footer = document.getElementById('site-footer');
    var topBtn = document.getElementById('back-to-top');

    if (header) header.innerHTML = headerHTML();
    if (sidebar) sidebar.innerHTML = sidebarHTML();
    if (footer) footer.innerHTML = footerHTML();
    if (topBtn && !topBtn.innerHTML.trim()) topBtn.innerHTML = icon('arrow-up', 18);

    markActiveNav();
    initDrawer(sidebar);

    var total = document.querySelector('[data-total-views]');
    if (total) total.textContent = counter.getTotalViews().toLocaleString('zh-CN');
  }

  /* 首屏防闪烁：尽早在 <head> 内联执行 */
  window.__applyTheme = setTheme;

  window.Blog = {
    site: SITE,
    posts: POSTS,
    meta: META,
    icon: icon,
    esc: esc,
    formatDate: formatDate,
    relativeDate: relativeDate,
    formatWords: formatWords,
    bySlug: bySlug,
    query: query,
    truncate: truncate,
    counter: counter,
    searchPosts: searchPosts,
    cardHtml: cardHtml,
    tagsHtml: tagsHtml,
    metaLine: metaLine,
    paginationHtml: paginationHtml,
    headingHtml: headingHtml,
    emptyState: emptyState,
    setTheme: setTheme,
    getTheme: currentTheme,
    renderLayout: renderLayout,
    initCodeCopy: initCodeCopy
  };

  function boot() {
    renderLayout();
    initTheme();
    initSearch();
    initCodeCopy(document);
    initBackToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
