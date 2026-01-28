---
title: "Moltbot：把聊天软件变成个人 AI 系统"
date: 2026-01-28
tags: [AI, Agent, 自动化, 架构, 工具推荐]
summary: "从入门例子到架构原理与源码入口，讲清楚 Moltbot 如何把 Telegram/WhatsApp 等聊天入口、Gateway 控制平面、多设备 Nodes 与 Canvas 可视化工作台拼成一个可自托管的个人 AI 系统。"
lang: "zh"
draft: false
priority: 0
---

### Moltbot：把你的“聊天软件”变成一个可编排的个人 AI 系统

如果你这两年一直在用 ChatGPT、Claude 之类的大模型，大概率已经踩过这些坑：

- 要么手机上聊天，结果一旦涉及到代码、日志、命令行，就不得不跑到电脑上重新操作一遍，再把结果截图/复制回去；
- 要么电脑上开着网页/桌面端，一旦需要拍照、录屏、发语音，又只能掏出手机，两个设备来回倒腾；
- 每次想把 AI 真正接到自己工作流里，都要自己搭一堆 webhook、脚本、自动化，维护成本高得离谱。

**Moltbot 想做的事情其实很简单：你只需要在熟悉的聊天软件里说话（WhatsApp / Telegram / Discord / iMessage / Slack 等），剩下的都交给它。**  
它在背后帮你接入这些聊天入口、调度你的电脑和手机、把结果整理好，再“端着一份答卷”回到你刚才说话的那个对话框里。

如果你最近看到 Moltbot（或它的前身 clawdbot）在开发者圈很火，最容易产生的误解是：它只是“又一个聊天机器人”。  
但真正让它出圈的，是它把 **多渠道收发、设备执行、可视化 Canvas、安全默认值、插件扩展** 这几件原本需要你自己拼起来的能力，做成了一套“可以自托管”的体系。

这篇文章分三部分：**入门（所有人都能看懂）→ 原理讲解（给懂工程思维的读者）→ 源码分析（给想读代码的读者）**。  
目标是：读完你就能准确理解它是怎么工作的、为什么它强、以及你应该从哪里下手深挖。

---

### 一、入门
#### 1）一句话定义
**Moltbot 是一个你自己掌控的“个人 AI 助手平台”**：你在一台机器上跑一个长期在线的 **Gateway（网关/控制平面）**，它接入 Telegram / WhatsApp / Slack / Discord / WebChat 等对话入口，把消息交给 AI Agent 处理；必要时还能调度你的 **手机/电脑（Nodes）** 去执行拍照、录屏、定位、运行命令等动作，再把结果发回到原来的聊天窗口里。

