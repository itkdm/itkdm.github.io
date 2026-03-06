---
title: "Function Calling 详解：让 AI 安全调用外部函数"
order: 10
section: "AI"
topic: "AI 技术"
lang: "zh"
slug: "ai-function-calling"
summary: "深入讲解 Function Calling 的原理、实现方式、安全机制，以及如何在 Agent 中集成函数调用。"
icon: "🔧"
featured: false
toc: true
updated: 2026-03-06
---

> Function Calling（函数调用）是 AI Agent 调用外部工具的核心机制，让 LLM 能够安全地执行实际操作。

## 一、什么是 Function Calling？

### 1.1 定义

**Function Calling = LLM 安全调用外部函数的机制**

LLM 本身只能生成文本，无法执行实际操作。Function Calling 让 LLM 能够：
- 告诉系统"我想调用哪个函数"
- 提供正确的参数
- 接收函数执行结果
- 基于结果生成最终回答

### 1.2 通俗理解

用一个比喻：
- **LLM** = 军师（出谋划策）
- **Function** = 武将（执行任务）
- **Function Calling** = 调兵遣将的机制

```
传统对话：
用户："北京今天天气怎么样？"
LLM："抱歉，我无法获取实时信息。"
（LLM 只能基于训练数据回答）

Function Calling：
用户："北京今天天气怎么样？"
LLM → 系统："调用 weather_query(city='北京')"
系统 → LLM: {"temp": 25, "condition": "晴"}
LLM → 用户："北京今天晴天，气温 25 度。"
（LLM 通过函数获取实时信息）
```

### 1.3 为什么需要 Function Calling？

| 需求 | 原因 | 例子 |
|------|------|------|
| **获取实时信息** | LLM 知识有截止时间 | 天气、股票、新闻 |
| **执行实际操作** | LLM 只能生成文本 | 发送邮件、创建文件 |
| **访问私有数据** | 数据不在训练集中 | 数据库、内部 API |
| **精确计算** | LLM 不擅长数学 | 计算器、代码执行 |
| **安全控制** | 限制 LLM 能力范围 | 权限管理、审计日志 |

---

## 二、Function Calling 工作原理

### 2.1 完整流程

```
┌──────────────────────────────────────────────────────────────────┐
│                  Function Calling 流程                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 用户提问                                                      │
│     用户："帮我查一下北京的天气"                                   │
│                          │                                       │
│                          ▼                                       │
│  2. LLM 分析意图，决定调用函数                                     │
│     LLM 思考：需要调用 weather_query 函数                          │
│                          │                                       │
│                          ▼                                       │
│  3. LLM 返回函数调用请求（不是直接回答）                           │
│     {"function": "weather_query", "arguments": {"city": "北京"}}   │
│                          │                                       │
│                          ▼                                       │
│  4. 系统执行函数（LLM 不参与）                                     │
│     系统调用 API，获取天气数据                                     │
│                          │                                       │
│                          ▼                                       │
│  5. 系统将结果返回给 LLM                                          │
│     {"temperature": 25, "condition": "晴"}                        │
│                          │                                       │
│                          ▼                                       │
│  6. LLM 基于结果生成最终回答                                       │
│     "北京今天晴天，气温 25 度，适宜出行。"                           │
│                          │                                       │
│                          ▼                                       │
│  7. 用户收到回答                                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 函数定义格式

**OpenAI 风格：**
```json
{
  "name": "weather_query",
  "description": "查询指定城市的天气信息",
  "parameters": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "城市名称，如'北京'、'上海'"
      },
      "date": {
        "type": "string",
        "description": "日期，格式 YYYY-MM-DD，默认为今天"
      }
    },
    "required": ["city"]
  }
}
```

**关键要素：**
| 字段 | 作用 | 说明 |
|------|------|------|
| **name** | 函数名 | LLM 根据名字理解功能 |
| **description** | 函数描述 | 越详细，LLM 理解越准确 |
| **parameters** | 参数定义 | 用 JSON Schema 格式 |
| **required** | 必填参数 | 确保 LLM 提供必要信息 |

### 2.3 多函数调用

**定义多个函数：**
```json
[
  {
    "name": "weather_query",
    "description": "查询天气",
    "parameters": {...}
  },
  {
    "name": "send_email",
    "description": "发送邮件",
    "parameters": {...}
  },
  {
    "name": "search_web",
    "description": "搜索互联网",
    "parameters": {...}
  }
]
```

**LLM 自主选择：**
```
用户："北京天气怎么样？顺便给张三发个邮件告诉他"

