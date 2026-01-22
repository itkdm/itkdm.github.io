/**
 * 密码保护工具函数
 * 用于在静态站点中实现页面密码保护功能
 */

export interface PasswordConfig {
	/** 密码值（建议使用哈希值，不要明文存储） */
	password: string;
	/** 存储键名 */
	storageKey?: string;
	/** 密码有效期（毫秒），0 表示永久有效 */
	expiresIn?: number;
	/** 是否使用 sessionStorage（关闭浏览器后失效） */
	useSessionStorage?: boolean;
}

/**
 * 验证密码是否正确
 * @param inputPassword 用户输入的密码
 * @param correctPassword 正确的密码
 * @returns 是否匹配
 */
export function verifyPassword(inputPassword: string, correctPassword: string): boolean {
	// 简单比较（生产环境建议使用哈希比较）
	return inputPassword.trim() === correctPassword.trim();
}

/**
 * 检查用户是否已通过密码验证
 * @param config 密码配置
 * @returns 是否已验证
 */
export function isPasswordVerified(config: PasswordConfig): boolean {
	// 服务器端渲染时，localStorage 不可用，总是返回 false
	// 密码验证会在客户端进行
	if (typeof window === 'undefined' || typeof localStorage === 'undefined' && typeof sessionStorage === 'undefined') {
		return false;
	}
	
	const storage = config.useSessionStorage ? sessionStorage : localStorage;
	const storageKey = config.storageKey || 'page_password_verified';
	
	try {
		const stored = storage.getItem(storageKey);
		if (!stored) return false;
		
		const data = JSON.parse(stored);
		
		// 检查密码是否匹配
		if (data.password !== config.password) {
			// 密码已更改，清除旧数据
			storage.removeItem(storageKey);
			return false;
		}
		
		// 检查是否过期
		if (config.expiresIn && config.expiresIn > 0) {
			const now = Date.now();
			if (data.timestamp && now - data.timestamp > config.expiresIn) {
				storage.removeItem(storageKey);
				return false;
			}
		}
		
		return true;
	} catch {
		return false;
	}
}

/**
 * 保存密码验证状态
 * @param config 密码配置
 */
export function savePasswordVerification(config: PasswordConfig): void {
	const storage = config.useSessionStorage ? sessionStorage : localStorage;
	const storageKey = config.storageKey || 'page_password_verified';
	
	const data = {
		password: config.password,
		timestamp: Date.now(),
	};
	
	try {
		storage.setItem(storageKey, JSON.stringify(data));
	} catch (error) {
		console.error('Failed to save password verification:', error);
	}
}

/**
 * 清除密码验证状态
 * @param storageKey 存储键名
 * @param useSessionStorage 是否使用 sessionStorage
 */
export function clearPasswordVerification(
	storageKey: string = 'page_password_verified',
	useSessionStorage: boolean = false
): void {
	const storage = useSessionStorage ? sessionStorage : localStorage;
	try {
		storage.removeItem(storageKey);
	} catch (error) {
		console.error('Failed to clear password verification:', error);
	}
}

/**
 * 生成密码哈希（简单实现，生产环境建议使用更安全的哈希算法）
 * 注意：这只是简单的编码，不是真正的加密
 * 对于更安全的需求，建议在服务端进行验证
 */
export function hashPassword(password: string): string {
	// 简单的 Base64 编码（仅用于混淆，不是真正的安全）
	// 生产环境建议使用 bcrypt 或类似的安全哈希
	return btoa(encodeURIComponent(password));
}

/**
 * 验证哈希密码
 */
export function verifyHashedPassword(inputPassword: string, hashedPassword: string): boolean {
	try {
		const hashed = hashPassword(inputPassword);
		return hashed === hashedPassword;
	} catch {
		return false;
	}
}
