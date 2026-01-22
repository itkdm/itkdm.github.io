---
title: "Open Lab Components"
summary: "面向宿主系统的 HTML fragment 组件库，专注于物理实验组件。纯 HTML Fragment、CSS 变量驱动、零外部依赖、样式隔离、即插即用。"
tags: ["Component Library", "HTML", "Physics", "Education", "STEM", "Lab"]
lang: "zh"
repo: "https://github.com/itkdm/open-lab-components"
demo: "https://olc.itkdm.com/"
icon: "🧪"
order: 4
featured: true
---

一个面向"宿主系统/编辑器/画布"的 **HTML fragment 单组件库**：组件只负责"器材长什么样 + 哪些参数可调 + 参数如何映射到视觉"，不负责页面布局/背景/说明文案等。

## ✨ 核心特性

- 🎯 **纯 HTML Fragment**：每个组件都是独立的 HTML 片段，不依赖外部框架
- 🎨 **CSS 变量驱动**：所有可配置参数通过 CSS 变量暴露，灵活易用
- 🚫 **零外部依赖**：组件完全自包含，无外部资源引用
- 🔒 **样式隔离**：CSS 作用域完全隔离，不会污染宿主环境
- 📦 **即插即用**：可直接复制粘贴到任何 HTML 环境中使用
- 🛠️ **类型安全**：通过 Manifest 声明参数类型和默认值
- ♿ **可访问性支持**：内置 ARIA 标签，支持屏幕阅读器

## 📦 组件列表

当前包含 **6 个物理实验组件**，涵盖以下分类：

### 物理器材 (Physics Apparatus)
- 💡 **灯泡** (`phy.apparatus.bulb.basic`) - 基础灯泡组件
- 📏 **刻度尺** (`phy.ruler.vertical.metric`) - 垂直米制刻度尺
- ⚖️ **砝码（基础）** (`phy.weight.mass.basic`) - 基础砝码组件
- ⚖️ **砝码（写实）** (`phy.weight.hook.realistic`) - 写实风格带钩砝码

### 电路元件 (Circuit Components)
- 🔌 **电阻** (`phy.resistor.axial.basic`) - 轴向电阻，支持色环自定义
- 🔋 **电压表** (`phy.meter.voltage.draggable`) - 可拖拽电压表组件

## 🚀 快速开始

### 方式一：直接复制 HTML 片段

1. 从 `components/` 目录中找到需要的组件文件
2. 复制整个文件内容
3. 粘贴到你的 HTML 页面中
4. 通过 CSS 变量或 `data-props` 属性配置参数

```html
<div class="cmp" data-cmp-id="phy.resistor.axial.basic" 
     style="--cmp-size: 80px; --cmp-body: #caa070;">
    <!-- ... 组件内容 ... -->
</div>
```

### 方式二：使用 data-props 属性

```html
<div class="cmp" 
     data-cmp-id="phy.resistor.axial.basic"
     data-props='{"size": 100, "body": "#caa070", "stroke": "#111827"}'>
    <!-- 组件会自动解析 data-props 并应用配置 -->
</div>
```

### 方式三：动态加载（JavaScript）

```javascript
async function loadComponent(componentId) {
    const response = await fetch(`components/physics/circuit/${componentId}.html`);
    const html = await response.text();
    return html;
}

const resistorHtml = await loadComponent('phy.resistor.axial.basic');
document.getElementById('container').innerHTML = resistorHtml;
```

## 🛠️ 开发指南

### 本地开发

```bash
# 验证所有组件
npm run validate

# 构建注册表和展示站
npm run build

# 启动本地开发服务器
npm run dev:site
```

访问 `http://localhost:3000` 查看组件展示站，可以：
- 浏览所有组件
- 实时预览和调整参数
- 复制组件代码
- 查看组件文档

### 添加新组件

1. **选择分类和位置**：在 `components/` 下创建对应的目录结构
2. **创建组件文件**：填写 Manifest 元数据，实现组件 HTML/CSS/JS
3. **本地验证和注册**：运行 `npm run validate` 和 `npm run build-registry`
4. **提交 PR**：确保通过 CI 验证

## 📁 项目结构

```
open-lab-components/
├── components/          # 组件源文件（1 文件 = 1 组件）
│   └── physics/
│       ├── apparatus/   # 物理器材组件
│       └── circuit/     # 电路元件组件
├── registry/           # 机器可读索引（自动生成）
├── site/               # 展示站（组件广场）
├── tools/              # 构建和验证工具
└── docs/               # 文档和规范
```

## 🔧 组件规范

每个组件必须遵循以下规范：

1. **文件格式**：必须是 HTML fragment（不包含 doctype/html/head/body）
2. **Manifest 元数据**：组件文件顶部必须包含 `@cmp-manifest` 注释块
3. **样式要求**：样式必须内联，CSS 选择器必须作用域隔离
4. **JavaScript（可选）**：必须使用 IIFE 自包含，不向全局作用域暴露变量

详细规范请查看 [组件规范文档](https://github.com/itkdm/open-lab-components/blob/main/docs/SPEC.md)。

## 📦 可用脚本

```bash
# 验证所有组件是否符合规范
npm run validate

# 构建组件注册表
npm run build:registry

# 构建展示站
npm run build:site

# 构建所有内容
npm run build

# 启动开发服务器（展示站）
npm run dev:site
```

## 🔗 相关链接

- [组件展示站](https://itkdm.github.io/open-lab-components) - 在线浏览和测试组件
- [组件规范文档](https://github.com/itkdm/open-lab-components/blob/main/docs/SPEC.md) - 详细的组件开发规范
- [分类规则文档](https://github.com/itkdm/open-lab-components/blob/main/docs/CATEGORY.md) - 组件分类和命名规则
- [贡献指南](https://github.com/itkdm/open-lab-components/blob/main/docs/CONTRIBUTING.md) - 如何参与贡献
