---
title: "LangSmith 详解：LLM 应用开发与运维平台"
order: 4
section: "LangChain AI"
topic: "LangSmith"
lang: "zh"
slug: "langsmith-platform-guide"
summary: "LangSmith 开发运维平台完整指南，涵盖追踪调试、评估测试、监控分析、成本控制与团队协作功能。"
icon: "🔧"
featured: true
toc: true
updated: 2026-03-07
---

# LangSmith 详解：LLM 应用开发与运维平台

> **LangSmith** 是 LangChain 团队推出的 LLM 应用全生命周期管理平台。它提供追踪、调试、评估、监控、协作等功能，帮助团队高效开发和运维 LLM 应用。

## 一、什么是 LangSmith？

**LangSmith** 是一个专为 LLM 应用设计的开发与运维平台。它解决了 LLM 开发中的核心痛点：

```
┌─────────────────────────────────────────────────────────────────┐
│                  LLM 开发痛点 vs LangSmith 解决方案               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ 痛点                              ✅ LangSmith 方案           │
│  ━━━━━━━━━━━━                       ━━━━━━━━━━━━━━              │
│  "Agent 为什么输出这个？"            → 完整追踪，一步步调试       │
│  "这个 Prompt 效果怎么样？"          → A/B 测试，数据对比          │
│  "更新后有没有破坏功能？"            → 自动化评估，回归测试       │
│  "这个月 API 花了多少钱？"           → 成本追踪，按项目统计       │
│  "怎么把最佳实践分享给团队？"        → Prompt 库，数据集共享       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.1 核心功能模块

```
┌─────────────────────────────────────────────────────────────────┐
│                     LangSmith 功能架构                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │    Tracing    │  │  Evaluation   │  │  Monitoring   │       │
│  │    追踪调试    │  │    评估测试    │  │    监控分析    │       │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤       │
│  │ • 请求追踪    │  │ • 数据集管理  │  │ • 性能指标    │       │
│  │ • 调用链查看  │  │ • 评估器      │  │ • 成本统计    │       │
│  │ • 错误定位    │  │ • A/B 测试     │  │ • 告警通知    │       │
│  │ • 时间旅行    │  │ • 回归测试    │  │ • 使用分析    │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │    Prompts    │  │   Datasets    │  │  Collaboration │       │
│  │   提示词管理   │  │   数据集管理   │  │    团队协作    │       │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤       │
│  │ • 版本控制    │  │ • 测试用例    │  │ • 项目共享    │       │
│  │ • 模板库      │  │ • 评估数据    │  │ • 权限管理    │       │
│  │ • 在线编辑    │  │ • 数据标注    │  │ • 评论反馈    │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、快速开始

### 2.1 创建账户

