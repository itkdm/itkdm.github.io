---
title: Runtime
order: 24
section: "LangChain AI"
topic: "运行时"
lang: "zh"
slug: "langchain-runtime"
summary: LangChain Agent 的运行时上下文、存储和流式传输
icon: "lucide:cpu"
featured: false
toc: true
updated: 2026-03-07
---

## 概述

:::python
LangChain 的 [`create_agent`] 在底层运行于 LangGraph 的 runtime 之上。
:::
:::js
LangChain 的 `createAgent` 在底层运行于 LangGraph 的 runtime 之上。
:::
LangGraph 公开了一个 [`Runtime`] 对象，包含以下信息：

1. **上下文（Context）**：静态信息，如用户 ID、数据库连接或 agent 调用的其他依赖项
2. **存储（Store）**：一个 [BaseStore] 实例，用于 [长期记忆（long-term memory）](/oss/langchain/long-term-memory)
3. **流式写入器（Stream writer）**：通过 `"custom"` 流模式用于流式传输信息的对象

:::python
<Tip>
Runtime context 为你的工具和中间件提供**依赖注入（dependency injection）**。你可以避免硬编码值或使用全局状态，而是在调用 agent 时注入运行时依赖项（如数据库连接、用户 ID 或配置）。这使你的工具更具可测试性、可重用性和灵活性。
</Tip>
:::

:::js
<Tip>
Runtime context 是你在线程中传递数据的方式。你可以将值（如数据库连接、用户会话或配置）附加到上下文并在工具和中间件中访问它们，而不是将内容存储在全局状态中。这使内容保持无状态、可测试和可重用。
</Tip>
:::

