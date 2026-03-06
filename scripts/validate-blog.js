#!/usr/bin/env node
/**
 * 验证 Blog 文章格式是否符合网站要求
 * 
 * 用法：node scripts/validate-blog.js
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BLOG_DIR = '/root/.openclaw/workspace/itkdm.github.io/src/content/blog/zh';

const REQUIRED_FIELDS = ['title', 'date', 'summary', 'lang'];
const OPTIONAL_FIELDS = ['tags', 'draft', 'priority', 'cover', 'slug'];

console.log('🔍 验证 Blog 文章格式...\n');

const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
let validCount = 0;
let errorCount = 0;
const errors = [];

for (const file of files) {
  const filepath = join(BLOG_DIR, file);
  const content = readFileSync(filepath, 'utf-8');
  const fileErrors = [];
  
  // 检查第一行
  const firstLine = content.split('\n')[0];
  if (firstLine !== '---') {
    fileErrors.push(`第一行不是 '---' (实际：'${firstLine}')`);
  }
  
  // 检查 frontmatter 结束标记
  const endMatch = content.indexOf('\n---\n');
  if (endMatch <= 0) {
    fileErrors.push('缺少 frontmatter 结束标记 \'---\'');
  } else {
    const frontmatter = content.substring(4, endMatch);
    
    // 检查必需字段
    for (const field of REQUIRED_FIELDS) {
      if (!frontmatter.match(new RegExp(`^${field}:`, 'm'))) {
        fileErrors.push(`缺少必需字段：${field}`);
      }
    }
    
    // 检查 date 格式
    const dateMatch = frontmatter.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
    if (!dateMatch) {
      const dateLine = frontmatter.match(/^date:\s*(.+)$/m);
      if (dateLine) {
        fileErrors.push(`date 格式错误：${dateLine[1]} (应为 YYYY-MM-DD)`);
      }
    }
    
    // 检查 lang 值
    const langMatch = frontmatter.match(/^lang:\s*["']?(zh|en)["']?/m);
    if (!langMatch) {
      fileErrors.push('lang 字段值错误 (应为 "zh" 或 "en")');
    }
    
    // 检查 summary 是否包含 markdown 标题
    const summaryMatch = frontmatter.match(/^summary:\s*["']?(.+?)["']?\s*$/m);
    if (summaryMatch && summaryMatch[1].includes('##')) {
      fileErrors.push('summary 包含 markdown 标题标记');
    }
  }
  
  if (fileErrors.length > 0) {
    errorCount++;
    errors.push({ file, errors: fileErrors });
    console.log(`❌ ${file}`);
    fileErrors.forEach(e => console.log(`   - ${e}`));
    console.log();
  } else {
    validCount++;
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 验证完成`);
console.log(`   ✅ 通过：${validCount} 篇`);
console.log(`   ❌ 失败：${errorCount} 篇`);
console.log(`   总计：${files.length} 篇`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (errorCount > 0) {
  console.log('\n❌ 发现格式错误，请修复后再构建\n');
  process.exit(1);
} else {
  console.log('\n✅ 所有文章格式正确\n');
  process.exit(0);
}
