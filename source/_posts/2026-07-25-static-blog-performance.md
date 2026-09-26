---
title: 静态博客性能优化清单
date: 2026-07-25 21:00:00
categories: [项目心得]
tags: [性能优化, 前端, 静态站点]
---

静态站点本身已经很快，但"快"和"很快"之间还有不少空间。这是我这几轮优化下来真正有效的几条。

## 一、先量化，再优化

不要凭感觉改。先在 Network 面板看一眼真实的加载瀑布流，重点看三个数：

- 首字节时间（TTFB）
- 首屏内容渲染（FCP）
- 总传输体积

大多数静态博客的问题集中在第三项 —— 体积。尤其是图片和字体。

## 二、图片是第一优先级

图片通常占一个页面 70% 以上的体积。三个动作按收益排序：

1. 转 WebP，体积普遍下降 30%–50%
2. 加 `loading="lazy"`，首屏只加载可见区域
3. 显式写 `width` / `height`，避免布局偏移

```html
<img
  src="/images/cover.webp"
  alt="封面"
  width="960"
  height="540"
  loading="lazy"
  decoding="async"
/>
```

注意 `decoding="async"` 容易被忽略，但它能让图片解码不阻塞主线程。

## 三、字体要子集化

中文字体动辄几 MB，全量加载是灾难。做法是只保留页面实际用到的字符：

```bash
# 用 fonttools 抽取子集
pip install fonttools brotli
pyftsubset SourceHanSans.otf \
  --text-file=used-chars.txt \
  --flavor=woff2 \
  --output-file=font-subset.woff2
```

如果字号变动频繁，更省事的办法是直接优先使用系统字体栈：

```css
font-family: -apple-system, "Segoe UI", "PingFang SC",
             "Microsoft YaHei", sans-serif;
```

## 四、关键 CSS 内联

首屏渲染不需要等 CSS 文件下载完。把首屏必需的样式内联进 `<head>`，其余异步加载：

```html
<style>/* 首屏关键样式 */</style>
<link
  rel="stylesheet"
  href="/assets/style.css"
  media="print"
  onload="this.media='all'"
/>
```

`media="print"` 这个技巧的意思是"先别用它渲染，等加载完再切成 all"，从而不阻塞渲染。

## 五、缓存策略

静态资源加内容指纹，让"内容变了才失效"，回访时直接命中缓存：

```js
// 文件名带上内容哈希
const hash = crypto
  .createHash('md5')
  .update(content)
  .digest('hex')
  .slice(0, 8);

output = `app.${hash}.js`;
```

配合 HTTP 缓存头：

```
Cache-Control: public, max-age=31536000, immutable
```

## 六、优化前后的对比

| 指标 | 优化前 | 优化后 |
| --- | --- | --- |
| 首屏体积 | 2.4 MB | 380 KB |
| FCP | 2.1 s | 0.6 s |
| 请求数 | 31 | 9 |

## 小结

优先级很明确：**图片 > 字体 > 关键 CSS > 缓存**。前两项做完，收益就已经拿到大半了。
