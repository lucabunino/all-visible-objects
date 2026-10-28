<script>
	import Media from '$lib/components/Media.svelte'
	import CursorTag from '$lib/components/CursorTag.svelte'
	import { useScrollLock } from '$lib/utils/scrollLock.svelte.js'
	import { revealWidth } from '$lib/utils/transitions.js'
	import { getGallery } from '$lib/stores/gallery.svelte.js'
	import { preloadGalleryImage } from '$lib/utils/image.js'

	const DURATION = 300
	const IDLE_DELAY = 10000
	const LOOP_INTERVAL = 4000

	/** @type {{media: any[]}} */
	let { media = [] } = $props()

	const gallery = getGallery()

	let index = $state(gallery.startIndex)
	/** @type {'left' | 'right' | null} */
	let hovered = $state(null)

	useScrollLock(() => true)

	function close() { gallery.closeGallery() }
	function prev() { index = (index - 1 + media.length) % media.length }
	function next() { index = (index + 1) % media.length }

	/** @type {ReturnType<typeof setTimeout>} */
	let idleTimeout
	/** @type {ReturnType<typeof setInterval>} */
	let loopInterval

	function startLoop() {
		loopInterval = setInterval(next, LOOP_INTERVAL)
	}

	// 10s after the last real interaction, start auto-advancing every 3s —
	// the auto-advance itself doesn't count as an interaction, only clicks
	// and arrow keys reset the idle wait (see handlePrev/handleNext/handleKeydown)
	function resetIdle() {
		clearInterval(loopInterval)
		clearTimeout(idleTimeout)
		idleTimeout = setTimeout(startLoop, IDLE_DELAY)
	}

	function handlePrev() {
		prev()
		resetIdle()
	}
	function handleNext() {
		next()
		resetIdle()
	}

	$effect(() => {
		// on mount (no interaction yet), the first advance only waits
		// LOOP_INTERVAL — setInterval's own first tick already provides that
		// wait, so no extra setTimeout on top (that would double it to 2x).
		// The full IDLE_DELAY only applies after a real interaction, via resetIdle
		startLoop()
		return () => {
			clearTimeout(idleTimeout)
			clearInterval(loopInterval)
		}
	})

	// next two + previous image, so stepping through never waits on a download
	$effect(() => {
		for (const offset of [1, 2, -1]) {
			preloadGalleryImage(media[(index + offset + media.length) % media.length], 'high')
		}
	})

	// a11y: move focus into the dialog on open, give it back to whatever
	// opened it (the clicked image) on close
	/** @param {HTMLElement} node */
	function manageFocus(node) {
		const previous = document.activeElement
		node.focus({ preventScroll: true })
		return () => {
			if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true })
		}
	}

	// keyboard use hides the cursor arrow tag until the mouse moves again
	let usingKeyboard = $state(false)

	/** @param {KeyboardEvent} e */
	function handleKeydown(e) {
		usingKeyboard = true
		if (e.key === 'Escape') close()
		else if (e.key === 'ArrowLeft') handlePrev()
		else if (e.key === 'ArrowRight') handleNext()
	}
</script>

<svelte:window onkeydown={handleKeydown} onmousemove={() => (usingKeyboard = false)} />

<div class="overlay" role="dialog" aria-modal="true" aria-label="Media gallery" tabindex="-1" {@attach manageFocus}>
	<div class="tag-wrapper index" in:revealWidth|global={{ duration: DURATION, delay: DURATION }} out:revealWidth|global={{ duration: DURATION }}>
		<span class="tag no-pointer">{index + 1}/{media.length}</span>
	</div>

	<button
		class="zone prev"
		type="button"
		onclick={handlePrev}
		onmouseenter={() => (hovered = 'left')}
		onmouseleave={() => (hovered = null)}
		aria-label="Previous"
	></button>
	<button
		class="zone next"
		type="button"
		onclick={handleNext}
		onmouseenter={() => (hovered = 'right')}
		onmouseleave={() => (hovered = null)}
		aria-label="Next"
	></button>

	{#key media[index]}
		<Media media={media[index]} class="gallery" blur={false} opacity={true} scale={false} duration={300} width={50}/>
	{/key}
</div>

{#if hovered && !usingKeyboard}
	<CursorTag direction={hovered} />
{/if}

<style lang="scss">
	@use '$lib/scss/breakpoints.module' as bp;

	.overlay {
		position: fixed;
		inset: 0;
		z-index: 5;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--white);
		outline: none; // focused programmatically for a11y, never shows a ring

		.index {
			position: absolute;
			top: var(--sp-15);
			left: var(--sp-15);
			z-index: 2;
		}

		.zone {
			position: absolute;
			inset: 0;
			width: 50%;
			cursor: pointer;
			z-index: 1;

			&:focus-visible {
				outline: none;
			}

			&.next {
				left: auto;
			}
		}
	}
</style>
