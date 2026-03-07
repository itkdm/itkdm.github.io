---
title: "LangGraph 详解：构建复杂 Agent 工作流"
order: 3
section: "LangChain AI"
topic: "LangGraph"
lang: "zh"
slug: "langgraph-workflow-guide"
summary: "LangGraph 图式工作流框架深度解析，涵盖核心概念、状态管理、节点编排、持久化执行与高级用法。"
icon: "🕸️"
featured: true
toc: true
updated: 2026-03-07
---

# LangGraph 详解：构建复杂 Agent 工作流

> **LangGraph** 是 LangChain 团队开发的图式工作流编排框架。它让你能够构建复杂的、多步骤的 Agent 系统，支持状态管理、持久化执行和人工介入。

## 一、什么是 LangGraph？

**LangGraph** 是一个基于图（Graph）概念的 Agent 编排框架。它将工作流建模为节点（Nodes）和边（Edges）的组合，让你能够精确控制 Agent 的执行流程。

### 1.1 为什么需要 LangGraph？

```
┌─────────────────────────────────────────────────────────────────┐
│              简单 Agent vs 复杂工作流                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  简单场景（LangChain 足够）：                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━                                     │
│  用户提问 → Agent 思考 → 使用工具 → 返回答案                      │
│                                                                 │
│  复杂场景（需要 LangGraph）：                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━                                     │
│                                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │ 接收请求 │───▶│ 信息收集 │───▶│ 人工审核 │───▶│ 执行任务 │      │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │
│       │                                      │                  │
│       │              ┌─────────────┐         │                  │
│       └─────────────▶│  拒绝/修改   │◀────────┘                  │
│                      └─────────────┘                            │
│                                                                 │
│  需要：状态管理、条件分支、循环、人工介入、持久化                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 LangGraph vs LangChain

| 特性 | LangChain | LangGraph |
|------|-----------|-----------|
| **抽象级别** | 高层 | 低层 |
| **学习曲线** | 简单 | 中等 |
| **灵活性** | 预设模式 | 完全自定义 |
| **状态管理** | 简单 | 强大 |
| **适用场景** | 快速原型 | 生产级复杂系统 |

---

## 二、核心概念

### 2.1 图的组成

```
┌─────────────────────────────────────────────────────────────────┐
│                    LangGraph 核心概念                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      Graph（图）                         │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐             │   │
│  │  │  Node A │───▶│  Node B │───▶│  Node C │             │   │
│  │  │  节点 A  │    │  节点 B  │    │  节点 C  │             │   │
│  │  └─────────┘    └─────────┘    └─────────┘             │   │
│  │       │                              │                  │   │
│  │       └──────────────┬───────────────┘                  │   │
│  │                      ▼                                  │   │
│  │              ┌─────────────────┐                        │   │
│  │              │     Edge        │                        │   │
│  │              │     边/转换      │                        │   │
│  │              └─────────────────┘                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │     State       │  │     Nodes       │  │     Edges       │ │
│  │     状态        │  │     节点        │  │     边          │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ 在节点间传递的   │  │ 执行具体任务的  │  │ 定义节点之间的  │ │
│  │ 数据结构        │  │ 函数            │  │ 执行流程        │ │
│  │                 │  │                 │  │                 │ │
│  │ • 消息列表      │  │ • 调用 LLM      │  │ • 条件边        │ │
│  │ • 中间结果      │  │ • 调用工具      │  │ • 循环边        │ │
│  │ • 元数据        │  │ • 数据处理      │  │ • 结束边        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 State（状态）

状态是在节点之间传递的数据结构：

```python
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
import operator

# 定义状态
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    current_step: str
    results: list
    metadata: dict
```

---

## 三、快速开始

### 3.1 安装

```bash
pip install langgraph langchain-anthropic
```

### 3.2 第一个图：简单对话

```python
from typing import TypedDict, Annotated
from langchain_core.messages import HumanMessage, AIMessage, add_messages
from langgraph.graph import StateGraph, START, END
from langchain_anthropic import ChatAnthropic

# 1. 定义状态
class State(TypedDict):
    messages: Annotated[list, add_messages]

# 2. 定义节点函数
def call_model(state: State):
    model = ChatAnthropic(model="claude-sonnet-4-6")
    response = model.invoke(state["messages"])
    return {"messages": [response]}

# 3. 创建图
builder = StateGraph(State)
builder.add_node("assistant", call_model)
builder.add_edge(START, "assistant")
builder.add_edge("assistant", END)

# 4. 编译
graph = builder.compile()

# 5. 运行
result = graph.invoke({
    "messages": [HumanMessage(content="你好！")]
})

print(result["messages"][-1].content)
```

### 3.3 添加条件分支

