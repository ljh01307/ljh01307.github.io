---
title: 用 Hexo + NexT 从零搭一个自己的博客
date: 2026-08-06 19:20:00
categories: [项目心得]
tags: [Hexo, NexT, 建站, GitHub Pages]
---

记录一次完整的建站过程，从环境准备到线上可访问。全程零成本，只依赖 Node.js 和一个 GitHub 账号。

## 一、为什么选这套组合

- **Hexo**：静态站点生成器，中文文档完善，插件生态成熟
- **NexT**：排版克制，自带目录、暗黑模式、代码高亮，配置驱动
- **GitHub Pages**：免费托管，不需要备案，`git push` 即上线

三者的分工很清晰：Hexo 负责把 Markdown 变成 HTML，NexT 负责让 HTML 好看，GitHub Pages 负责让它可访问。

## 二、环境准备

安装 Node.js（LTS）和 Git 之后验证：

```bash
node -v
npm -v
git --version
```

然后全局装 CLI：

```bash
npm install -g hexo-cli
```

## 三、初始化项目

```bash
hexo init blog
cd blog
npm install
hexo server
```

浏览器打开 `http://localhost:4000`，能看到默认主题就说明环境没问题。

## 四、启用 NexT

把主题克隆到 `themes` 目录，然后在根目录 `_config.yml` 里改一行：

```yaml
# _config.yml
theme: next
```

接着清缓存重建：

```bash
hexo clean && hexo generate && hexo server
```

这一步很容易踩坑。**改了主题没生效，九成是没执行 `hexo clean`**，因为旧产物还在缓存里。

## 五、配置部署

安装部署插件：

```bash
npm install hexo-deployer-git --save
```

然后在 `_config.yml` 末尾填写：

```yaml
deploy:
  type: git
  repo: git@github.com:你的用户名/你的用户名.github.io.git
  branch: main
```

注意仓库名必须是 `用户名.github.io` 这个固定格式，否则 Pages 地址会变成子路径。

## 六、上线

```bash
hexo clean && hexo generate && hexo deploy
```

首次部署后等几分钟，访问 `https://用户名.github.io` 即可。

## 七、踩过的坑

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| 主题没生效 | 缓存残留 | `hexo clean` |
| 页面 404 | 仓库名格式不对 | 必须是 `用户名.github.io` |
| 图片不显示 | 路径写成了绝对路径 | 用相对路径或 post_asset_folder |
| 部署报权限错误 | SSH Key 没配 | `ssh -T git@github.com` 验通 |

## 小结

整套流程跑通之后，写文章就只剩下一件事：新建 Markdown，写，部署。工具层面的东西一次性配好，之后就不用再想了。
