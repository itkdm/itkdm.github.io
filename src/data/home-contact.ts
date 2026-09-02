export type ContactChannel = {
	key: 'github' | 'email' | 'wechat';
	label: { zh: string; en: string };
	display: { zh: string; en: string };
	type: 'link' | 'qr';
	href?: string;
	enabled: boolean;
	qrImage?: string;
};

export const CONTACT_EMAIL = 'contact@itkdm.com';
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;
export const CONTACT_GITHUB_URL = 'https://github.com/itkdm';
export const CONTACT_GITHUB_DISPLAY = CONTACT_GITHUB_URL.replace(/^https?:\/\//, '');

export const homeContactChannels: ContactChannel[] = [
	{ key: 'email', label: { zh: '邮箱', en: 'EMAIL' }, display: { zh: CONTACT_EMAIL, en: CONTACT_EMAIL }, type: 'link', href: CONTACT_EMAIL_HREF, enabled: true },
	{ key: 'github', label: { zh: 'GitHub', en: 'GITHUB' }, display: { zh: CONTACT_GITHUB_DISPLAY, en: CONTACT_GITHUB_DISPLAY }, type: 'link', href: CONTACT_GITHUB_URL, enabled: true },
	{ key: 'wechat', label: { zh: '微信', en: 'WECHAT' }, display: { zh: '扫码联系', en: 'SCAN TO CONNECT' }, type: 'qr', qrImage: '/contact/wechat-qr.png', enabled: true },
];
