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

每类内容的字段约束见：`src/content/config.ts`。下面以「Docs 文档」为例，说明**如何新增 & 维护文档**。

### Docs 文档放在哪里？

- **中文文档**：`src/content/docs/zh/*.md`
- **英文文档**：`src/content/docs/en/*.md`

路由规则（省略域名部分）：

- 中文：`/zh/docs/<slug>/`
- 英文：`/en/docs/<slug>/`

> `slug` 默认是「文件名去掉 `.md`」，也可以在 Frontmatter 中手动指定。

### Docs 文档 Frontmatter 规范

所有文档文件都以一段 YAML Frontmatter 开头，对应 `src/content/config.ts` 中 `docs` 的 schema：

```md
---
title: "Java 概览"
order: 10
section: "服务端"
topic: "Java"
lang: "zh"
slug: "java-overview"
summary: "从宏观角度认识 Java 语言与生态。"
icon: "☕"
featured: true
toc: true
updated: 2026-02-04
---
```

- **title**：必填，文档标题。
- **order**：可选，数字越小越靠前；用于同一分类内排序。
- **section**：必填，文档所属的大类，用于 Docs 首页按分类展示。  
  - 常用中文：`"入门"`, `"服务端"`, `"数据库"`, `"算法"` 等。  
  - 常用英文：`"Getting Started"`, `"Server-side"`, `"Database"`, `"Algorithms"` 等。
- **topic**：可选，同一分类下的「主题名称」，用于首页卡片标题。
- **lang**：必填，`"zh"` 或 `"en"`，必须与所在子目录一致。
- **slug**：可选，最终 URL 片段；不填则使用文件名。
- **summary**：可选，首页卡片上的一句话简介。
- **icon**：可选，首页卡片左侧的小图标（一般用 emoji）。
- **featured**：可选，默认 `true`。  
  - `true`：出现在 `/[lang]/docs/` 首页的卡片区域。  
  - `false`：仍然可访问、侧边栏可见，但首页不展示卡片（适合说明类文档）。
- **toc**：可选，默认 `true`，是否生成右侧目录。
- **updated**：可选，最后更新时间（`Date` 类型），建议维护。

### 新增一篇文档的推荐步骤

以新增一篇中文 Docs 为例：

1. 在 `src/content/docs/zh/` 下新增文件，例如：`java-collections-advanced.md`。
2. 写好 Frontmatter（字段按上面说明填写）：

   ```md
   ---
   title: "Java 集合进阶"
   order: 21
   section: "服务端"
   topic: "Java"
   lang: "zh"
   slug: "java-collections-advanced"
   summary: "在基础篇之上进一步深入 Java 集合高频考点。"
   icon: "📚"
   featured: true
   toc: true
   updated: 2026-02-04
   ---
   ```

3. 在 Frontmatter 下用 Markdown 撰写正文内容。
4. 本地启动开发服务器，检查路由和布局是否正常：

   ```bash
   npm run dev
   ```

   然后访问：`http://localhost:4321/zh/docs/java-collections-advanced/`

英文 Docs 步骤相同，只是：

- 文件放在 `src/content/docs/en/`
- `lang: "en"`
- `section` 使用对应的英文分类，例如 `"Server-side"`

### Docs 首页的分类与排序规则（只调字段，无需改代码）

Docs 首页实现见：`src/pages/[lang]/docs/index.astro`，它会自动读取 `docs` 集合并分组排序，规则简要如下：

- **按 section 分组**：每篇文档的 `section` 字段决定它归属哪个大类。
- **分类排序**：
  - 优先按该分类中**最小的 `order`** 排序。
  - 对于站点约定的常用分类，会再按固定顺序优先展示：  
    - 中文：`入门` → `服务端` → `数据库` → `算法`  
    - 英文：`Getting Started` → `Server-side` → `Database` → `Algorithms`
- **分类内排序**：
  - 优先按 `order` 升序；
  - 若 `order` 相同，则按 `topic` / `title` 字典序排序。
- **featured 行为**：
  - 某分类下如果存在 `featured: true` 的文档，首页卡片只展示这些文档；
  - 如果该分类下全部文档都是 `featured: false`，则展示该分类的全部文档。

因此，**新增 / 调整文档时，一般只需要改 `.md` 文件的 Frontmatter 即可**，无需动前端代码。

### 文档维护的小约定

- 文件名统一使用**小写英文 + `-` 连接**，示例：
  - `java-overview.md`
  - `java-syntax-basics.md`
  - `algorithms-leetcode-hot100-020-valid-parentheses.md`
- 对应的中英文文档，建议共享同一个 `slug`，方便在中英文间跳转。
- 大规模重构文档（重命名大量 `section` 等）时，建议开单独分支并在提交说明中写清规则。

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
