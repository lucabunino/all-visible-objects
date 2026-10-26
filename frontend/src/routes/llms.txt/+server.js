import { text } from '@sveltejs/kit'
import { getSitemap } from '$lib/utils/sanity.js'

// llms.txt (https://llmstxt.org): plain-markdown site summary for AI crawlers
export async function GET({ url }) {
	const { works = [], policies = [], seo } = (await getSitemap()) ?? {}
	const name = seo?.seoTitle || 'All Visible Objects'

	const lines = [
		`# ${name}`,
		'',
		seo?.seoDescription ? `> ${seo.seoDescription}` : '',
		'',
		'## Works',
		'',
		...works
			.filter((/** @type {any} */ w) => w.client?.slug)
			.map(
				(/** @type {any} */ w) =>
					`- [${w.title}${w.client?.title ? ` for ${w.client.title}` : ''}](${url.origin}/works/${w.client.slug}/${w.slug})`
			),
		'',
		'## Studio',
		'',
		`- [About](${url.origin}/about): approach, capabilities, clients and contacts`,
		'',
		'## Optional',
		'',
		...policies.map((/** @type {any} */ p) => `- [${p.title}](${url.origin}/policy/${p.slug})`)
	]

	return text(lines.join('\n') + '\n', {
		headers: { 'cache-control': 'public, max-age=0, s-maxage=3600' }
	})
}
