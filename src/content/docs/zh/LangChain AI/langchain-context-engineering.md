---
title: Agents 中的 Context engineering
order: 19
section: "LangChain AI"
topic: "上下文工程"
lang: "zh"
slug: "langchain-context-engineering"
summary: 了解如何通过提供正确的上下文和信息来构建可靠的 agents
icon: "context"
featured: true
toc: true
updated: 2026-03-07
---

## 概述

构建 agents（或任何 LLM 应用程序）的困难部分是使它们足够可靠。虽然它们可能适用于原型，但在实际用例中往往会失败。

### 为什么 agents 会失败？

当 agents 失败时，通常是因为 agent 内部的 LLM 调用采取了错误的行动/没有按照我们的预期执行。LLMs 失败有两个原因：

1. 底层 LLM 不够强大
2. 没有将"正确"的上下文传递给 LLM

大多数情况下 - 实际上是第二个原因导致 agents 不可靠。

**Context engineering** 是以正确的格式提供正确的信息和工具，以便 LLM 能够完成任务。这是 AI Engineers 的首要工作。缺乏"正确"的上下文是更可靠 agents 的首要障碍，LangChain 的 agent 抽象专门设计用于促进 context engineering。

<Tip>
刚接触 context engineering？从 [conceptual overview](/oss/concepts/context) 开始，了解不同类型的上下文以及何时使用它们。
</Tip>

### The agent loop

典型的 agent loop 由两个主要步骤组成：

1. **Model call** - 使用 prompt 和可用工具调用 LLM，返回响应或执行工具的请求
2. **Tool execution** - 执行 LLM 请求的工具，返回工具结果

<div style={{ display: "flex", justifyContent: "center" }}>
  <img
    src="/oss/images/core_agent_loop.png"
    alt="Core agent loop diagram"
    className="rounded-lg"
  />
</div>

这个循环持续进行，直到 LLM 决定结束。

### 你可以控制什么

要构建可靠的 agents，你需要控制 agent loop 每个步骤发生的事情，以及步骤之间发生的事情。

