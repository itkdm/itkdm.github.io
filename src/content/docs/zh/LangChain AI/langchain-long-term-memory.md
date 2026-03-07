---
title: Long-term Memory（长期记忆）
order: 14
section: "LangChain AI"
topic: "LangChain"
lang: "zh"
slug: "langchain-long-term-memory"
summary: "了解如何使用 LangGraph persistence 和 memory store 为 LangChain Agents 实现长期记忆，包括在 tools 中读写记忆。"
icon: "database"
featured: true
toc: true
updated: 2026-03-07
---

## 概述

LangChain Agents 使用 [LangGraph persistence](/oss/langgraph/persistence#memory-store) 来启用长期记忆。这是一个更高级的主题，需要了解 LangGraph 才能使用。

## Memory Storage（记忆存储）

LangGraph 将长期记忆作为 JSON 文档存储在 [store](/oss/langgraph/persistence#memory-store) 中。

每个记忆组织在自定义 `namespace`（类似于文件夹）和不同的 `key`（类似于文件名）下。Namespaces 通常包括用户或组织 ID 或其他标签，使组织信息更容易。

这种结构支持记忆的层级组织。然后通过 content filters 支持跨 namespace 搜索。

:::python
```python
from langgraph.store.memory import InMemoryStore


def embed(texts: list[str]) -> list[list[float]]:
    # 替换为实际的 embedding 函数或 LangChain embeddings 对象
    return [[1.0, 2.0] * len(texts)]


# InMemoryStore 将数据保存到内存字典中。在生产使用中请使用 DB-backed store。
store = InMemoryStore(index={"embed": embed, "dims": 2}) # [!code highlight]
user_id = "my-user"
application_context = "chitchat"
namespace = (user_id, application_context) # [!code highlight]
store.put( # [!code highlight]
    namespace,
    "a-memory",
    {
        "rules": [
            "User likes short, direct language",
            "User only speaks English & python",
        ],
        "my-key": "my-value",
    },
)
# 通过 ID 获取 "memory"
item = store.get(namespace, "a-memory") # [!code highlight]
# 在此 namespace 内搜索 "memories"，基于 content equivalence 过滤，按 vector similarity 排序
items = store.search( # [!code highlight]
    namespace, filter={"my-key": "my-value"}, query="language preferences"
)
```
:::

:::js
```typescript
import { InMemoryStore } from "@langchain/langgraph";

const embed = (texts: string[]): number[][] => {
    # 替换为实际的 embedding 函数或 LangChain embeddings 对象
    return texts.map(() => [1.0, 2.0]);
};

# InMemoryStore 将数据保存到内存字典中。在生产使用中请使用 DB-backed store。
const store = new InMemoryStore({ index: { embed, dims: 2 } }); # [!code highlight]
const userId = "my-user";
const applicationContext = "chitchat";
const namespace = [userId, applicationContext]; # [!code highlight]

await store.put( # [!code highlight]
    namespace,
    "a-memory",
    {
        rules: [
            "User likes short, direct language",
            "User only speaks English & TypeScript",
        ],
        "my-key": "my-value",
    }
);

# 通过 ID 获取 "memory"
const item = await store.get(namespace, "a-memory"); # [!code highlight]

# 在此 namespace 内搜索 "memories"，基于 content equivalence 过滤，按 vector similarity 排序
const items = await store.search( # [!code highlight]
    namespace,
    {
        filter: { "my-key": "my-value" },
        query: "language preferences"
    }
);
```
:::

有关 memory store 的更多信息，请参阅 [Persistence](/oss/langgraph/persistence#memory-store) 指南。

## 在 Tools 中读取长期记忆

:::python
```python Agent 可用于查找用户信息的 tool
from dataclasses import dataclass

from langchain_core.runnables import RunnableConfig
from langchain.agents import create_agent
from langchain.tools import tool, ToolRuntime
from langgraph.store.memory import InMemoryStore


@dataclass
class Context:
    user_id: str

# InMemoryStore 将数据保存到内存字典中。在生产中请使用 DB-backed store。
store = InMemoryStore() # [!code highlight]

# 使用 put 方法将示例数据写入 store
store.put( # [!code highlight]
    ("users",),  # Namespace 用于将相关数据分组在一起（用户数据的 users namespace）
    "user_123",  # namespace 内的 key（用户 ID 作为 key）
    {
        "name": "John Smith",
        "language": "English",
    }  # 为给定用户存储的数据
)

@tool
def get_user_info(runtime: ToolRuntime[Context]) -> str:
    """Look up user info."""
    # 访问 store - 与提供给 `create_agent` 的相同
    store = runtime.store # [!code highlight]
    user_id = runtime.context.user_id
    # 从 store 检索数据 - 返回带有 value 和 metadata 的 StoreValue 对象
    user_info = store.get(("users",), user_id) # [!code highlight]
    return str(user_info.value) if user_info else "Unknown user"

agent = create_agent(
    model="claude-sonnet-4-6",
    tools=[get_user_info],
    # 将 store 传递给 agent - 使 agent 能够在运行 tools 时访问 store
    store=store, # [!code highlight]
    context_schema=Context
)

# 运行 agent
agent.invoke(
    {"messages": [{"role": "user", "content": "look up user information"}]},
    context=Context(user_id="user_123") # [!code highlight]
)
```

:::

:::js
```typescript Agent 可用于查找用户信息的 tool
import * as z from "zod";
import { createAgent, tool, type ToolRuntime } from "langchain";
import { InMemoryStore } from "@langchain/langgraph";

# InMemoryStore 将数据保存到内存字典中。在生产中请使用 DB-backed store。
const store = new InMemoryStore(); # [!code highlight]
const contextSchema = z.object({
  userId: z.string(),
});

# 使用 put 方法将示例数据写入 store
await store.put( # [!code highlight]
  ["users"], # Namespace 用于将相关数据分组在一起（用户数据的 users namespace）
  "user_123", # namespace 内的 key（用户 ID 作为 key）
  {
    name: "John Smith",
    language: "English",
  } # 为给定用户存储的数据
);

const getUserInfo = tool(
  # 查找用户信息。
  async (_, runtime: ToolRuntime<unknown, z.infer<typeof contextSchema>>) => {
    # 访问 store - 与提供给 `createAgent` 的相同
    const userId = runtime.context.userId;
    if (!userId) {
      throw new Error("userId is required");
    }
    # 从 store 检索数据 - 返回带有 value 和 metadata 的 StoreValue 对象
    const userInfo = await runtime.store.get(["users"], userId);
    return userInfo?.value ? JSON.stringify(userInfo.value) : "Unknown user";
  },
  {
    name: "getUserInfo",
    description: "Look up user info by userId from the store.",
    schema: z.object({}),
  }
);

const agent = createAgent({
  model: "gpt-4.1-mini",
  tools: [getUserInfo],
  contextSchema,
  # 将 store 传递给 agent - 使 agent 能够在运行 tools 时访问 store
  store, # [!code highlight]
});

# 运行 agent
const result = await agent.invoke(
  { messages: [{ role: "user", content: "look up user information" }] },
  { context: { userId: "user_123" } } # [!code highlight]
);

console.log(result.messages.at(-1)?.content);

/**
 * Outputs:
 * User Information:
 * - Name: John Smith
 * - Language: English
 */
```

:::

<a id="write-long-term"></a>
## 从 Tools 写入长期记忆

:::python
```python 更新用户信息的 tool 示例
from dataclasses import dataclass
from typing_extensions import TypedDict

from langchain.agents import create_agent
from langchain.tools import tool, ToolRuntime
from langgraph.store.memory import InMemoryStore


# InMemoryStore 将数据保存到内存字典中。在生产中请使用 DB-backed store。
store = InMemoryStore() # [!code highlight]

@dataclass
class Context:
    user_id: str

# TypedDict 定义用户信息的结构供 LLM 使用
class UserInfo(TypedDict):
    name: str

# 允许 agent 更新用户信息的 tool（对 chat 应用很有用）
@tool
def save_user_info(user_info: UserInfo, runtime: ToolRuntime[Context]) -> str:
    """Save user info."""
    # 访问 store - 与提供给 `create_agent` 的相同
    store = runtime.store # [!code highlight]
    user_id = runtime.context.user_id # [!code highlight]
    # 将数据存储在 store 中（namespace, key, data）
    store.put(("users",), user_id, user_info) # [!code highlight]
    return "Successfully saved user info."

agent = create_agent(
    model="claude-sonnet-4-6",
    tools=[save_user_info],
    store=store, # [!code highlight]
    context_schema=Context
)

# 运行 agent
agent.invoke(
    {"messages": [{"role": "user", "content": "My name is John Smith"}]},
    # user_id 在 context 中传递以识别正在更新谁的信息
    context=Context(user_id="user_123") # [!code highlight]
)

# 你可以直接访问 store 来获取值
store.get(("users",), "user_123").value
```

:::

:::js
```typescript 更新用户信息的 tool 示例
import * as z from "zod";
import { tool, createAgent, type ToolRuntime } from "langchain";
import { InMemoryStore } from "@langchain/langgraph";

# InMemoryStore 将数据保存到内存字典中。在生产中请使用 DB-backed store。
const store = new InMemoryStore(); # [!code highlight]

const contextSchema = z.object({
  userId: z.string(),
});

# Schema 定义用户信息的结构供 LLM 使用
const UserInfo = z.object({
  name: z.string(),
});

# 允许 agent 更新用户信息的 tool（对 chat 应用很有用）
const saveUserInfo = tool(
  async (
    userInfo: z.infer<typeof UserInfo>,
    runtime: ToolRuntime<unknown, z.infer<typeof contextSchema>>
  ) => {
    const userId = runtime.context.userId;
    if (!userId) {
      throw new Error("userId is required");
    }
    # 将数据存储在 store 中（namespace, key, data）
    await runtime.store.put(["users"], userId, userInfo);
    return "Successfully saved user info.";
  },
  {
    name: "save_user_info",
    description: "Save user info",
    schema: UserInfo,
  }
);

const agent = createAgent({
  model: "gpt-4.1-mini",
  tools: [saveUserInfo],
  contextSchema,
  store, # [!code highlight]
});

# 运行 agent
await agent.invoke(
  { messages: [{ role: "user", content: "My name is John Smith" }] },
  # userId 在 context 中传递以识别正在更新谁的信息
  { context: { userId: "user_123" } } # [!code highlight]
);

# 你可以直接访问 store 来获取值
const result = await store.get(["users"], "user_123");
console.log(result?.value); # Output: { name: "John Smith" }

```

:::
