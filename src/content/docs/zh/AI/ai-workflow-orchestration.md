---
title: "AI 工作流编排详解：从 LangChain 到 Dify"
order: 13
section: "AI"
topic: "AI 技术"
lang: "zh"
slug: "ai-workflow-orchestration"
summary: "深入讲解 AI 工作流编排的概念、主流框架对比、设计模式，以及生产环境实战案例。"
icon: "⚙️"
featured: false
toc: true
updated: 2026-03-06
---

> 工作流编排是将多个 AI 能力组合成复杂应用的关键技术，决定了 AI 应用的灵活性、可维护性和可扩展性。

## 一、为什么需要工作流编排？

### 1.1 单一 LLM 的局限

```
场景：构建一个智能客服系统

❌ 只用 LLM：
用户："我的订单还没到，帮我查一下"
LLM："抱歉，我无法访问您的订单信息。"
（LLM 无法访问外部数据）

✅ 工作流编排：
用户："我的订单还没到，帮我查一下"
  ↓
[意图识别] → 订单查询意图
  ↓
[订单查询] → 调用订单 API
  ↓
[物流查询] → 调用物流 API
  ↓
[回复生成] → 组织回复
  ↓
"您的订单已发货，预计明天送达，物流单号：SF123456"
```

### 1.2 工作流编排的价值

| 价值 | 描述 | 实际效果 |
|------|------|---------|
| **组合能力** | 将多个技能组合成复杂流程 | 实现单一 LLM 做不到的事 |
| **可控性** | 明确定义每个步骤 | 便于调试、优化、审计 |
| **可复用** | 流程模块化，可重复使用 | 降低开发成本 |
| **可监控** | 每个步骤可追踪 | 便于问题定位 |
| **人机协作** | 关键节点可人工介入 | 保证质量和安全 |

### 1.3 典型工作流场景

```
┌─────────────────────────────────────────────────────────────────┐
│                    典型 AI 工作流场景                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 内容创作工作流                                               │
│     选题 → 搜集资料 → 写大纲 → 写初稿 → 审核 → 修改 → 发布       │
│                                                                 │
│  2. 数据分析工作流                                               │
│     数据加载 → 数据清洗 → 探索分析 → 建模 → 可视化 → 报告生成    │
│                                                                 │
│  3. 客服工作流                                                   │
│     意图识别 → 知识检索 → 答案生成 → 人工审核（可选）→ 发送      │
│                                                                 │
│  4. 代码开发工作流                                               │
│     需求理解 → 架构设计 → 代码生成 → 代码审查 → 测试 → 部署      │
│                                                                 │
│  5. 营销工作流                                                   │
│     市场分析 → 竞品调研 → 文案创作 → 配图生成 → 多平台发布       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、主流编排框架对比

### 2.1 完整对比表（2026 年 3 月）

| 框架 | 类型 | 语言 | 最新版本 | 学习曲线 | 可视化 | 适用场景 |
|------|------|------|---------|---------|--------|---------|
| **LangChain** | 代码库 | Python/JS | 0.3.x | 中等 | ❌ | 开发者定制 |
| **LlamaIndex** | 代码库 | Python | 0.12.x | 中等 | ❌ | RAG 场景 |
| **Dify** | 低代码平台 | Web UI | 1.0.x | 简单 | ✅ | 快速搭建 |
| **Flowise** | 低代码平台 | Web UI | 2.0.x | 简单 | ✅ | 可视化编排 |
| **AutoGen** | 多 Agent 框架 | Python | 0.4.x | 较陡 | ❌ | 多 Agent 协作 |
| **CrewAI** | 角色化框架 | Python | 0.80.x | 中等 | ❌ | 角色模拟 |
| **LangGraph** | 图编排 | Python | 0.2.x | 较陡 | ✅ | 复杂状态机 |

### 2.2 LangChain：开发者首选

**核心概念：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    LangChain 核心组件                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Model I/O（模型输入输出）                                    │
│     • Prompt Templates：提示词模板                               │
│     • LLMs：大模型抽象层                                         │
│     • Output Parsers：输出解析器                                 │
│                                                                 │
│  2. Retrieval（检索）                                            │
│     • Document Loaders：文档加载器                               │
│     • Text Splitters：文本切片器                                 │
│     • Vector Stores：向量存储                                    │
│     • Retrievers：检索器                                         │
│                                                                 │
│  3. Agents（智能体）                                             │
│     • Tools：工具                                                │
│     • Agents：智能体                                             │
│     • Agent Executors：智能体执行器                              │
│                                                                 │
│  4. Chains（链）                                                 │
│     • Chains：链（多个组件串联）                                 │
│     • Callbacks：回调（监控、日志）                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**基础示例：**
```python
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.llms import OpenAI

