---
title: Human-in-the-Loop（人在回路）
order: 10
section: "LangChain AI"
topic: "人工介入"
lang: "zh"
slug: "langchain-human-in-the-loop"
summary: "了解如何使用 Human-in-the-Loop 中间件为 Agent 的 tool calls 添加人工监督，支持批准、编辑或拒绝操作。"
icon: "users"
featured: true
toc: true
updated: 2026-03-07
---

Human-in-the-Loop (HITL，人在回路) [middleware](/oss/langchain/middleware/built-in#human-in-the-loop) 允许你为 Agent 的 tool calls 添加人工监督。当模型提出可能需要审查的操作时（例如写入文件或执行 SQL），中间件可以暂停执行并等待决策。

它通过将每个 tool call 与可配置的策略进行检查来实现这一点。如果需要干预，中间件会发出一个 @[interrupt] 来停止执行。graph state 使用 LangGraph 的 [persistence layer](/oss/langgraph/persistence) 保存，因此执行可以安全暂停并在稍后恢复。

然后由人工决策决定接下来会发生什么：操作可以原样批准（`approve`）、在运行前修改（`edit`），或附带反馈被拒绝（`reject`）。

## Interrupt 决策类型

[middleware](/oss/langchain/middleware/built-in#human-in-the-loop) 定义了三种人工响应 interrupt 的内置方式：

| 决策类型 | 描述 | 示例用例 |
|---------------|---------------------------------------------------------------------------|-----------------------------------------------------|
| ✅ `approve` | 操作原样批准并执行，不做更改。 | 完全按照草稿发送邮件 |
| ✏️ `edit` | tool call 在执行前进行修改。 | 在发送邮件前更改收件人 |
| ❌ `reject` | tool call 被拒绝，解释添加到对话中。 | 拒绝邮件草稿并解释如何重写 |

每个 tool 可用的决策类型取决于你在 `interrupt_on` 中配置的策略。当多个 tool calls 同时暂停时，每个操作都需要单独的决策。决策必须按照它们在中断请求中出现的顺序提供。

<Tip>
在**编辑** tool 参数时，要保守地进行更改。对原始参数进行重大修改可能会导致模型重新评估其方法，并可能多次执行 tool 或采取意外操作。
</Tip>

## 配置 Interrupts

要使用 HITL，在创建 Agent 时将 [middleware](/oss/langchain/middleware/built-in#human-in-the-loop) 添加到 Agent 的 `middleware` 列表中。

你使用 tool 操作与每个操作允许的决策类型的映射来配置它。当 tool call 与映射中的操作匹配时，中间件将中断执行。

:::python
```python
from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware # [!code highlight]
from langgraph.checkpoint.memory import InMemorySaver # [!code highlight]


agent = create_agent(
    model="gpt-4.1",
    tools=[write_file_tool, execute_sql_tool, read_data_tool],
    middleware=[
        HumanInTheLoopMiddleware( # [!code highlight]
            interrupt_on={
                "write_file": True,  # 允许所有决策（approve, edit, reject）
                "execute_sql": {"allowed_decisions": ["approve", "reject"]},  # 不允许编辑
                # 安全操作，无需批准
                "read_data": False,
            },
            # interrupt 消息的前缀 - 与 tool 名称和参数组合形成完整消息
            # 例如："Tool execution pending approval: execute_sql with query='DELETE FROM...'"
            # 各个 tools 可以通过在中断配置中指定 "description" 来覆盖此设置
            description_prefix="Tool execution pending approval",
        ),
    ],
    # Human-in-the-loop 需要 checkpointing 来处理 interrupts。
    # 在生产环境中，使用持久化 checkpointer，如 AsyncPostgresSaver。
    checkpointer=InMemorySaver(),  # [!code highlight]
)
```
:::

:::js
```ts
import { createAgent, humanInTheLoopMiddleware } from "langchain"; // [!code highlight]
import { MemorySaver } from "@langchain/langgraph"; // [!code highlight]

const agent = createAgent({
    model: "gpt-4.1",
    tools: [writeFileTool, executeSQLTool, readDataTool],
    middleware: [
        humanInTheLoopMiddleware({
            interruptOn: {
                write_file: true, // 允许所有决策（approve, edit, reject）
                execute_sql: {
                    allowedDecisions: ["approve", "reject"],
                    // 不允许编辑
                    description: "🚨 SQL execution requires DBA approval",
                },
                // 安全操作，无需批准
                read_data: false,
            },
            // interrupt 消息的前缀 - 与 tool 名称和参数组合形成完整消息
            // 例如："Tool execution pending approval: execute_sql with query='DELETE FROM...'"
            // 各个 tools 可以通过在中断配置中指定 "description" 来覆盖此设置
            descriptionPrefix: "Tool execution pending approval",
        }),
    ],
    // Human-in-the-loop 需要 checkpointing 来处理 interrupts。
    // 在生产环境中，使用持久化 checkpointer，如 AsyncPostgresSaver。
    checkpointer: new MemorySaver(), // [!code highlight]
});
```
:::

<Info>
    你必须配置 checkpointer 以便在 interrupts 之间持久化 graph state。
    在生产环境中，使用持久化 checkpointer，如 @[`AsyncPostgresSaver`]。对于测试或原型设计，使用 @[`InMemorySaver`]。

    调用 Agent 时，传递包含 **thread ID** 的 `config` 以将执行与对话 thread 关联。
    详见 [LangGraph interrupts 文档](/oss/langgraph/interrupts)。
</Info>

<Accordion title="配置选项">

:::python
<ParamField body="interrupt_on" type="dict" required>
    tool 名称到批准配置的映射。值可以是 `True`（使用默认配置中断）、`False`（自动批准）或 `InterruptOnConfig` 对象。
</ParamField>

<ParamField body="description_prefix" type="string" default="Tool execution requires approval">
    操作请求描述的前缀
</ParamField>

**`InterruptOnConfig` 选项：**

<ParamField body="allowed_decisions" type="list[string]">
    允许的决策列表：`'approve'`、`'edit'` 或 `'reject'`
</ParamField>

<ParamField body="description" type="string | callable">
    用于自定义描述的静态字符串或可调用函数
</ParamField>
:::

:::js
<ParamField body="interruptOn" type="object" required>
    tool 名称到批准配置的映射
</ParamField>

**Tool 批准配置选项：**

<ParamField body="allowAccept" type="boolean" default="false">
    是否允许批准
</ParamField>

<ParamField body="allowEdit" type="boolean" default="false">
    是否允许编辑
</ParamField>

<ParamField body="allowRespond" type="boolean" default="false">
    是否允许响应/拒绝
</ParamField>
:::

</Accordion>

## 响应 Interrupts

当你调用 Agent 时，它会运行直到完成或触发 interrupt。当 tool call 匹配你在 `interrupt_on` 中配置的策略时，会触发 interrupt。在这种情况下，调用结果将包含一个 `__interrupt__` 字段，其中包含需要审查的操作。然后你可以将这些操作呈现给审查者，并在提供决策后恢复执行。

:::python
```python
from langgraph.types import Command

# Human-in-the-loop 利用 LangGraph 的 persistence layer。
# 你必须提供 thread ID 以将执行与对话 thread 关联，
# 因此对话可以暂停和恢复（人工审查需要）。
config = {"configurable": {"thread_id": "some_id"}} # [!code highlight]
# 运行 graph 直到触发 interrupt。
result = agent.invoke(
    {
        "messages": [
            {
                "role": "user",
                "content": "Delete old records from the database",
            }
        ]
    },
    config=config # [!code highlight]
)

# interrupt 包含完整的 HITL 请求，包括 action_requests 和 review_configs
print(result['__interrupt__'])
# > [
# >    Interrupt(
# >       value={
# >          'action_requests': [
# >             {
# >                'name': 'execute_sql',
# >                'arguments': {'query': 'DELETE FROM records WHERE created_at < NOW() - INTERVAL \'30 days\';'},
# >                'description': 'Tool execution pending approval\n\nTool: execute_sql\nArgs: {...}'
# >             }
# >          ],
# >          'review_configs': [
# >             {
# >                'action_name': 'execute_sql',
# >                'allowed_decisions': ['approve', 'reject']
# >             }
# >          ]
# >       }
# >    )
# > ]


# 使用批准决策恢复
agent.invoke(
    Command( # [!code highlight]
        resume={"decisions": [{"type": "approve"}]}  # 或 "reject" [!code highlight]
    ), # [!code highlight]
    config=config # 相同的 thread ID 以恢复暂停的对话
)
```
:::

:::js
```typescript
import { HumanMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";

// 你必须提供 thread ID 以将执行与对话 thread 关联，
// 因此对话可以暂停和恢复（人工审查需要）。
const config = { configurable: { thread_id: "some_id" } }; // [!code highlight]

// 运行 graph 直到触发 interrupt。
const result = await agent.invoke(
    {
        messages: [new HumanMessage("Delete old records from the database")],
    },
    config // [!code highlight]
);


// interrupt 包含完整的 HITL 请求，包括 action_requests 和 review_configs
console.log(result.__interrupt__);
// > [
// >    Interrupt(
// >       value: {
// >          action_requests: [
// >             {
// >                name: 'execute_sql',
// >                arguments: { query: 'DELETE FROM records WHERE created_at < NOW() - INTERVAL \'30 days\';' },
// >                description: 'Tool execution pending approval\n\nTool: execute_sql\nArgs: {...}'
// >             }
// >          ],
// >          review_configs: [
// >             {
// >                action_name: 'execute_sql',
// >                allowed_decisions: ['approve', 'reject']
// >             }
// >          ]
// >       }
// >    )
// > ]

// 使用批准决策恢复
await agent.invoke(
    new Command({ // [!code highlight]
        resume: { decisions: [{ type: "approve" }] }, // 或 "reject" [!code highlight]
    }), // [!code highlight]
    config // 相同的 thread ID 以恢复暂停的对话
);
```
:::

### 决策类型

<Tabs>
<Tab title="✅ approve">
使用 `approve` 原样批准 tool call 并执行，不做更改。

:::python
```python
agent.invoke(
    Command(
        # 决策作为列表提供，每个待审查的操作一个。
        # 决策的顺序必须与 `__interrupt__` 请求中列出的操作顺序匹配。
        resume={
            "decisions": [
                {
                    "type": "approve",
                }
            ]
        }
    ),
    config=config  # 相同的 thread ID 以恢复暂停的对话
)
```
:::

:::js
```typescript
await agent.invoke(
    new Command({
        // 决策作为列表提供，每个待审查的操作一个。
        // 决策的顺序必须与 `__interrupt__` 请求中列出的操作顺序匹配。
        resume: {
            decisions: [
                {
                    type: "approve",
                }
            ]
        }
    }),
    config  # 相同的 thread ID 以恢复暂停的对话
);
```
:::
</Tab>
<Tab title="✏️ edit">
    使用 `edit` 在执行前修改 tool call。
    提供编辑后的操作，包含新的 tool 名称和参数。

    :::python
    ```python
    agent.invoke(
        Command(
            # 决策作为列表提供，每个待审查的操作一个。
            # 决策的顺序必须与 `__interrupt__` 请求中列出的操作顺序匹配。
            resume={
                "decisions": [
                    {
                        "type": "edit",
                        # 编辑后的操作，包含 tool 名称和参数
                        "edited_action": {
                            # 要调用的 tool 名称。
                            # 通常与原始操作相同。
                            "name": "new_tool_name",
                            # 传递给 tool 的参数。
                            "args": {"key1": "new_value", "key2": "original_value"},
                        }
                    }
                ]
            }
        ),
        config=config  # 相同的 thread ID 以恢复暂停的对话
    )
    ```
    :::

    :::js
    ```typescript
    await agent.invoke(
        new Command({
            // 决策作为列表提供，每个待审查的操作一个。
            # 决策的顺序必须与 `__interrupt__` 请求中列出的操作顺序匹配。
            resume: {
                decisions: [
                    {
                        type: "edit",
                        # 编辑后的操作，包含 tool 名称和参数
                        editedAction: {
                            # 要调用的 tool 名称。
                            # 通常与原始操作相同。
                            name: "new_tool_name",
                            # 传递给 tool 的参数。
                            args: { key1: "new_value", key2: "original_value" },
                        }
                    }
                ]
            }
        }),
        config  # 相同的 thread ID 以恢复暂停的对话
    );
    ```
    :::

    <Tip>
        在**编辑** tool 参数时，要保守地进行更改。对原始参数进行重大修改可能会导致模型重新评估其方法，并可能多次执行 tool 或采取意外操作。
    </Tip>

</Tab>

<Tab title="❌ reject">
    使用 `reject` 拒绝 tool call 并提供反馈，而不是执行。

    :::python
    ```python
    agent.invoke(
        Command(
            # 决策作为列表提供，每个待审查的操作一个。
            # 决策的顺序必须与 `__interrupt__` 请求中列出的操作顺序匹配。
            resume={
                "decisions": [
                    {
                        "type": "reject",
                        # 关于为何拒绝操作的解释
                        "message": "No, this is wrong because ..., instead do this ...",
                    }
                ]
            }
        ),
        config=config  # 相同的 thread ID 以恢复暂停的对话
    )
    ```
    :::

    :::js
    ```typescript
    await agent.invoke(
        new Command({
            // 决策作为列表提供，每个待审查的操作一个。
            # 决策的顺序必须与 `__interrupt__` 请求中列出的操作顺序匹配。
            resume: {
                decisions: [
                    {
                        type: "reject",
                        # 关于为何拒绝操作的解释
                        message: "No, this is wrong because ..., instead do this ...",
                    }
                ]
            }
        }),
        config  # 相同的 thread ID 以恢复暂停的对话
    );
    ```
    :::

`message` 作为反馈添加到对话中，帮助 Agent 理解为何拒绝操作以及应该做什么。

---

### 多个决策

当有多个操作待审查时，按照它们在中断中出现的顺序为每个操作提供决策：

:::python
```python
{
    "decisions": [
        {"type": "approve"},
        {
            "type": "edit",
            "edited_action": {
                "name": "tool_name",
                "args": {"param": "new_value"}
            }
        },
        {
            "type": "reject",
            "message": "This action is not allowed"
        }
    ]
}
```
:::

:::js
```typescript
{
    decisions: [
        { type: "approve" },
        {
            type: "edit",
            editedAction: {
                name: "tool_name",
                args: { param: "new_value" }
            }
        },
        {
            type: "reject",
            message: "This action is not allowed"
        }
    ]
}
```
:::

</Tab>
</Tabs>

## 使用 Human-in-the-Loop 进行 Streaming

你可以使用 `stream()` 而不是 `invoke()` 来在 Agent 运行和处理 interrupts 时获取实时更新。使用 `stream_mode=['updates', 'messages']` 来同时 stream Agent 进度和 LLM tokens。

:::python
```python
from langgraph.types import Command

config = {"configurable": {"thread_id": "some_id"}}

# Stream Agent 进度和 LLM tokens 直到 interrupt
for mode, chunk in agent.stream(
    {"messages": [{"role": "user", "content": "Delete old records from the database"}]},
    config=config,
    stream_mode=["updates", "messages"],  # [!code highlight]
):
    if mode == "messages":
        # LLM token
        token, metadata = chunk
        if token.content:
            print(token.content, end="", flush=True)
    elif mode == "updates":
        # 检查 interrupt
        if "__interrupt__" in chunk:
            print(f"\n\nInterrupt: {chunk['__interrupt__']}")

# 在人工决策后使用 streaming 恢复
for mode, chunk in agent.stream(
    Command(resume={"decisions": [{"type": "approve"}]}),
    config=config,
    stream_mode=["updates", "messages"],
):
    if mode == "messages":
        token, metadata = chunk
        if token.content:
            print(token.content, end="", flush=True)
```
:::

:::js
```typescript
import { Command } from "@langchain/langgraph";

const config = { configurable: { thread_id: "some_id" } };

// Stream Agent 进度和 LLM tokens 直到 interrupt
for await (const [mode, chunk] of await agent.stream(
    { messages: [{ role: "user", content: "Delete old records from the database" }] },
    { ...config, streamMode: ["updates", "messages"] }  # [!code highlight]
)) {
    if (mode === "messages") {
        # LLM token
        const [token, metadata] = chunk;
        if (token.content) {
            process.stdout.write(token.content);
        }
    } else if (mode === "updates") {
        # 检查 interrupt
        if ("__interrupt__" in chunk) {
            console.log(`\n\nInterrupt: ${JSON.stringify(chunk.__interrupt__)}`);
        }
    }
}

# 在人工决策后使用 streaming 恢复
for await (const [mode, chunk] of await agent.stream(
    new Command({ resume: { decisions: [{ type: "approve" }] } }),
    { ...config, streamMode: ["updates", "messages"] }
)) {
    if (mode === "messages") {
        const [token, metadata] = chunk;
        if (token.content) {
            process.stdout.write(token.content);
        }
    }
}
```
:::

有关 stream modes 的更多详情，请参阅 [Streaming](/oss/langchain/streaming) 指南。

## 执行生命周期

中间件定义了一个 `after_model` hook，在模型生成响应后但在任何 tool calls 执行前运行：

1. Agent 调用模型生成响应。
2. 中间件检查响应中的 tool calls。
3. 如果任何 calls 需要人工输入，中间件构建一个包含 `action_requests` 和 `review_configs` 的 `HITLRequest` 并调用 @[interrupt]。
4. Agent 等待人工决策。
5. 根据 `HITLResponse` 决策，中间件执行批准或编辑的 calls，为拒绝的 calls 合成 @[ToolMessage]，并恢复执行。

## 自定义 HITL 逻辑

对于更专业化的工作流，你可以直接使用 @[interrupt] primitive 和 [middleware](/oss/langchain/middleware) abstraction 构建自定义 HITL 逻辑。

查看上面的 [执行生命周期](#execution-lifecycle) 以了解如何将 interrupts 集成到 Agent 的操作中。
