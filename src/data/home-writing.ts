export type HomeWritingLanguage = 'zh' | 'en';

export type HomeWritingFallback = {
	title: string;
	href?: string;
};

export type HomeWritingTopic = {
	key: 'ai-agents' | 'engineering' | 'open-source' | 'product-creation';
	order: string;
	label: string;
	statement: { zh: string; en: string };
	description: { zh: string; en: string };
	selectedSlugs: Record<HomeWritingLanguage, string[]>;
	fallback: Record<HomeWritingLanguage, HomeWritingFallback[]>;
};

export const homeWritingTopics: HomeWritingTopic[] = [
	{
		key: 'ai-agents',
		order: '01',
		label: 'AI & AGENTS',
		statement: { zh: 'Agent 不应该只停留在 Demo。', en: 'Agents should not stop at the demo.' },
		description: { zh: '真正困难的是工程、上下文、工具、状态和长期演进。', en: 'The hard part is engineering, context, tools, state, and long-term evolution.' },
		selectedSlugs: {
			zh: ['agent-s-human-computer-interaction', 'ai-workflow-minimal-cost'],
			en: ['agent-s-human-computer-interaction', 'ai-workflow-minimal-cost'],
		},
		fallback: {
			zh: [],
			en: [],
		},
	},
	{
		key: 'engineering',
		order: '02',
		label: 'ENGINEERING',
		statement: { zh: '工程能力决定一个系统能不能长期演进。', en: 'Engineering determines whether a system can evolve.' },
		description: { zh: '真正重要的不只是功能能跑起来，而是结构、边界、验证和可维护性。', en: 'What matters is not only that features work, but that structure, boundaries, verification, and maintenance hold up.' },
		selectedSlugs: {
			zh: ['inventory-hint-from-zero', 'short-url-system-architecture-at-scale'],
			en: ['github-actions-deployment', 'todo-tags'],
		},
		fallback: { zh: [], en: [] },
	},
	{
		key: 'open-source',
		order: '03',
		label: 'OPEN SOURCE',
		statement: { zh: '开源不是刷记录，而是建立真实可验证的实践。', en: 'Open source is not a record of activity, but a verifiable practice.' },
		description: { zh: '好的开源经历，应该能够解释问题、方案、实现与协作过程。', en: 'Good open source work explains the problem, the solution, the implementation, and the collaboration.' },
		selectedSlugs: {
			zh: ['github-actions-deployment', 'clawbot-principles-source-guide'],
			en: ['github-actions-deployment'],
		},
		fallback: { zh: [], en: [] },
	},
	{
		key: 'product-creation',
		order: '04',
		label: 'PRODUCT & CREATION',
		statement: { zh: '产品表达和技术实现，本质上应该互相促进。', en: 'Product expression and technical implementation should strengthen each other.' },
		description: { zh: '从网站、工具到内容创作，真正有价值的是把想法持续打磨成作品。', en: 'From websites and tools to writing, the value is in shaping ideas into finished work.' },
		selectedSlugs: {
			zh: ['astro-build-static-site', 'sileme-app-valuation-analysis'],
			en: ['astro-build-static-site'],
		},
		fallback: { zh: [], en: [] },
	},
];