# 1. 定义提示词模板
prompt = PromptTemplate(
    input_variables=["product"],
    template="请为{product}写一个吸引人的广告语。"
)

# 2. 创建链
chain = LLMChain(
    llm=OpenAI(temperature=0.7),
    prompt=prompt
)

# 3. 执行
result = chain.run(product="智能手表")
print(result)
# 输出："智能手表，让时间更有价值！"
```

**复杂工作流示例：**
```python
from langchain.chains import SequentialChain, TransformChain
from langchain.agents import initialize_agent, Tool
from langchain.utilities import GoogleSearchAPIWrapper

# 定义工具
search = GoogleSearchAPIWrapper()
tools = [
    Tool(
        name="Search",
        func=search.run,
        description="搜索互联网获取最新信息"
    ),
    Tool(
        name="Calculator",
        func=lambda x: str(eval(x)),
        description="计算数学表达式"
    )
]

# 创建 Agent
llm = OpenAI(temperature=0)
agent = initialize_agent(
    tools,
    llm,
    agent="zero-shot-react-description",
    verbose=True
)

# 定义多步骤工作流
def research_and_write(topic: str) -> str:
    """研究并写作工作流"""
    
    # 步骤 1：搜索信息
    search_query = f"最新的{topic}发展趋势"
    search_results = agent.run(f"搜索：{search_query}")
    
    # 步骤 2：整理要点
    outline = agent.run(f"""
    根据以下信息，整理出 5 个核心要点：
    {search_results}
    """)
    
    # 步骤 3：撰写文章
    article = agent.run(f"""
    根据以下要点，写一篇 800 字的文章：
    {outline}
    
    要求：
    - 结构清晰，有引言、正文、结论
    - 语言流畅，专业但不晦涩
    - 包含具体案例
    """)
    
    return article

# 执行工作流
article = research_and_write("人工智能")
print(article)
```

### 2.3 Dify：低代码平台

**特点：**
- 可视化工作流编排
- 内置 RAG、Agent 能力
- 一键部署

**工作流示例：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dify 客服工作流                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐                                                   │
│  │   开始    │ 用户输入                                          │
│  └─────┬────┘                                                   │
│        │                                                        │
│        ▼                                                        │
│  ┌──────────┐                                                   │
│  │ 意图识别  │ LLM 分类：咨询/投诉/建议                            │
│  └─────┬────┘                                                   │
│        │                                                        │
│        ├─────────────────┬─────────────────┐                    │
│        │                 │                 │                    │
│        ▼                 ▼                 ▼                    │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐              │
│  │  咨询     │      │  投诉     │      │  建议     │              │
│  └─────┬────┘      └─────┬────┘      └─────┬────┘              │
│        │                 │                 │                    │
│        ▼                 ▼                 ▼                    │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐              │
│  │ 知识检索  │      │ 安抚情绪  │      │ 记录反馈  │              │
│  │   RAG    │      │ 转人工    │      │ 感谢     │              │
│  └─────┬────┘      └─────┬────┘      └─────┬────┘              │
│        │                 │                 │                    │
│        ▼                 │                 │                    │
│  ┌──────────┐            │                 │                    │
│  │ 答案生成  │            │                 │                    │
│  └─────┬────┘            │                 │                    │
│        │                 │                 │                    │
│        └─────────────────┴─────────────────┘                    │
│                          │                                       │
│                          ▼                                       │
│                    ┌──────────┐                                 │
│                    │   结束    │ 输出回复                         │
│                    └──────────┘                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Dify 配置示例（YAML）：**
```yaml
app:
  name: 智能客服
  description: 自动处理客户咨询