1. 访问 [smith.langchain.com](https://smith.langchain.com)
2. 使用 GitHub/Google 账号登录
3. 创建你的第一个项目

### 2.2 获取 API Key

```bash
# 在 LangSmith 网站获取 API Key
# 设置环境变量
export LANGSMITH_API_KEY="lsv2_pt_..."
export LANGSMITH_TRACING=true
export LANGSMITH_PROJECT="my-project"
```

### 2.3 开启追踪（5 行代码）

```python
import os

# 设置环境变量
os.environ["LANGSMITH_TRACING"] = "true"
os.environ["LANGSMITH_API_KEY"] = "lsv2_pt_..."
os.environ["LANGSMITH_PROJECT"] = "my-first-project"

# 你的 LangChain 代码
from langchain.agents import create_agent

agent = create_agent(model="claude-sonnet-4-6", tools=[])
result = agent.invoke({"messages": [{"role": "user", "content": "你好"}]})

# 完成！现在访问 LangSmith 网站查看追踪
```

---

## 三、追踪与调试

### 3.1 自动追踪

开启追踪后，所有 LangChain/LangGraph 调用自动记录：

```python
from langchain.agents import create_agent
from langchain.tools import tool

@tool
def search(query: str):
    """搜索信息"""
    return "搜索结果"

agent = create_agent(
    model="claude-sonnet-4-6",
    tools=[search],
)

# 这次调用会被完整记录
result = agent.invoke({
    "messages": [{"role": "user", "content": "今天北京天气如何？"}]
})
```

#### 追踪内容

在 LangSmith 界面可以看到：

- 📝 **完整对话历史** — 所有消息
- 🔧 **工具调用** — 调用了哪些工具，输入输出是什么
- 🧠 **模型调用** — Prompt、响应、Token 使用
- ⏱️ **耗时分析** — 每个步骤的执行时间
- 🔗 **调用链** — 完整的执行流程

### 3.2 手动追踪

对于非 LangChain 代码，可以手动追踪：

```python
from langsmith import traceable, Client

client = Client()

@traceable(run_type="chain")
def my_custom_function(input_data):
    # 你的逻辑
    result = process(input_data)
    return result

@traceable(run_type="llm")
def call_llm(prompt):
    # 调用 LLM
    response = llm.generate(prompt)
    return response

# 手动记录
with client.trace("my-project", "my-run") as run:
    result = my_custom_function("input")
    run.end(outputs={"result": result})
```

### 3.3 添加元数据

```python
from langsmith import traceable

@traceable(
    metadata={"user_id": "123", "session_id": "abc"},
    tags=["production", "critical"],
)
def process_request(user_input):
    return agent.invoke({"messages": [{"role": "user", "content": user_input}]})
```

### 3.4 调试技巧

#### 查看调用链

```
┌─────────────────────────────────────────────────────────────────┐
│                    LangSmith 追踪界面                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Run: agent_invoke (2.3s)                                       │
│  ├─ ChatAnthropic (1.8s)                                        │
│  │  ├─ Prompt: 你是一个...                                      │
│  │  └─ Response: 我来帮你查...                                  │
│  ├─ Tool: search (0.3s)                                         │
│  │  ├─ Input: 北京天气                                          │
│  │  └─ Output: 晴朗，25°C                                       │
│  └─ ChatAnthropic (0.2s)                                        │
│     └─ Response: 北京今天晴朗...                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 过滤和搜索

```python
# 在 LangSmith 界面可以按以下条件过滤：
# • 时间范围
# • 项目名称
# • 标签
# • 元数据（如 user_id）
# • 耗时（找出慢的调用）
# • 错误（只看不成功的）
```

---

## 四、评估与测试

### 4.1 创建数据集

```python
from langsmith import Client

client = Client()

# 创建数据集
dataset = client.create_dataset(
    dataset_name="customer-support-qa",
    description="客服问答测试集",
)

# 添加示例
examples = [
    {
        "inputs": {"question": "如何退款？"},
        "outputs": {"answer": "请在订单页面申请退款..."},
    },
    {
        "inputs": {"question": "发货时间多久？"},
        "outputs": {"answer": "通常 1-3 个工作日发货..."},
    },
]

for example in examples:
    client.create_example(
        inputs=example["inputs"],
        outputs=example["outputs"],
        dataset_id=dataset.id,
    )
```

### 4.2 创建评估器

#### 内置评估器

```python
from langsmith.evaluation import evaluate, LangChainStringEvaluator

# 准确性评估
accuracy_evaluator = LangChainStringEvaluator("criteria", config={
    "criteria": {
        "accuracy": "回答是否准确反映了已知信息"
    }
})

# 相关性评估
relevance_evaluator = LangChainStringEvaluator("criteria", config={
    "criteria": {
        "relevance": "回答是否与问题相关"
    }
})

# 运行评估
results = evaluate(
    lambda inputs: agent.invoke(inputs)["messages"][-1].content,
    data=dataset,
    evaluators=[accuracy_evaluator, relevance_evaluator],
)
```

#### 自定义评估器

```python
from langsmith.evaluation import EvaluationResult

def custom_evaluator(run, example):
    # 自定义评估逻辑
    output = run.outputs["output"]
    
    # 检查是否包含关键词
    if "退款" in str(output) and "订单" in str(output):
        score = 1.0
    else:
        score = 0.5
    
    return EvaluationResult(
        key="custom_accuracy",
        score=score,
        comment="基于关键词匹配",
    )

# 使用自定义评估器
results = evaluate(
    agent_function,
    data=dataset,
    evaluators=[custom_evaluator],
)
```

### 4.3 运行评估

```python
from langsmith.evaluation import evaluate

def run_agent(inputs):
    result = agent.invoke({"messages": [{"role": "user", "content": inputs["question"]}]})
    return {"answer": result["messages"][-1].content}

# 运行评估
results = evaluate(
    run_agent,
    data=dataset,
    evaluators=[
        LangChainStringEvaluator("accuracy"),
        LangChainStringEvaluator("relevance"),
        custom_evaluator,
    ],
    experiment_prefix="v2-model-test",
)

# 查看结果
print(f"实验 URL：{results.url}")
```

### 4.4 A/B 测试

```python
# 评估不同模型
results_claude = evaluate(claude_agent, data=dataset, evaluators=evaluators)
results_gpt = evaluate(gpt_agent, data=dataset, evaluators=evaluators)

# 在 LangSmith 界面可以对比两个实验的结果
```

### 4.5 回归测试

```python
# 将评估集成到 CI/CD
def test_agent_regression():
    results = evaluate(agent, data=dataset, evaluators=evaluators)
    
    # 检查准确率是否达标
    avg_accuracy = results["accuracy"]["avg"]
    assert avg_accuracy >= 0.85, f"准确率 {avg_accuracy} 低于阈值 0.85"
```

---

## 五、监控与分析

### 5.1 成本追踪

```
┌─────────────────────────────────────────────────────────────────┐
│                    LangSmith 成本分析                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  本月总成本：$1,234.56                                          │
│                                                                 │
│  按项目:                                                        │
│  ├─ customer-support: $567.89 (46%)                            │
│  ├─ research-assistant: $345.67 (28%)                          │
│  └─ chatbot: $321.00 (26%)                                     │
│                                                                 │
│  按模型:                                                        │
│  ├─ claude-sonnet-4-6: $789.12 (64%)                           │
│  ├─ gpt-4o: $345.67 (28%)                                      │
│  └─ gpt-4o-mini: $99.77 (8%)                                   │
│                                                                 │
│  趋势: ↑ 12% vs 上月                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 性能监控

```python
# 设置告警
from langsmith import Client

client = Client()

# 创建告警规则
client.create_alert(
    name="高延迟告警",
    condition="avg_latency_ms > 5000",
    project="customer-support",
    notification_channels=["email", "slack"],
)
```

### 5.3 使用分析

在 LangSmith 仪表板可以查看：

- 📊 **请求量趋势** — 每天/每周的请求数
- 👥 **用户分析** — 活跃用户、使用频率
- 🌍 **地域分布** — 用户来源
- 📱 **设备类型** — Web、Mobile、API

---

## 六、Prompt 管理

### 6.1 创建 Prompt

```python
from langsmith import Client

client = Client()

# 创建 Prompt
prompt = client.create_prompt(
    name="customer-support-response",
    prompt_template="""你是一个客服助手。

## 风格
- 友好、专业
- 简洁明了
- 提供具体步骤

## 用户问题
{question}

## 已知信息
{context}

请基于已知信息回答用户问题。""",
    tags=["customer-support", "production"],
)
```

### 6.2 版本控制

```python
# 更新 Prompt（创建新版本）
client.update_prompt(
    prompt_id=prompt.id,
    prompt_template="""...新版本内容...""",
    commit_message="添加退款流程说明",
)

# 查看历史版本
versions = client.list_prompt_versions(prompt_id=prompt.id)

# 回滚到旧版本
client.rollback_prompt(prompt_id=prompt.id, version=2)
```

### 6.3 在代码中使用

```python
from langsmith import Client
from langchain.prompts import PromptTemplate

client = Client()

# 获取最新版本的 Prompt
prompt_data = client.get_prompt("customer-support-response")

# 转换为 LangChain Prompt
prompt = PromptTemplate.from_template(prompt_data.prompt_template)

# 使用
formatted = prompt.invoke({"question": "如何退款？", "context": "..."})
```

---

## 七、团队协作

### 7.1 项目共享

```
┌─────────────────────────────────────────────────────────────────┐
│                    LangSmith 权限管理                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  组织：MyCompany                                                │
│  │                                                              │
│  ├─ 项目：customer-support                                      │
│  │  ├─ Owner: 张三                                             │
│  │  ├─ Editor: 李四、王五                                      │
│  │  └─ Viewer: 整个团队                                        │
│  │                                                              │
│  ├─ 项目：research-assistant                                    │
│  │  ├─ Owner: 李四                                             │
│  │  └─ Editor: 张三                                            │
│  │                                                              │
│  └─ 项目：chatbot                                               │
│     ├─ Owner: 王五                                             │
│     └─ Viewer: 整个团队                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 评论与反馈

在 LangSmith 界面：

- 在任何追踪下添加评论
- @提及团队成员
- 标记问题为已解决
- 分享最佳实践

---

## 八、高级功能

### 8.1 数据集转换

```python
from langsmith import Client

client = Client()

# 从现有运行创建数据集
dataset = client.create_dataset_from_runs(
    dataset_name="production-qa",
    filters={"project_name": "customer-support"},
    limit=100,
)
```

### 8.2 在线评估

```python
from langsmith.evaluation import run_on_dataset

# 持续评估生产环境
run_on_dataset(
    dataset="production-samples",
    llm_or_chain_factory=create_agent,
    evaluators=[accuracy_evaluator],
    concurrency_level=10,
)
```

### 8.3 自定义仪表板

```python
# 使用 LangSmith API 获取数据
from langsmith import Client

client = Client()

# 获取指标
metrics = client.get_dataset_metrics(
    dataset_id=dataset.id,
    metrics=["accuracy", "latency"],
)

# 集成到自己的仪表板
```

---

## 九、最佳实践

### 9.1 追踪最佳实践

✅ **应该做：**

```python
# 为每个用户会话设置 thread_id
config = {"configurable": {"thread_id": user_session_id}}
agent.invoke(inputs, config=config)

# 添加有意义的元数据
@traceable(metadata={"user_id": user_id, "feature": "search"})
def search_feature(query):
    ...

# 使用标签分类
@traceable(tags=["production", "critical"])
def critical_function():
    ...
```

❌ **避免：**

```python
# 不要在追踪中记录敏感信息
@traceable(metadata={"password": "123"})  # ❌

# 不要过度追踪（成本考虑）
# 只在关键路径开启追踪
```

### 9.2 评估最佳实践

- **数据集多样性** — 覆盖各种场景和边缘情况
- **定期更新** — 随着产品迭代更新测试集
- **多个评估指标** — 不要只看准确率
- **人工审核** — 定期抽样人工检查

### 9.3 成本优化

- **设置预算告警** — 避免意外超支
- **分析 Token 使用** — 优化 Prompt 长度
- **选择合适模型** — 不是所有场景都需要最强模型
- **缓存结果** — 减少重复调用

---

## 十、定价与计划

| 计划 | 价格 | 适合场景 |
|------|------|----------|
| **Developer** | 免费 | 个人开发、学习 |
| **Plus** | $39/月 | 小团队、初创公司 |
| **Enterprise** | 定制 | 大型企业、定制需求 |

---

## 十一、常见问题

### Q1: LangSmith 是必须的吗？

不是必须的，但强烈推荐。对于生产环境，LangSmith 可以节省大量调试和监控时间。

### Q2: 数据隐私如何保障？

- 数据加密存储
- 可选自托管
- GDPR 合规
- 可配置数据保留策略

### Q3: 支持非 LangChain 项目吗？

支持！可以使用 LangSmith SDK 追踪任何 Python/JavaScript 代码。

---

## 十二、学习资源

- 🏠 **官方网站**: [smith.langchain.com](https://smith.langchain.com)
- 📚 **文档**: [docs.smith.langchain.com](https://docs.smith.langchain.com)
- 🎓 **教程**: 官方提供多个实战教程
- 💬 **社区**: LangChain Discord

---

> 💡 **提示**: LangSmith 提供免费套餐，建议在学习 LangChain 时就开启追踪，养成良好的调试习惯。
