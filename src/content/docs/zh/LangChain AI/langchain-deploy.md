---
title: LangSmith 部署
order: 15
section: "LangChain AI"
topic: "LangChain"
lang: "zh"
slug: "langchain-deploy"
summary: 了解如何使用 LangSmith 将 LangChain agent 部署到生产环境
icon: "rocket"
featured: true
toc: true
updated: 2026-03-07
---

import deploy from '/snippets/oss/deploy.mdx';

当你准备将 LangChain agent 部署到生产环境时，LangSmith 提供了一个专为 agent 工作负载设计的托管平台。传统的托管平台是为无状态、短生命的 Web 应用程序构建的，而 LangGraph **专为需要持久状态和后台执行的有状态、长期运行的 agent 而构建**。LangSmith 处理基础设施、扩展和运营问题，因此你可以直接从仓库部署。

## 前提条件

开始之前，请确保你具备以下条件：

- 一个 [GitHub 账户](https://github.com/)
- 一个 [LangSmith 账户](https://smith.langchain.com/)（免费注册）

## 部署你的 agent

### 1. 在 GitHub 上创建仓库

你的应用程序代码必须存放在 GitHub 仓库中才能部署到 LangSmith。支持公共和私有仓库。对于这个快速入门，首先通过遵循 [本地服务器设置指南](/oss/langchain/studio#setup-local-agent-server) 确保你的应用与 LangGraph 兼容。然后，将代码推送到仓库。

<deploy />
