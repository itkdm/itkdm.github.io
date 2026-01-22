export const SUPPORTED_LANGS = ['zh', 'en'] as const;

export type Lang = (typeof SUPPORTED_LANGS)[number];

export const LANG_LABELS: Record<Lang, { name: string; brandName: string; siteName: string; heroTitle: string; heroSubtitle: string }> = {
	zh: {
		name: '中文',
		brandName: '布吉岛',
		siteName: '布吉岛 · 主页',
		heroTitle: '打造统一的博客 + 文档 + 下载中心',
		heroSubtitle: 'Astro + Markdown + GitHub Pages，纯静态，多语言，可持续演进。',
	},
	en: {
		name: 'English',
		brandName: 'bujidao',
		siteName: 'Bu Ji Dao · Home',
		heroTitle: 'Blog, Docs & Downloads in one site',
		heroSubtitle: 'Astro + Markdown + GitHub Pages. Static, multilingual, and customizable.',
	},
};

export function isSupportedLang(lang: string | undefined): lang is Lang {
	return !!lang && SUPPORTED_LANGS.includes(lang as Lang);
}
