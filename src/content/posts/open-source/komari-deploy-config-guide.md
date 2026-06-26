---
title: Komari服务器探针搭建及配置图文教程
published: 2026-05-25T22:55:00+08:00
description: 记录 Komari 服务器监控面板的 Docker Compose 与 1Panel 部署流程，并补充反向代理、PurCarte 主题、KomariBeautify 美化和节点接入配置。
tags: [Komari, 服务器监控, 1Panel, Docker, 开源项目]
category: 开源项目
draft: false
image: "../images/category/open-source.png"
author: Quin.Lin
sourceLink: https://www.iloli.love/archives/1769602819038
licenseName: CC BY 4.0
licenseUrl: https://creativecommons.org/licenses/by/4.0/
---

> 本文整理自猫猫博客《小白向Komari搭建及配置图文教程》，原作者：猫猫摸大鱼，原文地址：[https://www.iloli.love/archives/1769602819038](https://www.iloli.love/archives/1769602819038)，原文采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 协议发布。本文在保留原始流程和关键步骤的基础上，按本站 Firefly 文章格式重新整理，并将配图上传到本站图床。

## 1. 前言

[Komari](https://github.com/komari-monitor/komari) 是一个开源服务器监控/探针面板，适合用来集中查看多台 VPS、轻量服务器或家用小主机的在线状态、CPU、内存、网络和流量等信息。

本文参考的版本环境如下：

- Komari：`1.1.3`
- PurCarte 主题：`1.2.5`
- KomariBeautify：`0.4.2`

示例环境使用的是腾讯云轻量应用服务器。实际部署时，只要你的机器能正常运行 Docker 或 1Panel，整体流程都是类似的。

![Komari 面板预览](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/2s1rdc5a.2kz.png)

## 2. 部署 Komari

这里放两种部署方式：

- Docker Compose 部署
- 1Panel 应用商店部署

二选一即可。如果你更喜欢官方脚本或其他部署方式，可以继续参考 Komari 官方文档：[https://www.komari.wiki/install/quick-start.html](https://www.komari.wiki/install/quick-start.html)。

### 2.1 Docker Compose 部署

先确保服务器已经安装 Docker。比较新的 Docker 版本通常自带 `docker compose`，一般不需要再单独安装旧版 `docker-compose`。

准备一个目录用于保存 Komari 配置和数据，本文示例使用：

```bash
/data/komari
```

进入该目录，新建 `compose.yaml`：

![创建 compose 文件](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/image-dhqQ.png)

写入下面内容：

```yaml
services:
  komari:
    image: ghcr.io/komari-monitor/komari:latest
    container_name: komari
    ports:
      - 25774:25774
    volumes:
      - ./data:/app/data
    environment:
      # 可选：自定义初始管理员账号
      # ADMIN_USERNAME: admin
      # ADMIN_PASSWORD: yourpassword
    restart: unless-stopped
```

![Compose 配置示例](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/h0gaqo2a.cgj.png)

接下来建议做三处检查：

1. 如果服务器在国内，镜像可以从 `ghcr.io/komari-monitor/komari:latest` 改成 `ghcr.1ms.run/komari-monitor/komari:latest`。
2. `25774:25774` 前面的 `25774` 是宿主机端口，可以按需改成其他端口。
3. 把 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 前面的注释去掉，并设置为自己的管理员账号和密码。

修改后的示例大概是这样：

![修改管理员账号密码](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/n2tibsq5.lpn.png)

保存后，在 `/data/komari` 目录运行：

```bash
docker compose up -d
```

容器正常启动后，Docker Compose 方式就完成了。

![容器启动成功](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/zzdwylvv.brn.png)

### 2.2 1Panel 部署

如果服务器已经安装了 1Panel，可以直接使用更省心的应用部署方式。

先在服务器执行 Komari 的 1Panel 应用安装脚本：

```bash
bash -c "$(curl -sSL https://1panel.komari.wiki/install.sh)"
```

![安装 1Panel 应用源](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/mlunj04d.upr.png)

然后进入 1Panel 后台：

1. 打开“应用商店”
2. 点击“同步本地应用”
3. 关闭同步弹窗

![同步本地应用](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/nc3pbomm.dlw.png)

搜索 `komari`，点击安装。

![搜索 Komari](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/fv0hnj3r.u3d.png)

安装页面里可以按需修改端口、管理员用户名和密码。如果暂时不配置反向代理，或者你需要直接通过端口访问，就勾选“端口外部访问”。

![配置 Komari 应用](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/i0igngoj.xfs.png)

如果服务器在国外，通常直接确认即可。如果服务器在国内，可以下拉到底部，勾选“编辑 compose 文件”，把：

```text
ghcr.io/komari-monitor/komari
```

替换为：

```text
ghcr.1ms.run/komari-monitor/komari
```

![国内服务器替换镜像源](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/petcpcn3.cnp.png)

安装完成后关闭弹窗。

![安装完成](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/2evhpx0u.0q2.png)

此时应用商店里已经能看到 Komari。

![应用列表中的 Komari](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/ydj1gt1g.pvi.png)

### 2.3 可选：配置反向代理

如果你有域名，建议给 Komari 配置反向代理，这样后续可以直接通过域名访问，也方便申请 HTTPS 证书。

下面还是以 1Panel 为例。

进入：

```text
网站 -> 网站 -> 创建网站
```

![创建网站](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/rogf45tm.23z.png)

类型选择“反向代理”，填写用于访问 Komari 的域名。

如果是 1Panel 应用方式部署，可以在下拉框中选择 `komari`。如果是 Docker Compose 或其他方式部署，代理地址可以写：

```text
127.0.0.1:25774
```

如果你改过宿主机端口，就把 `25774` 换成自己的端口。

![填写反向代理信息](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/w35xgumb.qco.png)

创建完成后，如果需要 HTTPS，可以进入网站配置页，在 HTTPS 里启用证书。

![配置 HTTPS](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/gnmabd42.3zn.png)

![启用 HTTPS](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/image-tAYE.png)

## 3. 配置 Komari

部署完成后，就可以开始访问并配置 Komari。

### 3.1 登录 Komari

如果你配置了反向代理，直接访问绑定的域名。如果没有配置反向代理，就访问：

```text
服务器IP:25774
```

如果改过端口，把 `25774` 替换成自己的端口。

进入页面后，点击右上角登录，输入前面设置的管理员账号和密码。

![登录 Komari](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/4qkqtv3d.mgy.png)

首次进入时按提示接受即可。

![接受提示](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/5a0yjbsu.se5.png)

### 3.2 可选：配置 PurCarte 主题

PurCarte 是一个 Komari 主题，项目地址：

[https://github.com/Montia37/komari-theme-purcarte](https://github.com/Montia37/komari-theme-purcarte)

先进入 Releases 页面下载主题包：

[https://github.com/Montia37/komari-theme-purcarte/releases](https://github.com/Montia37/komari-theme-purcarte/releases)

![下载 PurCarte 主题](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/oagdikf5.fqy.png)

回到 Komari 后台，进入：

```text
设置 -> 主题管理 -> 上传主题
```

上传刚刚下载的主题包。

![上传主题](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/bpxvqlip.j3w.png)

上传完成后，点击齿轮按钮，设置为当前主题。

![设置当前主题](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/aarsqbu0.yiu.png)

主题配置可以在前台入口里调整，也可以在后台的 `PurCarte 设置` 中调整。

![前台主题设置入口](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/a4qtdi3g.jwb.png)

![后台 PurCarte 设置](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/ybb5tngo.biu.png)

默认配置已经可以正常使用。后续如果想折腾外观，建议把每个配置项都翻一遍，按自己的站点风格慢慢调整。

如果需要背景图片，原文作者也提供了一个双端自适应二次元图片 API：

```text
https://www.loliapi.com/acg/
```

![PurCarte 效果示例](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/frdmswov.l3v.png)

### 3.3 可选：配置 KomariBeautify

KomariBeautify 是基于 PurCarte 主题的一套自定义代码，项目地址：

[https://github.com/YoungYannick/KomariBeautify](https://github.com/YoungYannick/KomariBeautify)

先进入 Komari 后台：

```text
设置 -> 站点
```

找到 `自定义头部` 和 `自定义 Body` 两个位置。

![自定义头部和 Body](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/vocg2p0r.2qs.png)

然后打开 KomariBeautify 仓库，点击 `KomariBeautify.html`。

![打开 KomariBeautify.html](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/gim0kfgc.vrz.png)

需要注意：里面的 `CSS/HTML` 和 `JS` 要分开放。

- `CSS/HTML`：放到 Komari 的“自定义头部”
- `JS`：放到 Komari 的“自定义 Body”

以 KomariBeautify `0.4.2` 为例，原文中提到可以翻到第 `1071` 行附近找分界；不同版本行号可能会变化，所以建议按代码内容判断。

![查找 CSS 与 JS 分界](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/0r12sh14.2ql.png)

如果项目更新后找不到分界，可以把代码结构贴给 AI 帮你判断哪一段该放头部，哪一段该放 Body。

![复制自定义代码](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/rbuovpif.jzr.png)

粘贴完成后，分别保存。

![保存自定义代码](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/32j2i04u.0jr.png)

补充一点：`0.4.2` 版本里可以通过修改相关行的图片和标题，调整欢迎小面板。

![修改欢迎面板配置](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/uauah4ij.gg5.png)

![欢迎面板效果一](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/bqsh3fa4.1qb.png)

![欢迎面板效果二](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/5t2yk0mb.dvi.png)

完成主题和美化代码后，前台效果大概如下。

![主题增强效果](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/bvycqnuc.erf.png)

### 3.4 添加服务器节点

最后一步是把需要监控的服务器接入 Komari。

进入后台：

```text
服务器 -> 添加节点
```

填写节点名称后，点击添加。

![添加节点](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/y5mdiioe.kfd.png)

添加完成后，点击“一键部署指令”。根据目标服务器系统和网络情况选择安装参数。

如果是国内服务器，可以勾选 `Github 代理`，代理地址可按实际情况填写。原文示例使用：

```text
https://ghfast.top/
```

这类代理地址可能随时变化，建议以自己测试可用为准。

![复制一键部署指令](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/tg0z5252.aph.png)

把复制出来的命令放到对应服务器上执行，等待安装完成。

![节点 Agent 安装完成](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/tlsm2uto.o02.png)

回到 Komari 前台，如果配置正常，就能看到刚刚添加的机器在线了。

![节点上线](https://file.ciyuanai.org/picList/%7Byear%7D/%7Bmonth%7D/%7BfileName%7D.%7BextName%7D/dalammia.xda.png)

## 4. 小结

整个流程串起来，其实就是：

1. 用 Docker Compose 或 1Panel 部署 Komari
2. 可选配置反向代理和 HTTPS
3. 登录后台完成基础设置
4. 可选安装 PurCarte 主题
5. 可选加入 KomariBeautify 自定义代码
6. 添加服务器节点，并在目标机器上安装 Agent

到这里，一个基础可用的 Komari 探针面板就搭好了。后续还可以继续调整主题、节点分组、告警、公开展示页等内容；但作为第一版监控面板，上面的步骤已经足够完成从部署到可视化展示的闭环。
