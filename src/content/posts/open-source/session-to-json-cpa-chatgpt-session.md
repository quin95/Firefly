---
title: 解决add phone，一键生成CPA json认证文件
published: 2026-05-09T21:30:00+08:00
description: 介绍如何下载 SessionToJson Chrome 插件，读取 ChatGPT session JSON，转换为 CPA 可导入的 JSON 文件。
tags: [SessionToJson, ChatGPT, CPA, Chrome插件, 开源项目]
category: 开源项目
draft: false
image: "../images/category/open-source.png"
author: 朝昆
sourceLink: https://github.com/killervillsy/SessionToJson
---

有些工具需要导入 ChatGPT 的登录会话信息，手动整理字段比较麻烦，也容易填错。`SessionToJson` 这个开源 Chrome 插件做的事情很简单：读取当前页面里的 ChatGPT session JSON，然后转换成 CPA 可以导入的 JSON 文件。

项目地址：

[https://github.com/killervillsy/SessionToJson](https://github.com/killervillsy/SessionToJson)

它不是一个复杂工具，仓库里主要就是 Chrome 扩展文件：`manifest.json`、`popup.html`、`popup.js`、`content.js` 和转换逻辑 `converter.js`。从代码看，它会读取当前页面可见文本，解析为 JSON，再把字段转换为 CPA 需要的格式，比如 `accessToken` 会转换为 `access_token`，账号 ID、邮箱、过期时间等字段也会一起写入导出的文件。

> [!WARNING] 安全提醒
> ChatGPT session JSON 里包含登录凭证，导出的 CPA JSON 也属于敏感文件。只在自己的电脑上操作，不要发给别人，不要上传到网盘、群聊、公共图床或不可信网站。导入完成后，建议把下载文件妥善保存或删除。

## 一、下载插件源码

打开项目仓库：

[SessionToJson GitHub 仓库](https://github.com/killervillsy/SessionToJson)

点击页面右上方的 `Code` 按钮，选择 `Download ZIP` 下载源码压缩包。

下载完成后解压，得到类似下面的目录：

```text
SessionToJson-main/
  manifest.json
  popup.html
  popup.js
  popup.css
  content.js
  converter.js
  icons/
```

这个目录就是等会儿要导入 Chrome 的插件目录。

## 二、在 Chrome 中导入插件

打开 Chrome 扩展程序管理页面：

```text
chrome://extensions/
```

然后按下面步骤操作：

1. 打开右上角的 `开发者模式`
2. 点击 `加载已解压的扩展程序`
3. 选择刚刚解压出来的 `SessionToJson-main` 文件夹
4. 确认扩展列表里出现 `SessionToJson`

如果导入成功，Chrome 工具栏里就可以看到这个插件。看不到的话，可以点击工具栏右侧的扩展图标，把 `SessionToJson` 固定出来。

## 三、登录 ChatGPT

打开 ChatGPT：

[https://chatgpt.com/](https://chatgpt.com/)

确认你已经登录自己的账号。如果没有登录，后面的 session 接口拿不到有效信息。

登录完成后，不需要在 ChatGPT 页面做其他操作，保持当前浏览器处于已登录状态即可。

## 四、打开 session 接口

在同一个 Chrome 浏览器里打开：

[https://chatgpt.com/api/auth/session](https://chatgpt.com/api/auth/session)

如果登录状态正常，页面会显示一段 JSON 内容。里面通常会包含账号信息、过期时间以及 `accessToken` 等字段。

如果页面显示未登录、空内容或报错，可以回到 ChatGPT 首页重新登录，再刷新这个接口页面。

## 五、用插件读取并转换 JSON

保持当前页面停留在：

```text
https://chatgpt.com/api/auth/session
```

然后点击 Chrome 工具栏里的 `SessionToJson` 插件图标。

插件弹窗打开后，依次点击：

1. `Read Page JSON`
2. `Convert`
3. `Download JSON`

这三个按钮分别对应三个动作：

- `Read Page JSON`：读取当前页面显示的 session JSON
- `Convert`：转换成 CPA 需要的 JSON 格式
- `Download JSON`：下载转换后的 JSON 文件

下载的文件名通常会包含账号邮箱和套餐信息，类似：

```text
codex-user-example.com-plus.json
```

实际文件名以插件生成结果为准。

## 六、导入 CPA

打开 CPA，找到账号或凭证导入入口，选择刚刚下载的 JSON 文件导入。

导入完成后，可以在 CPA 中检查账号是否识别成功。如果导入失败，优先检查下面几项：

- 是否在 ChatGPT 已登录状态下打开 session 接口
- `Read Page JSON` 后左侧文本框是否真的读取到了 JSON
- 是否先点击了 `Convert`，再点击 `Download JSON`
- 下载的文件是否是插件生成的新文件，而不是原始 session 页面内容
- ChatGPT 登录状态是否已经过期

如果 session 已经过期，重新登录 ChatGPT，再重复读取、转换和下载即可。

## 七、常见问题

### 1. 插件读取失败

先确认当前页面是不是 JSON 页面：

```text
https://chatgpt.com/api/auth/session
```

插件读取的是当前页面正文内容。如果页面不是 JSON，或者页面里显示的是登录页、错误页、空白页，就会解析失败。

### 2. Convert 后有 warning

插件转换逻辑会读取固定字段，例如 `accessToken`、`account.id`、`user.email`、`expires` 等。如果某些字段不存在，可能会提示 warning。

一般来说，核心要看 `access_token` 是否存在。如果关键字段缺失，多半是 session 接口没有返回完整登录信息，可以重新登录后再试。

### 3. 下载后的 JSON 能不能长期使用

不能把它当作永久凭证。session 有过期时间，过期后需要重新导出。

同时，这个 JSON 文件可以代表你的登录状态，安全级别很高。不要把它提交到 Git 仓库，也不要放进博客文章附件、公开下载目录或聊天记录里。

## 小结

整个流程其实就是：

1. 从 GitHub 下载并解压 `SessionToJson`
2. 在 Chrome 扩展程序页面加载插件
3. 登录 ChatGPT
4. 打开 `https://chatgpt.com/api/auth/session`
5. 点击 `Read Page JSON`
6. 点击 `Convert`
7. 点击 `Download JSON`
8. 在 CPA 中导入下载的 JSON 文件

这个插件的价值在于把“复制 session、整理字段、生成 CPA JSON”这件事自动化了。操作本身不复杂，但一定要注意文件安全：导出的 JSON 只给自己用，用完妥善处理。