```python
from langgraph.graph import StateGraph, START, END, ConditionalBranch

class State(TypedDict):
    messages: list
    category: str

def classify(state: State):
    # 简单分类逻辑
    if "天气" in str(state["messages"]):
        return {"category": "weather"}
    elif "代码" in str(state["messages"]):
        return {"category": "code"}
    else:
        return {"category": "general"}

def weather_node(state: State):
    # 处理天气查询
    return {"messages": ["我来帮你查天气..."]}

def code_node(state: State):
    # 处理代码问题
    return {"messages": ["让我看看这段代码..."]}

def general_node(state: State):
    # 处理一般问题
    return {"messages": ["有什么可以帮助你的？"]}

# 创建图
builder = StateGraph(State)

# 添加节点
builder.add_node("classify", classify)
builder.add_node("weather", weather_node)
builder.add_node("code", code_node)
builder.add_node("general", general_node)

# 添加边
builder.add_edge(START, "classify")

# 条件边：根据 category 选择下一个节点
builder.add_conditional_edges(
    "classify",
    lambda state: state["category"],
    {
        "weather": "weather",
        "code": "code",
        "general": "general",
    }
)

builder.add_edge("weather", END)
builder.add_edge("code", END)
builder.add_edge("general", END)

graph = builder.compile()
```

---

## 四、核心功能详解

### 4.1 状态管理

#### 定义复杂状态

```python
from typing import TypedDict, Annotated, List, Optional
from langchain_core.messages import BaseMessage
import operator

class ResearchState(TypedDict):
    # 对话历史
    messages: Annotated[List[BaseMessage], operator.add]
    
    # 研究主题
    topic: str
    
    # 收集的信息
    collected_info: Annotated[List[str], operator.add]
    
    # 分析结果
    analysis: Optional[str]
    
    # 最终报告
    report: Optional[str]
    
    # 当前步骤
    current_step: str
    
    # 是否需要人工审核
    needs_review: bool
    
    # 审核意见
    review_feedback: Optional[str]
```

#### 更新状态

```python
def collect_info(state: ResearchState):
    # 搜索信息
    info = search_web(state["topic"])
    
    # 返回部分更新（只更新 collected_info 和 current_step）
    return {
        "collected_info": [info],
        "current_step": "analysis"
    }
```

### 4.2 循环与迭代

```python
def should_continue(state: ResearchState):
    # 如果收集的信息不足，继续收集
    if len(state["collected_info"]) < 3:
        return "collect_more"
    # 否则进入分析
    return "analyze"

builder = StateGraph(ResearchState)

builder.add_node("collect", collect_info)
builder.add_node("analyze", analyze_info)

builder.add_edge(START, "collect")

# 条件循环
builder.add_conditional_edges(
    "collect",
    should_continue,
    {
        "collect_more": "collect",  # 循环回 collect
        "analyze": "analyze",        # 进入分析
    }
)

builder.add_edge("analyze", END)
```

### 4.3 人工介入（Human-in-the-loop）

```python
from langgraph.checkpoint import MemorySaver

# 启用持久化
memory = MemorySaver()

builder = StateGraph(ResearchState)
# ... 添加节点和边 ...

graph = builder.compile(checkpointer=memory)

# 在需要人工审核的节点后中断
def review_node(state: ResearchState):
    # 这个节点会等待人工输入
    return state

# 配置中断点
graph = builder.compile(
    checkpointer=memory,
    interrupt_after=["review_node"]  # 在 review_node 后中断
)

# 运行到中断点
thread_config = {"configurable": {"thread_id": "123"}}
result = graph.invoke(state, config=thread_config)

# 此时图会暂停，等待人工输入

# 人工审核后继续
graph.invoke(
    {"review_feedback": "批准，可以发布"},
    config=thread_config
)
```

### 4.4 子图（Subgraphs）

```python
# 创建一个子图用于信息收集
collect_builder = StateGraph(CollectState)
collect_builder.add_node("search", search_web)
collect_builder.add_node("filter", filter_results)
collect_builder.add_edge("search", "filter")
collect_builder.add_edge(START, "search")
collect_builder.add_edge("filter", END)
collect_graph = collect_builder.compile()

# 在主图中使用子图
main_builder = StateGraph(MainState)
main_builder.add_node("collect", collect_graph)  # 添加子图作为节点
main_builder.add_node("analyze", analyze_results)
main_builder.add_edge(START, "collect")
main_builder.add_edge("collect", "analyze")
main_builder.add_edge("analyze", END)

main_graph = main_builder.compile()
```

### 4.5 并行执行

```python
from langgraph.graph import StateGraph, START

builder = StateGraph(State)

builder.add_node("search_a", search_source_a)
builder.add_node("search_b", search_source_b)
builder.add_node("search_c", search_source_c)
builder.add_node("combine", combine_results)

# 并行执行三个搜索
builder.add_edge(START, "search_a")
builder.add_edge(START, "search_b")
builder.add_edge(START, "search_c")

# 等待所有搜索完成后合并
builder.add_edge("search_a", "combine")
builder.add_edge("search_b", "combine")
builder.add_edge("search_c", "combine")

builder.add_edge("combine", END)

graph = builder.compile()
```

---

## 五、持久化与时间旅行

### 5.1 检查点（Checkpoints）

```python
from langgraph.checkpoint import MemorySaver, SqliteSaver

# 内存检查点（开发用）
memory_saver = MemorySaver()

# SQLite 检查点（生产用）
sqlite_saver = SqliteSaver.from_conn_string("checkpoints.sqlite")

graph = builder.compile(checkpointer=sqlite_saver)
```

