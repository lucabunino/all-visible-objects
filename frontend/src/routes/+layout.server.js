import { getSeo, getNav, getContact, getPolicies } from '$lib/utils/sanity.js'

// Vercel ISR: pages are cached and regenerated in the background at most once a
// minute, so visits don't each wait on live Sanity queries (content edits show
// up within ~60s). Inherited by every route below this layout.
export const config = {
	isr: { expiration: 60 }
}

export async function load() {
	const [seo, nav, about, policies] = await Promise.all([getSeo(), getNav(), getContact(), getPolicies()])
	return { seo, nav, about, policies }
}
