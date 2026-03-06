---
title: "AI Agent 技能（Skill）详解：从概念到实现"
order: 9
section: "AI"
topic: "AI 技术"
lang: "zh"
slug: "ai-agent-skill-intro"
summary: "深入讲解 AI Agent 技能的概念、设计模式、实现方案，以及如何为 Agent 添加自定义技能。"
icon: "🛠️"
featured: false
toc: true
updated: 2026-03-06
---

> 技能（Skill）是 AI Agent 的核心能力单元，决定了 Agent 能做什么。本文系统讲解技能的设计与实现。

## 一、什么是 AI Agent 技能？

### 1.1 定义

**Skill（技能）= Agent 能够执行的特定能力或任务**

用一个比喻理解：
- **LLM** = 大脑（思考、决策）
- **Skill** = 手脚（执行具体动作）
- **Agent** = 完整的人（大脑 + 手脚）

### 1.2 技能 vs 工具 vs 函数

| 概念 | 范围 | 例子 |
|------|------|------|
| **Function（函数）** | 最底层，代码级别 | `calculate_sum(a, b)` |
| **Tool（工具）** | 封装好的功能模块 | 计算器、搜索引擎 |
| **Skill（技能）** | 最高层，可能组合多个工具 | "数据分析"、"写报告" |

```
技能 = 工具的组合 + 业务逻辑 + 决策能力

例子："数据分析"技能
├─ 调用 Python 执行代码
├─ 调用图表库生成可视化
├─ 调用文件读写保存结果
└─ 用 LLM 生成分析报告
```

### 1.3 技能的核心特征

| 特征 | 描述 | 例子 |
|------|------|------|
| **目标导向** | 完成特定目标 | "订机票"、"写邮件" |
| **可复用** | 多次调用，参数不同 | 每次订不同的机票 |
| **可组合** | 多个技能组合成工作流 | 订票 + 订酒店 = 旅行规划 |
| **可解释** | Agent 知道什么时候用 | 根据用户意图选择技能 |

---

## 二、技能的分类

### 2.1 按能力类型分类

```
┌─────────────────────────────────────────────────────────────────┐
│                      技能分类体系                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 信息获取类                                                   │
│     • 搜索技能：搜索互联网、数据库查询                           │
│     • 读取技能：读取文件、API 调用                               │
│     • 监控技能：监控数据变化、告警通知                           │
│                                                                 │
│  2. 内容创作类                                                   │
│     • 写作技能：写文章、写邮件、写报告                           │
│     • 编程技能：写代码、代码审查、调试                           │
│     • 设计技能：生成图片、设计图表                               │
│                                                                 │
│  3. 任务执行类                                                   │
│     • 操作技能：文件操作、数据库操作                             │
│     • 交互技能：发送邮件、发送消息                               │
│     • 调度技能：定时任务、工作流编排                             │
│                                                                 │
│  4. 分析决策类                                                   │
│     • 分析技能：数据分析、趋势预测                               │
│     • 决策技能：方案评估、风险评估                               │
│     • 推理技能：逻辑推理、问题诊断                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 按复杂度分类

| 等级 | 描述 | 例子 | 实现难度 |
|------|------|------|---------|
| **L1 原子技能** | 单一功能，直接调用工具 | 天气查询、文件读取 | ⭐ |
| **L2 组合技能** | 组合 2-3 个工具 | 搜索 + 总结、查询 + 分析 | ⭐⭐ |
| **L3 工作流技能** | 多步骤，有分支逻辑 | 旅行规划、项目管理 | ⭐⭐⭐ |
| **L4 自主技能** | 能自主规划和调整 | 自主研究、自主学习 | ⭐⭐⭐⭐ |

### 2.3 常见技能示例

| 领域 | 技能名称 | 输入 | 输出 |
|------|---------|------|------|
| **办公** | 写邮件 | 主题、收件人、要点 | 格式化邮件 |
| **办公** | 会议纪要 | 会议录音/文字 | 纪要文档 |
| **开发** | 代码审查 | 代码文件 | 审查报告 |
| **开发** | Bug 诊断 | 错误日志、代码 | 问题定位 + 修复建议 |
| **数据** | 数据分析 | 数据文件 | 分析报告 + 图表 |
| **数据** | 数据清洗 | 原始数据 | 清洗后数据 |
| **生活** | 旅行规划 | 目的地、时间、预算 | 行程单 |
| **生活** | 健康管理 | 体检数据 | 健康建议 |

---

## 三、技能的设计模式

### 3.1 基础模式：单工具技能

```python
class WeatherSkill:
    """天气查询技能 - 单工具调用"""
    
    name = "weather_query"
    description = "查询指定城市的天气"
    
    def __init__(self, api_key):
        self.api_key = api_key
    
    def execute(self, city: str) -> dict:
        """执行技能"""
        # 1. 调用天气 API
        response = requests.get(
            f"https://api.weather.com/{city}",
            headers={"Authorization": self.api_key}
        )
        
        # 2. 格式化结果
        result = {
            "city": city,
            "temperature": response.json()["temp"],
            "condition": response.json()["condition"],
            "humidity": response.json()["humidity"]
        }
        
        return result
    
    def to_llm_format(self) -> dict:
        """转换为 LLM 可调用的格式"""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，如'北京'、'上海'"
                    }
                },
                "required": ["city"]
            }
        }
