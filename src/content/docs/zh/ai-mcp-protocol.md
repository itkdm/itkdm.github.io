---
title: "MCP 协议解析：模型上下文协议"
order: 3
section: "AI"
topic: "AI 技术"
lang: "zh"
slug: "ai-mcp-protocol"
summary: "深入讲解 MCP（Model Context Protocol）协议原理、架构设计和应用场景，附带面试考点解析。"
icon: "🔌"
featured: true
toc: true
updated: 2026-03-06
---

> MCP（Model Context Protocol，模型上下文协议）是 2024 年底推出的新标准，旨在统一 AI 应用与数据源的连接方式。虽然较新，但已成为技术面试的新兴考点。

## 一、通俗易懂版：MCP 是什么？

### 1.1 用一个比喻理解 MCP

想象你要给家里添置各种智能设备：

- **没有 MCP 的情况** = 每个设备配一个独立 App
  - 空调用格力 App，灯用小米 App，窗帘用涂鸦 App
  - 每个 App 登录方式不同、界面不同、操作逻辑不同
  - 想联动？得自己写脚本打通各个 App

- **有 MCP 的情况** = 统一用 HomeKit/米家
  - 所有设备遵循同一套协议
  - 一个 App 控制所有设备
  - 联动配置简单，说"回家模式"就自动开灯开空调

### 1.2 MCP 解决的核心问题

在 AI 应用开发中，开发者面临类似的困境：

| 问题 | 描述 | MCP 如何解决 |
|------|------|-------------|
| **连接碎片化** | 每个数据源（数据库、API、文件）连接方式不同 | 统一协议，一套接口 |
| **重复造轮子** | 每个 AI 应用都要重新实现连接器 | 复用现有 MCP Server |
| **安全风险** | 直接暴露数据库/API 凭证给 AI 应用 | MCP 作为安全中间层 |
| **生态割裂** | 不同 AI 平台的插件不互通 | 跨平台兼容 |

### 1.3 MCP 的核心角色

```
┌─────────────────────────────────────────────────────────────────┐
│                      MCP 架构三方关系                            │
│                                                                 │
│   ┌─────────────┐         ┌─────────────┐         ┌───────────┐ │
│   │   MCP Host  │ ◀─────▶ │   MCP Client│ ◀─────▶ │ MCP Server│ │
│   │  (AI 应用)   │         │  (连接器)   │         │ (数据源)  │ │
│   └─────────────┘         └─────────────┘         └───────────┘ │
│         │                       │                       │       │
│         │                       │                       │       │
│    例如：                    例如：                  例如：      │
│    • Claude Desktop          • 官方客户端            • 文件系统   │
│    • IDE 插件                • 第三方客户端          • 数据库     │
│    • 自定义 AI 应用           • 嵌入应用的 SDK        • API 服务   │
│                              • 浏览器扩展            • 云服务     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**三个角色详解：**

| 角色 | 职责 | 典型例子 |
|------|------|---------|
| **MCP Host** | 运行 AI 模型的应用，发起请求 | Claude Desktop、IDE 插件、自定义 AI 应用 |
| **MCP Client** | 协议客户端，连接 Host 和 Server | 官方客户端、SDK、嵌入式库 |
| **MCP Server** | 暴露数据/工具给 AI 使用 | 文件系统、PostgreSQL、Slack、GitHub |

### 1.4 MCP 能做什么？

MCP 定义了三种核心能力：

```
┌────────────────────────────────────────────────────────────┐
│                   MCP 三大能力                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. Resources（资源）                                       │
│     • 读取文件、数据库、API 数据                              │
│     • 类似"只读"的数据访问                                   │
│     • 例子：读取项目文档、查询数据库记录                      │
│                                                            │
│  2. Prompts（提示词模板）                                   │
│     • 预定义的 Prompt 模板                                   │
│     • 快速调用标准化任务                                     │
│     • 例子："代码审查"、"写单元测试"、"生成文档"              │
│                                                            │
│  3. Tools（工具）                                           │
│     • 可执行的操作，有副作用                                  │
│     • 类似"读写"的操作权限                                   │
│     • 例子：执行 SQL、发送消息、创建文件                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 二、技术架构详解

### 2.1 MCP 协议通信模型

