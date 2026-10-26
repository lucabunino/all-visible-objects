import { getSitemap } from '$lib/utils/sanity.js'

/** @param {string} s */
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function GET({ url }) {
	const { works = [], policies = [], about, homepage } = (await getSitemap()) ?? {}

	/** @type {{loc: string, lastmod?: string}[]} */
	const entries = [
		{ loc: '/', lastmod: homepage?._updatedAt },
		{ loc: '/about', lastmod: about?._updatedAt },
		...works
			.filter((/** @type {any} */ w) => w.client?.slug)
			.map((/** @type {any} */ w) => ({ loc: `/works/${w.client.slug}/${w.slug}`, lastmod: w._updatedAt })),
		...policies.map((/** @type {any} */ p) => ({ loc: `/policy/${p.slug}`, lastmod: p._updatedAt }))
	]

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		({ loc, lastmod }) =>
			`\t<url><loc>${escape(url.origin + loc)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}</url>`
	)
	.join('\n')}
</urlset>`

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml',
			'cache-control': 'public, max-age=0, s-maxage=3600'
		}
	})
}
