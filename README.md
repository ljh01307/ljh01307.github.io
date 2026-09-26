# Dream的博客

一个纯静态个人博客。内容用 Markdown 写，一条命令构建成静态页面，可以直接托管在
GitHub Pages（或任意静态托管）上，零后端、零数据库、零依赖。

> 本文档对应《个人博客开发文档（开发方案）》与《Dream 个人博客前端开发文档》两份规格。
> 按需求做了简化：**不做评论系统**，保留文章记录、分类标签归档、站内搜索、
> 目录导航、字数与阅读时长、点赞与阅读量统计。

---

## 一、怎么打开 / 怎么关闭

项目在你电脑上的位置：

```
C:\Users\ljh01307\WorkBuddy\2026-09-26-15-13-09\dream-blog
```

**在文件资源管理器里打开这个文件夹，双击下面三个文件就行，不用敲任何命令：**

| 双击这个文件 | 作用 |
| --- | --- |
| `start-blog.bat` | 启动本地预览，并自动用浏览器打开 http://localhost:4321 |
| `stop-blog.bat` | 关闭预览服务（也可以直接在预览窗口按 `Ctrl + C`） |
| `build-blog.bat` | 写完文章后重新构建一次，刷新浏览器就能看到新内容 |

几个要点：

- **启动预览后弹出的那个黑色窗口不要关**，它就是服务器。窗口关掉 = 服务停止。
- 已经开着服务时再双击 `start-blog.bat` 不会重复启动，只会帮你再打开一个浏览器标签。
- 关电脑、关窗口之后服务自然就没了，不会残留后台程序、不会开机自启。
- 日常流程：写文章（见第三节）→ 双击 `build-blog.bat` → 浏览器按 `F5`。

**习惯敲命令的话，完全等价：**

```bash
cd dream-blog
node tools/build.js     # 构建：解析 Markdown → 生成索引、RSS、页面外壳
node tools/serve.js     # 本地预览，Ctrl + C 停止
```

需要 Node.js（LTS 版即可；本项目零第三方依赖，**不需要 `npm install`**）。
脚本会自己去系统里找 Node.js；万一提示找不到，装一个 LTS 版就行：https://nodejs.org

> 不想启动服务器，直接双击 `index.html` 也能看，但浏览器在 `file://` 协议下会禁用
> localStorage，点赞和阅读量将无法保存 —— 所以**推荐用 `start-blog.bat` 预览**。

### 遇到问题看这里

| 情况 | 怎么处理 |
| --- | --- |
| 浏览器打不开 `localhost:4321` | 预览窗口是不是被关掉了？重新双击 `start-blog.bat` |
| 双击 bat 一闪就没了 | 多半是没装 Node.js。在文件夹地址栏输入 `cmd` 回车，再敲 `start-blog.bat` 看报错 |
| 提示 4321 端口被占用 | 先双击 `stop-blog.bat` 释放端口，再启动 |
| 改了文章但页面没变化 | 双击 `build-blog.bat` 重新构建，再按 `F5` 刷新 |
| 点赞 / 阅读量一直是 0 | 是不是直接用浏览器打开的 `index.html`？改用 `start-blog.bat` |
| 手机 / 朋友想一起看 | 见第五节，把站点推到 GitHub Pages 就有公网地址了 |

---

## 二、目录结构

