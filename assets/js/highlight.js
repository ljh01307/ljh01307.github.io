/* ============================================================
 * MiniHighlight —— 零依赖轻量语法高亮
 * 同时供浏览器（window.MiniHighlight）与 Node 构建脚本（require）使用
 * 覆盖常见语言：js / ts / json / css / html / xml / python / bash /
 *              yaml / sql / go / rust / java / c / cpp / markdown
 * ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MiniHighlight = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KEYWORDS = {
    js: 'const let var function return if else for while do switch case break continue new delete typeof instanceof in of class extends super this static get set async await yield try catch finally throw import export from default null undefined true false void false',
    ts: 'const let var function return if else for while do switch case break continue new delete typeof instanceof in of class extends implements interface type enum namespace declare abstract public private protected readonly as any unknown never void null undefined true false async await yield try catch finally throw import export from default satisfies keyof infer',
    json: 'true false null',
    py: 'def class return if elif else for while break continue import from as pass raise try except finally with lambda global nonlocal assert del yield in is not and or None True False async await self print',
    python: 'def class return if elif else for while break continue import from as pass raise try except finally with lambda global nonlocal assert del yield in is not and or None True False async await self print',
    bash: 'if then else elif fi for while do done case esac function return export local readonly echo cd ls cp mv rm mkdir touch cat grep sed awk curl git npm node python pip sudo chmod source exit set unset alias',
    sh: 'if then else elif fi for while do done case esac function return export local readonly echo cd ls cp mv rm mkdir touch cat grep sed awk curl git npm node python pip sudo chmod source exit set unset alias',
    yaml: 'true false null yes no on off',
    yml: 'true false null yes no on off',
    sql: 'select from where insert into values update set delete create table alter drop index join left right inner outer on as group by order having limit offset distinct count sum avg max min union all and or not null is in like between exists primary key foreign references default auto_increment',
    go: 'package import func var const type struct interface map chan return if else for range switch case break continue defer go select nil true false make new len cap append copy close delete panic recover',
    rust: 'fn let mut const static struct enum impl trait use pub crate mod match if else for while loop return break continue as where self Self super async await move ref dyn box true false None Some Ok Err',
    java: 'public private protected class interface extends implements new return if else for while do switch case break continue try catch finally throw throws import package static final void int long double float boolean char String null true false this super abstract synchronized volatile transient instanceof enum record',
    c: 'include define ifdef ifndef endif int long short char float double void struct union enum typedef static const return if else for while do switch case break continue sizeof goto extern unsigned signed register volatile NULL true false',
    cpp: 'include define ifdef ifndef endif int long short char float double void struct union enum class typename template namespace using public private protected virtual override const constexpr static return if else for while do switch case break continue sizeof new delete nullptr true false auto this try catch throw std vector string cout cin endl',
    html: 'html head body div span p a img ul ol li table thead tbody tr td th h1 h2 h3 h4 h5 h6 pre code script style link meta title section article header footer nav main aside button input form label select option textarea br hr strong em blockquote figure figcaption svg path g use',
    xml: '',
    markdown: '',
    md: '',
    conf: 'true false yes no on off',
    ini: 'true false yes no on off',
    dockerfile: 'FROM RUN CMD ENTRYPOINT COPY ADD WORKDIR ENV EXPOSE VOLUME USER ARG LABEL ONBUILD HEALTHCHECK SHELL AS',
    docker: 'FROM RUN CMD ENTRYPOINT COPY ADD WORKDIR ENV EXPOSE VOLUME USER ARG LABEL ONBUILD HEALTHCHECK SHELL AS'
  };

  // 语言别名归并
  var ALIAS = {
    javascript: 'js', jsx: 'js', mjs: 'js', cjs: 'js', node: 'js',
    typescript: 'ts', tsx: 'ts',
    py: 'python', zsh: 'bash', shell: 'bash', console: 'bash', terminal: 'bash',
    yml: 'yaml', 'c++': 'cpp', cxx: 'cpp', golang: 'go', rs: 'rust',
    text: 'plain', txt: 'plain', plaintext: 'plain', '': 'plain'
  };

  function normalize(lang) {
    var l = String(lang || '').trim().toLowerCase();
    if (ALIAS[l]) l = ALIAS[l];
    return l;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function token(cls, text) {
    return '<span class="tok tok-' + cls + '">' + escapeHtml(text) + '</span>';
  }

  // 判断是否是需要高亮的标识符后紧跟 (
  function isCall(code, index, len) {
    var k = index + len;
    while (k < code.length && /[ \t]/.test(code.charAt(k))) k++;
    return code.charAt(k) === '(' || code.charAt(k) === '<';
  }

  function highlight(code, lang) {
    code = String(code == null ? '' : code);
    var L = normalize(lang);

    if (L === 'plain') return escapeHtml(code);

    var keywords = (KEYWORDS[L] || '').split(/\s+/).filter(Boolean);
    var kwSet = Object.create(null);
    var kwCaseSensitive = (L === 'dockerfile' || L === 'html' || L === 'xml' || L === 'sql');
    keywords.forEach(function (k) {
      kwSet[kwCaseSensitive ? k : k.toLowerCase()] = true;
    });

    // 注释模式
    var commentRe;
    if (L === 'python' || L === 'bash' || L === 'yaml' || L === 'conf' || L === 'ini' ||
        L === 'dockerfile') {
      commentRe = '#[^\\n]*';
    } else if (L === 'html' || L === 'xml') {
      commentRe = '<!--[\\s\\S]*?-->';
    } else if (L === 'sql') {
      commentRe = '--[^\\n]*';
    } else {
      commentRe = '//[^\\n]*|/\\*[\\s\\S]*?\\*/';
    }

    var re = new RegExp(
      '(' + commentRe + ')' +                                        // 1 注释
      '|("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`)' + // 2 字符串
      '|\\b(0[xX][0-9a-fA-F]+|0[bB][01]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b' +      // 3 数字
      '|(--?>|[{}()\\[\\];,.:?!=+\\-*/%<>@&|^~]+)' +                  // 4 运算符
      '|\\b([A-Za-z_$@][A-Za-z0-9_$-]*)\\b',                          // 5 标识符
      'g'
    );

    var result = '';
    var last = 0;
    var m;

    while ((m = re.exec(code)) !== null) {
      if (m.index > last) result += escapeHtml(code.slice(last, m.index));

      if (m[1]) {
        result += token('comment', m[1]);
      } else if (m[2]) {
        result += token('string', m[2]);
      } else if (m[3]) {
        result += token('number', m[3]);
      } else if (m[4]) {
        result += token('operator', m[4]);
      } else if (m[5]) {
        var word = m[5];
        var probe = kwCaseSensitive ? word : word.toLowerCase();
        if (kwSet[probe]) {
          result += token('keyword', word);
        } else if (isCall(code, m.index, word.length)) {
          result += token('function', word);
        } else {
          result += escapeHtml(word);
        }
      }

      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }

    if (last < code.length) result += escapeHtml(code.slice(last));
    return result;
  }

  return {
    highlight: highlight,
    escapeHtml: escapeHtml,
    normalize: normalize,
    languages: Object.keys(KEYWORDS).concat(['plain'])
  };
});
