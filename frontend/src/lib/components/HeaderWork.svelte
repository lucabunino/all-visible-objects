<script>
	import { tick } from 'svelte'
	import { page } from '$app/state'
	import { browser } from '$app/environment'
	import { getTemplate } from '$lib/utils/template'
	import { revealWidth } from '$lib/utils/transitions.js'
	import { getGallery } from '$lib/stores/gallery.svelte.js'
	import { innerWidth } from 'svelte/reactivity/window'
	import bp from '$lib/scss/breakpoints.module.scss'

	let { nav = [] } = $props()

	const DURATION = 300
	const STEP = 50
	const OPEN_DELAY = 150

	const gallery = getGallery()

	const isMobile = $derived(innerWidth.current && innerWidth.current <= parseInt(bp.md))

	const isWork = $derived(getTemplate(page.route.id) === 'work')
	const work = $derived(page.data.work)
	const galleryMedia = $derived(
		/** @type {any[]} */ (work?.blocks ?? [])
			.flatMap((/** @type {any} */ block) => block.items ?? [])
			.filter((/** @type {any} */ item) => item._type === 'mediaItem')
	)

	// ---- client dropdown: trimmed single-level copy of Header's Works menu ----

	const navClient = $derived(nav.find((/** @type {any} */ c) => c.slug?.current === page.params.client))

	let clientOpen = $state(false)
	/** @type {HTMLElement | undefined} */
	let headerMenuEl = $state()
	/** @type {HTMLElement | undefined} */
	let clientWrapperEl = $state()
	/** @type {HTMLButtonElement | undefined} */
	let clientButtonEl = $state()
	/** @type {HTMLAnchorElement[]} */
	let siblingRefs = $state([])

	/** @type {ReturnType<typeof setTimeout>} */
	let openTimeout

	function closeClient() {
		clearTimeout(openTimeout)
		clientOpen = false
	}

	function openClientHover() {
		clearTimeout(openTimeout)
		openTimeout = setTimeout(() => {
			clientOpen = true
		}, OPEN_DELAY)
	}

	/** see Header.svelte's handleWorksFocusOut — same next-paint containment check */
	/** @param {FocusEvent & {currentTarget: HTMLElement}} e */
	function handleClientFocusOut(e) {
		const wrapper = e.currentTarget
		requestAnimationFrame(() => {
			if (!wrapper.contains(document.activeElement)) closeClient()
		})
	}

	/** @param {KeyboardEvent} e */
	function handleClientKeydown(e) {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			clientOpen = true
			tick().then(() => siblingRefs[0]?.focus())
		}
	}

	/** @param {KeyboardEvent} e @param {number} i */
	function handleSiblingKeydown(e, i) {
		if (e.key === 'ArrowUp' && i === 0) {
			e.preventDefault()
			clientButtonEl?.focus()
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			siblingRefs[i - 1]?.focus()
		} else if (e.key === 'ArrowDown') {
			e.preventDefault()
			siblingRefs[i + 1]?.focus()
		} else if (e.key === 'Escape') {
			e.preventDefault()
			closeClient()
			clientButtonEl?.focus()
		}
	}

	// left/right between top-level work-header tags (client, Details +, Play,
	// Close) — delegated like Header's menubar roving; dropdown links live
	// deeper than the :scope selectors reach, so they never match.
	/** @param {KeyboardEvent} e */
	function handleTopLevelKeydown(e) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
		if (!(e.target instanceof HTMLElement)) return
		const items = Array.from(headerMenuEl?.querySelectorAll(':scope > div > h2 > .tag, :scope > .tag-wrapper:not(.title) > .tag') ?? [])
		const currentIndex = items.indexOf(e.target)
		if (currentIndex === -1) return
		e.preventDefault()
		const nextIndex = e.key === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1
		if (items[nextIndex] instanceof HTMLElement) items[nextIndex].focus()
	}

	/** @param {MouseEvent} e */
	function scrollToDetails(e) {
		if (!browser) return
		e.preventDefault()
		document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' })
	}

	/** @param {MouseEvent} e */
	function handleCloseClick(e) {
		if (!gallery.open) return
		e.preventDefault()
		gallery.closeGallery()
	}

	// the dropdown persists across same-client work navigation (that's the
	// whole point of hoisting this component out of the remounting page) —
	// it only auto-closes once the client itself actually changes.
	let lastClientSlug = page.params.client
	$effect(() => {
		if (page.params.client !== lastClientSlug) {
			closeClient()
			lastClientSlug = page.params.client
		}
	})
</script>

