import type { Lang } from '../i18n/config';
import { getCollection } from 'astro:content';

export type SidebarItem = { title: string; slug: string };
export type SidebarSection = { section: string; items: SidebarItem[] };

// Build sidebar data directly from docs collection.
// Group by frontmatter `section`, sort by `order`, then by title.
export async function getSidebar(lang: Lang): Promise<SidebarSection[]> {
	const docs = await getCollection('docs', (doc) => doc.data.lang === lang);

	const sectionMap = new Map<
		string,
		{ section: string; items: (SidebarItem & { order: number })[]; order: number }
	>();

	for (const doc of docs) {
		// 规范化 section 字段：去除首尾空格，确保一致性
		const section = (doc.data.section || (lang === 'zh' ? '其他' : 'Others')).trim();
		const slug = doc.data.slug ?? doc.slug.split('/').pop() ?? doc.slug;
		const order = typeof doc.data.order === 'number' ? doc.data.order : 9999;
		const title = doc.data.title;

		if (!sectionMap.has(section)) {
			sectionMap.set(section, { section, items: [], order });
		}
		const group = sectionMap.get(section)!;
		group.items.push({ title, slug, order });
		// keep section order as the smallest order of its items
		if (order < group.order) group.order = order;
	}

	const sections = Array.from(sectionMap.values())
		.sort((a, b) => a.order - b.order || a.section.localeCompare(b.section))
		.map(({ section, items }) => ({
			section,
			items: items
				.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
				.map(({ title, slug }) => ({ title, slug })),
		}));

	return sections;
}

export async function findNextPrev(lang: Lang, currentSlug: string) {
	const sections = await getSidebar(lang);
	const flat = sections.flatMap((s) => s.items.map((i) => ({ ...i, section: s.section })));
	const idx = flat.findIndex((i) => i.slug === currentSlug);
	return {
		prev: idx > 0 ? flat[idx - 1] : undefined,
		next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : undefined,
	};
}
