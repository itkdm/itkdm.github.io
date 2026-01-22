# mywebsite（Astro 静态站）

这是一个 **Astro 5 静态站点**，包含多语言（`/zh`、`/en`）、博客/文档/项目/工具页、Pagefind 全文搜索，以及可选的 Giscus 评论与页面级密码保护示例。

## 🧱 目录结构（高频关注）

- **源码**：`src/`
  - **页面路由**：`src/pages/`
  - **布局**：`src/layouts/`
  - **组件**：`src/components/`
  - **内容（Markdown）**：`src/content/`
  - **侧栏与数据**：`src/data/`
  - **构建时生成数据**：`src/generated/`
- **静态资源**：`public/`
- **构建产物（不提交）**：`dist/`

## 🧞 常用命令

```bash
npm install
npm run dev
npm run build
npm run preview
```

说明：
- **`npm run dev`**：本地开发
- **`npm run build`**：构建到 `dist/`
- **`npm run preview`**：本地预览构建产物

## 🔎 全文搜索（Pagefind）

构建后会自动运行 Pagefind：
- `package.json` 中 `postbuild`：`npx pagefind --site dist`

## 🧩 内容维护（如何新增内容）

内容都在 `src/content/` 下按类型与语言分目录：
- **Blog**：`src/content/blog/{zh|en}/*.md`
- **Docs**：`src/content/docs/{zh|en}/*.md`
- **Projects**：`src/content/projects/{zh|en}/*.md`
- **Tools**：`src/content/tools/{zh|en}/*.md`
- **Downloads**：`src/content/downloads/{zh|en}/*.md`

每类内容的字段约束见：`src/content/config.ts`

## 🔐 页面级密码保护（可选）

核心实现：
- 工具函数：`src/lib/password-protection.ts`
- 组件：`src/components/PasswordGate.astro`
- 示例页：`src/pages/[lang]/password-example.astro`

最小用法（建议用环境变量）：
- 在 `.env` 中设置（不要提交）：

```env
PUBLIC_PAGE_PASSWORD=change_me
```

然后在页面中：

```astro
---
import PasswordGate from '../../components/PasswordGate.astro';
const PAGE_PASSWORD = import.meta.env.PUBLIC_PAGE_PASSWORD || '';
---

<PasswordGate password={PAGE_PASSWORD} lang="zh">
  <!-- 受保护内容 -->
</PasswordGate>
```

安全说明：这是**内容访问控制/防误触**，不是强安全方案（客户端可被技术用户绕过）。

## 💬 Giscus 评论（可选）

组件：`src/components/Giscus.astro`

需要在 `.env` 配置以下变量（从 `giscus.app` 获取）：

```env
PUBLIC_GISCUS_REPO=username/repo-name
PUBLIC_GISCUS_REPO_ID=R_xxxxxxxxxx
PUBLIC_GISCUS_CATEGORY=Announcements
PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDxxxxxxxxx
```

## 🧹 仓库清理约定

以下目录/文件**不应提交**：
- `dist/`
- `node_modules/`
- `.env` / `.env.production`
