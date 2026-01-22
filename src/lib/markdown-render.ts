/**
 * 安全渲染 Markdown 文本的工具函数
 * 用于将 GitHub Release notes 等 Markdown 内容安全地转换为 HTML
 * 支持服务端和客户端渲染
 */

import { marked } from 'marked';

// 配置 marked 选项
marked.setOptions({
	breaks: true, // 支持换行
	gfm: true, // 支持 GitHub Flavored Markdown
});

/**
 * 使用正则表达式清理 HTML，移除潜在的 XSS 风险
 * 这个方法可以在服务端和客户端都使用
 * 只允许安全的 HTML 标签和属性
 */
function sanitizeHtml(html: string): string {
	if (!html || typeof html !== 'string') {
		return '';
	}

	// 允许的标签列表
	const allowedTags = ['p', 'br', 'strong', 'em', 'b', 'i', 'code', 'pre', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a', 'hr'];
	
	// 移除 script 和 style 标签及其内容
	html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
	html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
	
	// 移除所有事件处理器（onclick, onerror 等）
	html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
	html = html.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
	
	// 移除 javascript: 和 data: URL
	html = html.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
	html = html.replace(/href\s*=\s*["']data:[^"']*["']/gi, '');
	html = html.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');
	html = html.replace(/src\s*=\s*["']data:[^"']*["']/gi, '');
	
	// 清理链接，确保外部链接有 rel="noopener noreferrer"
	html = html.replace(/<a\s+([^>]*href\s*=\s*["'])(https?:\/\/[^"']+)(["'][^>]*)>/gi, (match, before, url, after) => {
		// 检查是否已有 rel 属性
		if (!after.includes('rel=')) {
			return `<a ${before}${url}${after} rel="noopener noreferrer" target="_blank">`;
		}
		return match;
	});
	
	// 移除所有不在允许列表中的标签，但保留其内容
	const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
	html = html.replace(tagRegex, (match, tagName) => {
		const lowerTagName = tagName.toLowerCase();
		if (allowedTags.includes(lowerTagName)) {
			// 清理标签属性，只保留安全的属性
			if (lowerTagName === 'a') {
				// 对于链接，只保留 href, target, rel 属性
				const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
				const targetMatch = match.match(/target\s*=\s*["']([^"']+)["']/i);
				const relMatch = match.match(/rel\s*=\s*["']([^"']+)["']/i);
				
				let cleanAttrs = '';
				if (hrefMatch) {
					const href = hrefMatch[1];
					// 验证 href 是安全的
					if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/') || href.startsWith('#')) {
						cleanAttrs += ` href="${href}"`;
						if (!targetMatch) {
							if (href.startsWith('http://') || href.startsWith('https://')) {
								cleanAttrs += ' target="_blank" rel="noopener noreferrer"';
							}
						}
					}
				}
				if (targetMatch && !cleanAttrs.includes('target=')) {
					cleanAttrs += ` target="${targetMatch[1]}"`;
				}
				if (relMatch && !cleanAttrs.includes('rel=')) {
					cleanAttrs += ` rel="${relMatch[1]}"`;
				}
				
				return match.startsWith('</') ? '</a>' : `<a${cleanAttrs}>`;
			}
			// 对于其他标签，移除所有属性
			return match.startsWith('</') ? `</${lowerTagName}>` : `<${lowerTagName}>`;
		}
		// 移除不允许的标签
		return '';
	});
	
	return html;
}

/**
 * 将 Markdown 文本安全地渲染为 HTML
 * @param markdown Markdown 文本
 * @returns 清理后的 HTML 字符串
 */
export function renderMarkdown(markdown: string): string {
	if (!markdown || typeof markdown !== 'string') {
		return '';
	}

	try {
		// 使用 marked 将 Markdown 转换为 HTML
		const html = marked.parse(markdown) as string;
		
		// 清理 HTML，移除潜在的 XSS 风险
		return sanitizeHtml(html);
	} catch (error) {
		// 如果渲染失败，返回转义后的纯文本
		return escapeHtml(markdown);
	}
}

/**
 * 转义 HTML 特殊字符
 * 可以在服务端和客户端使用
 */
function escapeHtml(text: string): string {
	if (typeof text !== 'string') {
		return '';
	}
	
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
