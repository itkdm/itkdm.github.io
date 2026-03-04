import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const DEFAULT_BAIDU_PUSH_ENDPOINT = 'https://data.zz.baidu.com/urls';
const BAIDU_PUSH_ENDPOINT =
	process.env.BAIDU_PUSH_ENDPOINT?.trim() || DEFAULT_BAIDU_PUSH_ENDPOINT;
const BAIDU_PUSH_SITE = process.env.BAIDU_PUSH_SITE?.trim();
const BAIDU_PUSH_TOKEN = process.env.BAIDU_PUSH_TOKEN?.trim();

/**
 * 调用百度主动推送 API
 * @param {string[]} urls 要推送的完整 URL 列表
 * @param {URL} apiUrl 推送接口 URL（已带 site 和 token 参数）
 */
function pushToBaidu(urls, apiUrl) {
	return new Promise((resolve) => {
		const body = urls.join('\n');
		const options = {
			hostname: apiUrl.hostname,
			port: apiUrl.port || 443,
			path: apiUrl.pathname + apiUrl.search,
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
				'Content-Length': Buffer.byteLength(body),
			},
		};

		const req = https.request(options, (res) => {
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

/**
 * 从 URL 列表推断站点 origin
 * @param {string[]} urls
 * @returns {string}
 */
function inferSiteFromUrls(urls) {
	try {
		return new URL(urls[0]).origin;
	} catch {
		return '';
	}
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

		const site = BAIDU_PUSH_SITE || inferSiteFromUrls(urls);
		if (!site) {
			console.warn('[baidu-push] 无法确定 site 参数，已跳过百度推送。');
			return;
		}

		if (!BAIDU_PUSH_TOKEN) {
			console.warn(
				'[baidu-push] 未设置 BAIDU_PUSH_TOKEN，已跳过百度推送（构建不受影响）。'
			);
			return;
		}

		const apiUrl = new URL(BAIDU_PUSH_ENDPOINT);
		apiUrl.searchParams.set('site', site);
		apiUrl.searchParams.set('token', BAIDU_PUSH_TOKEN);

		console.log(
			`[baidu-push] 准备向百度推送 ${urls.length} 个 URL（site=${site}）...`
		);
		await pushToBaidu(urls, apiUrl);
	} catch (err) {
		console.error('[baidu-push] 执行过程中出错：', err);
		// 不抛出，让构建继续完成
	}
}

main();