```

### 3.2 组合模式：多工具技能

```python
class ResearchSkill:
    """研究技能 - 组合多个工具"""
    
    name = "research"
    description = "研究一个主题，生成报告"
    
    def __init__(self, search_tool, scrape_tool, summarize_tool):
        self.search = search_tool      # 搜索工具
        self.scrape = scrape_tool      # 网页抓取工具
        self.summarize = summarize_tool  # 总结工具
    
    def execute(self, topic: str, depth: int = 3) -> str:
        """执行研究技能"""
        # 步骤 1: 搜索相关信息
        search_results = self.search.run(
            query=topic,
            num_results=depth
        )
        
        # 步骤 2: 抓取关键内容
        contents = []
        for result in search_results:
            content = self.scrape.run(url=result["url"])
            contents.append(content)
        
        # 步骤 3: 总结生成报告
        report = self.summarize.run(
            topic=topic,
            sources=contents
        )
        
        return report
    
    def to_llm_format(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "研究主题"
                    },
                    "depth": {
                        "type": "integer",
                        "description": "研究深度（搜索多少篇文献）",
                        "default": 3
                    }
                },
                "required": ["topic"]
            }
        }
```

### 3.3 工作流模式：有状态技能

```python
class TravelPlanningSkill:
    """旅行规划技能 - 多步骤工作流"""
    
    name = "travel_planning"
    description = "规划一次旅行，包括交通、住宿、行程"
    
    def __init__(self, flight_tool, hotel_tool, attraction_tool):
        self.flight = flight_tool
        self.hotel = hotel_tool
        self.attraction = attraction_tool
    
    def execute(self, params: dict) -> dict:
        """
        执行旅行规划
        
        params: {
            "origin": "北京",
            "destination": "东京",
            "dates": "2024-04-01 到 2024-04-07",
            "budget": 10000,
            "preferences": ["美食", "购物", "文化"]
        }
        """
        plan = {
            "destination": params["destination"],
            "dates": params["dates"],
            "flights": [],
            "hotels": [],
            "activities": [],
            "budget_breakdown": {}
        }
        
        # 步骤 1: 查询航班
        plan["flights"] = self._search_flights(params)
        
        # 步骤 2: 查询酒店
        plan["hotels"] = self._search_hotels(params)
        
        # 步骤 3: 规划活动
        plan["activities"] = self._plan_activities(params)
        
        # 步骤 4: 预算分配
        plan["budget_breakdown"] = self._allocate_budget(
            plan, params["budget"]
        )
        
        return plan
    
    def _search_flights(self, params: dict) -> list:
        """查询航班（私有方法）"""
        # 实现细节...
        pass
    
    def _search_hotels(self, params: dict) -> list:
        """查询酒店"""
        pass
    
    def _plan_activities(self, params: dict) -> list:
        """规划活动"""
        pass
    
    def _allocate_budget(self, plan: dict, total: float) -> dict:
        """分配预算"""
        pass
