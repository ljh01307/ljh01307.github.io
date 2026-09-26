---
title: 用 CSS 变量做一套不刺眼的暗色主题
date: 2026-06-28 22:30:00
categories: [项目心得]
tags: [CSS, 暗黑模式, 前端]
---

暗色主题做得好不好，判断标准只有一个：**读半小时眼睛累不累**。纯黑背景配纯白文字，是大多数人第一次做暗色主题时会犯的错。

## 一、不要用纯黑和纯白

`#000000` 配 `#ffffff` 的对比度是 21:1，远超正文需要的 7:1，长时间阅读会明显疲劳。更舒服的组合是深灰底 + 浅灰字：

```css
:root {
  --bg: #ffffff;
  --surface: #f7f8fa;
  --text: #1f2328;
  --text-muted: #6b7280;
  --border: #e6e8eb;
  --primary: #3a6df0;
}

html[data-theme='dark'] {
  --bg: #16181c;
  --surface: #1d2025;
  --text: #e8eaed;
  --text-muted: #9aa0a6;
  --border: #2a2e35;
  --primary: #6b93ff;
}
```

关键是最后一行：**暗色模式下的主色要提亮**。同一个 `#3a6df0` 放在深色背景上会显得发闷。

## 二、用属性选择器切换

不要维护两套 CSS 文件。把主题写进 `<html>` 的属性上，只切换一个值：

```js
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}
```

## 三、避免闪烁

这是最容易翻车的地方。如果等 JS 执行完再切主题，用户会看到一瞬间的白屏。

解决办法是在 `<head>` 里同步执行一小段脚本，抢在首次渲染之前设好属性：

```html
<script>
  (function () {
    var saved = localStorage.getItem('theme');
    var prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme =
      saved || (prefersDark ? 'dark' : 'light');
  })();
</script>
```

这段代码必须在任何样式表之前执行。

## 四、图片和代码块要特殊处理

暗色模式下，图片里的白色背景会很刺眼。降一点亮度就够了，别用 `filter: invert()`，那会把照片搞成反色：

```css
html[data-theme='dark'] img {
  filter: brightness(0.88) contrast(1.05);
}

html[data-theme='dark'] pre {
  background: #101216; /* 比页面底色更深，让代码区沉下去 */
}
```

## 五、过渡动画

切换主题时加一点过渡会舒服很多，但**只给颜色加，别给所有属性加**：

```css
body {
  transition:
    background-color 0.25s ease,
    color 0.25s ease;
}
```

写 `transition: all` 会导致窗口缩放、字号变化时也触发动画，非常卡。

## 六、检查清单

- [x] 背景不是纯黑，文字不是纯白
- [x] 暗色下主色重新调过，不是直接复用
- [x] 首屏无闪烁
- [x] 图片亮度做了下调
- [x] 代码块底色比页面底色更深
- [x] 记忆用户选择，但首次访问跟随系统

## 小结

暗色主题不是"把颜色反过来"，而是重新设计一套色板。其中最容易被忽略、也最影响体验的，是主色的重新校准。
