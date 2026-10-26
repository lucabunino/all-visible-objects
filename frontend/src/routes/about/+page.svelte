<script>
	import { PortableText } from '@portabletext/svelte'
	import PortableTextStyle from '$lib/components/PortableTextStyle.svelte'
	import Media from '$lib/components/Media.svelte'
	import { fadeBlur } from '$lib/utils/transitions.js'
    import { fade } from 'svelte/transition';

	let { data } = $props()

	const DURATION = 500
	const DELAY = 3000

	let imageIndex = $state(0)
	$effect(() => {
		const images = data.about.images
		if (!images?.length) return
		const interval = setInterval(() => {
			imageIndex = (imageIndex + 1) % images.length
		}, DELAY)
		return () => clearInterval(interval)
	})
</script>

<article>
	<h1 class="sr-only">About</h1>
	{#if data.about.description}
		<div class="portableText about su-m">
			<PortableText value={data.about.description} components={{ block: PortableTextStyle, types: { break: PortableTextStyle }, marks: { link: PortableTextStyle } }} />
		</div>
	{/if}

	{#if data.about.capabilities?.length || data.about.commissions?.length || data.about.clients?.length}
		<div class="info">
			{#if data.about.capabilities?.length}
				<div class="capabilities">
					<h2 class="title">Capabilities</h2>
					<ul>
						{#each data.about.capabilities as capability (capability._key)}
							<li class="capability">{capability.title}</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if data.about.clients?.length}
				<div class="clients">
					<h2 class="title">Clients</h2>
					<ul>
						{#each data.about.clients as clientRef (clientRef._key)}
							<li class="client">{clientRef.title}</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if data.about.commissions?.length}
				<div class="commissions">
					<h2 class="title">Commissions and General Enquiries</h2>
					<ul>
						{#each data.about.commissions as commission (commission._key)}
							<li class="commission"><a class="hover-gray" href={commission.href}>{commission.label}</a></li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}
	{#if data.about.images?.length}
		<ul class="images">
			<li class="image">
				{#key imageIndex}
					<div class="frame" in:fadeBlur={{ duration: DURATION }} out:fade={{ duration: DURATION, delay: DURATION }}>
						<Media media={data.about.images[imageIndex]} />
					</div>
				{/key}
			</li>
		</ul>
	{/if}
	<div class="disclaimer">
		<p class="permission">Contents may not be reproduced without the permission of All Visible Objects.</p>
		<p class="copyright">© {new Date().getFullYear()} All Visible Objects</p>
	</div>
</article>

<style lang="scss">
@use '$lib/scss/breakpoints.module' as bp;

article {
	display: grid;
	grid-template-columns: repeat(24, 1fr);
	column-gap: var(--sp-15);
	row-gap: var(--sp-50);
	padding: calc(var(--sp-15) + var(--tagHeight) + var(--sp-20)) var(--sp-15) var(--sp-15);
	min-height: 100svh;
	align-content: space-between;
	color: var(--black);

	.title {
		color: var(--gray-light);
		margin-bottom: var(--sp-4);
	}

	.about {
		grid-column: 1 / span 16;
		padding-right: var(--sp-50);
	}

	.info {
		grid-column: 17 / span 8;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		column-gap: var(--sp-15);
		row-gap: var(--sp-50);

		.capabilities {
			grid-column: 1 / span 2;
		}
		.clients {
			grid-column: 3 / span 2;
		}
		.commissions {
			grid-column: 1 / span 4;
		}
	}
	.images {
		grid-column: 1 / span 4;

		.image {
			position: relative;
			aspect-ratio: 3 / 4;
			overflow: hidden;
			border-radius: 3px;

			.frame {
				position: absolute;
				inset: 0;
			}

			:global(.media-container) {
				width: 100%;
				height: 100%;
				aspect-ratio: auto;
			}
			:global(img),
			:global(video) {
				object-fit: cover;
			}
		}
	}
	.disclaimer {
		grid-column: 17 / span 8;
		margin-top: auto;
		color: var(--gray-light);
		
		p {
			display: inline;
		}

		.copyright {
			white-space: nowrap;
		}
	}

	@media (width <= #{bp.$xxl}) {
		.about {
			grid-column: 1 / span 15;
		}
		.info,
		.disclaimer {
			grid-column: 16 / span 9;
		}
	}
	@media (width <= #{bp.$xl}) {
		.images {
			grid-column: 1 / span 6;
		}
	}
	@media (width <= #{bp.$lg}) {
		row-gap: 0;
		.about {
			grid-column: 1 / span 24;
		}
		.info {
			margin-top: var(--sp-65);
			grid-column: 1 / span 24;
			row-gap: var(--sp-25);
		}
		.images {
			margin-top: var(--sp-72);
			grid-column: 1 / span 8;
		}
		.disclaimer {
			grid-column: 13 / span 12;
		}
	}
	@media (width <= #{bp.$md}) {
		column-gap: 0;
		.about {
			padding-right: unset;
		}
		.info {
			row-gap: var(--sp-30);
		}
		.images {
			grid-column: 1 / span 24;
		}
		.disclaimer {
			margin-top: var(--sp-30);
			grid-column: 1 / span 24;
		}
	}
	@media (width <= #{bp.$xs}) {
		.info {
			.capabilities,
			.clients,
			.commissions {
				grid-column: 1 / span 4;
			}
		}
	}
}
</style>