---
title: 构建 SQL agent
order: 21
section: "LangChain AI"
topic: "LangChain"
lang: "zh"
slug: "langchain-sql-agent"
summary: 学习如何构建可以使用 LangChain agents 回答 SQL database 问题的 agent
icon: "database"
featured: true
toc: true
updated: 2026-03-07
---

import ChatModelTabsPy from '/snippets/chat-model-tabs.mdx';
import ChatModelTabsJS from '/snippets/chat-model-tabs-js.mdx';

## 概述

在本教程中，你将学习如何使用 LangChain [agents](/oss/langchain/agents) 构建可以回答 SQL database 问题的 agent。

总体而言，agent 将：

<Steps>
<Step title="从 database 获取可用的 tables 和 schemas" />
<Step title="决定哪些 tables 与问题相关" />
<Step title="获取相关 tables 的 schemas" />
<Step title="基于问题和 schemas 信息生成 query" />
<Step title="使用 LLM 双重检查 query 是否存在常见错误" />
<Step title="执行 query 并返回结果" />
<Step title="纠正 database engine 发现的错误，直到 query 成功" />
<Step title="基于结果制定响应" />
</Steps>

<Warning>
构建 SQL databases 的 Q&A 系统需要执行 model-generated SQL queries。这样做存在固有风险。确保你的 database connection permissions 始终为你的 agent 需求尽可能缩小范围。这将减轻（但不会消除）构建 model-driven system 的风险。
</Warning>

### 概念

我们将涵盖以下概念：

- 用于从 SQL databases 读取的 [Tools](/oss/langchain/tools)
- LangChain [agents](/oss/langchain/agents)
- [Human-in-the-loop](/oss/langchain/human-in-the-loop) processes

## 设置

### 安装

:::python
<CodeGroup>
```bash pip
pip install langchain langgraph langchain-community
```
</CodeGroup>
:::

:::js
<CodeGroup>
```bash npm
npm i langchain @langchain/core typeorm sqlite3 zod
```
```bash yarn
yarn add langchain @langchain/core typeorm sqlite3 zod
```
```bash pnpm
pnpm add langchain @langchain/core typeorm sqlite3 zod
```
</CodeGroup>
:::

### LangSmith

