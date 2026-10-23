<script>
	import { urlFor, gallerySrcset, gallerySizes } from '$lib/utils/image.js'

	/** @type {{media: any, bp?: number, width?: number, class?: string, opacity?: boolean, blur?: boolean, scale?: boolean, duration?: number}} */
	let { media, bp = 768, width = 100, class: className = '', opacity = true, blur = true, scale = false, duration = 500 } = $props()

	/** @param {() => string | undefined} fn */
	function safely(fn) {
		try {
			return fn()
		} catch {
			return undefined
		}
	}

	const widths = [400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600]

	const isGallery = $derived(className.includes('gallery'))

	/** @param {any} image */
	function srcset(image) {
		if (isGallery) return gallerySrcset(image, aspectRatio || 1)
		return widths.map((w) => `${safely(() => urlFor(image)?.width(w).url())} ${w}w`).join(', ')
	}

	const sizes = $derived(isGallery ? gallerySizes(bp, width) : `(max-width: ${bp}px) 100vw, ${width}vw`)

	// snap to 2 decimals so exports a pixel off (2250x2813 vs 4:5) share a ratio —
	// otherwise row neighbours differ by a subpixel and leave a hairline gap
	/** @param {number | undefined} ratio */
	const snap = (ratio) => (ratio ? Math.round(ratio * 100) / 100 : ratio)

	const aspectRatio = $derived(snap(media?.type === 'video' ? media?.posterAspectRatio : media?.aspectRatio))
	const aspectRatioMobile = $derived(snap(media?.type === 'video' ? media?.posterAspectRatio : media?.aspectRatioMobile || media?.aspectRatio))
	const palette = $derived(media?.type === 'video' ? media?.posterPalette : media?.palette)

	let loaded = $state(false)
	let entered = $state(false)

	/** @param {Element} node */
	function observeEntry(node) {
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				entered = true
				observer.disconnect()
			}
		})
		observer.observe(node)
		return () => observer.disconnect()
	}

	// iOS Safari sometimes ignores the `muted` HTML attribute on videos that
	// gain their <source> children after mount, silently blocking autoplay —
	// setting the `muted` DOM property directly and retrying play() fixes it.
	// The SSR'd video can also fire `loadeddata` before hydration attaches the
	// handler (slow JS, e.g. dev with empty cache), so check readyState too
	/** @param {HTMLVideoElement} node */
	function ensureAutoplay(node) {
		node.muted = true
		node.play?.().catch(() => {})
		if (node.readyState >= 2) loaded = true
	}
</script>

<div
	class="media-container {className}"
	style:--aspect-ratio={aspectRatio || 1}
	style:--aspect-ratio-mobile={aspectRatioMobile || 1}
	style:--duration="{duration}ms"
	style:background-color={palette}
	{@attach observeEntry}
>
	<div class="content" class:opacity class:loaded={loaded && entered}>
		{#if media?.type === 'video' && media.video}
			<video autoplay muted loop playsinline class:blur class:scale class:loaded={loaded && entered} poster={safely(() => urlFor(media.videoPoster)?.url())} onloadeddata={() => (loaded = true)} {@attach ensureAutoplay}>
				{#if media.videoMobile}
					<source media="(max-width: 768px)" src={media.videoMobile.asset?.url} type="video/mp4" />
				{/if}
				<source src={media.video.asset?.url} type="video/mp4" />
			</video>
		{:else if media?.image}
			<picture>
				{#if media.imageMobile}
					<source media="(max-width: {bp}px)" srcset={srcset(media.imageMobile)} />
				{/if}
				<img
					src={safely(() => (isGallery ? urlFor(media.image)?.height(1200).url() : urlFor(media.image)?.width(1200).url()))}
					srcset={srcset(media.image)}
					{sizes}
					loading="lazy"
					alt=""
					class:blur
					class:scale
					class:loaded={loaded && entered}
					onload={() => (loaded = true)}
				/>
			</picture>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$lib/scss/breakpoints.module' as bp;

	.media-container {
		display: block;
		position: relative;
		overflow: hidden;
		isolation: isolate;
		background-color: var(--gray-subtle);		aspect-ratio: var(--aspect-ratio, 1);

		.content {
			position: absolute;
			inset: 0;
			transition: opacity var(--duration) var(--ease) 100ms, transform var(--transition-xs);

			&.opacity {
				opacity: 0;
			}

			&.loaded {
				opacity: 1;
			}
		}

		picture {
			display: contents;
		}

		img,
		video {
			position: relative;
			z-index: 1;
			display: block;
			width: 100%;
			height: 100%;
			max-width: 100%;
			object-fit: cover;
			object-position: center;
			transition: var(--transition);

			// end on `none` (not blur(0)/scale(1)) so the browser drops the
			// compositing layer once loaded — layered edges render subpixel seams
			&.blur {
				filter: blur(20px);

				&.loaded {
					filter: none;
				}
			}

			&.scale {
				transform: scale(1.02);

				&.loaded {
					transform: none;
				}
			}
		}

		@media (width <= #{bp.$md}) {
			aspect-ratio: var(--aspect-ratio-mobile, 1);
		}

		&.gallery {
			display: inline-block;
			width: min(calc(100vw - var(--sp-15) * 2), calc((100vh - var(--sp-15) * 8) * var(--aspect-ratio, 1)));
			height: min(calc(100vh - var(--sp-15) * 8), calc((100vw - var(--sp-15) * 2) / var(--aspect-ratio, 1)));

			img,
			video {
				width: 100%;
				height: 100%;
			}

			@media (width <= #{bp.$md}) {
				width: min(calc(100vw - var(--sp-15) * 2 - var(--sp-10) * 2), calc((100vh - var(--sp-15) * 8) * var(--aspect-ratio-mobile, 1)));
				height: min(calc(100vh - var(--sp-15) * 8), calc((100vw - var(--sp-15) * 2) / var(--aspect-ratio-mobile, 1)));
			}
		}
	}
</style>