workflow:
  nodes:
    - id: start
      type: start
      next: intent_classification
    
    - id: intent_classification
      type: llm
      prompt: |
        请判断用户意图：
        {{user_input}}
        
        选项：咨询、投诉、建议
      next:
        - condition: intent == "咨询"
          next: knowledge_search
        - condition: intent == "投诉"
          next: complaint_handle
        - condition: intent == "建议"
          next: suggestion_record
    
    - id: knowledge_search
      type: knowledge_retrieval
      knowledge_base: product_kb
      top_k: 3
      next: answer_generation
    
    - id: answer_generation
      type: llm
      prompt: |
        根据以下知识回答问题：
        {{retrieved_content}}
        
        用户问题：{{user_input}}
      next: end
    
    - id: complaint_handle
      type: llm
      prompt: |
        用户投诉，请安抚并询问详情：
        {{user_input}}
      next: human_handoff
    
    - id: human_handoff
      type: human_handoff
      next: end
    
    - id: suggestion_record
      type: http_request
      url: https://api.example.com/feedback
      method: POST
      body:
        content: {{user_input}}
      next: end
    
    - id: end
      type: end
```

### 2.4 Flowise：可视化编排

**特点：**
- 拖拽式界面
- 基于 LangChain
- 快速原型

**界面示例：**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Flowise 工作流                                │
│                                                                 │
│  [PDF Loader] ──▶ [Text Splitter] ──▶ [Embedding] ──┐          │
│                                                      │          │
│  [User Input] ──▶ [Embedding] ──────────────────┬───▶│          │
│                                                 │    │          │
│                                                 ▼    ▼          │
│                                          [Vector Store]         │
│                                                 │               │
│                                                 ▼               │
│                                          [Retriever]            │
│                                                 │               │
│                                                 ▼               │
│                                    [Prompt Template]            │
│                                                 │               │
│                                                 ▼               │
│                                          [LLM (GPT-4)]          │
│                                                 │               │
│                                                 ▼               │
│                                            [Output]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、工作流设计模式

### 3.1 顺序模式（Sequential）

```
A → B → C → D

特点：
• 步骤按顺序执行
• 前一步输出是后一步输入
• 适合线性流程

例子：文档处理
原文 → 切片 → 向量化 → 存储 → 检索 → 生成回答
```

**LangChain 实现：**
```python
from langchain.chains import SequentialChain

# 定义多个链
chain1 = LLMChain(llm=llm, prompt=prompt1, output_key="summary")
chain2 = LLMChain(llm=llm, prompt=prompt2, output_key="keywords")
chain3 = LLMChain(llm=llm, prompt=prompt3, output_key="article")

# 串联
overall_chain = SequentialChain(
    chains=[chain1, chain2, chain3],
    input_variables=["topic"],
    output_variables=["article"],
    verbose=True
)

# 执行
result = overall_chain({"topic": "AI 发展趋势"})
```

### 3.2 并行模式（Parallel）

```
     ┌──→ B ──┐
A ──┤         ├──→ D
     └──→ C ──┘

特点：
• B 和 C 并行执行
• D 等待 B 和 C 都完成后执行
• 适合独立子任务

例子：多角度分析
问题 → [技术分析] ──┬──→ 综合报告
     → [市场分析] ──┘
```

**实现：**
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def parallel_analysis(question: str) -> dict:
    """并行分析"""
    
    # 定义任务
    tasks = [
        analyze_technical(question),
        analyze_market(question),
        analyze_competitor(question)
    ]
    
    # 并行执行
    results = await asyncio.gather(*tasks)
    
    # 合并结果
    return {
        "technical": results[0],
        "market": results[1],
        "competitor": results[2]
    }

# 使用
results = asyncio.run(parallel_analysis("AI 行业前景"))
```

### 3.3 条件分支模式（Conditional）

```
        ┌──→ B (条件 1)
A ──┬───┼──→ C (条件 2)
    │   └──→ D (条件 3)
    │
    └──→ E (默认)

特点：
• 根据条件选择不同分支
• 适合分类处理

例子：客服路由
用户消息 → 意图识别 → [咨询/投诉/建议] → 不同处理流程
```

