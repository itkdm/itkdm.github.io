# LangChain 文档翻译进度

## ✅ 已完成并上线

| 文档 | 说明 | 大小 | 上线时间 |
|------|------|------|----------|
| langchain-ai-overview.md | LangChain AI 生态总览 | 15KB | 2026-03-07 |
| langchain-framework-guide.md | LangChain 框架详解 | 16KB | 2026-03-07 |
| langgraph-workflow-guide.md | LangGraph 工作流详解 | 19KB | 2026-03-07 |
| langsmith-platform-guide.md | LangSmith 平台详解 | 22KB | 2026-03-07 |
| langchain-install.md | 安装指南 | 2.3KB | 2026-03-07 13:49 |
| langchain-quickstart.md | 快速开始 | 20KB | 2026-03-07 13:49 |
| langchain-agents.md | Agent 核心概念 | 43KB | 2026-03-07 13:55 |
| langchain-tools.md | Tool 完整指南 | 25KB | 2026-03-07 13:55 |

**总计**: 8 篇，约 162KB

---

## 🔄 翻译中

无

---

## ⏳ 待翻译（核心 - 优先级 P0）

| 序号 | 文档 | 说明 | 大小 | 优先级 |
|------|------|------|------|--------|
| 1 | models.mdx | 模型集成 | 77KB | P0 |
| 2 | messages.mdx | 消息系统 | 59KB | P0 |
| 3 | rag.mdx | RAG 技术 | 33KB | P0 |
| 4 | retrieval.mdx | 检索系统 | 17KB | P0 |

## ⏳ 待翻译（核心 - 优先级 P1）

| 序号 | 文档 | 说明 | 大小 |
|------|------|------|------|
| 5 | structured-output.mdx | 结构化输出 | 44KB |
| 6 | human-in-the-loop.mdx | 人工介入 | 20KB |
| 7 | evals.mdx | 评估系统 | 6.9KB |
| 8 | test.mdx | 测试指南 | 31KB |
| 9 | memory/short-term.mdx | 短期记忆 | 35KB |
| 10 | memory/long-term.mdx | 长期记忆 | 10KB |

## ⏳ 待翻译（核心 - 优先级 P2）

| 序号 | 文档 | 说明 | 大小 |
|------|------|------|------|
| 11 | deploy.mdx | 部署指南 | 1.2KB |
| 12 | streaming/overview.mdx | 流式输出 | 44KB |
| 13 | guardrails.mdx | 防护栏 | 22KB |
| 14 | knowledge-base.mdx | 知识库 | 26KB |
| 15 | context-engineering.mdx | 上下文工程 | 66KB |
| 16 | mcp.mdx | MCP 集成 | 42KB |
| 17 | sql-agent.mdx | SQL Agent | 29KB |
| 18 | voice-agent.mdx | 语音 Agent | 28KB |

## ⏳ 待翻译（其他）

| 分类 | 文档数 | 说明 |
|------|--------|------|
| 多 Agent | 10+ | 多 Agent 系统相关 |
| 中间件 | 3 | Middleware 系统 |
| 错误处理 | 7 | 错误类型文档 |
| 其他 | 5 | 架构、理念、帮助等 |

---

## 📊 统计

- **已完成**: 8 篇（162KB）
- **待翻译（核心）**: 18 篇（约 520KB）
- **待翻译（其他）**: 25+ 篇
- **总计**: 50+ 篇

---

## 🎯 下一阶段

继续翻译 P0 优先级文档：
1. models.mdx（模型集成）- 77KB
2. messages.mdx（消息系统）- 59KB
3. rag.mdx（RAG 技术）- 33KB
4. retrieval.mdx（检索系统）- 17KB

---

## 📝 翻译规范

### Frontmatter 格式
```markdown
---
title: "中文标题"
order: 序号
section: "LangChain AI"
topic: "LangChain"
lang: "zh"
slug: "langchain-xxx"
summary: "一句话介绍"
icon: "🔖"
featured: true
toc: true
updated: 2026-03-07
---
```

### 翻译原则
- 专业术语保留英文（Agent, Tool, RAG, State, Context 等）
- 代码示例保持原样
- 链接保持原样
- 适当添加中文注释
