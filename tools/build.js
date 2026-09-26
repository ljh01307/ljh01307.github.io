#!/usr/bin/env node
/* ============================================================
 * 构建脚本（零依赖）
 *   1. 解析 source/_posts/*.md 的 front-matter
 *   2. 生成 data/posts.js        —— 文章数据（浏览器端渲染正文）
 *   3. 生成 data/search-index.js —— 站内搜索索引
 *   4. 生成 feed.xml / sitemap.xml
 *
 * 用法：  node tools/build.js
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const DATA_DIR = path.join(ROOT, 'data');

const MiniMarkdown = require(path.join(ROOT, 'assets', 'js', 'markdown.js'));

/* ---------- 读取站点配置 ---------- */
function loadSite() {
  const src = fs.readFileSync(path.join(DATA_DIR, 'site.js'), 'utf8');
  const sandbox = { window: {} };
  // 站点配置是纯数据字面量，用 Function 求值即可，不引入额外依赖
  new Function('window', src)(sandbox.window);
  return sandbox.window.SITE;
}

/* ---------- front-matter ---------- */
function clean(v) {
  let s = String(v).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

function parseFrontMatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!m) return { data: {}, body: raw };

  const data = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (/^\s*$/.test(line) || /^\s*#/.test(line)) continue;

    const listItem = /^\s*-\s+(.+)$/.exec(line);
    if (listItem && key) {
      if (!Array.isArray(data[key])) data[key] = [];
      data[key].push(clean(listItem[1]));
      continue;
    }

    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    key = kv[1];
    const raw2 = kv[2].trim();

    if (raw2 === '') { data[key] = ''; continue; }

    if (/^\[[\s\S]*\]$/.test(raw2)) {
      data[key] = raw2
        .slice(1, -1)
        .split(',')
        .map((s) => clean(s))
        .filter(Boolean);
    } else {
      data[key] = clean(raw2);
    }
  }
  return { data, body: raw.slice(m[0].length) };
}

/* ---------- 字数与阅读时长 ---------- */
function countWords(text) {
  const plain = MiniMarkdown.toPlainText(text);
  const cjk = (plain.match(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  const latin = (plain.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || []).length;
  return cjk + latin;
}

function readingMinutes(words) {
  return Math.max(1, Math.round(words / 350));
}

/* ---------- 日期 ---------- */
function parseDate(value, fallbackFromName) {
  const s = String(value || fallbackFromName || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(s);
  if (!m) return new Date(0);
  return new Date(
    Number(m[1]), Number(m[2]) - 1, Number(m[3]),
    Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)
  );
}

function pad(n) { return String(n).padStart(2, '0'); }

function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function toISODateOnly(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toRFC822(d) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const oh = pad(Math.floor(Math.abs(offset) / 60));
  const om = pad(Math.abs(offset) % 60);
  return `${days[d.getDay()]}, ${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${sign}${oh}${om}`;
}

/* ---------- 读取稿件 ---------- */
function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`[build] 找不到稿件目录：${POSTS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => /\.(md|markdown)$/i.test(f) && !f.startsWith('_'));

  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, body } = parseFrontMatter(raw);

    const baseName = file.replace(/\.(md|markdown)$/i, '');
    const dateFromName = (/^(\d{4}-\d{2}-\d{2})/.exec(baseName) || [])[1] || '';
    const slug = baseName.replace(/^\d{4}-\d{2}-\d{2}-/, '') || baseName;

    const date = parseDate(data.date, dateFromName);
    const plain = MiniMarkdown.toPlainText(body);

    const categories = Array.isArray(data.categories)
      ? data.categories
      : data.categories ? [data.categories] : [];
    const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [];

    // 摘要：优先取 front-matter，否则取正文第一个非标题段落
    let excerpt = data.excerpt || '';
    if (!excerpt) {
      const firstBlock = body
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .find((b) => b && !/^#{1,6}\s/.test(b) && !/^```/.test(b) && !/^>/.test(b) &&
          !/^!\[/.test(b) && !/^\s*([-*+]|\d+[.)])\s+/.test(b));
      excerpt = MiniMarkdown.toPlainText(firstBlock || plain);
    }
    if (excerpt.length > 110) excerpt = excerpt.slice(0, 110).trim() + '…';

    const words = countWords(body);

    posts.push({
      slug,
      title: data.title || baseName,
      date: toISODate(date),
      dateOnly: toISODateOnly(date),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      timestamp: date.getTime(),
      categories,
      tags,
      series: data.series || '',
      excerpt,
      words,
      minutes: readingMinutes(words),
      content: body.trim()
    });
  }

  posts.sort((a, b) => b.timestamp - a.timestamp);
  return posts;
}

