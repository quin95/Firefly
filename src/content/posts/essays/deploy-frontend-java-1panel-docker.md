---
title: 从零开始部署前后端项目：1Panel 与 Docker 实战记录
published: 2026-06-26T12:38:11+08:00
description: 记录一次前端静态页面和 Java 后端服务的完整部署流程，从 1Panel 可视化部署到 Docker 手动部署，再到域名、端口、安全组和常见问题排查。
tags: [部署, 1Panel, Docker, Java, 前端]
category: 浮生随笔
draft: false
image: "../images/category/suibi.png"
author: Quin.Lin
---

第一次把一个前后端项目部署到服务器上时，最容易让人卡住的往往不是某一条命令，而是这些东西混在一起之后的关系：

- 前端打包后的文件到底应该放哪里
- Java 后端的 `jar` 包怎么才能一直运行
- 域名解析、安全组、端口、反向代理分别负责什么
- 用 1Panel 面板部署和直接用 Docker 部署有什么区别

如果只看零散教程，很容易今天照着装好了 Nginx，明天又卡在安全组，后天再被域名解析绕晕。其实把流程拆开之后，部署这件事并没有想象中复杂。

这篇文章以一个常见的「前端静态页面 + Java 后端服务」项目为例，记录一遍从零部署的过程。前半部分使用 1Panel 这种可视化面板，适合先把项目跑起来；后半部分补充 Docker 命令行部署，适合理解背后的运行逻辑。

## 部署前要准备什么

开始之前，先把基础材料准备好：

- 一台云服务器，系统推荐 Ubuntu。
- 一个可以正常解析的域名。如果只是练习，也可以先用服务器公网 IP 访问。
- 前端项目打包产物，比如 Vue 或 React 执行 `npm run build` 后生成的 `dist` 目录。
- 后端 Java 项目打包产物，比如 `demo.jar`。
- 云服务器安全组中开放必要端口，例如 `22`、`80`、`443`，以及项目临时访问用到的 `8080`、`8000` 等端口。

这里有一个非常容易忽略的点：服务器里的防火墙和云厂商控制台里的安全组不是一回事。

也就是说，即使你的项目已经在服务器里启动成功，只要云厂商安全组没有放行对应端口，外部浏览器一样访问不到。新手部署时很多“服务明明启动了但打不开”的问题，最后都出在这里。

## 方案一：用 1Panel 先把项目跑起来