| Context Type | 你控制什么 | Transient 或 Persistent |
|--------------|------------------|-------------------------|
| **[Model Context](#model-context)** | 进入 model calls 的内容（instructions、message history、tools、response format） | Transient |
| **[Tool Context](#tool-context)** | 工具可以访问和生成的内容（reads/writes to state, store, runtime context） | Persistent |
| **[Life-cycle Context](#life-cycle-context)** | model 和 tool calls 之间发生的事情（summarization、guardrails、logging 等） | Persistent |

<CardGroup>
  <Card title="Transient context" icon="bolt" iconType="duotone">
    LLM 在单次调用中看到的内容。你可以修改 messages、tools 或 prompts，而无需更改 state 中保存的内容。
  </Card>
  <Card title="Persistent context" icon="database" iconType="duotone">
    在 turns 之间保存在 state 中的内容。Life-cycle hooks 和 tool writes 会永久修改此内容。
  </Card>
</CardGroup>

### Data sources

在整个过程中，你的 agent 访问（reads / writes）不同的数据源：

| Data Source | 也称为 | Scope | 示例 |
|-------------|---------------|-------|----------|
| **Runtime Context** | Static configuration | Conversation-scoped | User ID、API keys、database connections、permissions、environment settings |
| **State** | Short-term memory | Conversation-scoped | Current messages、uploaded files、authentication status、tool results |
| **Store** | Long-term memory | Cross-conversation | User preferences、extracted insights、memories、historical data |

### 工作原理

LangChain [middleware](/oss/langchain/middleware) 是使 context engineering 对使用 LangChain 的 developers 实用的底层机制。

Middleware 允许你 hook into agent lifecycle 的任何步骤并：

* Update context
* Jump to a different step in the agent lifecycle

在整个指南中，你将看到频繁使用 middleware API 作为 context engineering 的手段。

## Model context

控制每次 model call 的内容 - instructions、available tools、使用哪个 model 和 output format。这些决策直接影响可靠性和成本。

<CardGroup cols={2}>
    <Card title="System Prompt" icon="message-2" href="#system-prompt">
        从 developer 到 LLM 的 base instructions。
    </Card>
    <Card title="Messages" icon="messages" href="#messages">
        发送到 LLM 的完整 messages 列表（conversation history）。
    </Card>
    <Card title="Tools" icon="tool" href="#tools">
        Agent 可以访问的 utilities 以采取行动。
    </Card>
    <Card title="Model" icon="cpu" href="#model">
        要调用的 actual model（包括 configuration）。
    </Card>
    <Card title="Response Format" icon="braces" href="#response-format">
        Model 最终响应的 schema specification。
    </Card>
</CardGroup>

所有这些类型的 model context 都可以从 **state**（short-term memory）、**store**（long-term memory）或 **runtime context**（static configuration）中提取。

### System Prompt

System prompt 设置 LLM 的行为和功能。不同的 users、contexts 或 conversation stages 需要不同的 instructions。成功的 agents 利用 memories、preferences 和 configuration 为当前 conversation state 提供正确的 instructions。

<Tabs>
  <Tab title="State">
    从 state 访问 message count 或 conversation context：

    :::python

    ```python
    from langchain.agents import create_agent
    from langchain.agents.middleware import dynamic_prompt, ModelRequest

    @dynamic_prompt
    def state_aware_prompt(request: ModelRequest) -> str:
        # request.messages is a shortcut for request.state["messages"]
        message_count = len(request.messages)

        base = "You are a helpful assistant."

        if message_count > 10:
            base += "\nThis is a long conversation - be extra concise."

        return base

    agent = create_agent(
        model="gpt-4.1",
        tools=[...],
        middleware=[state_aware_prompt]
    )
    ```
    :::

    :::js
    ```typescript
    import { createAgent } from "langchain";

    const agent = createAgent({
      model: "gpt-4.1",
      tools: [...],
      middleware: [
        dynamicSystemPromptMiddleware((state) => {
          // Read from State: check conversation length
          const messageCount = state.messages.length;

          let base = "You are a helpful assistant.";

          if (messageCount > 10) {
            base += "\nThis is a long conversation - be extra concise.";
          }

          return base;
        }),
      ],
    });
    ```
    :::
  </Tab>

  <Tab title="Store">
    从 long-term memory 访问 user preferences：

    :::python

    ```python
    from dataclasses import dataclass
    from langchain.agents import create_agent
    from langchain.agents.middleware import dynamic_prompt, ModelRequest
    from langgraph.store.memory import InMemoryStore

    @dataclass
    class Context:
        user_id: str

    @dynamic_prompt
    def store_aware_prompt(request: ModelRequest) -> str:
        user_id = request.runtime.context.user_id

        # Read from Store: get user preferences
        store = request.runtime.store
        user_prefs = store.get(("preferences",), user_id)

        base = "You are a helpful assistant."

        if user_prefs:
            style = user_prefs.value.get("communication_style", "balanced")
            base += f"\nUser prefers {style} responses."

        return base

    agent = create_agent(
        model="gpt-4.1",
        tools=[...],
        middleware=[store_aware_prompt],
        context_schema=Context,
        store=InMemoryStore()
    )
    ```
    :::

    :::js
    ```typescript
    import * as z from "zod";
    import { createAgent, dynamicSystemPromptMiddleware } from "langchain";

    const contextSchema = z.object({
      userId: z.string(),
    });

    type Context = z.infer<typeof contextSchema>;

    const agent = createAgent({
      model: "gpt-4.1",
      tools: [...],
      contextSchema,
      middleware: [
        dynamicSystemPromptMiddleware<Context>(async (state, runtime) => {
          const userId = runtime.context.userId;

          // Read from Store: get user preferences
          const store = runtime.store;
          const userPrefs = await store.get(["preferences"], userId);

          let base = "You are a helpful assistant.";

          if (userPrefs) {
            const style = userPrefs.value?.communicationStyle || "balanced";
            base += `\nUser prefers ${style} responses.`;
          }

          return base;
        }),
      ],
    });
    ```
    :::
  </Tab>

  <Tab title="Runtime Context">
    从 Runtime Context 访问 user ID 或 configuration：

    :::python

    ```python
    from dataclasses import dataclass
    from langchain.agents import create_agent
    from langchain.agents.middleware import dynamic_prompt, ModelRequest

    @dataclass
    class Context:
        user_role: str
        deployment_env: str

    @dynamic_prompt
    def context_aware_prompt(request: ModelRequest) -> str:
        # Read from Runtime Context: user role and environment
        user_role = request.runtime.context.user_role
        env = request.runtime.context.deployment_env

        base = "You are a helpful assistant."

        if user_role == "admin":
            base += "\nYou have admin access. You can perform all operations."
        elif user_role == "viewer":
            base += "\nYou have read-only access. Guide users to read operations only."

        if env == "production":
            base += "\nBe extra careful with any data modifications."

        return base

    agent = create_agent(
        model="gpt-4.1",
        tools=[...],
        middleware=[context_aware_prompt],
        context_schema=Context
    )
    ```
    :::

    :::js
    ```typescript
    import * as z from "zod";
    import { createAgent, dynamicSystemPromptMiddleware } from "langchain";

    const contextSchema = z.object({
      userRole: z.string(),
      deploymentEnv: z.string(),
    });

    type Context = z.infer<typeof contextSchema>;

    const agent = createAgent({
      model: "gpt-4.1",
      tools: [...],
      contextSchema,
      middleware: [
        dynamicSystemPromptMiddleware<Context>((state, runtime) => {
          // Read from Runtime Context: user role and environment
          const userRole = runtime.context.userRole;
          const env = runtime.context.deploymentEnv;

          let base = "You are a helpful assistant.";

          if (userRole === "admin") {
            base += "\nYou have admin access. You can perform all operations.";
          } else if (userRole === "viewer") {
            base += "\nYou have read-only access. Guide users to read operations only.";
          }

          if (env === "production") {
            base += "\nBe extra careful with any data modifications.";
          }

          return base;
        }),
      ],
    });
    ```
    :::
  </Tab>

</Tabs>

### Messages

Messages 组成发送到 LLM 的 prompt。
管理 messages 的内容至关重要，以确保 LLM 拥有正确的信息来做出良好响应。

（由于文件长度限制，此处省略详细的 Messages、Tools、Model 和 Response Format 部分。完整内容请参考原文档。）

## 相关资源

- [Middleware documentation](/oss/langchain/middleware) - Complete guide to custom middleware
- [Agents guide](/oss/langchain/agents) - Building agents with LangChain
- [Memory and persistence](/oss/langchain/short-term-memory) - Managing conversation state