```

### 3.4 自主模式：带规划技能

```python
class AutonomousResearchSkill:
    """自主研究技能 - 能自己规划步骤"""
    
    name = "autonomous_research"
    description = "自主研究一个复杂问题"
    
    def __init__(self, llm, tools: dict):
        self.llm = llm
        self.tools = tools  # 可用工具集合
    
    def execute(self, question: str, max_steps: int = 10) -> str:
        """自主执行研究"""
        
        # 初始化
        context = []
        steps_taken = 0
        
        while steps_taken < max_steps:
            # 步骤 1: 思考下一步做什么
            thought = self._think(question, context)
            
            # 步骤 2: 决定是否继续
            if thought["action"] == "conclude":
                break
            
            # 步骤 3: 选择并执行工具
            tool_result = self._execute_tool(
                thought["tool"],
                thought["params"]
            )
            
            # 步骤 4: 更新上下文
            context.append({
                "step": steps_taken,
                "thought": thought,
                "result": tool_result
            })
            
            steps_taken += 1
        
        # 生成最终报告
        report = self._generate_report(question, context)
        return report
    
    def _think(self, question: str, context: list) -> dict:
        """用 LLM 思考下一步"""
        prompt = f"""
        问题：{question}
        已收集信息：{context}
        
        请决定下一步：
        1. 需要搜索什么信息？
        2. 还是已经有足够信息可以得出结论？
        
        返回 JSON: {{"action": "search/conclude", "tool": "...", "params": {{}}}}
        """
        response = self.llm.generate(prompt)
        return json.loads(response)
    
    def _execute_tool(self, tool_name: str, params: dict):
        """执行选定的工具"""
        tool = self.tools[tool_name]
        return tool.run(**params)
    
    def _generate_report(self, question: str, context: list) -> str:
        """生成最终报告"""
        pass
```

---

## 四、技能的实现框架

### 4.1 LangChain Skills

```python
from langchain.agents import tool

@tool
def calculate_bmi(weight: float, height: float) -> str:
    """计算 BMI 指数
    
    Args:
        weight: 体重（kg）
        height: 身高（m）
    
    Returns:
        BMI 值和健康建议
    """
    bmi = weight / (height ** 2)
    
    if bmi < 18.5:
        advice = "偏瘦，建议增加营养"
    elif bmi < 24:
        advice = "正常，继续保持"
    elif bmi < 28:
        advice = "偏胖，建议控制饮食"
    else:
        advice = "肥胖，建议就医咨询"
    
    return f"BMI: {bmi:.1f}, 建议：{advice}"

# 注册到 Agent
tools = [calculate_bmi]
```

### 4.2 AutoGen Skills

```python
from autogen import register_function

def search_web(query: str) -> str:
    """搜索互联网"""
    # 实现搜索逻辑
    pass

def analyze_data(file_path: str) -> dict:
    """分析数据文件"""
    # 实现分析逻辑
    pass

# 注册技能
register_function(
    search_web,
    caller=agent,
    executor=agent,
    name="web_search",
    description="搜索互联网获取信息"
)