**LangChain 实现：**
```python
from langchain.chains import RouterChain, MultiPromptChain

# 定义多个子链
chains = {
    "咨询": LLMChain(llm=llm, prompt=consult_prompt),
    "投诉": LLMChain(llm=llm, prompt=complaint_prompt),
    "建议": LLMChain(llm=llm, prompt=suggestion_prompt)
}

# 路由链
router_chain = RouterChain.from_llm(
    llm=llm,
    prompt=router_prompt,  # 判断意图
    destination_chains=chains,
    default_chain=default_chain,
    verbose=True
)

# 执行
result = router_chain.run(user_input)
```

### 3.4 循环模式（Iterative）

```
    ┌──────────────┐
    │              │
    ▼              │
A → B → C → D ─────┘
       │
       ▼ (满足条件退出)
       E

特点：
• 循环执行直到满足条件
• 适合迭代优化

例子：代码生成
需求 → 生成代码 → 测试 → 失败则修改 → 通过则输出
```

**实现：**
```python
def iterative_code_generation(requirement: str, max_iterations: int = 5) -> str:
    """迭代代码生成"""
    
    code = None
    for i in range(max_iterations):
        # 生成/修改代码
        code = llm.generate(f"""
        需求：{requirement}
        当前代码：{code}
        问题：{errors}
        
        请生成正确的代码。
        """)
        
        # 测试
        errors = run_tests(code)
        
        # 检查是否通过
        if not errors:
            break
        
        print(f"第{i+1}次迭代，错误：{errors}")
    
    return code
```

### 3.5 Map-Reduce 模式

```
         ┌──→ B1 ──┐
         ├──→ B2 ──┤
A ──Map─┤          ├──→ Reduce ──▶ C
         ├──→ B3 ──┤
         └──→ B4 ──┘

特点：
• Map：并行处理多个子任务
• Reduce：合并结果
• 适合大规模数据处理

例子：长文档总结
文档 → 分段 → [每段总结] → 合并 → 最终总结
```

**LangChain 实现：**
```python
from langchain.chains import MapReduceDocumentsChain, ReduceDocumentsChain

# Map 阶段
map_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template("""
    总结以下内容的核心要点：
    {content}
    
    要点：
    """)
)

# Reduce 阶段
reduce_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template("""
    综合以下要点，生成最终总结：
    {content}
    
    最终总结：
    """)
)

# 组合
map_reduce = MapReduceDocumentsChain(
    llm_chain=map_chain,
    reduce_chain=ReduceDocumentsChain(llm_chain=reduce_chain),
    document_variable_name="content"
)

# 执行
result = map_reduce.run(long_document)
```

---

## 四、生产环境实战

### 4.1 智能客服系统

