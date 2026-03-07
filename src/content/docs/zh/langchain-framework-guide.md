---
title: "LangChain 框架详解：构建 LLM 应用的利器"
order: 2
section: "LangChain AI"
topic: "LangChain"
lang: "zh"
slug: "langchain-framework-guide"
summary: "LangChain 框架深度解析，涵盖核心概念、组件架构、Agent 系统、工具集成与最佳实践。"
icon: "⛓️"
featured: true
toc: true
updated: 2026-03-07
---

# LangChain 框架详解

> **LangChain** 是构建 LLM 应用最流行的开源框架。本文深入解析 LangChain 的核心概念、组件架构和实际使用方法。

## 一、什么是 LangChain？

**LangChain** 是一个用于开发由语言模型驱动的应用程序的开源框架。它的核心目标是：

1. **连接** — 将 LLM 与外部数据源、API、工具连接起来
2. **编排** — 组织多个组件协同工作
3. **简化** — 提供高层抽象，降低开发复杂度

### 1.1 为什么需要 LangChain？

```
┌─────────────────────────────────────────────────────────────────┐
│                    不用 LangChain vs 使用 LangChain              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ 不用框架                          ✅ 使用 LangChain           │
│  ━━━━━━━━━━━━━━━━                   ━━━━━━━━━━━━━━━━            │
│  • 每个模型 API 都不一样              • 统一接口，随意切换        │
│  • 自己处理 Token 限制                 • 自动处理上下文窗口        │
│  • 手动管理对话历史                   • 内置记忆系统              │
│  • 工具调用自己实现                   • 预构建的工具集成          │
│  • Agent 逻辑从头写                   • 10 行代码创建 Agent         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、核心组件架构

### 2.1 LangChain 组件总览

```
┌─────────────────────────────────────────────────────────────────┐
│                      LangChain 核心组件                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │     Models      │  │     Prompts     │  │    Memory       │ │
│  │     模型        │  │     提示词       │  │     记忆        │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ • Chat Models   │  │ • Templates     │  │ • Conversation  │ │
│  │ • LLMs          │  │ • Few-shot      │  │ • Buffer        │ │
│  │ • Embeddings    │  │ • Examples      │  │ • Vector Store  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │     Tools       │  │    Agents       │  │  Retrievers     │ │
│  │     工具        │  │    智能体        │  │    检索器        │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ • API 调用       │  │ • ReAct         │  │ • Vector DB     │ │
│  │ • 数据库查询     │  │ • Plan & Exec   │  │ • Self-query    │ │
│  │ • 文件系统       │  │ • OpenAI Func   │  │ • Multi-query   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   Chains        │  │   Callbacks     │                      │
│  │   链            │  │   回调          │                      │
│  ├─────────────────┤  ├─────────────────┤                      │
│  │ • Sequential    │  │ • Logging       │                      │
│  │ • Parallel      │  │ • Tracing       │                      │
│  │ • Transform     │  │ • Monitoring    │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、核心概念详解

### 3.1 模型（Models）

LangChain 提供统一的接口来调用各种 LLM：

```python
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

# Anthropic Claude
claude = ChatAnthropic(model="claude-sonnet-4-6")

# OpenAI GPT
gpt = ChatOpenAI(model="gpt-4o")

# Google Gemini
gemini = ChatGoogleGenerativeAI(model="gemini-2.0-pro")

# 统一的使用方式
response = claude.invoke("你好，请介绍一下自己")
```

#### 模型类型

| 类型 | 用途 | 示例 |
|------|------|------|
| **Chat Models** | 对话式交互 | ChatOpenAI, ChatAnthropic |
| **LLMs** | 文本补全 | 传统 GPT-3 风格 |
| **Embeddings** | 文本向量化 | OpenAIEmbeddings |

### 3.2 提示词（Prompts）

Prompt 模板帮助你管理和复用提示词：

```python
from langchain.prompts import ChatPromptTemplate

# 创建模板
template = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}，擅长{expertise}"),
    ("user", "{input}")
])

# 使用模板
prompt = template.invoke({
    "role": "编程助手",
    "expertise": "Python 开发",
    "input": "如何读取文件？"
})
```