LLM 可能返回：
[
  {"function": "weather_query", "arguments": {"city": "北京"}},
  {"function": "send_email", "arguments": {
    "to": "zhangsan@example.com",
    "subject": "北京天气",
    "body": "北京今天晴天..."
  }}
]
```

---

## 三、主流平台实现

### 3.1 OpenAI Function Calling

```python
from openai import OpenAI

client = OpenAI(api_key="your-api-key")

# 1. 定义函数
functions = [
    {
        "name": "get_current_weather",
        "description": "获取指定城市的当前天气",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "城市名称，如'北京'"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "温度单位"
                }
            },
            "required": ["location"]
        }
    }
]

# 2. 第一次调用（LLM 决定是否调用函数）
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "北京天气怎么样？"}
    ],
    functions=functions,
    function_call="auto"  # auto: 让 LLM 决定，none: 不调用，required: 必须调用
)

# 3. 检查是否需要调用函数
message = response.choices[0].message
if message.function_call:
    # 4. 执行函数
    function_name = message.function_call.name
    function_args = json.loads(message.function_call.arguments)
    
    if function_name == "get_current_weather":
        result = get_weather(
            location=function_args["location"],
            unit=function_args.get("unit", "celsius")
        )
    
    # 5. 将结果返回给 LLM
    second_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": "北京天气怎么样？"},
            {"role": "assistant", "content": None, "function_call": message.function_call},
            {"role": "function", "name": function_name, "content": result}
        ]
    )
    
    # 6. 获取最终回答
    print(second_response.choices[0].message.content)
else:
    # 不需要调用函数，直接回答
    print(message.content)
```

### 3.2 Anthropic Tool Use

```python
from anthropic import Anthropic

client = Anthropic(api_key="your-api-key")

# 定义工具
tools = [
    {
        "name": "get_weather",
        "description": "获取天气信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名称"
                }
            },
            "required": ["city"]
        }
    }
]

# 调用
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=tools,
    messages=[
        {"role": "user", "content": "北京天气怎么样？"}
    ]
)

# 处理工具调用
for content in response.content:
    if content.type == "tool_use":
        # 执行工具
        if content.name == "get_weather":
            result = get_weather(content.input["city"])
        
        # 返回结果
        final_response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            tools=tools,
            messages=[
                {"role": "user", "content": "北京天气怎么样？"},
                {"role": "assistant", "content": response.content},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": content.id,
                            "content": result
                        }
                    ]
                }
            ]
        )
```

### 3.3 LangChain Tools

```python
from langchain.agents import tool, initialize_agent, AgentType
from langchain.llms import OpenAI

# 方式 1：用装饰器定义工具
@tool
def search(query: str) -> str:
    """搜索互联网获取信息"""
    # 实现搜索逻辑
    return search_results

@tool
def calculator(expression: str) -> str:
    """计算数学表达式"""
    return str(eval(expression))

# 方式 2：直接定义工具
from langchain.tools import Tool

tools = [
    Tool(
        name="Weather",
        func=get_weather,
        description="查询城市天气"
    ),
    Tool(
        name="Calculator", 
        func=lambda x: str(eval(x)),
        description="计算数学表达式"
    )
]

# 初始化 Agent
llm = OpenAI(temperature=0)
agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

# 使用 Agent
response = agent.run("北京天气怎么样？5 乘以 8 等于多少？")
```

### 3.4 自定义实现

```python
import json
import requests

class FunctionCaller:
    """自定义 Function Calling 实现"""
    
    def __init__(self, llm_client, functions: list):
        self.llm = llm_client
        self.functions = {f["name"]: f for f in functions}
        self.function_handlers = {}
    
    def register_handler(self, name: str, handler: callable):
        """注册函数处理器"""
        self.function_handlers[name] = handler
    
    def call(self, user_message: str) -> str:
        """处理用户消息"""
        # 第一次调用：获取函数调用意图
        response = self.llm.chat(
            messages=[{"role": "user", "content": user_message}],
            functions=list(self.functions.values()),
            function_call="auto"
        )
        
        message = response.choices[0].message
        
        # 检查是否需要调用函数
        if message.function_call:
            func_name = message.function_call.name
            func_args = json.loads(message.function_call.arguments)
            
            # 执行函数
            if func_name in self.function_handlers:
                result = self.function_handlers[func_name](**func_args)
            else:
                result = f"Error: Unknown function {func_name}"
            
            # 第二次调用：生成最终回答
            final_response = self.llm.chat(
                messages=[
                    {"role": "user", "content": user_message},
                    {"role": "assistant", "content": None, "function_call": message.function_call},
                    {"role": "function", "name": func_name, "content": str(result)}
                ]
            )
            
            return final_response.choices[0].message.content
        else:
            # 不需要调用函数
            return message.content


