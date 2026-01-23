import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';

const site = 'https://itkdm.com';

export const GET: APIRoute = async () => {
	const staticPaths = [
		'/',
		'/zh/',
		'/en/',
		'/zh/blog/',
		'/en/blog/',
		'/zh/blog/archive/',
		'/en/blog/archive/',
		'/zh/blog/tags/',
		'/en/blog/tags/',
		'/zh/tools/',
		'/en/tools/',
		'/zh/downloads/',
		'/en/downloads/',
		'/zh/search/',
		'/en/search/',
	];

	const blog = await getCollection('blog', (entry) => !entry.data.draft);
	const docs = await getCollection('docs');

	// 从 public/tools 目录中收集所有工具页（静态 HTML）
	const toolsDir = path.join(process.cwd(), 'public', 'tools');
	let toolUrls: { loc: string; lastmod?: string }[] = [];
	if (fs.existsSync(toolsDir)) {
		const files = fs.readdirSync(toolsDir).filter((f) => f.endsWith('.html'));
		toolUrls = files.map((file) => ({
			loc: new URL(`/tools/${file}`, site).href,
		}));
	}

	const urls: { loc: string; lastmod?: string }[] = [
		// 静态页面
		...staticPaths.map((p) => ({ loc: new URL(p, site).href })),
		// 博客文章
		...blog.map((post) => {
			const rawSlug = post.data.slug ?? post.slug;
			const postSlug = rawSlug.split('/').pop() ?? rawSlug;
			return {
				loc: `${site}/${post.data.lang}/blog/${postSlug}/`,
				lastmod: post.data.date.toISOString(),
			};
		}),
		// 文档页面
		...docs.map((doc) => {
			const rawSlug = doc.data.slug ?? doc.slug;
			const docSlug = rawSlug.split('/').pop() ?? rawSlug;
			return {
				loc: `${site}/${doc.data.lang}/docs/${docSlug}/`,
				lastmod: (doc.data.updated ?? new Date()).toISOString(),
			};
		}),
		// 工具静态页面
		...toolUrls,
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
};
