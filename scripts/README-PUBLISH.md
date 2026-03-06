# 算法题发布流程

## 🚀 自动化流程（推荐）

已配置 **git post-commit hook**，每次 commit 后自动 push 到远程仓库。

### 快速发布步骤：

1. **创建/编辑算法题文档**
   ```bash
   # 文档位置：src/content/docs/zh/algorithms-leetcode-hot100-XXX-题目名称.md
   ```

2. **提交代码**
   ```bash
   git add src/content/docs/zh/algorithms-leetcode-hot100-XXX-题目名称.md
   git commit -m "docs: 添加 LeetCode XXX-题目名称 算法题"
   ```
   
   **✅ 自动推送！** post-commit hook 会自动执行 `git push`

3. **等待 GitHub Actions 构建**
   - 访问 https://github.com/itkdm/itkdm.github.io/actions 查看构建进度
   - 通常 1-2 分钟完成

4. **刷新网站**
   - 访问 https://itkdm.com/zh/docs/
   - 如果看不到更新，按 `Ctrl+Shift+R` 强制刷新

---

## 📋 手动流程（备选）

如果自动推送失败，可以手动执行：

```bash
git add <文件>
git commit -m "docs: 添加 xxx"
git push origin master
```

---

## 🛠️ 脚本工具

可以使用自动化脚本：

```bash
cd /root/.openclaw/workspace/itkdm.github.io
./scripts/publish-algorithm.sh "题号 - 题目名称"
```

---

## ⚙️ Hook 配置

post-commit hook 位置：`.git/hooks/post-commit`

如需禁用自动推送：
```bash
mv .git/hooks/post-commit .git/hooks/post-commit.bak
```

如需恢复：
```bash
mv .git/hooks/post-commit.bak .git/hooks/post-commit
```

---

## 🔍 验证部署

1. 检查 GitHub Actions: https://github.com/itkdm/itkdm.github.io/actions
2. 访问新文章 URL: `https://itkdm.com/zh/docs/algorithms-leetcode-hot100-XXX-题目名称/`
3. 强制刷新浏览器：`Ctrl+Shift+R`
