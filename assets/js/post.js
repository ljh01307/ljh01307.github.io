/* ============================================================
 * post.js —— 文章详情页
 *   · Markdown 渲染 + 代码高亮（构建期已由同一渲染器校验）
 *   · 目录导航 TOC + 滚动高亮
 *   · 阅读进度条
 *   · 浏览量 / 点赞
 *   · 上下篇导航 / 相关文章
 * ============================================================ */
(function () {
  'use strict';

  var B = window.Blog;
  var MM = window.MiniMarkdown;
  if (!B || !MM) return;

  var SITE = B.site;
  var POSTS = B.posts;
  var main = document.getElementById('main');
  if (!main) return;

  var icon = B.icon;
  var esc = B.esc;

  var slug = B.query('slug');
  var index = -1;
  for (var i = 0; i < POSTS.length; i++) {
    if (POSTS[i].slug === slug) { index = i; break; }
  }

  if (index === -1) {
    document.title = '文章不存在 · ' + SITE.title;
    main.innerHTML = '<div class="empty-state empty-404">' +
      '<div class="empty-code">404</div>' +
      '<p class="empty-title">找不到这篇文章</p>' +
      '<p class="empty-sub">可能是链接不完整，或者文章还没发布</p>' +
      '<div class="empty-actions">' +
        '<a class="btn btn-primary" href="index.html">回首页</a>' +
        '<a class="btn" href="archive.html">看归档</a>' +
      '</div></div>';
    return;
  }

  var post = POSTS[index];
  var prev = POSTS[index + 1] || null;  // 更早的一篇
  var next = POSTS[index - 1] || null;  // 更新的一篇

  document.title = post.title + ' · ' + SITE.title;

  var rendered = MM.render(post.content, { maxTocLevel: 4 });
  var tocHtml = MM.renderToc(rendered.toc);

  /* ---------- 头部 ---------- */
  var crumb = '<nav class="crumb">' +
    '<a href="index.html">首页</a><span class="crumb-sep">/</span>' +
    (post.categories && post.categories.length
      ? '<a href="category.html?name=' + encodeURIComponent(post.categories[0]) + '">' +
        esc(post.categories[0]) + '</a><span class="crumb-sep">/</span>'
      : '') +
    '<span class="crumb-cur">' + esc(B.truncate(post.title, 18)) + '</span>' +
  '</nav>';

  var header = '<header class="post-header">' +
    '<h1 class="post-title">' + esc(post.title) + '</h1>' +
    B.metaLine(post, { relative: false }) +
    (post.series ? '<p class="post-series">' + icon('layers', 14) +
      '<span>系列：' + esc(post.series) + '</span></p>' : '') +
    '<div class="post-tags">' + (post.tags || []).map(function (t) {
      return '<a class="tag" href="tag.html?name=' + encodeURIComponent(t) + '">' +
        '<span class="tag-hash">#</span>' + esc(t) + '</a>';
    }).join('') + '</div>' +
  '</header>';

  /* ---------- 目录 ---------- */
  var tocBlock = tocHtml
    ? '<aside class="toc" aria-label="文章目录">' +
        '<div class="toc-head">' + icon('layers', 14) + '<span>目录</span>' +
          '<button class="toc-toggle" type="button" data-toc-toggle aria-expanded="true" aria-label="折叠目录">' +
            icon('arrow-up', 14) + '</button>' +
        '</div>' +
        '<div class="toc-body" data-toc-body>' + tocHtml + '</div>' +
      '</aside>'
    : '';

  /* ---------- 正文 ---------- */
  var article = '<article class="post-content" id="content">' + rendered.html + '</article>';

  /* ---------- 底部操作条 ---------- */
  var actions = '<div class="post-actions">' +
    '<button class="action-btn like-btn" type="button" data-like>' +
      icon('heart', 18) + '<span class="action-label">点赞</span>' +
      '<span class="action-count" data-like-count>0</span>' +
    '</button>' +
    '<button class="action-btn" type="button" data-copy-link>' +
      icon('arrow-right', 18) + '<span class="action-label">复制链接</span>' +
    '</button>' +
    '<span class="action-stat" title="仅统计本设备上的访问">' +
      icon('eye', 16) + '<span data-view-count>0</span><span class="action-label">次阅读</span>' +
    '</span>' +
  '</div>';

  /* ---------- 上下篇 ---------- */
  var navParts = [];
  if (prev) {
    navParts.push('<a class="pn-item pn-prev" href="post.html?slug=' + encodeURIComponent(prev.slug) + '">' +
      '<span class="pn-label">' + icon('arrow-left', 14) + '上一篇</span>' +
      '<span class="pn-title">' + esc(prev.title) + '</span></a>');
  }
  if (next) {
    navParts.push('<a class="pn-item pn-next" href="post.html?slug=' + encodeURIComponent(next.slug) + '">' +
      '<span class="pn-label">下一篇' + icon('arrow-right', 14) + '</span>' +
      '<span class="pn-title">' + esc(next.title) + '</span></a>');
  }
  var postNav = navParts.length
    ? '<nav class="post-nav" aria-label="上一篇下一篇">' + navParts.join('') + '</nav>'
    : '';

  /* ---------- 相关文章 ---------- */
  var related = POSTS.filter(function (p) {
    if (p.slug === post.slug) return false;
    var sharedCat = (p.categories || []).some(function (c) {
      return (post.categories || []).indexOf(c) !== -1;
    });
    var sharedTag = (p.tags || []).some(function (t) {
      return (post.tags || []).indexOf(t) !== -1;
    });
    return sharedCat || sharedTag;
  }).slice(0, 3);

  var relatedBlock = related.length
    ? '<section class="related"><h2 class="list-title">' + icon('layers', 16) + '相关文章</h2>' +
      '<div class="related-grid">' + related.map(function (p) {
        return '<a class="related-card" href="post.html?slug=' + encodeURIComponent(p.slug) + '">' +
          '<h3>' + esc(p.title) + '</h3>' +
          '<p>' + esc(B.truncate(p.excerpt, 52)) + '</p>' +
          '<span class="related-meta">' + B.formatDate(p.date, 'short') +
            ' · ' + p.minutes + ' 分钟</span>' +
        '</a>';
      }).join('') + '</div></section>'
    : '';

  main.innerHTML =
    '<div class="progress-bar" data-progress></div>' +
    crumb +
    '<div class="post-layout">' +
      '<div class="post-main">' + header + article + actions + postNav + '</div>' +
      tocBlock +
    '</div>' +
    relatedBlock;

  /* ==========================================================
   * 交互
   * ========================================================== */
  var progress = main.querySelector('[data-progress]');
  var tocLinks = [].slice.call(main.querySelectorAll('[data-toc-link]'));
  var headings = tocLinks.map(function (a) {
    return document.getElementById(a.getAttribute('data-toc-link'));
  }).filter(Boolean);

  /* 阅读进度条 */
  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (progress) {
      progress.style.transform = 'scaleX(' + ratio + ')';
      progress.classList.toggle('is-active', ratio > 0.02);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 目录滚动高亮 */
  if (headings.length && 'IntersectionObserver' in window) {
    var current = null;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          if (id === current) return;
          current = id;
          tocLinks.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('data-toc-link') === id);
          });
        }
      });
    }, { rootMargin: '-72px 0px -70% 0px', threshold: 0 });

    headings.forEach(function (h) { observer.observe(h); });
  }

  /* 目录折叠 */
  var tocToggle = main.querySelector('[data-toc-toggle]');
  if (tocToggle) {
    tocToggle.addEventListener('click', function () {
      var box = main.querySelector('.toc');
      var open = box.classList.toggle('is-collapsed');
      tocToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  }

  /* 窄屏下目录默认折叠 */
  if (window.matchMedia('(max-width: 1080px)').matches) {
    var tocBox = main.querySelector('.toc');
    if (tocBox) {
      tocBox.classList.add('is-collapsed');
      var tg = main.querySelector('[data-toc-toggle]');
      if (tg) tg.setAttribute('aria-expanded', 'false');
    }
  }

  /* 点赞 */
  var likeBtn = main.querySelector('[data-like]');
  var likeCount = main.querySelector('[data-like-count]');
  var viewEl = main.querySelector('[data-view-count]');

  function syncCounters() {
    if (likeCount) likeCount.textContent = B.counter.getLikes(post.slug);
    if (likeBtn) likeBtn.classList.toggle('is-liked', B.counter.isLiked(post.slug));
    if (viewEl) viewEl.textContent = B.counter.getViews(post.slug).toLocaleString('zh-CN');
  }
  syncCounters();
  if (viewEl) B.counter.hitView(post.slug);
  syncCounters();

  if (likeBtn) {
    likeBtn.addEventListener('click', function () {
      var r = B.counter.toggleLike(post.slug);
      likeCount.textContent = r.count;
      likeBtn.classList.toggle('is-liked', r.liked);
      likeBtn.classList.add('is-bump');
      setTimeout(function () { likeBtn.classList.remove('is-bump'); }, 380);
    });
  }

  /* 复制链接 */
  var copyLinkBtn = main.querySelector('[data-copy-link]');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', function () {
      var url = location.href;
      var label = copyLinkBtn.querySelector('.action-label');
      var done = function () {
        label.textContent = '已复制';
        copyLinkBtn.classList.add('is-liked');
        setTimeout(function () {
          label.textContent = '复制链接';
          copyLinkBtn.classList.remove('is-liked');
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, done);
      } else {
        done();
      }
    });
  }

  /* 键盘：左右方向键翻页 */
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft' && prev) location.href = 'post.html?slug=' + encodeURIComponent(prev.slug);
    if (e.key === 'ArrowRight' && next) location.href = 'post.html?slug=' + encodeURIComponent(next.slug);
  });
})();
