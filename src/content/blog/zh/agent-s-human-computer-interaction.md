---
title: "Agent S 与人机交互的新范式"
date: 2025-10-13T09:09:41+08:00
tags: ["Agent", "Agent-S", "GUI 自动化", "多模态", "AI"]
summary: "这篇文章介绍了 Agent-S 作为 GUI Agent 的能力、典型使用场景、执行流程以及背后的多模态规划与 grounding 机制，重点展示其如何通过自然语言驱动图形界面自动完成复杂任务。"
lang: "zh"
slug: "agent-s-human-computer-interaction"
draft: false
---

# Agent S

告别重复操作！Agent-S像人一样通过自然语言与图形界面交互，自动完成复杂任务。

## Agent S 是什么？

Agent S 是一款实现**计算机自主交互**的**开源框架**，旨在通过**自然语言指令**和**图形用户界面**（GUI）**模拟人类操作**，实现对计算机的自主控制。

该框架结合多模态大语言模型（MLLM）与视觉输入，能够理解屏幕截图和界面结构，执行复杂任务，如浏览网页、编辑文档、跨应用程序操作等。

## 使用场景

- **数据处理**：操作电子表格、CSV文件或数据库
- **文件操作**：批量文件处理、内容提取或文件整理
- **系统自动化**：配置更改、系统设置或自动化脚本
- **代码开发**：编写、编辑或执行代码文件
- **文本处理**：文档操作、内容编辑或格式调整
- **图像与多媒体处理**：批量处理图像文件
- **浏览器自动化操作**：搜索信息，自动处理等

## 演示

我进行了实际代码部署，但是成本较高，较复杂，比如需要部署一个UI-TARS模型，而且还需要GPU，当然在云平台上面部署是一个不错的选择。

不过，官方给我们提供了共享的虚拟机去查看效果

https://cloud.simular.ai/chat-room

![]( "null")![]()

左边是对话框，右边是虚拟机展示效果。

图中展示的就是它在执行我下面的指令：

> 在桌面上创建一个名为“project\_status”的文件夹，然后用浏览器打开今日的科技新闻网页，找到前三条新闻标题。接着创建一个Excel文件，将这三条标题分别写入第一列的前三行。最后，把当前日期添加到第二列对应行中，并保存文件。

接下来我展示一下它的执行流程:

1.发送命令

![]( "null")![]()

2.截屏

![]( "null")![]()

3.分析（plan）

![]( "null")![]()

4.调用Agent执行对应的操作

比如上面分析中有：

agent.click("An empty area of the desktop background roughly mid-right of the screen to open the context menu", 1, "right")  
5.截图

一个操作执行完成以后，然后截图，再次发送给大模型

如下（右键以后的截图）

![]( "null")![]()

6.反思

![]( "null")![]()

执行完对应操作后截图发送给大模型以后会有一个反思  
7.分析(plan)

图中的分析计划就展示的比较清楚

- 对之前已经做的验证
- 对现在截图的分析
- 下一步应该做什么
- 具体怎么做（具体操作）  
  ![]( "null")![]()

接下来就重复进行这样的操作，验证出现错误就会继续重复做，但是很聪明，比如打开一个网站出错，会重新打开另一个新的网址。

上面整个流程，它其实操作的挺准确的，也比较聪明，毕竟操作指令和截图分析都由大模型生成。但是很明显的弊端，太慢了！

就上面这个操作，如果我们手动操作的话，可能也就是两三分钟，但是Agent S执行就需要将近半个小时！

## 原理

以“在桌面创建 `project_status` 文件夹 → 打开科技新闻网页 → 抓取前三条标题 → 在 Excel 中填写标题与日期”为例，梳理 Agent S（S3 版本）如何串联多模态感知、规划、执行与校验，并标注关键技术组件（UI-TARS、Tesseract-OCR 等）的作用位置。

---

### 1. 总体框架

Agent S 的核心循环由 CLI 程序驱动：

1. 1. **截屏采集**：调用 `pyautogui.screenshot()`（`gui_agents/s3/cli_app.py`） 捕获桌面，并将 `PNG` 字节存入 `obs["screenshot"]`。
2. 2. **Worker 规划**：`Worker` 模块（`gui_agents/s3/agents/worker.py`）基于“流程记忆”（`gui_agents/s3/memory/procedural_memory.py`）向主 LLM 请求 Plan，产出四段内容：上一步验证、截图分析、下一步描述、Grounded Action。
3. 3. **动作 Grounding**：通过 `OSWorldACI`（`gui_agents/s3/agents/grounding.py`）把文本动作转换成可执行的 `pyautogui` 脚本或 CodeAgent 调用。
4. 4. **动作执行与日志**：执行脚本 → 再次截屏 → Reflection Agent 评估 → 返回第 2 步，直至任务完成或显式 `agent.done()`。

---

### 2. 示例任务细化

示例任务细化：