```python
class IntelligentCustomerService:
    """智能客服系统"""
    
    def __init__(self):
        # 初始化组件
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0.3)
        self.retriever = self._create_retriever()
        self.intent_classifier = self._create_intent_classifier()
        self.sentiment_analyzer = self._create_sentiment_analyzer()
        
        # 工具
        self.tools = {
            "order_query": OrderQueryTool(),
            "refund_process": RefundTool(),
            "human_handoff": HumanHandoffTool()
        }
    
    def handle_request(self, user_input: str, user_context: dict) -> dict:
        """处理用户请求"""
        
        # 步骤 1：情感分析（优先）
        sentiment = self.sentiment_analyzer.analyze(user_input)
        if sentiment == "angry":
            # 愤怒用户直接转人工
            return self.tools["human_handoff"].execute(
                reason="用户情绪激动",
                context=user_context
            )
        
        # 步骤 2：意图识别
        intent = self.intent_classifier.classify(user_input)
        
        # 步骤 3：根据意图路由
        if intent == "order_query":
            return self._handle_order_query(user_input, user_context)
        elif intent == "product_consult":
            return self._handle_consult(user_input)
        elif intent == "complaint":
            return self._handle_complaint(user_input, user_context)
        elif intent == "refund":
            return self._handle_refund(user_input, user_context)
        else:
            return self._handle_general(user_input)
    
    def _handle_order_query(self, user_input: str, context: dict) -> dict:
        """处理订单查询"""
        
        # 提取订单号
        order_id = self._extract_order_id(user_input)
        
        if not order_id:
            # 没有订单号，追问
            return {
                "response": "请问您的订单号是多少？",
                "action": "ask_order_id"
            }
        
        # 查询订单
        order_info = self.tools["order_query"].execute(order_id)
        
        if not order_info:
            return {
                "response": "未找到该订单，请检查订单号是否正确。",
                "action": "none"
            }
        
        # 查询物流
        logistics = self._query_logistics(order_id)
        
        # 生成回复
        response = self.llm.generate(f"""
        订单信息：{order_info}
        物流信息：{logistics}
        
        请用友好的语气告知用户订单状态。
        """)
        
        return {
            "response": response,
            "action": "none",
            "data": {
                "order": order_info,
                "logistics": logistics
            }
        }
    
    def _handle_consult(self, user_input: str) -> dict:
        """处理产品咨询"""
        
        # RAG 检索
        relevant_docs = self.retriever.get_relevant_documents(user_input, top_k=3)
        
        # 生成回答
        response = self.llm.generate(f"""
        请根据以下知识回答用户问题：
        
        相关知识：
        {relevant_docs}
        
        用户问题：{user_input}
        
        要求：
        - 准确、专业
        - 如果知识中没有相关信息，请诚实告知
        - 引导用户进一步提问
        """)
        
        return {
            "response": response,
            "action": "none",
            "sources": relevant_docs
        }
    
    def _handle_complaint(self, user_input: str, context: dict) -> dict:
        """处理投诉"""
        
        # 安抚情绪
        empathy = self.llm.generate(f"""
        用户投诉：{user_input}
        
        请表达理解和歉意，并承诺会处理。
        """)
        
        # 记录投诉
        complaint_id = self._create_complaint_ticket(user_input, context)
        
        # 判断是否需要人工介入
        needs_human = self._assess_complaint_severity(user_input)
        
        if needs_human:
            return {
                "response": f"{empathy}\n\n已为您创建工单（编号：{complaint_id}），"
                           f"客服专员将在 1 小时内联系您。",
                "action": "human_handoff",
                "ticket_id": complaint_id
            }
        else:
            return {
                "response": f"{empathy}\n\n已为您记录问题（编号：{complaint_id}），"
                           f"我们会尽快处理。",
                "action": "none",
                "ticket_id": complaint_id
            }
    
    def _handle_refund(self, user_input: str, context: dict) -> dict:
        """处理退款"""
        
        # 验证退款资格
        eligibility = self._check_refund_eligibility(context)
        
        if not eligibility["eligible"]:
            return {
                "response": f"抱歉，根据政策，您的订单不符合退款条件。"
                           f"原因：{eligibility['reason']}",
                "action": "none"
            }
        
        # 处理退款
        result = self.tools["refund_process"].execute(
            order_id=context["order_id"],
            reason=user_input
        )
        
        return {
            "response": f"退款申请已提交，预计 3-5 个工作日到账。"
                       f"退款单号：{result['refund_id']}",
            "action": "none",
            "refund_id": result["refund_id"]
        }
    
    def _handle_general(self, user_input: str) -> dict:
        """处理一般问题"""
        
        # 直接用 LLM 回答
        response = self.llm.generate(f"""
        请友好、专业地回答用户问题：
        
        {user_input}
        """)
        
        return {
            "response": response,
            "action": "none"
        }
```

### 4.2 内容创作工作流

