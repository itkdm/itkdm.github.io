type HomeLanguage = 'zh' | 'en';

const site = 'https://itkdm.com';
const personId = `${site}/#person`;

export function createHomeSchema(lang: HomeLanguage) {
	const pageUrl = new URL(`/${lang}/`, site).href;

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${site}/#website`,
				url: new URL('/zh/', site).href,
				name: '布吉岛的个人网站',
				alternateName: 'Bujidao Personal Website',
				inLanguage: ['zh-CN', 'en'],
				publisher: { '@id': personId },
			},
			{
				'@type': 'Person',
				'@id': personId,
				name: '布吉岛',
				alternateName: 'Bujidao',
				url: new URL('/zh/', site).href,
				image: new URL('/logo.jpg', site).href,
				jobTitle: '工程师、构建者与技术创作者',
				knowsAbout: ['AI agents', 'Full-stack engineering', 'Open source software'],
				sameAs: ['https://github.com/itkdm'],
			},
			{
				'@type': 'WebPage',
				'@id': `${pageUrl}#webpage`,
				url: pageUrl,
				inLanguage: lang === 'zh' ? 'zh-CN' : 'en',
				isPartOf: { '@id': `${site}/#website` },
				about: { '@id': personId },
			},
		],
	};
}