#### Few-shot 示例

```python
from langchain.prompts import FewShotChatMessagePromptTemplate

examples = [
    {"input": "2+2", "output": "4"},
    {"input": "2*3", "output": "6"},
]

few_shot = FewShotChatMessagePromptTemplate(
    examples=examples,
    example_prompt=ChatPromptTemplate.from_messages([
        ("user", "{input}"),
        ("ai", "{output}")
    ])
)
```

### 3.3 记忆（Memory）

记忆系统让 Agent 能够记住对话历史：

```python
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# 保存对话
memory.save_context(
    {"input": "你好"},
    {"output": "你好！有什么可以帮助你的？"}
)

# 获取历史
history = memory.load_memory_variables({})
```

#### 记忆类型

| 类型 | 特点 | 适用场景 |
|------|------|----------|
| **Buffer Memory** | 保存完整历史 | 短对话 |
| **Summary Memory** | 自动总结历史 | 长对话 |
| **Vector Store Memory** | 向量检索相关历史 | 需要上下文检索 |
| **Entity Memory** | 记忆实体信息 | 需要记住人名、事物 |

### 3.4 工具（Tools）

工具让 Agent 能够执行实际操作：

```python
from langchain.tools import tool

@tool
def get_weather(city: str) -> str:
    """查询城市天气"""
    # 实际调用天气 API
    return f"{city} 今天晴朗，温度 25°C"

@tool
def search_web(query: str) -> str:
    """搜索网络信息"""
    # 调用搜索 API
    return "搜索结果..."

# 使用工具
tools = [get_weather, search_web]
```

#### 内置工具

LangChain 提供丰富的内置工具：

- 🔍 **搜索**: Google Search, Bing, DuckDuckGo
- 📊 **计算**: Wolfram Alpha, Calculator
- 💻 **代码**: Python REPL, GitHub
- 📁 **文件**: File System, Web Scraper
- 🗄️ **数据库**: SQL Database, MongoDB

### 3.5 Agent（智能体）

Agent 是 LangChain 的核心，它能够自主决定使用哪些工具来完成任务：

```python
from langchain.agents import create_agent

agent = create_agent(
    model="claude-sonnet-4-6",
    tools=[get_weather, search_web],
    system_prompt="你是一个有帮助的助手，可以使用工具查询信息",
)

result = agent.invoke({
    "messages": [{"role": "user", "content": "北京天气怎么样？"}]
})
```

#### Agent 类型

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| **create_agent** | 现代推荐方式 | 通用场景 |
| **ReAct** | 推理 + 行动 | 需要多步推理 |
| **Plan & Execute** | 先计划后执行 | 复杂任务 |
| **OpenAI Functions** | 使用 Function Calling | OpenAI 模型 |
| **Conversational** | 对话式 Agent | 客服场景 |

### 3.6 检索器（Retrievers）

检索器用于从大量数据中查找相关信息：

```python
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

# 创建向量存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=embeddings
)

# 创建检索器
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3}
)

# 检索相关文档
relevant_docs = retriever.invoke("查询问题")
```

---

## 四、实战：构建一个完整的 Agent

### 4.1 场景：智能研究助手

让我们构建一个能够研究主题、搜索信息、总结报告的智能助手。

```python
from langchain.agents import create_agent
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

# 1. 定义工具
@tool
def search_topic(topic: str) -> str:
    """搜索特定主题的信息"""
    # 实际实现会调用搜索 API
    return f"关于{topic}的研究信息..."

@tool
def analyze_data(data: str) -> str:
    """分析数据并提取关键信息"""
    return f"分析结果：{data[:100]}..."

@tool
def write_report(topic: str, findings: str) -> str:
    """撰写研究报告"""
    return f"## {topic} 研究报告\n\n{findings}"

# 2. 创建 Agent
agent = create_agent(
    model=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[search_topic, analyze_data, write_report],
    system_prompt="""你是一个研究助手，帮助完成以下任务：
1. 搜索主题相关信息
2. 分析收集到的数据
3. 撰写结构化的研究报告

请逐步完成任务，并在每一步说明你在做什么。""",
)

# 3. 使用 Agent
result = agent.invoke({
    "messages": [{
        "role": "user", 
        "content": "请研究量子计算的最新进展，并写一份报告"
    }]
})

print(result["messages"][-1].content)
```