# 使用示例
functions = [
    {
        "name": "get_weather",
        "description": "查询天气",
        "parameters": {...}
    }
]

caller = FunctionCaller(llm_client, functions)

# 注册处理器
caller.register_handler("get_weather", lambda city: {"temp": 25, "condition": "晴"})

# 调用
response = caller.call("北京天气怎么样？")
print(response)
```

---

## 四、安全机制

### 4.1 安全风险

| 风险 | 描述 | 例子 |
|------|------|------|
| **注入攻击** | 用户输入被当作代码执行 | SQL 注入、命令注入 |
| **权限滥用** | 调用未授权的函数 | 删除文件、访问敏感数据 |
| **参数篡改** | 恶意修改函数参数 | 转账金额被修改 |
| **无限循环** | 函数递归调用 | 死循环消耗资源 |
| **信息泄露** | 返回敏感信息 | 数据库密码、API Key |

### 4.2 安全防护

```python
class SafeFunctionCaller:
    """安全的函数调用器"""
    
    def __init__(self):
        self.allowed_functions = set()
        self.rate_limiter = RateLimiter(max_calls=100, per_minute=60)
        self.audit_logger = AuditLogger()
    
    def call(self, function_name: str, arguments: dict, user_context: dict) -> any:
        """安全调用函数"""
        
        # 1. 权限检查
        if not self._check_permission(function_name, user_context):
            raise PermissionError(f"无权调用函数：{function_name}")
        
        # 2. 速率限制
        if not self.rate_limiter.allow(user_context["user_id"]):
            raise RateLimitError("调用频率过高")
        
        # 3. 参数验证
        validated_args = self._validate_parameters(
            function_name, arguments
        )
        
        # 4. 执行函数（带超时）
        try:
            result = self._execute_with_timeout(
                function_name, validated_args, timeout=30
            )
        except TimeoutError:
            raise TimeoutError("函数执行超时")
        
        # 5. 结果过滤（移除敏感信息）
        safe_result = self._filter_sensitive_data(result)
        
        # 6. 审计日志
        self.audit_logger.log({
            "user_id": user_context["user_id"],
            "function": function_name,
            "arguments": self._sanitize_for_log(arguments),
            "result": self._sanitize_for_log(safe_result),
            "timestamp": datetime.now().isoformat()
        })
        
        return safe_result
    
    def _check_permission(self, func_name: str, context: dict) -> bool:
        """检查权限"""
        user_role = context.get("role", "guest")
        allowed = self._get_allowed_functions(user_role)
        return func_name in allowed
    
    def _validate_parameters(self, func_name: str, args: dict) -> dict:
        """验证参数"""
        schema = self.functions[func_name]["parameters"]
        
        # 类型检查
        for param_name, value in args.items():
            expected_type = schema["properties"][param_name]["type"]
            if not isinstance(value, eval(expected_type)):
                raise ValueError(f"参数 {param_name} 类型错误")
        
        # 范围检查
        # ... 实现具体检查逻辑
        
        return args
    
    def _execute_with_timeout(self, func_name: str, args: dict, timeout: int) -> any:
        """带超时执行"""
        import signal
        
        def timeout_handler(signum, frame):
            raise TimeoutError("函数执行超时")
        
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(timeout)
        
        try:
            result = self.function_handlers[func_name](**args)
            signal.alarm(0)  # 取消超时
            return result
        finally:
            signal.alarm(0)
    
    def _filter_sensitive_data(self, result: any) -> any:
        """过滤敏感数据"""
        # 移除密码、token 等敏感字段
        sensitive_keys = ["password", "token", "secret", "key"]
        
        if isinstance(result, dict):
            return {
                k: v for k, v in result.items()
                if k.lower() not in sensitive_keys
            }
        
        return result
