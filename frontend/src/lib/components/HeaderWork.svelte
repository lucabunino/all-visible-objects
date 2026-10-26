<script>
	import { tick } from 'svelte'
	import { page } from '$app/state'
	import { afterNavigate, beforeNavigate } from '$app/navigation'
	import { browser } from '$app/environment'
	import { getTemplate } from '$lib/utils/template'
	import { revealWidth, PAGE_DURATION } from '$lib/utils/transitions.js'
	import { getGallery } from '$lib/stores/gallery.svelte.js'
	import { innerWidth } from 'svelte/reactivity/window'
	import bp from '$lib/scss/breakpoints.module.scss'

	let { nav = [] } = $props()

	const DURATION = 300
	const STEP = 50
	const TAG_STEP = 0 // stagger between top-level tags
	const TAG_DELAY = PAGE_DURATION // top-level tags reveal once the page transition is done
	const OPEN_DELAY = 150

	const gallery = getGallery()

	const isMobile = $derived(innerWidth.current && innerWidth.current <= parseInt(bp.md))

	const isWork = $derived(getTemplate(page.route.id) === 'work')
	const work = $derived(page.data.work)

	// ---- client dropdown: trimmed single-level copy of Header's Works menu ----

	const navClient = $derived(nav.find((/** @type {any} */ c) => c.slug?.current === page.params.client))

	let clientOpen = $state(false)
	/** @type {HTMLElement | undefined} */
	let headerMenuEl = $state()
	/** @type {HTMLButtonElement | undefined} */
	let clientButtonEl = $state()
	/** @type {HTMLAnchorElement[]} */
	let siblingRefs = $state([])

	/** @type {ReturnType<typeof setTimeout>} */
	let openTimeout

	// immediate tap feedback, see Header.svelte's `pressed`
	/** @type {string | null | undefined} */
	let pressed = $state(null)

	// see Header.svelte's `leaving`: instant tag outros on page change
	let leaving = $state(false)
	beforeNavigate(({ to, willUnload }) => {
		if (to?.route.id && !willUnload) leaving = true
	})
	afterNavigate(() => {
		pressed = null
		tick().then(() => (leaving = false))
	})

	function closeClient() {
		clearTimeout(openTimeout)
		clientOpen = false
		pressed = null
	}

	// mobile: tap toggles (hover/focus opening is desktop-only — Safari doesn't
	// focus buttons on tap, and emulated mouseenter can't toggle closed)
	function toggleClient() {
		if (clientOpen) closeClient()
		else clientOpen = true
		pressed = null
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
						out:revealWidth|global={{ duration: leaving ? 0 : DURATION }}>
							<a class="tag" href="/works/{navClient.slug?.current}/{sibling.slug?.current}"
							bind:this={siblingRefs[i]}
							class:active={sibling.slug?.current === page.params.work || pressed === `work:${sibling.slug?.current}`}
							onpointerdown={() => (pressed = `work:${sibling.slug?.current}`)}
							onpointercancel={() => (pressed = null)}
							onclick={() => (pressed = `work:${sibling.slug?.current}`)}
							aria-current={sibling.slug?.current === page.params.work ? 'page' : undefined}
							onkeydown={(e) => handleSiblingKeydown(e, i)}
							>{sibling.title}</a>
						</li>
					{/each}
					{#if isMobile}
						<li class="work tag-wrapper">
							<button class="tag" type="button" aria-label="Close" onclick={closeClient}
							in:revealWidth|global={{ duration: DURATION, delay: navClient.works.length * STEP }}
							out:revealWidth|global={{ duration: leaving ? 0 : DURATION }}
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
				<div id="client" class="menu-item tag-wrapper" role="none"
				onmouseenter={isMobile ? undefined : openClientHover}
				onmouseleave={isMobile ? undefined : closeClient}
				onfocusin={isMobile ? undefined : openClientHover}
				onfocusout={isMobile ? undefined : handleClientFocusOut}
				in:revealWidth|global={{ duration: DURATION, delay: TAG_DELAY }} out:revealWidth|global={{ duration: leaving ? 0 : DURATION }}>
					<h2><button class="tag" class:no-pointer={!isMobile} class:active={clientOpen || pressed === 'client'} type="button" bind:this={clientButtonEl}
				onpointerdown={isMobile ? () => (pressed = 'client') : undefined}
				onpointercancel={() => (pressed = null)}
				onclick={isMobile ? toggleClient : undefined} onkeydown={handleClientKeydown} aria-haspopup="true" aria-expanded={clientOpen} aria-controls="clientWorks">{navClient.title}</button></h2>
					{@render clientDropdown()}
				</div>
			{/if}
			{#key page.params.work}
				{#if work.title && !gallery.open}
					<div class="tag-wrapper title" in:revealWidth|global={{ duration: DURATION, delay: TAG_DELAY+TAG_STEP*1 }} out:revealWidth|global={{ duration: leaving ? 0 : DURATION }}>
						<h1 class="tag no-pointer">{work.title}</h1>
					</div>
				{/if}
			{/key}
			{#if !gallery.open}
				<div class="tag-wrapper details" in:revealWidth|global={{ duration: DURATION, delay: TAG_DELAY+TAG_STEP*2 }} out:revealWidth|global={{ duration: leaving ? 0 : DURATION }}>
					<a href="#details" class="tag black" onclick={scrollToDetails}>Details +</a>
				</div>
			{/if}
			<div class="tag-wrapper close" in:revealWidth|global={{ duration: DURATION, delay: TAG_DELAY+TAG_STEP*3 }} out:revealWidth|global={{ duration: leaving ? 0 : DURATION }}>
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
				flex-shrink: 0;

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

			// in the flex row (not fixed) so the title shrinks + ellipsizes before
			// reaching it. Pushed right by a growing spacer, not margin-left: auto —
			// revealWidth animates the measured margin, so auto made Close slide in
			&::before {
				content: '';
				order: 1;
				flex: 1 1 0;
			}

			.close {
				position: relative;
				z-index: 101;
				order: 2;
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
