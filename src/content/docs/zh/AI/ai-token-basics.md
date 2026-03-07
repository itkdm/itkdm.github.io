---
title: "Token 机制详解：大模型的文本处理单位"
order: 2
section: "AI"
topic: "AI 技术"
lang: "zh"
slug: "ai-token-basics"
summary: "深入讲解 Token 的概念、计数规则、计费方式，以及 Token 对成本和性能的影响。"
icon: "🔤"
featured: false
toc: true
updated: 2026-03-06
---

> Token 是大模型处理文本的最小单位，理解 Token 机制对于控制成本、优化性能至关重要。

## 一、什么是 Token？

### 1.1 定义

**Token = 模型处理文本的最小单位**

LLM 不直接处理原始文本，而是先将文本切分成 Token 序列，然后对 Token 进行计算。

### 1.2 通俗理解

用一个比喻：
- **原始文本** = 一句话
- **Token** = 这句话被切分成的"词块"

```
英文示例：
"Hello world" 
→ ["Hello", " world"]  (2 个 Token)

"Artificial Intelligence is transforming the world"
→ ["Art", "ificial", " Intelligence", " is", " transform", "ing", " the", " world"]  (8 个 Token)

中文示例：
"你好世界"
→ ["你", "好", "世", "界"]  (4 个 Token)
或
→ ["你好", "世界"]  (2 个 Token，取决于分词器)
```

### 1.3 Token 与字符的关系

| 语言 | Token 与字符的关系 | 示例 |
|------|------------------|------|
| **英文** | 1 Token ≈ 4 个字符 ≈ 3/4 个单词 | "Hello" = 1 Token |
| **中文** | 1 Token ≈ 1-2 个汉字 | "你好" = 1-2 Tokens |
| **代码** | 1 Token ≈ 几个字符到一行 | `function` = 1 Token |

---

## 二、Token 化（Tokenization）

### 2.1 为什么要 Token 化？

```
原始文本 → Token 化 → Token 序列 → 模型处理 → 输出 Token → 解 Token 化 → 文本
```

**原因：**
1. **词汇表有限**：模型不可能记住所有可能的词
2. **处理效率**：Token 化后可以用数字表示，便于计算
3. **未知词处理**：生词可以拆分成已知 Token

### 2.2 主流 Token 化算法

| 算法 | 特点 | 使用模型 |
|------|------|---------|
| **BPE** (Byte Pair Encoding) | 从字符开始，反复合并高频对 | GPT 系列 |
| **WordPiece** | 类似 BPE，但选择合并的标准不同 | BERT |
| **Unigram** | 从大词汇表开始，逐步剪枝 | T5 |
| **SentencePiece** | 支持多语言，无需预分词 | T5、LLaMA |

### 2.3 BPE 算法详解

**工作原理：**

```
步骤 1：从字符级别开始
词汇表：["a", "b", "c", ...]

步骤 2：统计高频字符对
"hello" 中出现 ("h", "e"), ("e", "l"), ("l", "l"), ("l", "o")
统计所有文本中的频率

步骤 3：合并最高频的对
如果 ("l", "l") 频率最高，合并成 "ll"
词汇表新增："ll"

步骤 4：重复步骤 2-3
直到词汇表达到目标大小（如 50,000）
```

**实际效果：**
```
训练后词汇表：
常见词："the", "hello", "world" → 各 1 个 Token
生僻词："antidisestablishmentarianism" 
→ ["anti", "dis", "establish", "ment", "arian", "ism"] (6 Tokens)
```

### 2.4 中文 Token 化特点

**挑战：**
- 中文没有天然的空格分隔
- 词边界模糊

**解决方案：**

| 方案 | 描述 | 例子 |
|------|------|------|
| **按字切分** | 每个汉字一个 Token | "你好世界" → 4 Tokens |
| **按词切分** | 用分词工具先分词 | "你好世界" → ["你好", "世界"] → 2 Tokens |
| **混合方案** | 常用词整体，生僻字拆分 | "人工智能" → 1 Token，"齉龘" → 2 Tokens |

---

## 三、Token 计数规则

### 3.1 估算方法

| 语言 | 估算公式 | 例子 |
|------|---------|------|
| **英文** | 1000 Tokens ≈ 750 单词 | 1 页 A4 ≈ 500 Tokens |
| **中文** | 1000 Tokens ≈ 600-800 汉字 | 1 页 A4 ≈ 600 Tokens |
| **代码** | 1000 Tokens ≈ 50-100 行 | 取决于语言和复杂度 |

### 3.2 实际计数示例

