---
title: Agent Chat UI
order: 30
section: "LangChain AI"
topic: "LangChain"
lang: "zh"
slug: "langchain-ui"
summary: Agent Chat UI 用于与 LangChain Agent 交互
icon: "lucide:message-square"
featured: false
toc: true
updated: 2026-03-07
---

import agent_chat_ui from '/snippets/oss/agent-chat-ui.mdx';

<agent_chat_ui />

### 连接到你的 Agent

Agent Chat UI 可以连接到 [本地](/oss/langchain/studio#setup-local-agent-server) 和 [部署的 Agent](/oss/langchain/deploy)。

启动 Agent Chat UI 后，你需要配置它以连接到你的 Agent：

1. **Graph ID**：输入你的 graph 名称（在 `langgraph.json` 文件的 `graphs` 下找到）
2. **部署 URL**：你的 Agent 服务器的端点（例如，本地开发使用 `http://localhost:2024`，或使用部署的 Agent 的 URL）
3. **LangSmith API 密钥（可选）**：添加你的 LangSmith API 密钥（如果你使用本地 Agent 服务器则不需要）

配置完成后，Agent Chat UI 将自动获取并显示来自你的 Agent 的任何中断的线程。

<Tip>
  Agent Chat UI 开箱即用地支持渲染工具调用和工具结果消息。要自定义显示的消息，请参阅 [在聊天中隐藏消息](https://github.com/langchain-ai/agent-chat-ui?tab=readme-ov-file#hiding-messages-in-the-chat)。
</Tip>