你可以在 [工具](#inside-tools) 和 [中间件](#inside-middleware) 中访问 runtime 信息。

## 访问

:::python
使用 [`create_agent`] 创建 agent 时，你可以指定 `context_schema` 来定义存储在 agent [`Runtime`] 中的 `context` 结构。
:::
:::js
使用 `createAgent` 创建 agent 时，你可以指定 `contextSchema` 来定义存储在 agent [`Runtime`] 中的 `context` 结构。
:::

调用 agent 时，传递 `context` 参数并附带运行的相关配置：

:::python
```python
from dataclasses import dataclass

from langchain.agents import create_agent


@dataclass
class Context:
    user_name: str

agent = create_agent(
    model="gpt-5-nano",
    tools=[...],
    context_schema=Context  # [!code highlight]
)

agent.invoke(
    {"messages": [{"role": "user", "content": "What's my name?"}]},
    context=Context(user_name="John Smith")  # [!code highlight]
)
```
:::
:::js
```ts
import * as z from "zod";
import { createAgent } from "langchain";

const contextSchema = z.object({ // [!code highlight]
  userName: z.string(), // [!code highlight]
}); // [!code highlight]

const agent = createAgent({
  model: "gpt-4.1",
  tools: [
    /* ... */
  ],
  contextSchema, // [!code highlight]
});

const result = await agent.invoke(
  { messages: [{ role: "user", content: "What's my name?" }] },
  { context: { userName: "John Smith" } } // [!code highlight]
);
```
:::

### 在工具内部 {#inside-tools}

你可以在工具内部访问 runtime 信息以：

* 访问上下文
* 读取或写入长期记忆
* 写入 [自定义流](/oss/langchain/streaming#custom-updates)（例如，工具进度/更新）

:::python
使用 `ToolRuntime` 参数在工具内部访问 [`Runtime`] 对象。

```python
from dataclasses import dataclass
from langchain.tools import tool, ToolRuntime  # [!code highlight]

@dataclass
class Context:
    user_id: str

@tool
def fetch_user_email_preferences(runtime: ToolRuntime[Context]) -> str:  # [!code highlight]
    """Fetch the user's email preferences from the store."""
    user_id = runtime.context.user_id  # [!code highlight]

    preferences: str = "The user prefers you to write a brief and polite email."
    if runtime.store:  # [!code highlight]
        if memory := runtime.store.get(("users",), user_id):  # [!code highlight]
            preferences = memory.value["preferences"]

    return preferences
```
:::
:::js
使用 `runtime` 参数在工具内部访问 [`Runtime`] 对象。

```ts
import * as z from "zod";
import { tool } from "langchain";
import { type ToolRuntime } from "@langchain/core/tools"; // [!code highlight]

const contextSchema = z.object({
  userName: z.string(),
});

const fetchUserEmailPreferences = tool(
  async (_, runtime: ToolRuntime<any, typeof contextSchema>) => { // [!code highlight]
    const userName = runtime.context?.userName; // [!code highlight]
    if (!userName) {
      throw new Error("userName is required");
    }

    let preferences = "The user prefers you to write a brief and polite email.";
    if (runtime.store) { // [!code highlight]
      const memory = await runtime.store?.get(["users"], userName); // [!code highlight]
      if (memory) {
        preferences = memory.value.preferences;
      }
    }
    return preferences;
  },
  {
    name: "fetch_user_email_preferences",
    description: "Fetch the user's email preferences.",
    schema: z.object({}),
  }
);
```
:::

### 在中间件内部 {#inside-middleware}

你可以在中间件中访问 runtime 信息，以根据用户上下文创建动态提示、修改消息或控制 agent 行为。

:::python
使用 `Runtime` 参数在 [节点式钩子（node-style hooks）](/oss/langchain/middleware/custom#node-style-hooks) 内部访问 [`Runtime`] 对象。对于 [包装式钩子（wrap-style hooks）](/oss/langchain/middleware/custom#wrap-style-hooks)，[`Runtime`] 对象可在 [`ModelRequest`] 参数内部使用。

```python
from dataclasses import dataclass

from langchain.messages import AnyMessage
from langchain.agents import create_agent, AgentState
from langchain.agents.middleware import dynamic_prompt, ModelRequest, before_model, after_model
from langgraph.runtime import Runtime


@dataclass
class Context:
    user_name: str

# 动态提示
@dynamic_prompt
def dynamic_system_prompt(request: ModelRequest) -> str:
    user_name = request.runtime.context.user_name  # [!code highlight]
    system_prompt = f"You are a helpful assistant. Address the user as {user_name}."
    return system_prompt

# before_model 钩子
@before_model
def log_before_model(state: AgentState, runtime: Runtime[Context]) -> dict | None:  # [!code highlight]
    print(f"Processing request for user: {runtime.context.user_name}")  # [!code highlight]
    return None

# after_model 钩子
@after_model
def log_after_model(state: AgentState, runtime: Runtime[Context]) -> dict | None:  # [!code highlight]
    print(f"Completed request for user: {runtime.context.user_name}")  # [!code highlight]
    return None

agent = create_agent(
    model="gpt-5-nano",
    tools=[...],
    middleware=[dynamic_system_prompt, log_before_model, log_after_model],  # [!code highlight]
    context_schema=Context
)

agent.invoke(
    {"messages": [{"role": "user", "content": "What's my name?"}]},
    context=Context(user_name="John Smith")
)
```
:::
:::js
使用 `runtime` 参数在中间件内部访问 [`Runtime`] 对象。

```ts
import * as z from "zod";
import { createAgent, createMiddleware, SystemMessage } from "langchain";

const contextSchema = z.object({
  userName: z.string(),
});

// 动态提示中间件
const dynamicPromptMiddleware = createMiddleware({
  name: "DynamicPrompt",
  contextSchema,
  beforeModel: (state, runtime) => { // [!code highlight]
    const userName = runtime.context?.userName; // [!code highlight]
    if (!userName) {
      throw new Error("userName is required");
    }

    const systemMsg = `You are a helpful assistant. Address the user as ${userName}.`;
    return {
      messages: [new SystemMessage(systemMsg), ...state.messages],
    };
  },
});

// 日志记录中间件
const loggingMiddleware = createMiddleware({
  name: "Logging",
  contextSchema,
  beforeModel: (state, runtime) => {  // [!code highlight]
    console.log(`Processing request for user: ${runtime.context?.userName}`);  // [!code highlight]
    return;
  },
  afterModel: (state, runtime) => {  // [!code highlight]
    console.log(`Completed request for user: ${runtime.context?.userName}`);  // [!code highlight]
    return;
  },
});

const agent = createAgent({
  model: "gpt-4.1",
  tools: [
    /* ... */
  ],
  middleware: [dynamicPromptMiddleware, loggingMiddleware],  # [!code highlight]
  contextSchema,
});

const result = await agent.invoke(
  { messages: [{ role: "user", content: "What's my name?" }] },
  { context: { userName: "John Smith" } }
);

```
:::
