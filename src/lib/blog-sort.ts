/**
 * 博客文章排序函数
 * 排序规则：
 * 1. 先按 priority 降序（priority 越大越靠前，实现置顶功能）
 * 2. 如果 priority 相同，按 date 降序（最新在前）
 */
export function sortBlogPosts<T extends { data: { priority?: number; date: Date } }>(
	posts: T[]
): T[] {
	return [...posts].sort((a, b) => {
		const priorityA = a.data.priority ?? 0;
		const priorityB = b.data.priority ?? 0;
		
		// 先按 priority 降序排序
		if (priorityA !== priorityB) {
			return priorityB - priorityA;
		}
		
		// priority 相同时，按日期降序排序（最新在前）
		return b.data.date.valueOf() - a.data.date.valueOf();
	});
}
