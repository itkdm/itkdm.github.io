---
title: Test（测试）
order: 12
section: "LangChain AI"
topic: "测试指南"
lang: "zh"
slug: "langchain-test"
summary: "了解如何测试 Agent 应用，包括单元测试、集成测试、trajectory match evaluators 和 LangSmith 集成。"
icon: "flask"
featured: true
toc: true
updated: 2026-03-07
---

Agent 应用让 LLM 自行决定下一步来解决问。这种灵活性很强大，但模型的黑盒性质使得难以预测对 Agent 某部分的调整将如何影响其余部分。要构建生产就绪的 Agent，彻底的测试至关重要。

有几种测试 Agent 的方法：
:::python
- [单元测试](#unit-testing) 使用内存中的 fakes 隔离地测试 Agent 的小的、确定性的部分，以便快速且确定性地断言确切行为。
:::
:::js
- 单元测试使用内存中的 fakes 隔离地测试 Agent 的小的、确定性的部分，以便快速且确定性地断言确切行为。
:::
- [集成测试](#integration-testing) 使用真实的网络调用测试 Agent，以确认组件协同工作、凭据和 schemas 对齐，以及延迟可接受。

Agent 应用往往更依赖集成测试，因为它们将多个组件链接在一起，并且必须处理由于 LLM 的非确定性性质导致的不稳定性。

:::python

## 单元测试

### Mocking Chat Model

对于不需要 API 调用的逻辑，你可以使用内存中的 stub 来 mocking 响应。

LangChain 提供 [`GenericFakeChatModel`](https://python.langchain.com/api_reference/core/language_models/langchain_core.language_models.fake_chat_models.GenericFakeChatModel.html) 用于 mocking 文本响应。它接受响应迭代器（AIMessages 或字符串），每次调用返回一个。它支持常规和 streaming 使用。

```python
from langchain_core.language_models.fake_chat_models import GenericFakeChatModel

model = GenericFakeChatModel(messages=iter([
    AIMessage(content="", tool_calls=[ToolCall(name="foo", args={"bar": "baz"}, id="call_1")]),
    "bar"
]))

model.invoke("hello")
# AIMessage(content='', ..., tool_calls=[{'name': 'foo', 'args': {'bar': 'baz'}, 'id': 'call_1', 'type': 'tool_call'}])
```

如果我们再次调用模型，它将返回迭代器中的下一项：

```python
model.invoke("hello, again!")
# AIMessage(content='bar', ...)
```

### InMemorySaver Checkpointer

要在测试期间启用 persistence，你可以使用 @[`InMemorySaver`] checkpointer。这允许你模拟多个回合来测试 state-dependent behavior：

```python
from langgraph.checkpoint.memory import InMemorySaver

agent = create_agent(
    model,
    tools=[],
    checkpointer=InMemorySaver()
)

# 第一次调用
agent.invoke(
    {"messages": [HumanMessage(content="I live in Sydney, Australia")]},
    config={"configurable": {"thread_id": "session-1"}}
)

# 第二次调用：第一条消息已持久化（Sydney 位置），因此模型返回 GMT+10 时间
agent.invoke(
    {"messages": [HumanMessage(content="What's my local time?")]},
    config={"configurable": {"thread_id": "session-1"}}
)
```
:::

## 集成测试

许多 Agent 行为只有在使用真实 LLM 时才会出现，例如 Agent 决定调用哪个 tool、如何格式化响应，或者 prompt 修改是否影响整个执行 trajectory。LangChain 的 [`agentevals`](https://github.com/langchain-ai/agentevals) 包提供了专门用于使用 live models 测试 agent trajectories 的 evaluators。

AgentEvals 允许你通过执行 **trajectory match** 或使用 **LLM judge** 轻松评估 Agent 的 trajectory（确切的消息序列，包括 tool calls）：

<Card title="Trajectory Match" icon="equal" arrow="true" href="#trajectory-match-evaluator">
为给定 input 硬编码 reference trajectory，并通过逐步比较验证 run。

适用于测试你知道预期行为的明确定义的工作流。当你对应该调用哪些 tools 以及以何种顺序调用有特定期望时使用此方法。这种方法是确定性的、快速的且成本效益高，因为它不需要额外的 LLM 调用。
</Card>

<Card title="LLM-as-judge" icon="hammer" arrow="true" href="#llm-as-judge-evaluator">
使用 LLM 定性验证 Agent 的执行 trajectory。"judge" LLM 根据 prompt rubric（可以包括 reference trajectory）审查 Agent 的决策。

更灵活，可以评估细微的方面，如效率和适当性，但需要 LLM 调用且确定性较低。当你想评估 Agent trajectory 的整体质量和合理性而不需要严格的 tool call 或排序要求时使用。
</Card>

### 安装 AgentEvals

:::python
```bash
pip install agentevals
```
:::

:::js
```bash
npm install agentevals @langchain/core
```
:::

或者直接克隆 [AgentEvals repository](https://github.com/langchain-ai/agentevals)。

### Trajectory Match Evaluator

:::python
AgentEvals 提供 `create_trajectory_match_evaluator` 函数来将 Agent 的 trajectory 与 reference trajectory 匹配。有四种模式可供选择：
:::
:::js
AgentEvals 提供 `createTrajectoryMatchEvaluator` 函数来将 Agent 的 trajectory 与 reference trajectory 匹配。有四种模式可供选择：
:::

| 模式 | 描述 | 用例 |
|------|-------------|----------|
| `strict` | 消息和 tool calls 完全匹配，顺序相同 | 测试特定序列（例如授权前的策略查找） |
| `unordered` | 相同的 tool calls 允许以任何顺序 | 验证信息检索，顺序不重要时 |
| `subset` | Agent 仅调用 reference 中的 tools（无额外） | 确保 Agent 不超过预期范围 |
| `superset` | Agent 至少调用 reference tools（允许额外） | 验证执行了最低要求的操作 |

<Accordion title="Strict Match（严格匹配）">

`strict` 模式确保 trajectories 包含相同的消息，顺序相同，tool calls 相同，尽管允许消息内容的差异。当你需要强制执行特定操作序列时很有用，例如要求在授权操作前进行策略查找。

:::python
```python
from langchain.agents import create_agent
from langchain.tools import tool
from langchain.messages import HumanMessage, AIMessage, ToolMessage
from agentevals.trajectory.match import create_trajectory_match_evaluator


@tool
def get_weather(city: str):
    """Get weather information for a city."""
    return f"It's 75 degrees and sunny in {city}."

agent = create_agent("gpt-4.1", tools=[get_weather])

evaluator = create_trajectory_match_evaluator(  # [!code highlight]
    trajectory_match_mode="strict",  # [!code highlight]
)  # [!code highlight]

def test_weather_tool_called_strict():
    result = agent.invoke({
        "messages": [HumanMessage(content="What's the weather in San Francisco?")]
    })

    reference_trajectory = [
        HumanMessage(content="What's the weather in San Francisco?"),
        AIMessage(content="", tool_calls=[
            {"id": "call_1", "name": "get_weather", "args": {"city": "San Francisco"}}
        ]),
        ToolMessage(content="It's 75 degrees and sunny in San Francisco.", tool_call_id="call_1"),
        AIMessage(content="The weather in San Francisco is 75 degrees and sunny."),
    ]

    evaluation = evaluator(
        outputs=result["messages"],
        reference_outputs=reference_trajectory
    )
    # {
    #     'key': 'trajectory_strict_match',
    #     'score': True,
    #     'comment': None,
    # }
    assert evaluation["score"] is True
```
:::

:::js
```ts
import { createAgent, tool, HumanMessage, AIMessage, ToolMessage } from "langchain"
import { createTrajectoryMatchEvaluator } from "agentevals";
import * as z from "zod";

const getWeather = tool(
  async ({ city }: { city: string }) => {
    return `It's 75 degrees and sunny in ${city}.`;
  },
  {
    name: "get_weather",
    description: "Get weather information for a city.",
    schema: z.object({
      city: z.string(),
    }),
  }
);

const agent = createAgent({
  model: "gpt-4.1",
  tools: [getWeather]
});

const evaluator = createTrajectoryMatchEvaluator({  # [!code highlight]
  trajectoryMatchMode: "strict",  # [!code highlight]
});  # [!code highlight]

async function testWeatherToolCalledStrict() {
  const result = await agent.invoke({
    messages: [new HumanMessage("What's the weather in San Francisco?")]
  });

  const referenceTrajectory = [
    new HumanMessage("What's the weather in San Francisco?"),
    new AIMessage({
      content: "",
      tool_calls: [
        { id: "call_1", name: "get_weather", args: { city: "San Francisco" } }
      ]
    }),
    new ToolMessage({
      content: "It's 75 degrees and sunny in San Francisco.",
      tool_call_id: "call_1"
    }),
    new AIMessage("The weather in San Francisco is 75 degrees and sunny."),
  ];

  const evaluation = await evaluator({
    outputs: result.messages,
    referenceOutputs: referenceTrajectory
  });
  # {
  #     'key': 'trajectory_strict_match',
  #     'score': true,
  #     'comment': null,
  # }
  expect(evaluation.score).toBe(true);
}
```
:::

</Accordion>

<Accordion title="Unordered Match（无序匹配）">

`unordered` 模式允许相同的 tool calls 以任何顺序，当你想验证检索了特定信息但不关心顺序时很有用。例如，Agent 可能需要检查城市的天气和事件，但顺序不重要。

:::python
```python
from langchain.agents import create_agent
from langchain.tools import tool
from langchain.messages import HumanMessage, AIMessage, ToolMessage
from agentevals.trajectory.match import create_trajectory_match_evaluator


@tool
def get_weather(city: str):
    """Get weather information for a city."""
    return f"It's 75 degrees and sunny in {city}."

@tool
def get_events(city: str):
    """Get events happening in a city."""
    return f"Concert at the park in {city} tonight."

agent = create_agent("gpt-4.1", tools=[get_weather, get_events])

evaluator = create_trajectory_match_evaluator(  # [!code highlight]
    trajectory_match_mode="unordered",  # [!code highlight]
)  # [!code highlight]

def test_multiple_tools_any_order():
    result = agent.invoke({
        "messages": [HumanMessage(content="What's happening in SF today?")]
    })

    # Reference 显示 tools 调用顺序与实际执行不同
    reference_trajectory = [
        HumanMessage(content="What's happening in SF today?"),
        AIMessage(content="", tool_calls=[
            {"id": "call_1", "name": "get_events", "args": {"city": "SF"}},
            {"id": "call_2", "name": "get_weather", "args": {"city": "SF"}},
        ]),
        ToolMessage(content="Concert at the park in SF tonight.", tool_call_id="call_1"),
        ToolMessage(content="It's 75 degrees and sunny in SF.", tool_call_id="call_2"),
        AIMessage(content="Today in SF: 75 degrees and sunny with a concert at the park tonight."),
    ]

    evaluation = evaluator(
        outputs=result["messages"],
        reference_outputs=reference_trajectory,
    )
    # {
    #     'key': 'trajectory_unordered_match',
    #     'score': True,
    # }
    assert evaluation["score"] is True
```
:::

:::js
```ts
import { createAgent, tool, HumanMessage, AIMessage, ToolMessage } from "langchain"
import { createTrajectoryMatchEvaluator } from "agentevals";
import * as z from "zod";

const getWeather = tool(
  async ({ city }: { city: string }) => {
    return `It's 75 degrees and sunny in ${city}.`;
  },
  {
    name: "get_weather",
    description: "Get weather information for a city.",
    schema: z.object({ city: z.string() }),
  }
);

const getEvents = tool(
  async ({ city }: { city: string }) => {
    return `Concert at the park in ${city} tonight.`;
  },
  {
    name: "get_events",
    description: "Get events happening in a city.",
    schema: z.object({ city: z.string() }),
  }
);

const agent = createAgent({
  model: "gpt-4.1",
  tools: [getWeather, getEvents]
});

const evaluator = createTrajectoryMatchEvaluator({  # [!code highlight]
  trajectoryMatchMode: "unordered",  # [!code highlight]
});  # [!code highlight]

async function testMultipleToolsAnyOrder() {
  const result = await agent.invoke({
    messages: [new HumanMessage("What's happening in SF today?")]
  });

  # Reference 显示 tools 调用顺序与实际执行不同
  const referenceTrajectory = [
    new HumanMessage("What's happening in SF today?"),
    new AIMessage({
      content: "",
      tool_calls: [
        { id: "call_1", name: "get_events", args: { city: "SF" } },
        { id: "call_2", name: "get_weather", args: { city: "SF" } },
      ]
    }),
    new ToolMessage({
      content: "Concert at the park in SF tonight.",
      tool_call_id: "call_1"
    }),
    new ToolMessage({
      content: "It's 75 degrees and sunny in SF.",
      tool_call_id: "call_2"
    }),
    new AIMessage("Today in SF: 75 degrees and sunny with a concert at the park tonight."),
  ];

  const evaluation = await evaluator({
    outputs: result.messages,
    referenceOutputs: referenceTrajectory,
  });
  # {
  #     'key': 'trajectory_unordered_match',
  #     'score': true,
  # }
  expect(evaluation.score).toBe(true);
}
```
:::

</Accordion>

<Accordion title="Subset and Superset Match（子集和超集匹配）">

`superset` 和 `subset` 模式匹配部分 trajectories。`superset` 模式验证 Agent 至少调用了 reference trajectory 中的 tools，允许额外的 tool calls。`subset` 模式确保 Agent 没有调用 reference 之外的任何 tools。

:::python
```python
from langchain.agents import create_agent
from langchain.tools import tool
from langchain.messages import HumanMessage, AIMessage, ToolMessage
from agentevals.trajectory.match import create_trajectory_match_evaluator


@tool
def get_weather(city: str):
    """Get weather information for a city."""
    return f"It's 75 degrees and sunny in {city}."

@tool
def get_detailed_forecast(city: str):
    """Get detailed weather forecast for a city."""
    return f"Detailed forecast for {city}: sunny all week."

agent = create_agent("gpt-4.1", tools=[get_weather, get_detailed_forecast])

evaluator = create_trajectory_match_evaluator(  # [!code highlight]
    trajectory_match_mode="superset",  # [!code highlight]
)  # [!code highlight]

def test_agent_calls_required_tools_plus_extra():
    result = agent.invoke({
        "messages": [HumanMessage(content="What's the weather in Boston?")]
    })

    # Reference 仅需要 get_weather，但 Agent 可能调用额外的 tools
    reference_trajectory = [
        HumanMessage(content="What's the weather in Boston?"),
        AIMessage(content="", tool_calls=[
            {"id": "call_1", "name": "get_weather", "args": {"city": "Boston"}},
        ]),
        ToolMessage(content="It's 75 degrees and sunny in Boston.", tool_call_id="call_1"),
        AIMessage(content="The weather in Boston is 75 degrees and sunny."),
    ]

    evaluation = evaluator(
        outputs=result["messages"],
        reference_outputs=reference_trajectory,
    )
    # {
    #     'key': 'trajectory_superset_match',
    #     'score': True,
    #     'comment': None,
    # }
    assert evaluation["score"] is True
```
:::

:::js
```ts
import { createAgent } from "langchain"
import { tool } from "@langchain/core/tools";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { createTrajectoryMatchEvaluator } from "agentevals";
import * as z from "zod";

const getWeather = tool(
  async ({ city }: { city: string }) => {
    return `It's 75 degrees and sunny in ${city}.`;
  },
  {
    name: "get_weather",
    description: "Get weather information for a city.",
    schema: z.object({ city: z.string() }),
  }
);

const getDetailedForecast = tool(
  async ({ city }: { city: string }) => {
    return `Detailed forecast for ${city}: sunny all week.`;
  },
  {
    name: "get_detailed_forecast",
    description: "Get detailed weather forecast for a city.",
    schema: z.object({ city: z.string() }),
  }
);

const agent = createAgent({
  model: "gpt-4.1",
  tools: [getWeather, getDetailedForecast]
});

const evaluator = createTrajectoryMatchEvaluator({  # [!code highlight]
  trajectoryMatchMode: "superset",  # [!code highlight]
});  # [!code highlight]

async function testAgentCallsRequiredToolsPlusExtra() {
  const result = await agent.invoke({
    messages: [new HumanMessage("What's the weather in Boston?")]
  });

  # Reference 仅需要 getWeather，但 Agent 可能调用额外的 tools
  const referenceTrajectory = [
    new HumanMessage("What's the weather in Boston?"),
    new AIMessage({
      content: "",
      tool_calls: [
        { id: "call_1", name: "get_weather", args: { city: "Boston" } },
      ]
    }),
    new ToolMessage({
      content: "It's 75 degrees and sunny in Boston.",
      tool_call_id: "call_1"
    }),
    new AIMessage("The weather in Boston is 75 degrees and sunny."),
  ];

  const evaluation = await evaluator({
    outputs: result.messages,
    referenceOutputs: referenceTrajectory,
  });
  # {
  #     'key': 'trajectory_superset_match',
  #     'score': true,
  #     'comment': null,
  # }
  expect(evaluation.score).toBe(true);
}
```
:::

</Accordion>

<Info>
:::python
你还可以设置 `tool_args_match_mode` 属性和/或 `tool_args_match_overrides` 来自定义 evaluator 如何考虑实际 trajectory 与 reference 中 tool calls 之间的相等性。默认情况下，只有对相同 tool 具有相同参数的 tool calls 才被视为相等。访问 [repository](https://github.com/langchain-ai/agentevals?tab=readme-ov-file#tool-args-match-modes) 了解更多详情。
:::
:::js
你还可以设置 `toolArgsMatchMode` 属性和/或 `toolArgsMatchOverrides` 来自定义 evaluator 如何考虑实际 trajectory 与 reference 中 tool calls 之间的相等性。默认情况下，只有对相同 tool 具有相同参数的 tool calls 才被视为相等。访问 [repository](https://github.com/langchain-ai/agentevals?tab=readme-ov-file#tool-args-match-modes) 了解更多详情。
:::
</Info>

### LLM-as-Judge Evaluator

:::python
你还可以使用 LLM 通过 `create_trajectory_llm_as_judge` 函数评估 Agent 的执行路径。与 trajectory match evaluators 不同，它不需要 reference trajectory，但如果有的话可以提供。
:::
:::js
你还可以使用 LLM 通过 `createTrajectoryLLMAsJudge` 函数评估 Agent 的执行路径。与 trajectory match evaluators 不同，它不需要 reference trajectory，但如果有的话可以提供。
:::

<Accordion title="Without Reference Trajectory（无 Reference Trajectory）">
:::python
```python
from langchain.agents import create_agent
from langchain.tools import tool
from langchain.messages import HumanMessage, AIMessage, ToolMessage
from agentevals.trajectory.llm import create_trajectory_llm_as_judge, TRAJECTORY_ACCURACY_PROMPT


@tool
def get_weather(city: str):
    """Get weather information for a city."""
    return f"It's 75 degrees and sunny in {city}."

agent = create_agent("gpt-4.1", tools=[get_weather])

evaluator = create_trajectory_llm_as_judge(  # [!code highlight]
    model="openai:o3-mini",  # [!code highlight]
    prompt=TRAJECTORY_ACCURACY_PROMPT,  # [!code highlight]
)  # [!code highlight]

def test_trajectory_quality():
    result = agent.invoke({
        "messages": [HumanMessage(content="What's the weather in Seattle?")]
    })

    evaluation = evaluator(
        outputs=result["messages"],
    )
    # {
    #     'key': 'trajectory_accuracy',
    #     'score': True,
    #     'comment': 'The provided agent trajectory is reasonable...'
    # }
    assert evaluation["score"] is True
```
:::
:::js
```ts
import { createAgent } from "langchain"
import { tool } from "@langchain/core/tools";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { createTrajectoryLLMAsJudge, TRAJECTORY_ACCURACY_PROMPT } from "agentevals";
import * as z from "zod";

const getWeather = tool(
  async ({ city }: { city: string }) => {
    return `It's 75 degrees and sunny in ${city}.`;
  },
  {
    name: "get_weather",
    description: "Get weather information for a city.",
    schema: z.object({ city: z.string() }),
  }
);

const agent = createAgent({
  model: "gpt-4.1",
  tools: [getWeather]
});

const evaluator = createTrajectoryLLMAsJudge({  # [!code highlight]
  model: "openai:o3-mini",  # [!code highlight]
  prompt: TRAJECTORY_ACCURACY_PROMPT,  # [!code highlight]
});  # [!code highlight]

async function testTrajectoryQuality() {
  const result = await agent.invoke({
    messages: [new HumanMessage("What's the weather in Seattle?")]
  });

  const evaluation = await evaluator({
    outputs: result.messages,
  });
  # {
  #     'key': 'trajectory_accuracy',
  #     'score': true,
  #     'comment': 'The provided agent trajectory is reasonable...'
  # }
  expect(evaluation.score).toBe(true);
}
```
:::
</Accordion>

<Accordion title="With Reference Trajectory（带 Reference Trajectory）">

如果你有 reference trajectory，你可以向 prompt 添加额外变量并传入 reference trajectory。下面，我们使用预构建的 `TRAJECTORY_ACCURACY_PROMPT_WITH_REFERENCE` prompt 并配置 `reference_outputs` 变量：

:::python
```python
evaluator = create_trajectory_llm_as_judge(
    model="openai:o3-mini",
    prompt=TRAJECTORY_ACCURACY_PROMPT_WITH_REFERENCE,
)
evaluation = evaluator(
    outputs=result["messages"],
    reference_outputs=reference_trajectory,
)
```
:::

:::js
```ts
import { TRAJECTORY_ACCURACY_PROMPT_WITH_REFERENCE } from "agentevals";

const evaluator = createTrajectoryLLMAsJudge({
  model: "openai:o3-mini",
  prompt: TRAJECTORY_ACCURACY_PROMPT_WITH_REFERENCE,
});

const evaluation = await evaluator({
  outputs: result.messages,
  referenceOutputs: referenceTrajectory,
});
```
:::

</Accordion>

<Info>
要对 LLM 如何评估 trajectory 进行更多配置，请访问 [repository](https://github.com/langchain-ai/agentevals?tab=readme-ov-file#trajectory-llm-as-judge)。
</Info>

:::python
### Async 支持

所有 `agentevals` evaluators 支持 Python asyncio。对于使用 factory functions 的 evaluators，通过在函数名中的 `create_` 后添加 `async` 可使用 async 版本。

<Accordion title="Async Judge and Evaluator 示例">

```python
from agentevals.trajectory.llm import create_async_trajectory_llm_as_judge, TRAJECTORY_ACCURACY_PROMPT
from agentevals.trajectory.match import create_async_trajectory_match_evaluator

async_judge = create_async_trajectory_llm_as_judge(
    model="openai:o3-mini",
    prompt=TRAJECTORY_ACCURACY_PROMPT,
)

async_evaluator = create_async_trajectory_match_evaluator(
    trajectory_match_mode="strict",
)

async def test_async_evaluation():
    result = await agent.ainvoke({
        "messages": [HumanMessage(content="What's the weather?")]
    })

    evaluation = await async_judge(outputs=result["messages"])
    assert evaluation["score"] is True
```

</Accordion>

:::

## LangSmith 集成

要随时间跟踪 experiments，你可以将 evaluator 结果记录到 [LangSmith](https://smith.langchain.com/)，这是一个用于构建生产级 LLM 应用的平台，包括 tracing、evaluation 和 experimentation 工具。

首先，通过设置所需的环境变量来设置 LangSmith：

```bash
export LANGSMITH_API_KEY="your_langsmith_api_key"
export LANGSMITH_TRACING="true"
```

:::python
LangSmith 提供两种运行 evaluations 的主要方法：[pytest](/langsmith/pytest) 集成和 `evaluate` 函数。

<Accordion title="使用 Pytest 集成">

```python
import pytest
from langsmith import testing as t
from agentevals.trajectory.llm import create_trajectory_llm_as_judge, TRAJECTORY_ACCURACY_PROMPT

trajectory_evaluator = create_trajectory_llm_as_judge(
    model="openai:o3-mini",
    prompt=TRAJECTORY_ACCURACY_PROMPT,
)

@pytest.mark.langsmith
def test_trajectory_accuracy():
    result = agent.invoke({
        "messages": [HumanMessage(content="What's the weather in SF?")]
    })

    reference_trajectory = [
        HumanMessage(content="What's the weather in SF?"),
        AIMessage(content="", tool_calls=[
            {"id": "call_1", "name": "get_weather", "args": {"city": "SF"}},
        ]),
        ToolMessage(content="It's 75 degrees and sunny in SF.", tool_call_id="call_1"),
        AIMessage(content="The weather in SF is 75 degrees and sunny."),
    ]

    # 将 inputs、outputs 和 reference outputs 记录到 LangSmith
    t.log_inputs({})
    t.log_outputs({"messages": result["messages"]})
    t.log_reference_outputs({"messages": reference_trajectory})

    trajectory_evaluator(
        outputs=result["messages"],
        reference_outputs=reference_trajectory
    )
```

使用 pytest 运行 evaluation：

```bash
pytest test_trajectory.py --langsmith-output
```

结果将自动记录到 LangSmith。

</Accordion>

<Accordion title="使用 Evaluate 函数">

或者，你可以在 LangSmith 中创建 dataset 并使用 `evaluate` 函数：

```python
from langsmith import Client
from agentevals.trajectory.llm import create_trajectory_llm_as_judge, TRAJECTORY_ACCURACY_PROMPT

client = Client()

trajectory_evaluator = create_trajectory_llm_as_judge(
    model="openai:o3-mini",
    prompt=TRAJECTORY_ACCURACY_PROMPT,
)

def run_agent(inputs):
    """Your agent function that returns trajectory messages."""
    return agent.invoke(inputs)["messages"]

experiment_results = client.evaluate(
    run_agent,
    data="your_dataset_name",
    evaluators=[trajectory_evaluator]
)
```

结果将自动记录到 LangSmith。

</Accordion>

<Tip>
要了解更多关于评估 Agent 的信息，请参阅 [LangSmith docs](/langsmith/pytest)。
</Tip>
:::

:::js
LangSmith 提供两种运行 evaluations 的主要方法：[Vitest/Jest](/langsmith/vitest-jest) 集成和 `evaluate` 函数。

<Accordion title="使用 Vitest/Jest 集成">

```ts
import * as ls from "langsmith/vitest";
// import * as ls from "langsmith/jest";

import { createTrajectoryLLMAsJudge, TRAJECTORY_ACCURACY_PROMPT } from "agentevals";

const trajectoryEvaluator = createTrajectoryLLMAsJudge({
  model: "openai:o3-mini",
  prompt: TRAJECTORY_ACCURACY_PROMPT,
});

ls.describe("trajectory accuracy", () => {
  ls.test("accurate trajectory", {
    inputs: {
      messages: [
        {
          role: "user",
          content: "What is the weather in SF?"
        }
      ]
    },
    referenceOutputs: {
      messages: [
        new HumanMessage("What is the weather in SF?"),
        new AIMessage({
          content: "",
          tool_calls: [
            { id: "call_1", name: "get_weather", args: { city: "SF" } }
          ]
        }),
        new ToolMessage({
          content: "It's 75 degrees and sunny in SF.",
          tool_call_id: "call_1"
        }),
        new AIMessage("The weather in SF is 75 degrees and sunny."),
      ],
    },
  }, async ({ inputs, referenceOutputs }) => {
    const result = await agent.invoke({
      messages: [new HumanMessage("What is the weather in SF?")]
    });

    ls.logOutputs({ messages: result.messages });

    await trajectoryEvaluator({
      inputs,
      outputs: result.messages,
      referenceOutputs,
    });
  });
});
```

使用测试运行器运行 evaluation：

```bash
vitest run test_trajectory.eval.ts
# 或
jest test_trajectory.eval.ts
```

</Accordion>

<Accordion title="使用 Evaluate 函数">

或者，你可以在 LangSmith 中创建 dataset 并使用 `evaluate` 函数：

```ts
import { evaluate } from "langsmith/evaluation";
import { createTrajectoryLLMAsJudge, TRAJECTORY_ACCURACY_PROMPT } from "agentevals";

const trajectoryEvaluator = createTrajectoryLLMAsJudge({
  model: "openai:o3-mini",
  prompt: TRAJECTORY_ACCURACY_PROMPT,
});

async function runAgent(inputs: any) {
  const result = await agent.invoke(inputs);
  return result.messages;
}

await evaluate(
  runAgent,
  {
    data: "your_dataset_name",
    evaluators: [trajectoryEvaluator],
  }
);
```

结果将自动记录到 LangSmith。

</Accordion>

<Tip>
要了解更多关于评估 Agent 的信息，请参阅 [LangSmith docs](/langsmith/vitest-jest)。
</Tip>
:::

:::python
## 记录和回放 HTTP 调用

调用真实 LLM APIs 的集成测试可能很慢且昂贵，尤其是在 CI/CD 管道中频繁运行时。我们建议使用库来记录 HTTP 请求和响应，然后在后续运行中回放它们，而无需进行实际的网络调用。

你可以使用 [`vcrpy`](https://pypi.org/project/vcrpy/1.5.2/) 来实现这一点。如果你使用 `pytest`，[`pytest-recording` plugin](https://pypi.org/project/pytest-recording/) 提供了一种简单的方法，只需最少的配置即可启用此功能。请求/响应记录在 cassettes 中，然后在后续运行中用于 mock 真实的网络调用。

设置 `conftest.py` 文件以从 cassettes 中过滤掉敏感信息：

```py conftest.py
import pytest

@pytest.fixture(scope="session")
def vcr_config():
    return {
        "filter_headers": [
            ("authorization", "XXXX"),
            ("x-api-key", "XXXX"),
            # ... 其他你想屏蔽的 headers
        ],
        "filter_query_parameters": [
            ("api_key", "XXXX"),
            ("key", "XXXX"),
        ],
    }
```

然后配置你的项目以识别 `vcr` marker：

<CodeGroup>
```ini pytest.ini
[pytest]
markers =
    vcr: record/replay HTTP via VCR
addopts = --record-mode=once
```
```toml pyproject.toml
[tool.pytest.ini_options]
markers = [
  "vcr: record/replay HTTP via VCR"
]
addopts = "--record-mode=once"
```
</CodeGroup>

<Info>
`--record-mode=once` 选项在第一次运行时记录 HTTP 交互，在后续运行中回放它们。
</Info>

现在，只需使用 `vcr` marker 装饰你的 tests：

```python
@pytest.mark.vcr()
def test_agent_trajectory():
    # ...
```

第一次运行此测试时，你的 Agent 将进行真实的网络调用，pytest 将在 `tests/cassettes` 目录中生成 cassette 文件 `test_agent_trajectory.yaml`。后续运行将使用该 cassette 来 mock 真实的网络调用，前提是 Agent 的请求与上次运行相比没有变化。如果有变化，测试将失败，你需要删除 cassette 并重新运行测试以记录新的交互。

<Warning>
当你修改 prompts、添加新 tools 或更改预期的 trajectories 时，保存的 cassettes 将过时，现有测试**将失败**。你应该删除相应的 cassette 文件并重新运行测试以记录新的交互。
</Warning>
:::