设置 [LangSmith](https://smith.langchain.com) 以检查 chain 或 agent 内部发生的事情。然后设置以下环境变量：

```shell
export LANGSMITH_TRACING="true"
export LANGSMITH_API_KEY="..."
```

## 1. 选择 LLM

:::python
选择支持 [tool-calling](/oss/integrations/providers/overview) 的 model：

<ChatModelTabsPy />
:::

:::js
选择支持 [tool-calling](/oss/integrations/providers/overview) 的 model：

<ChatModelTabsJS />
:::

下面示例中显示的输出使用了 OpenAI。

## 2. 配置 database

你将为本教程创建 [SQLite database](https://www.sqlitetutorial.net/sqlite-sample-database/)。SQLite 是易于设置和使用的 lightweight database。我们将加载 `chinook` database，这是一个代表 digital media store 的示例 database。

为方便起见，我们将 database (`Chinook.db`) 托管在公共 GCS bucket 上。

:::python
```python
import requests, pathlib

url = "https://storage.googleapis.com/benchmarks-artifacts/chinook/Chinook.db"
local_path = pathlib.Path("Chinook.db")

if local_path.exists():
    print(f"{local_path} already exists, skipping download.")
else:
    response = requests.get(url)
    if response.status_code == 200:
        local_path.write_bytes(response.content)
        print(f"File downloaded and saved as {local_path}")
    else:
        print(f"Failed to download the file. Status code: {response.status_code}")
```
:::

:::python
我们将使用 `langchain_community` 包中可用的 handy SQL database wrapper 与 database 交互。wrapper 提供简单的 interface 来执行 SQL queries 和获取结果：

```python
from langchain_community.utilities import SQLDatabase

db = SQLDatabase.from_uri("sqlite:///Chinook.db")

print(f"Dialect: {db.dialect}")
print(f"Available tables: {db.get_usable_table_names()}")
print(f'Sample output: {db.run("SELECT * FROM Artist LIMIT 5;")}')
```
```
Dialect: sqlite
Available tables: ['Album', 'Artist', 'Customer', 'Employee', 'Genre', 'Invoice', 'InvoiceLine', 'MediaType', 'Playlist', 'PlaylistTrack', 'Track']
Sample output: [(1, 'AC/DC'), (2, 'Accept'), (3, 'Aerosmith'), (4, 'Alanis Morissette'), (5, 'Alice In Chains')]
```
:::

## 3. 添加用于 database 交互的 tools

:::python
使用 `langchain_community` 包中可用的 `SQLDatabase` wrapper 与 database 交互。wrapper 提供简单的 interface 来执行 SQL queries 和获取结果：

```python
from langchain_community.agent_toolkits import SQLDatabaseToolkit

toolkit = SQLDatabaseToolkit(db=db, llm=model)

tools = toolkit.get_tools()

for tool in tools:
    print(f"{tool.name}: {tool.description}\n")
```
```
sql_db_query: Input to this tool is a detailed and correct SQL query, output is a result from the database. If the query is not correct, an error message will be returned. If an error is returned, rewrite the query, check the query, and try again. If you encounter an issue with Unknown column 'xxxx' in 'field list', use sql_db_schema to query the correct table fields.

sql_db_schema: Input to this tool is a comma-separated list of tables, output is the schema and sample rows for those tables. Be sure that the tables actually exist by calling sql_db_list_tables first! Example Input: table1, table2, table3

sql_db_list_tables: Input is an empty string, output is a comma-separated list of tables in the database.

sql_db_query_checker: Use this tool to double check if your query is correct before executing it. Always use this tool before executing a query with sql_db_query!
```
:::

## 4. 使用 `create_agent`

使用 @[`create_agent`] 用最少的代码构建 [ReAct agent](https://arxiv.org/pdf/2210.03629)。agent 将解释请求并生成 SQL command，tools 将执行该命令。如果命令有错误，将返回错误消息。model 可以检查原始请求和新错误消息并生成新命令。这可以持续进行，直到 LLM 成功生成命令或达到结束计数。这种向 model 提供反馈的模式（在本例中为错误消息）非常强大。

使用 descriptive system prompt 初始化 agent 以自定义其行为：

```python
system_prompt = """
You are an agent designed to interact with a SQL database.
Given an input question, create a syntactically correct {dialect} query to run,
then look at the results of the query and return the answer. Unless the user
specifies a specific number of examples they wish to obtain, always limit your
query to at most {top_k} results.

You can order the results by a relevant column to return the most interesting
examples in the database. Never query for all the columns from a specific table,
only ask for the relevant columns given the question.

You MUST double check your query before executing it. If you get an error while
executing a query, rewrite the query and try again.

DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the
database.

To start you should ALWAYS look at the tables in the database to see what you
can query. Do NOT skip this step.

Then you should query the schema of the most relevant tables.
""".format(
    dialect=db.dialect,
    top_k=5,
)
```

现在，使用 model、tools 和 prompt 创建 agent：

```python
from langchain.agents import create_agent


agent = create_agent(
    model,
    tools,
    system_prompt=system_prompt,
)
```

## 5. 运行 agent

在示例 query 上运行 agent 并观察其行为：

```python
question = "Which genre on average has the longest tracks?"

for step in agent.stream(
    {"messages": [{"role": "user", "content": question}]},
    stream_mode="values",
):
    step["messages"][-1].pretty_print()
```

agent 正确地编写了 query，检查了 query，并运行它以告知其最终响应。

<Note>
    你可以在 [LangSmith trace](https://smith.langchain.com/public/cd2ce887-388a-4bb1-a29d-48208ce50d15/r) 中检查上述运行的所有方面，包括采取的步骤、调用的 tools、LLM 看到的 prompts 等。
</Note>

## 6. 实现 human-in-the-loop review

在执行 agent 的 SQL queries 之前检查它们是否存在任何意外操作或低效可能是谨慎的。

LangChain agents 支持内置 [human-in-the-loop middleware](/oss/langchain/human-in-the-loop) 来为 agent tool calls 添加监督。让我们配置 agent 在调用 `sql_db_query` 工具时暂停进行人工审查：

```python
from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware # [!code highlight]
from langgraph.checkpoint.memory import InMemorySaver # [!code highlight]


agent = create_agent(
    model,
    tools,
    system_prompt=system_prompt,
    middleware=[ # [!code highlight]
        HumanInTheLoopMiddleware( # [!code highlight]
            interrupt_on={"sql_db_query": True}, # [!code highlight]
            description_prefix="Tool execution pending approval", # [!code highlight]
        ), # [!code highlight]
    ], # [!code highlight]
    checkpointer=InMemorySaver(), # [!code highlight]
)
```

<Note>
我们向 agent 添加了 [checkpointer](/oss/langchain/short-term-memory) 以允许执行暂停和恢复。有关详情以及可用的 middleware configurations，请参阅 [human-in-the-loop guide](/oss/langchain/human-in-the-loop)。
</Note>

运行 agent 时，它现在将在执行 `sql_db_query` 工具之前暂停进行审查。

我们可以恢复执行，在这种情况下接受 query，使用 [Command](/oss/langgraph/use-graph-api#combine-control-flow-and-state-updates-with-command)：

```python
from langgraph.types import Command # [!code highlight]

for step in agent.stream(
    Command(resume={"decisions": [{"type": "approve"}]}), # [!code highlight]
    config,
    stream_mode="values",
):
    if "messages" in step:
        step["messages"][-1].pretty_print()
```

有关详情，请参阅 [human-in-the-loop guide](/oss/langchain/human-in-the-loop)。

## 下一步

有关更深入的自定义，请参阅 [本教程](/oss/langgraph/sql-agent)，了解直接使用 LangGraph primitives 实现 SQL agent。
