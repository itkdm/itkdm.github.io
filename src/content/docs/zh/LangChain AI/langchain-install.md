---
title: 安装 LangChain
order: 1
section: 入门指南
topic: "安装指南"
lang: zh
slug: /zh/LangChain AI/langchain-install
summary: 学习如何安装 LangChain Python 和 JavaScript 包，包括核心包和各类集成包。
icon: "download"
featured: true
toc: true
updated: 2026-03-07
---

# 安装 LangChain

要安装 LangChain 包：

:::python
<CodeGroup>
    ```bash pip
    pip install -U langchain
    # 需要 Python 3.10+
    ```

    ```bash uv
    uv add langchain
    # 需要 Python 3.10+
    ```
</CodeGroup>
:::

:::js
    <CodeGroup>
    ```bash npm
    npm install langchain @langchain/core
    # 需要 Node.js 20+
    ```

    ```bash pnpm
    pnpm add langchain @langchain/core
    # 需要 Node.js 20+
    ```

    ```bash yarn
    yarn add langchain @langchain/core
    # 需要 Node.js 20+
    ```

    ```bash bun
    bun add langchain @langchain/core
    # 需要 Bun v1.0.0+
    ```
    </CodeGroup>
:::

LangChain 提供了与数百个 LLM 和数千个其他集成的整合。这些整合存在于独立的 provider 包中。

:::python
<CodeGroup>
    ```bash pip
    # 安装 OpenAI 集成
    pip install -U langchain-openai

    # 安装 Anthropic 集成
    pip install -U langchain-anthropic
    ```
    ```bash uv
    # 安装 OpenAI 集成
    uv add langchain-openai

    # 安装 Anthropic 集成
    uv add langchain-anthropic
    ```
</CodeGroup>

:::

:::js
<CodeGroup>
    ```bash npm
    # 安装 OpenAI 集成
    npm install @langchain/openai
    # 安装 Anthropic 集成
    npm install @langchain/anthropic
    ```

    ```bash pnpm
    # 安装 OpenAI 集成
    pnpm install @langchain/openai
    # 安装 Anthropic 集成
    pnpm install @langchain/anthropic
    ```

    ```bash yarn
    # 安装 OpenAI 集成
    yarn add @langchain/openai
    # 安装 Anthropic 集成
    yarn add @langchain/anthropic
    ```

    ```bash bun
    # 安装 OpenAI 集成
    bun add @langchain/openai
    # 安装 Anthropic 集成
    bun add @langchain/anthropic
    ```
</CodeGroup>
:::

<Tip>
查看 [Integrations tab](/oss/integrations/providers/overview) 获取完整可用集成列表。
</Tip>

现在你已经安装了 LangChain，可以通过 [Quickstart guide](/oss/langchain/quickstart) 开始使用。
