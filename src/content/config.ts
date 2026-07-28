import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			date: z.coerce.date(),
			tags: z.array(z.string()).default([]),
			summary: z.string(),
			slug: z.string().optional(),
			lang: z.enum(['zh', 'en']),
			cover: image().optional(),
			draft: z.boolean().default(false),
			// 优先级：数字越大越靠前，用于置顶功能。默认为 0，按时间排序
			priority: z.number().default(0),
		}),
});

const docs = defineCollection({
	type: 'content',
	schema: () =>
		z.object({
			title: z.string(),
			order: z.number().default(0),
			section: z.string(),
			// 文档主题（用于详情页左侧“主题内导航”），如：Java / Rust / MySQL
			topic: z.string().optional(),
			lang: z.enum(['zh', 'en']),
			slug: z.string().optional(),
			// 文档主题卡片用到的可选字段：图标和一句话介绍
			summary: z.string().optional(),
			icon: z.string().optional(),
			// 是否在文档首页卡片中展示，默认为 true
			featured: z.boolean().default(true),
			toc: z.boolean().default(true),
			updated: z.date().optional(),
		}),
});

const tools = defineCollection({
	type: 'content',
	schema: () =>
		z.object({
			name: z.string(),
			summary: z.string(),
			tags: z.array(z.string()).default([]),
			lang: z.enum(['zh', 'en']),
			repo: z.string().url().optional(),
			homepage: z.string(), // 支持相对路径（如 /tools/xxx.html）或完整 URL
			downloadsRef: z.string().optional(),
			badges: z.array(z.string()).optional(),
			icon: z.string().optional(),
			order: z.number().default(0),
			featured: z.boolean().default(true),
			// 优先级：数字越大越靠前，用于置顶功能。默认为 0，按 order 排序
			priority: z.number().default(0),
		}),
});

const projects = defineCollection({
	type: 'content',
	schema: () =>
		z.object({
			title: z.string(),
			summary: z.string(),
			tags: z.array(z.string()).default([]),
			lang: z.enum(['zh', 'en']),
			slug: z.string().optional(),
			repo: z.string().url(),
			demo: z.string().url().optional(),
			icon: z.string().optional(),
			order: z.number().default(0),
			featured: z.boolean().default(true),
		}),
});

export const collections = { blog, docs, tools, projects };
