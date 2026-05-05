---
title: App逆向环境搭建：抓取 APK HTTPS 包
published: 2026-05-05
updated: 2026-05-05
description: 按完整实操流程搭建 Android 模拟器抓包环境，使用 Android Studio、Charles、Magisk 和 MoveCertificate 抓取 APK HTTPS 包。
tags: [逆向, App逆向, Android, Charles, Magisk, HTTPS, 抓包]
category: 逆向分析
draft: false
image: ../images/category/reverse.png
author: 朝昆
sourceLink: https://mp.weixin.qq.com/s/5lPVkF3jNc3hK6KFl1qR1w
---

> [!WARNING] 免责声明
> 本教程仅供学习和研究使用，请勿用于任何非法用途。对他人应用进行逆向分析时，应遵守相关法律法规，尊重开发者权益，未经授权不得进行恶意篡改或侵犯用户隐私。

Android 逆向工程是指通过分析 APK 文件的代码、资源、网络通信等，理解其内部实现逻辑，甚至修改其行为的技术。常见的应用场景包括：协议分析、去广告、漏洞挖掘、竞品研究等。本文按完整环境搭建流程，带你在本地搭建一套 App 逆向环境，并抓取手机 APK 的 HTTPS 包。

我本地环境是 Mac M4 pro 芯片，这里采用 Android Studio 自带的 AVD 模拟器。你如果有条件，也可以直接使用真实手机；Windows 用户则可以考虑雷电、夜神等模拟器。本文主要围绕 Android Studio 模拟器展开。

## 环境说明

- 宿主机：macOS / Windows / Linux
- 模拟器：Android Studio 自带 AVD（Android Virtual Device）以及 `adb`（Android Debug Bridge）
- 目标 Android 版本：Android 16（API 36）`arm64`
- 抓包工具：Charles Proxy/Reqable
- 必要工具：`Magisk`、`MoveCertificate` Magisk 模块

> PS：逆向分析通常还需要本地提前安装好 Java、Python 环境。这些安装配置都比较常见，这里不再展开。macOS 用户可以直接通过 `brew` 安装。

## 一、环境搭建

### 1. 安装 Android Studio（AVD 手机模拟器）

如果你使用的是真实手机，可以跳过这一步。

### 1.1 从官网下载并安装 Android Studio

官网地址：

