---
title: 快速入门
order: 2
section: 入门指南
topic: "快速开始"
lang: zh
slug: /zh/LangChain AI/langchain-quickstart
summary: 从简单设置到功能完整的 AI Agent，只需几分钟即可完成本快速入门指南。
icon: "rocket"
featured: true
toc: true
updated: 2026-03-07
---

# 快速入门

本快速入门指南将带你从简单设置到构建一个功能完整的 AI Agent，只需几分钟。

<Tip>
    **LangChain Docs MCP server**

    如果你使用 AI 编程助手或 IDE（例如 Claude Code 或 Cursor），你应该安装 [LangChain Docs MCP server](/use-these-docs) 以充分利用它。这确保你的 Agent 可以访问最新的 LangChain 文档和示例。
</Tip>

## 要求

对于这些示例，你需要：

* [安装](/oss/langchain/install) LangChain 包
* 设置 [Claude (Anthropic)](https://www.anthropic.com/) 账户并获取 API key
* 在终端中设置 `ANTHROPIC_API_KEY` 环境变量

虽然这些示例使用 Claude，但你可以通过更改代码中的模型名称并设置相应的 API key 来使用 [任何支持的模型](/oss/integrations/providers/overview)。

## 构建基础 Agent

首先创建一个简单的 Agent，它可以回答问题并调用 Tool。该 Agent 将使用 Claude Sonnet 4.5 作为其语言模型，一个基础天气函数作为 Tool，以及一个简单的 prompt 来指导其行为。

:::python
```python
from langchain.agents import create_agent

def get_weather(city: str) -> str:
    """Get weather for a given city."""
    return f"It's always sunny in {city}!"

agent = create_agent(
    model="claude-sonnet-4-6",
    tools=[get_weather],
    system_prompt="You are a helpful assistant",
)

# 运行 Agent
agent.invoke(
    {"messages": [{"role": "user", "content": "what is the weather in sf"}]}
)
```
:::

:::js
```ts
import { createAgent, tool } from "langchain";
import * as z from "zod";

const getWeather = tool(
  (input) => `It's always sunny in ${input.city}!`,
  {
    name: "get_weather",
    description: "Get the weather for a given city",
    schema: z.object({
      city: z.string().describe("The city to get the weather for"),
    }),
  }
);

const agent = createAgent({
  model: "claude-sonnet-4-6",
  tools: [getWeather],
});

