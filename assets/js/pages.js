/* ============================================================
 * pages.js —— 各页面内容渲染
 * 依据 <body data-page="..."> 分发
 * ============================================================ */
(function () {
  'use strict';

  var B = window.Blog;
  if (!B) return;

  var POSTS = B.posts;
  var SITE = B.site;
  var main = document.getElementById('main');
  if (!main) return;

  var PAGE_SIZE = SITE.pageSize || 6;
  var icon = B.icon;
  var esc = B.esc;

  /* ---------- 公共片段 ---------- */
  function postRow(post) {
    return '<a class="row" href="post.html?slug=' + encodeURIComponent(post.slug) + '">' +
      '<time class="row-date" datetime="' + post.dateOnly + '">' + B.formatDate(post.date, 'short') + '</time>' +
      '<span class="row-title">' + esc(post.title) + '</span>' +
      '<span class="row-cat">' + esc((post.categories || [])[0] || '') + '</span>' +
    '</a>';
  }

  function postRows(list) {
    if (!list.length) return B.emptyState('这里还没有文章');
    return '<div class="post-rows">' + list.map(postRow).join('') + '</div>';
  }

  function listWithPagination(list, currentPage, hrefFor) {
    var total = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    var page = Math.min(Math.max(1, currentPage), total);
    var slice = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return '<div class="post-list">' + slice.map(function (p, i) { return B.cardHtml(p, i); }).join('') + '</div>' +
      B.paginationHtml(page, total, hrefFor);
  }

  /* ==========================================================
   * 首页
   * ========================================================== */
  function renderHome() {
    var page = parseInt(B.query('page'), 10) || 1;
    var sortKey = B.query('sort') || 'date';
    var list = POSTS.slice();

    if (sortKey === 'hot') {
      list.sort(function (a, b) {
        return (B.counter.getViews(b.slug) - B.counter.getViews(a.slug)) || (b.timestamp - a.timestamp);
      });
    }

    var meta = B.meta;
    var latest = POSTS[0];

    var hero = '<section class="hero">' +
      '<p class="hero-eyebrow">' + esc(SITE.subtitle) + '</p>' +
      '<h1 class="hero-title">' + esc(SITE.title) + '</h1>' +
      '<p class="hero-desc">' + esc(SITE.description) + '</p>' +
      '<div class="hero-stats">' +
        '<span>' + (meta.total || POSTS.length) + ' 篇文章</span>' +
        '<span class="sep">·</span>' +
        '<span>' + B.formatWords(meta.totalWords || 0) + ' 字</span>' +
        (latest ? '<span class="sep">·</span><span>最近更新 ' + B.relativeDate(latest.date) + '</span>' : '') +
      '</div>' +
    '</section>';

    var bar = '<div class="list-bar">' +
      '<h2 class="list-title">' + icon('layers', 16) +
        (sortKey === 'hot' ? '热门文章' : '最新文章') + '</h2>' +
      '<div class="list-switch">' +
        '<a class="switch-item' + (sortKey === 'date' ? ' is-active' : '') + '" href="index.html">最新</a>' +
        '<a class="switch-item' + (sortKey === 'hot' ? ' is-active' : '') + '" href="index.html?sort=hot">热门</a>' +
      '</div>' +
    '</div>';

    main.innerHTML = hero + bar + listWithPagination(list, page, function (n) {
      return 'index.html?page=' + n + (sortKey === 'hot' ? '&sort=hot' : '');
    });
  }

  /* ==========================================================
   * 归档
   * ========================================================== */
  function renderArchive() {
    var groups = {};
    POSTS.forEach(function (p) {
      var y = p.year;
      var m = p.month;
      groups[y] = groups[y] || {};
      groups[y][m] = groups[y][m] || [];
      groups[y][m].push(p);
    });

    var years = Object.keys(groups).map(Number).sort(function (a, b) { return b - a; });

    var html = B.headingHtml('归档', '共 ' + POSTS.length + ' 篇文章，' +
      years.length + ' 个年份', 'archive');

    html += '<div class="archive">';
    years.forEach(function (y) {
      var months = Object.keys(groups[y]).map(Number).sort(function (a, b) { return b - a; });
      var yearCount = months.reduce(function (s, m) { return s + groups[y][m].length; }, 0);

      html += '<section class="archive-year">' +
        '<h2 class="year-head"><span class="year-num">' + y + '</span>' +
        '<span class="year-count">' + yearCount + ' 篇</span></h2>';

      months.forEach(function (m) {
        html += '<div class="archive-month">' +
          '<h3 class="month-head">' + m + ' 月</h3>' +
          '<div class="timeline">' +
          groups[y][m].map(function (p) {
            return '<a class="timeline-item" href="post.html?slug=' + encodeURIComponent(p.slug) + '">' +
              '<span class="timeline-dot"></span>' +
              '<time>' + B.formatDate(p.date, 'md') + '</time>' +
              '<span class="timeline-title">' + esc(p.title) + '</span>' +
              '<span class="timeline-cat">' + esc((p.categories || [])[0] || '') + '</span>' +
            '</a>';
          }).join('') +
          '</div></div>';
      });

      html += '</section>';
    });
    html += '</div>';

    main.innerHTML = html;
  }

  /* ==========================================================
   * 分类总览
   * ========================================================== */
  function renderCategories() {
    var cats = (B.meta.categories || []).slice();
    cats.sort(function (a, b) { return b.count - a.count; });

    var html = B.headingHtml('分类', '共 ' + cats.length + ' 个分类', 'folder');
    html += '<div class="cat-grid">' + cats.map(function (c) {
      var latest = POSTS.filter(function (p) {
        return (p.categories || []).indexOf(c.name) !== -1;
      })[0];
      return '<a class="cat-card" href="category.html?name=' + encodeURIComponent(c.name) + '">' +
        '<div class="cat-top">' + icon('folder', 20) + '<span class="cat-count">' + c.count + '</span></div>' +
        '<h3 class="cat-name">' + esc(c.name) + '</h3>' +
        (latest ? '<p class="cat-latest">最近：' + esc(B.truncate(latest.title, 16)) + '</p>' : '') +
      '</a>';
    }).join('') + '</div>';

    main.innerHTML = html;
  }

  /* ==========================================================
   * 单个分类
   * ========================================================== */
  function renderCategory() {
    var name = B.query('name');
    var list = POSTS.filter(function (p) {
      return (p.categories || []).indexOf(name) !== -1;
    });

    document.title = (name || '分类') + ' · ' + SITE.title;

    var html = '<nav class="crumb"><a href="categories.html">分类</a>' +
      '<span class="crumb-sep">/</span><span>' + esc(name) + '</span></nav>';
    html += B.headingHtml(name || '未指定分类', list.length + ' 篇文章', 'folder');
    html += postRows(list);

    main.innerHTML = html;
  }

  /* ==========================================================
   * 标签总览
   * ========================================================== */
  function renderTags() {
    var tags = (B.meta.tags || []).slice();
    var max = tags.reduce(function (m, t) { return Math.max(m, t.count); }, 1);
    var min = tags.reduce(function (m, t) { return Math.min(m, t.count); }, max);

    var html = B.headingHtml('标签', '共 ' + tags.length + ' 个标签', 'tag');
    html += '<div class="tag-cloud">' + tags.map(function (t) {
      var ratio = max === min ? 0.6 : (t.count - min) / (max - min);
      var size = (0.85 + ratio * 0.55).toFixed(2);
      return '<a class="cloud-tag" style="font-size:' + size + 'rem" ' +
        'href="tag.html?name=' + encodeURIComponent(t.name) + '">' +
        '<span class="tag-hash">#</span>' + esc(t.name) +
        '<sup class="cloud-count">' + t.count + '</sup></a>';
    }).join('') + '</div>';

    main.innerHTML = html;
  }

  /* ==========================================================
   * 单个标签
   * ========================================================== */
  function renderTag() {
    var name = B.query('name');
    var list = POSTS.filter(function (p) {
      return (p.tags || []).indexOf(name) !== -1;
    });

    document.title = (name || '标签') + ' · ' + SITE.title;

    var html = '<nav class="crumb"><a href="tags.html">标签</a>' +
      '<span class="crumb-sep">/</span><span>' + esc(name) + '</span></nav>';
    html += B.headingHtml('#' + (name || ''), list.length + ' 篇文章', 'tag');
    html += postRows(list);

    main.innerHTML = html;
  }

  /* ==========================================================
   * 搜索
   * ========================================================== */
  function renderSearch() {
    var q = B.query('q');
    document.title = (q ? q + ' · 搜索' : '搜索') + ' · ' + SITE.title;

    var html = '<div class="page-head">' +
      '<h1 class="page-title">' + icon('search', 22) + '站内搜索</h1>' +
      '<p class="page-sub">支持标题、标签、分类与正文内容的模糊匹配</p>' +
    '</div>';

    html += '<form class="search-box" role="search" data-search-form>' +
      icon('search', 18) +
      '<input type="search" name="q" value="' + esc(q) + '" placeholder="输入关键词，例如：Hexo、随笔、性能优化" ' +
        'aria-label="搜索关键词" data-search-input autofocus>' +
      '<button class="btn btn-primary" type="submit">搜索</button>' +
    '</form>';

    if (!q) {
      var hot = (B.meta.tags || []).slice(0, 10);
      html += '<div class="side-block side-block-inline"><h3 class="side-title">' +
        icon('tag', 14) + '试试这些标签</h3><div class="tag-line">' +
        hot.map(function (t) {
          return '<a class="tag" href="search.html?q=' + encodeURIComponent(t.name) + '">' +
            '<span class="tag-hash">#</span>' + esc(t.name) + '</a>';
        }).join('') + '</div></div>';
      html += '<div class="side-block side-block-inline"><h3 class="side-title">' +
        icon('pen', 14) + '最近文章</h3><div class="post-rows">' +
        POSTS.slice(0, 5).map(postRow).join('') + '</div></div>';
      main.innerHTML = html;
      bindSearchInput();
      return;
    }

    var results = B.searchPosts(q);
    html += '<div class="search-result-head">' +
      (results.length
        ? '找到 <b>' + results.length + '</b> 篇与「' + esc(q) + '」相关的文章'
        : '没有找到与「' + esc(q) + '」相关的文章') +
    '</div>';

    html += results.length
      ? '<div class="post-list">' + results.map(function (p, i) { return B.cardHtml(p, i); }).join('') + '</div>'
      : B.emptyState('换个关键词试试', '可以试试标题里的词，或者标签、分类名');

    main.innerHTML = html;
    bindSearchInput();
  }

  function bindSearchInput() {
    var input = main.querySelector('[data-search-input]');
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  /* ==========================================================
   * 关于
   * ========================================================== */
  function renderAbout() {
    var profile = SITE.profile || {};
    var text = profile.about || '';
    var rendered = window.MiniMarkdown
      ? window.MiniMarkdown.render(text)
      : { html: '<p>' + esc(text) + '</p>' };

    var html = '<article class="about-card">' +
      '<div class="about-head">' +
        '<img class="about-avatar" src="' + (profile.avatar || 'assets/img/avatar.svg') + '" alt="' + esc(SITE.author) + '">' +
        '<div class="about-id">' +
          '<h1 class="about-name">' + esc(SITE.author) + '</h1>' +
          '<p class="about-sub">' + esc(SITE.subtitle) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="post-content about-content">' + rendered.html + '</div>' +
    '</article>';

    var socials = (SITE.social || []).map(function (s) {
      return '<a class="social-card" href="' + s.url + '"' +
        (s.url.indexOf('http') === 0 ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        icon(s.icon || 'dot', 20) + '<span>' + esc(s.name) + '</span></a>';
    }).join('');

    html += '<section class="about-links"><h2 class="list-title">' +
      icon('mail', 16) + '找到我</h2><div class="social-grid">' + socials + '</div></section>';

    html += '<section class="about-links"><h2 class="list-title">' +
      icon('layers', 16) + '这个站怎么用</h2>' +
      '<div class="guide-grid">' +
        guide('archive', '按时间翻', '归档页按年月排列全部文章', 'archive.html') +
        guide('folder', '按栏目翻', '随笔 / 小说 / 项目心得 三个分类', 'categories.html') +
        guide('tag', '按标签翻', '标签页可以快速找到同一主题', 'tags.html') +
        guide('rss', '订阅更新', '用 RSS 阅读器订阅，或者加个书签', 'feed.xml') +
      '</div></section>';

    main.innerHTML = html;
    document.title = '关于 · ' + SITE.title;
  }

  function guide(ic, title, desc, href) {
    return '<a class="guide-card" href="' + href + '">' +
      '<div class="guide-icon">' + icon(ic, 20) + '</div>' +
      '<h3>' + esc(title) + '</h3>' +
      '<p>' + esc(desc) + '</p>' +
    '</a>';
  }

  /* ==========================================================
   * 404
   * ========================================================== */
  function render404() {
    main.innerHTML = '<div class="empty-state empty-404">' +
      '<div class="empty-code">404</div>' +
      '<p class="empty-title">这个页面不存在</p>' +
      '<p class="empty-sub">可能链接已经失效，或者文章被移走了</p>' +
      '<div class="empty-actions">' +
        '<a class="btn btn-primary" href="index.html">回首页</a>' +
        '<a class="btn" href="archive.html">看归档</a>' +
      '</div>' +
    '</div>';
  }

  /* ---------- 分发 ---------- */
  var routes = {
    home: renderHome,
    archive: renderArchive,
    categories: renderCategories,
    category: renderCategory,
    tags: renderTags,
    tag: renderTag,
    search: renderSearch,
    about: renderAbout,
    '404': render404
  };

  var route = routes[document.body.getAttribute('data-page')];
  if (route) route();
})();
