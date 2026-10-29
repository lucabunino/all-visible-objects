<script>
	/** @type {{about: any, policies?: any[], fill?: boolean}} */
	let { about, policies = [], fill = false } = $props()
	let scrollY = $state(0)
</script>

<svelte:window bind:scrollY />

<footer class:fill>
	{#if about.email}
		<a class="talk tag" href="mailto:{about.email}">A new project in mind? Let’s talk.</a>
	{/if}
	<div class="footer">
		<p class="year">© {new Date().getFullYear()} All Visible Objects</p>
		{#if about.instagram?.href}
			<a class="instagram tag black" href={about.instagram.href} target="_blank" rel="noopener noreferrer">{about.instagram.handle}</a>
		{/if}
		{#if about.email}
			<a class="email tag black" href="mailto:{about.email}">Email us</a>
		{/if}
		<div class="break"></div>
		{#each policies as policy (policy.slug?.current)}
			<a class="tag" href="/policy/{policy.slug?.current}">{policy.title}</a>
		{/each}
		<button class="tag scroll" type="button" onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Scroll to top" disabled={scrollY === 0}>↑</button>
	</div>
</footer>


<style lang="scss">
@use '$lib/scss/breakpoints.module' as bp;

footer {
	display: flex;
	flex-direction: column;
	padding: var(--sp-15);
	margin-top: auto;
	color: var(--black);
	background-color: var(--white);

	.talk {
		flex-basis: 100%;
		margin: var(--sp-200) auto;
		width: fit-content;
		color: var(--black);
		background-color: var(--gray-subtle);

		@media (pointer: fine) {&:hover {
			color: var(--white);
		}}
	}

	.footer {
		display: flex;
		flex-wrap: wrap;
		column-gap: var(--sp-5);
		align-items: baseline;
		
		.break {
			display: none;
		}

		.year {
			margin-right: auto;
		}
	}

	@media (width <= #{bp.$md}) {
		.talk {
			margin: var(--sp-145) auto var(--sp-160);
		}
		.footer {
			.year {
				order: 5;
				flex-basis: 100%;
				margin-top: var(--sp-10);
			}
			.scroll {
				margin-left: auto;
			}
		}
	}
	// fill (work pages): grows into the parent's leftover height; the "Let's
	// talk" tag centres in it via auto margins, never closer than the min gap
	&.fill {
		flex: 1;
		padding-top: var(--sp-60);
		row-gap: var(--sp-60);

		.talk {
			flex-basis: auto;
			margin: auto;
		}
	}

	@media (width <= #{bp.$xxs}) {
		.footer {
			.break {
				display: block;
				flex-basis: 100%;
				margin-bottom: var(--sp-5);
			}
			.year {
				margin-top: var(--sp-15);
			}
		}
	}
}
</style>