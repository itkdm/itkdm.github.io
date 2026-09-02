export type ContactChannel = {
	key: 'github' | 'email' | 'wechat';
	label: string;
	display: string;
	type: 'link' | 'qr';
	href?: string;
	enabled: boolean;
	qrImage?: string;
};

export const homeContactChannels: ContactChannel[] = [
	{ key: 'github', label: 'GITHUB', display: 'github.com/itkdm', type: 'link', href: 'https://github.com/itkdm', enabled: true },
	{ key: 'email', label: 'EMAIL', display: 'contact@itkdm.com', type: 'link', href: 'mailto:contact@itkdm.com', enabled: true },
	{ key: 'wechat', label: 'WECHAT', display: 'SCAN TO CONNECT', type: 'qr', qrImage: '/contact/wechat-qr.png', enabled: true },
];
