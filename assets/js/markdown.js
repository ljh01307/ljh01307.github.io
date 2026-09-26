/* ============================================================
 * MiniMarkdown —— 零依赖 Markdown 渲染器
 * 同时供浏览器（window.MiniMarkdown）与 Node 构建脚本（require）使用
 * 支持：标题 / 段落 / 粗体 / 斜体 / 删除线 / 行内代码 / 代码块 /
 *       引用 / 有序无序列表（可嵌套）/ 表格 / 分隔线 / 图片 / 链接 / 自动链接
 * ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MiniMarkdown = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HL = null;
  function highlighter() {
    if (HL) return HL;
    if (typeof module === 'object' && module.exports) {
      try { HL = require('./highlight.js'); } catch (e) { HL = null; }
    } else if (typeof self !== 'undefined' && self.MiniHighlight) {
      HL = self.MiniHighlight;
    }
    return HL;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var CJK = /[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]/;

  function slugify(text) {
    var s = String(text)
      .replace(/<[^>]+>/g, '')
      .replace(/`/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^\w\u2e80-\u9fff\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    return s || 'section';
  }

  /* ---------- 行内元素 ---------- */
  function inline(text, ctx) {
    var codes = [];
    var out = escapeHtml(text);

    // 1. 行内代码优先保护
    out = out.replace(/`([^`]+)`/g, function (m, code) {
      codes.push(code);
      return '\u0000IC' + (codes.length - 1) + '\u0000';
    });

    // 2. 图片
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
      function (m, alt, src, title) {
        return '<img src="' + src + '" alt="' + alt + '"' +
          (title ? ' title="' + title + '"' : '') +
          ' loading="lazy" decoding="async">';
      });

    // 3. 链接
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
      function (m, label, href, title) {
        var external = /^https?:\/\//i.test(href);
        return '<a href="' + href + '"' +
          (title ? ' title="' + title + '"' : '') +
          (external ? ' target="_blank" rel="noopener noreferrer"' : '') +
          '>' + label + '</a>';
      });

    // 4. 自动链接
    out = out.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, function (m, pre, url) {
      return pre + '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
    });

    // 5. 强调
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    // 下划线强调只在词边界生效，避免把 post_asset_folder 之类的标识符误判
    out = out.replace(
      /(^|[\s(（【"'「『])(__?)([^_\n]{1,80}?)\2(?=$|[\s)）】"',.。，、；;：:!！?？…—])/g,
      function (m, pre, marks, body) {
        return pre + (marks === '__' ? '<strong>' + body + '</strong>' : '<em>' + body + '</em>');
      }
    );
    out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // 6. 还原行内代码
    out = out.replace(/\u0000IC(\d+)\u0000/g, function (m, i) {
      return '<code class="inline-code">' + escapeHtml(codes[+i]) + '</code>';
    });

    if (ctx) ctx.hasInline = true;
    return out;
  }

  /* ---------- 段落文本拼接（中文之间不加空格） ---------- */
  function joinParagraph(lines) {
    var buf = '';
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      if (!buf) { buf = line; continue; }
      var a = buf.charAt(buf.length - 1);
      var b = line.charAt(0);
      buf += (CJK.test(a) && CJK.test(b)) ? '' : ' ';
      buf += line;
    }
    return buf;
  }

  /* ---------- 表格 ---------- */
  function isTableSep(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line) &&
      line.indexOf('-') !== -1 && line.indexOf('|') !== -1;
  }

  function splitRow(line) {
    var s = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return s.split('|').map(function (c) { return c.trim(); });
  }

  function renderTable(head, sep, rows, ctx) {
    var aligns = splitRow(sep).map(function (c) {
      if (/^:.*:$/.test(c)) return 'center';
      if (/:$/.test(c)) return 'right';
      if (/^:/.test(c)) return 'left';
      return '';
    });
    var html = '<div class="table-wrap"><table><thead><tr>';
    splitRow(head).forEach(function (c, i) {
      html += '<th' + (aligns[i] ? ' style="text-align:' + aligns[i] + '"' : '') + '>' +
        inline(c, ctx) + '</th>';
    });
    html += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr>';
      splitRow(r).forEach(function (c, i) {
        html += '<td' + (aligns[i] ? ' style="text-align:' + aligns[i] + '"' : '') + '>' +
          inline(c, ctx) + '</td>';
      });
      html += '</tr>';
    });
    return html + '</tbody></table></div>';
  }

  /* ---------- 列表 ---------- */
  function renderList(items, ctx) {
    // items: [{indent, ordered, text}]
    var html = '';
    var stack = [];
    var i = 0;

    function closeTo(indent) {
      while (stack.length && stack[stack.length - 1].indent > indent) {
        var lvl = stack.pop();
        html += '</li></' + lvl.tag + '>';
      }
    }

    for (; i < items.length; i++) {
      var it = items[i];
      var tag = it.ordered ? 'ol' : 'ul';
      if (!stack.length) {
        html += '<' + tag + ' class="md-list">';
        stack.push({ indent: it.indent, tag: tag });
        html += '<li>' + inline(it.text, ctx);
      } else if (it.indent > stack[stack.length - 1].indent) {
        html += '<' + tag + ' class="md-list">';
        stack.push({ indent: it.indent, tag: tag });
        html += '<li>' + inline(it.text, ctx);
      } else {
        closeTo(it.indent);
        var top = stack[stack.length - 1];
        if (top && top.tag !== tag) {
          html += '</li></' + top.tag + '>';
          stack.pop();
          html += '<' + tag + ' class="md-list">';
          stack.push({ indent: it.indent, tag: tag });
          html += '<li>' + inline(it.text, ctx);
        } else {
          html += '</li><li>' + inline(it.text, ctx);
        }
      }

      // 若下一项层级更浅，回退
      var next = items[i + 1];
      if (next && next.indent < it.indent) {
        closeTo(next.indent);
      }
    }
    while (stack.length) {
      var lvl = stack.pop();
      html += '</li></' + lvl.tag + '>';
    }
    return html;
  }

  /* ---------- 主渲染 ---------- */
  function render(md, options) {
    options = options || {};
    var maxTocLevel = options.maxTocLevel || 4;
    var text = String(md || '').replace(/\r\n?/g, '\n');

    // 1. 抽出围栏代码块
    var codeStore = [];
    text = text.replace(/^[ \t]*```([^\n`]*)\n([\s\S]*?)^[ \t]*```[ \t]*$/gm,
      function (m, lang, code) {
        codeStore.push({ lang: (lang || '').trim(), code: code.replace(/\n$/, '') });
        return '\u0000CB' + (codeStore.length - 1) + '\u0000';
      });
    // 兼容 ~~~ 围栏
    text = text.replace(/^[ \t]*~~~([^\n~]*)\n([\s\S]*?)^[ \t]*~~~[ \t]*$/gm,
      function (m, lang, code) {
        codeStore.push({ lang: (lang || '').trim(), code: code.replace(/\n$/, '') });
        return '\u0000CB' + (codeStore.length - 1) + '\u0000';
      });

    var lines = text.split('\n');
    var out = [];
    var toc = [];
    var usedIds = {};
    var ctx = {};

    function uniqueId(base) {
      var id = base;
      var n = 2;
      while (usedIds[id]) { id = base + '-' + n; n++; }
      usedIds[id] = true;
      return id;
    }

    var i = 0;
    while (i < lines.length) {
      var line = lines[i];

      // 空行
      if (/^\s*$/.test(line)) { i++; continue; }

      // 代码块占位
      var cbMatch = /^\u0000CB(\d+)\u0000$/.exec(line.trim());
      if (cbMatch) {
        var item = codeStore[+cbMatch[1]];
        var hl = highlighter();
        var body = hl ? hl.highlight(item.code, item.lang) : escapeHtml(item.code);
        var langLabel = item.lang ? escapeHtml(item.lang) : 'text';
        out.push(
          '<figure class="code-block" data-lang="' + langLabel + '">' +
            '<figcaption class="code-head">' +
              '<span class="code-lang">' + langLabel + '</span>' +
              '<button class="code-copy" type="button" data-copy>复制</button>' +
            '</figcaption>' +
            '<pre><code class="language-' + langLabel + '">' + body + '</code></pre>' +
          '</figure>'
        );
        i++;
        continue;
      }

      // 标题
      var h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
      if (h) {
        var level = h[1].length;
        var raw = h[2];
        var plain = raw.replace(/[`*_~]/g, '');
        var id = uniqueId(slugify(plain));
        out.push('<h' + level + ' id="' + id + '">' + inline(raw, ctx) + '</h' + level + '>');
        if (level <= maxTocLevel) {
          toc.push({ id: id, text: plain, level: level });
        }
        i++;
        continue;
      }

      // 分隔线
      if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
        out.push('<hr>');
        i++;
        continue;
      }

      // 表格
      if (line.indexOf('|') !== -1 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        var head = line;
        var sep = lines[i + 1];
        var rows = [];
        var j = i + 2;
        while (j < lines.length && lines[j].indexOf('|') !== -1 && !/^\s*$/.test(lines[j])) {
          rows.push(lines[j]);
          j++;
        }
        out.push(renderTable(head, sep, rows, ctx));
        i = j;
        continue;
      }

      // 引用
      if (/^\s{0,3}>/.test(line)) {
        var quote = [];
        while (i < lines.length && (/^\s{0,3}>/.test(lines[i]) || /^\s*$/.test(lines[i]) && /^\s{0,3}>/.test(lines[i + 1] || ''))) {
          quote.push(lines[i].replace(/^\s{0,3}>\s?/, ''));
          i++;
        }
        var inner = render(quote.join('\n'), options);
        out.push('<blockquote>' + inner.html + '</blockquote>');
        continue;
      }

      // 列表
      if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
        var items = [];
        while (i < lines.length) {
          var lm = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]);
          if (!lm) {
            // 续行
            if (items.length && /^\s+\S/.test(lines[i]) && !/^\s*$/.test(lines[i])) {
              items[items.length - 1].text += ' ' + lines[i].trim();
              i++;
              continue;
            }
            break;
          }
          items.push({
            indent: Math.floor(lm[1].replace(/\t/g, '  ').length / 2),
            ordered: /^\d/.test(lm[2]),
            text: lm[3]
          });
          i++;
        }
        out.push(renderList(items, ctx));
        continue;
      }

      // 段落
      var para = [];
      while (i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        !/^(#{1,6})\s+/.test(lines[i]) &&
        !/^\u0000CB\d+\u0000$/.test(lines[i].trim()) &&
        !/^\s{0,3}>/.test(lines[i]) &&
        !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) &&
        !(lines[i].indexOf('|') !== -1 && i + 1 < lines.length && isTableSep(lines[i + 1])) &&
        !/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      if (para.length) {
        out.push('<p>' + inline(joinParagraph(para), ctx) + '</p>');
      }
    }

    return { html: out.join('\n'), toc: toc };
  }

  /* ---------- 目录树（按层级嵌套） ---------- */
  function buildTocTree(toc) {
    var rootNodes = [];
    var stack = [];
    toc.forEach(function (item) {
      var node = { id: item.id, text: item.text, level: item.level, children: [] };
      while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop();
      if (stack.length) stack[stack.length - 1].children.push(node);
      else rootNodes.push(node);
      stack.push(node);
    });
    return rootNodes;
  }

  /* ---------- 生成目录 HTML ---------- */
  function renderToc(toc) {
    if (!toc.length) return '';
    function walk(nodes) {
      var html = '<ol class="toc-list">';
      nodes.forEach(function (n) {
        html += '<li><a href="#' + n.id + '" data-toc-link="' + n.id + '">' +
          escapeHtml(n.text) + '</a>';
        if (n.children.length) html += walk(n.children);
        html += '</li>';
      });
      return html + '</ol>';
    }
    return walk(buildTocTree(toc));
  }

  /* ---------- 抽取纯文本（搜索索引 / 摘要用） ---------- */
  function toPlainText(md) {
    return String(md || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/~~~[\s\S]*?~~~/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s{0,3}>\s?/gm, '')
      .replace(/^\s*([-*+]|\d+[.)])\s+/gm, '')
      .replace(/[#*_~`|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return {
    render: render,
    renderToc: renderToc,
    buildTocTree: buildTocTree,
    toPlainText: toPlainText,
    slugify: slugify,
    escapeHtml: escapeHtml
  };
});
