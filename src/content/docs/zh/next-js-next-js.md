---
title: "01-Next.js 是什么？"
order: 50
section: "前端开发"
topic: "Next.js / 入门指南"
lang: "zh"
slug: "next-js-next-js"
summary: "Next.js 是一个基于 React 的全栈 Web 框架。 React 主要负责构建 UI，而 Next.js 在 React 之上提供了： 路由系统 服务端渲染 静态生成 数据获取 缓存 API / 后端接口能力 图片优化 字体优化"
toc: true
updated: 2026-07-28
---

# 01-Next.js 是什么？

## 一、先用一句话理解

Next.js 是一个基于 React 的全栈 Web 框架。

React 主要负责构建 UI，而 Next.js 在 React 之上提供了：

- 路由系统
- 服务端渲染
- 静态生成
- 数据获取
- 缓存
- API / 后端接口能力
- 图片优化
- 字体优化
- 部署优化
- SEO 支持

所以可以简单理解为：

> React 是 UI 库，Next.js 是 React 的应用框架。

---

## 二、用 Java / Spring 来类比

如果用 Java 后端经验来理解：

| 技术 | 类比 |
|---|---|
| React | 类似 View 层，只负责页面组件 |
| Next.js | 类似 React 生态里的 Spring Boot |
| page.tsx | 类似 Controller 对应的页面入口 |
| layout.tsx | 类似统一布局模板 |
| Route Handler | 类似 Controller API 接口 |
| Middleware | 类似拦截器 / Filter |
| Server Component | 类似服务端直接生成页面片段 |
| Client Component | 类似浏览器里运行的交互组件 |

当然，这只是帮助理解，不是完全等价。

Spring Boot 主要面向后端服务，Next.js 则同时关注：

- 前端页面
- 服务端渲染
- 接口能力
- 构建优化
- 用户访问性能

---

## 三、为什么不用纯 React？

纯 React 通常只负责浏览器端页面渲染。

如果只用 React，你通常还需要自己处理：

- 路由：React Router
- 打包：Vite / Webpack
- SSR：自己搭 Node 服务
- SEO：额外处理
- API 接口：单独写后端
- 图片优化：自己处理
- 页面性能：自己优化

Next.js 把这些常见能力整合好了。

所以 Next.js 更适合做完整应用，例如：

- 官网
- 博客
- 电商网站
- 管理后台
- SaaS 系统
- 内容平台
- 全栈项目

---

## 四、Next.js 的核心能力

### 1. 文件系统路由

Next.js 使用文件夹和文件定义路由。

例如：

```txt
src/app/page.tsx
````

对应页面：

```txt
/
```

再比如：

```txt
src/app/about/page.tsx
```

对应页面：

```txt
/about
```

也就是说：

> 文件夹路径就是 URL 路径，page.tsx 就是页面入口。

官方文档也说明，Next.js 使用 file-system based routing，也就是基于文件系统的路由。
参考：Next.js Layouts and Pages 文档。

---

### 2. App Router

Next.js 现在有两个路由体系：

* App Router
* Pages Router

App Router 是新的路由体系，基于 React Server Components，支持布局、嵌套路由、loading、error 等能力。

Pages Router 是旧的路由体系，仍然支持，但新项目建议优先学习 App Router。

我们接下来主要学习 App Router。

---

### 3. Server Components

在 App Router 中，组件默认是 Server Component。

Server Component 的特点：

* 在服务器端运行
* 可以直接访问数据库、文件系统、后端服务
* 不会把组件 JS 代码发送到浏览器
* 有利于减少客户端 JS 体积
* 适合展示型页面和数据读取

例如：

```tsx
export default async function Page() {
  const res = await fetch('https://example.com/api/posts')
  const posts = await res.json()

  return (
    <main>
      <h1>文章列表</h1>
      <pre>{JSON.stringify(posts, null, 2)}</pre>
    </main>
  )
}
```

这个组件默认在服务器端执行。

---

### 4. Client Components

如果组件需要浏览器交互，就要写：

```tsx
'use client'
```

例如：

```tsx
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      count: {count}
    </button>
  )
}
```

什么时候需要 Client Component？

* 使用 `useState`
* 使用 `useEffect`
* 使用 `onClick`
* 使用 `onChange`
* 使用 `window`
* 使用 `localStorage`
* 使用浏览器事件

一句话：

> 需要浏览器交互，就用 Client Component；只展示数据，优先用 Server Component。

---

### 5. 服务端渲染 SSR

SSR 全称是 Server Side Rendering。

意思是：

> 页面 HTML 在服务器端生成，然后返回给浏览器。

优点：

* 首屏更快
* SEO 更好
* 用户更快看到内容

例如新闻站、博客、电商详情页，都很适合 SSR。

---

### 6. 静态生成 SSG

SSG 全称是 Static Site Generation。

意思是：

> 页面在构建时提前生成好 HTML 文件。

适合变化不频繁的页面，比如：

* 文档
* 博客文章
* 产品介绍页
* 公司官网

优点：

* 访问速度快
* 服务器压力小
* 容易部署到 CDN

---

### 7. ISR 增量静态再生成

ISR 全称是 Incremental Static Regeneration。

意思是：

> 页面先静态生成，但可以按时间间隔重新生成。

例如：

```tsx
fetch('https://example.com/api/posts', {
  next: {
    revalidate: 60
  }
})
```

表示缓存 60 秒，之后可以重新验证数据。

适合：

* 商品列表
* 博客列表
* 新闻列表
* 内容变化不是实时但会更新的页面

---

### 8. Route Handlers

Route Handler 可以用来写后端接口。

例如：

```txt
src/app/api/hello/route.ts
```

```ts
export async function GET() {
  return Response.json({
    message: 'Hello Next.js'
  })
}
```

访问：

```txt
/api/hello
```

你可以把它类比成 Spring Boot 里的：

```java
@GetMapping("/api/hello")
```

Next.js 官方文档说明，Route Handlers 只在 `app` 目录中可用，相当于 Pages Router 里的 API Routes，因此 App Router 项目里不需要同时使用 Route Handlers 和 API Routes。

---

## 五、Next.js 适合做什么？

### 适合

* 需要 SEO 的网站
* 内容型网站
* 电商网站
* 企业官网
* 博客系统
* SaaS 系统
* 中后台系统
* 全栈小项目
* 前后端一体项目

### 不一定适合

* 纯后端微服务
* 极复杂后端业务系统
* 大型分布式后端
* 对实时通信要求极高的服务端系统

这些场景一般还是 Java / Go / Node 后端框架更合适。

---

## 六、Next.js 和传统前后端分离的区别

传统前后端分离：

```txt
浏览器
  ↓
