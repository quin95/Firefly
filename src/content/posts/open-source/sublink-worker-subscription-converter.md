---
title: "SubLink Quin：一个 Worker 搞定所有代理订阅链接转换与管理"
published: 2026-06-18T11:00:00+08:00
description: "介绍 SubLink Quin —— 一款由我开发的轻量级代理协议订阅转换与管理工具，支持一键部署至 Cloudflare Workers、Vercel 或 Node.js，完美保护您的订阅隐私。"
tags: [SubLink Quin, 订阅转换, 开源项目, Cloudflare Workers, Hono]
category: 开源项目
draft: false
image: "../images/category/open-source.png"
author: Quin.Lin
sourceLink: https://github.com/quin95/sublink-worker
---

在配置多设备、多客户端（如 Sing-Box、Clash、Surge、Xray）的代理环境时，我们经常需要处理各种不同格式的订阅链接。市面上虽然有很多公共订阅转换服务，但将敏感的订阅链接提交给第三方，不仅有隐私泄露和节点被窃取的风险，还可能受限于公共服务的速度和稳定性。

为了彻底解决这些痛点，我开发并改造了 **SubLink Quin** —— 一款轻量级、安全且支持多平台部署的代理协议订阅转换与管理工具。你可以用最简单的步骤，免费将其部署在自己的 Cloudflare Workers、Vercel 或私有服务器上，彻底掌控自己的订阅数据。

项目开源地址：[SubLink Quin GitHub 仓库](https://github.com/quin95/sublink-worker)

---

## 🖥️ 界面预览

SubLink Quin 搭载了极具辨识度的 **现代像素艺术风格（Pixel Art）** Web 界面，完美支持浅色/深色主题切换与自适应布局。

![首页](../images/sublink-1.png)
![订阅管理](../images/sublink-2.png)

---

## ✨ 核心特性

SubLink Quin 不仅仅是一个格式转换器，它更是一个完整的订阅管理中枢：

### 1. 全协议与主流客户端支持
SubLink Quin 实现了底层协议的精准解析与重构，能够完美处理以下协议和客户端的互转：

| 分类 | 支持列表 |
| :--- | :--- |
| **支持的输入协议** | ShadowSocks • VMess • VLESS • Hysteria2 • Trojan • TUIC |
| **支持的输出客户端** | Sing-Box (JSON) • Clash (YAML) • Surge (INI) • Xray/V2Ray (Base64) |
| **支持的导入源** | Base64 订阅链接 • HTTP/HTTPS 节点列表 • 完整的配置文件 (Clash YAML / Sing-Box JSON / Surge INI) |

### 2. 强大的多源导入与策略定制
你可以同时输入多个订阅源或单节点链接，SubLink Quin 会自动对它们进行去重和解析。在 Web 界面中，你还可以自由定制：
* 预定义的规则集（Rule Sets）
* 自定义策略组（如 自动选择、手选节点、故障转移、直连等）
* 自动按国家/地区对节点进行分组（如 香港、日本、美国等）

### 3. 基于 KV 存储的短链接管理
工具内置了短链接系统。当你配置好复杂的转换参数后，可以一键生成固定或随机的短链接（如 `https://your-worker.workers.dev/s/my-config`）。短链接的映射关系保存在 KV 数据库中，既保护了真实订阅地址，又极大地方便了在客户端中的输入和更新。

### 4. 多语言支持
内置多国语言包，支持 **中文、英文、波斯语、俄语**，会根据用户的浏览器语言自动适配，也可以手动切换。

---

## 🛠️ 小而美的技术架构

SubLink Quin 能够保持极致轻量和快速响应，得益于其精炼的技术选型：

* **Hono 框架**：项目没有使用重量级的前端框架（如 React/Vue），而是采用超轻量的 Web 框架 [Hono](https://hono.dev/)，配合 **JSX SSR (服务端渲染)** 渲染 HTML 界面。这使得编译产物极小（仅百余 KB），冷启动速度极快。
* **多运行时适配（Runtime Adapter）**：我们对底层运行时进行了抽象，使同一份代码可以完美运行在：
  * **Cloudflare Workers** (基于边缘计算，免服务器，免费额度充足)
  * **Vercel** (支持 Serverless 函数与边缘函数)
  * **Node.js / Docker** (适合私有 VPS 部署)
* **弹性 KV 适配器**：短链和基础配置的存储抽象了统一接口。在 Cloudflare 下自动使用官方绑定的 Cloudflare KV；在 Node.js 或 Vercel 环境下则支持接入 Redis、Upstash REST KV，或者在无数据库时自动使用内存进行本地兜底，极具弹性。

---

## 🚀 快速开始与自建步骤

### 方式一：一键部署到 Cloudflare Workers（推荐）
这是最简单、零成本且最安全的部署方式。

1. 打开 [SubLink Quin 仓库](https://github.com/quin95/sublink-worker)。
2. 点击 README 中的 **Deploy to Cloudflare Workers** 按钮。
3. 按照提示登录您的 Cloudflare 账号，授权并一键部署。
4. 部署完成后，在 Cloudflare 控制台为该 Worker 绑定一个 KV 命名空间（命名为 `SUBLINK_KV`），以便启用短链功能。

### 方式二：在私有服务器 (Node.js / Docker) 部署
如果您拥有自己的 VPS，也可以直接运行：

```bash
# 克隆项目并安装依赖
git clone https://github.com/quin95/sublink-worker.git
cd sublink-worker
npm install

# 编译并启动 Node 服务
npm run build:node
node dist/node-server.cjs
```

或者使用 **Docker Compose** 快速拉起容器（支持配合 Redis 容器存储短链）：
```yaml
version: '3'
services:
  sublink:
    image: quin95/sublink-worker:latest
    ports:
      - "8788:8788"
    environment:
      - REDIS_URL=redis://redis:6379
  redis:
    image: redis:alpine
```

---

## 🙏 致谢与参与贡献

本项目是一次基于优秀开源项目 [7Sageer/sublink-worker](https://github.com/7Sageer/sublink-worker) 的二次开发。在保留原项目出色的订阅转换逻辑基础上，我们重构了多运行时架构，美化了 UI，增强了短链接系统的兼容性和健壮性。在此对原作者及所有上游贡献者表示诚挚的谢意！

如果你在使用过程中遇到了问题，或者有新的功能想法，非常欢迎到 GitHub 提交 Issue 或 Pull Request，一起完善这个工具。

点个 **Star** 支持一下吧 🌟：[quin95/sublink-worker](https://github.com/quin95/sublink-worker)