{#if isWork && work}
	{#snippet clientDropdown()}
		{#if clientOpen && navClient}
			<div id="clientWorks">
				<ul class="works overflow-y" aria-label="Works for {navClient.title}">
					{#each navClient.works as sibling, i (sibling.slug?.current)}
						<li class="work tag-wrapper"
						in:revealWidth|global={{ duration: DURATION, delay: i * STEP }}
						out:revealWidth|global={{ duration: DURATION }}>
							<a class="tag" href="/works/{navClient.slug?.current}/{sibling.slug?.current}"
							bind:this={siblingRefs[i]}
							class:active={sibling.slug?.current === page.params.work}
							aria-current={sibling.slug?.current === page.params.work ? 'page' : undefined}
							onkeydown={(e) => handleSiblingKeydown(e, i)}
							>{sibling.title}</a>
						</li>
					{/each}
					{#if isMobile}
						<li class="work tag-wrapper">
							<button class="tag" type="button" aria-label="Close" onclick={closeClient}
							in:revealWidth|global={{ duration: DURATION, delay: navClient.works.length * STEP }}
							out:revealWidth|global={{ duration: DURATION }}
							>× Close</button>
						</li>
					{/if}
				</ul>
			</div>
		{/if}
	{/snippet}

	<header>
		<div class="menu" role="menubar" tabindex="-1" bind:this={headerMenuEl} onkeydown={handleTopLevelKeydown}>
			{#if navClient && !gallery.open}
				<div id="client" class="menu-item tag-wrapper" role="none" bind:this={clientWrapperEl} onmouseenter={openClientHover} onmouseleave={closeClient} onfocusin={openClientHover} onfocusout={handleClientFocusOut}
				in:revealWidth|global={{ duration: DURATION, delay: DURATION }} out:revealWidth|global={{ duration: DURATION }}>
					<h2><button class="tag no-pointer" class:active={clientOpen} type="button" bind:this={clientButtonEl} onkeydown={handleClientKeydown} aria-haspopup="true" aria-expanded={clientOpen} aria-controls="clientWorks">{navClient.title}</button></h2>
					{@render clientDropdown()}
				</div>
			{/if}
			{#key page.params.work}
				{#if work.title && !gallery.open}
					<div class="tag-wrapper title" in:revealWidth|global={{ duration: DURATION, delay: DURATION+STEP*1 }} out:revealWidth|global={{ duration: DURATION }}>
						<h1 class="tag no-pointer">{work.title}</h1>
					</div>
				{/if}
			{/key}
			{#if !gallery.open}
				<div class="tag-wrapper details" in:revealWidth|global={{ duration: DURATION, delay: DURATION+STEP*2 }} out:revealWidth|global={{ duration: DURATION }}>
					<a href="#details" class="tag black" onclick={scrollToDetails}>Details +</a>
				</div>
			{/if}
			<!-- {#if galleryMedia.length && !gallery.open}
				<div class="tag-wrapper" in:revealWidth|global={{ duration: DURATION, delay: DURATION }} out:revealWidth|global={{ duration: DURATION }}>
					<button class="tag play" type="button" onclick={() => gallery.openGallery()}>Play
						<svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M9.75 5.19615L4.64275e-07 10.3923L9.18537e-07 -9.03023e-07L9.75 5.19615Z"/>
						</svg>
					</button>
				</div>
			{/if} -->
			<div class="tag-wrapper close" in:revealWidth|global={{ duration: DURATION, delay: DURATION }} out:revealWidth|global={{ duration: DURATION }}>
				<a class="tag" href="/" onclick={handleCloseClick} aria-label={gallery.open ? 'Close gallery' : 'Close'}>Close</a>
			</div>
		</div>
	</header>
{/if}

<style lang="scss">
	@use '$lib/scss/breakpoints.module' as bp;

	header {
		position: fixed;
		z-index: 11;
		inset: var(--sp-15) var(--sp-15) auto var(--sp-15);
		display: grid;
		align-items: start;
		grid-template-columns: repeat(12, 1fr);
		gap: var(--sp-15);
		pointer-events: none;

		.menu {
			grid-column: 3 / span 10;
			display: flex;
			align-items: start;
			min-width: 0;

			> *:not(:first-child) {
				margin-left: var(--sp-5);
			}

			.tag {
				pointer-events: all;
			}
			
			.title { flex-shrink: 2; white-space: pre; }
			.details { white-space: pre; }

			#client {
				pointer-events: all;
				flex-shrink: 1;
				min-width: 0;

				#clientWorks {
					position: relative;

					.tag {
						width: var(--worksWidth);
						white-space: pre;
					}

					.works {
						position: absolute;
						display: flex;
						flex-direction: column;
						row-gap: var(--sp-5);
						padding: var(--sp-5) 0;
						max-height: calc(100vh - var(--tagHeight) - var(--sp-15));
					}
				}
			}

			.close {
				position: fixed;
				top: var(--sp-15);
				right: var(--sp-15);
				z-index: 101;
			}

			.play {
				display: flex;
				column-gap: var(--sp-7);

				svg {
					fill: var(--white);
				}
			}
		}

		@media (width <= #{bp.$md}) {
			.menu {
				grid-column: 1 / span 12;

				.details { 
					display: none;
				}
				#client {
					#clientWorks {
						.tag {
							width: calc(100vw - var(--sp-30));
						}

						.works {
							row-gap: var(--sp-8);
							padding-top: var(--sp-8);
						}
					}
				}
			}
		}
	}
</style>
