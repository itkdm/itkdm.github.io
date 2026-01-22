import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import matter from 'gray-matter';

const token = process.env.GITHUB_TOKEN;
const outFile = path.resolve(process.cwd(), 'src/generated/releases.json');
const downloadsDir = path.resolve(process.cwd(), 'src/content/downloads');

// 加载所有下载项（从 Markdown 文件）
function loadDownloads() {
	const downloadItems = [];
	
	// 遍历所有语言目录
	const langDirs = ['zh', 'en'];
	
	for (const lang of langDirs) {
		const langDir = path.join(downloadsDir, lang);
		
		if (!fs.existsSync(langDir)) {
			continue;
		}
		
		const files = fs.readdirSync(langDir).filter((file) => file.endsWith('.md'));
		
		for (const file of files) {
			const filePath = path.join(langDir, file);
			const fileContent = fs.readFileSync(filePath, 'utf-8');
			const { data, content } = matter(fileContent);
			
			// 确保 lang 字段正确
			if (data.lang !== lang) {
				console.warn(`Warning: ${filePath} has lang="${data.lang}" but is in ${lang}/ directory`);
				continue;
			}
			
			// 使用 slug 或文件名作为 id
			const id = data.slug || path.basename(file, '.md');
			
			downloadItems.push({
				id,
				lang,
				...data,
			});
		}
	}
	
	return downloadItems;
}

/**
 * 带超时和重试的 HTTP 请求函数
 * @param {string} url 请求 URL
 * @param {number} timeout 超时时间（毫秒），默认 30000
 * @param {number} maxRetries 最大重试次数，默认 1
 * @returns {Promise<any>} 解析后的 JSON 数据
 */
function requestJson(url, timeout = 30000, maxRetries = 1) {
	return new Promise((resolve, reject) => {
		let retries = 0;
		let timeoutId = null;
		
		const makeRequest = () => {
			// 清除之前的超时定时器
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			
			const req = https.request(
				url,
				{
					headers: token
						? {
								Authorization: `Bearer ${token}`,
								'User-Agent': 'astro-download-center',
						  }
						: { 'User-Agent': 'astro-download-center' },
					timeout: timeout,
				},
				(res) => {
					// 清除超时定时器
					if (timeoutId) {
						clearTimeout(timeoutId);
						timeoutId = null;
					}
					
					// 检查状态码
					if (res.statusCode < 200 || res.statusCode >= 300) {
						// 如果是 404，直接返回 null（仓库可能不存在），不重试
						if (res.statusCode === 404) {
							resolve(null);
							return;
						}
						
						// 如果是 403 或 429（速率限制），可以重试
						if ((res.statusCode === 403 || res.statusCode === 429) && retries < maxRetries) {
							retries++;
							console.warn(`Rate limit or forbidden (${res.statusCode}), retrying... (${retries}/${maxRetries})`);
							setTimeout(makeRequest, 3000 * retries); // 指数退避
							return;
						}
						
						// 其他错误，不重试
						const error = new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
						error.statusCode = res.statusCode;
						reject(error);
						return;
					}
					
					let data = '';
					res.on('data', (chunk) => (data += chunk));
					res.on('end', () => {
						try {
							resolve(JSON.parse(data));
						} catch (err) {
							reject(new Error(`Failed to parse JSON: ${err.message}`));
						}
					});
				}
			);
			
			req.on('error', (err) => {
				// 清除超时定时器
				if (timeoutId) {
					clearTimeout(timeoutId);
					timeoutId = null;
				}
				
				// 网络错误可以重试
				if (retries < maxRetries) {
					retries++;
					console.warn(`Network error, retrying... (${retries}/${maxRetries}): ${err.message}`);
					setTimeout(makeRequest, 3000 * retries);
				} else {
					reject(err);
				}
			});
			
			// 设置超时（使用 setTimeout 而不是 req.setTimeout，更可靠）
			timeoutId = setTimeout(() => {
				req.destroy();
				timeoutId = null;
				
				if (retries < maxRetries) {
					retries++;
					console.warn(`Request timeout, retrying... (${retries}/${maxRetries})`);
					setTimeout(makeRequest, 3000 * retries);
				} else {
					reject(new Error(`Request timeout after ${timeout}ms`));
				}
			}, timeout);
			
			req.end();
		};
		
		makeRequest();
	});
}

/**
 * 获取 GitHub Release 信息
 * @param {string} repo 仓库名称（格式：owner/repo）
 * @param {string} channel 发布渠道
 * @param {string} preferAssetsRegex 优先匹配的资产文件名正则
 * @returns {Promise<Object|null>} Release 信息或 null
 */
