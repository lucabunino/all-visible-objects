<script>
	import { tick } from 'svelte'
	import { scrollY, innerWidth } from 'svelte/reactivity/window'
	import { page } from '$app/state'
	import { afterNavigate } from '$app/navigation'
	import { getTemplate } from '$lib/utils/template'
	import { revealWidth } from '$lib/utils/transitions.js'
	import { getGallery } from '$lib/stores/gallery.svelte.js'
	import bp from '$lib/scss/breakpoints.module.scss'

	let { nav = [], about } = $props()

	const gallery = getGallery()

	const isMobile = $derived(innerWidth.current && innerWidth.current <= parseInt(bp.md))

	const showNav = $derived(getTemplate(page.route.id) !== 'work')

	// header hides while actively scrolling down, reappears only while
	// actively scrolling up (idle/tiny jitter changes nothing, avoiding
	// interrupted/restarted out-transitions) — always visible at the very
	// top of the page, and disabled entirely on work pages (isWork =
	// !showNav), where HeaderWork's own row takes over
	const SCROLL_THRESHOLD = 50 // ignore direction this close to the top
	const SCROLL_DELTA = 10 // minimum movement before a direction change registers
	let lastScrollY = $state(0)
	let headerVisible = $state(true)

	$effect(() => {
		const y = scrollY.current ?? 0
		if (!showNav || y <= 0) {
			headerVisible = true
			lastScrollY = y
			return
		}
		const delta = y - lastScrollY
		if (delta > SCROLL_DELTA && y > SCROLL_THRESHOLD) {
			headerVisible = false
			lastScrollY = y
		} else if (delta < -SCROLL_DELTA) {
			headerVisible = true
			lastScrollY = y
		}
	})

	afterNavigate(() => closeAll())

	const DURATION = 300
	const STEP = 50
	const OPEN_DELAY = 150

	let worksOpen = $state(false)
	/** @type {string | null | undefined} */
	let activeClientSlug = $state(null)
	/** @type {HTMLElement | undefined} */
	let headerEl = $state()
	/** @type {HTMLElement | undefined} */
	let navEl = $state()
	/** @type {HTMLButtonElement | undefined} */
	let worksButtonEl = $state()
	/** @type {HTMLButtonElement[]} */
	let clientRefs = $state([])
	/** @type {HTMLAnchorElement[]} */
	let workRefs = $state([])

	let activeClient = $derived(nav.find((c) => c.slug?.current === activeClientSlug))

	function closeAll() {
		clearTimeout(openTimeout)
		worksOpen = false
		activeClientSlug = null
	}

	// ---- mouseover mode: exactly how it worked before any click-mode work ----

	/** @type {ReturnType<typeof setTimeout>} */
	let openTimeout

	function openWorksHover() {
		clearTimeout(openTimeout)
		openTimeout = setTimeout(() => {
			worksOpen = true
		}, OPEN_DELAY)
	}

	function closeWorksHover() {
		closeAll()
	}

	/** focusout fires when the Works button loses focus to a client button
	 * (both inside the same <li>) — e.g. our own ArrowDown handler moving
	 * focus in. Unlike mouseleave, keyboard focus jumps genuinely move focus
	 * within the subtree, so this needs to check whether it actually left
	 * before closing, deferred to the next paint for cross-browser reliability. */
	/** @param {FocusEvent & {currentTarget: HTMLElement}} e */
	function handleWorksFocusOut(e) {
		const li = e.currentTarget
		requestAnimationFrame(() => {
			if (!li.contains(document.activeElement)) closeAll()
		})
	}

	// ---- click mode: minimal, click-to-select + click-outside-to-close ----

	// mousedown fires before focus, so this captures true prior state —
	// toggleWorksClick then toggles off that, not off the live worksOpen
	// (which onfocus may have just flipped true on this same interaction)
	let worksOpenBeforeInteraction = false

	function captureWorksOpenState() {
		worksOpenBeforeInteraction = worksOpen
	}

	function toggleWorksClick() {
		worksOpen = !worksOpenBeforeInteraction
		if (!worksOpen) activeClientSlug = null
	}

	/** @param {MouseEvent} e */
	function handleWindowClick(e) {
		if (!isMobile || !worksOpen) return
		if (e.target instanceof Node && !navEl?.contains(e.target)) closeAll()
	}

	// ---- keyboard: finder-column nav, same in both modes ----

	function focusWorksButton() {
		worksOpen = true
	}

	/** @param {KeyboardEvent} e */
	function handleWorksKeydown(e) {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			worksOpen = true
			tick().then(() => clientRefs[0]?.focus())
		}
	}

	/** @param {KeyboardEvent} e @param {number} i @param {string | undefined} slug */
	async function handleClientKeydown(e, i, slug) {
		if (e.key === 'ArrowUp' && i === 0) {
			e.preventDefault()
			activeClientSlug = null
			worksButtonEl?.focus()
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			clientRefs[i - 1]?.focus()
		} else if (e.key === 'ArrowDown') {
			e.preventDefault()
			clientRefs[i + 1]?.focus()
		} else if (e.key === 'ArrowRight' || e.key === ' ') {
			e.preventDefault()
			activeClientSlug = slug
			await tick()
			workRefs[0]?.focus()
		} else if (e.key === 'Escape') {
			e.preventDefault()
			closeAll()
			worksButtonEl?.focus()
		}
	}

	/** @param {KeyboardEvent} e @param {number} i */
	function handleWorkKeydown(e, i) {
		if (e.key === 'ArrowUp') {
			e.preventDefault()
			workRefs[i - 1]?.focus()
		} else if (e.key === 'ArrowDown') {
			e.preventDefault()
			workRefs[i + 1]?.focus()
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault()
			clientRefs.find((el) => el?.getAttribute('data-slug') === activeClientSlug)?.focus()
		} else if (e.key === 'Escape') {
			e.preventDefault()
			closeAll()
			worksButtonEl?.focus()
		}
	}

	// left/right between top-level header items (logo, Works, About,
	// Instagram/Play). Delegated on the header — bubbled events from inside
	// the clients/works columns won't match any top-level item (they're not
	// direct children of #logo or a .menu-item), so this only fires for them.
	/** @param {KeyboardEvent} e */
	function handleTopLevelKeydown(e) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
		if (!(e.target instanceof HTMLElement)) return
		const items = Array.from(headerEl?.querySelectorAll('#logo, .menu-item > .tag') ?? [])
		const currentIndex = items.indexOf(e.target)
		if (currentIndex === -1) return
		e.preventDefault()
		const nextIndex = e.key === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1
		if (items[nextIndex] instanceof HTMLElement) items[nextIndex].focus()
	}
