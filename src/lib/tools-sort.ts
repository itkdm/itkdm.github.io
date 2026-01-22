/**
 * 工具排序函数
 * 排序规则：
 * 1. 先按 priority 降序（priority 越大越靠前，实现置顶功能）
 * 2. 如果 priority 相同，按 order 升序（order 越小越靠前）
 * 3. 如果 order 也相同，按名称字母顺序排序
 */
export function sortTools<T extends { data: { priority?: number; order?: number; name: string } }>(
	tools: T[]
): T[] {
	return [...tools].sort((a, b) => {
		const priorityA = a.data.priority ?? 0;
		const priorityB = b.data.priority ?? 0;
		
		// 先按 priority 降序排序
		if (priorityA !== priorityB) {
			return priorityB - priorityA;
		}
		
		// priority 相同时，按 order 升序排序
		const orderA = a.data.order ?? 0;
		const orderB = b.data.order ?? 0;
		if (orderA !== orderB) {
			return orderA - orderB;
		}
		
		// order 也相同时，按名称字母顺序排序
		return a.data.name.localeCompare(b.data.name);
	});
}
