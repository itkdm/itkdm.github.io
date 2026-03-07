---
title: Guardrails
order: 17
section: "LangChain AI"
topic: "Guardrails"
lang: "zh"
slug: "langchain-guardrails"
summary: 为你的 agents 实现安全检查和内容过滤
icon: "shield"
featured: true
toc: true
updated: 2026-03-07
---

Guardrails 通过在 agent 执行的关键点验证和过滤内容，帮助你构建安全、合规的 AI 应用程序。它们可以检测敏感信息、执行内容策略、验证输出，并在问题发生之前防止不安全行为。

常见用例包括：
- 防止 PII 泄漏
- 检测和阻止 prompt injection 攻击
- 阻止不适当或有害内容
- 执行业务规则和合规要求
- 验证输出质量和准确性

你可以使用 [middleware](/oss/langchain/middleware) 实现 Guardrails，在战略点拦截执行 — 在 agent 启动之前、完成后，或在模型和工具调用期间。

<div style={{ display: "flex", justifyContent: "center" }}>
    <img
        src="/oss/images/middleware_final.png"
        alt="Middleware flow diagram"
        className="rounded-lg"
    />
</div>

Guardrails 可以使用两种互补方法实现：

<CardGroup cols={2}>
    <Card title="Deterministic guardrails" icon="list-check">
        使用基于规则的逻辑，如 regex 模式、关键词匹配或显式检查。快速、可预测且成本效益高，但可能会遗漏细微的违规行为。
    </Card>
    <Card title="Model-based guardrails" icon="brain">
        使用 LLMs 或 classifiers 通过语义理解评估内容。捕捉规则遗漏的细微问题，但速度较慢且成本更高。
    </Card>
</CardGroup>

