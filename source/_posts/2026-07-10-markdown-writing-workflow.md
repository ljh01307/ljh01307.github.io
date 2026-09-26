---
title: 我的 Markdown 写作工作流
date: 2026-07-10 20:40:00
categories: [项目心得]
tags: [Markdown, 写作, 工具链]
---

三年下来，写作流程被压缩得只剩几个步骤。分享出来，也当作给自己留一份记录。

## 一、文件命名决定一切

我用固定的文件名格式，好处是可以直接按文件名排序，也方便脚本解析：

```
YYYY-MM-DD-slug.md
```

例如：

```
2026-07-10-markdown-writing-workflow.md
```

这样即使没有数据库、没有索引文件，单看目录也知道写了多少、什么时候写的。

## 二、front-matter 只写必要的字段

头部元数据能少则少。我固定用五个字段：

```yaml
---
title: 我的 Markdown 写作工作流
date: 2026-07-10 20:40:00
categories: [项目心得]
tags: [Markdown, 写作, 工具链]
excerpt: 一句话摘要，会显示在列表页。
---
```

`excerpt` 是可选的，不写就从正文第一段自动截取。

## 三、正文只关心内容

写正文时严格遵守两条：

1. **不手动排版**。不对齐、不加空行凑高度、不用空格缩进
2. **不手写目录**。标题层级写对，目录由工具生成

有了这两条，写作时注意力就完全在内容上。

## 四、常用语法速查

### 断言与强调

- 加粗：`**重要内容**`
- 斜体：`*术语*`
- 行内代码：`` `const a = 1` ``

### 引用

> 引用块用来放那些"不是我说的话"，或者是需要单独拎出来的句子。

### 代码块

一定要写语言标识，否则没有高亮：

```python
def word_count(text: str) -> int:
    """统计中英文字数。"""
    cjk = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
    latin = len([w for w in text.split() if w.isascii()])
    return cjk + latin
```

## 五、发布

一条命令，不需要记参数：

```bash
alias pub='hexo clean && hexo generate && hexo deploy'
```

之后写完只要敲 `pub`。

## 六、备份

Markdown 文件的全部内容都是纯文本，所以直接交给 Git 就够了：

```bash
git add source/_posts
git commit -m "post: 我的 Markdown 写作工作流"
git push
```

纯文本的另一个好处是：十年后打开它，依然能读。

## 一点体会

工具链的意义在于让你忘记工具链的存在。当写作流程短到"打开编辑器，写字，敲一条命令"的时候，就基本不用再折腾它了。