| 阶段 | 具体行为 | 负责组件 |
| --- | --- | --- |
| 任务描述 | 用户输入任务指令 | CLI → `RainClassroomAgent.start_exam()` |
| 截屏 | `pyautogui.screenshot()` → `obs["screenshot"]` | CLI 主循环 |
| Plan #1 | 分析桌面状态，决定右键新建文件夹 | Worker → 主 LLM |
| Grounded Action #1 | `agent.click("桌面空白处", 1, "right")` → 坐标由 UI-TARS 推理 → `pyautogui` 执行 | Worker + OSWorldACI + UI-TARS |
| 截后 Plan #2 | 看到“新建”菜单，生成 `agent.click("新建文件夹")`，随后 `agent.type("project_status")` | Worker |
| Plan #3 | 打开浏览器：`agent.hotkey(["win"])`、`agent.type("edge")`、`agent.hotkey(["enter"])` | Worker |
| Plan #4 | 在地址栏输入科技新闻网址、刷新页面；若失败，Reflection 建议备用链接 | Worker + Reflection |
| Plan #5 | 浏览器加载完成，提取前三条标题：滚屏 + 视觉选择 + Tesseract-OCR 获取文字 | Worker + UI-TARS + Tesseract |
| Plan #6 | `agent.call_code_agent("将标题写入 Excel ...")` → CodeAgent 生成 Python，使用 `openpyxl` 写 A1  A3/B1  B3 并保存 | Worker + CodeAgent |
| Plan #7 | 截屏验证文件存在、日期正确 → `agent.done()` | Worker |

---

### 3. 关键模块说明

#### 3.1 Worker & Reflection

- Worker 通过 `call_llm_formatted` 强制 LLM 输出标准格式（`SINGLE_ACTION_FORMATTER` 等在 `gui_agents/s3/utils/formatters.py`），保证 Grounded Action 可解析。
- Reflection Agent 在每轮动作后评估截图：若上一步失败，会建议重试或调整策略（例如换新闻网站）。

#### 3.2 UI-TARS（视觉 grounding）

- 位置：`OSWorldACI.generate_coords()`、`OSWorldACI.generate_text_coords()`。
- 作用：把文本描述（例如“桌面空白处”）和当前截图一并发给 UI-TARS 模型，生成坐标或框选区域。
- 接口：默认使用 OpenAI 兼容协议（可部署在本地/云端），数据通过 base64 data URL 传输。
- 典型场景：

+ • 定位右键菜单选项；
+ • 在浏览器页面内寻找新闻标题；
+ • 在 Excel 表格里锁定第一列/第二列单元格。

#### 3.3 Tesseract-OCR

- 位置：`OSWorldACI.get_ocr_elements()`、识别截图文字，返回 `text_data` 供后续 LLM 判断。
- 用途：

+ • 在网页中捕捉新闻标题文本；
+ • 辅助判断文件是否创建成功（桌面图标文本）；
+ • 验证 Excel 填写结果时提取窗口标题 / 单元格内容。

- 在 `RainClassroomAgent` 初始化阶段，可配置 `pytesseract.pytesseract.tesseract_cmd` 指向本地安装路径。

#### 3.4 CodeAgent（可选）

- 触发条件：Plan 中出现 `agent.call_code_agent(...)`。
- 实现：`gui_agents/s3/agents/code_agent.py`，同样使用 LLM 生成多步 Python/Bash；内部执行器 `LocalEnv` 可跑 `openpyxl`、`pandas` 等库。
- 输出：包含执行日志、总结，Worker 会在下一轮 Plan 中引用这些结果进行验证。

---

### 4. 调用链与信息流总结

调用链

![]( "null")![]()

---

### 5. 为什么速度慢？

为什么速度慢？

| 环节 | 典型耗时 |
| --- | --- |
| 截屏 + 预处理 | 0.2~0.5 秒 |
| Worker 规划（LLM 推理） | 1~4 秒 |
| UI-TARS 坐标推理 | 0.5~2 秒 |
| 操作执行 + 系统反馈 | 0.3~1 秒 |
| 反思 + 再规划 | 额外 1~3 秒 |

整个任务通常需要几十轮循环，总耗时达十几甚至二十多分钟。优势是可解释、易扩展；劣势是效率远低于人工。

---

## 结语

### 迈向“懂界面”的智能体时代

Agent S 的意义，不仅在于“让电脑替你点鼠标”，而在于它重新定义了**人机交互的边界**。

它让大模型第一次具备了“看得懂屏幕、动得了手”的能力——这是通向真正自主智能体的关键一跃。

虽然现在的执行还显笨拙、速度也不算快，但别忘了：十年前的语音助手也曾如此。

今天的 Agent S，正处在那个“还不完美、却极具潜力”的拐点。

未来，它可以成为研发、办公、数据分析乃至系统维护的**通用操作层**——  
让自然语言真正成为人与计算机之间的唯一接口。

**从脚本自动化到视觉智能体，Agent S 正在让软件“看见自己”，也让我们看见未来。**

 

# —— END ——

如果这篇内容对你有帮助，请点个「**赞**」和「**在看**」吧！     

       你的支持是我持续分享的最大动力～     

       关注我，持续获取更多实用干货！