LangChain 提供内置 Guardrails（例如，[PII detection](#pii-detection)、[human-in-the-loop](#human-in-the-loop)）和灵活的 middleware 系统，用于使用任一方法构建自定义 Guardrails。

## 内置 Guardrails

### PII detection

LangChain 提供内置 middleware 用于检测和 handling 对话中的 Personally Identifiable Information (PII)。此 middleware 可以检测常见的 PII 类型，如 emails、credit cards、IP addresses 等。

PII detection middleware 适用于医疗保健和金融应用程序等具有合规要求的情况、需要清理日志的客户服务 agents，以及通常任何处理敏感用户数据的应用程序。

PII middleware 支持多种处理检测到的 PII 的策略：

| Strategy | 描述 | 示例 |
|----------|-------------|---------|
| `redact` | 替换为 `[REDACTED_{PII_TYPE}]` | `[REDACTED_EMAIL]` |
| `mask` | 部分遮蔽（例如，最后 4 位数字） | `****-****-****-1234` |
| `hash` | 替换为确定性 hash | `a8f5f167...` |
| `block` | 检测到时抛出异常 | 抛出错误 |

:::python
```python
from langchain.agents import create_agent
from langchain.agents.middleware import PIIMiddleware


agent = create_agent(
    model="gpt-4.1",
    tools=[customer_service_tool, email_tool],
    middleware=[
        # 在发送给模型之前 redact 用户输入中的 emails
        PIIMiddleware(
            "email",
            strategy="redact",
            apply_to_input=True,
        ),
        # 在用户输入中 mask credit cards
        PIIMiddleware(
            "credit_card",
            strategy="mask",
            apply_to_input=True,
        ),
        # Block API keys - 如果检测到则抛出错误
        PIIMiddleware(
            "api_key",
            detector=r"sk-[a-zA-Z0-9]{32}",
            strategy="block",
            apply_to_input=True,
        ),
    ],
)

# 当用户提供 PII 时，将根据策略处理
result = agent.invoke({
    "messages": [{"role": "user", "content": "My email is john.doe@example.com and card is 5105-1051-0510-5100"}]
})
```
:::

:::js
```typescript
import { createAgent, piiRedactionMiddleware } from "langchain";

const agent = createAgent({
  model: "gpt-4.1",
  tools: [customerServiceTool, emailTool],
  middleware: [
    // 在发送给模型之前 redact 用户输入中的 emails
    piiRedactionMiddleware({
      piiType: "email",
      strategy: "redact",
      applyToInput: true,
    }),
    // 在用户输入中 mask credit cards
    piiRedactionMiddleware({
      piiType: "credit_card",
      strategy: "mask",
      applyToInput: true,
    }),
    // Block API keys - 如果检测到则抛出错误
    piiRedactionMiddleware({
      piiType: "api_key",
      detector: /sk-[a-zA-Z0-9]{32}/,
      strategy: "block",
      applyToInput: true,
    }),
  ],
});

// 当用户提供 PII 时，将根据策略处理
const result = await agent.invoke({
  messages: [{
    role: "user",
    content: "My email is john.doe@example.com and card is 5105-1051-0510-5100"
  }]
});
```
:::

<Accordion title="内置 PII 类型和配置">

**内置 PII 类型：**
- `email` - Email addresses
- `credit_card` - Credit card numbers (Luhn validated)
- `ip` - IP addresses
- `mac_address` - MAC addresses
- `url` - URLs

**配置选项：**

:::python
Parameter | 描述 | 默认值
-----------|-------------|---------
`pii_type` | 要检测的 PII 类型（内置或自定义） | 必填
`strategy` | 如何处理检测到的 PII (`"block"`, `"redact"`, `"mask"`, `"hash"`) | `"redact"`
`detector` | 自定义 detector 函数或 regex 模式 | `None` (使用内置)
`apply_to_input` | 在模型调用之前检查用户消息 | `True`
`apply_to_output` | 在模型调用之后检查 AI 消息 | `False`
`apply_to_tool_results` | 在执行之后检查 tool result 消息 | `False`
:::

:::js
Parameter | 描述 | 默认值
-----------|-------------|---------
`piiType` | 要检测的 PII 类型（内置或自定义） | 必填
`strategy` | 如何处理检测到的 PII (`"block"`, `"redact"`, `"mask"`, `"hash"`) | `"redact"`
`detector` | 自定义 detector regex 模式 | `undefined` (使用内置)
`applyToInput` | 在模型调用之前检查用户消息 | `true`
`applyToOutput` | 在模型调用之后检查 AI 消息 | `false`
`applyToToolResults` | 在执行之后检查 tool result 消息 | `false`
:::

</Accordion>

有关 PII detection 功能的完整详情，请参阅 [middleware documentation](/oss/langchain/middleware#pii-detection)。

### Human-in-the-loop

LangChain 提供内置 middleware，用于在执行敏感操作之前需要人工批准。这是高风险决策最有效的 Guardrails 之一。

Human-in-the-loop middleware 适用于金融交易和转账、删除或修改生产数据、向外部方发送通信以及任何具有重大业务影响的操作等情况。

:::python
```python
from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command


agent = create_agent(
    model="gpt-4.1",
    tools=[search_tool, send_email_tool, delete_database_tool],
    middleware=[
        HumanInTheLoopMiddleware(
            interrupt_on={
                # 需要批准敏感操作
                "send_email": True,
                "delete_database": True,
                # 自动批准安全操作
                "search": False,
            }
        ),
    ],
    # 在 interrupts 之间持久化状态
    checkpointer=InMemorySaver(),
)

# Human-in-the-loop 需要 thread ID 进行持久化
config = {"configurable": {"thread_id": "some_id"}}

# Agent 将在执行敏感工具之前暂停并等待批准
result = agent.invoke(
    {"messages": [{"role": "user", "content": "Send an email to the team"}]},
    config=config
)

result = agent.invoke(
    Command(resume={"decisions": [{"type": "approve"}]}),
    config=config  # 相同的 thread ID 以恢复暂停的对话
)
```
:::

:::js
```typescript
import { createAgent, humanInTheLoopMiddleware } from "langchain";
import { MemorySaver, Command } from "@langchain/langgraph";

const agent = createAgent({
  model: "gpt-4.1",
  tools: [searchTool, sendEmailTool, deleteDatabaseTool],
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        // 需要批准敏感操作
        send_email: { allowAccept: true, allowEdit: true, allowRespond: true },
        delete_database: { allowAccept: true, allowEdit: true, allowRespond: true },
        // 自动批准安全操作
        search: false,
      }
    }),
  ],
  checkpointer: new MemorySaver(),
});

// Human-in-the-loop 需要 thread ID 进行持久化
const config = { configurable: { thread_id: "some_id" } };

// Agent 将在执行敏感工具之前暂停并等待批准
let result = await agent.invoke(
  { messages: [{ role: "user", content: "Send an email to the team" }] },
  config
);

result = await agent.invoke(
  new Command({ resume: { decisions: [{ type: "approve" }] } }),
  config  // 相同的 thread ID 以恢复暂停的对话
);
```
:::

<Tip>
    有关实现 approval workflows 的完整详情，请参阅 [human-in-the-loop documentation](/oss/langchain/human-in-the-loop)。
</Tip>

## 自定义 Guardrails

对于更复杂的 Guardrails，你可以创建自定义 middleware，在 agent 执行之前或之后运行。这让你完全控制验证逻辑、内容过滤和安全检查。

### Before agent guardrails

使用 "before agent" hooks 在每次调用开始时验证请求。这对于会话级检查很有用，如身份验证、rate limiting，或在任何处理开始之前阻止不适当的请求。

:::python

<CodeGroup>

```python title="Class syntax"
from typing import Any

from langchain.agents.middleware import AgentMiddleware, AgentState, hook_config
from langgraph.runtime import Runtime

class ContentFilterMiddleware(AgentMiddleware):
    """Deterministic guardrail: Block requests containing banned keywords."""

    def __init__(self, banned_keywords: list[str]):
        super().__init__()
        self.banned_keywords = [kw.lower() for kw in banned_keywords]

    @hook_config(can_jump_to=["end"])
    def before_agent(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        # 获取第一条用户消息
        if not state["messages"]:
            return None

        first_message = state["messages"][0]
        if first_message.type != "human":
            return None

        content = first_message.content.lower()

        # 检查 banned keywords
        for keyword in self.banned_keywords:
            if keyword in content:
                # 在任何处理之前阻止执行
                return {
                    "messages": [{
                        "role": "assistant",
                        "content": "I cannot process requests containing inappropriate content. Please rephrase your request."
                    }],
                    "jump_to": "end"
                }

        return None

# 使用自定义 guardrail
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4.1",
    tools=[search_tool, calculator_tool],
    middleware=[
        ContentFilterMiddleware(
            banned_keywords=["hack", "exploit", "malware"]
        ),
    ],
)

# 此请求将在任何处理之前被阻止
result = agent.invoke({
    "messages": [{"role": "user", "content": "How do I hack into a database?"}]
})
```

```python title="Decorator syntax"
from typing import Any

from langchain.agents.middleware import before_agent, AgentState, hook_config
from langgraph.runtime import Runtime

banned_keywords = ["hack", "exploit", "malware"]

@before_agent(can_jump_to=["end"])
def content_filter(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    """Deterministic guardrail: Block requests containing banned keywords."""
    # 获取第一条用户消息
    if not state["messages"]:
        return None

    first_message = state["messages"][0]
    if first_message.type != "human":
        return None

    content = first_message.content.lower()

    # 检查 banned keywords
    for keyword in banned_keywords:
        if keyword in content:
            # 在任何处理之前阻止执行
            return {
                "messages": [{
                    "role": "assistant",
                    "content": "I cannot process requests containing inappropriate content. Please rephrase your request."
                }],
                "jump_to": "end"
            }

    return None

# 使用自定义 guardrail
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4.1",
    tools=[search_tool, calculator_tool],
    middleware=[content_filter],
)

# 此请求将在任何处理之前被阻止
result = agent.invoke({
    "messages": [{"role": "user", "content": "How do I hack into a database?"}]
})
```
</CodeGroup>

:::

:::js
```typescript
import { createMiddleware, AIMessage } from "langchain";

const contentFilterMiddleware = (bannedKeywords: string[]) => {
  const keywords = bannedKeywords.map(kw => kw.toLowerCase());

  return createMiddleware({
    name: "ContentFilterMiddleware",
    beforeAgent: {
      hook: (state) => {
        // 获取第一条用户消息
        if (!state.messages || state.messages.length === 0) {
          return;
        }

        const firstMessage = state.messages[0];
        if (firstMessage._getType() !== "human") {
          return;
        }

        const content = firstMessage.content.toString().toLowerCase();

        // 检查 banned keywords
        for (const keyword of keywords) {
          if (content.includes(keyword)) {
            // 在任何处理之前阻止执行
            return {
              messages: [
                new AIMessage(
                  "I cannot process requests containing inappropriate content. Please rephrase your request."
                )
              ],
              jumpTo: "end",
            };
          }
        }

        return;
      },
      canJumpTo: ['end']
    }
  });
};

// 使用自定义 guardrail
import { createAgent } from "langchain";

const agent = createAgent({
  model: "gpt-4.1",
  tools: [searchTool, calculatorTool],
  middleware: [
    contentFilterMiddleware(["hack", "exploit", "malware"]),
  ],
});

// 此请求将在任何处理之前被阻止
const result = await agent.invoke({
  messages: [{ role: "user", content: "How do I hack into a database?" }]
});
```
:::

### After agent guardrails

使用 "after agent" hooks 在返回给用户之前验证最终输出。这对于模型安全检查、质量验证或对完整 agent 响应的最终合规扫描很有用。

:::python

<CodeGroup>

```python title="Class syntax"
from langchain.agents.middleware import AgentMiddleware, AgentState, hook_config
from langgraph.runtime import Runtime
from langchain.messages import AIMessage
from langchain.chat_models import init_chat_model
from typing import Any

class SafetyGuardrailMiddleware(AgentMiddleware):
    """Model-based guardrail: Use an LLM to evaluate response safety."""

    def __init__(self):
        super().__init__()
        self.safety_model = init_chat_model("gpt-4.1-mini")

    @hook_config(can_jump_to=["end"])
    def after_agent(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        # 获取最终 AI 响应
        if not state["messages"]:
            return None

        last_message = state["messages"][-1]
        if not isinstance(last_message, AIMessage):
            return None

        # 使用模型评估安全性
        safety_prompt = f"""Evaluate if this response is safe and appropriate.
        Respond with only 'SAFE' or 'UNSAFE'.

        Response: {last_message.content}"""

        result = self.safety_model.invoke([{"role": "user", "content": safety_prompt}])

        if "UNSAFE" in result.content:
            last_message.content = "I cannot provide that response. Please rephrase your request."

        return None

# 使用 safety guardrail
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4.1",
    tools=[search_tool, calculator_tool],
    middleware=[SafetyGuardrailMiddleware()],
)

result = agent.invoke({
    "messages": [{"role": "user", "content": "How do I make explosives?"}]
})
```

```python title="Decorator syntax"
from langchain.agents.middleware import after_agent, AgentState, hook_config
from langgraph.runtime import Runtime
from langchain.messages import AIMessage
from langchain.chat_models import init_chat_model
from typing import Any

safety_model = init_chat_model("gpt-4.1-mini")

@after_agent(can_jump_to=["end"])
def safety_guardrail(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    """Model-based guardrail: Use an LLM to evaluate response safety."""
    # 获取最终 AI 响应
    if not state["messages"]:
        return None

    last_message = state["messages"][-1]
    if not isinstance(last_message, AIMessage):
        return None

    # 使用模型评估安全性
    safety_prompt = f"""Evaluate if this response is safe and appropriate.
    Respond with only 'SAFE' or 'UNSAFE'.

    Response: {last_message.content}"""

    result = safety_model.invoke([{"role": "user", "content": safety_prompt}])

    if "UNSAFE" in result.content:
        last_message.content = "I cannot provide that response. Please rephrase your request."

    return None

# 使用 safety guardrail
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4.1",
    tools=[search_tool, calculator_tool],
    middleware=[safety_guardrail],
)

result = agent.invoke({
    "messages": [{"role": "user", "content": "How do I make explosives?"}]
})
```

</CodeGroup>

:::

:::js
```typescript
import { createMiddleware, AIMessage, initChatModel } from "langchain";

const safetyGuardrailMiddleware = () => {
  const safetyModel = initChatModel("gpt-4.1-mini");

  return createMiddleware({
    name: "SafetyGuardrailMiddleware",
    afterAgent: {
      hook: async (state) => {
        // 获取最终 AI 响应
        if (!state.messages || state.messages.length === 0) {
          return;
        }

        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage._getType() !== "ai") {
          return;
        }

        // 使用模型评估安全性
        const safetyPrompt = `Evaluate if this response is safe and appropriate.
        Respond with only 'SAFE' or 'UNSAFE'.

        Response: ${lastMessage.content.toString()}`;

        const result = await safetyModel.invoke([
          { role: "user", content: safetyPrompt }
        ]);

        if (result.content.toString().includes("UNSAFE")) {
          return {
            messages: [
              new AIMessage(
                "I cannot provide that response. Please rephrase your request."
              )
            ],
            jumpTo: "end",
          };
        }

        return;
      },
      canJumpTo: ['end']
    }
  });
};

// 使用 safety guardrail
import { createAgent } from "langchain";

const agent = createAgent({
  model: "gpt-4.1",
  tools: [searchTool, calculatorTool],
  middleware: [safetyGuardrailMiddleware()],
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "How do I make explosives?" }]
});
```
:::

### Combine multiple guardrails

你可以通过将多个 guardrails 添加到 middleware 数组来堆叠它们。它们按顺序执行，让你能够构建分层保护：

:::python
```python
from langchain.agents import create_agent
from langchain.agents.middleware import PIIMiddleware, HumanInTheLoopMiddleware

agent = create_agent(
    model="gpt-4.1",
    tools=[search_tool, send_email_tool],
    middleware=[
        # Layer 1: Deterministic input filter (before agent)
        ContentFilterMiddleware(banned_keywords=["hack", "exploit"]),

        # Layer 2: PII protection (before and after model)
        PIIMiddleware("email", strategy="redact", apply_to_input=True),
        PIIMiddleware("email", strategy="redact", apply_to_output=True),

        # Layer 3: Human approval for sensitive tools
        HumanInTheLoopMiddleware(interrupt_on={"send_email": True}),

        # Layer 4: Model-based safety check (after agent)
        SafetyGuardrailMiddleware(),
    ],
)
```
:::

:::js
```typescript
import { createAgent, piiRedactionMiddleware, humanInTheLoopMiddleware } from "langchain";

const agent = createAgent({
  model: "gpt-4.1",
  tools: [searchTool, sendEmailTool],
  middleware: [
    // Layer 1: Deterministic input filter (before agent)
    contentFilterMiddleware(["hack", "exploit"]),

    // Layer 2: PII protection (before and after model)
    piiRedactionMiddleware({
      piiType: "email",
      strategy: "redact",
      applyToInput: true,
    }),
    piiRedactionMiddleware({
      piiType: "email",
      strategy: "redact",
      applyToOutput: true,
    }),

    // Layer 3: Human approval for sensitive tools
    humanInTheLoopMiddleware({
      interruptOn: {
        send_email: { allowAccept: true, allowEdit: true, allowRespond: true },
      }
    }),

    // Layer 4: Model-based safety check (after agent)
    safetyGuardrailMiddleware(),
  ],
});
```
:::

## Additional resources

- [Middleware documentation](/oss/langchain/middleware) - Complete guide to custom middleware
- [Middleware API reference](https://reference.langchain.com/python/langchain/middleware/) - Complete guide to custom middleware
- [Human-in-the-loop](/oss/langchain/human-in-the-loop) - Add human review for sensitive operations
- [Testing agents](/oss/langchain/test) - Strategies for testing safety mechanisms