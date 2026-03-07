---
title: 组件架构
order: 23
section: "LangChain AI"
topic: "LangChain"
lang: "zh"
slug: "langchain-component-architecture"
summary: LangChain 的组件如何协同工作以创建复杂的 AI 应用
icon: "lucide:layers"
featured: false
toc: true
updated: 2026-03-07
---

LangChain 的强大之处在于其组件如何协同工作以创建复杂的 AI 应用。本页提供了展示不同组件之间关系的图表。

## 核心组件生态系统

下图展示了 LangChain 的主要组件如何连接形成完整的 AI 应用：

```mermaid
graph TD
    %% Input processing
    subgraph "📥 Input processing"
        A[Text input] --> B[Document loaders]
        B --> C[Text splitters]
        C --> D[Documents]
    end

    %% Embedding & storage
    subgraph "🔢 Embedding & storage"
        D --> E[Embedding models]
        E --> F[Vectors]
        F --> G[(Vector stores)]
    end

    %% Retrieval
    subgraph "🔍 Retrieval"
        H[User Query] --> I[Embedding models]
        I --> J[Query vector]
        J --> K[Retrievers]
        K --> G
        G --> L[Relevant context]
    end

    %% Generation
    subgraph "🤖 Generation"
        M[Chat models] --> N[Tools]
        N --> O[Tool results]
        O --> M
        L --> M
        M --> P[AI response]
    end

    %% Orchestration
    subgraph "🎯 Orchestration"
        Q[Agents] --> M
        Q --> N
        Q --> K
        Q --> R[Memory]
    end

    classDef trigger fill:#DCFCE7,stroke:#16A34A,stroke-width:2px,color:#14532D
    classDef process fill:#DBEAFE,stroke:#2563EB,stroke-width:2px,color:#1E3A8A
    classDef output fill:#F3E8FF,stroke:#9333EA,stroke-width:2px,color:#581C87
    classDef neutral fill:#F3F4F6,stroke:#9CA3AF,stroke-width:2px,color:#374151

    class A,H trigger
    class B,C,E,I,K,M,N,Q process
    class D,F,J,L,O,P,R neutral
    class G output
```

### 组件如何连接

每个组件层都建立在前一层的基础上：

1. **输入处理（Input processing）** – 将原始数据转换为结构化文档
2. **嵌入与存储（Embedding & storage）** – 将文本转换为可搜索的向量表示
3. **检索（Retrieval）** – 根据用户查询查找相关信息
4. **生成（Generation）** – 使用 AI 模型创建响应，可选择使用工具
5. **编排（Orchestration）** – 通过 agent 和记忆系统协调一切

## 组件类别

LangChain 将组件组织为以下主要类别：

| 类别 | 目的 | 关键组件 | 用例 |
|----------|---------|---------------|-----------|
| **[模型（Models）](/oss/langchain/models)** | AI 推理和生成 | Chat models、LLMs、Embedding models | 文本生成、推理、语义理解 |
| **[工具（Tools）](/oss/langchain/tools)** | 外部能力 | APIs、数据库等 | 网页搜索、数据访问、计算 |
| **[Agent](/oss/langchain/agents)** | 编排和推理 | ReAct agents、tool calling agents | 非确定性工作流、决策制定 |
| **[记忆（Memory）](/oss/langchain/short-term-memory)** | 上下文保留 | 消息历史、自定义状态 | 对话、有状态的交互 |
| **[检索器（Retrievers）](/oss/integrations/retrievers)** | 信息访问 | 向量检索器、网页检索器 | RAG、知识库搜索 |
| **[文档处理（Document processing）](/oss/integrations/document_loaders)** | 数据摄入 | Loaders、splitters、transformers | PDF 处理、网页抓取 |
| **[向量存储（Vector Stores）](/oss/integrations/vectorstores)** | 语义搜索 | Chroma、Pinecone、FAISS | 相似度搜索、嵌入存储 |

## 常见模式

### RAG（检索增强生成）
```mermaid
graph LR
    A[用户问题] --> B[检索器]
    B --> C[相关文档]
    C --> D[Chat model]
    A --> D
    D --> E[知情的响应]

    classDef trigger fill:#DCFCE7,stroke:#16A34A,stroke-width:2px,color:#14532D
    classDef process fill:#DBEAFE,stroke:#2563EB,stroke-width:2px,color:#1E3A8A
    classDef neutral fill:#F3F4F6,stroke:#9CA3AF,stroke-width:2px,color:#374151

    class A trigger
    class B,D process
    class C,E neutral
```

### 带工具的 Agent
```mermaid
graph LR
    A[用户请求] --> B[Agent]
    B --> C{需要工具？}
    C -->|是 | D[调用工具]
    D --> E[工具结果]
    E --> B
    C -->|否 | F[最终答案]

    classDef trigger fill:#DCFCE7,stroke:#16A34A,stroke-width:2px,color:#14532D
    classDef process fill:#DBEAFE,stroke:#2563EB,stroke-width:2px,color:#1E3A8A
    classDef decision fill:#FEF3C7,stroke:#F59E0B,stroke-width:2px,color:#78350F
    classDef neutral fill:#F3F4F6,stroke:#9CA3AF,stroke-width:2px,color:#374151

    class A trigger
    class B,D process
    class C decision
    class E,F neutral
```

### 多 Agent 系统
```mermaid
graph LR
    A[复杂任务] --> B[监督 Agent]
    B --> C[专业 Agent 1]
    B --> D[专业 Agent 2]
    C --> E[结果]
    D --> E
    E --> B
    B --> F[协调响应]

    classDef trigger fill:#DCFCE7,stroke:#16A34A,stroke-width:2px,color:#14532D
    classDef process fill:#DBEAFE,stroke:#2563EB,stroke-width:2px,color:#1E3A8A
    classDef neutral fill:#F3F4F6,stroke:#9CA3AF,stroke-width:2px,color:#374151

    class A trigger
    class B,C,D process
    class E,F neutral
```

## 了解更多

- [创建 Agent](/oss/langchain/agents)
- [使用工具](/oss/langchain/tools)
- [浏览集成](/oss/integrations/providers/overview)
