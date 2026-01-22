/**
 * 下载相关的 TypeScript 类型定义
 */

export type DownloadSourceType = 'direct' | 'github' | 'baidu' | 'quark' | 'aliyun' | 'other';

export interface DirectDownloadSource {
	type: 'direct';
	name: string;
	url: string;
	size?: number; // 文件大小（字节）
	platform?: string;
	arch?: string;
}

export interface GitHubDownloadSource {
	type: 'github';
	repo: string; // 格式：owner/repo
	channel?: 'stable' | 'beta' | 'alpha';
	preferAssetsRegex?: string;
	showSha256?: boolean;
	latest?: {
		version: string;
		publishedAt: string;
		notes: string;
		assets: GitHubAsset[];
	};
	history?: Array<{
		version: string;
		publishedAt: string;
		assets: GitHubAsset[];
	}>;
}

export interface GitHubAsset {
	name: string;
	downloadUrl: string;
	size: number;
	type: 'github';
}

export interface CloudDiskDownloadSource {
	type: 'baidu' | 'quark' | 'aliyun' | 'other';
	name: string;
	url: string;
	code?: string; // 提取码
	platform?: string;
	arch?: string;
}

export type DownloadSource = DirectDownloadSource | GitHubDownloadSource | CloudDiskDownloadSource;

export interface DownloadTool {
	id: string;
	name: string;
	nameEn?: string;
	description?: string;
	descriptionEn?: string;
	icon?: string;
	platform?: string;
	order?: number;
	sources: DownloadSource[];
}

export interface ReleasesData {
	updatedAt: string;
	tools: DownloadTool[];
}