```python
class ContentCreationWorkflow:
    """内容创作工作流"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
        self.search_tool = SearchTool()
        self.image_gen = ImageGenerationTool()
    
    def create_article(self, topic: str, target_audience: str) -> dict:
        """创建文章完整工作流"""
        
        # 步骤 1：市场调研
        print("步骤 1：市场调研...")
        market_data = self._research_market(topic)
        
        # 步骤 2：生成大纲
        print("步骤 2：生成大纲...")
        outline = self._generate_outline(topic, market_data, target_audience)
        
        # 步骤 3：撰写初稿
        print("步骤 3：撰写初稿...")
        draft = self._write_draft(outline)
        
        # 步骤 4：自我审查
        print("步骤 4：自我审查...")
        review_feedback = self._self_review(draft)
        
        # 步骤 5：修改优化
        print("步骤 5：修改优化...")
        final = self._revise(draft, review_feedback)
        
        # 步骤 6：生成配图
        print("步骤 6：生成配图...")
        images = self._generate_images(final)
        
        # 步骤 7：SEO 优化
        print("步骤 7：SEO 优化...")
        seo_meta = self._optimize_seo(final)
        
        return {
            "title": outline["title"],
            "content": final,
            "images": images,
            "seo": seo_meta,
            "outline": outline
        }
    
    def _research_market(self, topic: str) -> dict:
        """市场调研"""
        search_results = self.search_tool.run(
            f"{topic} 最新趋势 2024",
            num_results=10
        )
        
        # 分析趋势
        trends = self.llm.generate(f"""
        分析以下搜索结果的共同趋势：
        {search_results}
        
        总结 3-5 个关键趋势。
        """)
        
        return {"trends": trends, "sources": search_results}
    
    def _generate_outline(self, topic: str, market_data: dict, audience: str) -> dict:
        """生成大纲"""
        outline = self.llm.generate(f"""
        主题：{topic}
        目标受众：{audience}
        市场趋势：{market_data['trends']}
        
        请生成文章大纲：
        - 标题（吸引人）
        - 引言（100 字）
        - 3-5 个小标题
        - 结论
        
        格式：JSON
        """)
        return json.loads(outline)
    
    def _write_draft(self, outline: dict) -> str:
        """撰写初稿"""
        draft = self.llm.generate(f"""
        根据以下大纲撰写文章：
        
        标题：{outline['title']}
        引言：{outline['introduction']}
        小标题：{outline['sections']}
        
        要求：
        - 每节 300-500 字
        - 语言流畅，有案例
        - 适合{outline['audience']}阅读
        """)
        return draft
    
    def _self_review(self, draft: str) -> dict:
        """自我审查"""
        feedback = self.llm.generate(f"""
        请审查以下文章：
        
        {draft}
        
        审查维度：
        1. 逻辑是否清晰
        2. 论据是否充分
        3. 语言是否流畅
        4. 是否有错别字
        5. 改进建议
        
        格式：JSON
        """)
        return json.loads(feedback)
    
    def _revise(self, draft: str, feedback: dict) -> str:
        """修改优化"""
        revised = self.llm.generate(f"""
        原文：
        {draft}
        
        审查意见：
        {feedback}
        
        请根据审查意见修改文章。
        """)
        return revised
    
    def _generate_images(self, article: str) -> list:
        """生成配图"""
        # 提取关键场景
        scenes = self.llm.generate(f"""
        从文章中提取 3-5 个适合配图的场景描述。
        
        {article}
        """)
        
        # 生成图片
        images = []
        for scene in json.loads(scenes):
            image_url = self.image_gen.generate(prompt=scene)
            images.append({"prompt": scene, "url": image_url})
        
        return images
    
    def _optimize_seo(self, article: str) -> dict:
        """SEO 优化"""
        seo = self.llm.generate(f"""
        为以下文章生成 SEO 元数据：
        
        {article}
        
        需要：
        - meta title（60 字符内）
        - meta description（160 字符内）
        - 5 个关键词
        - URL slug
        
        格式：JSON
        """)
        return json.loads(seo)
```

### 4.3 监控与日志

