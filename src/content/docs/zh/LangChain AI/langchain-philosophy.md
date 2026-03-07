---
title: 理念
description: LangChain 的存在是为了成为开始使用 LLM 进行构建的最简单地方，同时也具备灵活性和生产就绪性。
order: 26
section: "LangChain AI"
topic: "设计理念"
lang: "zh"
slug: "langchain-philosophy"
summary: LangChain 的核心理念和发展历史
icon: "lucide:lightbulb"
featured: false
toc: true
updated: 2026-03-07
mode: wide
---

LangChain 由几个核心信念驱动：

- 大型语言模型（LLM）是一项伟大的新技术。
- 当 LLM 与外部数据源结合时，它们会更加强大。
- LLM 将改变未来应用的面貌。具体来说，未来的应用将越来越具有 agent 特性。
- 这种转变仍处于非常早期的阶段。
- 虽然构建这些 agent 应用的原型很容易，但构建足够可靠以投入生产的 agent 仍然非常困难。

在 LangChain 中，我们有两个核心关注点：

<Steps>
    <Step title="我们想让开发者能够使用最好的模型进行构建。">
        不同的提供商暴露不同的 API，具有不同的模型参数和不同的消息格式。
        标准化这些模型的输入和输出是核心关注点，使开发者能够轻松切换到最新的最先进的模型，避免被锁定。
    </Step>
    <Step title="我们想让使用模型编排更复杂的流程变得简单，这些流程与其他数据和计算交互。">
        模型的应用不应仅限于*文本生成*——它们还应被用于编排与其他数据交互的更复杂流程。LangChain 使定义 LLM 可以动态使用的 [工具](/oss/langchain/tools) 变得简单，并帮助解析和访问非结构化数据。
    </Step>
</Steps>

## 历史

鉴于该领域不断变化，LangChain 也随着时间的推移而发展。以下是 LangChain 多年来如何变化的简要时间线，与使用 LLM 进行构建的含义一起演进：

<Update label="2022-10-24" description="v0.0.1">
    在 ChatGPT 发布前一个月，**LangChain 作为 Python 包推出**。它由两个主要组件组成：

    - LLM 抽象
    - "Chains"，或为常见用例运行的预定计算步骤。例如 - RAG：运行检索步骤，然后运行生成步骤。

    名称 LangChain 来自 "Language"（如语言模型）和 "Chains"。
</Update>

<Update label="2022-12">
    第一个通用 agent 被添加到 LangChain 中。

    这些通用 agent 基于 [ReAct 论文](https://arxiv.org/abs/2210.03629)（ReAct 代表 Reasoning 和 Acting）。它们使用 LLM 生成表示工具调用的 JSON，然后解析该 JSON 以确定调用哪些工具。
</Update>

<Update label="2023-01">
    OpenAI 发布了 'Chat Completion' API。

    此前，模型接收字符串并返回字符串。在 ChatCompletions API 中，它们演变为接收消息列表并返回消息。其他模型提供商也纷纷效仿，LangChain 更新为与消息列表一起工作。
</Update>

<Update label="2023-01">
    LangChain 发布 JavaScript 版本。

    LLM 和 agent 将改变应用的构建方式，而 JavaScript 是应用开发者的语言。
</Update>

<Update label="2023-02">
    **LangChain Inc. 作为一家公司成立**，围绕开源 LangChain 项目。

    主要目标是 "让智能 agent 无处不在"。团队认识到，虽然 LangChain 是关键部分（LangChain 使开始使用 LLM 变得简单），但也需要其他组件。
</Update>

<Update label="2023-03">
    OpenAI 在其 API 中发布 'function calling'。

    这允许 API 显式生成表示工具调用的 payload。其他模型提供商也纷纷效仿，LangChain 更新为使用此方法作为工具调用的首选方法（而不是解析 JSON）。
</Update>

<Update label="2023-06">
    **LangSmith 发布**，作为 LangChain Inc. 提供的闭源平台，提供可观测性和评估。

    构建 agent 的主要问题是如何让它们变得可靠，而 LangSmith（提供可观测性和评估）就是为了解决这一需求而构建的。LangChain 已更新为与 LangSmith 无缝集成。
</Update>

<Update label="2024-01" description="v0.1.0">
    **LangChain 发布 0.1.0**，这是第一个非 0.0.x 版本。

    行业从原型走向生产，因此，LangChain 增加了对稳定性的关注。
</Update>

<Update label="2024-02">
    **LangGraph 作为开源库发布**。

    原始 LangChain 有两个关注点：LLM 抽象和用于开始常见应用的高级接口；然而，它缺少一个低级编排层，让开发者控制 agent 的确切流程。于是：LangGraph 诞生了。

    在构建 LangGraph 时，我们从构建 LangChain 的经验中吸取了教训，并添加了我们发现需要的功能：流式传输、持久执行、短期记忆、人在回路（human-in-the-loop）等。
</Update>

<Update label="2024-06">
    **LangChain 拥有超过 700 个集成。**

    :::python
    集成从核心 LangChain 包中分离出来，要么移动到独立的包中（对于核心集成），要么移动到 `langchain-community`。
    :::
    :::js
    集成从核心 LangChain 包中分离出来，要么移动到独立的包中（对于核心集成），要么移动到 `@langchain/community`。
    :::
</Update>

<Update label="2024-10">
    LangGraph 成为构建任何超过单个 LLM 调用的 AI 应用的首选方式。

    随着开发者试图提高应用的可靠性，他们需要比高级接口提供的更多控制。LangGraph 提供了这种低级灵活性。LangChain 中的大多数 chains 和 agent 都被标记为弃用，并提供了如何迁移到 LangGraph 的指南。LangGraph 中仍然创建了一个高级抽象：一个 agent 抽象。它构建在低级 LangGraph 之上，具有与 LangChain 中的 ReAct agent 相同的接口。
</Update>

<Update label="2025-04">
    模型 API 变得更加多模态。

    :::python
    模型开始接受文件、图像、视频等。我们相应地更新了 `langchain-core` 消息格式，使开发者能够以标准方式指定这些多模态输入。
    :::
    :::js
    模型开始接受文件、图像、视频等。我们相应地更新了 `@langchain/core` 消息格式，使开发者能够以标准方式指定这些多模态输入。
    :::
</Update>

<Update label="2025-10-20" description="v1.0.0">
    **LangChain 发布 1.0**，有两个重大变化：

    1. 完全重构 `langchain` 中的所有 chains 和 agent。所有 chains 和 agent 现在仅替换为一个高级抽象：一个构建在 LangGraph 之上的 agent 抽象。这是最初在 LangGraph 中创建的高级抽象，只是迁移到了 LangChain。

        :::python
        对于仍在使用旧版 LangChain chains/agents 且不想升级的用户（注意：我们建议你升级），你可以通过安装 `langchain-classic` 包继续使用旧版 LangChain。
        :::
        :::js
        对于仍在使用旧版 LangChain chains/agents 且不想升级的用户（注意：我们建议你升级），你可以通过安装 `@langchain/classic` 包继续使用旧版 LangChain。
        :::

    2. 标准消息内容格式：模型 API 从返回具有简单内容字符串的消息演变为更复杂的输出类型——推理块、引用、服务器端工具调用等。LangChain 演进了其消息格式以跨提供商标准化这些内容。
</Update>