### 4.2 添加记忆功能

```python
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

agent = create_agent(
    model="claude-sonnet-4-6",
    tools=[search_topic, analyze_data, write_report],
    system_prompt="你是一个研究助手...",
    memory=memory,
)

# 现在 Agent 可以记住之前的对话
result1 = agent.invoke({"messages": [{"role": "user", "content": "研究量子计算"}]})
result2 = agent.invoke({"messages": [{"role": "user", "content": "基于刚才的研究，总结三个关键点"}]})
```

### 4.3 添加 LangSmith 追踪

```python
import os

# 设置环境变量开启追踪
os.environ["LANGSMITH_TRACING"] = "true"
os.environ["LANGSMITH_API_KEY"] = "your_api_key"
os.environ["LANGSMITH_PROJECT"] = "research-assistant"

# 现在所有调用都会自动记录到 LangSmith
# 访问 https://smith.langchain.com 查看追踪
```

---

## 五、最佳实践

### 5.1 Prompt 设计

✅ **好的 Prompt：**

```python
system_prompt = """你是一个专业的{role}。

## 能力
- 能力 1: 描述
- 能力 2: 描述

## 约束
- 约束 1
- 约束 2

## 输出格式
请按照以下格式回答：
1. 分析
2. 方案
3. 建议"""
```

❌ **避免：**

```python
# 太模糊
system_prompt = "你是一个助手"

# 太长太复杂
system_prompt = "你是一个...（500 字）"
```

### 5.2 工具设计

```python
@tool
def search_weather(city: str, date: str = "today") -> str:
    """查询城市天气
    
    Args:
        city: 城市名称，如"北京"、"New York"
        date: 日期，默认"today"，格式"YYYY-MM-DD"
    
    Returns:
        天气信息字符串
    """
    # 清晰的文档字符串帮助 Agent 理解何时使用此工具
    pass
```

### 5.3 错误处理

```python
from langchain.agents import AgentExecutor

executor = AgentExecutor.from_agent_and_tools(
    agent=agent,
    tools=tools,
    handle_parsing_errors=True,  # 自动处理解析错误
    max_iterations=5,  # 限制最大迭代次数
    max_execution_time=60,  # 限制执行时间
)
```

### 5.4 性能优化

| 优化点 | 方法 |
|--------|------|
| **减少 Token** | 精简 Prompt，使用摘要 |
| **缓存** | 使用 LangChain 缓存中间结果 |
| **并行** | 并行执行独立的任务 |
| **流式** | 使用流式输出提升用户体验 |

---

## 六、常见问题

### Q1: LangChain 和 LangGraph 有什么区别？

**LangChain** 是高层框架，适合快速构建标准应用；**LangGraph** 是底层编排引擎，适合复杂工作流。LangChain 的 Agent 底层使用 LangGraph。

### Q2: 如何选择模型提供商？

- **追求性能**: Claude (Anthropic), GPT-4 (OpenAI)
- **性价比**: Claude Haiku, GPT-4o-mini
- **开源**: Llama (Meta), Mistral
- **国内**: 通义千问、文心一言、Kimi

### Q3: LangChain 支持哪些语言？

- **Python**: 最成熟，功能最全
- **JavaScript/TypeScript**: 功能逐步完善
- **其他**: 社区有 Java、Go 等非官方实现

---

## 七、学习资源

- 📚 **官方文档**: [python.langchain.com](https://python.langchain.com)
- 🎓 **LangChain Academy**: 官方免费课程
- 💬 **Discord**: LangChain 社区
- 🐙 **GitHub**: [langchain-ai/langchain](https://github.com/langchain-ai/langchain)

---

> 💡 **提示**: LangChain 更新频繁，建议定期查看官方文档了解最新功能和最佳实践。
