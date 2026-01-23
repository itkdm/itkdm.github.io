import fs from 'fs';
import path from 'path';
import http from 'http';

// 百度主动推送接口（来自用户提供的配置）
// 说明文档：https://ziyuan.baidu.com/linksubmit/index
const BAIDU_PUSH_URL =
	'http://data.zz.baidu.com/urls?site=https://www.itkdm.com&token=mvYi4iIQNvhCVpCc';

/**
 * 调用百度主动推送 API
 * @param {string[]} urls 要推送的完整 URL 列表
 */
function pushToBaidu(urls) {
	return new Promise((resolve, reject) => {
		if (!urls.length) {
			console.log('[baidu-push] 没有可推送的 URL，跳过。');
			return resolve();
		}

		console.log(
			`[baidu-push] 准备向百度推送 ${urls.length} 个 URL（来自 sitemap.xml）...`
		);

		const body = urls.join('\n');
		const url = new URL(BAIDU_PUSH_URL);

		const options = {
			hostname: url.hostname,
			path: url.pathname + url.search,
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
				'Content-Length': Buffer.byteLength(body),
			},
		};

		const req = http.request(options, (res) => {
			let data = '';
			res.on('data', (chunk) => {
				data += chunk;
			});
			res.on('end', () => {
				console.log(
					`[baidu-push] 百度返回状态码: ${res.statusCode}, 响应: ${data}`
				);
				resolve();
			});
		});

		req.on('error', (err) => {
			console.error('[baidu-push] 推送到百度失败：', err.message);
			// 不让整个构建失败，只是提示错误
			resolve();
		});

		req.write(body);
		req.end();
	});
}

async function main() {
	try {
		const sitemapPath = path.join(process.cwd(), 'dist', 'sitemap.xml');

		if (!fs.existsSync(sitemapPath)) {
			console.warn(
				`[baidu-push] 未找到 sitemap 文件：${sitemapPath}，跳过百度推送。`
			);
			return;
		}

		const xml = fs.readFileSync(sitemapPath, 'utf8');
		const locMatches = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g));
		const urls = locMatches.map((m) => m[1]).filter(Boolean);

		if (!urls.length) {
			console.warn('[baidu-push] 在 sitemap.xml 中没有解析到任何 <loc> URL。');
			return;
		}

		await pushToBaidu(urls);
	} catch (err) {
		console.error('[baidu-push] 执行过程中出错：', err);
		// 不抛出，让构建继续完成
	}
}

// 直接执行
main();