官方文档也给出了一张类似的“how it works”架构示意：Gateway 是单一长驻进程，下面挂着 CLI、WebChat、macOS app、iOS/Android nodes 等组件，核心通信通过 WebSocket 控制平面完成（默认 loopback）：见 [官网总览（How it works / Network model）](https://docs.molt.bot/) 与 [架构概念](https://docs.molt.bot/concepts/architecture)。（代码侧默认端口也可在 `src/config/paths.ts` 与 `src/config/port-defaults.ts` 核对）

---

#### 2）几个“很直观”的例子：看完就知道它在解决什么
##### 例子 A：你在 Telegram 里像聊天一样下任务
你在 Telegram 对 Moltbot 说：“把这段英文邮件改得更礼貌，并列出 3 个可选版本。”  
- Telegram 只是 **Channel（渠道入口）**：负责收发消息  
- Gateway 收到后把请求路由到你的 session，让 Agent 输出多版本回复  
- 最终仍然回到 Telegram

这类场景看起来像普通 bot，但它的“底盘”更强：同一个 Gateway 还可以同时接 WhatsApp/Slack/Discord，而不是每个平台各搭一套（多渠道接入的设计在 [Channels 文档](https://docs.molt.bot/channels) 里有完整列举）。

##### 例子 B：一句话同时调用“电脑 + 手机”
你在 WhatsApp 说：“帮我在电脑上跑 `git log -n 20`，然后把最近提交做成看板给我看。”  
这件事其实分两段：
- **电脑 Node** 执行命令（跑 git）  
- **Canvas** 展示“看板 UI”（不是一大段文字）

WhatsApp 只是入口，真正执行发生在你授权的设备上。你得到的体验是：仍然在聊天里发一句话，但背后执行的是“多设备协作”。

##### 例子 C：把“聊天”升级成可视化面板（Canvas）
如果你希望一个“持续可见、可交互”的界面（比如今日待办、项目看板、设备状态），聊天窗口天生不适合。  
Moltbot 的 Canvas 相当于给 Agent 一个“可视化工作台”：可以 present/navigate/eval/snapshot；还可以用 A2UI 把结构化 UI 推送到 Canvas 面板里（macOS 端文档写得很清楚：Canvas 面板是 WKWebView；Canvas 通过 Gateway WebSocket 暴露；A2UI 由 Gateway 的 canvas host 提供，默认 A2UI host URL 是 `http://<gateway-host>:18793/__moltbot__/a2ui/`，而面向节点 WebView 的 Canvas host 路径是 `/__moltbot__/canvas/`）。见 [macOS Canvas](https://docs.molt.bot/platforms/mac/canvas) 与 [官网总览（Network model）](https://docs.molt.bot/)。（代码侧路径常量在 `src/canvas-host/a2ui.ts`：`A2UI_PATH`/`CANVAS_HOST_PATH`）

##### 例子 D：生活向的“小管家”——喝水提醒 + 空气质量播报
你可以把 Moltbot 当成一个“会用你手机的生活小助理”：  
- 每天早上 9 点、下午 3 点，它通过绑定的手机 node 给你在 WhatsApp/Telegram 上发一条「喝水提醒」，顺手附上今天的天气和紫外线指数；  
- 晚上固定时间，它在家庭群里播报你所在城市的空气质量、温度变化，用一句话告诉大家「今天适不适合开窗/跑步」。  
你的体验就是：这些信息像“家人发来的贴心消息”一样，准时出现在聊天框里，而不是一堆孤立的 App 通知。

##### 例子 E：团队协作——用群聊 + Canvas 做轻量项目看板
想象一个小团队的迭代群：  
- 大家还是照常在 Telegram/Slack 群里聊需求、贴 PR 链接；  
- 当有人说“这周的任务整理成一个看板给我看看”，Moltbot 会去读 Git 仓库的提交/Issue/PR 标签，把本周任务自动整理成「待办 / 进行中 / 已完成」的看板，推送到 Canvas 里；  
- 群里只需要发一句“打开迭代看板”，就能在本地 Canvas 面板看到最新状态，而不用自己维护一个额外的 Trello/Jira。  
从使用者视角，这更像是“群聊里多了一个懂项目的队友”，而不是又多学了一套复杂的管理工具。

---

#### 3）一张简单的架构示意图

你可以先用这张“文字版架构图”在脑子里过一遍整体结构：

```text
外部聊天渠道（Telegram / WhatsApp / Slack / Discord / Signal / WebChat ...）
                 │
                 ▼
        ┌─────────────────────┐
        │      Gateway        │  ← 唯一长期运行的进程
        │  路由 / 会话 / 安全  │  WebSocket 控制平面
        │  工具 / 插件 / 记忆  │  Canvas host
        └─────────┬───────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   Clients / UI           Nodes（节点设备）
   ───────────           ────────────────
   - CLI (moltbot)       - macOS Node
   - WebChat / 控制台     - iOS / Android App
   - macOS App           - node-host（服务器/电脑）
```

读这张图时，只要记住两点就够了：
- 上面是“你怎么和它说话”（渠道 + 各种客户端界面）
- 下面是“它在哪些设备上真正动手做事”（Nodes）

---

#### 4）最关键的一句心智模型
很多人理解 Moltbot 的障碍，是把“渠道入口”和“设备执行”混为一谈。最准确的区分是：

- **Channel（渠道）**：你在哪个平台说话（Telegram/WhatsApp/Slack/Discord…）  
- **Client/UI（客户端界面）**：你怎么操控 Gateway（CLI / WebChat / Control UI / macOS app 等）  
- **Node（节点设备）**：在哪台设备上“做事”（手机/电脑/某台 node-host 进程）  
- **Gateway（网关）**：系统总机，负责路由、会话、安全、工具、节点调度

---

### 二、原理讲解
这一节假定你有一点工程思维，但**从零开始讲清楚机制**，不要求你先读过源码。

---

#### 1）先从“网络视角”看：所有东西都围绕 Gateway 打转
你可以把 Moltbot 想成一张星型网络：

```text
Telegram / WhatsApp / Slack / Discord / WebChat ...
               │
               ▼
        [ Gateway 守护进程 ]
               │
     ┌─────────┴─────────┐
     │                   │
 [ 控制端 / UI ]      [ Nodes 设备 ]
```

- **所有“聪明的事”和“危险的事”都发生在 Gateway 一侧**：  
  - 它接入 Channels，统一做路由/会话/安全  
  - 它根据需要调度 Nodes 去执行动作  
  - 它负责把结果再送回原来的入口
- 官方文档也明确写了：Gateway 是唯一长期运行的进程，大部分操作都通过它的 WebSocket 控制平面流转（默认 loopback-first）。见：  
  - 总览页：`https://docs.molt.bot/`  
  - 架构概念：`https://docs.molt.bot/concepts/architecture`

如果没有这个“长期在线的总机”，你需要在每个 Telegram/WhatsApp/Slack 机器人里各自维护：  
路由规则、权限、安全策略、设备列表、记忆索引……几乎不可能长期维护。

---

#### 2）一条消息，从 Telegram 进来会发生什么？
假设你在 Telegram 对 Moltbot 说：

> “帮我在电脑上跑 `git status`，再总结一下有哪些改动。”

可以拆成这 6 步：

1. **Channel 适配**  
   - Telegram Bot 收到消息事件，Moltbot 的 Telegram Channel 代码把它转换成统一的“入站消息”格式：  
     包含：文本内容、发送者 ID、聊天类型（私聊/群聊）、群信息等。

2. **Gateway 收到入站消息，先做安全/路由**  
   - 检查这是谁：是否已配对/在 allowlist？（pairing 和安全见：`https://docs.molt.bot/gateway/pairing`、`https://docs.molt.bot/gateway/security`）  
   - 如果在群聊：是否需要被 @ 才响应？（防止在大群里被滥用）  
   - 调用路由逻辑决定：  
     - 这条消息应该交给哪个 **Agent**（例如个人助手 vs 工作助手）  
     - 归到哪个 **Session**（方便维护上下文，防止不同群、不同人串线）

3. **Agent 读上下文，决定要不要“找设备帮忙”**  
   - Agent 拿到这条消息和最近的会话历史（Session 记忆）。  
   - 它理解到：  
     
     > 需要在一个有 git 仓库的地方执行 `git status`  
   - 于是它不会在 Telegram 里“假装跑命令”，而是打算调用 **Nodes 工具**。（Nodes 通过 Gateway WS + pairing 接入的模型见 [官网总览（How it works / Network model）](https://docs.molt.bot/) 与 [Nodes 文档](https://docs.molt.bot/nodes)）

4. **Gateway 查当前有哪些 Node 在线（设备能力视图）**  
   - Gateway 维护着一个 Node 注册表：谁连上来了、支持哪些命令（`system.run` / `camera.capture` / `screen.capture` 等）、权限如何。  
   - 在这一步，它会筛选出：  
     - 有 `system.run` 能力  
     - 权限允许执行命令  
     - 当前在线 的 node（比如你的电脑 node-host）

5. **通过 `node.invoke` 真正在电脑上执行命令**  
   - Gateway 选定某个 nodeId，发起远程调用：  
     
     > “请在你这台设备上执行 `git status`，把 stdout/stderr/exitCode 回传给我。”  
   - 电脑上的 node 客户端（或 macOS/iOS/Android App）收到请求后，在本机执行命令，把结果通过 WebSocket 回给 Gateway。（`node.invoke` 的实现可对照 `src/gateway/node-registry.ts`、`src/gateway/server-methods/nodes.ts`）

6. **Agent 根据结果整理回复，再让 Gateway 发回 Telegram**  
   - Agent 拿到 `git status` 的结果，做总结、归类（例如按文件夹分组、指出大改动）。  
   - 最后调用 Gateway 的“发消息”接口，让 Telegram Channel 把整理好的文字发回原来的聊天。

在这个过程中，**Telegram 一直只是“说话的入口/出口”**；  
你真正关心的是：Gateway 怎么路由、怎么挑选 node、怎么保证安全。

---

#### 3）多入口是怎么统一起来的？（Channel / Client / Node 各自的责任）
理解这三个角色之后，很多“为什么这样设计”的问题都会自动消失：

- **Channels（渠道）——“外部世界的消息管道”**  
  - 负责接入 Telegram / WhatsApp / Slack / Discord / Signal / iMessage / WebChat 等。  
  - 把平台特有的事件/结构统一成 Gateway 能理解的入站消息；  
  - 把 Gateway 给的“回复”再翻译回各个平台的发送 API。

- **Clients / UI（客户端界面）——“你操作 Gateway 的方式”**  
  - CLI（`moltbot` 命令行）、浏览器里的 WebChat / 控制台、macOS app。  
  - 更偏“控制台”和“本地聊天界面”，直接通过 Gateway 的 WS/RPC 调方法，而不是当一个外部平台。

- **Nodes（节点设备）——“真正干活的手脚”**  
  - 你的电脑 node-host、macOS node、iOS/Android node。  
  - 它们不负责提供聊天入口，而是声明自己会哪些能力：camera/screen/location/system.run/通知等。  
  - Gateway 通过 `node.invoke` 远程调用这些能力。

这个拆分的好处是：**你可以随意组合**——  
例如：在 Telegram 下指令 → Gateway 调浏览器工具爬网页 → 再让手机 node 发本地通知 → 最后把总结回 Telegram。

---

#### 4）Node 为什么能“在多台设备执行”？（从“设备列表”视角理解）
再换一个视角看 Node：  
**它就是“挂在 Gateway 上的一张设备表”，每一行记录一台设备能干什么。**

大致长这样（抽象后的模型）：

```text
NodeRegistry
  - nodeId: "mac-mini"
    kind: "macos"
    caps: ["system.run", "screen.capture"]
    online: true
  - nodeId: "iphone"
    kind: "ios"
    caps: ["camera.capture", "notification.send", "location.get"]
    online: true
  - nodeId: "server-node"
    kind: "node-host"
    caps: ["system.run"]
    online: false
```

当 Agent 想做一件事时，例如：
- 需要拍照 → Gateway 会去找 **有 `camera.capture` 能力且在线** 的 node（通常是手机）  
- 需要跑 git → 会去找 **有 `system.run` 能力且在线** 的 node（通常是电脑/服务器）

这就解释了为什么：
- 你可以同时连上多台设备，它们“平等挂在网关下面”  
- 你可以控制“哪些设备允许执行什么能力”（通过 caps/permissions + allowlist）  
- 设备离线了，相关能力也就暂时不可用（NodeRegistry 会知道它不在线）

安全上，官方要求通过 **pairing 配对** 把 node 和你的 Gateway 绑定起来：  
否则任何人只要知道地址，就能伪装成 node 提供 `system.run`，这直接等于“给别人一把你的电脑远程 root 钥匙”。  
（详细见：`https://docs.molt.bot/gateway/pairing`、`https://docs.molt.bot/gateway/security`）

---

#### 5）为什么会有 Canvas？它在整个系统里扮演什么角色？
从系统视角看，Canvas 解决的是这样一个问题：

> 当结果变成“结构化、持续更新、需要交互”的时候，  
> **聊天窗口已经不适合当 UI 了**。

典型例子：
- 待办看板（多个列、多张卡片、状态变化）  
- 节点列表/健康检查面板（每个 node 的延迟、在线状态、最近执行）  
- 调试信息面板（token 用量、最近工具调用、错误日志）

在 macOS Canvas 文档里，官方的设计是（见 [macOS Canvas](https://docs.molt.bot/platforms/mac/canvas)；Canvas host 的端口与路径也在 [官网总览（Network model）](https://docs.molt.bot/) 有明确说明）：
- Canvas 是 macOS app 里的一个 `WKWebView` 面板；  
- 它通过 Gateway 的 WebSocket 接收指令（present/navigate/eval/snapshot）；  
- Canvas UI 资源通过 Gateway 的 canvas host 提供（默认 `http://127.0.0.1:18793/__moltbot__/a2ui/…`）。  
见：`https://docs.molt.bot/platforms/mac/canvas`。

所以你可以这样理解：
- **聊天窗口**：适合“自然语言对话 + 简单结果”  
- **Canvas 面板**：适合“持续存在的工作台/仪表盘/看板”

当你说“帮我把最近 20 条 git 提交做成看板”，Agent 完全可以：
- 在电脑 node 上跑 git → 整理数据  
- 生成一个 A2UI/HTML 看板 → 通过 Gateway 推送到 Canvas  
- 后续你只要打开 Canvas，就能看到一个“活”的界面，而不是翻历史聊天记录。

---

#### 6）记忆（Memory）：它怎么让“长期上下文”真正有用？
最后看一下记忆，这部分很多人容易和“普通聊天记录”混在一起。  
在 Moltbot 里，至少有两条清晰的路线（整体概念在 [Memory 文档](https://docs.molt.bot/concepts/memory) 里有更系统的说明）：

- **记忆检索（Memory Search）——更像“RAG 检索”**  
  - 把 `MEMORY.md` / `memory/*.md`（可选还包括 session 转录）切块、嵌入、索引。  
  - 当 Agent 需要背景知识时，可以显式调用 `memory_search/memory_get` 工具，先检索再回答。  
  - 适合存：项目文档、使用说明、FAQ、固定规则等。

- **长期记忆插件（例如 LanceDB）——更像“成长型个人记忆”**  
  - 通过插件扩展的方式，把“回忆/存储/遗忘”实现为 tools + hooks；  
  - 在 agent 开始前可以自动 Recall 一些与当前对话相关的记忆片段；  
  - 在 agent 结束后可以自动 Capture：把这次对话中的“长期有用信息”写入记忆库（如果启用）。  
  - 适合存：你的偏好、习惯、跨会话也要记住的事实。

这样的设计，让 Moltbot 既能扮演“**懂项目的工作流助手**”（靠 Memory Search），  
也能扮演“**长期陪伴型个人助理**”（靠长期记忆插件），而不会把两者混在一起。

---

### 三、源码分析
这一节给想读代码的人：我们用 **文件名 + 调用链 + 伪代码/数据流** 来说明，避免贴大段源码。

---

#### 1）从入口到 CLI：程序如何启动
- `src/entry.ts`：真正的 Node 可执行入口（`#!/usr/bin/env node`），负责处理 argv、环境切换、必要时 respawn，然后把控制权交给 CLI 主逻辑。  
- `src/cli/run-main.ts` → `src/cli/program.ts`：构建 commander 命令树（包括 core 命令和插件扩展命令），然后 `program.parseAsync(process.argv)`。

可以把启动流程想象成：

```text
entry.ts
  └─ runMain(argv)
       ├─ 载入 dotenv / profile（不同环境配置）
       ├─ buildProgram()
       │    ├─ 注册内置 CLI 命令（gateway/nodes/message/agent/...）
       │    └─ 调用 plugins.loader 注册插件提供的 CLI 命令
       └─ program.parseAsync(argv)
```

这意味着：**插件可以在不改核心代码的前提下插入自己的 CLI 子命令**（例如 memory/某个 channel 的运维命令）。

---

#### 2）路由：同一句话为什么会落到“正确的 agent/session”
前一节我们讲过“Telegram 消息进来之后会被路由到某个 agent + session”，在代码里它主要落在：

- `src/routing/resolve-route.ts`：根据 channel/account/peer/guild/team 等标识，结合配置和默认策略，返回一个 `agentId` 和 `sessionKey`。

抽象后的伪代码是：

```text
resolveAgentRoute(input):
  # input 包含：channelId / accountId / guildId / peerId / teamId 等
  if peer 精确匹配路由规则:
    agent = 对应 agent
  else if guild/team 级别匹配:
    agent = 对应 agent
  else if account/channel 级别匹配:
    agent = 对应 agent
  else:
    agent = 默认 agent

  sessionKey = 基于 channel + peer + guild/team 等拼出来
  return { agentId: agent.id, sessionKey }
```

**agent 决定“谁来思考”，sessionKey 决定“这段对话的上下文范围”**，从而解决“多渠道、多群聊、多账号、多 agent 不串线”的问题。

---

#### 3）Nodes：多设备执行在代码里怎么实现
在“原理讲解”部分我们从概念上描述过 NodeRegistry，这里看实际落点：

- `src/gateway/node-registry.ts`：维护当前在线 nodes（nodeId、caps、commands、permissions…），提供注册/心跳/下线/发送消息等方法。  
- `src/gateway/server-methods/nodes.ts`：实现 `node.list/node.describe/node.invoke/node.invoke.result` 等 WebSocket RPC；`node.invoke` 会检查 allowlist 和 node 能力，再转发到对应 node 的连接上。

可以理解为：

```text
Gateway node.invoke(nodeId, command, params):
  node = registry.get(nodeId)
  assert node.connected
  assert command in node.commands
  assert 权限策略允许执行该 command
  send "node.invoke.request" over node WS
  await "node.invoke.result" (或直到超时/取消)
```

node 端（例如 `src/node-host/runner.ts`、iOS/Android/macOS app 内部）会监听这类请求，在本机执行对应能力（命令行/拍照/录屏/定位等），再把结果封装成 `node.invoke.result` 回给 Gateway。

---

#### 4）插件系统：为什么扩展渠道/工具这么方便
扩展性在这个项目里非常核心，对应代码主要集中在：

- `src/plugins/loader.ts`：扫描 `extensions/*`，读取插件 manifest，用 jiti 动态加载 TypeScript/JavaScript 插件入口，然后调用其中的 `registerXXX` 方法（tools/channels/providers/gatewayMethods/httpRoutes/cliCommands 等）。  
- `src/plugins/config-state.ts`：维护“哪些插件启用/禁用”、slot 选择（例如 `kind: "memory"` 的插件同一时刻只会有一个生效，以避免全局记忆实现冲突）。  
- `extensions/*`：具体的插件实现，比如新渠道、新工具、新 memory 实现等。

抽象流程可以画成：

```text
plugins.loader:
  for each extension in extensions/*:
    manifest = 读 extension/package.json 或约定文件
    if 启用:
      module = jiti 加载 extension/index.ts
      module.registerTools(toolRegistry)
      module.registerChannels(channelRegistry)
      module.registerProviders(providerRegistry)
      module.registerGatewayMethods(gatewayRpc)
      module.registerCliCommands(program)
```

这解释了两件事：
- **为什么社区很容易贡献一个“新渠道”或“新工具”**：只要写一个 extension 包，提供若干 `register*` 函数即可。  
- **为什么像 memory 这类“全局能力”要用 slot**：同一时刻只让一个实现接管全局行为，避免多个记忆后端互相打架。

---

#### 5）记忆功能：两条实现路径的代码落点（你可以按需深入）
前面从原理上讲了 Memory Search 和长期记忆插件，这里给出各自在代码里的“入口”方便你追踪：

- **Memory Search（文件索引检索）**
  - `src/memory/manager.ts`：基于 SQLite +（可选）`sqlite-vec` +（可选）FTS，负责：
    - 发现 `MEMORY.md` / `memory/*.md` /（可选）sessions 转录文件  
    - watch 文件变更、切 chunk、生成/缓存 embedding  
    - 提供 hybrid search（向量 + 关键词）接口  
  - `src/agents/tools/memory-tool.ts`：把上述能力包装成 agent 可用的工具：`memory_search/memory_get`。  
  - `src/agents/system-prompt.ts`：如果检测到 memory 工具可用，会在系统提示中加入“先检索再回答”的规则。

- **LanceDB 长期记忆插件**
  - `extensions/memory-lancedb/index.ts`：  
    - 暴露 `memory_recall/memory_store/memory_forget` 等工具  
    - 注册插件 hooks：在 `before_agent_start` 做 autoRecall，在 `agent_end` 做 autoCapture（按配置启用）

如果你跟着这几个文件往里钻，就能非常清晰地看到：  
**从“文字记忆块/对话转录”到“被 Agent 自动召回/更新”的整个数据流。**

---

#### 6）Agent 回合（attempt）和工具调用：一条回答内部发生了什么？
最后看一下“单次回答”的内部结构——在 Moltbot 里通常叫一个 agent attempt，对应关键文件：

- `src/agents/pi-embedded-runner/run/attempt.ts`：封装了一次完整的 agent 回合逻辑，包括：
  - 构造系统提示（注入渠道信息、会话历史、记忆、工具列表、策略等）；  
  - 调用模型（例如 Claude / GPT），在需要时根据 tool call 结果反复迭代；  
  - 把最终自然语言回复和工具副作用（例如发消息、调度 node）交还给 Gateway。
- `src/agents/tool-policy.ts`：描述“哪些工具在什么条件下可以被调用”的策略，例如：
  - 哪些工具是高风险（如 `system.run`）、需要显式授权或严格限制；  
  - 哪些工具可以在大多数情况下自由使用（如 memory_search）。

抽象的数据流大致是：

```text
runAgentAttempt(inputMessage):
  context = 收集会话历史 + 渠道元数据 + 记忆召回结果
  tools = 根据策略选择可用工具（nodes/browser/memory/cron/...）
  while not finished:
    modelOutput = 调用 LLM(context, tools 描述, inputMessage + 之前 tool 结果)
    if modelOutput 包含 tool calls:
      执行对应工具（可能通过 Gateway → Nodes）
      把工具结果 append 回 context
    else:
      return 最终回复 + structured actions
```

这部分代码是“把前两节所有概念串起来的地方”：  
路由选中的 agent/session、记忆检索、nodes 工具、插件注入的 hooks，最后都会在一次 attempt 里被编排进来。

---

### 结语
很多项目能“接入一个渠道做聊天”，也有项目能“做设备自动化”。  
Moltbot 的价值在于：它把这些能力放在一个 **自托管、可扩展、默认安全** 的控制平面里，你既能从 Telegram/WhatsApp 这种熟悉入口发起请求，也能让请求跨设备执行，并用 Canvas 把复杂结果变成可视化工作台。

---

### 文中引用的官方文档链接
- `https://docs.molt.bot/`
- `https://docs.molt.bot/concepts/architecture`
- `https://docs.molt.bot/channels`
- `https://docs.molt.bot/nodes`
- `https://docs.molt.bot/platforms/mac/canvas`
- `https://docs.molt.bot/gateway/pairing`
- `https://docs.molt.bot/gateway/security`

