---
title: 使用 LangChain 构建 RAG Agent
order: 7
section: "LangChain AI"
topic: "LangChain"
lang: "zh"
slug: "langchain-rag"
summary: "学习如何使用 LangChain 构建检索增强生成（RAG）应用，包括索引、检索和生成的完整流程。"
icon: "database"
featured: true
toc: true
updated: 2026-03-07
---

import ChatModelTabsPy from '/snippets/chat-model-tabs.mdx';
import ChatModelTabsJS from '/snippets/chat-model-tabs-js.mdx';
import EmbeddingsTabsPy from '/snippets/embeddings-tabs-py.mdx';
import EmbeddingsTabsJS from '/snippets/embeddings-tabs-js.mdx';
import VectorstoreTabsPy from '/snippets/vectorstore-tabs-py.mdx';
import VectorstoreTabsJS from '/snippets/vectorstore-tabs-js.mdx';

## 概述

LLM 实现的最强大的应用之一是复杂的问答（Q&A）聊天机器人。这些应用可以回答关于特定源信息的问题。这些应用使用一种称为检索增强生成（Retrieval Augmented Generation，或 [RAG](/oss/langchain/retrieval/)）的技术。

本教程将展示如何在非结构化文本数据源上构建一个简单的问答应用。我们将演示：

