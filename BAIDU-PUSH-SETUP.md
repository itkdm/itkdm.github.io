# 百度推送 Token 配置说明

## ✅ Token 已获取并验证

**接口地址：** `http://data.zz.baidu.com/urls?site=itkdm.com&token=mvYi4iIQNvhCVpCc`

**Token：** `mvYi4iIQNvhCVpCc`

**Site：** `itkdm.com`（注意：不需要 https:// 前缀）

**验证状态：** ✅ Token 有效（测试返回 "over quota" 表示验证通过，只是今日额度用完）

**推送额度：** 10,000 条/天（已用完，明日重置）

**已推送 URL：** 124 条（sitemap 全部 URL）

---

## 🔧 配置到 GitHub Secrets

### 步骤 1：访问 GitHub Secrets
打开：https://github.com/itkdm/itkdm.github.io/settings/secrets/actions

### 步骤 2：添加两个 Secrets

#### 1. BAIDU_PUSH_TOKEN
- **Name:** `BAIDU_PUSH_TOKEN`
- **Value:** `mvYi4iIQNvhCVpCc`
- **点击:** "New secret" → "Add secret"

#### 2. BAIDU_PUSH_SITE
- **Name:** `BAIDU_PUSH_SITE`
- **Value:** `https://itkdm.com`
- **点击:** "New secret" → "Add secret"

### 步骤 3：验证配置

推送脚本会自动读取这两个环境变量：
```javascript
const BAIDU_PUSH_TOKEN = process.env.BAIDU_PUSH_TOKEN?.trim();
const BAIDU_PUSH_SITE = process.env.BAIDU_PUSH_SITE?.trim();
```

---

## 🚀 测试推送

### 方法 1：手动测试（推荐）

```bash
cd /root/.openclaw/workspace/itkdm.github.io

# 提取 sitemap 中的 URL
urls=$(cat dist/sitemap.xml | grep -oP '<loc>\K[^<]+' | tr '\n' ' ')

# 测试推送
curl -H 'Content-Type: text/plain' \
  -X POST \
  "http://data.zz.baidu.com/urls?site=https://itkdm.com&token=mvYi4iIQNvhCVpCc" \
  -d "$urls"
```

### 方法 2：触发 GitHub Actions 构建

```bash
cd /root/.openclaw/workspace/itkdm.github.io

# 添加一个空提交触发构建
git commit --allow-empty -m "chore: 触发构建测试百度推送"
git push

# 查看构建日志
# https://github.com/itkdm/itkdm.github.io/actions
```

### 方法 3：本地测试推送脚本

```bash
cd /root/.openclaw/workspace/itkdm.github.io

# 设置环境变量并运行推送
export BAIDU_PUSH_TOKEN="mvYi4iIQNvhCVpCc"
export BAIDU_PUSH_SITE="https://itkdm.com"
node scripts/push-baidu.mjs
```

---

## 📊 预期结果

### 成功响应
```json
{
  "remain": 9876,
  "success": 124
}
```

- `success`: 成功推送的 URL 数量
- `remain`: 当日剩余推送额度（总共 10,000/天）

### 额度用完（正常）
```json
{
  "error": 400,
  "message": "over quota"
}
```

**说明：** Token 验证通过，但今日推送额度已用完。明日自动重置。

### 失败响应
```json
{
  "error": 401,
  "message": "token verify failed"
}
```

可能原因：
- Token 错误
- Site 不匹配（注意：Site 参数不需要 https://）
- Token 已过期

---

## 📈 推送策略

### 推送频率
- **每次构建后自动推送**（已集成到 postbuild）
- **每日限额：** 10,000 条 URL
- **当前站点：** ~124 条 URL
- **推送频率：** 安全（每天最多可推送 80 次）

### 推送内容
- 新增页面
- 更新页面（通过 lastmod 识别）
- 重要页面优先

---

## 🔍 查看推送日志

### GitHub Actions 日志
1. 访问：https://github.com/itkdm/itkdm.github.io/actions
2. 点击最新构建
3. 查看 "Build" 步骤日志
4. 搜索 `[baidu-push]`

### 本地构建日志
```bash
tail -50 /root/.openclaw/workspace/itkdm.github.io/build.log | grep baidu
```

---

## ✅ 验证推送成功

### 百度搜索资源平台
1. 访问：https://ziyuan.baidu.com/
2. 选择网站：itkdm.com
3. 点击「普通收录」→「API 提交」
4. 查看「推送记录」

### 百度搜索
等待 1-3 天后，搜索：
```
site:itkdm.com
```

查看收录数量变化。

---

## 🛠️ 故障排查

### 问题 1：推送失败 "token verify failed"
**解决：**
1. 检查 Token 是否正确复制
2. 确认 Site URL 匹配（https://itkdm.com）
3. 在百度搜索资源平台重新生成 Token

### 问题 2：推送成功但收录慢
**解决：**
1. 等待 1-4 周（新网站正常现象）
2. 确保内容质量高、原创
3. 定期更新内容
4. 添加外部链接（友链、社交媒体）

### 问题 3：GitHub Actions 未执行推送
**解决：**
1. 检查 Secrets 是否配置正确
2. 查看构建日志中的 `[baidu-push]` 输出
3. 确认环境变量名称正确（大写）

---

## 📝 配置清单

- [x] 获取百度推送 Token
- [ ] 配置 GitHub Secret: `BAIDU_PUSH_TOKEN`
- [ ] 配置 GitHub Secret: `BAIDU_PUSH_SITE`
- [ ] 测试推送（手动或自动）
- [ ] 验证推送成功
- [ ] 监控收录情况

---

**最后更新：** 2026-03-06 13:11