register_function(
    analyze_data,
    caller=agent,
    executor=agent,
    name="data_analysis",
    description="分析 CSV/Excel 数据文件"
)
```

### 4.3 自定义 Skill 基类

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class Skill(ABC):
    """技能基类"""
    
    name: str
    description: str
    version: str = "1.0.0"
    
    @abstractmethod
    def execute(self, **kwargs) -> Any:
        """执行技能"""
        pass
    
    @abstractmethod
    def to_llm_format(self) -> Dict:
        """转换为 LLM 可调用的格式"""
        pass
    
    def validate(self, **kwargs) -> bool:
        """验证输入参数"""
        # 默认实现，可被子类重写
        return True
    
    def before_execute(self, **kwargs):
        """执行前钩子"""
        pass
    
    def after_execute(self, result: Any):
        """执行后钩子"""
        pass
    
    def run(self, **kwargs) -> Any:
        """完整执行流程（推荐调用此方法）"""
        # 1. 验证参数
        if not self.validate(**kwargs):
            raise ValueError("参数验证失败")
        
        # 2. 执行前钩子
        self.before_execute(**kwargs)
        
        # 3. 执行技能
        result = self.execute(**kwargs)
        
        # 4. 执行后钩子
        self.after_execute(result)
        
        # 5. 返回结果
        return result


# 使用示例
class EmailSkill(Skill):
    name = "send_email"
    description = "发送邮件"
    
    def execute(self, to: str, subject: str, body: str) -> dict:
        # 实现邮件发送逻辑
        return {"status": "success", "message_id": "xxx"}
    
    def to_llm_format(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string", "description": "收件人邮箱"},
                    "subject": {"type": "string", "description": "邮件主题"},
                    "body": {"type": "string", "description": "邮件正文"}
                },
                "required": ["to", "subject", "body"]
            }
        }
```

---

## 五、技能注册与发现

### 5.1 技能注册表

```python
class SkillRegistry:
    """技能注册表"""
    
    def __init__(self):
        self._skills: Dict[str, Skill] = {}
    
    def register(self, skill: Skill):
        """注册技能"""
        self._skills[skill.name] = skill
        print(f"✅ 已注册技能：{skill.name} v{skill.version}")
    
    def unregister(self, skill_name: str):
        """注销技能"""
        if skill_name in self._skills:
            del self._skills[skill_name]
            print(f"❌ 已注销技能：{skill_name}")
    
    def get(self, skill_name: str) -> Optional[Skill]:
        """获取技能"""
        return self._skills.get(skill_name)
    
    def list_skills(self) -> list:
        """列出所有技能"""
        return [
            {
                "name": skill.name,
                "description": skill.description,
                "version": skill.version
            }
            for skill in self._skills.values()
        ]
    
    def to_llm_format(self) -> list:
        """转换为 LLM 可用的技能列表"""
        return [skill.to_llm_format() for skill in self._skills.values()]


# 使用示例
registry = SkillRegistry()

# 注册技能
registry.register(WeatherSkill())
registry.register(EmailSkill())
registry.register(ResearchSkill())

# Agent 使用
agent_skills = registry.to_llm_format()
```

### 5.2 技能配置文件

```yaml
# skills.yaml
skills:
  - name: weather_query
    class: skills.weather.WeatherSkill
    enabled: true
    config:
      api_key: ${WEATHER_API_KEY}
      default_units: metric
  
  - name: email_send
    class: skills.email.EmailSkill
    enabled: true
    config:
      smtp_server: smtp.gmail.com
      smtp_port: 587
  
  - name: data_analysis
    class: skills.data.AnalysisSkill
    enabled: false  # 暂时禁用
    config:
      max_file_size: 10MB
```

### 5.3 动态加载技能

```python
import importlib
import yaml

class SkillLoader:
    """技能加载器"""
    
    @staticmethod
    def load_from_config(config_path: str) -> SkillRegistry:
        """从配置文件加载技能"""
        registry = SkillRegistry()
        
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        for skill_config in config.get('skills', []):
            if not skill_config.get('enabled', True):
                continue
            
            # 动态导入类
            module_path, class_name = skill_config['class'].rsplit('.', 1)
            module = importlib.import_module(module_path)
            skill_class = getattr(module, class_name)
            
            # 实例化技能
            skill = skill_class(**skill_config.get('config', {}))
            
            # 注册
            registry.register(skill)
        
        return registry
```

