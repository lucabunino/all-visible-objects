<script>
	import { onMount } from 'svelte'
	import { fly } from 'svelte/transition'

	let { policies = [] } = $props()

	let visible = $state(false)

	onMount(() => {
		if (!localStorage.getItem('cookie-consent')) {
			visible = true
		}
	})

	function accept() {
		localStorage.setItem('cookie-consent', 'accepted')
		visible = false
	}

	const cookiesPolicy = $derived(policies.find((p) => p._id === 'cookies'))
	const privacyPolicy = $derived(policies.find((p) => p._id === 'privacy'))
</script>

{#if visible}
	<div id="cookie-banner" role="dialog" aria-label="Cookie consent" aria-modal="false" in:fly={{ y: 20, duration: 400 }}>
		<p>
			This website uses only technical cookies, which are necessary for its proper functioning. No profiling or third-party cookies are used. For more details, please consult our
			{#if cookiesPolicy}<a href="/policy/{cookiesPolicy.slug?.current}">cookies</a>{:else}cookies{/if}
			and
			{#if privacyPolicy}<a href="/policy/{privacyPolicy.slug?.current}">privacy</a>{:else}privacy{/if}
			policies.
		</p>
		<button class="tag black" type="button" onclick={accept}>Ok, I understand</button>
	</div>
{/if}

<style lang="scss">
	@use '$lib/scss/breakpoints.module' as bp;

	#cookie-banner {
		position: fixed;
		bottom: var(--sp-15);
		left: var(--sp-15);
		z-index: 20;
		display: flex;
		flex-direction: column;
		gap: var(--sp-20);
		max-width: 33rem;
		padding: var(--sp-8);
		color: var(--white);
		background-color: var(--tagBg);
		backdrop-filter: blur(var(--blur));
		isolation: isolate;
		mix-blend-mode: normal;
		will-change: backdrop-filter, transform;
		user-select: none;
		transform: translateZ(0);
		backface-visibility: hidden;
		cursor: pointer;
		border-radius: 3px;

		a {
			color: inherit;
			text-decoration: underline;

			&:hover {
				color: var(--gray-light);
			}
		}

		button {
			width: fit-content;
		}

		@media (width <= #{bp.$md}) {
			max-width: unset;
			left: 0;
			right: 0;
			bottom: 0;
			padding: var(--sp-15);
			border-radius: 0;
		}
	}
</style>