```
英文文本：
"OpenAI's GPT-4 is a large language model."
Token 化：["Open", "AI", "'s", " G", "PT", "-4", " is", " a", " large", " language", " model", "."]
计数：12 Tokens

中文文本：
"OpenAI 的 GPT-4 是一个大语言模型。"
Token 化：["Open", "AI", "的", " G", "PT", "-4", "是", "一个", "大", "语言", "模型", "。"]
计数：12 Tokens

代码示例（Python）：
def hello():
    print("Hello, World!")
Token 化：["def", " hello", "():", "\n", "    ", "print", "(", "\"", "Hello", ",", " World", "!", "\"", ")"]
计数：14 Tokens
```

### 3.3 在线 Token 计数器

| 工具 | 链接 | 支持模型 |
|------|------|---------|
| **OpenAI Tokenizer** | https://platform.openai.com/tokenizer | GPT 系列 |
| **TikTokenizer** | https://www.tiktokenizer.com | 多模型 |
| **HuggingFace** | https://huggingface.co/tokenizers | 开源模型 |

---

## 四、Token 与计费

### 4.1 计费模式

**API 调用按 Token 计费：**
```
总费用 = 输入 Token 数 × 输入单价 + 输出 Token 数 × 输出单价
```

### 4.2 主流模型价格对比（2026 年 3 月）

| 模型 | 输入价格 | 输出价格 | 备注 |
|------|---------|---------|------|
| **GPT-4o** | $5/1M | $15/1M | 性价比首选 |
| **GPT-4.5** | $20/1M | $60/1M | 最强性能 |
| **o1** | $15/1M | $60/1M | 推理模型 |
| **Claude 3.5 Sonnet** | $3/1M | $15/1M | 长文本 |
| **Claude 3.7 Sonnet** | $3/1M | $15/1M | 2025 新款 |
| **Claude 4 Opus** | $15/1M | $75/1M | 顶级性能 |
| **Gemini 2.0 Flash** | $0.1/1M | $0.4/1M | 最便宜 |
| **Gemini 2.0 Pro** | $2.5/1M | $10/1M | 大上下文 |
| **Qwen2.5-72B** | $0.4/1M | $1.2/1M | 中文优化 |
| **Qwen3.0-235B** | $1/1M | $3/1M | MoE 架构 |
| **DeepSeek-V3** | ¥0.13/1K | ¥0.52/1K | 约$0.02/1M，最便宜 |
| **DeepSeek-R1** | ¥0.13/1K | ¥0.52/1K | 推理模型 |

### 4.3 成本计算示例

**场景：构建客服机器人，每天处理 1000 个咨询**

```
假设：
- 平均每个咨询输入 200 Tokens
- 平均每个回复 300 Tokens
- 每天 1000 个咨询

每日 Token 消耗：
输入：200 × 1000 = 200,000 Tokens
输出：300 × 1000 = 300,000 Tokens
总计：500,000 Tokens

使用 GPT-4o 的月成本：
输入：200K × $5/1M × 30 天 = $30
输出：300K × $15/1M × 30 天 = $135
总计：$165/月

使用 DeepSeek 的月成本：
输入：200K × ¥0.13/1K × 30 天 = ¥780
输出：300K × ¥0.52/1K × 30 天 = ¥4,680
总计：¥5,460/月 ≈ $750/月
```

### 4.4 降低 Token 成本的技巧

| 技巧 | 效果 | 实施难度 |
|------|------|---------|
| **精简 Prompt** | 减少 20-30% | ⭐ |
| **设置 max_tokens** | 控制输出长度 | ⭐ |
| **用小模型处理简单任务** | 减少 50-80% | ⭐⭐ |
| **缓存常见问答** | 减少重复调用 | ⭐⭐ |
| **压缩历史对话** | 减少上下文 | ⭐⭐⭐ |

---

## 五、Token 对性能的影响

### 5.1 推理速度

```
Token 数量与推理时间的关系：

输入 Token 少 → 处理快
输出 Token 多 → 生成慢（自回归生成）

示例（GPT-4）：
输入 100 Tokens + 输出 100 Tokens → ~1 秒
输入 1000 Tokens + 输出 500 Tokens → ~5 秒
输入 10000 Tokens + 输出 1000 Tokens → ~30 秒
```

### 5.2 显存占用

| 模型 | 基础显存 | 每 1K Tokens 额外占用 |
|------|---------|-------------------|
| GPT-4 | 不公开 | 不公开 |
| LLaMA 2-7B | 14GB | ~2MB |
| LLaMA 2-70B | 140GB | ~20MB |

### 5.3 上下文窗口限制