</script>

<svelte:window onclick={handleWindowClick} />

{#snippet worksDropdown()}
	{#if worksOpen}
		{#if isMobile}
			<div class="backdrop" aria-hidden="true"></div>
		{/if}
		<div id="clients">
			<ul role="menu" aria-label="Clients" class="clients overflow-y" class:mobileHidden={isMobile && activeClient}>
				{#key isMobile && activeClientSlug === null}
				{#each nav as client, i (client.slug?.current)}
					<li role="none" class="client tag-wrapper">
						<button class="tag" class:no-pointer={!isMobile} type="button" role="menuitem"
						bind:this={clientRefs[i]}
						data-slug={client.slug?.current}
						in:revealWidth|global={{ duration: DURATION, delay: i * STEP }}
						out:revealWidth|global={{ duration: worksOpen ? 0 : DURATION }}
						class:active={activeClientSlug === client.slug?.current}
						class:inactive={activeClient && activeClientSlug !== client.slug?.current}
						aria-expanded={activeClientSlug === client.slug?.current}
						onmouseenter={() => !isMobile && (activeClientSlug = client.slug?.current)}
						onclick={() => (activeClientSlug = client.slug?.current)}
						onfocus={() => (activeClientSlug = client.slug?.current)}
						onkeydown={(e) => handleClientKeydown(e, i, client.slug?.current)}
						>
							<span class="title">{client.title}</span>
							{#if activeClientSlug === client.slug?.current}
								<span class="length">{String(client.works.length).padStart(2, '0')}</span>
							{/if}
						</button>
					</li>
				{/each}
				{#if isMobile}
					<li class="tag-wrapper">
						<button class="tag" type="button" aria-label="Close" onclick={closeAll}
						in:revealWidth|global={{ duration: DURATION, delay: nav.length * STEP }}
						out:revealWidth|global={{ duration: worksOpen ? 0 : DURATION }}
						>× Close</button>
					</li>
				{/if}
				{/key}
			</ul>
			{#if activeClient}
				<ul class="works overflow-y" aria-label="Works for {activeClient.title}">
					{#each activeClient.works as work, i (work.slug?.current)}
						<li class="work tag-wrapper">
							<a class="tag" href="/works/{activeClient.slug?.current}/{work.slug?.current}"
							bind:this={workRefs[i]}
							onkeydown={(e) => handleWorkKeydown(e, i)}
							in:revealWidth|global={{ duration: DURATION, delay: i * STEP }}
							out:revealWidth|global={{ duration: activeClient ? 0 : DURATION }}
							>
							{work.title}</a>
						</li>
					{/each}
					{#if isMobile}
						<li class="work tag-wrapper">
							<button class="tag" type="button" aria-label="Back" onclick={() => (activeClientSlug = null)}
							in:revealWidth|global={{ duration: DURATION, delay: activeClient.works.length * STEP }}
							out:revealWidth|global={{ duration: activeClient ? 0 : DURATION }}
							>← Back</button>
						</li>
					{/if}
				</ul>
			{/if}
		</div>
	{/if}
{/snippet}

{#if headerVisible}
	<header>
		<div style:display="contents" role="menubar" tabindex="-1" bind:this={headerEl} onkeydown={handleTopLevelKeydown}>
			{#if !gallery.open && !(isMobile && !showNav)}
				<a id="logo" class="tag" href="/"
				in:revealWidth|global={{ duration: DURATION, delay: DURATION }}
				out:revealWidth|global={{ duration: DURATION }}>All Visible Objects</a>
			{/if}
			<nav aria-label="Main" id="menu" style:--clientsCount={nav.length}>
				<ul class="menu" bind:this={navEl}>
					{#if showNav && !isMobile}
						<li id="works" class="menu-item tag-wrapper" onmouseenter={openWorksHover} onmouseleave={closeWorksHover} onfocusin={openWorksHover} onfocusout={handleWorksFocusOut}
						in:revealWidth|global={{ duration: DURATION, delay: DURATION }}
						out:revealWidth|global={{ duration: DURATION }}>
							<button class="tag no-pointer" class:active={worksOpen} type="button" bind:this={worksButtonEl} onkeydown={handleWorksKeydown} aria-haspopup="true" aria-expanded={worksOpen} aria-controls="clients">Works</button>
							{@render worksDropdown()}
						</li>
					{:else if showNav}
						<li id="works" class="menu-item tag-wrapper"
						in:revealWidth|global={{ duration: DURATION, delay: DURATION }}
						out:revealWidth|global={{ duration: DURATION }}>
							<button class="tag" class:active={worksOpen} type="button" bind:this={worksButtonEl} onmousedown={captureWorksOpenState} onclick={toggleWorksClick} onfocus={focusWorksButton} onkeydown={handleWorksKeydown} aria-haspopup="true" aria-expanded={worksOpen} aria-controls="clients">Works</button>
							{@render worksDropdown()}
						</li>
					{/if}
					{#if showNav}
						<li class="menu-item about tag-wrapper"
						in:revealWidth|global={{ duration: DURATION, delay: DURATION+STEP*1 }}
						out:revealWidth|global={{ duration: DURATION }}>
							<a class="tag" href="/about">About</a>
						</li>
					{/if}
					{#if about.instagram?.href && showNav}
						<li class="menu-item instagram tag-wrapper"
						in:revealWidth|global={{ duration: DURATION, delay: DURATION }}
						out:revealWidth|global={{ duration: DURATION }}>
							<a class="tag" href={about.instagram.href} target="_blank" rel="noopener noreferrer">{about.instagram.handle}</a>
						</li>
					{/if}
				</ul>
			</nav>
		</div>
	</header>
{/if}

<style lang="scss">
@use '$lib/scss/breakpoints.module' as bp;

header {
	position: fixed;
	z-index: 10;
	inset: var(--sp-15) var(--sp-15) auto var(--sp-15);
	display: grid;
	align-items: start;
	grid-template-columns: repeat(12, 1fr);
	gap: var(--sp-15);
	pointer-events: none;

	.tag,
	#works {
		pointer-events: all;
	}

	#logo {
		position: fixed;
		top: var(--sp-15);
		left: var(--sp-15);
		z-index: 101;
		width: fit-content;
	}

	#menu {
		grid-column: 3 / span 10;

		.menu {
			display: flex;

			> *:not(:first-child) {
				margin-left: var(--sp-5);
			}

			#works {

				#clients {
					position: relative;

					.tag {
						width: var(--worksWidth);
						white-space: pre;
					}

					.clients {
						position: absolute;
						display: flex;
						flex-direction: column;
						row-gap: var(--sp-5);
						padding: var(--sp-5) 0;
						max-height: calc(100vh - var(--tagHeight) - var(--sp-15));

						&.mobileHidden {
							display: none;
						}

						.client {
							button {
								display: flex;
								justify-content: space-between;
							}
						}
					}

					.works {
						position: absolute;
						padding: var(--sp-5) calc(var(--worksWidth) + var(--sp-5));
						z-index: -1;
						display: flex;
						flex-direction: column;
						row-gap: var(--sp-5);
						min-height: calc(var(--clientsCount)*var(--tagHeight) + var(--clientsCount)*var(--sp-5));
						max-height: calc(100vh - var(--tagHeight) - var(--sp-15));

						.work {
							display: contents;
						}
					}
				}
			}

			.instagram {
				position: fixed;
				top: var(--sp-15);
				right: var(--sp-15);
				z-index: 101;
				margin-left: 0;
			}
		}
	}

	@media (width <= #{bp.$md}) {
		display: flex;
		gap: var(--sp-5);
		justify-content: space-between;
		pointer-events: all;

		.backdrop {
			position: fixed;
			inset: 0;
			background: transparent;
			pointer-events: all;
		}

		#logo {
			position: relative;
			top: unset;
			left: unset;
		}

		#menu {
			display: contents;

			.menu {
				gap: var(--sp-5);
				
				> *:not(:first-child) {
					margin-left: unset;
				}

				#works {
					#clients {
						.tag {
							width: calc(100vw - var(--sp-30));
							white-space: pre;
						}

						.clients {
							position: fixed;
							left: var(--sp-15);
							row-gap: var(--sp-8);
							padding-top: var(--sp-8);
						}

						.works {
							position: fixed;
							left: var(--sp-15);
							padding: var(--sp-8) 0 var(--sp-5);
							row-gap: var(--sp-8);
							z-index: 1;
							// display: flex;
							// flex-direction: column;
							// row-gap: var(--sp-5);
							// min-height: calc(var(--clientsCount)*var(--tagHeight) + var(--clientsCount)*var(--sp-5));
							// max-height: calc(100vh - var(--tagHeight) - var(--sp-15));

							.work {
								display: contents;
							}
						}
					}
				}

				.instagram {
					display: none;
				}
			}
		}
	}
}
</style>