```
dream-blog/
├─ start-blog.bat       ★ 双击：启动本地预览 + 自动开浏览器
├─ stop-blog.bat        ★ 双击：关闭本地预览
├─ build-blog.bat       ★ 双击：重新构建（写完文章跑一次）
├─ index.html           首页（文章列表 + 分页 + 最新/热门切换）
├─ post.html            文章详情（正文 + TOC + 点赞 + 上下篇 + 相关文章）
├─ archive.html         归档（按年 / 月时间线）
├─ categories.html      分类总览
├─ category.html        单个分类
├─ tags.html            标签总览（按热度加权字号）
├─ tag.html             单个标签
├─ search.html          站内搜索
├─ about.html           关于
├─ 404.html             未找到
├─ feed.xml             RSS（构建生成）
├─ sitemap.xml          站点地图（构建生成）
├─ .nojekyll            让 GitHub Pages 跳过 Jekyll 处理
│
├─ source/_posts/       ★ 文章源文件，只在这里写 Markdown
│
├─ data/
│  ├─ site.js           ★ 站点配置（站点信息 / 导航 / 社交 / 功能开关 / 计数服务）
│  ├─ posts.js          构建生成：文章数据，请勿手改
│  └─ search-index.js   构建生成：搜索索引，请勿手改
│
├─ assets/
│  ├─ css/style.css     全站样式（浅色 / 深色双套 CSS 变量）
│  ├─ js/markdown.js    Markdown 渲染器（浏览器 + 构建脚本共用）
│  ├─ js/highlight.js   代码高亮（浏览器 + 构建脚本共用）
│  ├─ js/site.js        公共运行时（布局、主题、搜索、计数、复制）
│  ├─ js/pages.js       列表 / 归档 / 分类 / 标签 / 搜索 / 关于 页渲染
│  ├─ js/post.js        文章页渲染（TOC、阅读进度、点赞、上下篇）
│  └─ img/              头像与图标
│
└─ tools/
   ├─ build.js          构建脚本
   ├─ serve.js          本地预览服务器
   └─ test-render.js    渲染器自检（可选）
```

**除了 `source/_posts/` 和 `data/site.js`，其余文件都不需要日常改动。**
页面外壳由 `tools/build.js` 统一生成，避免多份重复的 HTML 标记。

---

## 三、写一篇新文章

在 `source/_posts/` 下新建文件，文件名格式为 `YYYY-MM-DD-slug.md`：

````markdown
---
title: 文章标题
date: 2026-09-26 21:30:00
categories: [随笔]
tags: [随笔, 记录]
excerpt: 摘要（可选，不写就从正文第一段自动截取）
series: 系列名（可选，小说连载可以用）
---

正文用 Markdown 写。支持：

## 二级标题
### 三级标题（自动生成右侧目录）

