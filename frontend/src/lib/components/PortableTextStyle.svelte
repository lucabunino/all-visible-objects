<script>
	import { page } from '$app/state'
	import { getTemplate } from '$lib/utils/template'

	let { portableText, children } = $props()

	const value = $derived(portableText.value)
	const style = $derived(value?.style)
	const headingClass = $derived(['work', 'policy'].includes(getTemplate(page.route.id)) ? 'su-s' : 'su-m')
</script>

<!-- CMS styles h3 "Title (M)" / h6 "Title (S)": h6 renders as <h4> so heading
levels don't skip (h3 → h6) for screen readers; looks are class-driven -->
{#if value._type === 'link'}
	<a class="underline hover-gray" href={value?.href} target={value?.blank ? '_blank' : undefined} rel={value?.blank ? 'noopener noreferrer' : undefined}>
		{@render children()}
	</a>
{:else if value._type === 'break'}
	<br />
{:else if style === 'h3'}
	<h3 class={headingClass}>{@render children()}</h3>
{:else if style === 'h6'}
	<h4 class={headingClass}>{@render children()}</h4>
{:else}
	<p>{@render children()}</p>
{/if}

<style lang="scss">
:global(.portableText h3 + *) {
	margin-top: .8em;
}
:global(.portableText * + h3) {
	text-transform: uppercase;
	margin-top: 2.4em;
}
:global(.portableText ul) {
	list-style: disc;
	padding: 0 1em;
}
:global(.portableText ol) {
	list-style: decimal;
	padding: 0 1em;
}
:global([data-template="policy"] .portableText h4 + *),
:global([data-template="policy"] .portableText h3 + *),
:global([data-template="work"] .portableText h4 + *),
:global([data-template="work"] .portableText h3 + *) {
	margin-top: var(--sp-6);
}
:global([data-template="policy"] .portableText * + h4),
:global([data-template="policy"] .portableText * + h3),
:global([data-template="work"] .portableText * + h4),
:global([data-template="work"] .portableText * + h3) {
	margin-top: var(--sp-48);
}
</style>