async function fetchGitHubRelease(repo, channel = 'stable', preferAssetsRegex) {
	try {
		// 验证 repo 格式
		if (!repo || typeof repo !== 'string' || !repo.includes('/')) {
			console.warn(`Invalid repo format: ${repo}`);
			return null;
		}
		
		const releases = await requestJson(`https://api.github.com/repos/${repo}/releases?per_page=5`);
		
		// 如果返回 null（404），说明仓库不存在或没有 releases
		if (releases === null) {
			console.warn(`Repository not found or has no releases: ${repo}`);
			return null;
		}
		
		if (!Array.isArray(releases) || releases.length === 0) {
			return null;
		}
		
		const latest = releases[0];
		
		// 验证必要字段
		if (!latest || !latest.tag_name) {
			console.warn(`Invalid release data for ${repo}`);
			return null;
		}
		
		// 过滤和排序资产
		let assets = (latest.assets || []).map((a) => ({
			name: a.name || 'unknown',
			downloadUrl: a.browser_download_url || '',
			size: a.size || 0,
			type: 'github',
		})).filter((a) => a.downloadUrl); // 过滤掉无效的资产
		
		// 如果指定了优先匹配的正则，优先显示匹配的资产
		if (preferAssetsRegex) {
			try {
				const regex = new RegExp(preferAssetsRegex);
				const preferred = assets.filter((a) => regex.test(a.name));
				const others = assets.filter((a) => !regex.test(a.name));
				assets = [...preferred, ...others];
			} catch (regexErr) {
				console.warn(`Invalid regex pattern for ${repo}: ${preferAssetsRegex}`, regexErr.message);
			}
		}
		
		return {
			version: latest.tag_name,
			publishedAt: latest.published_at || new Date().toISOString(),
			notes: latest.body || '',
			assets,
			history: releases.slice(1).map((r) => ({
				version: r.tag_name || 'unknown',
				publishedAt: r.published_at || new Date().toISOString(),
				assets: (r.assets || []).map((a) => ({
					name: a.name || 'unknown',
					downloadUrl: a.browser_download_url || '',
					size: a.size || 0,
					type: 'github',
				})).filter((a) => a.downloadUrl),
			})),
		};
	} catch (err) {
		console.warn(`Failed to fetch GitHub release for ${repo}:`, err.message);
		return null;
	}
}

/**
 * 主函数：获取所有下载项并生成 releases.json
 */
async function fetchReleases() {
	try {
		console.log('Loading download items from Markdown files...');
		const downloadItems = loadDownloads();
		console.log(`Found ${downloadItems.length} download items`);
		
		const tools = [];
		const errors = [];
		
		// 按 id 分组，合并不同语言的版本
		const itemsBySlug = new Map();
		
		// 先按语言排序，中文优先，确保先处理中文版本
		const sortedItems = downloadItems.sort((a, b) => {
			if (a.lang === 'zh' && b.lang !== 'zh') return -1;
			if (a.lang !== 'zh' && b.lang === 'zh') return 1;
			return 0;
		});
		
		for (const item of sortedItems) {
			try {
				const slug = item.slug || item.id;
				
				if (!itemsBySlug.has(slug)) {
					itemsBySlug.set(slug, {
						id: slug,
						name: item.name,
						nameEn: item.nameEn,
						description: item.description,
						descriptionEn: item.descriptionEn,
						icon: item.icon,
						platform: item.platform,
						order: item.order ?? 9999,
						sources: [],
						processedSources: new Set(), // 用于去重
					});
				}
				
				const tool = itemsBySlug.get(slug);
				
				// 只处理第一个语言的 sources（优先中文），避免重复
				const isFirstLang = item.lang === 'zh' || tool.sources.length === 0;
				
				if (isFirstLang) {
					// 处理每个下载源
					for (const source of item.sources || []) {
						try {
							if (source.type === 'github') {
								// 从 GitHub 获取发布信息（根据 repo+channel 去重）
								const key = `github:${source.repo}:${source.channel || 'stable'}`;
								if (!tool.processedSources.has(key)) {
									const release = await fetchGitHubRelease(
										source.repo,
										source.channel,
										source.preferAssetsRegex
									);
									
									if (release) {
										tool.sources.push({
											type: 'github',
											repo: source.repo,
											channel: source.channel || 'stable',
											showSha256: source.showSha256 || false,
											latest: {
												version: release.version,
												publishedAt: release.publishedAt,
												notes: release.notes,
												assets: release.assets,
											},
											history: release.history || [],
										});
										tool.processedSources.add(key);
									}
								}
							} else {
								// 直接链接、网盘等其他类型，根据 URL 去重
								const key = `${source.type}:${source.url}`;
								if (!tool.processedSources.has(key)) {
									// 验证必要字段
									if (!source.url) {
										console.warn(`Missing URL for source in ${slug}`);
										continue;
									}
									
									tool.sources.push({
										type: source.type,
										name: source.name,
										url: source.url,
										code: source.code,
										size: source.size,
										platform: source.platform,
										arch: source.arch,
									});
									tool.processedSources.add(key);
								}
							}
						} catch (sourceErr) {
							errors.push(`Error processing source for ${slug}: ${sourceErr.message}`);
							console.warn(`Error processing source for ${slug}:`, sourceErr.message);
							// 继续处理其他源
						}
					}
				}
			} catch (itemErr) {
				errors.push(`Error processing item ${item.id || 'unknown'}: ${itemErr.message}`);
				console.warn(`Error processing item ${item.id || 'unknown'}:`, itemErr.message);
				// 继续处理其他项
			}
		}
		
		// 转换为数组并按 order 排序
		for (const tool of itemsBySlug.values()) {
			// 删除临时的 processedSources
			delete tool.processedSources;
			
			if (tool.sources.length > 0) {
				tools.push(tool);
			}
		}
		
		tools.sort((a, b) => a.order - b.order);

		const payload = {
			updatedAt: new Date().toISOString(),
			tools,
		};

		// 确保目录存在
		fs.mkdirSync(path.dirname(outFile), { recursive: true });
		
		// 写入文件
		fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
		
		console.log(`✓ Successfully wrote ${tools.length} download items to ${outFile}`);
		
		if (errors.length > 0) {
			console.warn(`\n⚠ ${errors.length} error(s) occurred during processing:`);
			errors.forEach((err) => console.warn(`  - ${err}`));
			console.warn('\nThe build will continue, but some items may be missing.\n');
		}
		
		return true;
	} catch (err) {
		console.error('Fatal error in fetchReleases:', err);
		process.exit(1);
	}
}

// 执行主函数
fetchReleases().catch((err) => {
	console.error('Unhandled error:', err);
	process.exit(1);
});
