<script>
	import { PortableText } from '@portabletext/svelte'
	import PortableTextStyle from '$lib/components/PortableTextStyle.svelte'
	import Media from '$lib/components/Media.svelte'
	import Gallery from '$lib/components/Gallery.svelte'
	import CursorTag from '$lib/components/CursorTag.svelte'
	import { pageIn, pageOut } from '$lib/utils/transitions.js'
	import { getGallery } from '$lib/stores/gallery.svelte.js'
	import { urlFor, gallerySrcset, gallerySizes } from '$lib/utils/image.js'
	import { page } from '$app/state'

	let { data } = $props()
	let hoveredBlock = $state(false)
	const gallery = getGallery()
	const DURATION = 300

	$effect(() => {
		gallery.setOpen(!!page.state.gallery)
	})

	const galleryMedia = $derived(
		/** @type {any[]} */ (data.work.blocks ?? [])
			.flatMap((/** @type {any} */ block) => block.items ?? [])
			.filter((/** @type {any} */ item) => item._type === 'mediaItem')
	)

	/** @param {() => string | undefined} fn */
	function safely(fn) {
		try {
			return fn()
		} catch {
			return undefined
		}
	}
</script>

<svelte:head>
	{#each galleryMedia as item (item._key)}
		{#if item.image}
			<link
				rel="preload"
				as="image"
				href={safely(() => urlFor(item.image)?.height(1200).url())}
				imagesrcset={gallerySrcset(item.image, item.aspectRatio || 1)}
				imagesizes={gallerySizes()}
			/>
		{/if}
	{/each}
</svelte:head>

{#if gallery.open && galleryMedia.length}
	<div class="gallery-wrapper" in:pageIn={{ fixed: true, duration: DURATION }} out:pageOut={{ fixed: true, duration: DURATION}}>
		<Gallery media={galleryMedia} />
	</div>
{/if}

<article>
	{#if data.work.blocks}
		<section id="blocks">
			{#each data.work.blocks || [] as block (block._key)}
				<div class="blocks">
					{#each block.items || [] as item (item._key)}
						<div class="block {item._type} {item._type == 'textItem' ? 'portableText su-m' : undefined}">
							{#if item._type === 'mediaItem'}
								<button
									type="button"
									class="media-trigger"
									onclick={() => gallery.openGallery(galleryMedia.findIndex((m) => m._key === item._key))}
									onmouseenter={() => (hoveredBlock = true)}
									onmouseleave={() => (hoveredBlock = false)}
									aria-label="View in gallery"
								>
									<Media media={item} width={100 / block.items.length}/>
								</button>
							{:else if item._type === 'textItem'}
								{#if item.text}
									<PortableText value={item.text} components={{ block: PortableTextStyle, types: { break: PortableTextStyle }, marks: { link: PortableTextStyle } }} />
								{:else}
									<span class="empty su-s">This text block is empty. <br>Use "Empty" block instead</span>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</section>
	{:else}
		<span id="empty">No blocks found</span>
	{/if}

	<section id="details">
		<dl class="details">
			<dt>Client</dt>
			<dd>{data.work.client?.title}</dd>
			{#if data.work.typology}
				<dt>Typology</dt>
				<dd>{data.work.typology.title}</dd>
			{/if}
			{#if data.work.year}
				<dt>Year</dt>
				<dd>{data.work.year.slice(0, 4)}</dd>
			{/if}
			{#if data.work.services?.length}
				<dt>Services</dt>
				<dd>
					{#each data.work.services as service, i}
						{#if i > 0}{@html ', '}{/if}{service.title}
					{/each}
				</dd>
			{/if}
			{#if data.work.credits?.length}
				{#each data.work.credits as credit (credit._key)}
					<dt>{credit.role}</dt>
					<dd>
						{#each credit.collaborators as collaborator, i}
							{#if i > 0}{@html ', '}{/if}
							{#if collaborator.href}
								<a class="hover-gray" href={collaborator.href} target="_blank" rel="noopener noreferrer">{collaborator.title}</a>
							{:else}
								{collaborator.title}
							{/if}
						{/each}
					</dd>
				{/each}
			{/if}
		</dl>
		{#if data.work.workInformation}
			<div class="informations">
				<h3>Project Information</h3>
				<div class="portableText informations su-m">
					<PortableText value={data.work.workInformation} components={{ block: PortableTextStyle, types: { break: PortableTextStyle }, marks: { link: PortableTextStyle } }} />
				</div>
			</div>
		{/if}
	</section>

	{#if data.work.related?.length}
		<nav id="related" aria-label="Related works">
			<h3>More projects to explore</h3>
			<ul class="related">
				{#each data.work.related as related (related._id)}
					<li class="work">
						<a href="/works/{related.client?.slug.current}/{related.slug?.current}">
							<Media media={related.thumbnail} width={25}/>
							<span class="title">{related.title}</span>
							{#if related.subtitle}<span class="subtitle">{related.subtitle}</span>{/if}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</article>

{#if hoveredBlock}
	<CursorTag label="View" />
{/if}

<style lang="scss">
@use '$lib/scss/breakpoints.module' as bp;

.gallery-wrapper {
	position: fixed;
	inset: 0;
	z-index: 5;
}

article {
	background-color: var(--white);
	#blocks {
		.blocks {
			display: flex;

			.media-trigger {
				display: block;
				width: 100%;
				padding: 0;
				border: 0;
				background: none;
				cursor: pointer;
			}

			.block {
				width: 100%;

				&:not(:first-child) {
					margin-left: -1px;
				}

				&.textItem {
					display: block;
					padding: var(--sp-15);
					width: calc(100% - var(--sp-15)*2);

					.empty {
						display: block;
						min-height: 200px;
						place-content: center;
						text-align: center;
						background-color: var(--gray);
						color: var(--white);
						margin: calc(var(--sp-15)*-1);
					}
				}

				&.emptyItem {
					display: block;
				}
			}
		}
	}
	#empty {
		display: block;
		min-height: 50vh;
		place-content: center;
		text-align: center;
		background-color: var(--gray);
		color: var(--white);
	}
	#details {
		display: grid;
		align-items: start;
		grid-template-columns: repeat(12, 1fr);
		column-gap: var(--sp-15);
		row-gap: var(--sp-58);
		padding: var(--sp-100) var(--sp-15) 0;

		.details {
			grid-column: 1 / span 6;
			display: grid;
			row-gap: var(--sp-4);
			grid-template-columns: repeat(6, 1fr);
			column-gap: var(--sp-15);

			dt { grid-column: 1 / span 1; }
			dd { grid-column: 2 / span 5; }
		}

		.informations {
			grid-column: 7 / span 6;

			h3 + .portableText {
				margin-top: var(--sp-6);
			}
		}
	}
	#related {
		padding: var(--sp-196) var(--sp-15) 0;

		h3 {
			margin-bottom: var(--sp-20);
		}
		.related {
			display: grid;
			grid-template-columns: repeat(6, 1fr);
			column-gap: var(--sp-15);
			row-gap: var(--sp-30);

			.work {
				a {
					width: 100%;
					padding-bottom: var(--sp-2);
					:global(.media-container) {
						border-radius: 3px;
					}
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
					.title {
						display: block;
						margin-top: var(--sp-7);
					}
					.subtitle {
						color: var(--gray);
					}
				}
			}
		}
	}
	@media (width <= #{bp.$xl}) {
		#related {
			.related {
				grid-template-columns: repeat(4, 1fr);
			}
		}
	}
	@media (width <= #{bp.$md}) {
		#related {
			padding: var(--sp-110) var(--sp-15) 0;

			.related {
				grid-template-columns: repeat(2, 1fr);
			}
		}
		#blocks {
			.blocks {
				flex-direction: column;

				.block {
					margin-left: 0;

					&:not(:first-child) {
						margin-top: -1px;
					}

					&.textItem {
						width: 100%;
					}
				}
			}
		}
		#details {
			padding: var(--sp-50) var(--sp-15) 0;

			.details {
				grid-column: 1 / span 12;
				dt { grid-column: 1 / span 2; }
				dd { grid-column: 3 / span 4; }
			}

			.informations {
				grid-column: 1 / span 12;
				grid-row: 1;
			}
		}
	}
	@media (width <= #{bp.$xs}) {
		#related {
			.related {
				grid-template-columns: repeat(1, 1fr);
			}
		}
	}
}
</style>
