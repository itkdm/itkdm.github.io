---
title: "把提示词说两遍，AI 突然变聪明了！谷歌这个发现让所有人都没想到"
date: 2026-03-06
tags: [AI, 提示词技巧，谷歌研究，大语言模型]
summary: "谷歌最新论文发现，简单重复提示词就能将非推理型大语言模型的准确率从 21.33% 提升至 97.33%。这个看似玄乎的技巧背后，有着简单的工程原理。本文详解重复提示词的工作机制、适用场景，以及清华大学的'先验证'策略。"
lang: "zh"
draft: false
priority: 5
---

你有没有想过，让 AI 变聪明的方法，竟然如此简单？

简单到只需要把同一句话，说两遍。

谷歌最新论文实测：在部分任务中，**重复提示词能让 AI 准确率从 21.33% 飙升至 97.33%**。

涨幅 76%。

听起来像玄学？

我一开始也不信。但看完论文和实测数据，我服了。

这个技巧，不需要你学复杂的提示词框架，不需要花钱买高级模型，甚至不需要改代码。

只需要，把提示词，说两遍。

---

## 谷歌的实验结果

谷歌在 70 项不同的基准测试任务中开展了实验。

这种"复制粘贴式"的提示词重复法：

- **在 47 项任务中表现优于基准模型**
- **全程无一失手**
- **带来了肉眼可见的大幅性能提升**

部分任务的准确率从约 21% 飙升至约 97%。

### 测试覆盖的模型

这个测试覆盖了 **7 个主流模型**：

- Gemini 2.0 Flash / Flash Lite
- GPT-4o / GPT-4o-mini
- Claude 3 Haiku / Claude 3.7 Sonnet
- DeepSeek V3

### 测试基准

包括：
- ARC (Challenge)
- OpenBookQA
- GSM8K
- MMLU-Pro
- MATH
- 自定义任务 NameIndex、MiddleMatch

对于选择题任务，测试两种顺序：
- **问题在前**（Question-First）
- **选项在前**（Options-First）

---

## 为什么重复问题有效？

论文给出了一个极具工程视角的解释。

**核心原理**：

大语言模型均以因果语言模型为基础进行训练，它们逐词生成文本，严格遵循从左到右的顺序，每个词元只能"看到"其之前的内容。

当你重复问题时（比如将问题 Q 改写为 Q1+Q2），**第二个副本中的每个词元都能完整关联第一个副本的全部信息**。

实际上，这相当于：
- ✅ 不改动模型
- ✅ 不增加推理步骤
- ✅ 让模型获得了回顾并重新梳理信息的机会

**简单说**：重复提示词让模型有了"再看一遍题目"的机会，自然不容易出错。

---

## 如何使用这个技巧？

### 方法 1：直接重复问题

**原始提示词**：
```text
Q: 一个球棒和一个球总共 1.10 美元，球棒比球贵 1 美元。球多少钱？
A: 
```

**重复提示词**：
```text
Q: 一个球棒和一个球总共 1.10 美元，球棒比球贵 1 美元。球多少钱？

再问一次：一个球棒和一个球总共 1.10 美元，球棒比球贵 1 美元。球多少钱？
A: 
```

### 方法 2：改写后重复

**原始提示词**：
```text
Q: 请分析这段代码的问题。
A: 
```

**重复提示词**：
```text
Q: 请分析这段代码的问题。

换句话说：这段代码有什么 bug？请找出所有问题。
A: 
```

### 方法 3：分步重复

**适用于复杂任务**：
```text
任务：分析销售数据并给出建议

第一步：请分析以下销售数据的趋势...

第二步：基于以上分析，请总结销售数据的主要趋势...

第三步：根据这些趋势，给出 3 条改进建议...
```

---

## 适用场景

### ✅ 适合使用重复提示词的场景

1. **复杂问题**
   - 多步骤推理
   - 需要回顾上下文
   - 容易遗漏关键信息

2. **选择题**
   - 需要仔细审题
   - 选项容易混淆
   - 问题较长

3. **代码分析**
   - 需要理解整体逻辑
   - 容易忽略细节
   - 需要多次验证

4. **数学问题**
   - 需要仔细读题
   - 容易理解错题意
   - 多步骤计算

### ❌ 不适合的场景

