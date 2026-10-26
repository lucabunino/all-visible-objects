<script>
	import { PortableText } from '@portabletext/svelte'
	import PortableTextStyle from '$lib/components/PortableTextStyle.svelte'

	let { data } = $props()
	const policy = $derived(data.policy)
</script>

<article>
	<h1>{policy.title}</h1>
	<div class="portableText policy su-m">
		<PortableText value={policy.content} components={{ block: PortableTextStyle, types: { break: PortableTextStyle }, marks: { link: PortableTextStyle } }} />
	</div>
</article>

<style lang="scss">
	article {
		padding: calc(var(--tagHeight) + var(--sp-15)*3) var(--sp-15);
		display: grid;
		column-gap: var(--sp-5);

		h1 {
			text-transform: uppercase;
			margin-bottom: var(--sp-6);
			width: 100%;
			height: fit-content;
		}

		.portableText {
			max-width: 60ch;
		}
	}
</style>