console.log(
  await agent.invoke({
    messages: [{ role: "user", "content": "What's the weather in Tokyo?" }],
  })
);
```
:::

<Tip>
    要了解如何使用 LangSmith 追踪你的 Agent，请参阅 [LangSmith 文档](/langsmith/trace-with-langchain)。
</Tip>

## 构建真实世界的 Agent

接下来，构建一个实用的天气预报 Agent，展示关键的生产概念：

1. **详细的 system prompt** 以获得更好的 Agent 行为
2. **创建 Tool** 以与外部数据集成
3. **模型配置** 以获得一致的响应
4. **结构化输出** 以获得可预测的结果
5. **对话记忆** 以支持类似聊天的交互
6. **创建和运行 Agent** 以测试功能完整的 Agent

让我们逐步完成每个步骤：

<Steps>
    <Step title="定义 system prompt">
        system prompt 定义了 Agent 的角色和行为。保持具体且可操作：

        :::python
        ```python wrap
        SYSTEM_PROMPT = """You are an expert weather forecaster, who speaks in puns.

        You have access to two tools:

        - get_weather_for_location: use this to get the weather for a specific location
        - get_user_location: use this to get the user's location

        If a user asks you for the weather, make sure you know the location. If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location."""
        ```
        :::

        :::js
        ```ts wrap
        const systemPrompt = `You are an expert weather forecaster, who speaks in puns.

        You have access to two tools:

        - get_weather_for_location: use this to get the weather for a specific location
        - get_user_location: use this to get the user's location

        If a user asks you for the weather, make sure you know the location. If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location.`;
        ```
        :::
    </Step>
    <Step title="创建 Tool">
        :::python
        [Tool](/oss/langchain/tools) 让模型通过调用你定义的函数与外部系统交互。
        Tool 可以依赖于 [runtime context](/oss/langchain/runtime)，也可以与 [Agent memory](/oss/langchain/short-term-memory) 交互。

        注意下面 `get_user_location` Tool 如何使用 runtime context：

        ```python
        from dataclasses import dataclass
        from langchain.tools import tool, ToolRuntime

        @tool
        def get_weather_for_location(city: str) -> str:
            """Get weather for a given city."""
            return f"It's always sunny in {city}!"

        @dataclass
        class Context:
            """Custom runtime context schema."""
            user_id: str

        @tool
        def get_user_location(runtime: ToolRuntime[Context]) -> str:
            """Retrieve user information based on user ID."""
            user_id = runtime.context.user_id
            return "Florida" if user_id == "1" else "SF"
        ```

        <Tip>
            Tool 应该有完善的文档：它们的名称、描述和参数名称会成为模型 prompt 的一部分。
            LangChain 的 [`@tool` 装饰器][@tool] 添加元数据并通过 `ToolRuntime` 参数启用 runtime 注入。
        </Tip>
        :::

        :::js
        [Tool](/oss/langchain/tools) 是你的 Agent 可以调用的函数。通常 Tool 会想要连接到外部系统，并将依赖 runtime 配置来实现。注意这里 `getUserLocation` Tool 是如何做到的：

        ```ts
        import { tool, type ToolRuntime } from "langchain";
        import * as z from "zod";

        const getWeather = tool(
          (input) => `It's always sunny in ${input.city}!`,
          {
            name: "get_weather_for_location",
            description: "Get the weather for a given city",
            schema: z.object({
              city: z.string().describe("The city to get the weather for"),
            }),
          }
        );

        type AgentRuntime = ToolRuntime<unknown, { user_id: string }>;

        const getUserLocation = tool(
          (_, config: AgentRuntime) => {
            const { user_id } = config.context;
            return user_id === "1" ? "Florida" : "SF";
          },
          {
            name: "get_user_location",
            description: "Retrieve user information based on user ID",
          }
        );
        ```

        <Note>
            [Zod](https://zod.dev/) 是一个用于验证和解析预定义 schema 的库。你可以使用它为 Tool 定义输入 schema，以确保 Agent 仅使用正确的参数调用 Tool。

            或者，你可以将 `schema` 属性定义为 [JSON schema](https://json-schema.org/overview/what-is-jsonschema) 对象。请记住，JSON schema **不会** 在 runtime 进行验证。

            <Accordion title="示例：使用 JSON schema 作为 Tool 输入">
                ```ts
                const getWeather = tool(
                  ({ city }) => `It's always sunny in ${city}!`,
                  {
                    name: "get_weather_for_location",
                    description: "Get the weather for a given city",
                    schema: {
                      type: "object",
                      properties: {
                        city: {
                          type: "string",
                          description: "The city to get the weather for"
                        }
                      },
                      required: ["city"]
                    },
                  }
                );
            ```
            </Accordion>
        </Note>
        :::
    </Step>
    <Step title="配置模型">
        为你的用例设置合适的 [语言模型](/oss/langchain/models) 参数：

        :::python

        ```python
        from langchain.chat_models import init_chat_model

        model = init_chat_model(
            "claude-sonnet-4-6",
            temperature=0.5,
            timeout=10,
            max_tokens=1000
        )
        ```
        :::

        :::js

        ```ts
        import { initChatModel } from "langchain";

        const model = await initChatModel(
          "claude-sonnet-4-6",
          { temperature: 0.5, timeout: 10, maxTokens: 1000 }
        );
        ```
        :::

        根据选择的模型和 provider，初始化参数可能有所不同；请参阅它们的参考页面获取详细信息。
    </Step>
    <Step title="定义响应格式">
        :::python
        如果需要 Agent 响应匹配特定 schema，可以可选地定义结构化响应格式。

        ```python
        from dataclasses import dataclass

        # 这里使用 dataclass，但也支持 Pydantic 模型。
        @dataclass
        class ResponseFormat:
            """Response schema for the agent."""
            # 双关语响应（始终必需）
            punny_response: str
            # 任何有趣的天气信息（如果有）
            weather_conditions: str | None = None
        ```
        :::

        :::js
        如果需要 Agent 响应匹配特定 schema，可以可选地定义结构化响应格式。

        ```ts
        const responseFormat = z.object({
          punny_response: z.string(),
          weather_conditions: z.string().optional(),
        });
        ```
        :::
    </Step>
    <Step title="添加记忆">
        为你的 Agent 添加 [记忆](/oss/langchain/short-term-memory) 以在交互之间维护状态。这允许 Agent 记住之前的对话和上下文。

        :::python
        ```python
        from langgraph.checkpoint.memory import InMemorySaver

        checkpointer = InMemorySaver()
        ```
        :::

        :::js
        ```ts
        import { MemorySaver } from "@langchain/langgraph";

        const checkpointer = new MemorySaver();
        ```
        :::

        <Info>
            在生产环境中，使用持久化 checkpointer 将消息历史保存到数据库。
            请参阅 [添加和管理记忆](/oss/langgraph/add-memory#manage-short-term-memory) 获取更多信息。
        </Info>
    </Step>
    <Step title="创建和运行 Agent">
        现在将所有组件组装成 Agent 并运行它！

        :::python

        ```python
        from langchain.agents.structured_output import ToolStrategy

        agent = create_agent(
            model=model,
            system_prompt=SYSTEM_PROMPT,
            tools=[get_user_location, get_weather_for_location],
            context_schema=Context,
            response_format=ToolStrategy(ResponseFormat),
            checkpointer=checkpointer
        )

        # `thread_id` 是给定对话的唯一标识符。
        config = {"configurable": {"thread_id": "1"}}

        response = agent.invoke(
            {"messages": [{"role": "user", "content": "what is the weather outside?"}]},
            config=config,
            context=Context(user_id="1")
        )

        print(response['structured_response'])
        # ResponseFormat(
        #     punny_response="Florida is still having a 'sun-derful' day! The sunshine is playing 'ray-dio' hits all day long! I'd say it's the perfect weather for some 'solar-bration'! If you were hoping for rain, I'm afraid that idea is all 'washed up' - the forecast remains 'clear-ly' brilliant!",
        #     weather_conditions="It's always sunny in Florida!"
        # )


        # 注意我们可以使用相同的 `thread_id` 继续对话。
        response = agent.invoke(
            {"messages": [{"role": "user", "content": "thank you!"}]},
            config=config,
            context=Context(user_id="1")
        )

        print(response['structured_response'])
        # ResponseFormat(
        #     punny_response="You're 'thund-erfully' welcome! It's always a 'breeze' to help you stay 'current' with the weather. I'm just 'cloud'-ing around waiting to 'shower' you with more forecasts whenever you need them. Have a 'sun-sational' day in the Florida sunshine!",
        #     weather_conditions=None
        # )
        ```
        :::
        :::js
        ```ts
        import { createAgent } from "langchain";

        const agent = createAgent({
          model: "claude-sonnet-4-6",
          systemPrompt: systemPrompt,
          tools: [getUserLocation, getWeather],
          responseFormat,
          checkpointer,
        });

        // `thread_id` 是给定对话的唯一标识符。
        const config = {
          configurable: { thread_id: "1" },
          context: { user_id: "1" },
        };

        const response = await agent.invoke(
          { messages: [{ role: "user", "content": "what is the weather outside?" }] },
          config
        );
        console.log(response.structuredResponse);
        // {
        //   punny_response: "Florida is still having a 'sun-derful' day ...",
        //   weather_conditions: "It's always sunny in Florida!"
        // }

        // 注意我们可以使用相同的 `thread_id` 继续对话。
        const thankYouResponse = await agent.invoke(
          { messages: [{ role: "user", "content": "thank you!" }] },
          config
        );
        console.log(thankYouResponse.structuredResponse);
        // {
        //   punny_response: "You're 'thund-erfully' welcome! ...",
        //   weather_conditions: undefined
        // }
        ```
        :::
    </Step>
</Steps>

<Expandable title="完整示例代码">
:::python
```python
from dataclasses import dataclass

