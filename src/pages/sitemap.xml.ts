import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

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

	const urls: { loc: string; lastmod?: string }[] = [
		...staticPaths.map((path) => ({ loc: new URL(path, site).href })),
		...blog.map((post) => {
			const postSlug = post.data.slug ?? post.slug;
			return {
				loc: `${site}/${post.data.lang}/blog/${postSlug}/`,
				lastmod: post.data.date.toISOString(),
			};
		}),
		...docs.map((doc) => {
			const docSlug = doc.data.slug ?? doc.slug;
			return {
				loc: `${site}/${doc.data.lang}/docs/${docSlug}/`,
				lastmod: (doc.data.updated ?? new Date()).toISOString(),
			};
		}),
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