[Android Studio 官网](https://developer.android.google.cn/studio?hl=zh-cn)

![](https://file.ciyuanai.org/picList/2026/05/image-20260505161403190-20260505161712383.png)



### 1.2 安装 Android 手机镜像

打开 `Android Studio`，进入 `SDK Manager`，切换到 `SDK Platforms` 标签页。

- 勾选需要安装的 Android 镜像
- 点击 `Apply` 下载镜像

![image-20260505185405307](https://file.ciyuanai.org/picList/2026/05/image-20260505185405307.png)

### 1.3 通过模拟器创建 Android 手机

打开 `Device Manager`，点击 `Create device`。

- 选择一款 Android 设备，尽量选择较低版本对应的设备型号，比如 `Pixel 7`
- 点击 `Next`
- 在系统镜像列表中，选择刚刚下载的 Android 16 镜像
- 点击 `Next`
- 根据需要配置 AVD 名称
- `Services` 选择 `Google APIs`
- 点击 `Finish`

> 拓展：`Services` 类型说明
>
> - `AOSP`：纯开源系统，无 Google 服务，可 Root
> - `Google APIs`：包含 Google 服务框架，使用测试密钥，可 Root，推荐
> - `Google Play Store`：包含完整 Google 服务和 Play 商店，使用生产密钥，默认无法 Root，通常需要额外工具
>
> 本文后续步骤均基于 `Google APIs` 镜像。

![image-20260505185448947](https://file.ciyuanai.org/picList/2026/05/image-20260505185448947.png)

### 1.4 启动模拟器

创建完成后，启动模拟器，确保系统能够正常开机和进入桌面。

### 1.5 可选：将模拟器语言切换为中文

如果你不习惯英文界面，可以按下面路径改成中文：

- 主页面上划，打开 `Setting`
- 搜索 `Language`
- 进入 `App Languages`
- 点击 `System Languages`
- 添加中文

完成后，模拟器系统界面会切换成中文，后续找设置项会更直观一些。

### 2. 安装 Charles（抓包神器）

### 2.1 下载并安装 Charles

从官网下载安装对应系统版本的 Charles：

[Charles 官网](https://www.charlesproxy.com/)

首次运行时会提示试用，可以先继续使用；如果需要长期使用，建议购买正版。

### 2.2 激活 Charles

Charles 支持免费试用一段时间。如果你要长期使用，建议使用正版授权。

原文里也提到了一个激活网站，这里保留来源信息但不展开具体使用说明：

[激活网站地址](https://www.zzzmode.com/mytools/charles/)

Charles 中的注册入口在：

- `Help -> Register Charles`

### 2.3 配置 HTTP 代理

打开 Charles，点击：

- `Proxy -> Proxy Settings`

![image-20260505185931254](https://file.ciyuanai.org/picList/2026/05/image-20260505185931254.png)

确认：

- `HTTP Proxy` 端口为 `8888`（默认）
- 勾选 `Enable transparent HTTP proxying`

![image-20260505185956323](https://file.ciyuanai.org/picList/2026/05/image-20260505185956323.png)

### 2.4 配置 Android 模拟器代理

在模拟器中打开当前网络设置，进入 Wi-Fi 详情页并编辑网络。

- 打开网络设置
- 点击右上角编辑按钮
- 选择高级选项
- 选择手动配置代理
- 输入 Charles 本地 IP 和监听端口 `8888`

![image-20260505190131635](https://file.ciyuanai.org/picList/2026/05/image-20260505190131635.png)

这里的 Charles 本地 IP，本质上就是你当前电脑在局域网中的 IP 地址。

如果不知道本机 IP，可以在 Charles 中查看：

- `Help -> Local IP Address`

### 2.5 验证 HTTP 抓包效果

先在 Android 模拟器中的浏览器访问：

[http://httpbin.org/get](http://httpbin.org/get)

然后查看 Charles 是否抓到了对应请求。

如果 Charles 能看到请求，说明下面几件事已经通了：

- 模拟器网络正常
- Charles 代理已生效
- 模拟器请求已经成功经过宿主机代理

不过此时你只能抓取 `HTTP` 的包，还不能抓 `HTTPS` 的包，因为 Charles 根证书还没有完成系统级配置。后面在 Root 权限开启后，会继续把用户证书提升为系统证书，从而实现 HTTPS 抓包。

![image-20260505190205163](https://file.ciyuanai.org/picList/2026/05/image-20260505190205163.png)

## 二、开启 Root 权限（Magisk + 补丁）

Android 高版本模拟器默认没有 Root，需要手动安装 Magisk 获取 Root 权限，为后续挂载系统证书做准备。

### 1. 安装 Magisk

### 1.1 下载 Magisk APK

官方下载地址：

[Magisk Releases](https://github.com/topjohnwu/Magisk/releases)

如果访问 GitHub 不方便，原文还给了一个备用下载地址：

[Magisk 备用下载地址](https://magiskcn.com/magisk-download.html)

### 1.2 将 APK 安装到模拟器

直接把下载好的 APK 拖入 Android 模拟器中即可安装。

安装完成后打开 Magisk，首次进入时通常会提示修复环境并要求重启设备，点击确认即可。

![image-20260505190313341](https://file.ciyuanai.org/picList/2026/05/image-20260505190313341.png)

### 1.3 初始状态说明

重启之后，你会发现 Magisk 下方的超级用户模块仍然是未解锁状态。接下来就需要通过打补丁的方式，给模拟器镜像添加 Root 能力。

### 2. 镜像打补丁（获取永久 Root）

再次进入 Magisk 后，如果 Root 模块还未开启，就需要通过镜像打补丁，或者手动用命令临时开启 Root。本文按原文流程，采用镜像打补丁的方式。

> 补丁方式的原理，是将 Magisk 直接集成到系统镜像中。这是一种永久 Root 方案，可以让模拟器每次启动时自动获得 Magisk 支持，而不需要每次通过命令行附加 `-writable-system`、`-selinux permissive` 等启动参数。

### 2.1 关闭运行中的 Android 模拟器

在执行补丁前，先完全关闭当前模拟器。

### 2.2 获取 `build.py` 脚本

从 Magisk 源码仓库中获取 `build.py` 脚本，把整个仓库拉下来进入仓库目录执行。

脚本地址：

[Magisk build.py](https://github.com/topjohnwu/Magisk/blob/master/build.py)

### 2.3 定位系统镜像目录

Android SDK 的系统镜像通常位于以下位置，我们需要的关键文件是 `ramdisk.img`：

```text
macOS: ~/Library/Android/sdk/system-images/android-36/google_apis/arm64-v8a/
Windows: C:\Users\用户名\AppData\Local\Android\sdk\system-images\android-36\google_apis\arm64-v8a\
Linux: ~/Android/Sdk/system-images/android-36/google_apis/arm64-v8a/
```

### 2.4 执行补丁命令

注意先确认你自己的 Android 模拟器镜像目录名称，例如：

`android-36/google_apis/arm64-v8a`

![image-20260505190509342](https://file.ciyuanai.org/picList/2026/05/image-20260505190509342.png)

示例命令如下：

```bash
# 对镜像打补丁
./build.py avd_patch --apk ../Downloads/Magisk-v30.7.apk /Users/ziyi/Library/Android/sdk/system-images/android-36/google_apis/arm64-v8a/ramdisk.img ramdisk_patched.img

# 备份原文件，避免后续需要恢复原始镜像时没有备份
cp ramdisk.img ramdisk.img.backup

# 用补丁后的镜像覆盖原镜像
cp ramdisk_patched.img /Users/ziyi/Library/Android/sdk/system-images/android-36/google_apis/arm64-v8a/ramdisk.img
```

### 2.5 重启模拟器并验证 Root

重新启动模拟器，再次进入 Magisk。如果看到超级用户模块已经解锁，说明 Root 已经成功。

![image-20260505190603185](https://file.ciyuanai.org/picList/2026/05/image-20260505190603185.png)

## 三、Charles 根证书配置

### 1. 电脑信任证书

### 1.1 开启 Charles HTTPS 抓包

在 Charles 中打开：

- `Proxy -> SSL Proxying Settings`

添加一条 SSL 抓包规则：

```text
*:*
```

![image-20260505190940637](https://file.ciyuanai.org/picList/2026/05/image-20260505190940637.png)

### *1.2 保存 Charles 根证书

在 Charles 中导出根证书，保存到本地。

### 1.3 在电脑侧安装并信任证书

双击证书并安装，在系统证书管理中将该证书设置为信任。

这一步是为了让宿主机上的 Charles 可以正确处理 HTTPS 流量。

### 2. 手机安装证书

### 2.1 将 Charles 根证书推送到 Android 模拟器

先确认 `adb` 能识别到模拟器设备，再把证书推送到 `/sdcard`：

```bash
# 1. 查看 adb 是否识别到 Android 手机
adb devices

# 执行结果示例：
# List of devices attached
# emulator-5554        device

# 2. 将 Charles 根证书推送到模拟器
# Charles 根证书位置：~/Desktop/charles-ssl-proxying-certificate.pem
# 推送 Android 目标位置：/sdcard
adb push ~/Desktop/charles-ssl-proxying-certificate.pem /sdcard
```

### 2.2 在系统设置中安装证书

在 Android 设置中搜索“证书”，找到 `CA 证书`。

### 2.3 选择证书并完成安装

按下面流程安装：

- 点击 `CA 证书`
- 选择“仍然安装”
- 找到刚刚推送到手机中的 Charles 根证书
- 点击证书进行安装

### 2.4 在可信凭据中确认用户证书

看到“已安装 CA 证书”提示后，在设置中找到“证书管理应用”，进入“可信凭据”，在“用户”分类下确认 Charles 证书已经存在。

到这一步，证书已经作为用户证书安装成功。

### 3. 提升为系统证书

仅安装为用户证书，通常仍然无法抓取很多 App 的 HTTPS 包，所以还需要把用户证书提升为系统证书。

原文给出了两种方案，这里按原文采用方案二：

- 方案一：手动计算签名后移动到 `/system/etc/security/cacerts/`
- 方案二：使用 `MoveCertificate` Magisk 模块自动移动，推荐

### 3.1 下载 MoveCertificate 模块

从 GitHub Releases 下载 `MoveCertificate-xxx.zip`：

[MoveCertificate Releases](https://github.com/ys1231/MoveCertificate/releases)

### 3.2 推送模块到 Android 模拟器

```bash
adb push ~/Downloads/MoveCertificate-v1.5.6.zip /sdcard/
```

### 3.3 通过 Magisk 安装模块

在 Android 模拟器中打开 Magisk：

- 点击右下角“模块”
- 选择“从本地安装”
- 选择刚刚推送进去的 `zip`
- 安装完成后重启

安装成功后，该模块会在每次启动时自动将用户证书复制到系统目录，不需要手动重复移动。

![image-20260505195335825](https://file.ciyuanai.org/picList/2026/05/image-20260505195335825.png)

### 3.4 验证系统证书

进入：

- 设置
- 证书管理应用
- 可信凭据
- 系统证书

确认其中已经存在 Charles 证书。

![image-20260505195354968](https://file.ciyuanai.org/picList/2026/05/image-20260505195354968.png)

### 3.5 验证 HTTPS 抓包

这里有两个注意点：

- 手机重启后，需要重新配置代理
- 需要保证手机和电脑在同一网络环境下

如果你只想抓模拟器流量，不希望 Charles 同时抓宿主机流量，可以取消勾选 `macOS Proxy`。Windows 上操作思路类似。

完成这些后，再次用浏览器或目标 App 发起 HTTPS 请求，确认 Charles 中已经可以看到对应的 HTTPS 数据。

### 3.6 验证目标 APK 的 HTTPS 包

最后就可以对目标 APK 进行实际抓包验证。如果前面步骤都已经完成，通常就能正常看到目标应用的 HTTPS 请求。

## 小结

按照上面的流程，整套环境的核心链路就是：

1. 安装 Android Studio 和 AVD 模拟器
2. 安装 Charles，并先打通 HTTP 代理
3. 安装 Magisk，给模拟器镜像打补丁，拿到 Root 权限
4. 安装 Charles 根证书
5. 借助 MoveCertificate 将用户证书提升为系统证书
6. 最终完成 HTTPS 抓包

到这里，这篇“环境搭建”的目标就完成了。后续如果你继续做 App 逆向分析，比如协议分析、接口还原、证书校验绕过或动态调试，这套环境就可以直接作为基础环境使用。