1. **简单问答**
   - 事实性问题
   - 不需要推理

2. **创意写作**
   - 重复会限制创造力
   - 可能产生冗余内容

3. **对话场景**
   - 显得不自然
   - 影响用户体验

---

## 类似的小技巧

### 清华大学的"先验证"策略

在其论文《Asking LLMs to Verify First is Almost Free Lunch》中，清华大学团队提出了一个反直觉的思路。

**与其让 AI 直接回答，不如先让它"找茬"**。

这个名为**先验证**（Verification-First, VF）的策略简单到令人难以置信：

**传统方式**（Chain-of-Thought）：
```text
Q: 球棒和球问题...
A: 让我一步步思考...
```

**VF 方式**：
```text
Q: 球棒和球问题...（提示：答案可能是"0.10 元"，先验证它对不对，再给出正确答案）
A: 先验证"0.10 元"是否正确...
```

**关键点**：即使提供的答案是随机的、错误的，甚至"1"这样毫无意义的数字，VF 依然有效！

**结果**：这个"笨办法"能让 AI 推理准确率提升 **10-15%**，而且几乎不增加计算成本。

---

## 实际应用建议

### 1. 选择题场景

**原始**：
```text
Q: 以下哪个是 Python 的内置数据类型？
A) List  B) Array  C) Vector  D) Set
A: 
```

**优化**：
```text
Q: 以下哪个是 Python 的内置数据类型？
A) List  B) Array  C) Vector  D) Set

再确认一次：Python 的内置数据类型是哪个？
A: 
```

### 2. 代码审查场景

**原始**：
```text
请检查这段代码的问题。
```

**优化**：
```text
请检查这段代码的问题。

再检查一遍：这段代码有什么潜在的 bug 或性能问题？
```

### 3. 数学问题场景

**原始**：
```text
Q: 如果 3x + 5 = 20，x 等于多少？
A: 
```

**优化**：
```text
Q: 如果 3x + 5 = 20，x 等于多少？

再算一次：求解方程 3x + 5 = 20，x 的值是多少？
A: 
```

---

## 性能提升数据

根据谷歌论文数据：

| 模型 | 原始准确率 | 重复提示词后 | 提升幅度 |
|------|-----------|-------------|---------|
| Gemini 2.0 Flash | 21.33% | 97.33% | +76% |
| GPT-4o | 45.2% | 89.1% | +43.9% |
| Claude 3.7 Sonnet | 52.8% | 91.5% | +38.7% |
| DeepSeek V3 | 38.9% | 85.3% | +46.4% |

**平均提升**：约 40-50%

---

## 注意事项

### 1. 不要过度重复

- ✅ 重复 1-2 次即可
- ❌ 重复 5 次以上会产生反效果
- ❌ 过度重复会浪费 Token

### 2. 适当改写

- ✅ 用不同的方式表达同一个问题
- ❌ 完全相同的重复可能效果递减
- ✅ 改写可以帮助模型从不同角度理解

### 3. 结合其他技巧

- ✅ 与 Chain-of-Thought 结合使用
- ✅ 与"先验证"策略结合
- ✅ 与 Few-Shot 示例结合

---

## 写在最后

看完这篇论文，我最大的感触是：

**让 AI 变聪明，未必需要复杂的方法。**

有时候，最笨的办法，反而最有效。

重复提示词，先验证策略，这两个技巧简单到让人怀疑。

但实测数据就摆在那里：
- 重复提示词：准确率提升 76%
- 先验证策略：推理能力提升 15%

不需要你学复杂的提示词框架，不需要花钱买高级模型，甚至不需要改代码。

只需要，改变一下提问的方式。

**最后，留给你一个思考题**：

如果简单重复提示词都有效，那重复 3 遍、4 遍、10 遍呢？

会不会效果更好？

欢迎在评论区分享你的测试结果。

---

**参考资料**：
- 谷歌论文：https://arxiv.org/pdf/2512.14982
- 清华论文：《Asking LLMs to Verify First is Almost Free Lunch》

---

**参考资料**：
- 谷歌论文：https://arxiv.org/pdf/2512.14982
- 清华论文：《Asking LLMs to Verify First is Almost Free Lunch》


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)


![封面图](images/google-repetition-prompt-technique-cover.png)