---

## 六、技能测试与评估

### 6.1 单元测试

```python
import unittest

class TestWeatherSkill(unittest.TestCase):
    
    def setUp(self):
        self.skill = WeatherSkill(api_key="test_key")
    
    def test_execute_valid_city(self):
        """测试有效城市"""
        result = self.skill.execute(city="北京")
        self.assertIn("temperature", result)
        self.assertIn("condition", result)
    
    def test_execute_invalid_city(self):
        """测试无效城市"""
        with self.assertRaises(Exception):
            self.skill.execute(city="无效城市")
    
    def test_llm_format(self):
        """测试 LLM 格式"""
        format = self.skill.to_llm_format()
        self.assertEqual(format["name"], "weather_query")
        self.assertIn("parameters", format)
```

### 6.2 集成测试

```python
class TestResearchSkillIntegration(unittest.TestCase):
    
    def test_full_workflow(self):
        """测试完整工作流"""
        skill = ResearchSkill(
            search_tool=MockSearch(),
            scrape_tool=MockScrape(),
            summarize_tool=MockSummarize()
        )
        
        report = skill.execute(topic="AI 发展趋势", depth=2)
        
        # 验证报告结构
        self.assertGreater(len(report), 0)
        self.assertIn("总结", report)
        self.assertIn("关键点", report)
```

### 6.3 评估指标

| 指标 | 描述 | 目标值 |
|------|------|--------|
| **成功率** | 技能执行成功的比例 | >95% |
| **准确率** | 结果符合预期的比例 | >90% |
| **响应时间** | 平均执行时间 | <5 秒 |
| **调用次数** | 被 Agent 调用的频率 | 持续监控 |
| **用户满意度** | 用户对结果的评分 | >4/5 |

---

## 🎯 面试回答版本

> 面试官问："你如何设计和实现 AI Agent 的技能？"

### 标准回答（2-3 分钟）

```
技能是 AI Agent 的核心能力单元，我主要从几个层面设计：

【分类设计】
按复杂度分 L1-L4 四个等级：
L1 原子技能（单一功能）、L2 组合技能（2-3 个工具）、
L3 工作流技能（多步骤）、L4 自主技能（能自己规划）。

【设计模式】
常用四种模式：
1. 单工具模式：直接封装一个 API 或函数
2. 组合模式：组合多个工具完成复杂任务
3. 工作流模式：有状态、多步骤的业务流程
4. 自主模式：用 LLM 自主规划执行步骤

【实现框架】
我常用 LangChain 的@tool 装饰器，
或者自定义 Skill 基类，包含 execute、validate、
to_llm_format 等标准方法。

【技能管理】
用注册表统一管理，支持动态加载、配置化、
版本控制。每个技能有完整的单元测试和集成测试。

【实际应用】
我在项目中实现了 XX 个技能，包括数据分析、
邮件发送、报告生成等，成功率达到 95% 以上。
```

### 高频追问

| 追问 | 参考回答 |
|------|---------|
| "技能和工具有什么区别？" | 工具是底层功能，技能是高层能力，一个技能可以组合多个工具。 |
| "如何保证技能执行安全？" | 参数验证、权限控制、执行超时、结果审计。 |
| "技能执行失败怎么办？" | 重试机制、降级方案、错误上报、人工介入。 |
| "如何评估技能效果？" | 成功率、准确率、响应时间、用户满意度等指标。 |

---

**相关阅读：**
- [AI Agent 技术](./ai-agent-architecture.md) - 了解 Agent 整体架构
- [Function Calling](./ai-function-calling.md) - 学习函数调用机制
- [Prompt 工程](./ai-prompt-engineering.md) - 提升技能调用效果
