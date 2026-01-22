---
title: "布吉岛雨课堂导出工具"
summary: "雨课堂试卷导出合集，包含浏览器扩展（Manifest v3）与独立用户脚本两种形态，支持小窗试卷和无图试卷导出，双格式输出（Markdown / JSON）。"
tags: ["Browser Extension", "雨课堂", "JavaScript", "Manifest V3", "Chrome Extension"]
lang: "zh"
repo: "https://github.com/itkdm/yuketang-export"
demo: "https://ykt.itkdm.com/"
icon: "📚"
order: 3
featured: true
---

一个功能完整的浏览器扩展，用于导出雨课堂试卷内容。支持两种导出模式：小窗试卷（iframe试卷）和无图试卷（正常试卷），提供 Markdown 和 JSON 两种导出格式。

## ✨ 功能特性

### 两种导出模式

**1. 小窗试卷模式（iframe试卷）**
- 适用于：`www.yuketang.cn/v2/web/*` 和 `www.yuketang.cn/v/quiz/*`
- 支持选择题（MultipleChoice）和填空题（FillBlank）
- 保留图片URL，不做OCR
- 导出格式：JSON、Markdown

**2. 无图试卷模式（正常试卷）**
- 适用于：`examination.xuetangx.com/*`
- 导出题目、选项、答案
- 仅导出你有权限查看的内容（复习模式）
- 导出格式：JSON、Markdown

### 核心功能

- ✅ **智能识别**：自动检测页面类型并切换对应模式
- ✅ **模式切换**：支持手动切换导出模式
- ✅ **开关控制**：可随时启用/禁用扩展
- ✅ **权限控制**：仅导出你有权限查看的内容
- ✅ **安全可靠**：所有数据处理在本地完成，不上传任何数据
- ✅ **UI设计**：蓝色科技感设计风格，美观易用
- ✅ **SPA兼容**：监听 URL 变化重新挂载面板

## 🚀 使用方法

### 浏览器扩展（推荐）

1. 访问 `chrome://extensions` 或 `edge://extensions`
2. 打开"开发者模式"
3. "加载已解压的扩展程序" → 选择 `extension/` 文件夹
4. 页面右侧会出现导出面板，开关可在弹出层控制

### 用户脚本版本

1. 安装 Tampermonkey / Violentmonkey
2. 新建脚本，复制对应 `.md` 中的内容保存
3. 访问对应页面即可看到导出按钮

## 🛠️ 技术实现

- **Manifest V3**：使用最新的扩展规范
- **Content Script**：在页面中注入功能
- **Chrome Storage API**：用于存储用户配置（如开关状态）
- **Fetch API**：跨域请求（通过host_permissions）
- **原生 JavaScript**：无第三方依赖，轻量高效

## 🔒 隐私与安全

### 数据安全

- ✅ **本地处理**：所有数据处理均在用户本地浏览器中进行
- ✅ **不上传数据**：不会向任何服务器上传数据
- ✅ **不收集信息**：不收集用户的个人信息
- ✅ **权限最小化**：仅请求必要的权限

### 安全机制

- 无图试卷模式会检查 `show_answer` 权限
- 仅导出用户有权限查看的内容
- 不会绕过网站的权限控制

## 📦 项目结构

```
yuketang-export/
├── extension/          # 浏览器扩展源码（推荐）
│   ├── manifest.json
│   ├── content.js
│   ├── popup.html
│   └── popup.js
├── userscripts/       # 用户脚本版本
│   ├── 布吉岛雨课堂导出工具 - 小窗试卷版.md
│   └── 布吉岛雨课堂导出工具 - 无图试卷版.md
└── test/              # 调试/样例数据
```

## ⚙️ 安装要求

- Chrome 88+ / Edge 88+ / Firefox 109+
- 现代浏览器（支持 ES6+）

## ⚠️ 免责声明

本工具仅供学习交流使用，请遵守相关法律法规和网站使用条款。使用者需自行承担使用本工具的风险和责任。
