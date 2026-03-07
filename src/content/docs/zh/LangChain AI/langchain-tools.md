---
title: Tool
order: 4
section: 核心概念
topic: LangChain AI
lang: zh
slug: /zh/LangChain AI/langchain-tools
summary: 了解 LangChain Tool 的创建、使用和高级功能，包括 context 访问、状态管理、错误处理和预构建 Tool。
icon: "wrench"
featured: true
toc: true
updated: 2026-03-07
---

# Tool

Tool 扩展了 [Agent](/oss/langchain/agents) 的能力——让它们可以获取实时数据、执行代码、查询外部数据库并在世界中采取行动。

在底层，Tool 是具有明确定义输入和输出的可调用函数，它们被传递给 [chat model](/oss/langchain/models)。模型根据对话上下文决定何时调用 Tool，以及提供什么输入参数。

<Tip>
    有关模型如何处理 Tool 调用的详细信息，请参阅 [Tool calling](/oss/langchain/models#tool-calling)。
</Tip>

## 创建 Tool

### 基础 Tool 定义

:::python
创建 Tool 最简单的方法是使用 @[`@tool`] 装饰器。默认情况下，函数的 docstring 成为 Tool 的描述，帮助模型理解何时使用它：

```python
from langchain.tools import tool

@tool
def search_database(query: str, limit: int = 10) -> str:
    """Search the customer database for records matching the query.

    Args:
        query: Search terms to look for
        limit: Maximum number of results to return
    """
    return f"Found {limit} results for '{query}'"
```

类型提示是 **必需的**，因为它们定义了 Tool 的输入 schema。docstring 应该信息丰富且简洁，以帮助模型理解 Tool 的用途。
:::

:::js
创建 Tool 最简单的方法是从 `langchain` 包导入 `tool` 函数。你可以使用 [zod](https://zod.dev/) 来定义 Tool 的输入 schema：

```ts
import * as z from "zod"
import { tool } from "langchain"

const searchDatabase = tool(
  ({ query, limit }) => `Found ${limit} results for '${query}'`,
  {
    name: "search_database",
    description: "Search the customer database for records matching the query.",
    schema: z.object({
      query: z.string().describe("Search terms to look for"),
      limit: z.number().describe("Maximum number of results to return"),
    }),
  }
);
```
:::

<Note>
    **服务器端 Tool 使用：** 某些 chat model 具有内置 Tool（web search、code interpreters），它们在服务器端执行。有关详细信息，请参阅 [Server-side tool use](#server-side-tool-use)。
</Note>

<Warning>
    Tool 名称首选 `snake_case`（例如 `web_search` 而不是 `Web Search`）。某些模型 provider 对包含空格或特殊字符的名称有问题或会拒绝并报错。坚持使用字母数字字符、下划线和连字符有助于提高跨 provider 的兼容性。
</Warning>

:::python
### 自定义 Tool 属性

#### 自定义 Tool 名称

默认情况下，Tool 名称来自函数名。当你需要更具描述性的名称时可以覆盖它：

```python
@tool("web_search")  # 自定义名称
def search(query: str) -> str:
    """Search the web for information."""
    return f"Results for: {query}"

print(search.name)  # web_search
```

#### 自定义 Tool 描述

覆盖自动生成的 Tool 描述以获得更清晰的模型指导：

```python
@tool("calculator", description="Performs arithmetic calculations. Use this for any math problems.")
def calc(expression: str) -> str:
    """Evaluate mathematical expressions."""
    return str(eval(expression))
```

### 高级 schema 定义

使用 Pydantic 模型或 JSON schemas 定义复杂输入：

<CodeGroup>
    ```python Pydantic 模型
    from pydantic import BaseModel, Field
    from typing import Literal

    class WeatherInput(BaseModel):
        """Input for weather queries."""
        location: str = Field(description="City name or coordinates")
        units: Literal["celsius", "fahrenheit"] = Field(
            default="celsius",
            description="Temperature unit preference"
        )
        include_forecast: bool = Field(
            default=False,
            description="Include 5-day forecast"
        )

    @tool(args_schema=WeatherInput)
    def get_weather(location: str, units: str = "celsius", include_forecast: bool = False) -> str:
        """Get current weather and optional forecast."""
        temp = 22 if units == "celsius" else 72
        result = f"Current weather in {location}: {temp} degrees {units[0].upper()}"
        if include_forecast:
            result += "\nNext 5 days: Sunny"
        return result
    ```

    ```python JSON Schema
    weather_schema = {
        "type": "object",
        "properties": {
            "location": {"type": "string"},
            "units": {"type": "string"},
            "include_forecast": {"type": "boolean"}
        },
        "required": ["location", "units", "include_forecast"]
    }

    @tool(args_schema=weather_schema)
    def get_weather(location: str, units: str = "celsius", include_forecast: bool = False) -> str:
        """Get current weather and optional forecast."""
        temp = 22 if units == "celsius" else 72
        result = f"Current weather in {location}: {temp} degrees {units[0].upper()}"
        if include_forecast:
            result += "\nNext 5 days: Sunny"
        return result
    ```
</CodeGroup>

### 保留参数名称

以下参数名称是保留的，不能用作 Tool 参数。使用这些名称将导致 runtime 错误。

| 参数名称 | 用途 |
|----------------|---------|
| `config` | 保留用于在内部向 Tool 传递 `RunnableConfig` |
| `runtime` | 保留用于 `ToolRuntime` 参数（访问 state、context、store） |

要访问 runtime 信息，请使用 @[`ToolRuntime`] 参数而不是将你自己的参数命名为 `config` 或 `runtime`。
:::

## 访问 Context

当 Tool 可以访问 runtime 信息（如对话历史、用户数据和持久化记忆）时，它们最强大。本节介绍如何从 Tool 内部访问和更新这些信息。

:::python
Tool 可以通过 @[`ToolRuntime`] 参数访问 runtime 信息，它提供：

| 组件 | 描述 | 用例 |
|-----------|-------------|----------|
| **State** | Short-term memory - 当前对话存在的可变数据（消息、计数器、自定义字段） | 访问对话历史、跟踪 Tool 调用计数 |
| **Context** | 调用时传递的不可变配置（用户 ID、会话信息） | 根据用户身份个性化响应 |
| **Store** | Long-term memory - 跨对话持久化的数据 | 保存用户偏好、维护知识库 |
| **Stream Writer** | 在 Tool 执行期间发出实时更新 | 为长时间运行的操作显示进度 |
| **Config** | 执行的 @[`RunnableConfig`] | 访问 callbacks、tags 和 metadata |
| **Tool Call ID** | 当前 Tool 调用的唯一标识符 | 关联 Tool 调用以进行日志记录和模型调用 |

```mermaid
graph LR
    %% Runtime Context
    subgraph "🔧 Tool Runtime Context"
        A[Tool Call] --> B[ToolRuntime]
        B --> C[State Access]
        B --> D[Context Access]
        B --> E[Store Access]
        B --> F[Stream Writer]
    end

    %% Available Resources
    subgraph "📊 Available Resources"
        C --> G[Messages]
        C --> H[Custom State]
        D --> I[User ID]
        D --> J[Session Info]
        E --> K[Long-term Memory]
        E --> L[User Preferences]
    end

    %% Tool Capabilities
    subgraph "⚡ Enhanced Tool Capabilities"
        M[Context-Aware Tools]
        N[Stateful Tools]
        O[Memory-Enabled Tools]
        P[Streaming Tools]
    end

    %% Connections
    G --> M
    H --> N
    I --> M
    J --> M
    K --> O
    L --> O
    F --> P

    classDef trigger fill:#DCFCE7,stroke:#16A34A,stroke-width:2px,color:#14532D
    classDef process fill:#DBEAFE,stroke:#2563EB,stroke-width:2px,color:#1E3A8A
    classDef output fill:#F3E8FF,stroke:#9333EA,stroke-width:2px,color:#581C87
    classDef neutral fill:#F3F4F6,stroke:#9CA3AF,stroke-width:2px,color:#374151

    class A trigger
    class B,C,D,E,F process
    class G,H,I,J,K,L neutral
    class M,N,O,P output
```

### Short-term memory（State）

State 表示在对话持续期间存在的 short-term memory。它包括消息历史和你在 [graph state](/oss/langgraph/graph-api#state) 中定义的任何自定义字段。

<Info>
    在 Tool 签名中添加 `runtime: ToolRuntime` 以访问 state。此参数自动注入并对 LLM 隐藏——它不会出现在 Tool 的 schema 中。
</Info>

#### 访问 State

Tool 可以使用 `runtime.state` 访问当前对话 state：

```python
from langchain.tools import tool, ToolRuntime
from langchain.messages import HumanMessage

@tool
def get_last_user_message(runtime: ToolRuntime) -> str:
    """Get the most recent message from the user."""
    messages = runtime.state["messages"]

    # 查找最后一条人类消息
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return message.content

    return "No user messages found"

# 访问自定义 state 字段
@tool
def get_user_preference(
    pref_name: str,
    runtime: ToolRuntime
) -> str:
    """Get a user preference value."""
    preferences = runtime.state.get("user_preferences", {})
    return preferences.get(pref_name, "Not set")
```

<Warning>
    `runtime` 参数对模型隐藏。对于上面的示例，模型只在 Tool schema 中看到 `pref_name`。
</Warning>

#### 更新 State

使用 @[`Command`] 更新 Agent 的 state。这对于需要更新自定义 state 字段的 Tool 很有用：

```python
from langgraph.types import Command
from langchain.tools import tool

@tool
def set_user_name(new_name: str) -> Command:
    """Set the user's name in the conversation state."""
    return Command(update={"user_name": new_name})
```

<Tip>
    当 Tool 更新 state 变量时，考虑为这些字段定义 [reducer](/oss/langgraph/graph-api#reducers)。由于 LLM 可以并行调用多个 Tool，reducer 决定当同一个 state 字段被并发 Tool 调用更新时如何解决冲突。
</Tip>
:::

### Context

Context 提供在调用时传递的不可变配置数据。将其用于用户 ID、会话详细信息或应用程序特定设置，这些设置在对话期间不应更改。

:::python
通过 `runtime.context` 访问 context：

```python
from dataclasses import dataclass
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain.tools import tool, ToolRuntime


USER_DATABASE = {
    "user123": {
        "name": "Alice Johnson",
        "account_type": "Premium",
        "balance": 5000,
        "email": "alice@example.com"
    },
    "user456": {
        "name": "Bob Smith",
        "account_type": "Standard",
        "balance": 1200,
        "email": "bob@example.com"
    }
}

@dataclass
class UserContext:
    user_id: str

@tool
def get_account_info(runtime: ToolRuntime[UserContext]) -> str:
    """Get the current user's account information."""
    user_id = runtime.context.user_id

    if user_id in USER_DATABASE:
        user = USER_DATABASE[user_id]
        return f"Account holder: {user['name']}\nType: {user['account_type']}\nBalance: ${user['balance']}"
    return "User not found"

model = ChatOpenAI(model="gpt-4.1")
agent = create_agent(
    model,
    tools=[get_account_info],
    context_schema=UserContext,
    system_prompt="You are a financial assistant."
)

result = agent.invoke(
    {"messages": [{"role": "user", "content": "What's my current balance?"}]},
    context=UserContext(user_id="user123")
)
```
:::

:::js
Tool 可以通过 `config` 参数访问 Agent 的 runtime context：

```ts
import * as z from "zod"
import { ChatOpenAI } from "@langchain/openai"
import { createAgent } from "langchain"

const getUserName = tool(
  (_, config) => {
    return config.context.user_name
  },
  {
    name: "get_user_name",
    description: "Get the user's name.",
    schema: z.object({}),
  }
);

const contextSchema = z.object({
  user_name: z.string(),
});

const agent = createAgent({
  model: new ChatOpenAI({ model: "gpt-4.1" }),
  tools: [getUserName],
  contextSchema,
});

const result = await agent.invoke(
  {
    messages: [{ role: "user", content: "What is my name?" }]
  },
  {
    context: { user_name: "John Smith" }
  }
);
```
:::

### Long-term memory（Store）

@[`BaseStore`] 提供跨对话持久化的存储。与 state（short-term memory）不同，保存到 store 的数据在未来会话中仍然可用。

:::python
通过 `runtime.store` 访问 store。store 使用 namespace/key 模式组织数据：

<Tip>
    对于生产部署，使用持久化 store 实现如 @[`PostgresStore`] 而不是 `InMemoryStore`。有关设置详细信息，请参阅 [memory documentation](/oss/langgraph/memory)。
</Tip>

```python expandable
from typing import Any
from langgraph.store.memory import InMemoryStore
from langchain.agents import create_agent
from langchain.tools import tool, ToolRuntime


# 访问记忆
@tool
def get_user_info(user_id: str, runtime: ToolRuntime) -> str:
    """Look up user info."""
    store = runtime.store
    user_info = store.get(("users",), user_id)
    return str(user_info.value) if user_info else "Unknown user"

# 更新记忆
@tool
def save_user_info(user_id: str, user_info: dict[str, Any], runtime: ToolRuntime) -> str:
    """Save user info."""
    store = runtime.store
    store.put(("users",), user_id, user_info)
    return "Successfully saved user info."

store = InMemoryStore()
agent = create_agent(
    model,
    tools=[get_user_info, save_user_info],
    store=store
)

# 第一个会话：保存用户信息
agent.invoke({
    "messages": [{"role": "user", "content": "Save the following user: userid: abc123, name: Foo, age: 25, email: foo@langchain.dev"}]
})

# 第二个会话：获取用户信息
agent.invoke({
    "messages": [{"role": "user", "content": "Get user info for user with id 'abc123'"}]
})
# Here is the user info for user with ID "abc123":
# - Name: Foo
# - Age: 25
# - Email: foo@langchain.dev
```
:::

:::js
通过 `config.store` 访问 store。store 使用 namespace/key 模式组织数据：

```ts expandable
import * as z from "zod";
import { createAgent, tool } from "langchain";
import { InMemoryStore } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

const store = new InMemoryStore();

// 访问记忆
const getUserInfo = tool(
  async ({ user_id }) => {
    const value = await store.get(["users"], user_id);
    console.log("get_user_info", user_id, value);
    return value;
  },
  {
    name: "get_user_info",
    description: "Look up user info.",
    schema: z.object({
      user_id: z.string(),
    }),
  }
);

// 更新记忆
const saveUserInfo = tool(
  async ({ user_id, name, age, email }) => {
    console.log("save_user_info", user_id, name, age, email);
    await store.put(["users"], user_id, { name, age, email });
    return "Successfully saved user info.";
  },
  {
    name: "save_user_info",
    description: "Save user info.",
    schema: z.object({
      user_id: z.string(),
      name: z.string(),
      age: z.number(),
      email: z.string(),
    }),
  }
);

const agent = createAgent({
  model: new ChatOpenAI({ model: "gpt-4.1" }),
  tools: [getUserInfo, saveUserInfo],
  store,
});

// 第一个会话：保存用户信息
await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Save the following user: userid: abc123, name: Foo, age: 25, email: foo@langchain.dev",
    },
  ],
});

// 第二个会话：获取用户信息
const result = await agent.invoke({
  messages: [
    { role: "user", content: "Get user info for user with id 'abc123'" },
  ],
});

console.log(result);
// Here is the user info for user with ID "abc123":
// - Name: Foo
// - Age: 25
// - Email: foo@langchain.dev
```
:::

### Stream Writer

在 Tool 执行期间流式传输实时更新。这对于在长时间运行的操作期间向用户提供进度反馈很有用。

:::python
使用 `runtime.stream_writer` 发出自定义更新：

```python
from langchain.tools import tool, ToolRuntime

@tool
def get_weather(city: str, runtime: ToolRuntime) -> str:
    """Get weather for a given city."""
    writer = runtime.stream_writer

    # 在 Tool 执行时流式传输自定义更新
    writer(f"Looking up data for city: {city}")
    writer(f"Acquired data for city: {city}")

    return f"It's always sunny in {city}!"
```

<Note>
如果你在 Tool 中使用 `runtime.stream_writer`，Tool 必须在 LangGraph 执行上下文中调用。有关更多详细信息，请参阅 [Streaming](/oss/langchain/streaming)。
</Note>
:::

:::js
使用 `config.writer` 发出自定义更新：

```ts
import * as z from "zod";
import { tool, ToolRuntime } from "langchain";

const getWeather = tool(
  ({ city }, config: ToolRuntime) => {
    const writer = config.writer;

    // 在 Tool 执行时流式传输自定义更新
    if (writer) {
      writer(`Looking up data for city: ${city}`);
      writer(`Acquired data for city: ${city}`);
    }

    return `It's always sunny in {city}!`;
  },
  {
    name: "get_weather",
    description: "Get weather for a given city.",
    schema: z.object({
      city: z.string(),
    }),
  }
);
```
:::

## ToolNode

@[`ToolNode`] 是一个预构建节点，在 LangGraph 工作流中执行 Tool。它自动处理并行 Tool 执行、错误处理和 state 注入。

<Info>
    对于需要对 Tool 执行模式进行细粒度控制的自定义工作流，使用 @[`ToolNode`] 而不是 @[`create_agent`]。它是支持 Agent Tool 执行的构建块。
</Info>

### 基础用法

:::python
```python
from langchain.tools import tool
from langgraph.prebuilt import ToolNode
from langgraph.graph import StateGraph, MessagesState, START, END

@tool
def search(query: str) -> str:
    """Search for information."""
    return f"Results for: {query}"

@tool
def calculator(expression: str) -> str:
    """Evaluate a math expression."""
    return str(eval(expression))

# 使用你的 Tool 创建 ToolNode
tool_node = ToolNode([search, calculator])

# 在 graph 中使用
builder = StateGraph(MessagesState)
builder.add_node("tools", tool_node)
# ... 添加其他节点和边
```
:::

:::js
```typescript
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

const search = tool(
  ({ query }) => `Results for: ${query}`,
  {
    name: "search",
    description: "Search for information.",
    schema: z.object({ query: z.string() }),
  }
);

const calculator = tool(
  ({ expression }) => String(eval(expression)),
  {
    name: "calculator",
    description: "Evaluate a math expression.",
    schema: z.object({ expression: z.string() }),
  }
);

// 使用你的 Tool 创建 ToolNode
const toolNode = new ToolNode([search, calculator]);
```
:::

### Tool 返回值

你可以为 Tool 选择不同的返回值：

- 返回 `string` 以提供人类可读的结果。
- 返回 `object` 以提供模型应解析的结构化结果。
- 当你需要写入 state 时返回带有可选消息的 `Command`。

#### 返回字符串

当 Tool 应提供纯文本供模型阅读并在其下一个响应中使用时，返回字符串。

:::python

返回字符串示例：

```python
@tool
def search(query: str) -> str:
    """Search for information."""
    return f"Results for: {query}"
```

:::

:::js

返回字符串示例：

```ts
const search = tool(
  ({ query }) => `Results for: ${query}`,
  {
    name: "search",
    description: "Search for information.",
    schema: z.object({ query: z.string() }),
  }
);
```

:::

行为：

- 返回值转换为 `ToolMessage`。
- 模型看到该文本并决定下一步做什么。
- 除非模型或其他 Tool 稍后执行，否则不会更改 Agent state 字段。

当结果自然是人类可读文本时使用此方法。

#### 返回对象

当 Tool 生成模型应检查的结构化数据时，返回对象（例如 `dict`）。

:::python

返回对象示例：

```python
@tool
def get_stock_price(symbol: str) -> dict:
    """Get current stock price."""
    return {"symbol": symbol, "price": 150.25, "change": "+2.5%"}
```

:::

:::js

返回对象示例：

```ts
const getStockPrice = tool(
  ({ symbol }) => ({ symbol, price: 150.25, change: "+2.5%" }),
  {
    name: "get_stock_price",
    description: "Get current stock price.",
    schema: z.object({ symbol: z.string() }),
  }
);
```

:::

行为：

- 对象被序列化并作为 Tool 输出发送回来。
- 模型可以读取特定字段并对其进行推理。
- 与字符串返回一样，这不会直接更新 graph state。

当下游推理受益于显式字段而不是自由格式文本时使用此方法。

#### 返回 Command

当 Tool 需要更新 graph state（例如设置用户偏好或应用 state）时，返回 @[`Command`]。
你可以返回带有或不包含 `ToolMessage` 的 `Command`。
如果模型需要看到 Tool 成功（例如确认偏好更改），在更新中包含 `ToolMessage`，使用 `runtime.tool_call_id` 作为 `tool_call_id` 参数。

:::python

返回 Command 示例：

```python
from langgraph.types import Command

@tool
def set_preference(pref: str, value: str, runtime: ToolRuntime) -> Command:
    """Set user preference."""
    return Command(
        update={"preferences": {**runtime.state.get("preferences", {}), pref: value}},
        graph_outputs={"tool_output": f"Set {pref} to {value}"}
    )
```

:::

:::js

返回 Command 示例：

```ts
import { Command } from "@langchain/langgraph";

const setPreference = tool(
  ({ pref, value }) => {
    return new Command({
      update: { preferences: { [pref]: value } },
    });
  },
  {
    name: "set_preference",
    description: "Set user preference.",
    schema: z.object({ pref: z.string(), value: z.string() }),
  }
);
```

:::

行为：

- Command 使用 `update` 更新 state。
- 更新后的 state 在同一运行的后续步骤中可用。
- 对可能被并行 Tool 调用更新的字段使用 reducers。

当 Tool 不仅返回数据而且还修改 Agent state 时使用此方法。

### 错误处理

配置 Tool 错误的处理方式。有关所有选项，请参阅 @[`ToolNode`] API 参考。

:::python
```python
from langgraph.prebuilt import ToolNode

# 默认：捕获调用错误，重新抛出执行错误
tool_node = ToolNode(tools)

# 捕获所有错误并向 LLM 返回错误消息
tool_node = ToolNode(tools, handle_tool_errors=True)

# 自定义错误消息
tool_node = ToolNode(tools, handle_tool_errors="Something went wrong, please try again.")

# 自定义错误处理程序
def handle_error(e: ValueError) -> str:
    return f"Invalid input: {e}"

tool_node = ToolNode(tools, handle_tool_errors=handle_error)

# 仅捕获特定异常类型
tool_node = ToolNode(tools, handle_tool_errors=(ValueError, TypeError))
```
:::

:::js
```typescript
import { ToolNode } from "@langchain/langgraph/prebuilt";

// 默认行为
const toolNode = new ToolNode(tools);

// 捕获所有错误
const toolNode = new ToolNode(tools, { handleToolErrors: true });

// 自定义错误消息
const toolNode = new ToolNode(tools, {
  handleToolErrors: "Something went wrong, please try again."
});
```
:::

### 使用 tools_condition 路由

使用 @[`tools_condition`] 根据 LLM 是否进行 Tool 调用进行条件路由：

:::python
```python
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph import StateGraph, MessagesState, START, END

builder = StateGraph(MessagesState)
builder.add_node("llm", call_llm)
builder.add_node("tools", ToolNode(tools))

builder.add_edge(START, "llm")
builder.add_conditional_edges("llm", tools_condition)  # 路由到 "tools" 或 END
builder.add_edge("tools", "llm")

graph = builder.compile()
```
:::

:::js
```typescript
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";

const builder = new StateGraph(MessagesAnnotation)
  .addNode("llm", callLlm)
  .addNode("tools", new ToolNode(tools))
  .addEdge("__start__", "llm")
  .addConditionalEdges("llm", toolsCondition)  # 路由到 "tools" 或 "__end__"
  .addEdge("tools", "llm");

const graph = builder.compile();
```
:::

### State 注入

Tool 可以通过 @[`ToolRuntime`] 访问当前 graph state：

:::python
```python
from langchain.tools import tool, ToolRuntime
from langgraph.prebuilt import ToolNode

@tool
def get_message_count(runtime: ToolRuntime) -> str:
    """Get the number of messages in the conversation."""
    messages = runtime.state["messages"]
    return f"There are {len(messages)} messages."

tool_node = ToolNode([get_message_count])
```
:::

有关从 Tool 访问 state、context 和 long-term memory 的更多详细信息，请参阅 [Access context](#access-context)。

## 预构建 Tool

LangChain 为常见任务（如 web search、code interpretation、database access 等）提供了大量预构建 Tool 和 toolkit。这些即用型 Tool 可以直接集成到你的 Agent 中，无需编写自定义代码。

请参阅 [tools and toolkits](/oss/integrations/tools) 集成页面，获取按类别组织的可用 Tool 完整列表。

## 服务器端 Tool 使用

某些 chat model 具有由模型 provider 在服务器端执行的内置 Tool。这些包括 web search 和 code interpreters 等功能，不需要你定义或托管 Tool 逻辑。

请参阅各个 [chat model integration pages](/oss/integrations/providers) 和 [tool calling documentation](/oss/langchain/models#server-side-tool-use)，了解启用和使用这些内置 Tool 的详细信息。
