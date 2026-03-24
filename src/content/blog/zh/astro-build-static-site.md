---
title: "如何用 Astro 构建高性能静态网站"
date: 2025-09-26
tags: [Astro, 前端, 静态网站, 性能优化]
summary: "Astro 是一个现代化的静态网站生成器，它允许你使用你喜欢的框架组件，但只在需要时发送 JavaScript，从而获得极致的性能。本文将介绍如何使用 Astro 构建一个高性能的静态网站。"
lang: "zh"
draft: false
priority: 5
---

Astro 是一个现代化的静态网站生成器，它允许你使用你喜欢的框架组件（React、Vue、Svelte 等），但只在需要时发送 JavaScript，从而获得极致的性能。

## 为什么选择 Astro？

Astro 的核心优势在于它的"零 JavaScript"理念。默认情况下，Astro 会将所有组件渲染为静态 HTML，只在需要时才发送 JavaScript。这意味着：

- **🚀 更快的页面加载速度**：减少了初始 JavaScript 包的大小
- **📈 更好的 SEO**：所有内容都是预渲染的 HTML
- **💰 更低的服务器成本**：静态文件可以托管在任何 CDN 上
- **🔧 灵活的组件系统**：可以使用 React、Vue、Svelte 等框架组件
- **📦 内置优化**：图片优化、代码分割等功能开箱即用

## 开始使用

### 创建新项目

安装 Astro 非常简单：

```bash
npm create astro@latest
```

或者使用其他包管理器：

```bash
# 使用 yarn
yarn create astro

# 使用 pnpm
pnpm create astro
```

按照提示选择你喜欢的模板和配置。

### 项目结构

典型的 Astro 项目结构如下：

```
my-astro-site/
├── public/          # 静态资源
│   ├── favicon.svg
│   └── logo.png
├── src/
│   ├── components/  # Astro 组件
│   ├── layouts/     # 布局组件
│   ├── pages/       # 页面路由
│   └── styles/      # 样式文件
├── astro.config.mjs # Astro 配置文件
└── package.json
```

## 组件系统

### Astro 组件

Astro 组件使用 `.astro` 扩展名，结合了 HTML 的简洁和组件化的优势：

```astro
---
// 组件脚本部分（在构建时运行）
const title = "Hello Astro";
const items = ["Item 1", "Item 2", "Item 3"];
---

<!-- 组件模板部分 -->
<div>
  <h1>{title}</h1>
  <ul>
    {items.map(item => <li>{item}</li>)}
  </ul>
</div>

<style>
  /* 样式作用域自动限定在当前组件 */
  h1 {
    color: blue;
  }
</style>
```

### 使用其他框架组件

Astro 支持多种前端框架的组件，你可以在同一个项目中混合使用：

```astro
---
import ReactButton from '../components/ReactButton.tsx';
import VueCard from '../components/VueCard.vue';
import SvelteCounter from '../components/SvelteCounter.svelte';
---

<div>
  <!-- 默认不发送 JavaScript -->
  <ReactButton client:load /> <!-- 只在客户端加载时发送 JS -->
  <VueCard client:idle />     <!-- 在浏览器空闲时发送 JS -->
  <SvelteCounter client:visible /> <!-- 在元素可见时发送 JS -->
</div>
```

### 客户端指令

Astro 提供了多种客户端指令来控制 JavaScript 的加载时机：

- `client:load` - 立即加载并激活
- `client:idle` - 在浏览器空闲时加载
- `client:visible` - 在元素可见时加载
- `client:media` - 在匹配媒体查询时加载
- `client:only` - 跳过服务器渲染

## 性能优化

### 1. 部分水合（Partial Hydration）

只对需要交互的组件进行水合，其他组件保持静态 HTML：

```astro
---
import InteractiveCounter from './InteractiveCounter.tsx';
---

<!-- 这个组件保持静态，不发送 JavaScript -->
<div>
  <h1>静态标题</h1>
  <p>这是静态内容，不会发送 JavaScript。</p>
</div>

<!-- 只有这个组件会发送 JavaScript -->
<InteractiveCounter client:load />
```

### 2. 代码分割

Astro 自动进行代码分割，每个页面只加载需要的代码：

```astro
---
// 只有在页面被访问时才会加载这个组件
import HeavyComponent from './HeavyComponent.astro';
---

<HeavyComponent />
```

### 3. 图片优化

Astro 内置了图片优化功能：

```astro
---
import { Image } from 'astro:assets';
import logo from '../assets/logo.png';
---

<!-- 自动优化图片，生成多种格式和尺寸 -->
<Image src={logo} alt="Logo" width={200} height={200} />
```

### 4. 静态资源优化

```astro
---
// 自动优化和压缩
import styles from '../styles/main.css';
---

<link rel="stylesheet" href={styles} />
```

## 路由系统

Astro 使用基于文件的路由系统：

```
src/pages/
├── index.astro          # 路由: /
├── about.astro          # 路由: /about
├── blog/
│   ├── index.astro      # 路由: /blog
│   ├── [slug].astro     # 动态路由: /blog/:slug
│   └── [...slug].astro  # 捕获所有路由: /blog/*
└── api/
    └── users.json.ts    # API 端点: /api/users.json
```

### 动态路由

```astro
---
// src/pages/blog/[slug].astro
export async function getStaticPaths() {
  const posts = await fetchPosts();
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }));
}

const { post } = Astro.props;
---

<article>
  <h1>{post.title}</h1>
  <p>{post.content}</p>
</article>
```

## 内容集合（Content Collections）

Astro 的 Content Collections 功能提供了类型安全的内容管理：

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
  }),
});

export const collections = { blog };
```

```astro
---
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');
---

{posts.map(post => (
  <article>
    <h2>{post.data.title}</h2>
    <time>{post.data.date.toDateString()}</time>
  </article>
))}
```

## 部署

### 静态部署

Astro 默认构建为静态网站，可以部署到：

- **GitHub Pages** - 免费静态托管
- **Netlify** - 自动部署和预览
- **Vercel** - 边缘网络加速
- **Cloudflare Pages** - 全球 CDN

### 部署命令

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

## 最佳实践

1. **最大化使用静态内容**：尽量使用 Astro 组件而不是框架组件
2. **合理使用客户端指令**：只在需要时才加载 JavaScript
3. **优化图片**：使用 `astro:assets` 的 Image 组件
4. **利用 Content Collections**：类型安全的内容管理
5. **代码分割**：按页面自动分割代码
6. **使用 Layout**：创建可复用的布局组件

## 总结

Astro 为构建高性能静态网站提供了完美的解决方案。通过：

- ✅ 零 JavaScript 的默认理念
- ✅ 灵活的组件系统
- ✅ 内置的性能优化
- ✅ 类型安全的内容管理
- ✅ 简单易用的 API

你可以快速构建出极速、SEO 友好的现代网站。无论你是构建博客、文档站点还是企业官网，Astro 都是一个优秀的选择。
