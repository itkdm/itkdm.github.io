#!/usr/bin/env node
/**
 * 检查网站搜索引擎收录配置
 * 
 * 用法：node scripts/check-seo-setup.js
 */

import https from 'https';
import http from 'http';

const SITE_URL = 'https://itkdm.com';

const checks = [
  {
    name: '网站可访问性',
    url: SITE_URL,
    expected: 200,
    description: '网站主页应能正常访问'
  },
  {
    name: 'robots.txt',
    url: `${SITE_URL}/robots.txt`,
    expected: 200,
    description: 'robots.txt 应可访问且包含 Sitemap 引用'
  },
  {
    name: 'sitemap.xml',
    url: `${SITE_URL}/sitemap.xml`,
    expected: 200,
    description: 'sitemap.xml 应可访问且包含有效 URL'
  },
  {
    name: '中文博客页面',
    url: `${SITE_URL}/zh/blog/`,
    expected: 200,
    description: '中文博客列表页应可访问'
  },
  {
    name: '英文博客页面',
    url: `${SITE_URL}/en/blog/`,
    expected: 200,
    description: '英文博客列表页应可访问'
  },
  {
    name: '文档中心',
    url: `${SITE_URL}/zh/docs/`,
    expected: 200,
    description: '文档中心应可访问'
  },
];

const verificationFiles = [
  {
    name: '百度验证文件',
    pattern: /baidu_verify_.*\.html/,
    description: '百度搜索资源平台验证文件'
  },
  {
    name: 'Google 验证文件',
    pattern: /google.*\.html/,
    description: 'Google Search Console 验证文件'
  },
  {
    name: 'Bing 验证文件',
    pattern: /BingSiteAuth\.xml/,
    description: 'Bing Webmaster Tools 验证文件'
  }
];

/**
 * 检查 URL 是否可访问
 */
function checkUrl(url, expectedStatus) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const timeout = setTimeout(() => {
      resolve({ status: 'timeout', error: '请求超时' });
    }, 10000);
    
    protocol.get(url, (res) => {
      clearTimeout(timeout);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          success: res.statusCode === expectedStatus,
          content: data,
          contentType: res.headers['content-type']
        });
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      resolve({ status: 'error', error: err.message });
    });
  });
}

/**
 * 检查 sitemap.xml 内容
 */
function checkSitemap(content) {
  const urlMatches = content.match(/<loc>([^<]+)<\/loc>/g);
  const urlCount = urlMatches ? urlMatches.length : 0;
  
  const hasLastmod = content.includes('<lastmod>');
  const hasXmlDecl = content.startsWith('<?xml');
  
  return {
    urlCount,
    hasLastmod,
    hasXmlDecl,
    isValid: urlCount > 0 && hasXmlDecl
  };
}

/**
 * 检查 robots.txt 内容
 */
function checkRobotsTxt(content) {
  const hasSitemap = content.includes('Sitemap:');
  const hasAllowAll = content.includes('Allow: /') || !content.includes('Disallow:');
  
  return {
    hasSitemap,
    hasAllowAll,
    isValid: hasSitemap && hasAllowAll
  };
}

/**
 * 主检查函数
 */
async function main() {
  console.log('🔍 检查搜索引擎收录配置...\n');
  console.log(`网站：${SITE_URL}\n`);
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  // 检查基础 URL
  for (const check of checks) {
    process.stdout.write(`检查：${check.name}... `);
    
    const result = await checkUrl(check.url, check.expected);
    
    if (result.success) {
      console.log('✅ 通过');
      passed++;
      
      // 额外检查内容
      if (check.name === 'robots.txt' && result.content) {
        const robotsCheck = checkRobotsTxt(result.content);
        if (!robotsCheck.isValid) {
          console.log(`   ⚠️  警告：robots.txt 配置可能不完整`);
          if (!robotsCheck.hasSitemap) console.log(`      - 缺少 Sitemap 引用`);
          if (!robotsCheck.hasAllowAll) console.log(`      - 可能有不必要的 Disallow 规则`);
        } else {
          console.log(`   ✓ robots.txt 配置正确`);
        }
      }
      
      if (check.name === 'sitemap.xml' && result.content) {
        const sitemapCheck = checkSitemap(result.content);
        if (!sitemapCheck.isValid) {
          console.log(`   ⚠️  警告：sitemap.xml 可能无效`);
        } else {
          console.log(`   ✓ sitemap.xml 包含 ${sitemapCheck.urlCount} 个 URL`);
          if (sitemapCheck.hasLastmod) {
            console.log(`   ✓ 包含 lastmod 字段（有助于搜索引擎判断更新）`);
          }
        }
      }
      
      results.push({ name: check.name, status: 'pass' });
    } else {
      console.log('❌ 失败');
      console.log(`   预期状态码：${check.expected}`);
      console.log(`   实际状态码：${result.status}`);
      if (result.error) console.log(`   错误：${result.error}`);
      failed++;
      results.push({ name: check.name, status: 'fail', error: result.error || result.status });
    }
  }
  
  // 检查验证文件（可选）
  console.log('\n📋 检查搜索引擎验证文件（可选）...\n');
  
  const publicDir = '/root/.openclaw/workspace/itkdm.github.io/public/';
  import('fs').then(({ readFileSync, readdirSync }) => {
    try {
      const files = readdirSync(publicDir);
      
      for (const vf of verificationFiles) {
        const found = files.filter(f => vf.pattern.test(f));
        if (found.length > 0) {
          console.log(`✅ ${vf.name}: 已配置 (${found.join(', ')})`);
        } else {
          console.log(`⏳ ${vf.name}: 未配置 - ${vf.description}`);
        }
      }
    } catch (err) {
      console.log('⚠️  无法读取 public 目录');
    }
    
    // 总结
    console.log('\n' + '━'.repeat(50));
    console.log('📊 检查完成');
    console.log(`   ✅ 通过：${passed} 项`);
    console.log(`   ❌ 失败：${failed} 项`);
    console.log(`   总计：${checks.length} 项`);
    console.log('━'.repeat(50));
    
    if (failed === 0) {
      console.log('\n✅ 所有基础检查通过！\n');
      console.log('下一步：');
      console.log('1. 配置百度搜索资源平台验证文件');
      console.log('2. 配置 Google Search Console 验证文件');
      console.log('3. 配置 Bing Webmaster Tools 验证文件');
      console.log('4. 在 GitHub Secrets 添加 BAIDU_PUSH_TOKEN\n');
      console.log('详细配置指南：SEO-SETUP-GUIDE.md\n');
    } else {
      console.log('\n⚠️  发现配置问题，请先修复上述错误\n');
    }
    
    process.exit(failed > 0 ? 1 : 0);
  }).catch(() => {
    console.log('⚠️  无法检查验证文件（文件系统不可用）');
    
    // 总结
    console.log('\n' + '━'.repeat(50));
    console.log('📊 检查完成');
    console.log(`   ✅ 通过：${passed} 项`);
    console.log(`   ❌ 失败：${failed} 项`);
    console.log(`   总计：${checks.length} 项`);
    console.log('━'.repeat(50));
    
    process.exit(failed > 0 ? 1 : 0);
  });
}

main();
