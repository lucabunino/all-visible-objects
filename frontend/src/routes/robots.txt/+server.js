import { text } from '@sveltejs/kit'

export function GET({ url }) {
	return text(`User-agent: *\nAllow: /\n\nSitemap: ${url.origin}/sitemap.xml\n`, {
		headers: { 'cache-control': 'public, max-age=3600' }
	})
}