| 模型 | 最大上下文 | 实际建议 |
|------|-----------|---------|
| GPT-4 Turbo | 128K | 100K 以内 |
| Claude 3.5 | 200K | 150K 以内 |
| Qwen2.5 | 128K | 100K 以内 |

**为什么建议留余量？**
- 长上下文推理速度下降
- 注意力机制计算复杂度 O(n²)
- 边缘信息容易丢失

---

## 六、Token 优化实战

### 6.1 Prompt 优化

```
❌ 冗余 Prompt（150 Tokens）：
"你好，我是一位开发者，我正在开发一个网站，
我想知道如何用 HTML 创建一个表格，
请你详细地告诉我步骤，越详细越好"

✅ 精简 Prompt（50 Tokens）：
"用 HTML 创建表格的步骤，详细版"

效果：
- Token 减少 67%
- 成本降低 67%
- 响应速度提升
- 输出质量相当
```

### 6.2 输出长度控制

```python
# 设置 max_tokens 限制输出
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "总结这篇文章"}],
    max_tokens=200  # 限制最多 200 Tokens
)
```

### 6.3 历史对话压缩

```
原始对话（10 轮，2000 Tokens）：
用户：问题 1
AI：回答 1
用户：问题 2
AI：回答 2
...

压缩后（500 Tokens）：
系统：之前讨论了问题 1-5，核心结论是...
用户：问题 6
AI：回答 6
```

### 6.4 流式输出

**优势：**
- 用户可提前看到部分结果
- 可提前终止不需要的输出
- 节省 Token 和成本

```python
# 流式输出示例
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "写一首诗"}],
    stream=True  # 启用流式
)

for chunk in response:
    print(chunk.choices[0].delta.content, end="")
    # 可以在任何时候中断
```

---

## 七、Token 相关工具

### 7.1 计数工具

| 工具 | 用途 | 链接 |
|------|------|------|
| **tiktoken** | Python Token 计数库 | `pip install tiktoken` |
| **tokenizers** | HuggingFace Tokenizer | `pip install tokenizers` |
| **OpenAI Tokenizer** | 在线可视化 | platform.openai.com/tokenizer |

### 7.2 使用示例

```python
# tiktoken 使用示例
import tiktoken

# 加载 GPT-4 的分词器
encoding = tiktoken.encoding_for_model("gpt-4")

# 计算 Token 数
text = "Hello, world!"
tokens = encoding.encode(text)
print(f"Token 数：{len(tokens)}")  # 输出：4

# 计算成本
def calculate_cost(input_tokens, output_tokens, model="gpt-4o"):
    prices = {
        "gpt-4o": {"input": 5e-6, "output": 15e-6},
        "gpt-4-turbo": {"input": 10e-6, "output": 30e-6},
    }
    price = prices[model]
    return input_tokens * price["input"] + output_tokens * price["output"]

cost = calculate_cost(1000, 500, "gpt-4o")
print(f"成本：${cost:.4f}")  # 输出：$0.0125
```

---

## 🎯 面试回答版本

> 面试官问："什么是 Token？如何控制 Token 成本？"

### 标准回答（2 分钟）

```
Token 是大模型处理文本的最小单位。

【基本概念】
英文约 4 个字符一个 Token，中文约 1-2 个汉字一个 Token。
1000 Tokens 约等于 750 个英文单词或 600-800 个汉字。

【计费方式】
API 按 Token 收费，输入和输出分开计价。
比如 GPT-4o 是输入$5/1M Tokens，输出$15/1M Tokens。

【成本优化】
我常用的优化方法：
1. 精简 Prompt，去掉冗余描述
2. 设置 max_tokens 限制输出长度
3. 简单任务用小模型
4. 缓存常见问答
5. 压缩历史对话

【实际应用】
我在项目中通过优化 Prompt，
将 Token 消耗减少了 40%，
每月节省成本约 XXX 元。
```

### 高频追问

| 追问 | 参考回答 |
|------|---------|
| "Token 怎么计数？" | 用 tiktoken 库或在线工具。英文约 750 词=1K Tokens，中文约 600-800 字=1K Tokens。 |
| "为什么输出比输入贵？" | 输出需要自回归生成，计算量更大。输入可以并行处理。 |
| "如何估算项目成本？" | 统计平均输入输出 Token 数 × 日调用量 × 单价 × 天数。 |
| "中文和英文 Token 计数有区别吗？" | 有。中文分词更复杂，同样字数 Token 数可能更多。 |

---

**相关阅读：**
- [LLM 大语言模型详解](./ai-llm-intro.md)
- [上下文窗口详解](./ai-context-window.md)
- [Prompt 工程](./ai-prompt-engineering.md)
