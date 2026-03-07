#!/bin/bash

# 文档重组脚本
# 功能：根据 section/topic 创建文件夹结构，移动文件，确保 slug 字段

cd /root/.openclaw/workspace/itkdm.github.io/src/content/docs/zh

echo "🔍 分析文档结构..."

# 创建文件夹结构
mkdir -p "入门"
mkdir -p "服务端/Java"
mkdir -p "服务端/Python"
mkdir -p "服务端/Go"
mkdir -p "服务端/Rust"
mkdir -p "数据库/MySQL"
mkdir -p "数据库/PostgreSQL"
mkdir -p "数据库/Redis"
mkdir -p "中间件/MessageQueue"
mkdir -p "算法/LeetCode"
mkdir -p "面试/Java 基础"
mkdir -p "面试/Java 集合"
mkdir -p "AI"
mkdir -p "LangChain AI"

echo "📁 文件夹结构创建完成"

# 函数：为文件添加 slug 字段（如果没有）
add_slug_if_missing() {
    local file="$1"
    local slug="$2"
    
    if ! head -15 "$file" | grep -q "^slug:"; then
        # 在 title 后添加 slug
        sed -i "/^title:/a slug: \"$slug\"" "$file"
        echo "  ✓ 添加 slug: $slug"
    fi
}

echo ""
echo "📝 处理 入门 分类..."
# 入门分类
if [ -f "intro.md" ]; then
    add_slug_if_missing "intro.md" "intro"
    mv "intro.md" "入门/" 2>/dev/null || true
fi

echo ""
echo "📝 处理 AI 分类..."
# AI 分类
for f in ai-*.md; do
    [ -f "$f" ] && mv "$f" "AI/" 2>/dev/null
done

echo ""
echo "📝 处理 LangChain AI 分类..."
# LangChain AI 分类
for f in langchain*.md langgraph*.md langsmith*.md; do
    [ -f "$f" ] && mv "$f" "LangChain AI/" 2>/dev/null
done

echo ""
echo "📝 处理 服务端/Java 分类..."
# Java 分类
for f in java-*.md; do
    [ -f "$f" ] && mv "$f" "服务端/Java/" 2>/dev/null
done

echo ""
echo "📝 处理 服务端/Python 分类..."
# Python 分类
if [ -f "python-overview.md" ]; then
    add_slug_if_missing "python-overview.md" "python-overview"
    mv "python-overview.md" "服务端/Python/" 2>/dev/null || true
fi

echo ""
echo "📝 处理 服务端/Go 分类..."
# Go 分类
if [ -f "go-overview.md" ]; then
    add_slug_if_missing "go-overview.md" "go-overview"
    mv "go-overview.md" "服务端/Go/" 2>/dev/null || true
fi

echo ""
echo "📝 处理 服务端/Rust 分类..."
# Rust 分类
if [ -f "rust-overview.md" ]; then
    add_slug_if_missing "rust-overview.md" "rust-overview"
    mv "rust-overview.md" "服务端/Rust/" 2>/dev/null || true
fi

echo ""
echo "📝 处理 数据库/MySQL 分类..."
# MySQL 分类
if [ -f "mysql-overview.md" ]; then
    add_slug_if_missing "mysql-overview.md" "mysql-overview"
    mv "mysql-overview.md" "数据库/MySQL/" 2>/dev/null || true
fi

echo ""
echo "📝 处理 数据库/PostgreSQL 分类..."
# PostgreSQL 分类
if [ -f "postgresql-overview.md" ]; then
    add_slug_if_missing "postgresql-overview.md" "postgresql-overview"
    mv "postgresql-overview.md" "数据库/PostgreSQL/" 2>/dev/null || true
fi

echo ""
echo "📝 处理 数据库/Redis 分类..."
# Redis 分类
if [ -f "redis-overview.md" ]; then
    add_slug_if_missing "redis-overview.md" "redis-overview"
    mv "redis-overview.md" "数据库/Redis/" 2>/dev/null || true
fi

echo ""
echo "📝 处理 中间件/MessageQueue 分类..."
# MessageQueue 分类
for f in middleware-message-queue*.md; do
    [ -f "$f" ] && mv "$f" "中间件/MessageQueue/" 2>/dev/null
done

echo ""
echo "📝 处理 算法/LeetCode 分类..."
# LeetCode 分类
for f in algorithms-leetcode*.md; do
    [ -f "$f" ] && mv "$f" "算法/LeetCode/" 2>/dev/null
done

echo ""
echo "📝 处理 面试/Java 基础 分类..."
# Java 基础面试
for f in interview-java-basics*.md; do
    [ -f "$f" ] && mv "$f" "面试/Java 基础/" 2>/dev/null
done

echo ""
echo "📝 处理 面试/Java 集合 分类..."
# Java 集合面试
for f in interview-java-collections*.md; do
    [ -f "$f" ] && mv "$f" "面试/Java 集合/" 2>/dev/null
done

echo ""
echo "📝 处理 面试/实战 分类..."
# 实战面试
if [ -f "interview-real-world-overview.md" ]; then
    add_slug_if_missing "interview-real-world-overview.md" "interview-real-world-overview"
    mv "interview-real-world-overview.md" "面试/" 2>/dev/null || true
fi

echo ""
echo "✅ 文档重组完成！"
echo ""
echo "📊 最终文件夹结构："
tree -L 2 --dirsfirst -C