```

### 4.3 最佳实践

| 实践 | 说明 | 实现方式 |
|------|------|---------|
| **最小权限** | 只开放必要的函数 | 白名单机制 |
| **参数验证** | 严格验证所有输入 | JSON Schema + 自定义验证 |
| **速率限制** | 防止滥用 | Token Bucket、滑动窗口 |
| **审计日志** | 记录所有调用 | 完整日志 + 敏感信息脱敏 |
| **超时控制** | 防止长时间占用 | 设置执行超时 |
| **错误处理** | 优雅处理异常 | 统一错误格式 |
| **结果过滤** | 移除敏感信息 | 后处理过滤 |

---

## 五、实战案例

### 5.1 案例 1：客服助手

```python
class CustomerServiceAgent:
    """客服助手 - 集成多个函数"""
    
    def __init__(self):
        self.functions = [
            {
                "name": "query_order",
                "description": "查询订单状态",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "order_id": {
                            "type": "string",
                            "description": "订单号"
                        }
                    },
                    "required": ["order_id"]
                }
            },
            {
                "name": "process_refund",
                "description": "处理退款申请",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "order_id": {"type": "string"},
                        "reason": {"type": "string"},
                        "amount": {"type": "number"}
                    },
                    "required": ["order_id", "reason"]
                }
            },
            {
                "name": "escalate_to_human",
                "description": "转接人工客服",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "reason": {"type": "string"}
                    },
                    "required": ["reason"]
                }
            }
        ]
        
        self.agent = self._create_agent()
    
    def _create_agent(self):
        # 创建 Agent 逻辑
        pass
    
    def handle_request(self, user_message: str, user_id: str) -> str:
        """处理用户请求"""
        # 实现逻辑
        pass
```

### 5.2 案例 2：数据分析助手

```python
class DataAnalysisAgent:
    """数据分析助手"""
    
    functions = [
        {
            "name": "load_csv",
            "description": "加载 CSV 文件",
            "parameters": {...}
        },
        {
            "name": "run_sql",
            "description": "执行 SQL 查询",
            "parameters": {...}
        },
        {
            "name": "generate_chart",
            "description": "生成图表",
            "parameters": {...}
        },
        {
            "name": "calculate_stats",
            "description": "计算统计指标",
            "parameters": {...}
        }
    ]
    
    def analyze(self, request: str) -> dict:
        """执行数据分析"""
        # 多步骤分析流程
        pass
```

---

## 🎯 面试回答版本

> 面试官问："你了解 Function Calling 吗？如何实现？"

### 标准回答（2-3 分钟）

```
Function Calling 是让 LLM 安全调用外部函数的机制。

【工作原理】
流程分 6 步：
1. 用户提问
2. LLM 分析意图，决定调用哪个函数
3. LLM 返回函数名和参数
4. 系统执行函数
5. 将结果返回给 LLM
6. LLM 基于结果生成最终回答

【函数定义】
用 JSON Schema 定义函数名、描述、参数。
描述越详细，LLM 理解越准确。
必填参数确保 LLM 提供必要信息。

【安全机制】
我实现的防护措施：
1. 白名单：只允许调用注册的函数
2. 参数验证：类型检查、范围检查
3. 速率限制：防止滥用
4. 审计日志：记录所有调用
5. 超时控制：防止长时间占用
6. 结果过滤：移除敏感信息

【实际应用】
我在客服助手项目中集成了订单查询、
退款处理、转人工等函数，
日均调用 1000+ 次，成功率 98%。
```

### 高频追问

| 追问 | 参考回答 |
|------|---------|
| "Function Calling 和 RAG 有什么区别？" | Function Calling 是调用函数执行操作，RAG 是检索外部知识。可以结合使用。 |
| "如何处理多轮函数调用？" | 循环执行：LLM 调用→执行→返回结果→LLM 决定下一步，直到完成任务。 |
| "LLM 调用错误函数怎么办？" | 1) 优化函数描述 2) 提供示例 3) 添加验证逻辑 4) 错误时重试或转人工。 |
| "如何调试 Function Calling？" | 开启 verbose 模式，记录完整日志，分析 LLM 的决策过程。 |

---

**相关阅读：**
- [AI Agent 技能详解](./ai-agent-skill-intro.md) - 了解技能设计
- [AI Agent 技术](./ai-agent-architecture.md) - 学习 Agent 架构
- [MCP 协议解析](./ai-mcp-protocol.md) - 了解标准化协议
