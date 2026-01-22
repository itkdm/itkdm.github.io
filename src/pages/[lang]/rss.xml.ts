import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import type { Lang } from '../../i18n/config';
import { SUPPORTED_LANGS } from '../../i18n/config';
import { sortBlogPosts } from '../../lib/blog-sort';

export function getStaticPaths() {
	return SUPPORTED_LANGS.map((lang) => ({ params: { lang } }));
}

export const GET: APIRoute = async ({ params }) => {
	const lang = (params.lang as Lang) ?? 'zh';
	const posts = sortBlogPosts(
		await getCollection('blog', (entry) => entry.data.lang === lang && !entry.data.draft)
	);

	return rss({
		title: lang === 'zh' ? '布吉岛 博客 RSS' : 'Bu Ji Dao Blog RSS',
		description: lang === 'zh' ? '最新文章订阅' : 'Latest posts',
		site: 'https://itkdm.com',
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.summary,
			link: `/${lang}/blog/${post.data.slug}/`,
			pubDate: post.data.date,
		})),
	});
};
