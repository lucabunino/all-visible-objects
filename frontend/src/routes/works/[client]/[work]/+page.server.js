import { error } from '@sveltejs/kit'
import { getWork } from '$lib/utils/sanity.js'

export async function load({ params }) {
	const work = await getWork(params.client, params.work)
	if (!work) error(404, 'Work not found')

	const hidden = work.status === 'hidden' || work.client?.status === 'hidden'

	return {
		work,
		hidden,
		seoSingle: {
			seoTitle: work.client?.title ? `${work.title} for ${work.client.title}` : work.title,
			seoDescription: work.seoDescription,
			seoImage: work.seoImage
		}
	}
}