**加粗**、*斜体*、`行内代码`、~~删除线~~、[链接](https://example.com)

> 引用块

- 无序列表
  - 支持嵌套

1. 有序列表

| 表头 | 说明 |
| --- | --- |
| 单元格 | 支持对齐 |

```js
// 代码块带语言标识即自动高亮
const hello = 'world';
```
````

保存后执行 `node tools/build.js`，刷新页面即可看到。

**字段说明**

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `date` | 建议填 | 不填则取文件名里的日期 |
| `categories` | 否 | 分类，数组或单个值 |
| `tags` | 否 | 标签，数组 |
| `excerpt` | 否 | 列表页摘要，留空自动截取首段前 110 字 |
| `series` | 否 | 系列名，会显示在标题下方（适合小说连载） |

---

## 四、站点配置

全部在 `data/site.js` 里改。改完**双击 `build-blog.bat`**（等价于 `node tools/build.js`），
再回浏览器按 `F5` —— **预览服务不用重启**，构建完直接刷新就行。

哪些改动必须重新构建、哪些刷新一下就够了：

| 改了什么 | 要不要重新构建 | 原因 |
| --- | --- | --- |
| `title` / `subtitle` / `author` / `description` / `baseUrl` | **要** | 这些在构建时被写进了每个 HTML 的 `<title>`、meta、OG 标签，以及 `feed.xml`、`sitemap.xml` |
| `nav` 导航菜单、`social` 社交链接 | 刷新即可 | 页面运行时读取 `data/site.js` 现场渲染 |
| `profile` 头像 / 简介 / 关于页正文 | 刷新即可 | 同上 |
| `features` 功能开关、`pageSize` 每页篇数 | 刷新即可 | 同上 |
| `counter` 计数服务设置 | 刷新即可 | 同上 |
| `source/_posts/` 里的文章 | **要** | 文章列表与搜索索引是构建产物（`data/posts.js`、`data/search-index.js`） |
| `assets/css/style.css`、`assets/js/*.js` 里的代码 | 不用 | 浏览器直接加载，`F5` 即可；看着没变就 `Ctrl + F5` 强刷 |

> 懒得判断的话：改完任何东西都双击一次 `build-blog.bat`。多跑一次没有任何副作用，
> 耗时也就一两秒。

```js
window.SITE = {
  title: 'Dream的博客',
  subtitle: '随笔 · 小说 · 项目心得',
  author: 'Dream',
  baseUrl: 'https://你的用户名.github.io',  // 部署后改成真实地址，用于 RSS / sitemap

  nav: [...],        // 导航菜单
  social: [...],     // 社交与外链
  pageSize: 6,       // 首页每页文章数
  profile: { ... },  // 头像、简介、关于页正文（Markdown）

  features: {
    search: true,      // 站内搜索
    readingTime: true, // 字数与阅读时长
    toc: true,         // 目录导航
    darkMode: true,    // 暗黑模式
    like: true,        // 点赞
    views: true        // 阅读量
  }
};
```

---

## 五、部署到 GitHub Pages

1. 在 GitHub 新建仓库，命名为 `你的用户名.github.io`（必须是这个格式）。
2. 把本项目**全部文件放在仓库根目录**推送上去。
3. 仓库 Settings → Pages → Source 选择 `main` 分支、`/ (root)` 目录。
4. 等几分钟，访问 `https://你的用户名.github.io`。

也可以直接用 Git 命令：

```bash
git init
git add .
git commit -m "init: Dream的博客"
git branch -M main
git remote add origin git@github.com:你的用户名/你的用户名.github.io.git
git push -u origin main
```

上传前建议先跑一次构建，确保 `data/` 里的文件是最新的：

```bash
node tools/build.js && git add . && git commit -m "post: 新文章" && git push
```

> 换其他托管（Vercel / Netlify / Cloudflare Pages / 自己的服务器）也一样，
> 因为它就是一堆静态文件，没有构建期以外的任何要求。

---

## 六、功能与文档对照

| 文档要求 | 本项目实现 |
| --- | --- |
| 首页文章列表 + 分页 | ✅ 卡片列表，`pageSize` 可配 |
| 站内搜索 | ✅ 构建期生成索引，前端模糊匹配标题 / 标签 / 分类 / 正文 |
| Markdown 渲染 + 代码高亮 | ✅ 自研渲染器，零依赖，支持 20+ 语言着色 |
| 文章目录导航 TOC | ✅ 右侧固定，滚动高亮当前小节，窄屏可折叠 |
| 分类页 / 标签页 | ✅ 按 front-matter 自动聚合，标签按热度加权字号 |
| 归档页 | ✅ 按年 / 月时间线 |
| 关于页 | ✅ 正文在 `site.js` 里用 Markdown 维护 |
| 暗黑模式 | ✅ CSS 变量双色板，首屏无闪烁，记忆偏好 |
| 字数与阅读时长 | ✅ 构建期计算（中文按字数、英文按词数） |
| 阅读量 | ✅ 见下方说明 |
| 点赞 | ✅ 见下方说明 |
| RSS | ✅ 构建生成 `feed.xml` |
| SEO | ✅ 语义化标签、OG 标签、`sitemap.xml`、`lang`、`alt` |
| 响应式 | ✅ 桌面 / 平板 / 移动三档断点，侧栏折叠为抽屉 |
| 第三方评论 | ❌ 按需求不做 |

### 关于阅读量与点赞

纯静态站点没有后端，所以默认把计数存在**浏览器本地存储**里 —— 也就是说，
你看到的是"这台设备上的累计值"，换设备或清缓存会重新开始。
这对"自己和朋友看看"的场景是够用的。

需要真实的跨设备统计时，改 `data/site.js` 里的：

```js
counter: { provider: 'local', options: {}, seed: { views: 42, likes: 3 } }
```

`provider` 换成 `busuanzi` / `leancloud` / `custom`，在 `assets/js/site.js`
的 `counter` 对象里补上对应的读写实现即可，页面代码不需要动。
`seed` 是初始偏移量，用来让数字不从 0 开始。

---

## 七、后续可以加的东西

- **评论**：接 Twikoo / Waline / Giscus，在 `post.html` 底部加一个挂载点即可
- **真实计数**：见上一节
- **图片灯箱**：给 `.post-content img` 加点击放大
- **全文 RSS**：`tools/build.js` 里把 `description` 换成渲染后的正文
- **文章封面图**：front-matter 加 `cover:` 字段，列表卡片配上缩略图
