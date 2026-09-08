---
title: "Pi Agent 使用：从安装到终端使用指南教程"
date: 2026-09-08
tags: ["AI", "Agent", "Pi Agent", "Pi", "AI 编程", "开发工具"]
summary: "Pi Agent 教程与使用指南，介绍安装、登录、常用命令、AGENTS.md 和安全实践，适合第一次使用终端 AI 编程助手的同学。"
lang: "zh"
slug: "pi-agent-tutorial-usage"
draft: false
priority: 6
---

如果你最近在关注 AI 编程工具，可能已经见过 **Pi Agent** 这个名字。它不是一个只会补全代码的插件，而是一个运行在终端里的 AI coding agent：你可以让它阅读项目、修改文件、执行命令，再根据结果继续完成任务。

这篇文章不堆概念，直接回答两个最常见的问题：**Pi Agent 是什么？Pi Agent 怎么使用？** 如果你正在搜索 **Pi Agent 使用** 方法，即使第一次接触终端，也可以跟着做完第一次对话。

## 3 分钟快速上手

如果你只想先试一次，按下面三步即可：

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
cd your-project
pi
```

进入 Pi 后，先输入“请阅读这个项目，告诉我如何启动，不要修改文件”，确认它理解项目后，再交给它小范围的编辑任务。

> 本文根据 Pi 官方文档整理。Pi 的命令、安装包和功能会继续变化，动手前建议顺手查看[官方文档](https://pi.dev/)和 [GitHub 仓库](https://github.com/earendil-works/pi)。

## Pi Agent 是什么？

Pi 是一个“最小化的 Agent harness”。可以把 harness 理解成智能体运行的外壳：它负责把模型、项目文件、终端命令和会话连接起来，但不会强行规定你必须怎样工作。

和普通聊天机器人相比，Pi 的区别在于它能在当前项目目录里工作。默认情况下，模型可以使用四个核心工具：

- `read`：读取文件
- `write`：创建或覆盖文件
- `edit`：修改已有文件
- `bash`：运行 shell 命令；Windows 下默认使用 Git Bash

Windows 下如果启用了 `powershell` 工具，还可以使用单独的 `powershell` 工具执行 PowerShell 命令；它不是 `bash` 的别名。

所以你可以这样理解：只提供文本对话的聊天工具主要“告诉你怎么做”，Pi Agent 则可以在启动它的进程权限范围内“帮你做”。当然，代码是否正确、命令是否安全，仍然需要你检查。

Pi 的特点是核心很小、扩展性强。官方没有把 sub-agent、plan mode、权限弹窗和 MCP 等功能全部塞进核心，而是提供 extensions、skills、prompt templates 和 packages，让用户按自己的工作流添加能力。

## Pi Agent 使用：先完成安装

### 运行环境

你需要准备：

1. Node.js 环境；
2. 一个模型提供商的 API Key，或者可以使用的订阅登录；
3. 一个准备让 Pi 读取或修改的项目目录。

### 使用 npm 安装

官方推荐的 npm 安装命令如下：

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

安装完成后，在项目目录启动：

```bash
cd your-project
pi
```

Windows 用户也可以使用官方提供的 PowerShell 安装脚本：

```powershell
irm https://pi.dev/install.ps1 | iex
```

如果终端提示找不到 `pi`，先检查 Node.js 和 npm 是否已经加入 PATH，然后重新打开终端再试。

## 登录和选择模型

启动 Pi 后，输入下面的命令：

```text
/login
```

随后按照界面选择提供商。官方文档列出了订阅登录和 API Key 两种方式；如果你使用 API Key，也可以在启动前设置环境变量。例如：

```bash
export ANTHROPIC_API_KEY=你的_API_Key
pi
```

Windows PowerShell 的写法是：

```powershell
$env:ANTHROPIC_API_KEY = "你的_API_Key"
pi
```

登录后，可以用 `/model` 或 `Ctrl+L` 切换模型，用 `/thinking` 调整思考强度。不同模型的价格、上下文长度和工具调用能力并不一样，建议先用一个成本可控的模型完成小任务，再决定是否切换。

## 第一次使用：不要一上来就让它重写项目

第一次进行 **Pi Agent 使用**，建议从只读任务开始。进入一个测试项目后，输入：

```text
请先阅读这个项目，告诉我它使用了什么技术、如何启动、有哪些检查命令。不要修改任何文件。
```

这一步的目的不是考验模型，而是观察它能不能正确理解项目。确认输出靠谱后，再尝试一个边界清楚的小任务：

```text
请为 src/utils/date.ts 补充单元测试。先说明你的修改计划，完成后运行相关测试，并告诉我改了哪些文件。
```

一个好用的 Pi Agent 提示词，通常包含四部分：

1. 目标：最终要得到什么；
2. 范围：允许读取和修改哪些文件；
3. 约束：不能改什么、必须遵守什么项目规则；
4. 验证：完成后运行什么命令。

例如，“帮我优化一下代码”太宽泛；“只修改 `src/lib`，保持现有 API 不变，先解释方案，完成后运行 `npm test`”就清楚得多。

## 日常使用中最值得记住的命令

Pi 交互模式中的斜杠命令都以 `/` 开头，下面几组最常用：

| 命令 | 用途 |
| --- | --- |
| `/model` | 切换模型 |
| `/thinking` | 调整思考级别 |
| `/new` | 新建会话 |
| `/resume` | 恢复旧会话 |
| `/session` | 查看当前会话信息 |
| `/tree` | 在会话历史的不同分支间切换 |
| `/compact` | 压缩较早的上下文 |
| `/export` | 导出会话 |
| `/reload` | 重新加载配置、技能和扩展 |
| `/quit` | 退出 Pi |

如果只是想让 Pi 做一次性任务，也可以使用 print 模式：

```bash
pi -p "总结这个仓库的目录结构，并列出启动命令"
```

脚本集成时，可以使用 `--mode json` 获取 JSON Lines 事件流；需要被其他程序通过标准输入输出控制时，可以研究 RPC。SDK 则是把 Pi 嵌入其他应用的程序化接口，不是一个 `--mode sdk` 命令行选项。

交互模式里还可以用感叹号直接执行命令：

```text
!npm run test    # 执行命令，并把输出交给模型
!!git status     # 执行命令，但不把输出放入模型上下文
```

交互模式里还可以用感叹号直接执行命令：

```text
!npm run test    # 执行命令，并把输出交给模型
!!git status     # 执行命令，但不把输出放入模型上下文
```

## 让 Pi 真正理解你的项目：AGENTS.md

每次都重复“不要改数据库”“修改后运行什么检查”很浪费上下文。Pi 会在启动时读取全局的 `~/.pi/agent/AGENTS.md`，以及从父目录到当前目录中的 `AGENTS.md` 或 `CLAUDE.md`。同一目录下的 `AGENTS.override.md` 可以覆盖该目录的规则。修改后运行 `/reload` 或重启 Pi 即可生效。

一个简单的 `AGENTS.md` 可以这样写：

```markdown
# 项目协作规则

