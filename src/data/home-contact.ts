export type ContactChannel = {
	key: 'github' | 'email' | 'wechat';
	label: string;
	display: string;
	href?: string;
	enabled: boolean;
	qrImage?: string;
};

export const homeContactChannels: ContactChannel[] = [
	{ key: 'github', label: 'GITHUB', display: 'github.com/itkdm', href: 'https://github.com/itkdm', enabled: true },
	{ key: 'email', label: 'EMAIL', display: '', href: '', enabled: false },
	{ key: 'wechat', label: 'WECHAT', display: 'SCAN TO CONNECT', enabled: false },
];