from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain.tools import tool, ToolRuntime
from langgraph.checkpoint.memory import InMemorySaver
from langchain.agents.structured_output import ToolStrategy


# 定义 system prompt
SYSTEM_PROMPT = """You are an expert weather forecaster, who speaks in puns.

You have access to two tools:

- get_weather_for_location: use this to get the weather for a specific location
- get_user_location: use this to get the user's location

If a user asks you for the weather, make sure you know the location. If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location."""

# 定义 context schema
@dataclass
class Context:
    """Custom runtime context schema."""
    user_id: str

# 定义 Tool
@tool
def get_weather_for_location(city: str) -> str:
    """Get weather for a given city."""
    return f"It's always sunny in {city}!"

@tool
def get_user_location(runtime: ToolRuntime[Context]) -> str:
    """Retrieve user information based on user ID."""
    user_id = runtime.context.user_id
    return "Florida" if user_id == "1" else "SF"

# 配置模型
model = init_chat_model(
    "claude-sonnet-4-6",
    temperature=0
)

# 定义响应格式
@dataclass
class ResponseFormat:
    """Response schema for the agent."""
    # 双关语响应（始终必需）
    punny_response: str
    # 任何有趣的天气信息（如果有）
    weather_conditions: str | None = None

# 设置记忆
checkpointer = InMemorySaver()

# 创建 Agent
agent = create_agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
    tools=[get_user_location, get_weather_for_location],
    context_schema=Context,
    response_format=ToolStrategy(ResponseFormat),
    checkpointer=checkpointer
)

