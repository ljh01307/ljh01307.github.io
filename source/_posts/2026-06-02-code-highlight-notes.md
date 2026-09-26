---
title: 前端代码高亮的实现选型笔记
date: 2026-06-02 20:00:00
categories: [项目心得]
tags: [前端, 代码高亮, 性能]
---

博客里的代码块多，所以"用什么做高亮"这个问题绕不过去。把选型过程记一下。

## 一、三个候选

| 方案 | 体积 | 支持语言 | 运行方式 |
| --- | --- | --- | --- |
| highlight.js | 大（全量约 900 KB） | 极多 | 运行时 / 构建时 |
| Prism.js | 小（按需 10–20 KB） | 多 | 运行时 / 构建时 |
| Shiki | 中 | 多（VS Code 语法） | 构建时 |

## 二、关键差异

### highlight.js

优点是省事，自动识别语言。缺点是体积大，而且自动识别在短代码片段上经常猜错。

### Prism.js

按需加载，只引入用到的语言。体积控制最好，但需要显式标注语言。

### Shiki

用 VS Code 的语法定义，配色最准。但它**要求构建时渲染**，不能纯运行时用，对静态站点来说反而是优点。

## 三、我的选择

最后选了构建时高亮 + 运行时渲染兜底。

构建阶段处理好的 HTML 长这样：

```html
<pre class="code-block" data-lang="js"><code>
  <span class="tok-keyword">const</span> a
  <span class="tok-operator">=</span>
  <span class="tok-number">1</span>;
</code></pre>
```

如果构建时漏掉了某个语言，运行时再用一个小解析器补上：

```js
const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(0x[\da-fA-F]+|\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)\b/g;

function highlight(code) {
  return code.replace(TOKEN_RE, (m, comment, str, num, word) => {
    if (comment) return token('comment', comment);
    if (str) return token('string', str);
    if (num) return token('number', num);
    if (word && KEYWORDS.has(word)) return token('keyword', word);
    return m;
  });
}
```

## 四、配色要注意对比度

高亮最容易犯的错是"颜色太花"。经验值：**一个代码块里不要超过五种颜色**。

```css
html[data-theme='light'] {
  --tok-keyword: #a626a4;
  --tok-string: #50a14f;
  --tok-number: #986801;
  --tok-comment: #a0a1a7;
  --tok-function: #4078f2;
}

html[data-theme='dark'] {
  --tok-keyword: #c678dd;
  --tok-string: #98c379;
  --tok-number: #d19a66;
  --tok-comment: #5c6370;
  --tok-function: #61afef;
}
```

暗色下的配色不是亮色的简单加深，而是重新挑的一组 —— 亮色里那个紫红 `#a626a4` 放到深底上会糊成一团。

## 五、还要处理的细节

- 行号：可选，长代码建议加，短片段建议不加
- 横向滚动：`overflow-x: auto`，不要换行（换行会破坏缩进）
- 复制按钮：`navigator.clipboard.writeText()`，加一个"已复制"的反馈
- 语言标签：右上角显示，方便读者判断

## 小结

选型的核心矛盾是"体积"和"省事"。静态站点有构建期，所以最优解通常是**构建时高亮 + 运行时兜底**，把体积压力挪到构建阶段。
