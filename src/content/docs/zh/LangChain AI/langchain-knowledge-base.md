---
title: 使用 LangChain 构建语义搜索引擎
order: 18
section: "LangChain AI"
topic: "知识库"
lang: "zh"
slug: "langchain-knowledge-base"
summary: 学习如何使用 LangChain 构建 PDF 文档的语义搜索引擎
icon: "search"
featured: true
toc: true
updated: 2026-03-07
---

import EmbeddingsTabsPy from '/snippets/embeddings-tabs-py.mdx';
import EmbeddingsTabsJS from '/snippets/embeddings-tabs-js.mdx';
import VectorstoreTabsPy from '/snippets/vectorstore-tabs-py.mdx';
import VectorstoreTabsJS from '/snippets/vectorstore-tabs-js.mdx';

## 概述

本教程将帮助你熟悉 LangChain 的 [document loader](/oss/langchain/retrieval#document-loaders)、[embedding](/oss/langchain/retrieval#embedding-models) 和 [vector store](/oss/langchain/retrieval#vector-store) 抽象。这些抽象旨在支持从（向量）数据库和其他来源检索数据，以便与 LLM 工作流集成。它们对于在模型推理期间获取要推理的数据的应用程序非常重要，如 retrieval-augmented generation 或 [RAG](/oss/langchain/retrieval)。

在这里，我们将构建一个 PDF 文档搜索引擎。这将允许我们检索 PDF 中与输入查询相似的段落。本指南还包括在搜索引擎之上的最小 RAG 实现。

### 概念

本指南专注于文本数据的检索。我们将涵盖以下概念：

- [Documents and document loaders](/oss/integrations/document_loaders);
- [Text splitters](/oss/integrations/splitters);
- [Embeddings](/oss/integrations/text_embedding);
- [Vector stores](/oss/integrations/vectorstores) 和 [retrievers](/oss/integrations/retrievers)。

## 设置

### 安装

:::python

本教程需要 `langchain-community` 和 `pypdf` 包：

<CodeGroup>
```bash pip
pip install langchain-community pypdf
```
```bash conda
conda install langchain-community pypdf -c conda-forge
```
```bash uv
uv add langchain-community pypdf
```
</CodeGroup>

:::

:::js

本指南需要 `@langchain/community` 和 `pdf-parse`：

<CodeGroup>
```bash npm
npm i @langchain/community pdf-parse
```
```bash yarn
yarn add @langchain/community pdf-parse
```
```bash pnpm
pnpm add @langchain/community pdf-parse
```
</CodeGroup>

:::

有关更多详情，请参阅我们的 [Installation guide](/oss/langchain/install)。

### LangSmith

你使用 LangChain 构建的许多应用程序将包含多个步骤和多次 LLM 调用。
随着这些应用程序变得越来越复杂，能够检查你的 chain 或 agent 内部到底发生了什么变得至关重要。
最好的方法是使用 [LangSmith](https://smith.langchain.com)。

在上面的链接注册后，确保设置环境变量以开始记录 traces：

```shell
export LANGSMITH_TRACING="true"
export LANGSMITH_API_KEY="..."
```

:::python

或者，如果在 notebook 中，你可以使用以下命令设置它们：

```python
import getpass
import os

os.environ["LANGSMITH_TRACING"] = "true"
os.environ["LANGSMITH_API_KEY"] = getpass.getpass()
```

:::

## 1. Documents and document loaders

LangChain 实现了 @[Document] 抽象，旨在表示文本单元和相关元数据。它有三个属性：

:::python
- `page_content`: 表示内容的字符串；
- `metadata`: 包含任意元数据的 dict；
- `id`: （可选）文档的字符串标识符。
:::
:::js
- `pageContent`: 表示内容的字符串；
- `metadata`: 包含任意元数据的 dict；
- `id`: （可选）文档的字符串标识符。
:::

`metadata` 属性可以捕获有关文档来源、其与其他文档的关系以及其他信息的信息。请注意，单个 @[`Document`] 对象通常表示较大文档的块。

我们可以在需要时生成示例文档：

:::python
```python
from langchain_core.documents import Document

documents = [
    Document(
        page_content="Dogs are great companions, known for their loyalty and friendliness.",
        metadata={"source": "mammal-pets-doc"},
    ),
    Document(
        page_content="Cats are independent pets that often enjoy their own space.",
        metadata={"source": "mammal-pets-doc"},
    ),
]
```
:::
:::js
```typescript
import { Document } from "@langchain/core/documents";

const documents = [
  new Document({
    pageContent:
      "Dogs are great companions, known for their loyalty and friendliness.",
    metadata: { source: "mammal-pets-doc" },
  }),
  new Document({
    pageContent: "Cats are independent pets that often enjoy their own space.",
    metadata: { source: "mammal-pets-doc" },
  }),
];
```
:::

但是，LangChain 生态系统实现了 [document loaders](/oss/langchain/retrieval#document-loaders)，[与数百个常见来源集成](/oss/integrations/document_loaders/)。这使得将来自这些来源的数据轻松集成到你的 AI 应用程序中。

### Loading documents

让我们将 PDF 加载到 @[Document] 对象序列中。[这是一个示例 PDF](https://github.com/langchain-ai/langchain/blob/v0.3/docs/docs/example_data/nke-10k-2023.pdf) — Nike 2023 年的 10-k 文件。我们可以查阅 LangChain 文档以获取 [可用的 PDF document loaders](/oss/integrations/document_loaders/#pdfs)。

:::python
```python
from langchain_community.document_loaders import PyPDFLoader

file_path = "../example_data/nke-10k-2023.pdf"
loader = PyPDFLoader(file_path)

docs = loader.load()

print(len(docs))
```
```text
107
```

`PyPDFLoader` 每个 PDF 页面加载一个 @[`Document`] 对象。对于每个对象，我们可以轻松访问：

- 页面的字符串内容；
- 包含文件名和页码的元数据。
:::
:::js
```typescript
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const loader = new PDFLoader("../../data/nke-10k-2023.pdf");

const docs = await loader.load();
console.log(docs.length);
```
```text
107
```

`PDFLoader` 每个 PDF 页面加载一个 @[`Document`] 对象。对于每个对象，我们可以轻松访问：

- 页面的字符串内容；
- 包含文件名和页码的元数据。
:::

:::python
```python
print(f"{docs[0].page_content[:200]}\n")
print(docs[0].metadata)
```
```python
Table of Contents
UNITED STATES
SECURITIES AND EXCHANGE COMMISSION
Washington, D.C. 20549
FORM 10-K
(Mark One)
☑ ANNUAL REPORT PURSUANT TO SECTION 13 OR 15(D) OF THE SECURITIES EXCHANGE ACT OF 1934
FO

{'source': '../example_data/nke-10k-2023.pdf', 'page': 0}
```
:::
:::js
```typescript
console.log(docs[0].pageContent.slice(0, 200));
```
```text
Table of Contents
UNITED STATES
SECURITIES AND EXCHANGE COMMISSION
Washington, D.C. 20549
FORM 10-K
(Mark One)
☑ ANNUAL REPORT PURSUANT TO SECTION 13 OR 15(D) OF THE SECURITIES EXCHANGE ACT OF 1934
FO
```
```typescript
console.log(docs[0].metadata);
```
```javascript
{
  source: '../../data/nke-10k-2023.pdf',
  pdf: {
    version: '1.10.100',
    info: {
      PDFFormatVersion: '1.4',
      IsAcroFormPresent: false,
      IsXFAPresent: false,
      Title: '0000320187-23-000039',
      Author: 'EDGAR Online, a division of Donnelley Financial Solutions',
      Subject: 'Form 10-K filed on 2023-07-20 for the period ending 2023-05-31',
      Keywords: '0000320187-23-000039; ; 10-K',
      Creator: 'EDGAR Filing HTML Converter',
      Producer: 'EDGRpdf Service w/ EO.Pdf 22.0.40.0',
      CreationDate: "D:20230720162200-04'00'",
      ModDate: "D:20230720162208-04'00'"
    },
    metadata: null,
    totalPages: 107
  },
  loc: { pageNumber: 1 }
}
```
:::

### Splitting

对于信息检索和下游问答目的，页面可能表示太粗粒度。我们的最终目标是检索回答输入查询的 @[`Document`] 对象，进一步分割我们的 PDF 将有助于确保文档相关部分的含义不会被周围文本"冲淡"。

我们可以为此使用 [text splitters](/oss/langchain/retrieval#text_splitters)。在这里，我们将使用一个简单的文本 splitter，基于字符进行分区。我们将文档分割成 1000 个字符的块，块之间有 200 个字符的重叠。重叠有助于降低将陈述与其相关的重要上下文分离的可能性。我们使用 `RecursiveCharacterTextSplitter`，它将递归地使用常见分隔符（如新行）分割文档，直到每个块达到适当大小。这是通用文本用例的推荐文本 splitter。

:::python
我们设置 `add_start_index=True`，以便每个分割的 Document 在初始 Document 中开始的字符索引作为元数据属性"start_index"保留。

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, chunk_overlap=200, add_start_index=True
)
all_splits = text_splitter.split_documents(docs)

print(len(all_splits))
```
:::
:::js
```typescript
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const allSplits = await textSplitter.splitDocuments(docs);

console.log(allSplits.length);
```
:::

```text
514
```


## 2. Embeddings

Vector search 是一种存储和搜索非结构化数据（如非结构化文本）的常见方法。其想法是存储与文本关联的数字向量。给定查询，我们可以将其 [embed](/oss/langchain/retrieval#embedding_models) 为相同维度的向量，并使用向量相似度指标（如 cosine similarity）来识别相关文本。

LangChain 支持来自 [数十个 providers](/oss/integrations/text_embedding/) 的 embeddings。这些模型指定文本应如何转换为数字向量。让我们选择一个模型：

:::python
<EmbeddingsTabsPy />

```python
vector_1 = embeddings.embed_query(all_splits[0].page_content)
vector_2 = embeddings.embed_query(all_splits[1].page_content)

assert len(vector_1) == len(vector_2)
print(f"Generated vectors of length {len(vector_1)}\n")
print(vector_1[:10])
```
:::
:::js
<EmbeddingsTabsJS />

```typescript
const vector1 = await embeddings.embedQuery(allSplits[0].pageContent);
const vector2 = await embeddings.embedQuery(allSplits[1].pageContent);

assert vector1.length === vector2.length;
console.log(`Generated vectors of length ${vector1.length}\n`);
console.log(vector1.slice(0, 10));
```
:::

```text
Generated vectors of length 1536

[-0.008586574345827103, -0.03341241180896759, -0.008936782367527485, -0.0036674530711025, 0.010564599186182022, 0.009598285891115665, -0.028587326407432556, -0.015824200585484505, 0.0030416189692914486, -0.012899317778646946]
```
有了生成文本 embeddings 的模型，我们接下来可以将它们存储在支持高效相似度搜索的特殊数据结构中。

## 3. Vector stores

LangChain @[VectorStore] 对象包含将文本和 @[`Document`] 对象添加到存储的方法，以及使用各种相似度指标查询它们的方法。它们通常使用 [embedding](/oss/langchain/retrieval#embedding_models) 模型初始化，这些模型决定文本数据如何转换为数字向量。

LangChain 包括与不同 vector store 技术的一套 [integrations](/oss/integrations/vectorstores)。一些 vector stores 由 provider 托管（例如，各种 cloud providers），需要特定凭据才能使用；一些（如 [Postgres](/oss/integrations/vectorstores/pgvector)）在可以本地运行或通过第三方运行的单独基础设施中运行；其他可以在内存中运行以处理轻量级工作负载。让我们选择一个 vector store：

:::python
<VectorstoreTabsPy />
:::
:::js
<VectorstoreTabsJS />
:::

实例化 vector store 后，我们现在可以索引文档。

:::python
```python
ids = vector_store.add_documents(documents=all_splits)
```
:::
:::js
```typescript
await vectorStore.addDocuments(allSplits);
```
:::

请注意，大多数 vector store 实现将允许你连接到现有的 vector store — 例如，通过提供 client、index name 或其他信息。有关更多详情，请参阅特定 [integration](/oss/integrations/vectorstores) 的文档。

:::python

一旦我们实例化了包含文档的 @[`VectorStore`]，我们就可以查询它。@[VectorStore] 包括查询方法：
- 同步和异步；
- 通过字符串查询和通过向量；
- 带和不带返回相似度分数；
- 通过相似度和 @[maximum marginal relevance][VectorStore.max_marginal_relevance_search]（以平衡与查询的相似度和检索结果的多样性）。

:::

:::js

一旦我们实例化了包含文档的 @[`VectorStore`]，我们就可以查询它。@[VectorStore] 包括查询方法：
- 同步和异步；
- 通过字符串查询和通过向量；
- 带和不带返回相似度分数；
- 通过相似度和 @[maximum marginal relevance][VectorStore.maxMarginalRelevanceSearch]（以平衡与查询的相似度和检索结果的多样性）。

:::

方法通常将在其输出中包含 @[Document] 对象列表。

**Usage**

Embeddings 通常将文本表示为"dense"向量，使得具有相似含义的文本在几何上接近。这让我们能够通过传入问题来检索相关信息，而无需了解文档中使用的任何特定关键术语。

返回基于与字符串查询相似度的文档：

:::python
```python
results = vector_store.similarity_search(
    "How many distribution centers does Nike have in the US?"
)

print(results[0])
```
```python
page_content='direct to consumer operations sell products through the following number of retail stores in the United States:
U.S. RETAIL STORES NUMBER
NIKE Brand factory stores 213
NIKE Brand in-line stores (including employee-only stores) 74
Converse stores (including factory stores) 82
TOTAL 369
In the United States, NIKE has eight significant distribution centers. Refer to Item 2. Properties for further information.
2023 FORM 10-K 2' metadata={'page': 4, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 3125}
```
:::
:::js
```typescript
const results1 = await vectorStore.similaritySearch(
  "When was Nike incorporated?"
);

console.log(results1[0]);
```
```javascript
Document {
    pageContent: 'direct to consumer operations sell products...',
    metadata: {'page': 4, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 3125}
}
```
:::

:::python
异步查询：

```python
results = await vector_store.asimilarity_search("When was Nike incorporated?")

print(results[0])
```
```python
page_content='Table of Contents
PART I
ITEM 1. BUSINESS
GENERAL
NIKE, Inc. was incorporated in 1967 under the laws of the State of Oregon. As used in this Annual Report on Form 10-K (this "Annual Report"), the terms "we," "us," "our,"
"NIKE" and the "Company" refer to NIKE, Inc. and its predecessors, subsidiaries and affiliates, collectively, unless the context indicates otherwise.
Our principal business activity is the design, development and worldwide marketing and selling of athletic footwear, apparel, equipment, accessories and services. NIKE is
the largest seller of athletic footwear and apparel in the world. We sell our products through NIKE Direct operations, which are comprised of both NIKE-owned retail stores
and sales through our digital platforms (also referred to as "NIKE Brand Digital"), to retail accounts and to a mix of independent distributors, licensees and sales' metadata={'page': 3, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 0}
```
:::

返回分数：

:::python
```python
# 请注意，providers 实现不同的分数；这里的分数
# 是与相似度成反比的距离指标。

results = vector_store.similarity_search_with_score("What was Nike's revenue in 2023?")
doc, score = results[0]
print(f"Score: {score}\n")
print(doc)
```
```python
Score: 0.23699893057346344

page_content='Table of Contents
FISCAL 2023 NIKE BRAND REVENUE HIGHLIGHTS
The following tables present NIKE Brand revenues disaggregated by reportable operating segment, distribution channel and major product line:
FISCAL 2023 COMPARED TO FISCAL 2022
•NIKE, Inc. Revenues were $51.2 billion in fiscal 2023, which increased 10% and 16% compared to fiscal 2022 on a reported and currency-neutral basis, respectively.
The increase was due to higher revenues in North America, Europe, Middle East & Africa ("EMEA"), APLA and Greater China, which contributed approximately 7, 6,
2 and 1 percentage points to NIKE, Inc. Revenues, respectively.
•NIKE Brand revenues, which represented over 90% of NIKE, Inc. Revenues, increased 10% and 16% on a reported and currency-neutral basis, respectively. This
increase was primarily due to higher revenues in Men's, the Jordan Brand, Women's and Kids' which grew 17%, 35%,11% and 10%, respectively, on a wholesale
equivalent basis.' metadata={'page': 35, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 0}
```
:::
:::js
```typescript
const results2 = await vectorStore.similaritySearchWithScore(
  "What was Nike's revenue in 2023?"
);

console.log(results2[0]);
```
```javascript
Score: 0.23699893057346344

Document {
    pageContent: 'Table of Contents...',
    metadata: {'page': 35, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 0}
}
```
:::

返回基于与 embedded 查询相似度的文档：

:::python
```python
embedding = embeddings.embed_query("How were Nike's margins impacted in 2023?")

results = vector_store.similarity_search_by_vector(embedding)
print(results[0])
```
```python
page_content='Table of Contents
GROSS MARGIN
FISCAL 2023 COMPARED TO FISCAL 2022
For fiscal 2023, our consolidated gross profit increased 4% to $22,292 million compared to $21,479 million for fiscal 2022. Gross margin decreased 250 basis points to
43.5% for fiscal 2023 compared to 46.0% for fiscal 2022 due to the following:
*Wholesale equivalent
The decrease in gross margin for fiscal 2023 was primarily due to:
•Higher NIKE Brand product costs, on a wholesale equivalent basis, primarily due to higher input costs and elevated inbound freight and logistics costs as well as
product mix;
•Lower margin in our NIKE Direct business, driven by higher promotional activity to liquidate inventory in the current period compared to lower promotional activity in
the prior period resulting from lower available inventory supply;
•Unfavorable changes in net foreign currency exchange rates, including hedges; and
•Lower off-price margin, on a wholesale equivalent basis.
This was partially offset by:' metadata={'page': 36, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 0}
```
:::
:::js
```typescript
const embedding = await embeddings.embedQuery(
  "How were Nike's margins impacted in 2023?"
);

const results3 = await vectorStore.similaritySearchVectorWithScore(
  embedding,
  1
);

console.log(results3[0]);
```
```javascript
Document {
    pageContent: 'FISCAL 2023 COMPARED TO FISCAL 2022...',
    metadata: {
        'page': 36,
        'source': '../example_data/nke-10k-2023.pdf',
        'start_index': 0
    }
}
```
:::

了解更多：

- @[API Reference][VectorStore]
- [Integration-specific docs](/oss/integrations/vectorstores)

## 4. Retrievers

LangChain @[`VectorStore`] 对象不子类化 @[Runnable]。LangChain @[Retrievers] 是 Runnables，因此它们实现一组标准方法（例如，同步和异步 `invoke` 和 `batch` 操作）。虽然我们可以从 vector stores 构建 retrievers，但 retrievers 也可以与非 vector store 数据源接口（如外部 APIs）。

:::python
我们可以自己创建一个简单版本，无需子类化 `Retriever`。如果我们选择希望使用什么方法来检索文档，我们可以轻松创建一个 runnable。下面我们将围绕 `similarity_search` 方法构建一个：


```python
from typing import List

from langchain_core.documents import Document
from langchain_core.runnables import chain


@chain
def retriever(query: str) -> List[Document]:
    return vector_store.similarity_search(query, k=1)


retriever.batch(
    [
        "How many distribution centers does Nike have in the US?",
        "When was Nike incorporated?",
    ],
)
```



```text
[[Document(metadata={'page': 4, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 3125}, page_content='direct to consumer operations sell products through the following number of retail stores in the United States:\nU.S. RETAIL STORES NUMBER\nNIKE Brand factory stores 213 \nNIKE Brand in-line stores (including employee-only stores) 74 \nConverse stores (including factory stores) 82 \nTOTAL 369 \nIn the United States, NIKE has eight significant distribution centers. Refer to Item 2. Properties for further information.\n2023 FORM 10-K 2')],
 [Document(metadata={'page': 3, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 0}, page_content='Table of Contents\nPART I\nITEM 1. BUSINESS\nGENERAL\nNIKE, Inc. was incorporated in 1967 under the laws of the State of Oregon. As used in this Annual Report on Form 10-K (this "Annual Report"), the terms "we," "us," "our,"\n"NIKE" and the "Company" refer to NIKE, Inc. and its predecessors, subsidiaries and affiliates, collectively, unless the context indicates otherwise.\nOur principal business activity is the design, development and worldwide marketing and selling of athletic footwear, apparel, equipment, accessories and services. NIKE is\nthe largest seller of athletic footwear and apparel in the world. We sell our products through NIKE Direct operations, which are comprised of both NIKE-owned retail stores\nand sales through our digital platforms (also referred to as "NIKE Brand Digital"), to retail accounts and to a mix of independent distributors, licensees and sales')]]
```
:::

Vectorstores 实现 `as_retriever` 方法，将生成 Retriever，具体是 [`VectorStoreRetriever`](https://python.langchain.com/api_reference/core/vectorstores/langchain_core.vectorstores.base.VectorStoreRetriever.html)。这些 retrievers 包括特定的 `search_type` 和 `search_kwargs` 属性，用于标识要调用底层 vector store 的哪些方法，以及如何参数化它们。例如，我们可以使用以下内容复制上面的内容：

:::python
```python
retriever = vector_store.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 1},
)

retriever.batch(
    [
        "How many distribution centers does Nike have in the US?",
        "When was Nike incorporated?",
    ],
)
```
```text
[[Document(metadata={'page': 4, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 3125}, page_content='direct to consumer operations sell products through the following number of retail stores in the United States:\nU.S. RETAIL STORES NUMBER\nNIKE Brand factory stores 213 \nNIKE Brand in-line stores (including employee-only stores) 74 \nConverse stores (including factory stores) 82 \nTOTAL 369 \nIn the United States, NIKE has eight significant distribution centers. Refer to Item 2. Properties for further information.\n2023 FORM 10-K 2')],
 [Document(metadata={'page': 3, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 0}, page_content='Table of Contents\nPART I\nITEM 1. BUSINESS\nGENERAL\nNIKE, Inc. was incorporated in 1967 under the laws of the State of Oregon. As used in this Annual Report on Form 10-K (this "Annual Report"), the terms "we," "us," "our,"\n"NIKE" and the "Company" refer to NIKE, Inc. and its predecessors, subsidiaries and affiliates, collectively, unless the context indicates otherwise.\nOur principal business activity is the design, development and worldwide marketing and selling of athletic footwear, apparel, equipment, accessories and services. NIKE is\nthe largest seller of athletic footwear and apparel in the world. We sell our products through NIKE Direct operations, which are comprised of both NIKE-owned retail stores\nand sales through our digital platforms (also referred to as "NIKE Brand Digital"), to retail accounts and to a mix of independent distributors, licensees and sales')]]
```

`VectorStoreRetriever` 支持 `"similarity"`（默认）、`"mmr"`（maximum marginal relevance，如上所述）和 `"similarity_score_threshold"` 的 search types。我们可以使用后者通过相似度分数阈值化 retriever 输出的文档。
:::
:::js
```typescript
const retriever = vectorStore.asRetriever({
  searchType: "mmr",
  searchKwargs: {
    fetchK: 1,
  },
});

await retriever.batch([
  "When was Nike incorporated?",
  "What was Nike's revenue in 2023?",
]);
```
```javascript
[
    [Document {
        metadata: {'page': 4, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 3125},
        pageContent: 'direct to consumer operations sell products...',
    }],
    [Document {
        metadata: {'page': 3, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 0},
        pageContent: 'Table of Contents...',
    }],
]
```
:::

Retrievers 可以轻松集成到更复杂的应用程序中，如 [retrieval-augmented generation (RAG)](/oss/langchain/retrieval) 应用程序，将给定问题与检索到的上下文结合到 LLM 的 prompt 中。要了解有关构建此类应用程序的更多信息，请查看 [RAG tutorial](/oss/langchain/rag) 教程。


## 下一步

你现在已经了解了如何构建 PDF 文档的语义搜索引擎。

有关 document loaders 的更多信息：

- [Overview](/oss/langchain/retrieval#document_loaders)
- [Available integrations](/oss/integrations/document_loaders/)

有关 embeddings 的更多信息：

- [Overview](/oss/langchain/retrieval#embedding_models/)
- [Available integrations](/oss/integrations/text_embedding/)

有关 vector stores 的更多信息：

- [Overview](/oss/langchain/retrieval#vectorstores/)
- [Available integrations](/oss/integrations/vectorstores/)

有关 RAG 的更多信息，请参阅：

- [Build a Retrieval Augmented Generation (RAG) App](/oss/langchain/rag/)
