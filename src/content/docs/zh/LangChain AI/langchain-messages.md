---
title: Messages（消息）
order: 6
section: "LangChain AI"
topic: "LangChain"
lang: "zh"
slug: "langchain-messages"
summary: "了解 LangChain 中的消息类型、内容格式、元数据以及如何在多模态对话中使用消息。"
icon: "comment"
featured: true
toc: true
updated: 2026-03-07
---

{/* TODO: 关于元数据类型（响应和使用情况）的部分 */}

消息是 LangChain 中模型的上下文基本单位。它们表示模型的输入和输出，携带表示与 LLM 交互时对话状态所需的内容和元数据。

消息是包含以下内容的对象：

* <Icon icon="user" size={16} /> [**角色**](#message-types) - 标识消息类型（例如 `system`、`user`）
* <Icon icon="folder" size={16} /> [**内容**](#message-content) - 表示消息的实际内容（如文本、图像、音频、文档等）
* <Icon icon="tag" size={16} /> [**元数据**](#message-metadata) - 可选字段，如响应信息、消息 ID 和 token 使用情况

LangChain 提供了一种适用于所有模型提供商的标准消息类型，确保无论调用哪个模型都能保持一致的行为。

## 基本用法

使用消息的最简单方法是创建消息对象，并在 [调用](/oss/langchain/models#invocation) 时将它们传递给模型。

:::python
```python
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, AIMessage, SystemMessage

model = init_chat_model("gpt-5-nano")

system_msg = SystemMessage("你是一个有用的助手。")
human_msg = HumanMessage("你好，最近怎么样？")

# 与 Chat Model 一起使用
messages = [system_msg, human_msg]
response = model.invoke(messages)  # 返回 AIMessage
```
:::

:::js
```typescript
import { initChatModel, HumanMessage, SystemMessage } from "langchain";

const model = await initChatModel("gpt-5-nano");

const systemMsg = new SystemMessage("你是一个有用的助手。");
const humanMsg = new HumanMessage("你好，最近怎么样？");

const messages = [systemMsg, humanMsg];
const response = await model.invoke(messages);  # 返回 AIMessage
```
:::

### 文本提示

文本提示是字符串——适用于不需要保留对话历史的简单生成任务。

:::python
```python
response = model.invoke("写一首关于春天的俳句")
```
:::

:::js
```typescript
const response = await model.invoke("写一首关于春天的俳句");
```
:::

**使用文本提示的场景：**
* 你有单个独立请求
* 你不需要对话历史
* 你希望代码复杂度最小

### 消息提示

或者，你可以通过提供消息对象列表将消息列表传递给模型。

:::python
```python
from langchain.messages import SystemMessage, HumanMessage, AIMessage

messages = [
    SystemMessage("你是诗歌专家"),
    HumanMessage("写一首关于春天的俳句"),
    AIMessage("樱花绽放...")
]
response = model.invoke(messages)
```
:::

:::js
```typescript
import { SystemMessage, HumanMessage, AIMessage } from "langchain";

const messages = [
  new SystemMessage("你是诗歌专家"),
  new HumanMessage("写一首关于春天的俳句"),
  new AIMessage("樱花绽放..."),
];
const response = await model.invoke(messages);
```
:::

**使用消息提示的场景：**
* 管理多轮对话
* 处理多模态内容（图像、音频、文件）
* 包含系统指令

### 字典格式

你也可以直接以 OpenAI Chat Completions 格式指定消息。

:::python
```python
messages = [
    {"role": "system", "content": "你是诗歌专家"},
    {"role": "user", "content": "写一首关于春天的俳句"},
    {"role": "assistant", "content": "樱花绽放..."}
]
response = model.invoke(messages)
```
:::

:::js
```typescript
const messages = [
  { role: "system", content: "你是诗歌专家" },
  { role: "user", content: "写一首关于春天的俳句" },
  { role: "assistant", content: "樱花绽放..." },
];
const response = await model.invoke(messages);
```
:::

## 消息类型

- <Icon icon="settings" size={16} /> [系统消息](#system-message) - 告诉模型如何行为并为交互提供上下文
- <Icon icon="user" size={16} /> [人类消息](#human-message) - 表示用户输入和与模型的交互
- <Icon icon="robot" size={16} /> [AI 消息](#ai-message) - 模型生成的响应，包括文本内容、工具调用和元数据
- <Icon icon="tool" size={16} /> [工具消息](#tool-message) - 表示 [工具调用](/oss/langchain/models#tool-calling) 的输出

### 系统消息

@[`SystemMessage`] 表示初始化指令集，用于引导模型的行为。你可以使用系统消息设置语气、定义模型的角色并建立响应指南。

:::python
```python 基本指令
system_msg = SystemMessage("你是一个有用的编程助手。")

messages = [
    system_msg,
    HumanMessage("如何创建 REST API？")
]
response = model.invoke(messages)
```
:::

:::js
```typescript 基本指令
import { SystemMessage, HumanMessage, AIMessage } from "langchain";

const systemMsg = new SystemMessage("你是一个有用的编程助手。");

const messages = [
  systemMsg,
  new HumanMessage("如何创建 REST API？"),
];
const response = await model.invoke(messages);
```
:::

:::python
```python 详细角色
from langchain.messages import SystemMessage, HumanMessage

system_msg = SystemMessage("""
你是一名精通 Web 框架的高级 Python 开发人员。
始终提供代码示例并解释你的推理。
解释要简洁但全面。
""")

messages = [
    system_msg,
    HumanMessage("如何创建 REST API？")
]
response = model.invoke(messages)
```
:::

:::js
```typescript 详细角色
import { SystemMessage, HumanMessage } from "langchain";

const systemMsg = new SystemMessage(`
你是一名精通 Web 框架的高级 TypeScript 开发人员。
始终提供代码示例并解释你的推理。
解释要简洁但全面。
`);

const messages = [
  systemMsg,
  new HumanMessage("如何创建 REST API？"),
];
const response = await model.invoke(messages);
```
:::

---

### 人类消息

@[`HumanMessage`] 表示用户输入和交互。它们可以包含文本、图像、音频、文件以及任何其他数量的多模态 [内容](#message-content)。

#### 文本内容

:::python
<CodeGroup>
    ```python 消息对象
    response = model.invoke([
      HumanMessage("什么是机器学习？")
    ])
    ```

    ```python 字符串快捷方式
    # 使用字符串是单个 HumanMessage 的快捷方式
    response = model.invoke("什么是机器学习？")
    ```
</CodeGroup>
:::

:::js
```typescript 消息对象
const response = await model.invoke([
  new HumanMessage("什么是机器学习？"),
]);
```

```typescript 字符串快捷方式
const response = await model.invoke("什么是机器学习？");
```
:::

#### 消息元数据

:::python
```python 添加元数据
human_msg = HumanMessage(
    content="你好！",
    name="alice",  # 可选：标识不同用户
    id="msg_123",  # 可选：用于跟踪的唯一标识符
)
```
:::

:::js
```typescript 添加元数据
const humanMsg = new HumanMessage({
  content: "你好！",
  name: "alice",
  id: "msg_123",
});
```
:::

<Note>
    `name` 字段的行为因提供商而异——一些将其用于用户标识，其他则忽略它。要检查，请参阅模型提供商的 [参考](https://reference.langchain.com/python/integrations/)。
</Note>

---

### AI 消息

@[`AIMessage`] 表示模型调用的输出。它们可以包括多模态数据、工具调用和提供商特定的元数据，你以后可以访问这些数据。

:::python
```python
response = model.invoke("解释 AI")
print(type(response))  # <class 'langchain.messages.AIMessage'>
```
:::

:::js
```typescript
const response = await model.invoke("解释 AI");
console.log(typeof response);  # AIMessage
```
:::

@[`AIMessage`] 对象在调用模型时由模型返回，其中包含响应中的所有关联元数据。

提供商对消息类型的权重/上下文不同，这意味着有时手动创建新的 @[`AIMessage`] 对象并将其插入消息历史中（就像它来自模型一样）是有帮助的。

:::python
```python
from langchain.messages import AIMessage, SystemMessage, HumanMessage

# 手动创建 AI 消息（例如，用于对话历史）
ai_msg = AIMessage("我很乐意帮助你回答这个问题！")

# 添加到对话历史
messages = [
    SystemMessage("你是一个有用的助手"),
    HumanMessage("你能帮我吗？"),
    ai_msg,  # 插入，就像它来自模型
    HumanMessage("太好了！2+2 等于多少？")
]

response = model.invoke(messages)
```
:::

:::js
```typescript
import { AIMessage, SystemMessage, HumanMessage } from "langchain";

const aiMsg = new AIMessage("我很乐意帮助你回答这个问题！");

const messages = [
  new SystemMessage("你是一个有用的助手"),
  new HumanMessage("你能帮我吗？"),
  aiMsg,  # 插入，就像它来自模型
  new HumanMessage("太好了！2+2 等于多少？")
]

const response = await model.invoke(messages);
```
:::

<Accordion title="属性">
    :::python
    <ParamField path="text" type="string">
        消息的文本内容。
    </ParamField>
    <ParamField path="content" type="string | dict[]">
        消息的原始内容。
    </ParamField>
    <ParamField path="content_blocks" type="ContentBlock[]">
        消息的标准 [内容块](#message-content)。
    </ParamField>
    <ParamField path="tool_calls" type="dict[] | None">
        模型进行的工具调用。

        如果没有调用工具，则为空。
    </ParamField>
    <ParamField path="id" type="string">
        消息的唯一标识符（由 LangChain 自动生成或在提供商响应中返回）
    </ParamField>
    <ParamField path="usage_metadata" type="dict | None">
        消息的使用元数据，可用时可能包含 token 计数。
    </ParamField>
    <ParamField path="response_metadata" type="ResponseMetadata | None">
        消息的响应元数据。
    </ParamField>
    :::

    :::js
    <ParamField path="text" type="string">
        消息的文本内容。
    </ParamField>
    <ParamField path="content" type="string | ContentBlock[]">
        消息的原始内容。
    </ParamField>
    <ParamField path="content_blocks" type="ContentBlock.Standard[]">
        消息的标准内容块。（请参阅 [内容](#message-content)）
    </ParamField>
    <ParamField path="tool_calls" type="ToolCall[] | None">
        模型进行的工具调用。

        如果没有调用工具，则为空。
    </ParamField>
    <ParamField path="id" type="string">
        消息的唯一标识符（由 LangChain 自动生成或在提供商响应中返回）
    </ParamField>
    <ParamField path="usage_metadata" type="UsageMetadata | None">
        消息的使用元数据，可用时可能包含 token 计数。请参阅 @[`UsageMetadata`]。
    </ParamField>
    <ParamField path="response_metadata" type="ResponseMetadata | None">
        消息的响应元数据。
    </ParamField>
    :::
</Accordion>

#### 工具调用

当模型进行 [工具调用](/oss/langchain/models#tool-calling) 时，它们包含在 @[`AIMessage`] 中：

:::python
```python
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-5-nano")

def get_weather(location: str) -> str:
    """获取某地的天气。"""
    ...

model_with_tools = model.bind_tools([get_weather])
response = model_with_tools.invoke("巴黎的天气怎么样？")

for tool_call in response.tool_calls:
    print(f"工具：{tool_call['name']}")
    print(f"参数：{tool_call['args']}")
    print(f"ID: {tool_call['id']}")
```
:::

:::js
```typescript
const modelWithTools = model.bindTools([getWeather]);
const response = await modelWithTools.invoke("巴黎的天气怎么样？");

for (const toolCall of response.tool_calls) {
  console.log(`工具：${toolCall.name}`);
  console.log(`参数：${toolCall.args}`);
  console.log(`ID: ${toolCall.id}`);
}
```
:::

其他结构化数据（如推理或引用）也可能出现在消息 [内容](/oss/langchain/messages#message-content) 中。

#### Token 使用情况

@[`AIMessage`] 可以在其 @[`usage_metadata`][UsageMetadata] 字段中保存 token 计数和其他使用元数据：

:::python
```python
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-5-nano")

response = model.invoke("你好！")
response.usage_metadata
```

```
{'input_tokens': 8,
 'output_tokens': 304,
 'total_tokens': 312,
 'input_token_details': {'audio': 0, 'cache_read': 0},
 'output_token_details': {'audio': 0, 'reasoning': 256}}
```
:::

:::js
```typescript
import { initChatModel } from "langchain";

const model = await initChatModel("gpt-5-nano");

const response = await model.invoke("你好！");
console.log(response.usage_metadata);
```

```json
{
  "output_tokens": 304,
  "input_tokens": 8,
  "total_tokens": 312,
  "input_token_details": {
    "cache_read": 0
  },
  "output_token_details": {
    "reasoning": 256
  }
}
```
:::

有关详情，请参阅 @[`UsageMetadata`]。

#### 流式传输和块

在流式传输期间，你将收到可以组合成完整消息对象的 @[`AIMessageChunk`] 对象：

:::python
```python
chunks = []
full_message = None
for chunk in model.stream("你好"):
    chunks.append(chunk)
    print(chunk.text)
    full_message = chunk if full_message is None else full_message + chunk
```
:::

:::js
<CodeGroup>
```typescript
import { AIMessageChunk } from "langchain";

let finalChunk: AIMessageChunk | undefined;
for (const chunk of chunks) {
  finalChunk = finalChunk ? finalChunk.concat(chunk) : chunk;
}
```
</CodeGroup>
:::

<Note>
了解更多：
- [从 Chat Model 流式传输 token](/oss/langchain/models#stream)
- [从 Agent 流式传输 token 和/或步骤](/oss/langchain/streaming)
</Note>

---

### 工具消息

对于支持 [工具调用](/oss/langchain/models#tool-calling) 的模型，AI 消息可以包含工具调用。工具消息用于将单个工具执行的结果传递回模型。

[工具](/oss/langchain/tools) 可以直接生成 @[`ToolMessage`] 对象。下面，我们展示一个简单的示例。在 [工具指南](/oss/langchain/tools) 中阅读更多内容。

:::python
```python
from langchain.messages import AIMessage
from langchain.messages import ToolMessage

# 在模型进行工具调用后
# （这里，为了简洁，我们演示手动创建消息）
ai_message = AIMessage(
    content=[],
    tool_calls=[{
        "name": "get_weather",
        "args": {"location": "San Francisco"},
        "id": "call_123"
    }]
)

# 执行工具并创建结果消息
weather_result = "晴朗，72°F"
tool_message = ToolMessage(
    content=weather_result,
    tool_call_id="call_123"  # 必须匹配调用 ID
)

# 继续对话
messages = [
    HumanMessage("旧金山的天气怎么样？"),
    ai_message,  # 模型的工具调用
    tool_message,  # 工具执行结果
]
response = model.invoke(messages)  # 模型处理结果
```
:::

:::js
```typescript
import { AIMessage, ToolMessage } from "langchain";

const aiMessage = new AIMessage({
  content: [],
  tool_calls: [{
    name: "get_weather",
    args: { location: "San Francisco" },
    id: "call_123"
  }]
});

const toolMessage = new ToolMessage({
  content: "晴朗，72°F",
  tool_call_id: "call_123"
});

const messages = [
  new HumanMessage("旧金山的天气怎么样？"),
  aiMessage,  # 模型的工具调用
  toolMessage,  # 工具执行结果
];

const response = await model.invoke(messages);  # 模型处理结果
```
:::

<Accordion title="属性">
    <ParamField path="content" type="string" required>
        工具调用的字符串化输出。
    </ParamField>
    <ParamField path="tool_call_id" type="string" required>
        此消息响应的工具调用的 ID。必须匹配 @[`AIMessage`] 中工具调用的 ID。
    </ParamField>
    <ParamField path="name" type="string" required>
        调用的工具的名称。
    </ParamField>
    <ParamField path="artifact" type="dict">
        不发送给模型但可以以编程方式访问的额外数据。
    </ParamField>
</Accordion>

<Note>
    `artifact` 字段存储不会发送给模型但可以以编程方式访问的补充数据。这对于存储原始结果、调试信息或用于下游处理的数据非常有用，而不会使模型的上下文变得混乱。

    <Accordion title="示例：使用 artifact 进行检索元数据">
        例如，[检索](/oss/langchain/retrieval) 工具可以从文档中检索一段供模型参考的内容。消息 `content` 包含模型将引用的文本，`artifact` 可以包含应用程序可以使用的文档标识符或其他元数据（例如，渲染页面）。请参阅下面的示例：

        :::python

        ```python
        from langchain.messages import ToolMessage

        # 发送给模型
        message_content = "这是最好的时代，这是最坏的时代。"

        # Artifact 可供下游使用
        artifact = {"document_id": "doc_123", "page": 0}

        tool_message = ToolMessage(
            content=message_content,
            tool_call_id="call_123",
            name="search_books",
            artifact=artifact,
        )
        ```
        :::

        :::js
        ```typescript
        import { ToolMessage } from "langchain";

        # Artifact 可供下游使用
        const artifact = { document_id: "doc_123", page: 0 };

        const toolMessage = new ToolMessage({
          content: "这是最好的时代，这是最坏的时代。",
          tool_call_id: "call_123",
          name: "search_books",
          artifact
        });
        ```
        :::

        请参阅 [RAG 教程](/oss/langchain/rag) 了解使用 LangChain 构建检索 [Agent](/oss/langchain/agents) 的端到端示例。
    </Accordion>
</Note>

---

## 消息内容

你可以将消息的内容视为发送给模型的数据负载。消息有一个 `content` 属性，它是松散类型的，支持字符串和未类型对象列表（例如，字典）。这允许在 LangChain Chat Model 中直接支持提供商原生结构，如 [多模态](#multimodal) 内容和其他数据。

另外，LangChain 为文本、推理、引用、多模态数据、服务器端工具调用和其他消息内容提供专用内容类型。请参阅下面的 [内容块](#standard-content-blocks)。

LangChain Chat Model 在 `content` 属性中接受消息内容。

这可能包含：

1. 字符串
2. 提供商原生格式的内容块列表
3. [LangChain 的标准内容块](#standard-content-blocks) 列表

请参阅下面使用 [多模态](#multimodal) 输入的示例：

:::python
```python
from langchain.messages import HumanMessage

# 字符串内容
human_message = HumanMessage("你好，最近怎么样？")

# 提供商原生格式（例如，OpenAI）
human_message = HumanMessage(content=[
    {"type": "text", "text": "你好，最近怎么样？"},
    {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
])

# 标准内容块列表
human_message = HumanMessage(content_blocks=[
    {"type": "text", "text": "你好，最近怎么样？"},
    {"type": "image", "url": "https://example.com/image.jpg"},
])
```

<Tip>
    在初始化消息时指定 `content_blocks` 仍会填充消息 `content`，但提供了类型安全的接口。
</Tip>
:::

:::js
```typescript
import { HumanMessage } from "langchain";

// 字符串内容
const humanMessage = new HumanMessage("你好，最近怎么样？");

// 提供商原生格式（例如，OpenAI）
const humanMessage = new HumanMessage({
  content: [
    { type: "text", text: "你好，最近怎么样？" },
    {
      type: "image_url",
      image_url: { url: "https://example.com/image.jpg" },
    },
  ],
});

// 标准内容块列表
const humanMessage = new HumanMessage({
  contentBlocks: [
    { type: "text", text: "你好，最近怎么样？" },
    { type: "image", url: "https://example.com/image.jpg" },
  ],
});
```
:::

### 标准内容块

LangChain 提供了一种适用于提供商的标准消息内容表示。

:::python
消息对象实现 `content_blocks` 属性，该属性将惰性地将 `content` 属性解析为标准、类型安全的表示。例如，从 [`ChatAnthropic`](/oss/integrations/chat/anthropic) 或 [`ChatOpenAI`](/oss/integrations/chat/openai) 生成的消息将分别包含 `thinking` 或 `reasoning` 块，但可以惰性解析为一致的 [`ReasoningContentBlock`](#content-block-reference) 表示：

<Tabs>
<Tab title="Anthropic">
```python
from langchain.messages import AIMessage

message = AIMessage(
    content=[
        {"type": "thinking", "thinking": "...", "signature": "WaUjzkyp..."},
        {"type": "text", "text": "..."},
    ],
    response_metadata={"model_provider": "anthropic"}
)
message.content_blocks
```
```
[{'type': 'reasoning',
  'reasoning': '...',
  'extras': {'signature': 'WaUjzkyp...'}},
 {'type': 'text', 'text': '...'}]
```
</Tab>

<Tab title="OpenAI">
```python
from langchain.messages import AIMessage

message = AIMessage(
    content=[
        {
            "type": "reasoning",
            "id": "rs_abc123",
            "summary": [
                {"type": "summary_text", "text": "summary 1"},
                {"type": "summary_text", "text": "summary 2"},
            ],
        },
        {"type": "text", "text": "...", "id": "msg_abc123"},
    ],
    response_metadata={"model_provider": "openai"}
)
message.content_blocks
```
```
[{'type': 'reasoning', 'id': 'rs_abc123', 'reasoning': 'summary 1'},
 {'type': 'reasoning', 'id': 'rs_abc123', 'reasoning': 'summary 2'},
 {'type': 'text', 'text': '...', 'id': 'msg_abc123'}]
```
</Tab>
</Tabs>
:::

:::js
消息对象实现 `contentBlocks` 属性，该属性将惰性地将 `content` 属性解析为标准、类型安全的表示。例如，从 [`ChatAnthropic`](/oss/integrations/chat/anthropic) 或 [`ChatOpenAI`](/oss/integrations/chat/openai) 生成的消息将分别包含 `thinking` 或 `reasoning` 块，但可以惰性解析为一致的 [`ReasoningContentBlock`](#content-block-reference) 表示：

<Tabs>
<Tab title="Anthropic">
```typescript
import { AIMessage } from "@langchain/core/messages";

const message = new AIMessage({
  content: [
    {
      "type": "thinking",
      "thinking": "...",
      "signature": "WaUjzkyp...",
    },
    {
      "type":"text",
      "text": "...",
      "id": "msg_abc123",
    },
  ],
  response_metadata: { model_provider: "anthropic" },
});

console.log(message.contentBlocks);
```
</Tab>

<Tab title="OpenAI">
```typescript
import { AIMessage } from "@langchain/core/messages";

const message = new AIMessage({
  content: [
    {
      "type": "reasoning",
      "id": "rs_abc123",
      "summary": [
        {"type": "summary_text", "text": "summary 1"},
        {"type": "summary_text", "text": "summary 2"},
      ],
    },
    {"type": "text", "text": "..."},
  ],
  response_metadata: { model_provider: "openai" },
});

console.log(message.contentBlocks);
```
</Tab>
</Tabs>
:::

请参阅 [集成指南](/oss/integrations/providers/overview) 开始使用你选择的推理提供商。

<Note>
    **序列化标准内容**

    如果 LangChain 外部的应用程序需要访问标准内容块表示，你可以选择将内容块存储在消息内容中。

    :::python
    为此，你可以将 `LC_OUTPUT_VERSION` 环境变量设置为 `v1`。或者，
    使用 `output_version="v1"` 初始化任何 Chat Model：

    ```python
    from langchain.chat_models import init_chat_model

    model = init_chat_model("gpt-5-nano", output_version="v1")
    ```
    :::

    :::js
    为此，你可以将 `LC_OUTPUT_VERSION` 环境变量设置为 `v1`。或者，
    使用 `outputVersion: "v1"` 初始化任何 Chat Model：

    ```typescript
    import { initChatModel } from "langchain";

    const model = await initChatModel(
      "gpt-5-nano",
      { outputVersion: "v1" }
    );
    ```
    :::
</Note>

### 多模态（Multimodal）

**多模态** 是指能够处理不同形式的数据，如文本、音频、图像和视频。LangChain 包括这些数据的标准类型，可以在提供商之间使用。

[Chat Model](/oss/langchain/models) 可以接受多模态数据作为输入并将其生成为输出。下面我们展示包含多模态数据的输入消息的简短示例。

<Note>
    可以在内容块的顶层包含额外的键，或嵌套在 `"extras": {"key": value}` 中。

    例如，[OpenAI](/oss/integrations/chat/openai#pdfs) 和 [AWS Bedrock Converse](/oss/integrations/chat/bedrock) 需要 PDF 的文件名。有关具体信息，请参阅你所选模型的 [提供商页面](/oss/integrations/providers/overview)。
</Note>

:::python
<CodeGroup>
    ```python 图像输入
    # 从 URL
    message = {
        "role": "user",
        "content": [
            {"type": "text", "text": "描述此图像的内容。"},
            {"type": "image", "url": "https://example.com/path/to/image.jpg"},
        ]
    }

    # 从 base64 数据
    message = {
        "role": "user",
        "content": [
            {"type": "text", "text": "描述此图像的内容。"},
            {
                "type": "image",
                "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
                "mime_type": "image/jpeg",
            },
        ]
    }

    # 从提供商管理的 File ID
    message = {
        "role": "user",
        "content": [
            {"type": "text", "text": "描述此图像的内容。"},
            {"type": "image", "file_id": "file-abc123"},
        ]
    }
    ```

    ```python PDF 文档输入
    # 从 URL
    message = {
        "role": "user",
        "content": [
            {"type": "text", "text": "描述此文档的内容。"},
            {"type": "file", "url": "https://example.com/path/to/document.pdf"},
        ]
    }

    # 从 base64 数据
    message = {
        "role": "user",
        "content": [
            {"type": "text", "text": "描述此文档的内容。"},
            {
                "type": "file",
                "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
                "mime_type": "application/pdf",
            },
        ]
    }

    # 从提供商管理的 File ID
    message = {
        "role": "user",
        "content": [
            {"type": "text", "text": "描述此文档的内容。"},
            {"type": "file", "file_id": "file-abc123"},
        ]
    }
    ```

    ```python 音频输入
    # 从 base64 数据
    message = {
        "role": "user",
        "content": [
            {"type": "text", "text": "描述此音频的内容。"},
            {
                "type": "audio",
                "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
                "mime_type": "audio/wav",
            },
        ]
    }

    # 从提供商管理的 File ID
    message = {
        "role": "user",
        "content": [
            {"type": "text", "text": "描述此音频的内容。"},
            {"type": "audio", "file_id": "file-abc123"},
        ]
    }
    ```

    ```python 视频输入
    # 从 base64 数据
    message = {
        "role": "user",
        "content": [
            {"type": "text", "text": "描述此视频的内容。"},
            {
                "type": "video",
                "base64": "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
                "mime_type": "video/mp4",
            },
        ]
    }

    # 从提供商管理的 File ID
    message = {
        "role": "user",
        "content": [
            {"type": "text", "text": "描述此视频的内容。"},
            {"type": "video", "file_id": "file-abc123"},
        ]
    }
    ```
</CodeGroup>
:::

:::js
<CodeGroup>
    ```typescript 图像输入
    // 从 URL
    const message = new HumanMessage({
      content: [
        { type: "text", text: "描述此图像的内容。" },
        {
          type: "image",
          source_type: "url",
          url: "https://example.com/path/to/image.jpg"
        },
      ],
    });

    // 从 base64 数据
    const message = new HumanMessage({
      content: [
        { type: "text", text: "描述此图像的内容。" },
        {
          type: "image",
          source_type: "base64",
          data: "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
        },
      ],
    });

    // 从提供商管理的 File ID
    const message = new HumanMessage({
      content: [
        { type: "text", text: "描述此图像的内容。" },
        { type: "image", source_type: "id", id: "file-abc123" },
      ],
    });
    ```

    ```typescript PDF 文档输入
    // 从 URL
    const message = new HumanMessage({
      content: [
        { type: "text", text: "描述此文档的内容。" },
        { type: "file", source_type: "url", url: "https://example.com/path/to/document.pdf", mime_type: "application/pdf" },
      ],
    });

    // 从 base64 数据
    const message = new HumanMessage({
      content: [
        { type: "text", text: "描述此文档的内容。" },
        {
          type: "file",
          source_type: "base64",
          data: "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
          mime_type: "application/pdf",
        },
      ],
    });

    // 从提供商管理的 File ID
    const message = new HumanMessage({
      content: [
        { type: "text", text: "描述此文档的内容。" },
        { type: "file", source_type: "id", id: "file-abc123" },
      ],
    });
    ```

    ```typescript 音频输入
    // 从 base64 数据
    const message = new HumanMessage({
      content: [
        { type: "text", text: "描述此音频的内容。" },
        {
          type: "audio",
          source_type: "base64",
          data: "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
        },
      ],
    });

    // 从提供商管理的 File ID
    const message = new HumanMessage({
      content: [
        { type: "text", text: "描述此音频的内容。" },
        { type: "audio", source_type: "id", id: "file-abc123" },
      ],
    });
    ```

    ```typescript 视频输入
    // 从 base64 数据
    const message = new HumanMessage({
      content: [
        { type: "text", text: "描述此视频的内容。" },
        {
          type: "video",
          source_type: "base64",
          data: "AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAGlzb2...",
        },
      ],
    });

    // 从提供商管理的 File ID
    const message = new HumanMessage({
      content: [
        { type: "text", text: "描述此视频的内容。" },
        { type: "video", source_type: "id", id: "file-abc123" },
      ],
    });
    ```
</CodeGroup>
:::

<Warning>
    并非所有模型都支持所有文件类型。请查看模型提供商的 [参考](https://reference.langchain.com/python/integrations/) 了解支持的格式和大小限制。
</Warning>

### 内容块参考

:::python
内容块表示为（在创建消息或访问 `content_blocks` 属性时）类型化字典列表。列表中的每个项必须符合以下内容块类型之一：

<AccordionGroup>
    <Accordion title="核心" icon="cube">
        <AccordionGroup>
            <Accordion title="TextContentBlock" icon="typography">
                **用途：** 标准文本输出

                <ParamField body="type" type="string" required>
                    始终为 `"text"`
                </ParamField>

                <ParamField body="text" type="string" required>
                    文本内容
                </ParamField>

                <ParamField body="annotations" type="object[]">
                    文本的注释列表
                </ParamField>

                <ParamField body="extras" type="object">
                    额外的提供商特定数据
                </ParamField>

                **示例：**
                ```python
                {
                    "type": "text",
                    "text": "Hello world",
                    "annotations": []
                }
                ```
            </Accordion>
            <Accordion title="ReasoningContentBlock" icon="brain">
                **用途：** 模型推理步骤

                <ParamField body="type" type="string" required>
                    始终为 `"reasoning"`
                </ParamField>

                <ParamField body="reasoning" type="string">
                    推理内容
                </ParamField>

                <ParamField body="extras" type="object">
                    额外的提供商特定数据
                </ParamField>

                **示例：**
                ```python
                {
                    "type": "reasoning",
                    "reasoning": "用户正在询问关于...",
                    "extras": {"signature": "abc123"},
                }
                ```
            </Accordion>
        </AccordionGroup>
    </Accordion>

    <Accordion title="多模态" icon="photo">
        <AccordionGroup>
            <Accordion title="ImageContentBlock" icon="photo">
                **用途：** 图像数据

                <ParamField body="type" type="string" required>
                    始终为 `"image"`
                </ParamField>

                <ParamField body="url" type="string">
                    指向图像位置的 URL。
                </ParamField>

                <ParamField body="base64" type="string">
                    Base64 编码的图像数据。
                </ParamField>

                <ParamField body="id" type="string">
                    此内容块的唯一标识符（由提供商或 LangChain 生成）。
                </ParamField>

                <ParamField body="mime_type" type="string">
                    图像 [MIME 类型](https://www.iana.org/assignments/media-types/media-types.xhtml#image)（例如 `image/jpeg`、`image/png`）。base64 数据必需。
                </ParamField>
            </Accordion>
            <Accordion title="AudioContentBlock" icon="volume">
                **用途：** 音频数据

                <ParamField body="type" type="string" required>
                    始终为 `"audio"`
                </ParamField>

                <ParamField body="url" type="string">
                    指向音频位置的 URL。
                </ParamField>

                <ParamField body="base64" type="string">
                    Base64 编码的音频数据。
                </ParamField>

                <ParamField body="id" type="string">
                    此内容块的唯一标识符（由提供商或 LangChain 生成）。
                </ParamField>

                <ParamField body="mime_type" type="string">
                    音频 [MIME 类型](https://www.iana.org/assignments/media-types/media-types.xhtml#audio)（例如 `audio/mpeg`、`audio/wav`）。base64 数据必需。
                </ParamField>
            </Accordion>
            <Accordion title="VideoContentBlock" icon="video">
                **用途：** 视频数据

                <ParamField body="type" type="string" required>
                    始终为 `"video"`
                </ParamField>

                <ParamField body="url" type="string">
                    指向视频位置的 URL。
                </ParamField>

                <ParamField body="base64" type="string">
                    Base64 编码的视频数据。
                </ParamField>

                <ParamField body="id" type="string">
                    此内容块的唯一标识符（由提供商或 LangChain 生成）。
                </ParamField>

                <ParamField body="mime_type" type="string">
                    视频 [MIME 类型](https://www.iana.org/assignments/media-types/media-types.xhtml#video)（例如 `video/mp4`、`video/webm`）。base64 数据必需。
                </ParamField>
            </Accordion>
            <Accordion title="FileContentBlock" icon="file">
                **用途：** 通用文件（PDF 等）

                <ParamField body="type" type="string" required>
                    始终为 `"file"`
                </ParamField>

                <ParamField body="url" type="string">
                    指向文件位置的 URL。
                </ParamField>

                <ParamField body="base64" type="string">
                    Base64 编码的文件数据。
                </ParamField>

                <ParamField body="id" type="string">
                    此内容块的唯一标识符（由提供商或 LangChain 生成）。
                </ParamField>

                <ParamField body="mime_type" type="string">
                    文件 [MIME 类型](https://www.iana.org/assignments/media-types/media-types.xhtml)（例如 `application/pdf`）。base64 数据必需。
                </ParamField>
            </Accordion>
            <Accordion title="PlainTextContentBlock" icon="align-left">
                **用途：** 文档文本（`.txt`、`.md`）

                <ParamField body="type" type="string" required>
                    始终为 `"text-plain"`
                </ParamField>

                <ParamField body="text" type="string">
                    文本内容
                </ParamField>

                <ParamField body="mime_type" type="string">
                    文本的 [MIME 类型](https://www.iana.org/assignments/media-types/media-types.xhtml)（例如 `text/plain`、`text/markdown`）
                </ParamField>
            </Accordion>
        </AccordionGroup>
    </Accordion>

    <Accordion title="工具调用" icon="tool">
        <AccordionGroup>
            <Accordion title="ToolCall" icon="function">
                **用途：** 函数调用

                <ParamField body="type" type="string" required>
                    始终为 `"tool_call"`
                </ParamField>

                <ParamField body="name" type="string" required>
                    要调用的工具的名称
                </ParamField>

                <ParamField body="args" type="object" required>
                    要传递给工具的参数
                </ParamField>

                <ParamField body="id" type="string" required>
                    此工具调用的唯一标识符
                </ParamField>

                **示例：**
                ```python
                {
                    "type": "tool_call",
                    "name": "search",
                    "args": {"query": "weather"},
                    "id": "call_123"
                }
                ```
            </Accordion>
            <Accordion title="ToolCallChunk" icon="puzzle">
                **用途：** 流式工具调用片段

                <ParamField body="type" type="string" required>
                    始终为 `"tool_call_chunk"`
                </ParamField>

                <ParamField body="name" type="string">
                    正在调用的工具的名称
                </ParamField>

                <ParamField body="args" type="string">
                    部分工具参数（可能是不完整的 JSON）
                </ParamField>

                <ParamField body="id" type="string">
                    工具调用标识符
                </ParamField>

                <ParamField body="index" type="number | string">
                    此块在流中的位置
                </ParamField>
            </Accordion>
            <Accordion title="InvalidToolCall" icon="alert-triangle">
                **用途：** 格式错误的调用，旨在捕获 JSON 解析错误。

                <ParamField body="type" type="string" required>
                    始终为 `"invalid_tool_call"`
                </ParamField>

                <ParamField body="name" type="string">
                    调用失败的工具的名称
                </ParamField>

                <ParamField body="args" type="object">
                    要传递给工具的参数
                </ParamField>

                <ParamField body="error" type="string">
                    出错原因的描述
                </ParamField>
            </Accordion>
        </AccordionGroup>
    </Accordion>

    <Accordion title="服务器端工具执行" icon="server">
        <AccordionGroup>
            <Accordion title="ServerToolCall" icon="tool">
                **用途：** 服务器端执行的工具调用。

                <ParamField body="type" type="string" required>
                    始终为 `"server_tool_call"`
                </ParamField>

                <ParamField body="id" type="string" required>
                    与工具调用关联的标识符。
                </ParamField>

                <ParamField body="name" type="string" required>
                    要调用的工具的名称。
                </ParamField>

                <ParamField body="args" type="string" required>
                    部分工具参数（可能是不完整的 JSON）
                </ParamField>
            </Accordion>
            <Accordion title="ServerToolCallChunk" icon="puzzle">
                **用途：** 流式服务器端工具调用片段

                <ParamField body="type" type="string" required>
                    始终为 `"server_tool_call_chunk"`
                </ParamField>

                <ParamField body="id" type="string">
                    与工具调用关联的标识符。
                </ParamField>

                <ParamField body="name" type="string">
                    正在调用的工具的名称
                </ParamField>

                <ParamField body="args" type="string">
                    部分工具参数（可能是不完整的 JSON）
                </ParamField>

                <ParamField body="index" type="number | string">
                    此块在流中的位置
                </ParamField>
            </Accordion>
            <Accordion title="ServerToolResult" icon="package">
                **用途：** 搜索结果

                <ParamField body="type" type="string" required>
                    始终为 `"server_tool_result"`
                </ParamField>

                <ParamField body="tool_call_id" type="string" required>
                    相应服务器工具调用的标识符。
                </ParamField>

                <ParamField body="id" type="string">
                    与服务器工具结果关联的标识符。
                </ParamField>

                <ParamField body="status" type="string" required>
                    服务器端工具的执行状态。`"success"` 或 `"error"`。
                </ParamField>

                <ParamField body="output">
                    执行工具的输出。
                </ParamField>
            </Accordion>
        </AccordionGroup>
    </Accordion>

    <Accordion title="提供商特定块" icon="plug">
        <Accordion title="NonStandardContentBlock" icon="asterisk">
            **用途：** 提供商特定的逃生舱

            <ParamField body="type" type="string" required>
                始终为 `"non_standard"`
            </ParamField>

            <ParamField body="value" type="object" required>
                提供商特定的数据结构
            </ParamField>

            **用途：** 用于实验性或提供商独有的功能
        </Accordion>

        其他提供商特定的内容类型可以在每个模型提供商的 [参考文档](/oss/integrations/providers/overview) 中找到。
    </Accordion>
</AccordionGroup>
:::

:::js
内容块表示为（在创建消息或访问 `contentBlocks` 字段时）类型化对象列表。列表中的每个项必须符合以下内容块类型之一：

<AccordionGroup>
    <Accordion title="核心" icon="cube">
        <AccordionGroup>
            <Accordion title="ContentBlock.Text" icon="typography">
                **用途：** 标准文本输出

                <ParamField body="type" type="string" required>
                    始终为 `"text"`
                </ParamField>

                <ParamField body="text" type="string" required>
                    文本内容
                </ParamField>

                <ParamField body="annotations" type="Citation[]">
                    文本的注释列表
                </ParamField>

                **示例：**
                ```typescript
                {
                    type: "text",
                    text: "Hello world",
                    annotations: []
                }
                ```
            </Accordion>
            <Accordion title="ContentBlock.Reasoning" icon="brain">
                **用途：** 模型推理步骤

                <ParamField body="type" type="string" required>
                    始终为 `"reasoning"`
                </ParamField>

                <ParamField body="reasoning" type="string" required>
                    推理内容
                </ParamField>

                **示例：**
                ```typescript
                {
                    type: "reasoning",
                    reasoning: "用户正在询问关于..."
                }
                ```
            </Accordion>
        </AccordionGroup>
    </Accordion>

    <Accordion title="多模态" icon="photo">
        <AccordionGroup>
            <Accordion title="ContentBlock.Multimodal.Image" icon="photo">
                **用途：** 图像数据

                <ParamField body="type" type="string" required>
                    始终为 `"image"`
                </ParamField>

                <ParamField body="url" type="string">
                    指向图像位置的 URL。
                </ParamField>

                <ParamField body="data" type="string">
                    Base64 编码的图像数据。
                </ParamField>

                <ParamField body="fileId" type="string">
                    对外部文件存储系统中图像的引用（例如，OpenAI 或 Anthropic 的 Files API）。
                </ParamField>

                <ParamField body="mimeType" type="string">
                    图像 [MIME 类型](https://www.iana.org/assignments/media-types/media-types.xhtml#image)（例如 `image/jpeg`、`image/png`）。base64 数据必需。
                </ParamField>
            </Accordion>
            <Accordion title="ContentBlock.Multimodal.Audio" icon="volume">
                **用途：** 音频数据

                <ParamField body="type" type="string" required>
                    始终为 `"audio"`
                </ParamField>

                <ParamField body="url" type="string">
                    指向音频位置的 URL。
                </ParamField>

                <ParamField body="data" type="string">
                    Base64 编码的音频数据。
                </ParamField>

                <ParamField body="fileId" type="string">
                    对外部文件存储系统中音频文件的引用（例如，OpenAI 或 Anthropic 的 Files API）。
                </ParamField>

                <ParamField body="mimeType" type="string">
                    音频 [MIME 类型](https://www.iana.org/assignments/media-types/media-types.xhtml#audio)（例如 `audio/mpeg`、`audio/wav`）。base64 数据必需。
                </ParamField>
            </Accordion>
            <Accordion title="ContentBlock.Multimodal.Video" icon="video">
                **用途：** 视频数据

                <ParamField body="type" type="string" required>
                    始终为 `"video"`
                </ParamField>

                <ParamField body="url" type="string">
                    指向视频位置的 URL。
                </ParamField>

                <ParamField body="data" type="string">
                    Base64 编码的视频数据。
                </ParamField>

                <ParamField body="fileId" type="string">
                    对外部文件存储系统中视频文件的引用（例如，OpenAI 或 Anthropic 的 Files API）。
                </ParamField>

                <ParamField body="mimeType" type="string">
                    视频 [MIME 类型](https://www.iana.org/assignments/media-types/media-types.xhtml#video)（例如 `video/mp4`、`video/webm`）。base64 数据必需。
                </ParamField>
            </Accordion>
            <Accordion title="ContentBlock.Multimodal.File" icon="file">
                **用途：** 通用文件（PDF 等）

                <ParamField body="type" type="string" required>
                    始终为 `"file"`
                </ParamField>

                <ParamField body="url" type="string">
                    指向文件位置的 URL。
                </ParamField>

                <ParamField body="data" type="string">
                    Base64 编码的文件数据。
                </ParamField>

                <ParamField body="fileId" type="string">
                    对外部文件存储系统中文件的引用（例如，OpenAI 或 Anthropic 的 Files API）。
                </ParamField>

                <ParamField body="mimeType" type="string">
                    文件 [MIME 类型](https://www.iana.org/assignments/media-types/media-types.xhtml)（例如 `application/pdf`）。base64 数据必需。
                </ParamField>
            </Accordion>
            <Accordion title="ContentBlock.Multimodal.PlainText" icon="align-left">
                **用途：** 文档文本（`.txt`、`.md`）

                <ParamField body="type" type="string" required>
                    始终为 `"text-plain"`
                </ParamField>

                <ParamField body="text" type="string" required>
                    文本内容
                </ParamField>

                <ParamField body="title" type="string">
                    文本内容的标题
                </ParamField>

                <ParamField body="mimeType" type="string">
                    文本的 [MIME 类型](https://www.iana.org/assignments/media-types/media-types.xhtml)（例如 `text/plain`、`text/markdown`）
                </ParamField>
            </Accordion>
        </AccordionGroup>
    </Accordion>

    <Accordion title="工具调用" icon="tool">
        <AccordionGroup>
            <Accordion title="ContentBlock.Tools.ToolCall" icon="function">
                **用途：** 函数调用

                <ParamField body="type" type="string" required>
                    始终为 `"tool_call"`
                </ParamField>

                <ParamField body="name" type="string" required>
                    要调用的工具的名称
                </ParamField>

                <ParamField body="args" type="object" required>
                    要传递给工具的参数
                </ParamField>

                <ParamField body="id" type="string" required>
                    此工具调用的唯一标识符
                </ParamField>

                **示例：**
                ```typescript
                {
                    type: "tool_call",
                    name: "search",
                    args: { query: "weather" },
                    id: "call_123"
                }
                ```
            </Accordion>
            <Accordion title="ContentBlock.Tools.ToolCallChunk" icon="puzzle">
                **用途：** 流式工具片段

                <ParamField body="type" type="string" required>
                    始终为 `"tool_call_chunk"`
                </ParamField>

                <ParamField body="name" type="string">
                    正在调用的工具的名称
                </ParamField>

                <ParamField body="args" type="string">
                    部分工具参数（可能是不完整的 JSON）
                </ParamField>

                <ParamField body="id" type="string">
                    工具调用标识符
                </ParamField>

                <ParamField body="index" type="number | string" required>
                    此块在流中的位置
                </ParamField>
            </Accordion>
            <Accordion title="ContentBlock.Tools.InvalidToolCall" icon="alert-triangle">
                **用途：** 格式错误的调用

                <ParamField body="type" type="string" required>
                    始终为 `"invalid_tool_call"`
                </ParamField>

                <ParamField body="name" type="string">
                    调用失败的工具的名称
                </ParamField>

                <ParamField body="args" type="string">
                    解析失败的原始参数
                </ParamField>

                <ParamField body="error" type="string" required>
                    出错原因的描述
                </ParamField>

                **常见错误：** 无效的 JSON、缺少必需字段
            </Accordion>
        </AccordionGroup>
    </Accordion>

    <Accordion title="服务器端工具执行" icon="server">
        <AccordionGroup>
            <Accordion title="ContentBlock.Tools.ServerToolCall" icon="tool">
                **用途：** 服务器端执行的工具调用。

                <ParamField body="type" type="string" required>
                    始终为 `"server_tool_call"`
                </ParamField>

                <ParamField body="id" type="string" required>
                    与工具调用关联的标识符。
                </ParamField>

                <ParamField body="name" type="string" required>
                    要调用的工具的名称。
                </ParamField>

                <ParamField body="args" type="string" required>
                    部分工具参数（可能是不完整的 JSON）
                </ParamField>
            </Accordion>
            <Accordion title="ContentBlock.Tools.ServerToolCallChunk" icon="puzzle">
                **用途：** 流式服务器端工具调用片段

                <ParamField body="type" type="string" required>
                    始终为 `"server_tool_call_chunk"`
                </ParamField>

                <ParamField body="id" type="string">
                    与工具调用关联的标识符。
                </ParamField>

                <ParamField body="name" type="string">
                    正在调用的工具的名称
                </ParamField>

                <ParamField body="args" type="string">
                    部分工具参数（可能是不完整的 JSON）
                </ParamField>

                <ParamField body="index" type="number | string">
                    此块在流中的位置
                </ParamField>
            </Accordion>
            <Accordion title="ContentBlock.Tools.ServerToolResult" icon="package">
                **用途：** 搜索结果

                <ParamField body="type" type="string" required>
                    始终为 `"server_tool_result"`
                </ParamField>

                <ParamField body="tool_call_id" type="string" required>
                    相应服务器工具调用的标识符。
                </ParamField>

                <ParamField body="id" type="string">
                    与服务器工具结果关联的标识符。
                </ParamField>

                <ParamField body="status" type="string" required>
                    服务器端工具的执行状态。`"success"` 或 `"error"`。
                </ParamField>

                <ParamField body="output">
                    执行工具的输出。
                </ParamField>
            </Accordion>
        </AccordionGroup>
    </Accordion>
    <Accordion title="提供商特定块" icon="plug">
        <Accordion title="ContentBlock.NonStandard" icon="asterisk">
            **用途：** 提供商特定的逃生舱

            <ParamField body="type" type="string" required>
                始终为 `"non_standard"`
            </ParamField>

            <ParamField body="value" type="object" required>
                提供商特定的数据结构
            </ParamField>

            **用途：** 用于实验性或提供商独有的功能
        </Accordion>

        其他提供商特定的内容类型可以在每个模型提供商的 [参考文档](/oss/integrations/providers/overview) 中找到。
    </Accordion>
</AccordionGroup>

上面提到的每个内容块在导入 @[`ContentBlock`] 类型时都可以作为类型单独寻址。

```typescript
import { ContentBlock } from "langchain";

// 文本块
const textBlock: ContentBlock.Text = {
    type: "text",
    text: "Hello world",
}

// 图像块
const imageBlock: ContentBlock.Multimodal.Image = {
    type: "image",
    url: "https://example.com/image.png",
    mimeType: "image/png",
}
```
:::

<Tip>
    在 @[API 参考][langchain.messages] 中查看规范类型定义。
</Tip>

<Info>
    内容块在 LangChain v1 中作为消息上的新属性引入，以在保持与现有代码向后兼容的同时标准化跨提供商的内容格式。

    内容块不是 @[`content`][BaseMessage(content)] 属性的替代品，而是一个新属性，可用于以标准格式访问消息的内容。
</Info>

## 与 Chat Model 一起使用

[Chat Model](/oss/langchain/models) 接受消息对象序列作为输入并返回 @[`AIMessage`] 作为输出。交互通常是无状态的，因此简单的对话循环涉及使用不断增长的消息列表调用模型。

请参阅以下指南了解更多：

- 用于 [持久化和管理对话历史](/oss/langchain/short-term-memory) 的内置功能
- 管理上下文窗口的策略，包括 [修剪和摘要消息](/oss/langchain/short-term-memory#common-patterns)