### 5.2 获取历史状态

```python
# 获取某个线程的所有状态
thread_config = {"configurable": {"thread_id": "123"}}

for state in graph.get_state_history(thread_config):
    print(f"步骤：{state.values['current_step']}")
    print(f"消息数：{len(state.values['messages'])}")

# 获取特定状态
state = graph.get_state(thread_config)
print(state.values)
```

### 5.3 时间旅行（回到过去的状态）

```python
# 获取历史
history = list(graph.get_state_history(thread_config))

# 选择要回到的状态（比如倒数第 3 个）
target_state = history[2]

# 从那个状态继续
graph.invoke(
    {"new_input": "换个方向分析"},
    config=thread_config,
    checkpoint_id=target_state.config["configurable"]["checkpoint_id"]
)
```

---

## 六、实战：多 Agent 协作系统

### 6.1 场景：内容创作团队

构建一个包含研究员、作家、编辑的协作系统：

```python
from typing import TypedDict, List
from langgraph.graph import StateGraph, START, END

class ContentState(TypedDict):
    topic: str
    research: List[str]
    draft: str
    edits: List[str]
    final: str
    current_agent: str

# 研究员 Agent
def researcher(state: ContentState):
    # 搜索和收集信息
    research = search_and_collect(state["topic"])
    return {"research": research, "current_agent": "writer"}

# 作家 Agent
def writer(state: ContentState):
    # 基于研究写草稿
    draft = write_draft(state["research"])
    return {"draft": draft, "current_agent": "editor"}

# 编辑 Agent
def editor(state: ContentState):
    # 审核和修改
    edits = review_and_edit(state["draft"])
    if needs_more_work(edits):
        return {"edits": edits, "current_agent": "writer"}
    return {"edits": edits, "current_agent": "finalize"}

# 定稿
def finalize(state: ContentState):
    final = create_final_version(state["draft"], state["edits"])
    return {"final": final}

# 创建图
builder = StateGraph(ContentState)

builder.add_node("researcher", researcher)
builder.add_node("writer", writer)
builder.add_node("editor", editor)
builder.add_node("finalize", finalize)

builder.add_edge(START, "researcher")
builder.add_edge("researcher", "writer")
builder.add_edge("writer", "editor")

# 条件边：如果需要修改，回到 writer
builder.add_conditional_edges(
    "editor",
    lambda state: state["current_agent"],
    {
        "writer": "writer",
        "finalize": "finalize",
    }
)

builder.add_edge("finalize", END)

graph = builder.compile()

# 运行
result = graph.invoke({"topic": "AI 发展趋势", "current_agent": "researcher"})
print(result["final"])
```

---

## 七、最佳实践

### 7.1 状态设计

✅ **好的状态设计：**

```python
class GoodState(TypedDict):
    # 使用类型注解
    messages: List[BaseMessage]
    step: str
    results: Dict[str, Any]
    # 使用 Optional 表示可能为空的字段
    error: Optional[str]
```

❌ **避免：**

```python
# 避免过于复杂的状态
class BadState(TypedDict):
    # 嵌套太深
    data: Dict[str, Dict[str, Dict[str, Any]]]
    # 太多字段
    field1: str
    field2: str
    # ... 50 个字段
```

### 7.2 节点设计

- **单一职责**: 每个节点只做一件事
- **幂等性**: 节点可以安全重试
- **错误处理**: 捕获并处理异常

```python
def robust_node(state: State):
    try:
        result = do_something()
        return {"result": result}
    except Exception as e:
        return {"error": str(e)}
```

### 7.3 调试技巧

```python
# 启用详细日志
import logging
logging.basicConfig(level=logging.DEBUG)

# 打印中间状态
for chunk in graph.stream(state):
    print(f"输出：{chunk}")

# 使用 LangSmith 追踪
os.environ["LANGSMITH_TRACING"] = "true"
```

---

## 八、常见问题

### Q1: 什么时候应该用 LangGraph 而不是 LangChain？

当你需要：
- 精确控制执行流程
- 多 Agent 协作
- 人工介入审核
- 复杂的状态管理
- 长时间运行的任务

### Q2: LangGraph 的性能如何？

LangGraph 设计为高效执行：
- 支持并行节点执行
- 增量状态更新
- 可选的流式输出

### Q3: 如何部署 LangGraph 应用？

- **LangGraph Server**: 官方提供的部署方案
- **自定义 API**: 使用 FastAPI 等框架
- **云服务**: LangGraph Cloud（托管服务）

---

## 九、学习资源

- 📚 **官方文档**: [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph/)
- 🎓 **教程**: 官方提供多个实战教程
- 💬 **示例**: GitHub 上的示例代码库
- 🔧 **LangGraph Studio**: 可视化调试工具

---

> 💡 **提示**: LangGraph 功能强大但学习曲线较陡，建议从简单图开始，逐步增加复杂度。配合 LangSmith 使用可以更好地调试和监控。
