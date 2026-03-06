#!/bin/bash
# 算法题自动发布脚本
# 用法：./scripts/publish-algorithm.sh "题号 - 题目名称" "你的代码文件路径"

if [ -z "$1" ]; then
    echo "❌ 用法：./scripts/publish-algorithm.sh \"题号 - 题目名称\" [代码文件路径]"
    echo "例如：./scripts/publish-algorithm.sh \"136-只出现一次的数字\""
    exit 1
fi

TITLE="$1"
CODE_FILE="$2"
DOC_FILE="src/content/docs/zh/algorithms-leetcode-hot100-${TITLE}.md"

echo "📝 准备发布算法题：$TITLE"

# 检查文档是否已存在
if [ -f "$DOC_FILE" ]; then
    echo "⚠️  文档已存在：$DOC_FILE"
    read -p "是否继续提交？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 添加到 git
git add "$DOC_FILE"

# 提交
git commit -m "docs: 添加 LeetCode $TITLE 算法题"

# 自动推送（post-commit hook 会处理）
echo "✅ 提交完成，等待自动推送..."
