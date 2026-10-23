<script>
	import { innerWidth, innerHeight } from 'svelte/reactivity/window'

	/** @type {{direction: 'left' | 'right'}} */
	let { direction } = $props()

	// Cursor-to-tag-center distance
	const OFFSET = 40

	/** @type {number | null} */
	let x = $state(null)
	/** @type {number | null} */
	let y = $state(null)
	/** @type {HTMLElement | undefined} */
	let tagEl = $state()

	/** @param {MouseEvent} e */
	function track(e) {
		x = e.clientX
		y = e.clientY
	}

	// keep the tag inside the viewport horizontally; flip above the cursor near the bottom
	const centerX = $derived.by(() => {
		const half = (tagEl?.offsetWidth ?? 0) / 2
		return Math.max(half, Math.min(x ?? 0, (innerWidth.current ?? 0) - half))
	})

	const centerY = $derived.by(() => {
		const half = (tagEl?.offsetHeight ?? 0) / 2
		const cy = y ?? 0
		return cy + OFFSET + half <= (innerHeight.current ?? 0) ? cy + OFFSET : cy - OFFSET / 2
	})
</script>

<svelte:window onmousemove={track} />

{#if x !== null && y !== null}
	<span class="wrapper" bind:this={tagEl} style:left="{centerX}px" style:top="{centerY}px" aria-hidden="true">
		<span class="tag no-pointer">
			<svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg" class:rotate={direction === 'left'}>
				<path d="M9.75 5.19615L4.64275e-07 10.3923L9.18537e-07 -9.03023e-07L9.75 5.19615Z" />
			</svg>
		</span>
	</span>
{/if}

<style lang="scss">
.wrapper {
	position: fixed;
	transform: translate(-50%, -50%);
	pointer-events: none;
	z-index: 1000;
	padding: var(--sp-15);

	.tag {
		width: max-content;

		@media (pointer: coarse) {
			display: none;
		}
	}

	svg {
		display: block;
		fill: var(--white);

		&.rotate {
			transform: rotate(180deg);
		}
	}
}
</style>
