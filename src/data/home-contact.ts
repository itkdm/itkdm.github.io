export type ContactChannel = {
	key: 'github' | 'email' | 'wechat';
	label: string;
	display: string;
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
	{ key: 'email', label: 'EMAIL', display: CONTACT_EMAIL, type: 'link', href: CONTACT_EMAIL_HREF, enabled: true },
	{ key: 'github', label: 'GITHUB', display: CONTACT_GITHUB_DISPLAY, type: 'link', href: CONTACT_GITHUB_URL, enabled: true },
	{ key: 'wechat', label: 'WECHAT', display: 'SCAN TO CONNECT', type: 'qr', qrImage: '/contact/wechat-qr.png', enabled: true },
];
