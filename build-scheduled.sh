#!/bin/bash
# 博客构建脚本 - 凌晨 3 点执行

cd /root/.openclaw/workspace/itkdm.github.io

echo "🚀 开始安装依赖..."
npm install --prefer-offline --no-audit

echo "🔨 开始构建网站..."
npm run build

echo "✅ 构建完成！"
