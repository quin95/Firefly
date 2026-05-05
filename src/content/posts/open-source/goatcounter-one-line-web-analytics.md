---
title: 一行代码接入 GoatCounter：给网站加上轻量统计分析
published: 2026-05-05T23:20:00+08:00
description: GoatCounter 是一个开源、隐私友好的网站统计工具。本文讲解如何用一个 script 标签完成接入，并补充官网地址、后台查看、常见排查、SPA 与自托管说明。
tags: [GoatCounter, 网站统计, 开源项目, Markdown]
category: 开源项目
draft: false
image: "../images/category/open-source.png"
author: 朝昆
---

如果你只是想知道“我的网站有没有人看”“哪些文章更受欢迎”“访问主要来自哪里”，其实不一定要上复杂的统计平台。

[GoatCounter](https://github.com/arp242/goatcounter) 是一个开源的网站统计分析工具，定位很清楚：轻量、简单、隐私友好。它的官网地址是 [https://www.goatcounter.com/](https://www.goatcounter.com/)，可以使用官方托管服务，也可以自己部署；对个人博客、小型产品页、文档站来说，最吸引人的地方是接入成本非常低，低到只需要往页面里放一行代码。

## GoatCounter 是什么

GoatCounter 是一个开源 Web Analytics 平台，可以作为 Google Analytics、Matomo 这类工具的轻量替代品。官方仓库里对它的描述很直接：它可以使用免费的托管服务，也可以自托管；目标是提供容易理解、尊重隐私的网站统计。

它适合这类场景：

- 个人博客想知道文章访问情况
- 开源项目文档想看页面热度
- 小型产品想了解来源、设备、浏览器等基础数据
- 不想引入复杂埋点系统，也不想弹 Cookie 同意横幅

GoatCounter 默认不使用 Cookie，也不会把用户当成一个可跨站追踪的身份来记录。它更像是在回答“这个页面被访问了多少次、从哪里来、大概是什么设备”，而不是“这个具体用户是谁、之后又去了哪里”。

## 一行代码接入

先注册一个 GoatCounter 站点，拿到你的站点代号。假设你的代号是 `MYCODE`，那么统计后台地址通常就是：

```text
https://MYCODE.goatcounter.com
```

接下来，把下面这行代码放到网站的 HTML 里，通常放在 `</body>` 前即可：

```html
<script data-goatcounter="https://MYCODE.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
```

把 `MYCODE` 换成你自己的站点代号，部署上线后访问页面，GoatCounter 就会开始记录访问数据。

如果你的网站使用 Astro、VitePress、Hexo、Hugo 或其他静态站点生成器，本质上也一样：找到全站 Layout、主题模板或自定义 head/body 注入位置，把这行脚本放进去即可。

## 在 Astro 博客里怎么放

以 Astro 项目为例，通常会有一个全局布局文件，比如：

```text
src/layouts/Layout.astro
```

可以在页面底部加入：

```astro
<script data-goatcounter="https://MYCODE.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
```

如果你只想在线上环境统计，不想把本地开发访问也记进去，可以在加载前加一个简单判断：

```html
<script>
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    window.goatcounter = { no_onload: true };
  }
</script>
<script data-goatcounter="https://MYCODE.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
```

官方文档也说明，`localhost` 和常见私有网络请求默认会被忽略；这里额外加一层判断，主要是让行为更直观。

## 去哪里看统计

访问你的 GoatCounter 后台：

```text
https://MYCODE.goatcounter.com
```

登录后可以看到这些基础数据：

- 页面访问量和访问趋势
- 热门路径，也就是哪些页面被看得最多
- Referrer 来源，比如搜索引擎、外链、直接访问
- 浏览器、系统、屏幕宽度、语言和大致地区
- Campaign 参数，方便区分不同推广入口

对博客来说，我最常看的其实就两个：哪些文章有人读、入口来源是什么。前者可以反推内容方向，后者可以判断读者是从搜索、社媒、友链还是直接访问进来的。

## 为什么说它隐私友好

很多统计工具的问题不在“统计”本身，而在它们会把统计做成跨站追踪、用户画像和广告系统的一部分。GoatCounter 的思路克制很多。

根据官方隐私说明，它主要存储的是聚合后的统计数据，例如某个页面在某一天有多少 Firefox 访问、某个屏幕宽度出现了多少次；这些数据之间不会再被拼接成单个用户画像。它也不在数据库里保存 IP 地址、完整 User-Agent 或浏览器里的 Cookie、本地存储标识。

这意味着你仍然能知道“哪些页面受欢迎”，但不会为了这个问题把访客变成一串长期可追踪的 ID。

当然，隐私合规从来不是一句“工具隐私友好”就能完全解决的事。如果你的网站面向特定地区、特定业务或有更高合规要求，仍然需要结合自己的实际情况确认法律和隐私政策。

## 常见问题排查

### 1. 后台看不到数据

官方文档提到，统计数据通常需要一点时间才会出现，另外广告拦截插件可能会拦截 `goatcounter.com` 或 `gc.zgo.at`。

可以按这个顺序检查：

1. `MYCODE` 是否替换成了自己的站点代号
2. 页面源码里是否真的出现了这段 `<script>`
3. 浏览器 Network 面板里是否加载了 `count.js`
4. 是否有广告拦截插件拦截请求
5. 是否访问的是本地环境或私有网络地址

如果只是验证接入，可以先用无痕窗口或关闭广告拦截插件试一下。

### 2. 使用了 CSP

如果网站配置了 `Content-Security-Policy`，需要允许加载 GoatCounter 脚本，并允许向统计接口发送请求：

```text
script-src  https://gc.zgo.at
connect-src https://MYCODE.goatcounter.com/count
```

否则脚本可能被浏览器安全策略直接拦掉。

### 3. 单页应用路由不刷新

普通静态页面每次打开都会触发一次统计，但 SPA 的路由切换通常不会重新加载页面。GoatCounter 提供了 JavaScript API，可以在路由变化时手动调用：

```html
<script>
  window.goatcounter = { no_onload: true };

  window.addEventListener("hashchange", function () {
    window.goatcounter.count({
      path: location.pathname + location.search + location.hash,
    });
  });
</script>
<script data-goatcounter="https://MYCODE.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
```

如果你用的是 Vue Router、React Router 或其他前端路由，可以把 `window.goatcounter.count()` 放在路由切换后的钩子里。

## 统计点击事件

除了页面访问，GoatCounter 也可以统计简单事件。比如你想知道有多少人点击了某个外链：

```html
<a href="https://example.com" data-goatcounter-click="ext-example">Example</a>
```

这个能力适合统计下载按钮、外链跳转、赞助入口等轻量事件。它不是完整的行为分析系统，但对个人站点已经够用。

## 托管服务还是自托管

GoatCounter 有两种用法：

- 使用 `goatcounter.com` 官方托管服务
- 自己部署 GoatCounter 服务

个人博客建议先用官方托管服务，几分钟就能完成接入。等到你有更高的数据控制、内网部署或反广告拦截需求，再考虑自托管。

自托管也不复杂。GoatCounter 是 Go 写的，官方提供二进制和 Docker 方式；数据库可以使用 SQLite，也支持 PostgreSQL。小站点用 SQLite 通常已经足够。

## 小结

GoatCounter 最适合的不是“我要做一整套增长分析平台”，而是“我需要一个干净、简单、能回答基础问题的网站统计工具”。

它的接入方式足够简单：

```html
<script data-goatcounter="https://MYCODE.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
```

把这行代码放进网站，替换自己的 `MYCODE`，上线后就能看到访问统计。

对个人博客来说，这种克制反而是优点：不需要复杂后台，不需要一堆埋点计划，也不需要为了看几篇文章的访问量引入沉重系统。一个脚本，一块简单的统计面板，就够了。