# 运行 Agent
# `thread_id` 是给定对话的唯一标识符。
config = {"configurable": {"thread_id": "1"}}

response = agent.invoke(
    {"messages": [{"role": "user", "content": "what is the weather outside?"}]},
    config=config,
    context=Context(user_id="1")
)

print(response['structured_response'])
# ResponseFormat(
#     punny_response="Florida is still having a 'sun-derful' day! The sunshine is playing 'ray-dio' hits all day long! I'd say it's the perfect weather for some 'solar-bration'! If you were hoping for rain, I'm afraid that idea is all 'washed up' - the forecast remains 'clear-ly' brilliant!",
#     weather_conditions="It's always sunny in Florida!"
# )


# 注意我们可以使用相同的 `thread_id` 继续对话。
response = agent.invoke(
    {"messages": [{"role": "user", "content": "thank you!"}]},
    config=config,
    context=Context(user_id="1")
)

print(response['structured_response'])
# ResponseFormat(
#     punny_response="You're 'thund-erfully' welcome! It's always a 'breeze' to help you stay 'current' with the weather. I'm just 'cloud'-ing around waiting to 'shower' you with more forecasts whenever you need them. Have a 'sun-sational' day in the Florida sunshine!",
#     weather_conditions=None
# )
```
:::


:::js
```ts
import { createAgent, tool, initChatModel, type ToolRuntime } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import * as z from "zod";

// 定义 system prompt
const systemPrompt = `You are an expert weather forecaster, who speaks in puns.

You have access to two tools:

- get_weather_for_location: use this to get the weather for a specific location
- get_user_location: use this to get the user's location

If a user asks you for the weather, make sure you know the location. If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location.`;

// 定义 Tool
const getWeather = tool(
  ({ city }) => `It's always sunny in ${city}!`,
  {
    name: "get_weather_for_location",
    description: "Get the weather for a given city",
    schema: z.object({
      city: z.string(),
    }),
  }
);

type AgentRuntime = ToolRuntime<unknown, { user_id: string }>;

const getUserLocation = tool(
  (_, config: AgentRuntime) => {
    const { user_id } = config.context;
    return user_id === "1" ? "Florida" : "SF";
  },
  {
    name: "get_user_location",
    description: "Retrieve user information based on user ID",
    schema: z.object({}),
  }
);

// 配置模型
const model = await initChatModel(
  "claude-sonnet-4-6",
  { temperature: 0 }
);

// 定义响应格式
const responseFormat = z.object({
  punny_response: z.string(),
  weather_conditions: z.string().optional(),
});

// 设置记忆
const checkpointer = new MemorySaver();

// 创建 Agent
const agent = createAgent({
  model,
  systemPrompt,
  responseFormat,
  checkpointer,
  tools: [getUserLocation, getWeather],
});

// 运行 Agent
// `thread_id` 是给定对话的唯一标识符。
const config = {
  configurable: { thread_id: "1" },
  context: { user_id: "1" },
};

const response = await agent.invoke(
  { messages: [{ role: "user", "content": "what is the weather outside?" }] },
  config
);
console.log(response.structuredResponse);
// {
//   punny_response: "Florida is still having a 'sun-derful' day! The sunshine is playing 'ray-dio' hits all day long! I'd say it's the perfect weather for some 'solar-bration'! If you were hoping for rain, I'm afraid that idea is all 'washed up' - the forecast remains 'clear-ly' brilliant!",
//   weather_conditions: "It's always sunny in Florida!"
// }

// 注意我们可以使用相同的 `thread_id` 继续对话。
const thankYouResponse = await agent.invoke(
  { messages: [{ role: "user", "content": "thank you!" }] },
  config
);
console.log(thankYouResponse.structuredResponse);
// {
//   punny_response: "You're 'thund-erfully' welcome! It's always a 'breeze' to help you stay 'current' with the weather. I'm just 'cloud'-ing around waiting to 'shower' you with more forecasts whenever you need them. Have a 'sun-sational' day in the Florida sunshine!",
//   weather_conditions: undefined
// }
```
:::
</Expandable>

<Tip>
    要了解如何使用 LangSmith 追踪你的 Agent，请参阅 [LangSmith 文档](/langsmith/trace-with-langchain)。
</Tip>

恭喜！你现在拥有了一个 AI Agent，它可以：

- **理解上下文** 并记住对话
- **智能地使用多个 Tool**
- **以一致的格式提供结构化响应**
- **通过 context 处理用户特定信息**
- **在交互之间维护对话状态**