```python
import logging
from datetime import datetime
from typing import Optional

class WorkflowMonitor:
    """工作流监控"""
    
    def __init__(self):
        self.logger = logging.getLogger("workflow")
        self.metrics = {}
    
    def start_workflow(self, workflow_id: str, input_data: dict):
        """记录工作流开始"""
        self.logger.info(f"[{workflow_id}] 开始执行", extra={
            "workflow_id": workflow_id,
            "input": input_data,
            "timestamp": datetime.now().isoformat()
        })
        self.metrics[workflow_id] = {
            "start_time": datetime.now(),
            "steps": []
        }
    
    def log_step(self, workflow_id: str, step_name: str, 
                 input_data: dict, output_data: dict, 
                 duration: float, status: str = "success"):
        """记录步骤执行"""
        self.logger.info(f"[{workflow_id}] 步骤：{step_name}", extra={
            "workflow_id": workflow_id,
            "step": step_name,
            "input": input_data,
            "output": output_data,
            "duration": duration,
            "status": status
        })
        
        self.metrics[workflow_id]["steps"].append({
            "name": step_name,
            "duration": duration,
            "status": status
        })
    
    def end_workflow(self, workflow_id: str, final_output: dict, 
                     status: str = "success"):
        """记录工作流结束"""
        metrics = self.metrics[workflow_id]
        total_duration = (datetime.now() - metrics["start_time"]).total_seconds()
        
        self.logger.info(f"[{workflow_id}] 执行完成", extra={
            "workflow_id": workflow_id,
            "total_duration": total_duration,
            "steps_count": len(metrics["steps"]),
            "status": status,
            "output": final_output
        })
        
        # 上报指标
        self._report_metrics(workflow_id, total_duration, status)
    
    def _report_metrics(self, workflow_id: str, duration: float, status: str):
        """上报监控指标"""
        # 可以集成 Prometheus、Datadog 等
        pass


# 使用示例
monitor = WorkflowMonitor()

def monitored_workflow(user_input: str):
    workflow_id = f"wf_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    try:
        monitor.start_workflow(workflow_id, {"input": user_input})
        
        # 步骤 1
        step1_start = datetime.now()
        result1 = step1(user_input)
        monitor.log_step(
            workflow_id, "step1",
            {"input": user_input}, {"output": result1},
            (datetime.now() - step1_start).total_seconds()
        )
        
        # 步骤 2
        step2_start = datetime.now()
        result2 = step2(result1)
        monitor.log_step(
            workflow_id, "step2",
            {"input": result1}, {"output": result2},
            (datetime.now() - step2_start).total_seconds()
        )
        
        monitor.end_workflow(workflow_id, {"result": result2})
        return result2
        
    except Exception as e:
        monitor.end_workflow(workflow_id, {"error": str(e)}, "failed")
        raise
```

---

## 🎯 面试回答版本

> 面试官问："你了解 AI 工作流编排吗？有哪些实践经验？"

### 标准回答（2-3 分钟）

```
工作流编排是将多个 AI 能力组合成复杂应用的关键技术。

【为什么需要】
单一 LLM 有局限：无法访问外部数据、不可控、难调试。
工作流编排可以组合多个技能，实现复杂业务逻辑。

【主流框架】
代码库：LangChain（功能全）、LlamaIndex（专注 RAG）
低代码：Dify（可视化）、Flowise（拖拽式）
多 Agent：AutoGen、CrewAI

【设计模式】
常用 5 种模式：
1. 顺序模式：步骤依次执行
2. 并行模式：独立任务并行
3. 条件分支：根据意图路由
4. 循环模式：迭代优化
5. Map-Reduce：大规模处理

【实战经验】
我搭建过智能客服系统，工作流包括：
情感分析 → 意图识别 → 知识检索 → 答案生成 → 人工介入（可选）
日均处理 1000+ 咨询，自动化率 85%。

【监控优化】
关键指标：每步耗时、成功率、人工介入率。
用日志追踪每个步骤，便于问题定位和优化。
```

### 高频追问

| 追问 | 参考回答 |
|------|---------|
| "LangChain 和 Dify 怎么选？" | 开发者定制用 LangChain，快速搭建/非技术团队用 Dify。 |
| "如何保证工作流稳定性？" | 重试机制、超时控制、降级方案、人工兜底。 |
| "工作流执行慢怎么优化？" | 并行化、缓存、异步处理、预计算。 |
| "如何调试复杂工作流？" | 详细日志、步骤追踪、可视化监控、回放功能。 |

---

**相关阅读：**
- [AI Agent 技能详解](./ai-agent-skill-intro.md) - 了解技能设计
- [Function Calling](./ai-function-calling.md) - 学习函数调用
- [RAG 技术详解](./ai-rag-deep-dive.md) - 学习检索增强
