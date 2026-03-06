---
title: "你的电子老婆开源了！登顶 GitHub 热榜"
date: 2026-03-06
tags: [AI, 开源项目，虚拟主播，AI 伴侣]
summary: "GitHub 热榜被一个开源项目占领了——AIRI，一个可以自托管的 AI 虚拟伴侣。支持实时语音、陪玩游戏、Discord/Telegram 聊天，还能在《我的世界》里帮你挖矿盖房。完全开源，自己就能搭一个 7×24 小时在线的 AI 伴侣。"
lang: "zh"
draft: false
priority: 5
---

GitHub 热榜，被一个"纸片人"项目占领了。

不是手办，是 AI。

你的赛博伴侣，开源了。

登顶的项目名叫 **AIRI**，把 AI 陪伴玩出了新高度。

一句话总结：完全开源，自己就能搭一个能实时陪聊、陪你打游戏，还永远不下播的 AI 伴侣。

---

## 什么是 AIRI？

AIRI 是一个开源的 AI 虚拟伴侣项目，灵感来自超火的虚拟主播 Neuro-sama。

Neuro-sama 在 YouTube 有 88 万粉丝，能唱会聊还能打游戏，甚至冲进过 Twitch 订阅榜前 10。

但是，她不开源。

一下播就"断联"，粉丝只能对着黑屏干等。

而 AIRI 就是来解决这种"下播焦虑"的。

它是 Neuro-sama 的开源复刻版，你能自己部署、自己掌控，**7×24 小时在线**，做到永不"下播"。

---

## 形象设计

AIRI 支持两种形象格式：

- **VRM**：3D 虚拟形象格式
- **Live2D**：2D 动态立绘格式

她会自动眨眼、视线跟随，还会有各种小动作。

有"呼吸感"的电子伴侣，这不就来了？

---

## 她能干什么？

### 1. 实时语音聊天

支持语音输入输出，能像真人一样对话。

### 2. 陪玩游戏

在《我的世界》里，她用 Mineflayer 工具，能像真人玩家一样帮你：
- 挖矿
- 盖房子
- 打怪
- 自主探索世界

在《异星工厂》里，她结合 YOLO 视觉识别"看"屏幕上的游戏画面，然后用大模型决策，帮你：
- 搓零件
- 搭自动化产线

（目前是 PoC 演示级，但已经能实际跑起来）

### 3. 多平台聊天

- Discord
- Telegram
- 网页版（浏览器直接打开）

---

## 技术亮点

### 长期记忆

AIRI 内置了 **RAG 机制** 和嵌入式数据库，能长期记住：
- 你们的聊天记录
- 你的说话风格
- 你的偏好

### 跨平台支持

**网页版**：
- 基于 WebGPU、WebAudio、WebAssembly
- 直接打开浏览器就能用
- 手机也能流畅运行
- 支持 PWA（像 APP 一样）

**桌面版**：
- 基于 Tauri
- 底层用 Rust 编写
- 能调用 NVIDIA CUDA 和 Apple Metal 硬件加速

### 模型兼容性

AIRI 原生兼容 **30 多种大模型 API**：
- OpenAI
- Claude
- Gemini
- DeepSeek
- 通义千问
- 智谱
- Kimi
- 阶跃星辰

甚至支持 **Ollama 本地推理**，断网也能正常使用。

---

## 如何搭建？

AIRI 的技术栈是 TypeScript + Vue.js，包管理用 pnpm。

### 环境要求

你需要这几样东西：
- Git
- Node.js 23+
- pnpm

如果要玩桌面版，还需要 Rust 工具链。

### macOS 用户

最简单。打开终端，两行命令搞定：

```bash
brew install git node
corepack enable
corepack prepare pnpm@latest --activate
```

### Windows 用户

稍微麻烦点：

1. 安装 Visual Studio 2022（务必勾选"Windows SDK"和"C++ 构建工具"）
2. 打开 PowerShell，安装 Scoop：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

3. 用 Scoop 安装依赖：

```bash
scoop install git nodejs rustup
corepack enable
corepack prepare pnpm@latest --activate
```

### Linux 用户

按照发行版安装 Git 和 Node.js 就行，Ubuntu 的话 apt 就能搞定。

桌面版需要额外装几个系统库：

```bash
sudo apt install libssl-dev libglib2.0-dev libgtk-3-dev libjavascriptcoregtk-4.1-dev libwebkit2gtk-4.1-dev
```

这些是 Tauri 框架的依赖，缺了编译不过。

---

## 快速上手

### 第一步：拉取源码

```bash
git clone https://github.com/moeru-ai/airi.git
cd airi
```

### 第二步：安装依赖

```bash
corepack enable
pnpm install
```

这一步会下载所有 Node.js 依赖包，根据网络状况可能需要几分钟。

如果要开发桌面版，还需要再跑一个 `cargo fetch` 来拉取 Rust 的依赖。

**小技巧**：项目推荐安装一个叫 `@antfu/ni` 的工具：

```bash
npm i -g @antfu/ni
```

装上之后，你就可以用 `ni` 代替 `pnpm install`，用 `nr` 代替 `pnpm run`，不管项目用的是 npm、yarn 还是 pnpm，`ni` 都能自动识别。

### 第三步：启动开发服务器

AIRI 提供三种启动模式，最快上手的是网页版。

直接一条命令：

```bash
pnpm dev
```

执行后终端会输出一个本地地址，复制到浏览器里打开，你就能看到 AIRI 的界面了。

### 第四步：配置 API

这里要先用密钥接入 API。

支持 Kimi、DeepSeek、通义千问等多种模型，选一个你常用的填进去就行。

配置完成后，就可以开始和你的 AI 伴侣聊天了！

---

## 项目信息

- **项目名称**：AIRI
- **GitHub**：https://github.com/moeru-ai/airi
- **技术栈**：TypeScript + Vue.js + Tauri
- **包管理**：pnpm
- **许可证**：开源

---

## 写在最后

AIRI 的火爆不是没道理的。

它解决了一个真实的需求：**AI 陪伴的连续性**。

下播就"断联"？不存在的。

自己部署，自己掌控，7×24 小时在线。

你的电子伴侣，永远在线。

---

**参考资料**：
- GitHub 项目：https://github.com/moeru-ai/airi
- 原作者：Neuro-sama（虚拟主播）


![封面图](images/airi-open-source-virtual-companion-cover.png)


![封面图](images/airi-open-source-virtual-companion-cover.png)