React 前端
  ↓
Java / Node / Python 后端 API
  ↓
数据库
```

Next.js 全栈模式：

```txt
浏览器
  ↓
Next.js 页面
  ↓
Next.js Server Component / Route Handler / Server Action
  ↓
数据库 / 外部 API
```

也就是说，Next.js 可以同时承担：

* 前端页面
* 部分后端接口
* 服务端渲染
* 数据获取
* 页面缓存

但在真实公司里，也经常是：

```txt
Next.js 前端层
  ↓
Java / Go / Node 后端服务
  ↓
数据库
```

这种模式也很常见。

---

## 七、学习 Next.js 要抓住的主线

学习 Next.js 不要一开始陷入 API 细节。

先抓住这几条主线：

### 第一条：路由

你要知道：

```txt
app/page.tsx        => /
app/about/page.tsx  => /about
app/blog/page.tsx   => /blog
```

### 第二条：组件运行在哪里

你要分清楚：

```txt
Server Component：服务器运行
Client Component：浏览器运行
```

### 第三条：页面如何渲染

你要理解：

```txt
SSR：请求时服务端生成
SSG：构建时静态生成
ISR：静态生成 + 定时更新
CSR：浏览器端渲染
```

### 第四条：数据如何获取和缓存

你要理解：

```txt
fetch
cache
revalidate
no-store
动态渲染
静态渲染
```

### 第五条：后端能力

你要掌握：

```txt
Route Handlers
Server Actions
Cookies
Headers
Middleware
Auth
```

---

## 八、面试中怎么描述 Next.js？

可以这样回答：

> Next.js 是一个基于 React 的全栈 Web 框架。它提供了文件系统路由、服务端渲染、静态生成、数据获取、缓存、Route Handlers、Server Actions、图片优化等能力。相比纯 React，Next.js 更适合构建生产级应用，尤其是需要 SEO、首屏性能和全栈能力的项目。现在新项目通常优先使用 App Router，它基于 React Server Components，可以更好地区分服务端组件和客户端组件。

---

## 九、本节重点

本节你需要记住：

* React 是 UI 库
* Next.js 是 React 框架
* Next.js 支持前端页面和部分后端能力
* App Router 是当前主线
* Server Component 默认在服务器端运行
* Client Component 用于浏览器交互
* Route Handler 可以写接口
* SSR、SSG、ISR 是 Next.js 面试重点

---

## 十、课后练习

### 练习 1

用自己的话回答：

```txt
React 和 Next.js 有什么区别？
```

### 练习 2

用自己的话解释：

```txt
Server Component 和 Client Component 的区别是什么？
```

### 练习 3

想一想下面页面适合什么渲染方式：

```txt
1. 博客详情页
2. 后台管理系统首页
3. 商品详情页
4. 用户个人中心
5. 公司官网首页
```

### 练习 4

尝试用 Java / Spring 的概念类比下面几个东西：

```txt
page.tsx
layout.tsx
Route Handler
Middleware
Server Component
```
