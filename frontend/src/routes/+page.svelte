<script>
	import Media from '$lib/components/Media.svelte'

	let { data } = $props()
</script>

<h1 class="sr-only">All Visible Objects</h1>

<!-- project page JS loads once a tile is visible; data still preloads on hover/touch (app.html) -->
<ul class="works" data-sveltekit-preload-code="viewport">
	{#each data.works as work, i (work._id)}
		<li class="work">
			<a href="/works/{work.client?.slug?.current}/{work.slug?.current}">
				<!-- first row is above the fold: load eagerly for a faster LCP -->
				<Media media={work.thumbnail} class="homepage" width={50} eager={i < 2}/>
				<div class="tags">
					<span class="tag client">{work.client ? work.client.title : 'Missing client'}</span>
					<span class="tag title">{work.title}</span>
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
