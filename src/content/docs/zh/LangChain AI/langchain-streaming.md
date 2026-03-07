---
title: Streaming 概述
order: 16
section: "LangChain AI"
topic: "流式输出"
lang: "zh"
slug: "langchain-streaming"
summary: 了解如何从 agent 运行中流式传输实时更新
icon: "broadcast"
featured: true
toc: true
updated: 2026-03-07
---

import StreamingReasoningTokensPy from '/snippets/code-samples/streaming-reasoning-tokens-py.mdx';
import StreamingReasoningTokensJs from '/snippets/code-samples/streaming-reasoning-tokens-js.mdx';

LangChain 实现了一个 Streaming 系统来展示实时更新。

Streaming 对于增强基于 LLM 构建的应用程序的响应能力至关重要。通过逐步显示输出（即使在完整响应准备就绪之前），Streaming 显著改善了用户体验 (UX)，特别是在处理 LLM 的延迟时。

## 概述

LangChain 的 Streaming 系统让你能够从 agent 运行中向应用程序展示实时反馈。

使用 LangChain Streaming 可以实现：

* <Icon icon="brain" size={16} /> [**Stream agent progress**](#agent-progress) — 在每个 agent 步骤后获取状态更新。
* <Icon icon="binary" size={16} /> [**Stream LLM tokens**](#llm-tokens) — 在生成时流式传输语言模型 tokens。
* <Icon icon="bulb" size={16} /> [**Stream thinking / reasoning tokens**](#streaming-thinking-/-reasoning-tokens) — 在生成时展示模型推理。
* <Icon icon="table" size={16} /> [**Stream custom updates**](#custom-updates) — 发出用户定义的信号（例如，`"Fetched 10/100 records"`）。
* <Icon icon="stack-push" size={16} /> [**Stream multiple modes**](#stream-multiple-modes) — 从 `updates`（agent 进度）、`messages`（LLM tokens + 元数据）或 `custom`（任意用户数据）中选择。

请参阅下面的 [常见模式](#common-patterns) 部分以获取更多端到端示例。

## 支持的 stream modes

:::python
将一个或多个以下 stream modes 作为列表传递给 @[`stream`][CompiledStateGraph.stream] 或 @[`astream`][CompiledStateGraph.astream] 方法：
:::

:::js
将一个或多个以下 stream modes 作为列表传递给 @[`stream`][CompiledStateGraph.stream] 方法：
:::

| Mode       | 描述                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| `updates`  | 在每个 agent 步骤后流式传输状态更新。如果在同一步骤中进行多次更新（例如，运行多个节点），这些更新将分别流式传输。 |
| `messages` | 从调用 LLM 的任何图节点流式传输 `(token, metadata)` 元组。 |
| `custom`   | 使用 stream writer 从图节点内部流式传输自定义数据。 |

## Agent progress

:::python
要流式传输 agent 进度，使用 @[`stream`][CompiledStateGraph.stream] 或 @[`astream`][CompiledStateGraph.astream] 方法并设置 `stream_mode="updates"`。这会在每个 agent 步骤后发出事件。
:::

:::js
要流式传输 agent 进度，使用 @[`stream`][CompiledStateGraph.stream] 方法并设置 `streamMode: "updates"`。这会在每个 agent 步骤后发出事件。
:::

例如，如果你有一个调用一次工具的 agent，你应该看到以下更新：

* **LLM node**: @[`AIMessage`] 带有工具调用请求
* **Tool node**: @[`ToolMessage`] 带有执行结果
* **LLM node**: 最终 AI 响应

:::python

```python title="Streaming agent progress"
from langchain.agents import create_agent


def get_weather(city: str) -> str:
    """Get weather for a given city."""

    return f"It's always sunny in {city}!"

agent = create_agent(
    model="gpt-5-nano",
    tools=[get_weather],
)
for chunk in agent.stream(  # [!code highlight]
    {"messages": [{"role": "user", "content": "What is the weather in SF?"}]},
    stream_mode="updates",
):
    for step, data in chunk.items():
        print(f"step: {step}")
        print(f"content: {data['messages'][-1].content_blocks}")
```

```shell title="Output"
step: model
content: [{'type': 'tool_call', 'name': 'get_weather', 'args': {'city': 'San Francisco'}, 'id': 'call_OW2NYNsNSKhRZpjW0wm2Aszd'}]

step: tools
content: [{'type': 'text', 'text': "It's always sunny in San Francisco!"}]

step: model
content: [{'type': 'text', 'text': 'It's always sunny in San Francisco!'}]
```
:::

:::js
```typescript
import z from "zod";
import { createAgent, tool } from "langchain";

const getWeather = tool(
    async ({ city }) => {
        return `The weather in ${city} is always sunny!`;
    },
    {
        name: "get_weather",
        description: "Get weather for a given city.",
        schema: z.object({
        city: z.string(),
        }),
    }
);

const agent = createAgent({
    model: "gpt-5-nano",
    tools: [getWeather],
});

for await (const chunk of await agent.stream(
    { messages: [{ role: "user", "content: "what is the weather in sf" }] },
    { streamMode: "updates" }
)) {
    const [step, content] = Object.entries(chunk)[0];
    console.log(`step: ${step}`);
    console.log(`content: ${JSON.stringify(content, null, 2)}`);
}
/**
 * step: model
 * content: {
 *   "messages": [
 *     {
 *       "kwargs": {
 *         // ...
 *         "tool_calls": [
 *           {
 *             "name": "get_weather",
 *             "args": {
 *               "city": "San Francisco"
 *             },
 *             "type": "tool_call",
 *             "id": "call_0qLS2Jp3MCmaKJ5MAYtr4jJd"
 *           }
 *         ],
 *         // ...
 *       }
 *     }
 *   ]
 * }
 * step: tools
 * content: {
 *   "messages": [
 *     {
 *       "kwargs": {
 *         "content": "The weather in San Francisco is always sunny!",
 *         "name": "get_weather",
 *         // ...
 *       }
 *     }
 *   ]
 * }
 * step: model
 * content: {
 *   "messages": [
 *     {
 *       "kwargs": {
 *         "content": "The latest update says: The weather in San Francisco is always sunny!\n\nIf you'd like real-time details (current temperature, humidity, wind, and today's forecast), I can pull the latest data for you. Want me to fetch that?",
 *         // ...
 *       }
 *     }
 *   ]
 * }
 */
```
:::

## LLM tokens

:::python
要流式传输 LLM 生成的 tokens，使用 `stream_mode="messages"`。下面你可以看到 agent Streaming 工具调用和最终响应的输出。

```python title="Streaming LLM tokens"
from langchain.agents import create_agent


def get_weather(city: str) -> str:
    """Get weather for a given city."""

    return f"It's always sunny in {city}!"

agent = create_agent(
    model="gpt-5-nano",
    tools=[get_weather],
)
for token, metadata in agent.stream(  # [!code highlight]
    {"messages": [{"role": "user", "content": "What is the weather in SF?"}]},
    stream_mode="messages",
):
    print(f"node: {metadata['langgraph_node']}")
    print(f"content: {token.content_blocks}")
    print("\n")
```

```shell title="Output" expandable
node: model
content: [{'type': 'tool_call_chunk', 'id': 'call_vbCyBcP8VuneUzyYlSBZZsVa', 'name': 'get_weather', 'args': '', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': '{"', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': 'city', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': '":"', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': 'San', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': ' Francisco', 'index': 0}]


node: model
content: [{'type': 'tool_call_chunk', 'id': None, 'name': None, 'args': '"}', 'index': 0}]


node: model
content: []


node: tools
content: [{'type': 'text', 'text': "It's always sunny in San Francisco!"}]


node: model
content: []


node: model
content: [{'type': 'text', 'text': 'Here'}]


node: model
content: [{'type': 'text', 'text': ''s'}]


node: model
content: [{'type': 'text', 'text': ' what'}]


node: model
content: [{'type': 'text', 'text': ' I'}]


node: model
content: [{'type': 'text', 'text': ' got'}]


node: model
content: [{'type': 'text', 'text': ':'}]


node: model
content: [{'type': 'text', 'text': ' "'}]


node: model
content: [{'type': 'text', 'text': "It's"}]


node: model
content: [{'type': 'text', 'text': ' always'}]


node: model
content: [{'type': 'text', 'text': ' sunny'}]


node: model
content: [{'type': 'text', 'text': ' in'}]


node: model
content: [{'type': 'text', 'text': ' San'}]


node: model
content: [{'type': 'text', 'text': ' Francisco'}]


node: model
content: [{'type': 'text', 'text': '!"\n\n'}]
```
:::

:::js
要流式传输 LLM 生成的 tokens，使用 `streamMode: "messages"`：

```typescript
import z from "zod";
import { createAgent, tool } from "langchain";

const getWeather = tool(
    async ({ city }) => {
        return `The weather in ${city} is always sunny!`;
    },
    {
        name: "get_weather",
        description: "Get weather for a given city.",
        schema: z.object({
        city: z.string(),
        }),
    }
);

const agent = createAgent({
    model: "gpt-4.1-mini",
    tools: [getWeather],
});

for await (const [token, metadata] of await agent.stream(
    { messages: [{ role: "user", content: "what is the weather in sf" }] },
    { streamMode: "messages" }
)) {
    console.log(`node: ${metadata.langgraph_node}`);
    console.log(`content: ${JSON.stringify(token.contentBlocks, null, 2)}`);
}
```
:::

## Custom updates

:::python
要流式传输工具执行时的更新，你可以使用 @[`get_stream_writer`]。

```python title="Streaming custom updates"
from langchain.agents import create_agent
from langgraph.config import get_stream_writer  # [!code highlight]


def get_weather(city: str) -> str:
    """Get weather for a given city."""
    writer = get_stream_writer()  # [!code highlight]
    # stream any arbitrary data
    writer(f"Looking up data for city: {city}")
    writer(f"Acquired data for city: {city}")
    return f"It's always sunny in {city}!"

agent = create_agent(
    model="claude-sonnet-4-6",
    tools=[get_weather],
)

for chunk in agent.stream(
    {"messages": [{"role": "user", "content": "What is the weather in SF?"}]},
    stream_mode="custom"  # [!code highlight]
):
    print(chunk)
```

```shell title="Output"
Looking up data for city: San Francisco
Acquired data for city: San Francisco
```

<Note>
    如果你在工具中添加 @[`get_stream_writer`]，你将无法在 LangGraph 执行上下文之外调用该工具。
</Note>
:::

:::js
要流式传输工具执行时的更新，你可以使用配置中的 `writer` 参数。

```typescript
import z from "zod";
import { tool, createAgent } from "langchain";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

const getWeather = tool(
    async (input, config: LangGraphRunnableConfig) => {
        // Stream any arbitrary data
        config.writer?.(`Looking up data for city: ${input.city}`);
        // ... fetch city data
        config.writer?.(`Acquired data for city: ${input.city}`);
        return `It's always sunny in ${input.city}!`;
    },
    {
        name: "get_weather",
        description: "Get weather for a given city.",
        schema: z.object({
        city: z.string().describe("The city to get weather for."),
        }),
    }
);

const agent = createAgent({
    model: "gpt-4.1-mini",
    tools: [getWeather],
});

for await (const chunk of await agent.stream(
    { messages: [{ role: "user", content: "what is the weather in sf" }] },
    { streamMode: "custom" }
)) {
    console.log(chunk);
}
```

```shell title="Output"
Looking up data for city: San Francisco
Acquired data for city: San Francisco
```

<Note>
    如果你在工具中添加 `writer` 参数，你将无法在 LangGraph 执行上下文之外调用该工具（除非提供 writer 函数）。
</Note>
:::

## Stream multiple modes

:::python
你可以通过将 stream mode 作为列表传递来指定多个 Streaming modes：`stream_mode=["updates", "custom"]`。

Streamed 输出将是 `(mode, chunk)` 元组，其中 `mode` 是 stream mode 的名称，`chunk` 是该 mode 流式传输的数据。

```python title="Streaming multiple modes"
from langchain.agents import create_agent
from langgraph.config import get_stream_writer


def get_weather(city: str) -> str:
    """Get weather for a given city."""
    writer = get_stream_writer()
    writer(f"Looking up data for city: {city}")
    writer(f"Acquired data for city: {city}")
    return f"It's always sunny in {city}!"

agent = create_agent(
    model="gpt-5-nano",
    tools=[get_weather],
)

for stream_mode, chunk in agent.stream(  # [!code highlight]
    {"messages": [{"role": "user", "content": "What is the weather in SF?"}]},
    stream_mode=["updates", "custom"]
):
    print(f"stream_mode: {stream_mode}")
    print(f"content: {chunk}")
    print("\n")
```

```shell title="Output"
stream_mode: updates
content: {'model': {'messages': [AIMessage(content='', response_metadata={'token_usage': {'completion_tokens': 280, 'prompt_tokens': 132, 'total_tokens': 412, 'completion_tokens_details': {'accepted_prediction_tokens': 0, 'audio_tokens': 0, 'reasoning_tokens': 256, 'rejected_prediction_tokens': 0}, 'prompt_tokens_details': {'audio_tokens': 0, 'cached_tokens': 0}}, 'model_provider': 'openai', 'model_name': 'gpt-5-nano-2025-08-07', 'system_fingerprint': None, 'id': 'chatcmpl-C9tlgBzGEbedGYxZ0rTCz5F7OXpL7', 'service_tier': 'default', 'finish_reason': 'tool_calls', 'logprobs': None}, id='lc_run--480c07cb-e405-4411-aa7f-0520fddeed66-0', tool_calls=[{'name': 'get_weather', 'args': {'city': 'San Francisco'}, 'id': 'call_KTNQIftMrl9vgNwEfAJMVu7r', 'type': 'tool_call'}], usage_metadata={'input_tokens': 132, 'output_tokens': 280, 'total_tokens': 412, 'input_token_details': {'audio': 0, 'cache_read': 0}, 'output_token_details': {'audio': 0, 'reasoning': 256}})]}}


stream_mode: custom
content: Looking up data for city: San Francisco


stream_mode: custom
content: Acquired data for city: San Francisco


stream_mode: updates
content: {'tools': {'messages': [ToolMessage(content="It's always sunny in San Francisco!", name='get_weather', tool_call_id='call_KTNQIftMrl9vgNwEfAJMVu7r')]}}


stream_mode: updates
content: {'model': {'messages': [AIMessage(content='San Francisco weather: It's always sunny in San Francisco!\n\n', response_metadata={'token_usage': {'completion_tokens': 764, 'prompt_tokens': 168, 'total_tokens': 932, 'completion_tokens_details': {'accepted_prediction_tokens': 0, 'audio_tokens': 0, 'reasoning_tokens': 704, 'rejected_prediction_tokens': 0}, 'prompt_tokens_details': {'audio_tokens': 0, 'cached_tokens': 0}}, 'model_provider': 'openai', 'model_name': 'gpt-5-nano-2025-08-07', 'system_fingerprint': None, 'id': 'chatcmpl-C9tljDFVki1e1haCyikBptAuXuHYG', 'service_tier': 'default', 'finish_reason': 'stop', 'logprobs': None}, id='lc_run--acbc740a-18fe-4a14-8619-da92a0d0ee90-0', usage_metadata={'input_tokens': 168, 'output_tokens': 764, 'total_tokens': 932, 'input_token_details': {'audio': 0, 'cache_read': 0}, 'output_token_details': {'audio': 0, 'reasoning': 704}})]}}
```
:::

:::js
你可以通过将 streamMode 作为数组传递来指定多个 Streaming modes：`streamMode: ["updates", "messages", "custom"]`。

Streamed 输出将是 `[mode, chunk]` 元组，其中 `mode` 是 stream mode 的名称，`chunk` 是该 mode 流式传输的数据。

```typescript
import z from "zod";
import { tool, createAgent } from "langchain";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

const getWeather = tool(
    async (input, config: LangGraphRunnableConfig) => {
        // Stream any arbitrary data
        config.writer?.(`Looking up data for city: ${input.city}`);
        // ... fetch city data
        config.writer?.(`Acquired data for city: ${input.city}`);
        return `It's always sunny in ${input.city}!`;
    },
    {
        name: "get_weather",
        description: "Get weather for a given city.",
        schema: z.object({
        city: z.string().describe("The city to get weather for."),
        }),
    }
);

const agent = createAgent({
    model: "gpt-4.1-mini",
    tools: [getWeather],
});

for await (const [streamMode, chunk] of await agent.stream(
    { messages: [{ role: "user", content: "what is the weather in sf" }] },
    { streamMode: ["updates", "messages", "custom"] }
)) {
    console.log(`${streamMode}: ${JSON.stringify(chunk, null, 2)}`);
}
```
:::

## Common patterns

以下是展示 Streaming 常见用例的示例。

### Streaming thinking / reasoning tokens

一些模型在生成最终答案之前会执行内部推理。你可以通过过滤 [标准 content blocks](/oss/langchain/messages#standard-content-blocks) 中的 `type` `"reasoning"` 来流式传输这些 thinking / reasoning tokens。

<Note>
    必须在模型上启用 Reasoning 输出。

    请参阅 [reasoning 部分](/oss/langchain/models#reasoning) 和你的 [provider 集成页面](/oss/integrations/providers/overview) 以获取配置详情。

    要快速检查模型的 reasoning 支持，请参阅 [models.dev](https://models.dev)。
</Note>

:::python

要从 agent 流式传输 thinking tokens，使用 `stream_mode="messages"` 并过滤 reasoning content blocks：

<StreamingReasoningTokensPy />

```shell title="Output"
[thinking] The user is asking about the weather in San Francisco. I have a tool
[thinking]  available to get this information. Let me call the get_weather tool
[thinking]  with "San Francisco" as the city parameter.
The weather in San Francisco is: It's always sunny in San Francisco!
```

:::

:::js
要从 agent 流式传输 thinking tokens，使用 `streamMode: "messages"` 并过滤 reasoning content blocks。当模型支持时，使用启用了 extended thinking 的模型实例（例如 `ChatAnthropic`）：

<StreamingReasoningTokensJs />

```shell title="Output"
[thinking] The user is asking about the weather in San Francisco. I have a tool
[thinking]  available to get this information. Let me call the get_weather tool
[thinking]  with "San Francisco" as the city parameter.
The weather in San Francisco is: It's always sunny in San Francisco!
```

:::

无论模型 provider 如何，这都以相同方式工作 — LangChain 通过 [`content_blocks`](/oss/langchain/messages#standard-content-blocks) 属性将 provider 特定格式（Anthropic `thinking` blocks、OpenAI `reasoning` summaries 等）标准化为标准的 `"reasoning"` content block 类型。

要直接从 chat model 流式传输 reasoning tokens（不使用 agent），请参阅 [streaming with chat models](/oss/langchain/models#reasoning)。

:::python
### Streaming tool calls

你可能希望同时流式传输：

1. 在生成 [tool calls](/oss/langchain/models#tool-calling) 时流式传输部分 JSON
2. 执行的已完成、解析的工具调用

指定 [`stream_mode="messages"`](#llm-tokens) 将流式传输 agent 中所有 LLM 调用生成的增量 [message chunks](/oss/langchain/messages#streaming-and-chunks)。要访问带有解析工具调用的已完成消息：

1. 如果这些消息在 [state](/oss/langchain/agents#memory) 中跟踪（如在 [`create_agent`](/oss/langchain/agents) 的 model node 中），使用 `stream_mode=["messages", "updates"]` 通过 [state updates](#agent-progress) 访问已完成消息（如下所示）。
2. 如果这些消息未在 state 中跟踪，使用 [custom updates](#custom-updates) 或在 Streaming 循环中聚合 chunks（[下一节](#accessing-completed-messages)）。

<Note>
如果你的 agent 包含多个 LLMs，请参阅下面关于 [streaming from sub-agents](#streaming-from-sub-agents) 的部分。
</Note>

```python
from typing import Any

from langchain.agents import create_agent
from langchain.messages import AIMessage, AIMessageChunk, AnyMessage, ToolMessage


def get_weather(city: str) -> str:
    """Get weather for a given city."""

    return f"It's always sunny in {city}!"


agent = create_agent("openai:gpt-5.2", tools=[get_weather])


def _render_message_chunk(token: AIMessageChunk) -> None:
    if token.text:
        print(token.text, end="|")
    if token.tool_call_chunks:
        print(token.tool_call_chunks)
    # N.B. all content is available through token.content_blocks


def _render_completed_message(message: AnyMessage) -> None:
    if isinstance(message, AIMessage) and message.tool_calls:
        print(f"Tool calls: {message.tool_calls}")
    if isinstance(message, ToolMessage):
        print(f"Tool response: {message.content_blocks}")


input_message = {"role": "user", "content": "What is the weather in Boston?"}
for stream_mode, data in agent.stream(
    {"messages": [input_message]},
    stream_mode=["messages", "updates"],  # [!code highlight]
):
    if stream_mode == "messages":
        token, metadata = data
        if isinstance(token, AIMessageChunk):
            _render_message_chunk(token)  # [!code highlight]
    if stream_mode == "updates":
        for source, update in data.items():
            if source in ("model", "tools"):  # `source` captures node name
                _render_completed_message(update["messages"][-1])  # [!code highlight]
```
```shell title="Output" expandable
[{'name': 'get_weather', 'args': '', 'id': 'call_D3Orjr89KgsLTZ9hTzYv7Hpf', 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '{"', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'city', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '":"', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'Boston', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '"}', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
Tool calls: [{'name': 'get_weather', 'args': {'city': 'Boston'}, 'id': 'call_D3Orjr89KgsLTZ9hTzYv7Hpf', 'type': 'tool_call'}]
Tool response: [{'type': 'text', 'text': "It's always sunny in Boston!"}]
The| weather| in| Boston| is| **|sun|ny|**|.|
```

#### Accessing completed messages

<Note>
如果已完成消息在 agent 的 [state](/oss/langchain/agents#memory) 中跟踪，你可以使用 `stream_mode=["messages", "updates"]`（如 [上面](#streaming-tool-calls) 所示）在 Streaming 期间访问已完成消息。
</Note>

在某些情况下，已完成消息未反映在 [state updates](#agent-progress) 中。如果你可以访问 agent 内部，你可以使用 [custom updates](#custom-updates) 在 Streaming 期间访问这些消息。否则，你可以在 Streaming 循环中聚合 message chunks（见下文）。

考虑下面的示例，我们将 [stream writer](#custom-updates) 集成到简化的 [guardrail middleware](/oss/langchain/guardrails#after-agent-guardrails) 中。此 middleware 演示了工具调用以生成结构化的"safe / unsafe"评估（也可以使用 [structured outputs](/oss/langchain/models#structured-output)）：
```python
from typing import Any, Literal

from langchain.agents.middleware import after_agent, AgentState
from langgraph.runtime import Runtime
from langchain.messages import AIMessage
from langchain.chat_models import init_chat_model
from langgraph.config import get_stream_writer  # [!code highlight]
from pydantic import BaseModel


class ResponseSafety(BaseModel):
    """Evaluate a response as safe or unsafe."""
    evaluation: Literal["safe", "unsafe"]


safety_model = init_chat_model("openai:gpt-5.2")

@after_agent(can_jump_to=["end"])
def safety_guardrail(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    """Model-based guardrail: Use an LLM to evaluate response safety."""
    stream_writer = get_stream_writer()  # [!code highlight]
    # Get the model response
    if not state["messages"]:
        return None

    last_message = state["messages"][-1]
    if not isinstance(last_message, AIMessage):
        return None

    # Use another model to evaluate safety
    model_with_tools = safety_model.bind_tools([ResponseSafety], tool_choice="any")
    result = model_with_tools.invoke(
        [
            {
                "role": "system",
                "content": "Evaluate this AI response as generally safe or unsafe."
            },
            {
                "role": "user",
                "content": f"AI response: {last_message.text}"
            }
        ]
    )
    stream_writer(result)  # [!code highlight]

    tool_call = result.tool_calls[0]
    if tool_call["args"]["evaluation"] == "unsafe":
        last_message.content = "I cannot provide that response. Please rephrase your request."

    return None
```
然后我们可以将此 middleware 集成到我们的 agent 中并包含其 custom stream 事件：
```python
from typing import Any

from langchain.agents import create_agent
from langchain.messages import AIMessageChunk, AIMessage, AnyMessage


def get_weather(city: str) -> str:
    """Get weather for a given city."""

    return f"It's always sunny in {city}!"


agent = create_agent(
    model="openai:gpt-5.2",
    tools=[get_weather],
    middleware=[safety_guardrail],  # [!code highlight]
)

def _render_message_chunk(token: AIMessageChunk) -> None:
    if token.text:
        print(token.text, end="|")
    if token.tool_call_chunks:
        print(token.tool_call_chunks)


def _render_completed_message(message: AnyMessage) -> None:
    if isinstance(message, AIMessage) and message.tool_calls:
        print(f"Tool calls: {message.tool_calls}")
    if isinstance(message, ToolMessage):
        print(f"Tool response: {message.content_blocks}")


input_message = {"role": "user", "content": "What is the weather in Boston?"}
for stream_mode, data in agent.stream(
    {"messages": [input_message]},
    stream_mode=["messages", "updates", "custom"],  # [!code highlight]
):
    if stream_mode == "messages":
        token, metadata = data
        if isinstance(token, AIMessageChunk):
            _render_message_chunk(token)
    if stream_mode == "updates":
        for source, update in data.items():
            if source in ("model", "tools"):
                _render_completed_message(update["messages"][-1])
    if stream_mode == "custom":  # [!code highlight]
        # access completed message in stream
        print(f"Tool calls: {data.tool_calls}")  # [!code highlight]
```
```shell title="Output" expandable
[{'name': 'get_weather', 'args': '', 'id': 'call_je6LWgxYzuZ84mmoDalTYMJC', 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '{"', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'city', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '":"', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'Boston', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '"}', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
Tool calls: [{'name': 'get_weather', 'args': {'city': 'Boston'}, 'id': 'call_je6LWgxYzuZ84mmoDalTYMJC', 'type': 'tool_call'}]
Tool response: [{'type': 'text', 'text': "It's always sunny in Boston!"}]
The| weather| in| **|Boston|**| is| **|sun|ny|**|.|[{'name': 'ResponseSafety', 'args': '', 'id': 'call_O8VJIbOG4Q9nQF0T8ltVi58O', 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '{"', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'evaluation', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '":"', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'safe', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '"}', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
Tool calls: [{'name': 'ResponseSafety', 'args': {'evaluation': 'safe'}, 'id': 'call_O8VJIbOG4Q9nQF0T8ltVi58O', 'type': 'tool_call'}]
```

或者，如果你无法向 stream 添加 custom 事件，你可以在 Streaming 循环中聚合 message chunks：
```python
input_message = {"role": "user", "content": "What is the weather in Boston?"}
full_message = None  # [!code highlight]
for stream_mode, data in agent.stream(
    {"messages": [input_message]},
    stream_mode=["messages", "updates"],
):
    if stream_mode == "messages":
        token, metadata = data
        if isinstance(token, AIMessageChunk):
            _render_message_chunk(token)
            full_message = token if full_message is None else full_message + token  # [!code highlight]
            if token.chunk_position == "last":  # [!code highlight]
                if full_message.tool_calls:  # [!code highlight]
                    print(f"Tool calls: {full_message.tool_calls}")  # [!code highlight]
                full_message = None  # [!code highlight]
    if stream_mode == "updates":
        for source, update in data.items():
            if source == "tools":
                _render_completed_message(update["messages"][-1])
```

### Streaming with human-in-the-loop

要处理 human-in-the-loop [interrupts](/oss/langchain/human-in-the-loop)，我们基于 [上面的示例](#streaming-tool-calls) 构建：

1. 我们使用 [human-in-the-loop middleware 和 checkpointer](/oss/langchain/human-in-the-loop#configuring-interrupts) 配置 agent
2. 我们收集在 `"updates"` stream mode 期间生成的 interrupts
3. 我们使用 [command](/oss/langchain/human-in-the-loop#responding-to-interrupts) 响应这些 interrupts

```python
from typing import Any

from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langchain.messages import AIMessage, AIMessageChunk, AnyMessage, ToolMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command, Interrupt


def get_weather(city: str) -> str:
    """Get weather for a given city."""

    return f"It's always sunny in {city}!"


checkpointer = InMemorySaver()

agent = create_agent(
    "openai:gpt-5.2",
    tools=[get_weather],
    middleware=[  # [!code highlight]
        HumanInTheLoopMiddleware(interrupt_on={"get_weather": True}),  # [!code highlight]
    ],  # [!code highlight]
    checkpointer=checkpointer,  # [!code highlight]
)


def _render_message_chunk(token: AIMessageChunk) -> None:
    if token.text:
        print(token.text, end="|")
    if token.tool_call_chunks:
        print(token.tool_call_chunks)


def _render_completed_message(message: AnyMessage) -> None:
    if isinstance(message, AIMessage) and message.tool_calls:
        print(f"Tool calls: {message.tool_calls}")
    if isinstance(message, ToolMessage):
        print(f"Tool response: {message.content_blocks}")


def _render_interrupt(interrupt: Interrupt) -> None:  # [!code highlight]
    interrupts = interrupt.value  # [!code highlight]
    for request in interrupts["action_requests"]:  # [!code highlight]
        print(request["description"])  # [!code highlight]


input_message = {
    "role": "user",
    "content": (
        "Can you look up the weather in Boston and San Francisco?"
    ),
}
config = {"configurable": {"thread_id": "some_id"}}  # [!code highlight]
interrupts = []  # [!code highlight]
for stream_mode, data in agent.stream(
    {"messages": [input_message]},
    config=config,  # [!code highlight]
    stream_mode=["messages", "updates"],
):
    if stream_mode == "messages":
        token, metadata = data
        if isinstance(token, AIMessageChunk):
            _render_message_chunk(token)
    if stream_mode == "updates":
        for source, update in data.items():
            if source in ("model", "tools"):
                _render_completed_message(update["messages"][-1])
            if source == "__interrupt__":  # [!code highlight]
                interrupts.extend(update)  # [!code highlight]
                _render_interrupt(update[0])  # [!code highlight]
```
```shell title="Output" expandable
[{'name': 'get_weather', 'args': '', 'id': 'call_GOwNaQHeqMixay2qy80padfE', 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '{"ci', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'ty": ', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '"Bosto', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'n"}', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': 'get_weather', 'args': '', 'id': 'call_Ndb4jvWm2uMA0JDQXu37wDH6', 'index': 1, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '{"ci', 'id': None, 'index': 1, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'ty": ', 'id': None, 'index': 1, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '"San F', 'id': None, 'index': 1, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'ranc', 'id': None, 'index': 1, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'isco"', 'id': None, 'index': 1, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '}', 'id': None, 'index': 1, 'type': 'tool_call_chunk'}]
Tool calls: [{'name': 'get_weather', 'args': {'city': 'Boston'}, 'id': 'call_GOwNaQHeqMixay2qy80padfE', 'type': 'tool_call'}, {'name': 'get_weather', 'args': {'city': 'San Francisco'}, 'id': 'call_Ndb4jvWm2uMA0JDQXu37wDH6', 'type': 'tool_call'}]
Tool execution requires approval

Tool: get_weather
Args: {'city': 'Boston'}
Tool execution requires approval

Tool: get_weather
Args: {'city': 'San Francisco'}
```

接下来我们为每个 interrupt 收集 [decision](/oss/langchain/human-in-the-loop#interrupt-decision-types)。重要的是，decisions 的顺序必须与我们收集的动作顺序匹配。

为了说明，我们将编辑一个工具调用并接受另一个：
```python
def _get_interrupt_decisions(interrupt: Interrupt) -> list[dict]:
    return [
        {
            "type": "edit",
            "edited_action": {
                "name": "get_weather",
                "args": {"city": "Boston, U.K."},
            },
        }
        if "boston" in request["description"].lower()
        else {"type": "approve"}
        for request in interrupt.value["action_requests"]
    ]

decisions = {}
for interrupt in interrupts:
    decisions[interrupt.id] = {
        "decisions": _get_interrupt_decisions(interrupt)
    }

decisions
```
```shell title="Output"
{
    'a96c40474e429d661b5b32a8d86f0f3e': {
        'decisions': [
            {
                'type': 'edit',
                 'edited_action': {
                     'name': 'get_weather',
                     'args': {'city': 'Boston, U.K.'}
                 }
            },
            {'type': 'approve'},
        ]
    }
}
```

然后我们可以通过将 [command](/oss/langchain/human-in-the-loop#responding-to-interrupts) 传递到相同的 Streaming 循环来恢复：
```python
interrupts = []
for stream_mode, data in agent.stream(
    Command(resume=decisions),  # [!code highlight]
    config=config,
    stream_mode=["messages", "updates"],
):
    # Streaming loop is unchanged
    if stream_mode == "messages":
        token, metadata = data
        if isinstance(token, AIMessageChunk):
            _render_message_chunk(token)
    if stream_mode == "updates":
        for source, update in data.items():
            if source in ("model", "tools"):
                _render_completed_message(update["messages"][-1])
            if source == "__interrupt__":
                interrupts.extend(update)
                _render_interrupt(update[0])
```
```shell title="Output"
Tool response: [{'type': 'text', 'text': "It's always sunny in Boston, U.K.!"}]
Tool response: [{'type': 'text', 'text': "It's always sunny in San Francisco!"}]
-| **|Boston|**|:| It|'s| always| sunny| in| Boston|,| U|.K|.|
|-| **|San| Francisco|**|:| It|'s| always| sunny| in| San| Francisco|!|
```

### Streaming from sub-agents

当 agent 中任何时候存在多个 LLMs 时，通常需要区分消息生成时的来源。

为此，在创建每个 agent 时传递一个 [`name`](https://reference.langchain.com/python/langchain/agents/#langchain.agents.create_agent(name))。然后在 `"messages"` mode Streaming 时，该名称可通过元数据中的 `lc_agent_name` 键获取。

下面，我们更新 [streaming tool calls](#streaming-tool-calls) 示例：

1. 我们将工具替换为内部调用 agent 的 `call_weather_agent` 工具
2. 我们为每个 agent 添加 `name`
3. 我们在创建 stream 时指定 [`subgraphs=True`](/oss/langgraph/use-subgraphs#stream-subgraph-outputs)
4. 我们的 stream 处理与之前相同，但我们添加逻辑来使用 `create_agent` 的 `name` 参数跟踪哪个 agent 处于活动状态

<Tip>
当你在 agent 上设置 `name` 时，该名称也会附加到该 agent 生成的任何 `AIMessage`s 上。
</Tip>



首先我们构建 agent：
```python
from typing import Any

from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain.messages import AIMessage, AnyMessage


def get_weather(city: str) -> str:
    """Get weather for a given city."""

    return f"It's always sunny in {city}!"


weather_model = init_chat_model("openai:gpt-5.2")
weather_agent = create_agent(
    model=weather_model,
    tools=[get_weather],
    name="weather_agent",  # [!code highlight]
)


def call_weather_agent(query: str) -> str:
    """Query the weather agent."""
    result = weather_agent.invoke({
        "messages": [{"role": "user", "content": query}]
    })
    return result["messages"][-1].text


supervisor_model = init_chat_model("openai:gpt-5.2")
agent = create_agent(
    model=supervisor_model,
    tools=[call_weather_agent],
    name="supervisor",  # [!code highlight]
)
```
接下来，我们在 Streaming 循环中添加逻辑来报告哪个 agent 正在发出 tokens：
```python
def _render_message_chunk(token: AIMessageChunk) -> None:
    if token.text:
        print(token.text, end="|")
    if token.tool_call_chunks:
        print(token.tool_call_chunks)


def _render_completed_message(message: AnyMessage) -> None:
    if isinstance(message, AIMessage) and message.tool_calls:
        print(f"Tool calls: {message.tool_calls}")
    if isinstance(message, ToolMessage):
        print(f"Tool response: {message.content_blocks}")


input_message = {"role": "user", "content": "What is the weather in Boston?"}
current_agent = None  # [!code highlight]
for _, stream_mode, data in agent.stream(
    {"messages": [input_message]},
    stream_mode=["messages", "updates"],
    subgraphs=True,  # [!code highlight]
):
    if stream_mode == "messages":
        token, metadata = data
        if agent_name := metadata.get("lc_agent_name"):  # [!code highlight]
            if agent_name != current_agent:  # [!code highlight]
                print(f"🤖 {agent_name}: ")  # [!code highlight]
                current_agent = agent_name  # [!code highlight]
        if isinstance(token, AIMessage):
            _render_message_chunk(token)
    if stream_mode == "updates":
        for source, update in data.items():
            if source in ("model", "tools"):
                _render_completed_message(update["messages"][-1])
```
```shell title="Output" expandable
🤖 supervisor:
[{'name': 'call_weather_agent', 'args': '', 'id': 'call_asorzUf0mB6sb7MiKfgojp7I', 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '{"', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'query', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '":"', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'Boston', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': ' weather', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': ' right', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': ' now', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': " today's", 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': ' forecast', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '"}', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
Tool calls: [{'name': 'call_weather_agent', 'args': {'query': "Boston weather right now and today's forecast"}, 'id': 'call_asorzUf0mB6sb7MiKfgojp7I', 'type': 'tool_call'}]
🤖 weather_agent:
[{'name': 'get_weather', 'args': '', 'id': 'call_LZ89lT8fW6w8vqck5pZeaDIx', 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '{"', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'city', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '":"', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': 'Boston', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
[{'name': None, 'args': '"}', 'id': None, 'index': 0, 'type': 'tool_call_chunk'}]
Tool calls: [{'name': 'get_weather', 'args': {'city': 'Boston'}, 'id': 'call_LZ89lT8fW6w8vqck5pZeaDIx', 'type': 'tool_call'}]
Tool response: [{'type': 'text', 'text': "It's always sunny in Boston!"}]
Boston| weather| right| now|:| **|Sunny|**|.

|Today|'s| forecast| for| Boston|:| **|Sunny| all| day|**|.|Tool response: [{'type': 'text', 'text': 'Boston weather right now: **Sunny**.\n\nToday's forecast for Boston: **Sunny all day**.'}]
🤖 supervisor:
Boston| weather| right| now|:| **|Sunny|**|.

|Today|'s| forecast| for| Boston|:| **|Sunny| all| day|**|.|
```
:::

## Disable streaming

在某些应用程序中，你可能需要禁用给定模型的单个 tokens 的 Streaming。这在以下情况下很有用：

- 与 [multi-agent](/oss/langchain/multi-agent) 系统一起工作以控制哪些 agent Stream 它们的输出
- 将支持 Streaming 的模型与不支持的模型混合
- 部署到 [LangSmith](/langsmith/home) 并希望防止某些模型输出被 Stream 到客户端

:::python
在初始化模型时设置 `streaming=False`。

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model="gpt-4.1",
    streaming=False  # [!code highlight]
)
```
:::

:::js
在初始化模型时设置 `streaming: false`。

```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-4.1",
  streaming: false,  // [!code highlight]
});
```
:::

<Tip>
部署到 LangSmith 时，在你不希望 Stream 到客户端的任何模型上设置 `streaming=False`。这是在部署之前在图代码中配置的。
</Tip>

:::python
<Note>
并非所有 chat model 集成都支持 `streaming` 参数。如果你的模型不支持它，改用 `disable_streaming=True`。此参数通过基类在所有 chat models 上可用。
</Note>
:::

:::js
<Note>
并非所有 chat model 集成都支持 `streaming` 参数。如果你的模型不支持它，改用 `disableStreaming: true`。此参数通过基类在所有 chat models 上可用。
</Note>
:::

有关更多详情，请参阅 [LangGraph streaming guide](/oss/langgraph/streaming#disable-streaming-for-specific-chat-models)。

## 相关

- [Frontend streaming](/oss/langchain/streaming/frontend) — 使用 `useStream` 构建 React UIs 以实现实时 agent 交互
- [Streaming with chat models](/oss/langchain/models#stream) — 直接从 chat model Stream tokens，不使用 agent 或 graph
- [Reasoning with chat models](/oss/langchain/models#reasoning) — 配置和访问 chat models 的 reasoning 输出
- [Standard content blocks](/oss/langchain/messages#standard-content-blocks) — 理解用于 reasoning、text 和其他内容类型的标准化 content block 格式
- [Streaming with human-in-the-loop](/oss/langchain/human-in-the-loop#streaming-with-hil) — 在 Streaming agent 进度时处理 interrupts 以进行人工审查
- [LangGraph streaming](/oss/langgraph/streaming) — 高级 Streaming 选项，包括 `values`、`debug` modes 和 subgraph Streaming
