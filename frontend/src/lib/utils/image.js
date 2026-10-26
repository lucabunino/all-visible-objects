import { createImageUrlBuilder } from '@sanity/image-url'
import { client } from '$lib/utils/sanity.js'

const builder = createImageUrlBuilder(client)

/** @param {any} source */
export function urlFor(source) {
	if (source) return builder.image(source).auto('format')
}

export const GALLERY_HEIGHTS = [400, 800, 1200, 1600, 2000]

/** @param {any} image @param {number} [aspectRatio] */
export function gallerySrcset(image, aspectRatio = 1) {
	return GALLERY_HEIGHTS.map((h) => {
		try {
			const url = urlFor(image)?.height(h).url()
			return url ? `${url} ${Math.round(h * aspectRatio)}w` : null
		} catch {
			return null
		}
	})
		.filter(Boolean)
		.join(', ')
}

/** @param {number} [bp] @param {number} [width] */
export function gallerySizes(bp = 768, width = 50) {
	return `(max-width: ${bp}px) 100vw, ${width}vw`
}

/**
 * Warm the browser cache with the exact file the gallery's <img> will pick
 * (same srcset/sizes as Media.svelte with class="gallery"). Resolves when
 * downloaded or failed; videos resolve immediately.
 * @param {any} item mediaItem
 * @param {'high' | 'low' | 'auto'} [priority]
 * @returns {Promise<void>}
 */
export function preloadGalleryImage(item, priority = 'auto', bp = 768) {
	if (item?.type === 'video' || !item?.image) return Promise.resolve()
	const mobile = item.imageMobile && matchMedia(`(max-width: ${bp}px)`).matches
	const image = mobile ? item.imageMobile : item.image
	const ratio = (mobile ? item.aspectRatioMobile : item.aspectRatio) || 1
	return new Promise((resolve) => {
		const img = new Image()
		img.fetchPriority = priority
		img.onload = img.onerror = () => resolve()
		img.sizes = gallerySizes(bp)
		img.srcset = gallerySrcset(image, ratio)
	})
}
