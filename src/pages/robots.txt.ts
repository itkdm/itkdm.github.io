import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
	const body = `User-agent: *
Allow: /
Sitemap: https://itkdm.com/sitemap.xml
`;
	return new Response(body, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
};
