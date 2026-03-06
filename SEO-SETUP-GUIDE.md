# 搜索引擎收录配置指南

## 📊 当前状态检查

### ✅ 已配置

| 项目 | 状态 | 说明 |
|------|------|------|
| robots.txt | ✅ 已配置 | 允许所有搜索引擎抓取 |
| sitemap.xml | ✅ 已生成 | 包含所有页面，自动更新 |
| GitHub Pages | ✅ 已部署 | https://itkdm.com |
| 百度推送脚本 | ✅ 已集成 | 构建后自动推送（需配置 Token） |
| 结构化数据 | ✅ 已配置 | Astro 自动生成 |

### ⚠️ 待配置

| 项目 | 状态 | 说明 |
|------|------|------|
| 百度搜索资源平台 | ⏳ 待验证 | 需要添加验证文件 |
| Google Search Console | ⏳ 待验证 | 需要添加验证文件 |
| Bing Webmaster Tools | ⏳ 待验证 | 需要添加验证文件 |
| 百度推送 Token | ⏳ 未设置 | 需要在 GitHub Secrets 配置 |

---

## 🔧 配置步骤

### 一、百度搜索资源平台

#### 1. 验证网站所有权

**步骤：**
1. 访问 https://ziyuan.baidu.com/
2. 登录百度账号
3. 点击「添加网站」
4. 输入网站地址：`https://itkdm.com`
5. 选择验证方式（推荐「文件验证」）
6. 下载验证文件（如：`baidu_verify_xxxxx.html`）
7. 将验证文件放入 `public/` 目录
8. 提交并等待验证

**操作：**
```bash
# 将百度验证文件放入 public 目录
cp ~/Downloads/baidu_verify_*.html /root/.openclaw/workspace/itkdm.github.io/public/

# 提交并推送
cd /root/.openclaw/workspace/itkdm.github.io
git add public/baidu_verify_*.html
git commit -m "chore: 添加百度搜索资源平台验证文件"
git push
```

#### 2. 提交 Sitemap

**步骤：**
1. 进入百度搜索资源平台
2. 选择你的网站
3. 点击「普通收录」→「Sitemap」
4. 输入 Sitemap 地址：`https://itkdm.com/sitemap.xml`
5. 点击「添加」

#### 3. 配置主动推送（API）

**获取 Token：**
1. 进入百度搜索资源平台
2. 选择你的网站
3. 点击「普通收录」→「API 提交」
4. 复制 Token（如：`xxxxxx`）

**配置 GitHub Secrets：**
1. 访问 https://github.com/itkdm/itkdm.github.io/settings/secrets/actions
2. 点击「New repository secret」
3. 添加以下 Secrets：

| Name | Value |
|------|-------|
| `BAIDU_PUSH_TOKEN` | 你的百度 Token |
| `BAIDU_PUSH_SITE` | `https://itkdm.com` |

**验证配置：**
```bash
# 查看当前构建日志中的百度推送状态
tail -20 /root/.openclaw/workspace/itkdm.github.io/build.log
```

---

### 二、Google Search Console

#### 1. 验证网站所有权

**步骤：**
1. 访问 https://search.google.com/search-console
2. 登录 Google 账号
3. 点击「添加资源」
4. 选择「URL 前缀」方式
5. 输入：`https://itkdm.com`
6. 选择验证方式（推荐「HTML 文件上传」）
7. 下载验证文件（如：`googlexxxxxx.html`）
8. 将验证文件放入 `public/` 目录
9. 点击「验证」

**操作：**
```bash
# 将 Google 验证文件放入 public 目录
cp ~/Downloads/google*.html /root/.openclaw/workspace/itkdm.github.io/public/

# 提交并推送
cd /root/.openclaw/workspace/itkdm.github.io
git add public/google*.html
git commit -m "chore: 添加 Google Search Console 验证文件"
git push
```

#### 2. 提交 Sitemap

**步骤：**
1. 进入 Google Search Console
2. 选择你的网站
3. 点击左侧「Sitemap」
4. 输入：`sitemap.xml`
5. 点击「提交」

**完整 URL：** `https://itkdm.com/sitemap.xml`

#### 3. 请求索引

**步骤：**
1. 在 Google Search Console 顶部搜索栏输入你的网址
2. 点击「请求编入索引」
3. 等待 Google 抓取（通常几小时到几天）

