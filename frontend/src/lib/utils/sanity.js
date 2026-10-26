import { createClient } from '@sanity/client'
import { PUBLIC_SANITY_DATASET, PUBLIC_SANITY_PROJECT_ID } from '$env/static/public'
import { dev } from '$app/environment'

export const client = createClient({
	projectId: PUBLIC_SANITY_PROJECT_ID,
	dataset: PUBLIC_SANITY_DATASET,
	// useCdn: !dev,
	useCdn: false,
	apiVersion: '2026-07-11'
})

const mediaFields = `
	type,
	image,
	imageMobile,
	"aspectRatio": image.asset->metadata.dimensions.aspectRatio,
	"aspectRatioMobile": imageMobile.asset->metadata.dimensions.aspectRatio,
	"palette": image.asset->metadata.palette.dominant.background,
	video{asset->{url}},
	videoMobile{asset->{url}},
	videoPoster,
	videoPosterMobile,
	"posterAspectRatio": videoPoster.asset->metadata.dimensions.aspectRatio,
	"posterPalette": videoPoster.asset->metadata.palette.dominant.background
`
const media = `{${mediaFields}}`

const workCard = `{
	_id,
	title,
	slug,
	client->{title, slug},
	thumbnail ${media}
}`

export async function getSeo() {
	return client.fetch(`*[_type == "seo"][0]{seoTitle, seoDescription, seoImage}`)
}

export async function getNav() {
	return client.fetch(`*[_type == "client" && status != "hidden" && count(works[@->status != "hidden"]) > 0] | order(orderRank asc) {
		title,
		slug,
		"works": works[@->status != "hidden"]->{
			title,
			slug
		}
	}`)
}

// header/footer only need the contact links — the full about doc is fetched
// by the about page itself
export async function getContact() {
	return client.fetch(`*[_type == "about"][0]{email, instagram}`)
}

export async function getAbout() {
	return client.fetch(`*[_type == "about"][0]{
		description,
		email,
		instagram,
		capabilities[]{_key, "title": @->title},
		"clients": clients[]{_key, "title": @->title},
		commissions,
		images[]{_key, ${mediaFields}}
	}`)
}

export async function getPolicies() {
	return client.fetch(`*[_type == "policy"]{_id, title, slug}`)
}

/** @param {string} slug */
export async function getPolicy(slug) {
	return client.fetch(`*[_type == "policy" && slug.current == $slug][0]{title, content}`, { slug })
}

// every public url, for sitemap.xml and llms.txt
export async function getSitemap() {
	return client.fetch(`{
		"works": *[_type == "work" && status != "hidden" && client->status != "hidden" && defined(slug.current)]{
			title,
			"slug": slug.current,
			"client": client->{title, "slug": slug.current},
			_updatedAt
		},
		"policies": *[_type == "policy" && defined(slug.current)]{title, "slug": slug.current, _updatedAt},
		"about": *[_type == "about"][0]{_updatedAt},
		"homepage": *[_type == "homepage"][0]{_updatedAt},
		"seo": *[_type == "seo"][0]{seoTitle, seoDescription}
	}`)
}

export async function getHomepage() {
	return client.fetch(`*[_type == "homepage"][0]{
		"works": works[@->status != "hidden"]->${workCard}
	}`)
}

/**
 * @param {string} clientSlug
 * @param {string} workSlug
 */
export async function getWork(clientSlug, workSlug) {
	return client.fetch(
		`*[_type == "work" && slug.current == $workSlug && client->slug.current == $clientSlug][0]{
			title,
			status,
			client-> {
				title,
				slug,
				status
			},
			typology->{title},
			year,
			services[]->{title},
			blocks[]{
				_key,
				items[]{
					_key,
					_type,
					_type == "mediaItem" => ${media},
					_type == "textItem" => {text}
				}
			},
			credits[]{
				_key,
				role,
				collaborators[]->{title, href}
			},
			workInformation,
			seoDescription,
			seoImage,
			related[@->status != "hidden"]->${workCard}
		}`,
		{ clientSlug, workSlug }
	)
}
