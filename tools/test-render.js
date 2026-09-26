/* 渲染器自检：node tools/test-render.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const md = require(path.join(ROOT, 'assets', 'js', 'markdown.js'));

const sample = `---
---

# 标题一

这是一段**中文**正文，包含 \`inline code\` 和 [链接](https://example.com)。

## 表格

| 方案 | 体积 | 说明 |
| --- | ---: | :--- |
| A | 900 KB | 大 |
| B | 20 KB | 小 |

## 列表

- 第一项
- 第二项
  - 嵌套项
  - 另一个嵌套
- 第三项

1. 有序一
2. 有序二

## 引用

> 引用第一行
> 引用第二行，含 **粗体**。

## 代码

\`\`\`js
// 注释
const a = 1;
function add(x, y) {
  return x + y;
}
\`\`\`

\`\`\`python
def word_count(text: str) -> int:
    """统计字数"""
    return len(text)
\`\`\`

---

段落结尾 ~~删除线~~ 和 *斜体*。
`;

const out = md.render(sample);
console.log('---- HTML ----');
console.log(out.html);
console.log('\n---- TOC ----');
console.log(JSON.stringify(out.toc, null, 2));
console.log('\n---- TOC HTML ----');
console.log(md.renderToc(out.toc));
console.log('\n---- PLAIN ----');
console.log(md.toPlainText(sample).slice(0, 200));