1. 一个 RAG [Agent](#rag-agents)，使用简单工具执行搜索。这是一个很好的通用实现。
2. 一个两步 RAG [Chain](#rag-chains)，每个查询只使用一次 LLM 调用。这是简单查询的快速有效方法。

### 概念

我们将涵盖以下概念：

- **索引（Indexing）**：从源摄取数据并对其进行索引的管道。*这通常在单独的进程中进行。*

- **检索和生成（Retrieval and generation）**：实际的 RAG 过程，在运行时获取用户查询并从索引中检索相关数据，然后将其传递给模型。

一旦我们索引了数据，我们将使用 [Agent](/oss/langchain/agents) 作为编排框架来实现检索和生成步骤。

<Note>
    本教程的索引部分将主要遵循 [语义搜索教程](/oss/langchain/knowledge-base)。

    如果你的数据已经可用于搜索（即，你有一个执行搜索的函数），或者你对该教程的内容感到满意，请随时跳至 [检索和生成](#2-retrieval-and-generation) 部分。
</Note>

### 预览

在本指南中，我们将构建一个回答网站内容问题的应用。我们将使用的具体网站是 Lilian Weng 的 [LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) 博客文章，它允许我们询问有关文章内容的问题。

我们可以创建一个简单的索引管道和 RAG Chain 来在约 40 行代码中完成此操作。请参阅下面的完整代码片段：

<Accordion title="展开完整代码片段">

:::python
```python
import bs4
from langchain.agents import AgentState, create_agent
from langchain_community.document_loaders import WebBaseLoader
from langchain.messages import MessageLikeRepresentation
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 加载和分块博客内容
loader = WebBaseLoader(
    web_paths=("https://lilianweng.github.io/posts/2023-06-23-agent/",),
    bs_kwargs=dict(
        parse_only=bs4.SoupStrainer(
            class_=("post-content", "post-title", "post-header")
        )
    ),
)
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
all_splits = text_splitter.split_documents(docs)

# 索引块
_ = vector_store.add_documents(documents=all_splits)

# 构建用于检索上下文的工具
@tool(response_format="content_and_artifact")
def retrieve_context(query: str):
    """检索信息以帮助回答问题。"""
    retrieved_docs = vector_store.similarity_search(query, k=2)
    serialized = "\n\n".join(
        (f"Source: {doc.metadata}\nContent: {doc.page_content}")
        for doc in retrieved_docs
    )
    return serialized, retrieved_docs

tools = [retrieve_context]
# 如果需要，指定自定义指令
prompt = (
    "你可以使用一个从博客文章中检索上下文的工具。"
    "使用该工具帮助回答用户查询。"
)
agent = create_agent(model, tools, system_prompt=prompt)
```

```python
query = "什么是任务分解？"
for step in agent.stream(
    {"messages": [{"role": "user", "content": query}]},
    stream_mode="values",
):
    step["messages"][-1].pretty_print()
```

```
================================ Human Message =================================

什么是任务分解？
================================== Ai Message ==================================
Tool Calls:
  retrieve_context (call_xTkJr8njRY0geNz43ZvGkX0R)
 Call ID: call_xTkJr8njRY0geNz43ZvGkX0R
  Args:
    query: task decomposition
================================= Tool Message =================================
Name: retrieve_context

Source: {'source': 'https://lilianweng.github.io/posts/2023-06-23-agent/'}
Content: Task decomposition can be done by...

Source: {'source': 'https://lilianweng.github.io/posts/2023-06-23-agent/'}
Content: Component One: Planning...
================================== Ai Message ==================================

Task decomposition refers to...
```
:::

:::js
```typescript
import "cheerio";
import { createAgent, tool } from "langchain";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import * as z from "zod";

// 加载和分块博客内容
const pTagSelector = "p";
const cheerioLoader = new CheerioWebBaseLoader(
  "https://lilianweng.github.io/posts/2023-06-23-agent/",
  {
    selector: pTagSelector
  }
);

const docs = await cheerioLoader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
});
const allSplits = await splitter.splitDocuments(docs);

// 索引块
await vectorStore.addDocuments(allSplits)

// 构建用于检索上下文的工具
const retrieveSchema = z.object({ query: z.string() });

const retrieve = tool(
  async ({ query }) => {
    const retrievedDocs = await vectorStore.similaritySearch(query, 2);
    const serialized = retrievedDocs
      .map(
        (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
      )
      .join("\n");
    return [serialized, retrievedDocs];
  },
  {
    name: "retrieve",
    description: "检索与查询相关的信息。",
    schema: retrieveSchema,
    responseFormat: "content_and_artifact",
  }
);

const agent = createAgent({ model: "gpt-5", tools: [retrieve] });
```

```typescript
let inputMessage = `什么是任务分解？`;

let agentInputs = { messages: [{ role: "user", content: inputMessage }] };

for await (const step of await agent.stream(agentInputs, {
  streamMode: "values",
})) {
  const lastMessage = step.messages[step.messages.length - 1];
  prettyPrint(lastMessage);
  console.log("-----\n");
}
```
:::

查看 [LangSmith 跟踪](https://smith.langchain.com/public/a117a1f8-c96c-4c16-a285-00b85646118e/r)。

</Accordion>

## 设置

### 安装

本教程需要以下 LangChain 依赖项：

:::python
<CodeGroup>
```bash pip
pip install langchain langchain-text-splitters langchain-community bs4
```
```bash uv
uv add langchain langchain-text-splitters langchain-community bs4
```
</CodeGroup>
:::

:::js
<CodeGroup>
```bash npm
npm i langchain @langchain/community @langchain/textsplitters
```
```bash yarn
yarn add langchain @langchain/community @langchain/textsplitters
```
```bash pnpm
pnpm add langchain @langchain/community @langchain/textsplitters
```
</CodeGroup>
:::

有关更多详情，请参阅我们的 [安装指南](/oss/langchain/install)。

### LangSmith

你使用 LangChain 构建的许多应用将包含多个步骤和多次 LLM 调用。随着这些应用变得更加复杂，能够检查你的 Chain 或 Agent 内部究竟发生了什么变得至关重要。最好的方法是使用 [LangSmith](https://smith.langchain.com)。

在上面的链接注册后，请确保设置环境变量以开始记录跟踪：

```shell
export LANGSMITH_TRACING="true"
export LANGSMITH_API_KEY="..."
```

:::python
或者，在 Python 中设置它们：

```python
import getpass
import os

os.environ["LANGSMITH_TRACING"] = "true"
os.environ["LANGSMITH_API_KEY"] = getpass.getpass()
```
:::

### 组件

我们需要从 LangChain 的集成套件中选择三个组件。

选择一个 Chat Model：
:::python
<ChatModelTabsPy />
:::

:::js
<ChatModelTabsJS />
:::

选择一个 Embeddings 模型：
:::python
<EmbeddingsTabsPy />
:::

:::js
<EmbeddingsTabsJS />
:::

选择一个 Vector Store：
:::python
<VectorstoreTabsPy />
:::

:::js
<VectorstoreTabsJS />
:::

## 1. 索引（Indexing）

<Note>
**本节是 [语义搜索教程](/oss/langchain/knowledge-base) 中内容的缩写版本。**

如果你的数据已经索引并可用于搜索（即，你有一个执行搜索的函数），或者如果你对 [Document Loaders](/oss/langchain/retrieval#document_loaders)、[Embeddings](/oss/langchain/retrieval#embedding_models) 和 [Vector Stores](/oss/langchain/retrieval#vectorstores) 感到满意，请随时跳至下一节 [检索和生成](/oss/langchain/rag#2-retrieval-and-generation)。
</Note>

索引通常的工作流程如下：

1. **加载（Load）**：首先我们需要加载数据。这是通过 [Document Loaders](/oss/langchain/retrieval#document_loaders) 完成的。
2. **分割（Split）**：[Text Splitters](/oss/langchain/retrieval#text_splitters) 将大型 `Documents` 分割成较小的块。这对于索引数据和将其传递给模型都很有用，因为大块更难搜索并且不适合模型的有限上下文窗口。
3. **存储（Store）**：我们需要 somewhere 来存储和索引我们的分割，以便以后可以搜索它们。这通常使用 [VectorStore](/oss/langchain/retrieval#vectorstores) 和 [Embeddings](/oss/langchain/retrieval#embedding_models) 模型完成。

![index_diagram](/images/rag_indexing.png)

### 加载文档

我们首先需要加载博客文章内容。我们可以使用 [DocumentLoaders](/oss/langchain/retrieval#document_loaders) 来完成，这是从源加载数据并返回 @[Document] 对象列表的对象。

:::python
在这种情况下，我们将使用 [`WebBaseLoader`](/oss/integrations/document_loaders/web_base)，它使用 `urllib` 从 Web URL 加载 HTML，并使用 `BeautifulSoup` 将其解析为文本。我们可以通过 `bs_kwargs` 将参数传递给 `BeautifulSoup` 解析器来自定义 HTML -> 文本解析（请参阅 [BeautifulSoup 文档](https://beautiful-soup-4.readthedocs.io/en/latest/#beautifulsoup)）。在这种情况下，只有类为"post-content"、"post-title"或"post-header"的 HTML 标签是相关的，所以我们将删除所有其他标签。

```python
import bs4
from langchain_community.document_loaders import WebBaseLoader

# 仅保留完整 HTML 中的帖子标题、页眉和内容。
bs4_strainer = bs4.SoupStrainer(class_=("post-title", "post-header", "post-content"))
loader = WebBaseLoader(
    web_paths=("https://lilianweng.github.io/posts/2023-06-23-agent/",),
    bs_kwargs={"parse_only": bs4_strainer},
)
docs = loader.load()

assert len(docs) == 1
print(f"总字符数：{len(docs[0].page_content)}")
```

```text
总字符数：43131
```

```python
print(docs[0].page_content[:500])
```

```text
      LLM Powered Autonomous Agents

Date: June 23, 2023  |  Estimated Reading Time: 31 min  |  Author: Lilian Weng


Building agents with LLM (large language model) as its core controller is a cool concept. Several proof-of-concepts demos, such as AutoGPT, GPT-Engineer and BabyAGI, serve as inspiring examples. The potentiality of LLM extends beyond generating well-written copies, stories, essays and programs; it can be framed as a powerful general problem solver.
Agent System Overview#
In
```
:::

:::js
```typescript
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

const pTagSelector = "p";
const cheerioLoader = new CheerioWebBaseLoader(
  "https://lilianweng.github.io/posts/2023-06-23-agent/",
  {
    selector: pTagSelector,
  }
);

const docs = await cheerioLoader.load();

console.assert(docs.length === 1);
console.log(`总字符数：${docs[0].pageContent.length}`);
```

```
总字符数：22360
```

```typescript
console.log(docs[0].pageContent.slice(0, 500));
```

```
Building agents with LLM (large language model) as its core controller is...
```
:::

**深入了解**

`DocumentLoader`：从源加载数据作为 `Documents` 列表的对象。

- [集成](/oss/integrations/document_loaders/)：160+ 集成可供选择。
- @[`BaseLoader`]：基础接口的 API 参考。

### 分割文档

我们加载的文档超过 4.2 万个字符，太长而无法适应许多模型的上下文窗口。即使对于那些可以将完整帖子放入其上下文窗口的模型，模型也很难在非常长的输入中找到信息。

为了解决这个问题，我们将把 @[`Document`] 分割成块以便嵌入和向量存储。这应该有助于我们在运行时只检索博客文章中最相关的部分。

与 [语义搜索教程](/oss/langchain/knowledge-base) 中一样，我们使用 `RecursiveCharacterTextSplitter`，它将递归地使用常见分隔符（如换行符）分割文档，直到每个块达到适当的大小。这是通用文本用例的推荐文本分割器。

:::python
```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,  # 块大小（字符）
    chunk_overlap=200,  # 块重叠（字符）
    add_start_index=True,  # 跟踪原始文档中的索引
)
all_splits = text_splitter.split_documents(docs)

print(f"将博客文章分割成 {len(all_splits)} 个子文档。")
```

```text
将博客文章分割成 66 个子文档。
```

**深入了解**

`TextSplitter`：将 @[`Document`] 对象列表分割成较小块以进行存储和检索的对象。

- [集成](/oss/integrations/splitters/)
- [接口](https://python.langchain.com/api_reference/text_splitters/base/langchain_text_splitters.base.TextSplitter.html)：基础接口的 API 参考。
:::

:::js
```typescript
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const allSplits = await splitter.splitDocuments(docs);
console.log(`将博客文章分割成 ${allSplits.length} 个子文档。`);
```

```
将博客文章分割成 29 个子文档。
```
:::

### 存储文档

现在我们需要索引 66 个文本块，以便在运行时搜索它们。遵循 [语义搜索教程](/oss/langchain/knowledge-base)，我们的方法是 [嵌入](/oss/langchain/retrieval#embedding_models/) 每个文档分割的内容，并将这些嵌入插入到 [Vector Store](/oss/langchain/retrieval#vectorstores/) 中。给定输入查询，我们可以使用向量搜索来检索相关文档。

我们可以使用在 [教程开始](/oss/langchain/rag#components) 选择的 Vector Store 和 Embeddings 模型在单个命令中嵌入和存储所有文档分割。

:::python
```python
document_ids = vector_store.add_documents(documents=all_splits)

print(document_ids[:3])
```

```python
['07c18af6-ad58-479a-bfb1-d508033f9c64', '9000bf8e-1993-446f-8d4d-f4e507ba4b8f', 'ba3b5d14-bed9-4f5f-88be-44c88aedc2e6']
```
:::

:::js
```typescript
await vectorStore.addDocuments(allSplits);
```
:::

**深入了解**

`Embeddings`：围绕文本嵌入模型的包装器，用于将文本转换为嵌入。

- [集成](/oss/integrations/text_embedding/)：30+ 集成可供选择。
- @[接口][Embeddings]：基础接口的 API 参考。

`VectorStore`：围绕向量数据库的包装器，用于存储和查询嵌入。

- [集成](/oss/integrations/vectorstores/)：40+ 集成可供选择。
- [接口](https://python.langchain.com/api_reference/core/vectorstores/langchain_core.vectorstores.base.VectorStore.html)：基础接口的 API 参考。

这完成了管道的 **索引** 部分。此时我们有一个可查询的 Vector Store，包含博客文章的分块内容。给定用户问题，我们应该能够返回回答该问题的博客文章片段。

## 2. 检索和生成（Retrieval and Generation）

RAG 应用通常的工作流程如下：

1. **检索（Retrieve）**：给定用户输入，使用 [Retriever](/oss/langchain/retrieval#retrievers) 从存储中检索相关分割。
2. **生成（Generate）**：[模型](/oss/langchain/models) 使用包含问题和检索数据的提示生成答案。

![retrieval_diagram](/images/rag_retrieval_generation.png)

现在让我们编写实际应用逻辑。我们希望创建一个简单的应用，接受用户问题，搜索与该问题相关的文档，将检索到的文档和初始问题传递给模型，并返回答案。

我们将演示：

1. 一个 RAG [Agent](#rag-agents)，使用简单工具执行搜索。这是一个很好的通用实现。
2. 一个两步 RAG [Chain](#rag-chains)，每个查询只使用一次 LLM 调用。这是简单查询的快速有效方法。

### RAG Agents

RAG 应用的一种形式是作为具有检索信息工具的简单 [Agent](/oss/langchain/agents)。我们可以通过实现包装 Vector Store 的 [工具](/oss/langchain/tools) 来组装一个最小的 RAG Agent：

:::python
```python
from langchain.tools import tool

@tool(response_format="content_and_artifact")
def retrieve_context(query: str):
    """检索信息以帮助回答问题。"""
    retrieved_docs = vector_store.similarity_search(query, k=2)
    serialized = "\n\n".join(
        (f"Source: {doc.metadata}\nContent: {doc.page_content}")
        for doc in retrieved_docs
    )
    return serialized, retrieved_docs
```

<Tip>
    这里我们使用 @[tool 装饰器][@tool] 配置工具，将原始文档作为 [artifacts](/oss/langchain/messages#param-artifact) 附加到每个 [ToolMessage](/oss/langchain/messages#tool-message)。这将让我们可以在应用中访问文档元数据，与发送给模型的字符串化表示分开。
</Tip>
:::

:::js
```typescript
import * as z from "zod";
import { tool } from "@langchain/core/tools";

const retrieveSchema = z.object({ query: z.string() });

const retrieve = tool(
  async ({ query }) => {
    const retrievedDocs = await vectorStore.similaritySearch(query, 2);
    const serialized = retrievedDocs
      .map(
        (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
      )
      .join("\n");
    return [serialized, retrievedDocs];
  },
  {
    name: "retrieve",
    description: "检索与查询相关的信息。",
    schema: retrieveSchema,
    responseFormat: "content_and_artifact",
  }
);
```

<Tip>
    这里我们将 `responseFormat` 指定为 `content_and_artifact` 以配置工具，将原始文档作为 [artifacts](/oss/langchain/messages#param-artifact) 附加到每个 [ToolMessage](/oss/langchain/messages#tool-message)。这将让我们可以在应用中访问文档元数据，与发送给模型的字符串化表示分开。
</Tip>
:::

:::python
<Tip>
    检索工具不限于单个字符串 `query` 参数，如上面的示例。你可以通过添加参数强制 LLM 指定额外的搜索参数——例如，一个类别：

    ```python
    from typing import Literal

    def retrieve_context(query: str, section: Literal["beginning", "middle", "end"]):
    ```
</Tip>
:::

给定我们的工具，我们可以构建 Agent：

:::python
```python
from langchain.agents import create_agent


tools = [retrieve_context]
# 如果需要，指定自定义指令
prompt = (
    "你可以使用一个从博客文章中检索上下文的工具。"
    "使用该工具帮助回答用户查询。"
)
agent = create_agent(model, tools, system_prompt=prompt)
```
:::

:::js
```typescript
import { createAgent } from "langchain";

const tools = [retrieve];
const systemPrompt = new SystemMessage(
    "你可以使用一个从博客文章中检索上下文的工具。" +
    "使用该工具帮助回答用户查询。"
)

const agent = createAgent({ model: "gpt-5", tools, systemPrompt });
```
:::

让我们测试一下。我们构建一个通常需要迭代检索步骤序列才能回答的问题：

:::python
```python
query = (
    "任务分解的标准方法是什么？\n\n"
    "得到答案后，查找该方法的常见扩展。"
)

for event in agent.stream(
    {"messages": [{"role": "user", "content": query}]},
    stream_mode="values",
):
    event["messages"][-1].pretty_print()
```

```
================================ Human Message =================================

任务分解的标准方法是什么？

得到答案后，查找该方法的常见扩展。
================================== Ai Message ==================================
Tool Calls:
  retrieve_context (call_d6AVxICMPQYwAKj9lgH4E337)
 Call ID: call_d6AVxICMPQYwAKj9lgH4E337
  Args:
    query: standard method for Task Decomposition
================================= Tool Message =================================
Name: retrieve_context

Source: {'source': 'https://lilianweng.github.io/posts/2023-06-23-agent/'}
Content: Task decomposition can be done...

Source: {'source': 'https://lilianweng.github.io/posts/2023-06-23-agent/'}
Content: Component One: Planning...
================================== Ai Message ==================================
Tool Calls:
  retrieve_context (call_0dbMOw7266jvETbXWn4JqWpR)
 Call ID: call_0dbMOw7266jvETbXWn4JqWpR
  Args:
    query: common extensions of the standard method for Task Decomposition
================================= Tool Message =================================
Name: retrieve_context

Source: {'source': 'https://lilianweng.github.io/posts/2023-06-23-agent/'}
Content: Task decomposition can be done...

Source: {'source': 'https://lilianweng.github.io/posts/2023-06-23-agent/'}
Content: Component One: Planning...
================================== Ai Message ==================================

The standard method for Task Decomposition often used is the Chain of Thought (CoT)...
```
:::

:::js
```typescript
let inputMessage = `任务分解的标准方法是什么？
得到答案后，查找该方法的常见扩展。`;

let agentInputs = { messages: [{ role: "user", content: inputMessage }] };

const stream = await agent.stream(agentInputs, {
  streamMode: "values",
});
for await (const step of stream) {
  const lastMessage = step.messages[step.messages.length - 1];
  console.log(`[${lastMessage.role}]: ${lastMessage.content}`);
  console.log("-----\n");
}
```

```
[human]: 任务分解的标准方法是什么？
得到答案后，查找该方法的常见扩展。
-----

[ai]:
Tools:
- retrieve({"query":"standard method for Task Decomposition"})
-----

[tool]: Source: https://lilianweng.github.io/posts/2023-06-23-agent/
Content: hard tasks into smaller and simpler steps...
Source: https://lilianweng.github.io/posts/2023-06-23-agent/
Content: System message:Think step by step and reason yourself...
-----

[ai]:
Tools:
- retrieve({"query":"common extensions of Task Decomposition method"})
-----

[tool]: Source: https://lilianweng.github.io/posts/2023-06-23-agent/
Content: hard tasks into smaller and simpler steps...
Source: https://lilianweng.github.io/posts/2023-06-23-agent/
Content: be provided by other developers (as in Plugins) or self-defined...
-----

[ai]: ### 任务分解的标准方法

任务分解的标准方法涉及...
-----
```
:::

注意 Agent：

1. 生成查询以搜索任务分解的标准方法；
2. 收到答案后，生成第二个查询以搜索其常见扩展；
3. 收到所有必要的上下文后，回答问题。

我们可以在 [LangSmith 跟踪](https://smith.langchain.com/public/7b42d478-33d2-4631-90a4-7cb731681e88/r) 中看到完整的步骤序列，以及延迟和其他元数据。

<Tip>
    你可以直接使用 [LangGraph](/oss/langgraph/overview) 框架添加更深层次的控制和自定义——例如，你可以添加步骤来评估文档相关性并重写搜索查询。查看 LangGraph 的 [Agentic RAG 教程](/oss/langgraph/agentic-rag) 了解更高级的表述。
</Tip>

### RAG Chains

在上面的 [Agentic RAG](#rag-agents) 表述中，我们允许 LLM 自行决定生成 [工具调用](/oss/langchain/models#tool-calling) 来帮助回答用户查询。这是一个很好的通用解决方案，但有一些权衡：

| ✅ 优点                                                                 | ⚠️ 缺点                                                                 |
|-----------------------------------------------------------------------------|----------------------------------------------------------------------------|
| **仅在需要时搜索** – LLM 可以处理问候、后续问题和简单查询，而无需触发不必要的搜索。 | **两次推理调用** – 执行搜索时，需要一个调用生成查询，另一个调用生成最终响应。 |
| **上下文搜索查询** – 通过将搜索视为具有 `query` 输入的工具，LLM 制作自己的查询，纳入对话上下文。 | **控制减少** – LLM 可能会在需要时跳过搜索，或在不需要时发出额外搜索。 |
| **允许多次搜索** – LLM 可以执行多次搜索以支持单个用户查询。 |                                                                            |

另一种常见的方法是两步 Chain，我们始终运行搜索（可能使用原始用户查询）并将结果作为单个 LLM 查询的上下文纳入。这导致每个查询一次推理调用，以灵活性为代价换取降低的延迟。

在这种方法中，我们不再循环调用模型，而是进行一次传递。

我们可以通过从 Agent 中移除工具并将检索步骤纳入自定义提示来实现这个 Chain：

:::python
```python
from langchain.agents.middleware import dynamic_prompt, ModelRequest

@dynamic_prompt
def prompt_with_context(request: ModelRequest) -> str:
    """将上下文注入状态消息。"""
    last_query = request.state["messages"][-1].text
    retrieved_docs = vector_store.similarity_search(last_query)

    docs_content = "\n\n".join(doc.page_content for doc in retrieved_docs)

    system_message = (
        "你是一个有用的助手。在你的响应中使用以下上下文："
        f"\n\n{docs_content}"
    )

    return system_message


agent = create_agent(model, tools=[], middleware=[prompt_with_context])
```
:::

:::js
```typescript
import { createAgent, dynamicSystemPromptMiddleware } from "langchain";
import { SystemMessage } from "@langchain/core/messages";

const agent = createAgent({
  model,
  tools: [],
  middleware: [
    dynamicSystemPromptMiddleware(async (state) => {
        const lastQuery = state.messages[state.messages.length - 1].content;

        const retrievedDocs = await vectorStore.similaritySearch(lastQuery, 2);

        const docsContent = retrievedDocs
        .map((doc) => doc.pageContent)
        .join("\n\n");

        // 构建系统消息
        const systemMessage = new SystemMessage(
        `你是一个有用的助手。在你的响应中使用以下上下文：\n\n${docsContent}`
        );

        // 返回系统 + 现有消息
        return [systemMessage, ...state.messages];
    })
  ]
});
```
:::

让我们试试这个：

:::python
```python
query = "什么是任务分解？"
for step in agent.stream(
    {"messages": [{"role": "user", "content": query}]},
    stream_mode="values",
):
    step["messages"][-1].pretty_print()
```

```
================================ Human Message =================================

什么是任务分解？
================================== Ai Message ==================================

Task decomposition is...
```
:::

:::js
```typescript
let inputMessage = `什么是任务分解？`;

let chainInputs = { messages: [{ role: "user", content: inputMessage }] };

const stream = await agent.stream(chainInputs, {
  streamMode: "values",
})
for await (const step of stream) {
  const lastMessage = step.messages[step.messages.length - 1];
  prettyPrint(lastMessage);
  console.log("-----\n");
}
```
:::

在 [LangSmith 跟踪](https://smith.langchain.com/public/0322904b-bc4c-4433-a568-54c6b31bbef4/r/9ef1c23e-380e-46bf-94b3-d8bb33df440c) 中，我们可以看到检索到的上下文被纳入模型提示中。

这是一种快速有效的方法，适用于受限环境中的简单查询，当我们通常确实想通过语义搜索运行用户查询以获取额外上下文时。

<Accordion title="返回源文档">

上面的 [RAG Chain](#rag-chains) 将检索到的上下文纳入该运行的单个系统消息中。

与 [Agentic RAG](#rag-agents) 表述中一样，我们有时希望在应用状态中包含原始源文档以访问文档元数据。对于两步 Chain 情况，我们可以通过以下方式实现：

1. 在状态中添加一个键来存储检索到的文档
2. 通过 [pre-model hook](/oss/langchain/agents#pre-model-hook) 添加一个新节点来填充该键（以及注入上下文）。

:::python
```python
from typing import Any
from langchain_core.documents import Document
from langchain.agents.middleware import AgentMiddleware, AgentState


class State(AgentState):
    context: list[Document]


class RetrieveDocumentsMiddleware(AgentMiddleware[State]):
    state_schema = State

    def before_model(self, state: AgentState) -> dict[str, Any] | None:
        last_message = state["messages"][-1]
        retrieved_docs = vector_store.similarity_search(last_message.text)

        docs_content = "\n\n".join(doc.page_content for doc in retrieved_docs)

        augmented_message_content = (
            f"{last_message.text}\n\n"
            "使用以下上下文回答问题：\n"
            f"{docs_content}"
        )
        return {
            "messages": [last_message.model_copy(update={"content": augmented_message_content})],
            "context": retrieved_docs,
        }


agent = create_agent(
    model,
    tools=[],
    middleware=[RetrieveDocumentsMiddleware()],
)
```
:::

:::js
```typescript
import { createMiddleware, Document, createAgent } from "langchain";
import { StateSchema, MessagesValue } from "@langchain/langgraph";
import { z } from "zod";

const CustomState = new StateSchema({
  messages: MessagesValue,
  context: z.array(z.custom<Document>()),
});

const retrieveDocumentsMiddleware = createMiddleware({
  stateSchema: CustomState,
  beforeModel: async (state) => {
    const lastMessage = state.messages[state.messages.length - 1].content;
    const retrievedDocs = await vectorStore.similaritySearch(lastMessage, 2);

    const docsContent = retrievedDocs
      .map((doc) => doc.pageContent)
      .join("\n\n");

    const augmentedMessageContent = [
        ...lastMessage.content,
        { type: "text", text: `使用以下上下文回答问题：\n\n${docsContent}` }
    ]

    // 下面我们用上下文增强每个输入消息，但我们也可能
    // 只修改系统消息，如前所述。
    return {
      messages: [{
        ...lastMessage,
        content: augmentedMessageContent,
      }]
      context: retrievedDocs,
    }
  },
});

const agent = createAgent({
  model,
  tools: [],
  middleware: [retrieveDocumentsMiddleware],
});
```
:::
</Accordion>

## 下一步

:::python
现在我们已经通过 @[`create_agent`] 实现了一个简单的 RAG 应用，我们可以轻松纳入新功能并深入探索：
:::

:::js
现在我们已经通过 @[`createAgent`] 实现了一个简单的 RAG 应用，我们可以轻松纳入新功能并深入探索：
:::

- [流式传输](/oss/langchain/streaming) token 和其他信息以获得响应式用户体验
- 添加 [对话记忆](/oss/langchain/short-term-memory) 以支持多轮交互
- 添加 [长期记忆](/oss/langchain/long-term-memory) 以支持跨对话线程的记忆
- 添加 [结构化响应](/oss/langchain/structured-output)
- 使用 [LangSmith 部署](/langsmith/deployments) 部署你的应用