```
┌──────────────────────────────────────────────────────────────────┐
│                     MCP 通信流程                                 │
│                                                                  │
│   MCP Host                    MCP Client              MCP Server │
│      │                            │                        │     │
│      │  1. 初始化连接             │                        │     │
│      │ ──────────────────────────▶│                        │     │
│      │                            │  2. 转发初始化          │     │
│      │                            │ ──────────────────────▶│     │
│      │                            │                        │     │
│      │                            │  3. 返回能力列表        │     │
│      │                            │ ◀──────────────────────│     │
│      │  4. 返回能力列表            │                        │     │
│      │ ◀─────────────────────────▶│                        │     │
│      │                            │                        │     │
│      │  5. 请求资源/工具           │                        │     │
│      │ ──────────────────────────▶│                        │     │
│      │                            │  6. 转发请求            │     │
│      │                            │ ──────────────────────▶│     │
│      │                            │                        │     │
│      │                            │  7. 执行并返回结果      │     │
│      │                            │ ◀──────────────────────│     │
│      │  8. 返回结果                │                        │     │
│      │ ◀─────────────────────────▶│                        │     │
│      │                            │                        │     │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 MCP 消息格式（JSON-RPC 2.0）

MCP 基于 JSON-RPC 2.0 协议，所有消息都是 JSON 格式：

```json
// 请求示例：列出可用资源
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {}
}

// 响应示例
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resources": [
      {
        "uri": "file:///project/README.md",
        "name": "README.md",
        "mimeType": "text/markdown"
      }
    ]
  }
}

// 错误示例
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found"
  }
}
```

### 2.3 核心 API 方法

| 类别 | 方法 | 描述 |
|------|------|------|
| **基础** | `initialize` | 初始化连接，协商协议版本 |
| **基础** | `ping` | 心跳检测 |
| **Resources** | `resources/list` | 列出可用资源 |
| **Resources** | `resources/read` | 读取资源内容 |
| **Prompts** | `prompts/list` | 列出提示词模板 |
| **Prompts** | `prompts/get` | 获取模板内容 |
| **Tools** | `tools/list` | 列出可用工具 |
| **Tools** | `tools/call` | 调用工具执行 |

---

## 三、实战：搭建 MCP Server

### 3.1 最简单的文件系统 Server

```python
# 使用 Python MCP SDK
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, TextContent

server = Server("file-system")

@server.list_resources()
async def handle_list_resources():
    return [
        Resource(
            uri="file:///README.md",
            name="README.md",
            mimeType="text/markdown"
        )
    ]

@server.read_resource()
async def handle_read_resource(uri):
    if uri == "file:///README.md":
        return [TextContent(text="# Hello World")]
    raise ValueError(f"Unknown resource: {uri}")

async with stdio_server() as streams:
    await server.run(
        streams[0],
        streams[1],
        server.create_initialization_options()
    )
```

### 3.2 数据库 MCP Server

```python
# PostgreSQL MCP Server 示例
from mcp.server import Server
import psycopg2

server = Server("postgres")

@server.list_tools()
async def list_tools():
    return [
        {
            "name": "query",
            "description": "执行 SQL 查询",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string"}
                }
            }
        }
    ]

@server.call_tool()
async def call_tool(name, args):
    if name == "query":
        conn = psycopg2.connect("dbname=test user=postgres")
        cur = conn.cursor()
        cur.execute(args["sql"])
        results = cur.fetchall()
        return {"results": results}
    raise ValueError(f"Unknown tool: {name}")
```

### 3.3 在 Claude Desktop 中使用 MCP

配置 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your_token"
      }
    }
  }
}
```

配置后，Claude 就可以：
- 读取项目文件
- 查询数据库
- 操作 GitHub 仓库

---

## 四、MCP 生态与现状

### 4.1 官方维护的 MCP Server

| Server | 功能 | 状态 |
|--------|------|------|
| `filesystem` | 文件系统访问 | ✅ 稳定 |
| `postgres` | PostgreSQL 数据库 | ✅ 稳定 |
| `github` | GitHub API | ✅ 稳定 |
| `slack` | Slack 消息 | ✅ 稳定 |
| `git` | Git 操作 | ✅ 稳定 |
| `puppeteer` | 浏览器自动化 | 🧪 实验 |
| `memory` | 向量记忆存储 | 🧪 实验 |

### 4.2 社区生态

- **官方仓库**：https://github.com/modelcontextprotocol
- **Server 列表**：https://github.com/modelcontextprotocol/servers
- **SDK 支持**：Python、TypeScript、Java（社区）

### 4.3 MCP vs 其他方案

| 方案 | 优势 | 劣势 | 适用场景 |
|------|------|------|---------|
| **MCP** | 标准化、跨平台、安全隔离 | 较新、生态待完善 | 通用 AI 应用连接 |
| **LangChain Tools** | 生态成熟、组件丰富 | 绑定 LangChain、较重 | LangChain 项目 |
| **自定义 API** | 完全可控、灵活 | 重复造轮子、不安全 | 特殊需求 |
| **插件系统** | 用户体验好 | 平台锁定、开发成本高 | 平台级应用 |

