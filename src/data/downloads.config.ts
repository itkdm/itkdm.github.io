/**
 * 下载源配置类型定义
 * 
 * 注意：实际配置数据请编辑 `downloads.config.json` 文件
 * 此文件仅提供 TypeScript 类型定义，用于类型检查和 IDE 提示
 * 
 * 支持的下载源类型：
 * - direct: 直接下载链接（如阿里云OSS、CDN等）
 * - github: GitHub Releases
 * - baidu: 百度网盘
 * - quark: 夸克网盘
 * - aliyun: 阿里云盘
 * - other: 其他网盘
 */

export type DownloadSourceType = 'direct' | 'github' | 'baidu' | 'quark' | 'aliyun' | 'other';

export interface DirectDownloadSource {
	type: 'direct';
	name: string;
	url: string;
	size?: number; // 文件大小（字节）
	platform?: string; // 平台标识，如 'android', 'ios', 'windows', 'mac', 'linux'
	arch?: string; // 架构，如 'arm64', 'universal', 'x86_64'
}

export interface GitHubDownloadSource {
	type: 'github';
	repo: string; // 格式：owner/repo
	channel?: 'stable' | 'beta' | 'alpha'; // 发布渠道
	preferAssetsRegex?: string; // 优先匹配的资产文件名正则
	showSha256?: boolean; // 是否显示 SHA256 校验值
}

export interface CloudDiskDownloadSource {
	type: 'baidu' | 'quark' | 'aliyun' | 'other';
	name: string;
	url: string;
	code?: string; // 提取码（百度网盘等）
	platform?: string;
	arch?: string;
}

export type DownloadSource = DirectDownloadSource | GitHubDownloadSource | CloudDiskDownloadSource;

export interface DownloadItem {
	id: string; // 唯一标识
	name: string; // 工具/应用名称
	nameEn?: string; // 英文名称
	description?: string; // 描述
	descriptionEn?: string; // 英文描述
	icon?: string; // 图标（emoji 或图片路径）
	platform?: string; // 主要平台
	sources: DownloadSource[]; // 下载源列表
	order?: number; // 排序
}

/**
 * 下载源配置列表
 * 按需添加你的下载项
 */
export const downloadItems: DownloadItem[] = [
	{
		id: 'side-lying-monitor',
		name: '侧躺监测（枕边哨）',
		nameEn: 'Side Lying Monitor',
		description: '智能侧躺监测与健康提醒应用',
		descriptionEn: 'Smart side-lying monitoring and health reminder app',
		icon: '📱',
		platform: 'Android',
		order: 1,
		sources: [
			// GitHub Release 示例
			{
				type: 'github',
				repo: 'itkdm/side-lying-monitor',
				channel: 'stable',
				preferAssetsRegex: '.*\\.apk$',
				showSha256: true,
			},
			// 直接下载链接示例（阿里云OSS等）
			{
				type: 'direct',
				name: '直接下载（阿里云OSS）',
				url: 'https://example.com/releases/app-v1.0.0.apk',
				size: 15 * 1024 * 1024, // 15MB
				platform: 'android',
				arch: 'universal',
			},
			// 百度网盘示例
			{
				type: 'baidu',
				name: '百度网盘',
				url: 'https://pan.baidu.com/s/xxxxxxxx',
				code: '1234',
				platform: 'android',
			},
			// 夸克网盘示例
			{
				type: 'quark',
				name: '夸克网盘',
				url: 'https://pan.quark.cn/s/xxxxxxxx',
				platform: 'android',
			},
		],
	},
	// 可以继续添加更多下载项
];

/**
 * 获取下载源类型的中文名称
 */
export function getSourceTypeLabel(type: DownloadSourceType, lang: 'zh' | 'en' = 'zh'): string {
	const labels: Record<DownloadSourceType, { zh: string; en: string }> = {
		direct: { zh: '直接下载', en: 'Direct Download' },
		github: { zh: 'GitHub Release', en: 'GitHub Release' },
		baidu: { zh: '百度网盘', en: 'Baidu Netdisk' },
		quark: { zh: '夸克网盘', en: 'Quark Netdisk' },
		aliyun: { zh: '阿里云盘', en: 'Aliyun Drive' },
		other: { zh: '其他网盘', en: 'Other Cloud Disk' },
	};
	return labels[type]?.[lang] || type;
}

/**
 * 获取下载源图标（emoji 或 SVG）
 */
export function getSourceTypeIcon(type: DownloadSourceType): string {
	const icons: Record<DownloadSourceType, string> = {
		direct: '⬇️',
		github: '🐙',
		baidu: '💾',
		quark: '☁️',
		aliyun: '☁️',
		other: '📦',
	};
	return icons[type] || '📥';
}
