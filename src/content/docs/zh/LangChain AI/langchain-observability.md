---
title: LangSmith 可观测性
sidebarTitle: 可观测性
order: 25
section: "LangChain AI"
topic: "可观测性"
lang: "zh"
slug: "langchain-observability"
summary: 使用 LangSmith 追踪和调试 LangChain Agent
icon: "lucide:eye"
featured: false
toc: true
updated: 2026-03-07
---

import observability from '/snippets/oss/observability.mdx';

:::python

当你使用 LangChain 构建和运行 agent 时，你需要了解它们的行为：它们调用哪些 [工具](/oss/langchain/tools)、生成什么提示以及如何做出决策。使用 [`create_agent`] 构建的 LangChain agent 自动支持通过 [LangSmith](/langsmith/home) 进行追踪，这是一个用于捕获、调试、评估和监控 LLM 应用行为的平台。

:::
:::js

当你使用 LangChain 构建和运行 agent 时，你需要了解它们的行为：它们调用哪些 [工具](/oss/langchain/tools)、生成什么提示以及如何做出决策。使用 [`createAgent`] 构建的 LangChain agent 自动支持通过 [LangSmith](/langsmith/home) 进行追踪，这是一个用于捕获、调试、评估和监控 LLM 应用行为的平台。

:::

[_追踪（Traces）_](/langsmith/observability-concepts#traces) 记录 agent 执行的每一步，从初始用户输入到最终响应，包括所有工具调用、模型交互和决策点。这些执行数据可帮助你调试问题、评估不同输入的性能以及监控生产环境中的使用模式。

本指南向你展示如何为 LangChain agent 启用追踪并使用 LangSmith 分析其执行。

## 前提条件

开始之前，请确保你具备以下条件：

- **LangSmith 账户**：在 [smith.langchain.com](https://smith.langchain.com) 免费注册或登录。
- **LangSmith API 密钥**：按照 [创建 API 密钥](/langsmith/create-account-api-key#create-an-api-key) 指南操作。

## 启用追踪

所有 LangChain agent 都自动支持 LangSmith 追踪。要启用它，请设置以下环境变量：

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=<your-api-key>
```

## 快速开始

无需额外代码即可将追踪记录到 LangSmith。只需像往常一样运行你的 agent 代码：

:::python
```python
from langchain.agents import create_agent


def send_email(to: str, subject: str, body: str):
    """Send an email to a recipient."""
    # ... email sending logic
    return f"Email sent to {to}"

def search_web(query: str):
    """Search the web for information."""
    # ... web search logic
    return f"Search results for: {query}"

agent = create_agent(
    model="gpt-4.1",
    tools=[send_email, search_web],
    system_prompt="You are a helpful assistant that can send emails and search the web."
)

# 运行 agent - 所有步骤将自动追踪
response = agent.invoke({
    "messages": [{"role": "user", "content": "Search for the latest AI news and email a summary to john@example.com"}]
})
```
:::

:::js
```ts
import { createAgent } from "@langchain/agents";

function sendEmail(to: string, subject: string, body: string): string {
    // ... email sending logic
    return `Email sent to ${to}`;
}

function searchWeb(query: string): string {
    // ... web search logic
    return `Search results for: ${query}`;
}

const agent = createAgent({
    model: "gpt-4.1",
    tools: [sendEmail, searchWeb],
    systemPrompt: "You are a helpful assistant that can send emails and search the web."
});

// 运行 agent - 所有步骤将自动追踪
const response = await agent.invoke({
    messages: [{ role: "user", content: "Search for the latest AI news and email a summary to john@example.com" }]
});
```
:::

默认情况下，追踪将记录到名为 `default` 的项目中。要配置自定义项目名称，请参阅 [记录到项目](#log-to-a-project)。

<observability />