- 修改代码前先阅读相关文件，不要凭猜测重写。
- 不要修改生产环境配置。
- TypeScript 修改完成后运行 npm run check。
- 提交前说明修改的文件和验证结果。
```

这类文件不是“魔法提示词”，而是项目协作说明。内容越具体越有用，最好写稳定、长期有效的规则，不要把一次性的任务细节全部塞进去。

## Pi Agent 的扩展方式

Pi 适合喜欢自己搭工作流的人。它支持几类扩展：

- **Skills**：按需加载的一组能力和说明；
- **Prompt templates**：可以重复使用的提示词模板；
- **Extensions**：用 TypeScript 添加工具、命令、快捷键或界面；
- **Pi packages**：把扩展、技能、模板和主题打包后通过 npm 或 git 安装。

例如，官方文档给出的包安装形式是：

```bash
pi install npm:@foo/pi-tools
```

这里的 `@foo/pi-tools` 只是官方文档中的占位示例，不是建议直接安装的真实包。实际使用时，应替换成可信的 npm 包或 Git 仓库地址。安装第三方包前要先看清它会加载哪些代码、需要哪些权限。因为 Pi 可以读写文件并执行命令，扩展的来源和内容应当像对待普通 npm 依赖一样谨慎。

## Pi Agent 适合做什么，不适合做什么？

### 适合的任务

- 阅读陌生仓库并整理运行方式；
- 编写小功能、补测试、修复明确的 bug；
- 根据报错定位相关文件；
- 执行重复的重构和验证流程；
- 把自己的编码规范固化到 `AGENTS.md` 或 skill 中。

### 不适合直接放手的任务

- 没有备份就批量删除文件；
- 直接修改生产数据库或部署配置；
- 不审查 diff 就让它重写多个模块；
- 把 API Key、密码和个人数据直接贴进会话；
- 只看“模型说完成了”，却不运行测试和构建。

Pi 官方的设计理念是给你一组可组合的原语，而不是替你决定完整工作流。因此，Git 分支、容器、权限确认、测试和代码审查仍然应该由你来安排。

## 一套更稳妥的 Pi Agent 使用流程

我比较推荐下面这条简单流程：

1. 先用 `/new` 开一个任务会话；
2. 让 Pi 先读项目并复述目标，不急着改文件；
3. 把任务拆成小步骤，每完成一步就查看 diff；
4. 明确要求它运行测试、lint 或 build；
5. 手动检查关键逻辑、依赖变化和敏感配置；
6. 用 Git 提交前，再让 Pi 总结修改和验证结果。

这套流程的核心不是“写一条完美提示词”，而是让每一次修改都可观察、可回退、可验证。

## 常见问题

### Pi Agent 和普通 AI 聊天有什么区别？

Pi 运行在项目目录中，模型可以通过工具读取文件、编辑文件和执行命令；普通聊天通常只能根据你粘贴的内容给建议。两者并不是互相替代：聊天适合讨论方案，Pi 更适合在真实代码上下文中执行。

### Pi Agent 默认有 sub-agent 吗？

没有。Pi 的官方定位是保持核心最小化，sub-agent、plan mode 等能力可以通过扩展或第三方包添加，也可以由你自己组合多个 Pi 进程实现。

### Pi Agent 使用安全吗？

Pi 本身没有内置权限系统或权限弹窗，默认会继承启动进程的文件、命令、网络和凭据权限。需要更强隔离时，应使用容器或沙箱。你也可以先用只读工具运行审查：

```bash
pi --tools read,grep,find,ls -p "Review this codebase without modifying files"
```

不要在包含生产凭据的目录里盲目运行，也不要安装来路不明的扩展。使用 Git 分支、最小权限和测试环境，可以显著降低误操作成本。

## 总结：Pi Agent 使用的关键方法

如果你想找一个可高度定制的终端 AI 编程工具，Pi Agent 值得试试。它的上手路径并不复杂：安装 `@earendil-works/pi-coding-agent`，登录模型，进入项目目录运行 `pi`，然后从一个只读任务开始。

真正决定 **Pi Agent 使用** 效果的，不只是模型本身，还包括你给出的任务边界、项目里的 `AGENTS.md`、每一步的 diff 检查，以及最后的测试验证。先把这条链路跑通，再逐步加入 skills、extensions 和 packages，通常比一开始就追求“全自动”更稳。

## 参考资料

- [Pi 官方网站](https://pi.dev/)
- [Pi Coding Agent 官方仓库](https://github.com/earendil-works/pi)
- [官方 Quickstart](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/quickstart.md)
- [官方 Using Pi 文档](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/usage.md)
