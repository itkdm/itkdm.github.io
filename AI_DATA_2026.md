# AI 技术数据更新记录（2026 年 3 月）

## 大语言模型最新数据

### 闭源模型
| 模型 | 公司 | 上下文 | 输入价格 | 输出价格 | 知识截止 |
|------|------|--------|---------|---------|---------|
| GPT-4o | OpenAI | 128K | $5/1M | $15/1M | 2024-04 |
| GPT-4.5 | OpenAI | 128K | $20/1M | $60/1M | 2025-09 |
| o1 | OpenAI | 128K | $15/1M | $60/1M | 2024-04 |
| Claude 3.5 Sonnet | Anthropic | 200K | $3/1M | $15/1M | 2024-04 |
| Claude 3.7 Sonnet | Anthropic | 200K | $3/1M | $15/1M | 2025-01 |
| Claude 4 Opus | Anthropic | 256K | $15/1M | $75/1M | 2025-09 |
| Gemini 2.0 Flash | Google | 1M | $0.1/1M | $0.4/1M | 2024-12 |
| Gemini 2.0 Pro | Google | 2M | $2.5/1M | $10/1M | 2024-12 |
| Gemini 2.5 Pro | Google | 10M | $5/1M | $15/1M | 2025-09 |

### 开源/国产模型
| 模型 | 公司 | 上下文 | 价格 | 备注 |
|------|------|--------|------|------|
| Qwen2.5-72B | 阿里 | 128K | $0.4/1M | 2024-09 |
| Qwen3.0-235B | 阿里 | 256K | $1/1M | 2025-02，MoE |
| DeepSeek-V3 | 深度求索 | 128K | ¥0.13/1K | 2024-12，671B MoE |
| DeepSeek-R1 | 深度求索 | 128K | ¥0.13/1K | 2025-01，推理模型 |
| Kimi | 月之暗面 | 2M | ¥0.5/1K | 2024-12 |
| GLM-4 | 智谱 AI | 128K | ¥0.1/1K | 2024-12 |
| LLaMA 3.1-405B | Meta | 128K | 开源 | 2024-07 |
| LLaMA 3.3-70B | Meta | 128K | 开源 | 2024-12 |
| Mistral Large 2 | Mistral | 128K | $2/1M | 2024-07 |

## Embedding 模型
| 模型 | 维度 | 最大长度 | 备注 |
|------|------|---------|------|
| text-embedding-3-large | 3072 | 8191 | OpenAI，2024 |
| text-embedding-3-small | 1536 | 8191 | OpenAI，2024 |
| bge-large-zh-v1.5 | 1024 | 512 | 中文优化 |
| bge-m3 | 1024 | 8192 | 多语言，2024 |
| m3e-base | 768 | 512 | 中文 |
| multilingual-e5-large | 1024 | 512 | 微软 |

## 向量数据库
| 数据库 | 最新版本 | 特点 |
|--------|---------|------|
| Milvus | 2.4.x | 分布式，支持 GPU |
| Qdrant | 1.12.x | 过滤能力强 |
| Chroma | 0.5.x | 轻量嵌入式 |
| Pinecone | - | 托管服务，新推 Serverless |
| Weaviate | 1.25.x | 支持 GraphQL |
| FAISS | 1.9.x | Facebook 库 |

## Agent 框架
| 框架 | 最新版本 | 备注 |
|------|---------|------|
| LangChain | 0.3.x | 2024-10 重大更新 |
| LlamaIndex | 0.12.x | 专注 RAG |
| Dify | 1.0.x | 低代码平台 |
| Flowise | 2.0.x | 可视化编排 |
| AutoGen | 0.4.x | 多 Agent |
| CrewAI | 0.80.x | 角色化 Agent |

## MCP 协议
- **最新版本**: 2024-11 发布 1.0 正式版
- **官方 Server**: filesystem, postgres, github, slack, git, puppeteer, memory
- **SDK**: Python, TypeScript

## 工作流编排最佳实践（2026）
1. 优先使用可视化平台（Dify、Flowise）快速原型
2. 生产环境用代码框架（LangChain、LlamaIndex）定制
3. 关键节点加人工审核
4. 每个步骤加超时和重试
5. 完整日志记录便于调试