如果是第一次部署项目，我更建议先用 [1Panel](https://1panel.cn/)。

它可以帮你可视化管理网站、运行环境、数据库、证书和 Docker 容器。很多原本需要手写配置文件的操作，在面板里点几下就能完成，对新手会友好很多。

![1Panel 官网页面](https://file.ciyuanai.org/picList/2026/06/image%202.png)

### 更新服务器系统

登录服务器后，先更新一下系统软件包：

```bash
sudo apt update && sudo apt upgrade -y
```

这个步骤不是必须每次都做，但新服务器建议先跑一遍，避免后面安装依赖时遇到奇怪的问题。

### 安装 1Panel

执行官方安装脚本：

```bash
sudo bash -c "$(curl -sSL https://resource.fit2cloud.com/1panel/package/v2/quick_start.sh)"
```

安装完成后，终端会输出面板访问地址、用户名和密码，日志大概长这样：

```text
[1Panel install Log]: =================安装已完成==================
[1Panel install Log]: 请使用您的浏览器访问面板：
[1Panel install Log]: 外部地址： http://你的服务器公网IP:面板端口/安全入口
[1Panel install Log]: 内部地址： http://服务器内网IP:面板端口/安全入口
[1Panel install Log]: 面板用户： 系统生成的用户名
[1Panel install Log]: 面板密码： 系统生成的密码
[1Panel install Log]: 如果您使用的是云服务器，请在安全组中打开面板端口
```

面板地址、用户名和密码一定要保存好。第一次登录后，也建议把默认生成的账号密码改成自己能管理的内容。

### 放行面板端口

如果浏览器访问不了安装日志里的 1Panel 地址，第一反应不要急着重装，先去检查安全组。

在云服务器控制台里找到安全组或防火墙规则，把安装日志中提示的面板端口放开。

![云服务器安全组端口放行](https://file.ciyuanai.org/picList/2026/06/image%209.png)

端口放行后，再访问安装日志里的外部地址，就可以进入 1Panel 面板。

![访问 1Panel 面板](https://file.ciyuanai.org/picList/2026/06/image%203.png)

## 用 1Panel 部署前端项目

前端项目部署的本质很简单：把打包后的静态文件放到 Web 服务目录里，然后让 Nginx 或 OpenResty 对外提供访问。

也就是说，前端服务不是一直运行的进程，它更像是一堆已经打包好的 HTML、CSS、JS 和静态资源文件。只要 Web 服务能找到 `index.html`，并且端口、域名配置正确，页面就可以访问。

### 安装 OpenResty

进入 1Panel 的应用商店，搜索并安装 OpenResty。

可以把 OpenResty 理解成增强版 Nginx。后面无论是前端静态站点，还是接口反向代理、HTTPS 证书配置，都会用到它。

![1Panel 应用商店安装 OpenResty](https://file.ciyuanai.org/picList/2026/06/image.png)

安装完成后，确认 OpenResty 服务处于运行状态，然后开始创建静态网站。

![OpenResty 安装完成](https://file.ciyuanai.org/picList/2026/06/image%2010.png)

### 配置域名 DNS 解析

如果希望通过域名访问前端页面，需要先到域名服务商控制台添加 DNS 解析记录。

常见配置如下：

- 记录类型：`A`
- 主机记录：`@` 或 `www`
- 记录值：服务器公网 IP

![配置域名 DNS 解析](https://file.ciyuanai.org/picList/2026/06/image%208.png)

DNS 解析通常需要一点时间才能生效。解析完成后，再到 1Panel 里创建网站，把域名绑定到前端项目目录。

### 上传并访问前端页面

把前端打包后的文件上传到网站根目录。注意这里上传的应该是 `dist` 目录里面的内容，而不是把整个 `dist` 文件夹丢进去。

网站根目录里至少应该能看到：

```text
index.html
assets/
...
```

配置完成后，就可以通过域名访问前端页面。

![前端项目访问成功](https://file.ciyuanai.org/picList/2026/06/image%207.png)

如果访问失败，可以优先检查这几项：

- 域名是否已经解析到服务器公网 IP。
- 安全组是否开放了 `80` 和 `443`。
- OpenResty 是否正常运行。
- 前端打包文件是否放到了正确目录。
- 网站根目录里是否存在 `index.html`。

## 用 1Panel 部署 Java 后端项目

后端项目和前端不太一样。

前端是静态文件，放到 Web 服务目录里就能被读取；Java 后端是一个持续运行的服务，需要有 Java 运行环境，并且要让 `jar` 包常驻运行。

### 创建 Java 运行环境

进入 1Panel 的运行环境页面，创建 Java 环境。这里根据你的项目选择对应的 JDK 版本，再设置 `jar` 包存放目录，把后端打包好的文件上传进去。

![创建 Java 运行环境](https://file.ciyuanai.org/picList/2026/06/image%204.png)

创建完成后，启动这个运行环境。

### 确认后端服务启动成功

后端启动后，先不要急着绑定域名。可以先用服务器公网 IP 加端口访问接口，确认服务本身没有问题。

![后端服务启动成功](https://file.ciyuanai.org/picList/2026/06/image%205.png)

如果接口能正常返回，说明 Java 服务已经跑起来了。

![后端接口访问结果](https://file.ciyuanai.org/picList/2026/06/image%2011.png)

这一步很重要。因为如果直接配置域名，出了问题时你很难判断到底是服务没启动、端口没放行，还是反向代理配置有问题。

### 给后端绑定域名

实际项目里一般不会让用户记住 `IP:端口`，而是会用类似 `api.example.com` 的域名访问后端接口。

在 1Panel 中进入「网站 -> 创建 -> 运行环境」，选择刚才创建好的 Java 环境，然后配置后端域名。这个域名同样需要提前做好 DNS 解析。

![后端绑定域名](https://file.ciyuanai.org/picList/2026/06/image%206.png)

配置完成后，就可以通过域名访问后端接口。

![通过域名访问后端接口](https://file.ciyuanai.org/picList/2026/06/image%201.png)

到这里，前端页面和后端接口就都部署完成了。数据库、Redis、消息队列等常用组件，也可以继续在 1Panel 应用商店里安装。

## 方案二：用 Docker 手动部署

如果你只是想尽快让项目上线，1Panel 已经足够方便。

但如果你想更进一步理解部署原理，或者希望以后迁移服务器、复刻环境更轻松，就可以继续学习 Docker。

Docker 的核心好处是：把项目和运行环境一起打包。换一台服务器时，只要 Docker 环境一致，大部分启动方式都可以复用。

### 安装 Docker 和 Docker Compose

还是先更新系统：

```bash
sudo apt update && sudo apt upgrade -y
```

安装 Docker：

```bash
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
sudo systemctl enable --now docker
```

再安装 Docker Compose：

```bash
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

安装完成后验证版本：

```bash
docker -v
docker-compose -v
```

如果能正常输出版本号，说明 Docker 环境已经准备好了。

### 处理 Docker 权限问题

有些服务器执行 `docker ps` 时会提示权限不足：

```text
permission denied while trying to connect to the docker API at unix:///var/run/docker.sock
```

这是因为当前用户没有 Docker 权限。可以执行下面命令，把当前用户加入 `docker` 用户组：

```bash
sudo usermod -aG docker $USER
```

执行后重启服务器，或者重新登录终端，再运行：

```bash
docker ps
```

能正常执行，就说明权限已经生效。

### 配置 Docker 镜像加速

国内服务器拉取镜像可能比较慢，可以配置 registry mirror：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://dockerproxy.net",
    "https://proxy.vvvv.ee",
    "https://dockerproxy.link"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

配置完成后，再拉取镜像会顺畅一些。

## 用示例部署包部署前后端

这里使用一个示例部署包来说明 Docker 部署的目录结构。部署包里包含后端 Java 项目、前端项目和 Nginx 代理配置。

部署包下载地址：[点我下载部署包](https://static.ciyuanai.org/file/1782441753188_deploy-demo-shell.zip)

下载后上传到服务器并解压，目录结构大概是这样：

```text
deploy-demo-shell/
├── boot/
│   ├── demo.jar
│   ├── deploy.sh
│   └── Dockerfile
├── nginx/
│   ├── cert/
│   ├── conf/
│   └── docker_insert_nginx.sh
└── pc/
    ├── conf/
    ├── docker_insert_nginx.sh
    └── html/
```

这三个目录分别负责不同事情：

- `boot/`：部署后端 Java 项目。把自己的 `jar` 包替换进去，然后执行 `sh deploy.sh`。
- `pc/`：部署前端项目。把前端打包后的文件放到 `html/` 目录，然后执行 `sh docker_insert_nginx.sh`。
- `nginx/`：需要统一反向代理或配置 HTTPS 证书时使用。证书文件放到 `cert/`，代理配置写到 `conf/`。

### 部署后端 Java 服务

进入 `boot` 目录，替换里面的 `demo.jar`，然后执行：

```bash
sh deploy.sh
```

脚本会根据 `Dockerfile` 构建镜像，并启动后端容器。

如果你自己的项目不是 `demo.jar` 这个名字，就要同步检查 `Dockerfile` 或脚本里的文件名，保证它们指向同一个 `jar`。

### 部署前端页面

进入 `pc` 目录，把前端打包产物放到 `html/`：

```text
pc/
└── html/
    ├── index.html
    ├── assets/
    └── ...
```

然后执行：

```bash
sh docker_insert_nginx.sh
```

脚本会启动一个 Nginx 容器，把 `html/` 目录作为网站根目录。

### 查看容器运行状态

执行：

```bash
docker ps
```

如果前后端容器都在运行，会看到类似输出：

```text
CONTAINER ID   IMAGE              STATUS          PORTS                  NAMES
86e34fa1f339   demo-boot:latest   Up 35 seconds   0.0.0.0:8080->8080/tcp demo-boot
59f5fbfa7e9f   nginx:1.24         Up 5 minutes    0.0.0.0:8000->80/tcp   demo-pc
```

这时可以先通过 IP 和端口测试：

- 前端：`http://服务器公网IP:8000`
- 后端：`http://服务器公网IP:8080`

如果后续要绑定域名，思路和 1Panel 一样：先做 DNS 解析，再配置 Nginx 或面板网站，把域名请求转发到对应容器端口。

## 部署失败时先查什么

部署出问题时，不要一上来就重装服务器。大多数问题都可以按下面顺序排查：

1. 服务有没有启动：执行 `docker ps`，或者在 1Panel 里查看运行状态。
2. 端口有没有监听：确认项目实际启动端口和你访问的端口一致。
3. 安全组有没有放行：到云厂商控制台开放 `80`、`443` 和项目端口。
4. 域名有没有解析：用 `ping 域名` 或 DNS 工具确认是否解析到服务器公网 IP。
5. 前端文件位置对不对：网站根目录必须能找到 `index.html`。
6. 后端日志有没有报错：重点看数据库连接、端口占用、配置文件路径。
7. HTTPS 证书是否匹配：证书域名要和当前访问域名一致。

我自己更习惯按“服务本身 -> 端口 -> 安全组 -> 域名 -> 反向代理”的顺序查。

因为这个顺序能先确认项目有没有活着，再去看外部访问链路有没有打通。否则一上来就调域名和证书，很容易在一堆变量里绕来绕去。

## 总结

如果只是想尽快把项目跑起来，建议先用 1Panel。前端、后端、数据库、证书、域名都能可视化管理，对第一次部署的人来说能少踩很多坑。

如果想掌握更通用的部署方式，就继续学习 Docker。它更适合自动化部署、环境迁移和多人协作。

无论使用哪种方式，部署的核心逻辑其实都一样：

- 前端：打包成静态文件，交给 Nginx 或 OpenResty 访问。
- 后端：打包成 `jar`，准备 Java 环境，让服务持续运行。
- 域名：DNS 解析到服务器，再通过网站配置或反向代理转发请求。
- 访问失败：优先检查服务状态、端口、安全组、域名解析和日志。

把这条链路完整跑通一次之后，后面再部署其他项目，就不会再觉得它是一团乱麻了。