/* ---------- 分类 / 标签聚合 ---------- */
function aggregate(posts, field) {
  const map = new Map();
  for (const p of posts) {
    for (const name of p[field]) {
      const item = map.get(name) || { name, count: 0, posts: [] };
      item.count++;
      item.posts.push(p.slug);
      map.set(name, item);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-Hans-CN'));
}

/* ---------- 输出 ---------- */
function write(fileName, content) {
  const target = path.join(DATA_DIR, fileName);
  fs.writeFileSync(target, content, 'utf8');
  const kb = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1);
  console.log(`  ✓ data/${fileName}  (${kb} KB)`);
}

function jsonArray(value) {
  return JSON.stringify(value, null, 0);
}

function build() {
  const site = loadSite();
  const posts = loadPosts();

  console.log(`\n[build] ${site.title} — 共 ${posts.length} 篇文章\n`);

  const categories = aggregate(posts, 'categories').map((c) => ({ name: c.name, count: c.count }));
  const tags = aggregate(posts, 'tags').map((t) => ({ name: t.name, count: t.count }));

  const meta = {
    generatedAt: toISODate(new Date()),
    total: posts.length,
    totalWords: posts.reduce((s, p) => s + p.words, 0),
    categories,
    tags,
    years: [...new Set(posts.map((p) => p.year))].sort((a, b) => b - a)
  };

  /* --- posts.js --- */
  write(
    'posts.js',
    '/* 由 tools/build.js 自动生成，请勿手工编辑 */\n' +
    'window.BLOG_POSTS = ' + jsonArray(posts) + ';\n' +
    'window.BLOG_META = ' + jsonArray(meta) + ';\n'
  );

  /* --- search-index.js --- */
  const index = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.dateOnly,
    categories: p.categories,
    tags: p.tags,
    excerpt: p.excerpt,
    text: (MiniMarkdown.toPlainText(p.content) + ' ' + p.content).slice(0, 4000)
  }));
  write(
    'search-index.js',
    '/* 由 tools/build.js 自动生成，请勿手工编辑 */\n' +
    'window.BLOG_SEARCH_INDEX = ' + jsonArray(index) + ';\n'
  );

  /* --- feed.xml --- */
  const base = String(site.baseUrl || '').replace(/\/+$/, '');
  const items = posts.slice(0, 20).map((p) => {
    const link = `${base}/post.html?slug=${encodeURIComponent(p.slug)}`;
    const d = new Date(p.timestamp);
    return [
      '    <item>',
      `      <title>${escapeXml(p.title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      `      <pubDate>${toRFC822(d)}</pubDate>`,
      ...p.categories.map((c) => `      <category>${escapeXml(c)}</category>`),
      `      <description>${escapeXml(p.excerpt)}</description>`,
      '    </item>'
    ].join('\n');
  }).join('\n');

  const feed = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(site.title)}</title>`,
    `    <link>${base}/</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    `    <language>${site.language}</language>`,
    `    <lastBuildDate>${toRFC822(new Date())}</lastBuildDate>`,
    `    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>`,
    items,
    '  </channel>',
    '</rss>',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'feed.xml'), feed, 'utf8');
  console.log('  ✓ feed.xml');

  /* --- sitemap.xml --- */
  const staticPages = ['index.html', 'archive.html', 'categories.html', 'tags.html', 'about.html'];
  const urls = [
    ...staticPages.map((p) => `  <url><loc>${base}/${p}</loc><changefreq>weekly</changefreq></url>`),
    ...posts.map((p) =>
      `  <url><loc>${base}/post.html?slug=${encodeURIComponent(p.slug)}</loc>` +
      `<lastmod>${p.dateOnly}</lastmod></url>`)
  ].join('\n');

  fs.writeFileSync(
    path.join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'utf8'
  );
  console.log('  ✓ sitemap.xml');

  /* --- HTML 页面外壳 --- */
  writePages(site);

  /* --- 控制台报告 --- */
  console.log('\n  分类：' + categories.map((c) => `${c.name}(${c.count})`).join('  '));
  console.log('  标签：' + tags.map((t) => `${t.name}(${t.count})`).join('  '));
  console.log(`  累计字数：${meta.totalWords.toLocaleString('zh-CN')}\n`);
  console.log('[build] 完成。\n');
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/* ---------- 生成 HTML 页面外壳 ----------
 * 所有页面共用同一套骨架，只是 data-page 与脚本不同，
 * 因此由构建脚本统一产出，避免手工维护多份重复标记。
 */
function writePages(site) {
  const THEME_BOOT = `<script>
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (!t) { t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
</script>`;

  const pages = [
    { file: 'index.html', page: 'home', title: `${site.title} · ${site.subtitle}`, desc: site.description },
    { file: 'archive.html', page: 'archive', title: `归档 · ${site.title}`, desc: '按时间线浏览全部文章' },
    { file: 'categories.html', page: 'categories', title: `分类 · ${site.title}`, desc: '按栏目浏览文章' },
    { file: 'category.html', page: 'category', title: `分类 · ${site.title}`, desc: '某个分类下的全部文章' },
    { file: 'tags.html', page: 'tags', title: `标签 · ${site.title}`, desc: '全部标签' },
    { file: 'tag.html', page: 'tag', title: `标签 · ${site.title}`, desc: '某个标签下的全部文章' },
    { file: 'search.html', page: 'search', title: `搜索 · ${site.title}`, desc: '站内搜索', extra: ['search-index'] },
    { file: 'about.html', page: 'about', title: `关于 · ${site.title}`, desc: `关于 ${site.author}` },
    { file: 'post.html', page: 'post', title: `文章 · ${site.title}`, desc: '文章详情', runtime: 'post' },
    { file: '404.html', page: '404', title: `页面不存在 · ${site.title}`, desc: '页面不存在' }
  ];

  for (const p of pages) {
    const scripts = [
      'data/site.js',
      'data/posts.js',
      ...(p.extra || []).map((n) => `data/${n}.js`),
      'assets/js/markdown.js',
      'assets/js/highlight.js',
      'assets/js/site.js',
      `assets/js/${p.runtime || 'pages'}.js`
    ];

    const html = `<!DOCTYPE html>
<html lang="${site.language || 'zh-CN'}" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeXml(p.title)}</title>
<meta name="description" content="${escapeXml(p.desc)}">
<meta name="keywords" content="${escapeXml((site.keywords || []).join(','))}">
<meta name="author" content="${escapeXml(site.author)}">
<meta name="theme-color" content="#ffffff">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeXml(p.title)}">
<meta property="og:description" content="${escapeXml(p.desc)}">
<meta property="og:site_name" content="${escapeXml(site.title)}">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${escapeXml(site.title)} · RSS" href="feed.xml">
<link rel="stylesheet" href="assets/css/style.css">
${THEME_BOOT}
</head>
<body data-page="${p.page}">
<a class="skip-link" href="#main">跳到正文</a>

<header id="site-header"></header>

<div class="layout">
  <aside id="site-sidebar"></aside>
  <main id="main">
    <div class="empty-state">
      <p class="empty-title">正在加载…</p>
      <p class="empty-sub">如果长时间停留在这里，请确认已执行 node tools/build.js</p>
    </div>
  </main>
</div>

<footer id="site-footer"></footer>
<button id="back-to-top" type="button" aria-label="回到顶部"></button>

${scripts.map((s) => `<script src="${s}"></script>`).join('\n')}
</body>
</html>
`;
    fs.writeFileSync(path.join(ROOT, p.file), html, 'utf8');
  }
  console.log(`  ✓ 生成 ${pages.length} 个页面：${pages.map((p) => p.file).join(' ')}`);
}

build();
