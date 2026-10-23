<script>
	import Media from '$lib/components/Media.svelte'
	import { revealWidth } from '$lib/utils/transitions.js'

	let { data } = $props()

	const DURATION = 200

	/** @type {string | null | undefined} */
	let hoveredId = $state(null)
</script>

<h1 class="sr-only">All Visible Object</h1>

<ul class="works">
	{#each data.works as work (work._id)}
		<li class="work">
			<a
				href="/works/{work.client?.slug?.current}/{work.slug?.current}"
				onmouseenter={() => (hoveredId = work._id)}
				onmouseleave={() => (hoveredId = null)}
				onfocus={() => (hoveredId = work._id)}
				onblur={() => (hoveredId = null)}
			>
				<Media media={work.thumbnail} class="homepage" width={50}/>
				<div class="tags">
					<span class="tag client">{work.client ? work.client.title : 'Missing client'}</span>
					<span class="tag title">{work.title}</span>
					<!-- {#if hoveredId === work._id}
						<span class="tag view black" in:revealWidth={{ duration: DURATION }} out:revealWidth={{ duration: DURATION }}>View project</span>
					{/if} -->
				</div>
			</a>
		</li>
	{/each}
</ul>

<style lang="scss">
@use '$lib/scss/breakpoints.module' as bp;

.works {
	display: grid;
	grid-template-columns: repeat(2, 1fr);

	.work {
		position: relative;

		a {
			display: block;
			@media (pointer: fine) {
				&:hover {
					:global(.content) {
						transform: scale(1.02);
					}
				}
			}
			&:focus-visible {
				:global(.content) {
					transform: scale(1.02);
				}
			}

			.tags {
				position: absolute;
				inset: var(--sp-15);
				pointer-events: none;
				display: flex;
				justify-content: flex-start;
				align-items: flex-start;
				gap: var(--sp-5);
				// margin-top: 50%;
				// transform: translateY(-50%);
				// height: fit-content;

				.tag {
					position: sticky; //testing fixed tags
					position: relative;
					top: calc(50% - var(--tagHeight)/2);
				}
			}
		}

	}
	@media (width <= #{bp.$sm}) {
		grid-template-columns: repeat(1, 1fr);

		.work {
			a {
				.tags {
					inset: auto var(--sp-15) var(--sp-15) var(--sp-15);
					.tag {
						position: relative;
					}
				}
			}
		}
	}
}

</style>
