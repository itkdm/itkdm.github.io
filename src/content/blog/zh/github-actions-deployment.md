---
title: "GitHub Actions 自动化部署实践"
date: 2024-01-05
tags: [GitHub Actions, CI-CD, 自动化, DevOps]
summary: "GitHub Actions 是 GitHub 提供的持续集成和持续部署服务。本文将介绍如何使用 GitHub Actions 实现自动化构建、测试和部署，提高开发效率和代码质量。"
lang: "zh"
draft: false
priority: 0
---

GitHub Actions 是 GitHub 提供的持续集成和持续部署（CI/CD）服务。通过 GitHub Actions，你可以自动化构建、测试、部署等流程，提高开发效率和代码质量。

## 什么是 GitHub Actions？

GitHub Actions 是一个自动化工作流平台，允许你在 GitHub 仓库中直接创建、测试和部署代码。它通过 YAML 文件定义工作流，可以在各种事件（如 push、pull request、issue 创建等）触发时自动执行。

### 核心概念

- **Workflow（工作流）**：一个自动化的流程，由一个或多个作业组成
- **Job（作业）**：一组在同一运行器上执行的步骤
- **Step（步骤）**：单个任务，可以是命令或 Action
- **Action**：可重用的代码单元，可以在工作流中使用
- **Runner（运行器）**：执行工作流的服务器

## 创建第一个工作流

在 `.github/workflows` 目录下创建一个 YAML 文件（如 `ci.yml`）：

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
```

### 工作流配置说明

- `on`: 定义触发工作流的事件
- `jobs`: 定义要执行的工作
- `runs-on`: 指定运行器（ubuntu-latest、windows-latest、macos-latest）
- `steps`: 定义作业中的步骤
- `uses`: 使用预定义的 Action
- `run`: 执行命令

## 自动化部署

### 部署到 GitHub Pages

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch: # 允许手动触发

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 部署到服务器（SSH）

```yaml
name: Deploy to Server

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy via SSH
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "dist/*"
          target: "/var/www/html"
```

### 使用 Secrets

敏感信息（如 API 密钥、密码）应该存储在 GitHub Secrets 中：

1. 进入仓库的 Settings > Secrets and variables > Actions
2. 点击 "New repository secret"
3. 添加密钥名称和值
4. 在工作流中使用：`${{ secrets.SECRET_NAME }}`

## 矩阵构建

矩阵构建允许你在多个配置下运行相同的作业：

```yaml
strategy:
  matrix:
    node-version: [16, 18, 20]
    os: [ubuntu-latest, windows-latest, macos-latest]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
```

## 条件执行

可以使用条件来控制步骤或作业的执行：

```yaml
steps:
  - name: Build
    if: github.ref == 'refs/heads/main'
    run: npm run build
  
  - name: Deploy
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    run: npm run deploy
```

## 缓存依赖

使用缓存可以加速构建过程：

```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

## 最佳实践

1. **使用最新版本的 Action**：定期更新 Action 到最新版本
2. **合理使用缓存**：缓存依赖和构建产物，加速工作流
3. **使用矩阵构建**：在多个环境和版本下测试
4. **设置超时时间**：防止工作流运行时间过长
5. **使用环境变量**：通过 Secrets 管理敏感信息
6. **添加状态徽章**：在 README 中显示构建状态

## 常见工作流模板

### Astro 项目部署

```yaml
name: Deploy Astro Site

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 总结

GitHub Actions 为现代软件开发提供了强大的自动化能力。通过合理使用 GitHub Actions，你可以：

- ✅ 自动化测试和构建流程
- ✅ 持续集成和部署
- ✅ 提高代码质量和交付速度
- ✅ 减少人工操作的错误
- ✅ 让团队专注于代码开发

开始使用 GitHub Actions，让你的开发工作流更加高效！