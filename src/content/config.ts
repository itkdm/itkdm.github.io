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

const downloads = defineCollection({
	type: 'content',
	schema: () =>
		z.object({
			name: z.string(), // 应用名称（中文）
			nameEn: z.string().optional(), // 应用名称（英文）
			description: z.string().optional(), // 描述（中文）
			descriptionEn: z.string().optional(), // 描述（英文）
			icon: z.string().optional(), // 图标（emoji）
			platform: z.string().optional(), // 平台，如 "Android", "iOS"
			lang: z.enum(['zh', 'en']),
			slug: z.string().optional(), // 唯一标识，如果不提供则使用文件名
			order: z.number().default(0), // 排序
			// 下载源配置数组
			sources: z.array(
				z.union([
					// GitHub Release 类型
					z.object({
						type: z.literal('github'),
						repo: z.string(), // 格式：owner/repo
						channel: z.enum(['stable', 'beta', 'alpha']).default('stable'),
						preferAssetsRegex: z.string().optional(), // 优先匹配的资产文件名正则
						showSha256: z.boolean().default(false),
					}),
					// 直接下载链接类型
					z.object({
						type: z.literal('direct'),
						name: z.string(),
						url: z.string().url(),
						size: z.number().optional(), // 文件大小（字节）
						platform: z.string().optional(), // android, ios, windows, mac, linux
						arch: z.string().optional(), // arm64, universal, x86_64
					}),
					// 百度网盘
					z.object({
						type: z.literal('baidu'),
						name: z.string(),
						url: z.string().url(),
						code: z.string().optional(), // 提取码
						platform: z.string().optional(),
						arch: z.string().optional(),
					}),
					// 夸克网盘
					z.object({
						type: z.literal('quark'),
						name: z.string(),
						url: z.string().url(),
						code: z.string().optional(),
						platform: z.string().optional(),
						arch: z.string().optional(),
					}),
					// 阿里云盘
					z.object({
						type: z.literal('aliyun'),
						name: z.string(),
						url: z.string().url(),
						code: z.string().optional(),
						platform: z.string().optional(),
						arch: z.string().optional(),
					}),
					// 其他网盘
					z.object({
						type: z.literal('other'),
						name: z.string(),
						url: z.string().url(),
						code: z.string().optional(),
						platform: z.string().optional(),
						arch: z.string().optional(),
					}),
				])
			),
		}),
});

export const collections = { blog, docs, tools, projects, downloads };
