/* ============================================================
 * 站点配置 —— 手工维护，构建脚本会读取本文件
 * 对应文档：《个人博客开发文档》五、自定义配置记录
 * ============================================================ */
window.SITE = {
  /* ---------- 站点信息 ---------- */
  title: 'Dream的博客',
  subtitle: '随笔 · 小说 · 项目心得',
  author: 'Dream',
  description: '一个记录随笔、小说与技术项目心得的地方。',
  keywords: ['个人博客', '随笔', '小说', '项目心得', '前端'],
  language: 'zh-CN',

  // 部署到 GitHub Pages 后改成真实地址，用于生成 RSS / sitemap
  baseUrl: 'https://dream.github.io',
  // 站点建立年份，页脚会显示 起始年 - 当前年
  since: 2024,

  /* ---------- 作者信息（关于页 / 侧栏） ---------- */
  profile: {
    avatar: 'assets/img/avatar.svg',
    bio: '写点东西，留个存档。',
    // 关于页正文，支持 Markdown
    about: [
      '你好，我是 **Dream**。',
      '',
      '这里是属于我自己的一个小角落，用来存放三类东西：',
      '',
      '- **随笔** —— 日常的观察、情绪和零碎的想法',
      '- **小说** —— 偶然想到的故事，慢慢写，不着急写完',
      '- **项目心得** —— 做完一个东西之后，把踩过的坑记下来',
      '',
      '## 关于这个站',
      '',
      '这是一个纯静态博客：文章写在本地 Markdown 文件里，构建时生成静态页面，',
      '不依赖任何后端服务，也不需要数据库。',
      '',
      '| 层面 | 实现 |',
      '| --- | --- |',
      '| 内容 | Markdown + front-matter |',
      '| 渲染 | 构建时生成 + 浏览器端渲染 |',
      '| 样式 | CSS 变量驱动的浅色 / 深色双套色板 |',
      '| 托管 | GitHub Pages（可换成任意静态托管） |',
      '',
      '## 联系方式',
      '',
      '如果你恰好路过，觉得某一段有点意思，欢迎通过下面的方式找我。',
      '',
      '> 不追求更新频率，只要求写下来的每一篇都是真的想说的。'
    ].join('\n')
  },

  /* ---------- 导航菜单 ---------- */
  // 对应《前端开发文档》四(六) 导航菜单与路由映射
  nav: [
    { name: '首页', url: 'index.html', icon: 'home' },
    { name: '归档', url: 'archive.html', icon: 'archive' },
    { name: '分类', url: 'categories.html', icon: 'folder' },
    { name: '标签', url: 'tags.html', icon: 'tag' },
    { name: '关于', url: 'about.html', icon: 'user' }
  ],

  /* ---------- 社交与外链 ---------- */
  social: [
    { name: 'GitHub', url: 'https://github.com/', icon: 'github' },
    { name: '邮箱', url: 'mailto:dream@example.com', icon: 'mail' },
    { name: 'RSS', url: 'feed.xml', icon: 'rss' }
  ],

  /* ---------- 站点统计（页脚） ---------- */
  statistics: {
    // 是否启用"运行天数"（按 since 计算）
    runningDays: true
  },

  /* ---------- 功能开关 ---------- */
  features: {
    // 站内搜索：读取构建期生成的 data/search-index.js
    search: true,
    // 文章字数与预计阅读时长
    readingTime: true,
    // 文章目录导航 TOC
    toc: true,
    // 暗黑模式
    darkMode: true,
    // 点赞（纯前端计数，存于浏览器本地）
    like: true,
    // 浏览量（纯前端计数，存于浏览器本地）
    views: true
  },

  /* ---------- 列表分页 ---------- */
  pageSize: 6,

  /* ---------- 计数服务配置 ----------
   * 纯静态站点没有后端，默认用浏览器本地存储模拟计数，
   * 只能看到"这台设备上的累计值"。若想统计全站真实数据，
   * 把 provider 换成下面的第三方方案即可，页面代码无需改动。
   *
   * 例：接入不蒜子
   *   provider: 'busuanzi',
   *   options: { siteId: '你的siteId' }
   * 例：接入 LeanCloud
   *   provider: 'leancloud',
   *   options: { appId: '...', appKey: '...', serverURL: '...' }
   */
  counter: {
    provider: 'local', // local | busuanzi | leancloud | custom
    options: {},
    // 初始偏移量，让数字看起来不是从 0 开始
    seed: { views: 42, likes: 3 }
  }
};