---

## 五、MCP 的安全考量

### 5.1 安全设计原则

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP 安全机制                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 最小权限原则                                             │
│     • Server 只暴露必要的资源/工具                            │
│     • 不直接暴露数据库凭证给 AI 应用                           │
│                                                             │
│  2. 用户确认机制                                             │
│     • 敏感操作（写/删除）需要用户确认                         │
│     • Host 可以拦截和审计所有请求                            │
│                                                             │
│  3. 隔离运行                                                 │
│     • Server 独立进程运行，崩溃不影响 Host                    │
│     • 可以限制 Server 的网络/文件系统访问                     │
│                                                             │
│  4. 审计日志                                                 │
│     • 所有工具调用可记录日志                                  │
│     • 便于追溯和调试                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 最佳实践

| 实践 | 说明 |
|------|------|
| **只读优先** | 默认只提供读取能力，写操作需额外配置 |
| **路径限制** | 文件 Server 限制在特定目录内 |
| **Token 管理** | API Token 由 Server 管理，不暴露给 Host |
| **速率限制** | 防止 AI 滥用工具（如循环调用） |
| **输入验证** | Server 端验证所有输入参数 |

---

## 🎯 面试回答版本

> 面试官问："你了解 MCP 协议吗？" 或 "AI 应用如何连接外部数据源？"

### 标准回答框架（2 分钟）

```
MCP 是 Model Context Protocol 的缩写，是 2024 年底推出的
AI 应用连接协议标准，主要解决 AI 应用与数据源连接的碎片化问题。

【核心思想】
MCP 定义了三个角色：
- Host：AI 应用本身，如 Claude Desktop、IDE 插件
- Client：协议客户端，负责通信
- Server：暴露数据/工具给 AI 使用，如文件系统、数据库

【三大能力】
1. Resources：读取数据，类似只读访问
2. Prompts：预定义的提示词模板
3. Tools：可执行的操作，有副作用

【技术实现】
基于 JSON-RPC 2.0 协议，通信格式标准化。
我了解的技术栈包括 Python/TypeScript SDK，
也看过官方的 filesystem、postgres 等 Server 实现。

【价值】
- 对开发者：复用现有 Server，不用重复造轮子
- 对用户：统一配置，一个地方管理所有连接
- 对生态：跨平台兼容，促进工具共享

【实际应用】
我在 [项目名] 中考虑过用 MCP 连接 [数据源]，
主要看中它的标准化和安全隔离特性。
```

### 高频追问及应对

| 追问 | 参考回答 |
|------|---------|
| "MCP 和 LangChain Tools 有什么区别？" | MCP 是协议标准，跨平台；LangChain Tools 是框架内的组件，绑定 LangChain。MCP 更轻量，LangChain 功能更丰富。 |
| "MCP 的安全性如何保证？" | 三个机制：1) 最小权限原则 2) 用户确认敏感操作 3) Server 独立进程隔离。还可以加审计日志和速率限制。 |
| "如何自定义 MCP Server？" | 用官方 SDK（Python/TS），实现 list_resources/read_resource 或 list_tools/call_tool 接口，然后配置到 Host 中。 |
| "MCP 现在成熟吗？" | 协议本身稳定，官方 Server 有 filesystem、postgres、github 等。生态还在早期，但发展很快。 |
| "什么场景适合用 MCP？" | 需要连接多个数据源的 AI 应用、需要安全隔离的场景、希望跨平台兼容的项目。 |

### 加分项

- 能说出具体 Server 名字（如 filesystem、postgres）
- 提到安全设计原则（最小权限、隔离运行）
- 能对比其他方案（LangChain、自定义 API）
- 有实际配置或使用经验

### 避坑指南

❌ 不要说：
- "MCP 就是调 API"（太浅）
- "没用过，不清楚"（可以诚实但要说了解原理）
- 把 MCP 和 RAG 混淆（一个是连接协议，一个是检索增强）

✅ 要说：
- "了解协议设计和三大能力"
- "看过官方文档和示例 Server"
- "在 XX 场景考虑过使用"

---

**相关阅读：**
- [AI 技术概览](./ai-overview.md) - 建立整体认知
- [RAG 技术详解](./ai-rag-deep-dive.md) - 学习检索增强
- [AI Agent 技术](./ai-agent-architecture.md) - 了解智能体架构
