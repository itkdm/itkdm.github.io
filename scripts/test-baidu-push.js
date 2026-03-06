#!/usr/bin/env node
/**
 * 测试百度主动推送
 * 
 * 用法：node scripts/test-baidu-push.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const BAIDU_PUSH_TOKEN = 'mvYi4iIQNvhCVpCc';
const BAIDU_PUSH_SITE = 'itkdm.com';  // 注意：site 参数不需要 https://
const BAIDU_PUSH_ENDPOINT = 'http://data.zz.baidu.com/urls';

console.log('🚀 测试百度主动推送...\n');
console.log(`站点：${BAIDU_PUSH_SITE}`);
console.log(`Token: ${BAIDU_PUSH_TOKEN.substring(0, 8)}...${BAIDU_PUSH_TOKEN.substring(BAIDU_PUSH_TOKEN.length - 4)}\n`);

// 读取 sitemap.xml
const sitemapPath = path.join(process.cwd(), 'dist', 'sitemap.xml');

if (!fs.existsSync(sitemapPath)) {
  console.error('❌ 未找到 sitemap.xml');
  console.error(`路径：${sitemapPath}`);
  console.error('\n请先运行：npm run build');
  process.exit(1);
}

const xml = fs.readFileSync(sitemapPath, 'utf8');
const locMatches = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g));
const urls = locMatches.map(m => m[1]).filter(Boolean);

console.log(`📊 从 sitemap.xml 提取到 ${urls.length} 个 URL\n`);

if (urls.length === 0) {
  console.error('❌ sitemap.xml 中没有找到任何 URL');
  process.exit(1);
}

// 推送 URL（限制每次最多 2000 条）
const pushUrls = urls.slice(0, 2000);
const body = pushUrls.join('\n');

console.log(`📤 准备推送 ${pushUrls.length} 个 URL 到百度...\n`);

const apiUrl = new URL(BAIDU_PUSH_ENDPOINT);
apiUrl.searchParams.set('site', BAIDU_PUSH_SITE);
apiUrl.searchParams.set('token', BAIDU_PUSH_TOKEN);

const protocol = apiUrl.protocol === 'https:' ? https : http;

const options = {
  hostname: apiUrl.hostname,
  port: apiUrl.port || 80,
  path: apiUrl.pathname + apiUrl.search,
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = protocol.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('📥 百度响应：\n');
    
    try {
      const response = JSON.parse(data);
      
      if (response.success !== undefined) {
        console.log('✅ 推送成功！');
        console.log(`   成功推送：${response.success} 条 URL`);
        if (response.remain !== undefined) {
          console.log(`   当日剩余额度：${response.remain} 条`);
        }
        if (response.not_valid !== undefined) {
          console.log(`   无效 URL: ${response.not_valid} 条`);
        }
        
        console.log('\n📋 推送的 URL 示例：');
        pushUrls.slice(0, 5).forEach(url => {
          console.log(`   - ${url}`);
        });
        if (pushUrls.length > 5) {
          console.log(`   ... 还有 ${pushUrls.length - 5} 条`);
        }
        
        console.log('\n✅ 百度主动推送配置完成！');
        console.log('\n下一步：');
        console.log('1. 在 GitHub Secrets 添加 BAIDU_PUSH_TOKEN');
        console.log('2. 在 GitHub Secrets 添加 BAIDU_PUSH_SITE');
        console.log('3. 之后每次构建会自动推送\n');
        
      } else if (response.error) {
        console.log('❌ 推送失败！');
        console.log(`   错误码：${response.error}`);
        console.log(`   错误信息：${response.message}`);
        
        if (response.error === 401) {
          console.log('\n可能原因：');
          console.log('   - Token 错误或不匹配');
          console.log('   - Site 参数不正确');
          console.log('   - Token 已过期');
          console.log('\n解决方法：');
          console.log('   1. 访问 https://ziyuan.baidu.com/');
          console.log('   2. 重新生成 Token');
          console.log('   3. 确认 Site URL 为 https://itkdm.com');
        } else if (response.error === 400) {
          console.log('\n可能原因：');
          console.log('   - 请求格式错误');
          console.log('   - URL 格式不正确');
        }
        
        console.log();
        process.exit(1);
      } else {
        console.log('⚠️  未知响应：');
        console.log(data);
        console.log();
      }
    } catch (err) {
      console.log('⚠️  响应解析失败：');
      console.log(data);
      console.log();
      console.log(err.message);
      console.log();
    }
  });
});

req.on('error', (err) => {
  console.error('❌ 推送失败：', err.message);
  console.error('\n可能原因：');
  console.error('   - 网络连接问题');
  console.error('   - 百度 API 服务不可用');
  console.error();
  process.exit(1);
});

req.write(body);
req.end();
