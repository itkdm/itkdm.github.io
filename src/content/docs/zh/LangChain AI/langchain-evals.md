---
title: Evaluate Agent Performance（评估 Agent 性能）
order: 11
section: "LangChain AI"
topic: "LangChain"
lang: "zh"
slug: "langchain-evals"
summary: "了解如何使用 LangSmith evaluations 和预构建的 evaluators 来评估 Agent 的性能，包括 trajectory match 和 LLM-as-judge。"
icon: "circle-check"
featured: true
toc: true
updated: 2026-03-07
---

要评估 Agent 的性能，你可以使用 [LangSmith evaluations](/langsmith/evaluation)。对于 evaluations，你必须首先定义一个 evaluator 函数来判断 Agent 的结果，例如最终输出或 trajectory。根据你的 evaluation 技术，这可能涉及也可能不涉及 reference output。

<Tip>
在 LangSmith 中使用 datasets 和 LLM-as-judge evaluators 运行 evaluations。请参阅 [evaluation quickstart](/langsmith/evaluation-quickstart) 开始使用。
</Tip>

:::python
```python
def evaluator(*, outputs: dict, reference_outputs: dict):
    # 将 agent outputs 与 reference outputs 进行比较
    output_messages = outputs["messages"]
    reference_messages = reference_outputs["messages"]
    score = compare_messages(output_messages, reference_messages)
    return {"key": "evaluator_score", "score": score}
```
:::

:::js
```typescript
type EvaluatorParams = {
    outputs: Record<string, any>;
    referenceOutputs: Record<string, any>;
};

function evaluator({ outputs, referenceOutputs }: EvaluatorParams) {
    # 将 agent outputs 与 reference outputs 进行比较
    const outputMessages = outputs.messages;
    const referenceMessages = referenceOutputs.messages;
    const score = compareMessages(outputMessages, referenceMessages);
    return { key: "evaluator_score", score: score };
}
```
:::

开始使用时，你可以使用 `AgentEvals` 包中的预构建 evaluators：

:::python
<CodeGroup>
```bash pip
pip install -U agentevals
```

```bash uv
uv add agentevals
```
</CodeGroup>
:::

:::js
```bash
npm install agentevals
```
:::

## 创建 Evaluator

评估 Agent 性能的一种常见方法是将其 trajectory（调用 tools 的顺序）与 reference trajectory 进行比较：

:::python
```python
import json
from agentevals.trajectory.match import create_trajectory_match_evaluator  # [!code highlight]

outputs = [
    {
        "role": "assistant",
        "tool_calls": [
            {
                "function": {
                    "name": "get_weather",
                    "arguments": json.dumps({"city": "san francisco"}),
                }
            },
            {
                "function": {
                    "name": "get_directions",
                    "arguments": json.dumps({"destination": "presidio"}),
                }
            }
        ],
    }
]
reference_outputs = [
    {
        "role": "assistant",
        "tool_calls": [
            {
                "function": {
                    "name": "get_weather",
                    "arguments": json.dumps({"city": "san francisco"}),
                }
            },
        ],
    }
]

# 创建 evaluator
evaluator = create_trajectory_match_evaluator(
    trajectory_match_mode="superset",    # [!code highlight]
)

# 运行 evaluator
result = evaluator(
    outputs=outputs, reference_outputs=reference_outputs
)
```
:::

:::js
```typescript
import { createTrajectoryMatchEvaluator } from "agentevals/trajectory/match";

const outputs = [
    {
        role: "assistant",
        tool_calls: [
        {
            function: {
            name: "get_weather",
            arguments: JSON.stringify({ city: "san francisco" }),
            },
        },
        {
            function: {
            name: "get_directions",
            arguments: JSON.stringify({ destination: "presidio" }),
            },
        },
        ],
    },
];

const referenceOutputs = [
    {
        role: "assistant",
        tool_calls: [
        {
            function: {
            name: "get_weather",
            arguments: JSON.stringify({ city: "san francisco" }),
            },
        },
        ],
    },
];

# 创建 evaluator
const evaluator = createTrajectoryMatchEvaluator({
  # 指定如何比较 trajectories。`superset` 将在 output trajectory 是 reference 的超集时接受为有效。其他选项包括：strict, unordered 和 subset
  trajectoryMatchMode: "superset", // [!code highlight]
});

# 运行 evaluator
const result = evaluator({
    outputs: outputs,
    referenceOutputs: referenceOutputs,
});
```
:::

1. 指定如何比较 trajectories。`superset` 将在 output trajectory 是 reference 的超集时接受为有效。其他选项包括：[strict](https://github.com/langchain-ai/agentevals?tab=readme-ov-file#strict-match)、[unordered](https://github.com/langchain-ai/agentevals?tab=readme-ov-file#unordered-match) 和 [subset](https://github.com/langchain-ai/agentevals?tab=readme-ov-file#subset-and-superset-match)

下一步，了解更多关于如何 [自定义 trajectory match evaluator](https://github.com/langchain-ai/agentevals?tab=readme-ov-file#agent-trajectory-match)。

### LLM-as-a-judge

你可以使用 LLM-as-a-judge evaluator，它使用 LLM 来比较 trajectory 与 reference outputs 并输出分数：

:::python
```python
import json
from agentevals.trajectory.llm import (
    create_trajectory_llm_as_judge,  # [!code highlight]
    TRAJECTORY_ACCURACY_PROMPT_WITH_REFERENCE
)

evaluator = create_trajectory_llm_as_judge(
    prompt=TRAJECTORY_ACCURACY_PROMPT_WITH_REFERENCE,
    model="openai:o3-mini"
)
```
:::

:::js
```typescript
import {
    createTrajectoryLlmAsJudge,
    TRAJECTORY_ACCURACY_PROMPT_WITH_REFERENCE,
} from "agentevals/trajectory/llm";

const evaluator = createTrajectoryLlmAsJudge({
    prompt: TRAJECTORY_ACCURACY_PROMPT_WITH_REFERENCE,
    model: "openai:o3-mini",
});
```
:::

## 运行 Evaluator

要运行 evaluator，你首先需要创建一个 [LangSmith dataset](/langsmith/manage-datasets)。要使用预构建的 AgentEvals evaluators，你必须有一个具有以下 schema 的 dataset：

* **input**: `{"messages": [...]}` 用于调用 agent 的 input messages。
* **output**: `{"messages": [...]}` agent output 中的预期 message history。对于 trajectory evaluation，你可以选择只保留 assistant messages。

:::python
```python
from langsmith import Client
from langchain.agents import create_agent
from agentevals.trajectory.match import create_trajectory_match_evaluator


client = Client()
agent = create_agent(...)
evaluator = create_trajectory_match_evaluator(...)

experiment_results = client.evaluate(
    lambda inputs: agent.invoke(inputs),
    # 替换为你的 dataset 名称
    data="<Name of your dataset>",
    evaluators=[evaluator]
)
```
:::

:::js
```typescript
import { Client } from "langsmith";
import { createAgent } from "langchain";
import { createTrajectoryMatchEvaluator } from "agentevals/trajectory/match";

const client = new Client();
const agent = createAgent({...});
const evaluator = createTrajectoryMatchEvaluator({...});

const experimentResults = await client.evaluate(
    (inputs) => agent.invoke(inputs),
    # 替换为你的 dataset 名称
    { data: "<Name of your dataset>" },
    { evaluators: [evaluator] }
);
```
:::