---

### 三、Bing Webmaster Tools

#### 1. 验证网站所有权

**步骤：**
1. 访问 https://www.bing.com/webmasters
2. 登录 Microsoft 账号
3. 点击「添加网站」
4. 输入：`https://itkdm.com`
5. 选择验证方式（推荐「上传 XML 文件」）
6. 下载验证文件（如：`BingSiteAuth.xml`）
7. 将验证文件放入 `public/` 目录
8. 点击「验证」

**操作：**
```bash
# 将 Bing 验证文件放入 public 目录
cp ~/Downloads/BingSiteAuth.xml /root/.openclaw/workspace/itkdm.github.io/public/

# 提交并推送
cd /root/.openclaw/workspace/itkdm.github.io
git add public/BingSiteAuth.xml
git commit -m "chore: 添加 Bing Webmaster Tools 验证文件"
git push
```

#### 2. 提交 Sitemap

**步骤：**
1. 进入 Bing Webmaster Tools
2. 选择你的网站
3. 点击「Sitemaps」
4. 点击「Add Sitemap」
5. 输入：`https://itkdm.com/sitemap.xml`
6. 点击「Submit」

---

## 📈 收录监控

### 百度收录查询

```bash
# 使用 site: 命令查询百度收录
curl "https://www.baidu.com/s?wd=site:itkdm.com" | grep -oP '找到相关结果约\K[\d,]+'
```

**在线查询：**
- https://www.baidu.com/s?wd=site:itkdm.com

### Google 收录查询

**在线查询：**
- https://www.google.com/search?q=site:itkdm.com

### Bing 收录查询

**在线查询：**
- https://www.bing.com/search?q=site:itkdm.com

---

## 🚀 自动推送流程

### 当前配置

```yaml
# GitHub Actions 自动触发
构建完成 → postbuild 脚本 → 百度 API 推送 → 完成
```

### 推送逻辑

```javascript
// scripts/push-baidu.mjs
// 从 sitemap.xml 提取所有 URL
// 批量推送到百度 API
// 每次构建自动执行
```

### 推送限制

- **百度 API：** 每日最多推送 10,000 条 URL
- **推送频率：** 建议每次构建后推送一次
- **推送内容：** 新增和更新的页面

---

## ✅ 检查清单

### 基础配置
- [ ] robots.txt 可访问：https://itkdm.com/robots.txt
- [ ] sitemap.xml 可访问：https://itkdm.com/sitemap.xml
- [ ] 网站可正常访问：https://itkdm.com

### 百度搜索资源平台
- [ ] 网站已验证
- [ ] Sitemap 已提交
- [ ] BAIDU_PUSH_TOKEN 已配置
- [ ] 构建日志显示推送成功

### Google Search Console
- [ ] 网站已验证
- [ ] Sitemap 已提交
- [ ] 已请求重要页面索引

### Bing Webmaster Tools
- [ ] 网站已验证
- [ ] Sitemap 已提交

---

## 📝 常见问题

### Q: 百度推送显示「未设置 BAIDU_PUSH_TOKEN」
**A:** 在 GitHub Secrets 中添加 `BAIDU_PUSH_TOKEN`，然后重新触发构建。

### Q: 验证文件上传后无法验证
**A:** 
1. 检查文件是否在 `public/` 目录
2. 确认 GitHub Actions 构建完成
3. 清除浏览器缓存后重试
4. 访问 `https://itkdm.com/验证文件名.html` 确认文件可访问

### Q: Sitemap 提交后显示「无法读取」
**A:** 
1. 检查 `https://itkdm.com/sitemap.xml` 是否可访问
2. 确认 sitemap.xml 格式正确
3. 等待几分钟后重试

### Q: 收录速度慢
**A:** 
1. 确保内容质量高、原创
2. 定期更新内容
3. 使用主动推送 API
4. 添加外部链接（友链、社交媒体等）
5. 提交到导航站、目录站

---

## 🔗 相关链接

- [百度搜索资源平台](https://ziyuan.baidu.com/)
- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Sitemap 协议规范](https://www.sitemaps.org/protocol.html)
- [robots.txt 规范](https://developers.google.com/search/docs/crawling-indexing/robots/intro)

---

**最后更新：** 2026-03-06
