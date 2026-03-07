---
title: Model Context Protocol (MCP)
order: 20
section: "LangChain AI"
topic: "MCP 集成"
lang: "zh"
slug: "langchain-mcp"
summary: 了解如何使用 Model Context Protocol 将外部工具集成到 LangChain agents
icon: "protocol"
featured: true
toc: true
updated: 2026-03-07
---

:::python
[Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) 是一个开放协议，标准化应用程序如何向 LLMs 提供工具和上下文。LangChain agents 可以使用 [`langchain-mcp-adapters`](https://github.com/langchain-ai/langchain-mcp-adapters) 库使用 MCP servers 上定义的工具。
:::
:::js
[Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) 是一个开放协议，标准化应用程序如何向 LLMs 提供工具和上下文。LangChain agents 可以使用 [`@langchain/mcp-adapters`](https://github.com/langchain-ai/langchainjs/tree/main/libs/langchain-mcp-adapters) 库使用 MCP servers 上定义的工具。
:::

## Quickstart

:::python
安装 `langchain-mcp-adapters` 库：

<CodeGroup>
```bash pip
pip install langchain-mcp-adapters
```

```bash uv
uv add langchain-mcp-adapters
```
</CodeGroup>

`langchain-mcp-adapters` 使 agents 能够使用一个或多个 MCP servers 上定义的工具。

<Note>
    `MultiServerMCPClient` 默认是 **stateless**。每个工具调用创建一个新的 MCP `ClientSession`，执行工具，然后清理。有关更多详情，请参阅 [stateful sessions](#stateful-sessions) 部分。
</Note>

```python Accessing multiple MCP servers icon="server"
import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient  # [!code highlight]
from langchain.agents import create_agent

async def main():
    client = MultiServerMCPClient(  # [!code highlight]
        {
            "math": {
                "transport": "stdio",  # Local subprocess communication
                "command": "python",
                # Absolute path to your math_server.py file
                "args": ["/path/to/math_server.py"],
            },
            "weather": {
                "transport": "http",  # HTTP-based remote server
                # Ensure you start your weather server on port 8000
                "url": "http://localhost:8000/mcp",
            }
        }
    )

    tools = await client.get_tools()  # [!code highlight]
    agent = create_agent(
        "claude-sonnet-4-6",
        tools  # [!code highlight]
    )
    math_response = await agent.ainvoke(
        {"messages": [{"role": "user", "content": "what's (3 + 5) x 12?"}]}
    )
    weather_response = await agent.ainvoke(
        {"messages": [{"role": "user", "content": "what is the weather in nyc?"}]}
    )
    print(math_response)
    print(weather_response)

if __name__ == "__main__":
    asyncio.run(main())
```
:::

:::js
安装 `@langchain/mcp-adapters` 库：

<CodeGroup>
```bash npm
npm install @langchain/mcp-adapters
```

```bash pnpm
pnpm add @langchain/mcp-adapters
```

```bash yarn
yarn add @langchain/mcp-adapters
```

```bash bun
bun add @langchain/mcp-adapters
```
</CodeGroup>

`@langchain/mcp-adapters` 使 agents 能够使用一个或多个 MCP servers 上定义的工具。

<Note>
    `MultiServerMCPClient` 默认是 **stateless**。每个工具调用创建一个新的 MCP `ClientSession`，执行工具，然后清理。有关更多详情，请参阅 [stateful sessions](#stateful-sessions) 部分。
</Note>

```ts Accessing multiple MCP servers icon="server"
import { MultiServerMCPClient } from "@langchain/mcp-adapters";  // [!code highlight]
import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent } from "langchain";

const client = new MultiServerMCPClient({  // [!code highlight]
    math: {
        transport: "stdio",  // Local subprocess communication
        command: "node",
        // Replace with absolute path to your math_server.js file
        args: ["/path/to/math_server.js"],
    },
    weather: {
        transport: "http",  // HTTP-based remote server
        // Ensure you start your weather server on port 8000
        url: "http://localhost:8000/mcp",
    },
});

const tools = await client.getTools();  // [!code highlight]
const agent = createAgent({
    model: "claude-sonnet-4-6",
    tools,  // [!code highlight]
});

const mathResponse = await agent.invoke({
    messages: [{ role: "user", content: "what's (3 + 5) x 12?" }],
});

const weatherResponse = await agent.invoke({
    messages: [{ role: "user", content: "what is the weather in nyc?" }],
});
```
:::

## Custom servers

:::python

要创建自定义 MCP server，使用 [FastMCP](https://gofastmcp.com/getting-started/welcome) 库：

<CodeGroup>
```bash pip
pip install fastmcp
```

```bash uv
uv add fastmcp
```
</CodeGroup>
:::

:::js
要创建自己的 MCP servers，你可以使用 `@modelcontextprotocol/sdk` 库。此库提供了一种简单的方法来定义 [tools](https://modelcontextprotocol.io/docs/learn/server-concepts#tools-ai-actions) 并将它们作为 servers 运行。

<CodeGroup>
```bash npm
npm install @modelcontextprotocol/sdk
```

```bash pnpm
pnpm add @modelcontextprotocol/sdk
```

```bash yarn
yarn add @modelcontextprotocol/sdk
```

```bash bun
bun add @modelcontextprotocol/sdk
```
</CodeGroup>
:::

## Transports

MCP 支持不同的 transport mechanisms 用于 client-server communication。

### HTTP

`http` transport（也称为 `streamable-http`）使用 HTTP requests 进行 client-server communication。有关更多详情，请参阅 [MCP HTTP transport specification](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http)。

### stdio

Client 将 server 作为 subprocess 启动并通过 standard input/output 进行 communication。最适合 local tools 和 simple setups。

<Note>
    与 HTTP transports 不同，`stdio` connections 本质上是 **stateful** — subprocess 在 client connection 的生命周期内持久存在。但是，当使用 `MultiServerMCPClient` 而没有显式 session management 时，每个工具调用仍然创建新 session。有关管理 persistent connections 的详情，请参阅 [stateful sessions](#stateful-sessions)。
</Note>

## Stateful sessions

默认情况下，`MultiServerMCPClient` 是 **stateless** — 每个工具调用创建一个新的 MCP session，执行工具，然后清理。

如果你需要控制 MCP session 的 [lifecycle](https://modelcontextprotocol.io/specification/2025-03-26/basic/lifecycle)（例如，当使用在工具调用之间维护上下文的 stateful server 时），你可以使用 `client.session()` 创建持久的 `ClientSession`。

:::python
```python Using MCP ClientSession for stateful tool usage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools
from langchain.agents import create_agent

client = MultiServerMCPClient({...})

# Create a session explicitly
async with client.session("server_name") as session:  # [!code highlight]
    # Pass the session to load tools, resources, or prompts
    tools = await load_mcp_tools(session)  # [!code highlight]
    agent = create_agent(
        "anthropic:claude-3-7-sonnet-latest",
        tools
    )
```
:::

## Core features

### Tools

[Tools](https://modelcontextprotocol.io/docs/concepts/tools) 允许 MCP servers 公开 executable functions，LLMs 可以调用这些函数来执行操作 — 如 querying databases、calling APIs 或与 external systems 交互。LangChain 将 MCP tools 转换为 LangChain [tools](/oss/langchain/tools)，使它们可直接用于任何 LangChain agent 或 workflow。

#### Loading tools

使用 `client.get_tools()` 从 MCP servers 检索工具并将它们传递给 agent：

:::python
```python
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain.agents import create_agent

client = MultiServerMCPClient({...})
tools = await client.get_tools()  # [!code highlight]
agent = create_agent("claude-sonnet-4-6", tools)
```
:::

:::js
```typescript
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent } from "langchain";

const client = new MultiServerMCPClient({...});
const tools = await client.getTools();  # [!code highlight]
const agent = createAgent({ model: "claude-sonnet-4-6", tools });
```
:::

### Resources

[Resources](https://modelcontextprotocol.io/docs/concepts/resources) 允许 MCP servers 公开 data — 如 files、database records 或 API responses — 可以被 clients 读取。LangChain 将 MCP resources 转换为 [Blob](https://reference.langchain.com/python/langchain_core/documents/#langchain_core.documents.base.Blob) 对象，提供统一的 interface 用于 handling text 和 binary content。

#### Loading resources

使用 `client.get_resources()` 从 MCP server 加载 resources：

```python
from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({...})

# Load all resources from a server
blobs = await client.get_resources("server_name")  # [!code highlight]

# Or load specific resources by URI
blobs = await client.get_resources("server_name", uris=["file:///path/to/file.txt"])  # [!code highlight]

for blob in blobs:
    print(f"URI: {blob.metadata['uri']}, MIME type: {blob.mimetype}")
    print(blob.as_string())  # For text content
```

### Prompts

[Prompts](https://modelcontextprotocol.io/docs/concepts/prompts) 允许 MCP servers 公开 reusable prompt templates，可以被 clients 检索和使用。LangChain 将 MCP prompts 转换为 [messages](/oss/langchain/messages)，使它们易于集成到 chat-based workflows 中。

#### Loading prompts

使用 `client.get_prompt()` 从 MCP server 加载 prompt：

```python
from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({...})

# Load a prompt by name
messages = await client.get_prompt("server_name", "summarize")  # [!code highlight]

# Load a prompt with arguments
messages = await client.get_prompt(  # [!code highlight]
    "server_name",  # [!code highlight]
    "code_review",  # [!code highlight]
    arguments={"language": "python", "focus": "security"}  # [!code highlight]
)  # [!code highlight]

# Use the messages in your workflow
for message in messages:
    print(f"{message.type}: {message.content}")
```

## Advanced features

### Tool interceptors

MCP servers 作为 separate processes 运行 — 它们无法访问 LangGraph runtime information，如 [store](/oss/langgraph/persistence#memory-store)、[context](/oss/langchain/context-engineering) 或 agent state。**Interceptors bridge this gap**，让你在 MCP tool execution 期间访问此 runtime context。

Interceptors 还提供 middleware-like control over tool calls：你可以 modify requests、implement retries、dynamically add headers，或完全 short-circuit execution。

#### Accessing runtime context

当 MCP tools 在 LangChain agent 中使用时（通过 `create_agent`），interceptors 接收对 `ToolRuntime` context 的访问。这提供对 tool call ID、state、config 和 store 的访问 — 实现访问 user data、persisting information 和 controlling agent behavior 的强大模式。

<Tabs>
  <Tab title="Runtime context">
    访问 user-specific configuration，如 user IDs、API keys 或 permissions，在 invocation time 传递：

    ```python Inject user context into MCP tool calls
    from dataclasses import dataclass
    from langchain_mcp_adapters.client import MultiServerMCPClient
    from langchain_mcp_adapters.interceptors import MCPToolCallRequest
    from langchain.agents import create_agent

    @dataclass
    class Context:
        user_id: str
        api_key: str

    async def inject_user_context(
        request: MCPToolCallRequest,
        handler,
    ):
        """Inject user credentials into MCP tool calls."""
        runtime = request.runtime
        user_id = runtime.context.user_id  # [!code highlight]
        api_key = runtime.context.api_key  # [!code highlight]

        # Add user context to tool arguments
        modified_request = request.override(
            args={**request.args, "user_id": user_id}
        )
        return await handler(modified_request)

    client = MultiServerMCPClient(
        {...},
        tool_interceptors=[inject_user_context],
    )
    tools = await client.get_tools()
    agent = create_agent("gpt-4.1", tools, context_schema=Context)

    # Invoke with user context
    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": "Search my orders"}]},
        context={"user_id": "user_123", "api_key": "sk-..."}
    )
    ```
  </Tab>

  <Tab title="Store">
    访问 long-term memory 以检索 user preferences 或在 conversations 之间 persist data：

    ```python Access user preferences from store
    from dataclasses import dataclass
    from langchain_mcp_adapters.client import MultiServerMCPClient
    from langchain_mcp_adapters.interceptors import MCPToolCallRequest
    from langchain.agents import create_agent
    from langgraph.store.memory import InMemoryStore

    @dataclass
    class Context:
        user_id: str

    async def personalize_search(
        request: MCPToolCallRequest,
        handler,
    ):
        """Personalize MCP tool calls using stored preferences."""
        runtime = request.runtime
        user_id = runtime.context.user_id
        store = runtime.store  # [!code highlight]

        # Read user preferences from store
        prefs = store.get(("preferences",), user_id)  # [!code highlight]

        if prefs and request.name == "search":
            # Apply user's preferred language and result limit
            modified_args = {
                **request.args,
                "language": prefs.value.get("language", "en"),
                "limit": prefs.value.get("result_limit", 10),
            }
            request = request.override(args=modified_args)

        return await handler(request)

    client = MultiServerMCPClient(
        {...},
        tool_interceptors=[personalize_search],
    )
    tools = await client.get_tools()
    agent = create_agent(
        "gpt-4.1",
        tools,
        context_schema=Context,
        store=InMemoryStore()
    )
    ```
  </Tab>
</Tabs>

## 相关资源

- [MCP specification](https://modelcontextprotocol.io/introduction) - Official MCP protocol documentation
- [langchain-mcp-adapters](https://github.com/langchain-ai/langchain-mcp-adapters) - Python adapter library
- [@langchain/mcp-adapters](https://github.com/langchain-ai/langchainjs/tree/main/libs/langchain-mcp-adapters) - JavaScript adapter library
