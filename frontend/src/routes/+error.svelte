<script>
	import { page } from '$app/state'
</script>

<article>
	<h1>{page.status}</h1>
	<p class="su-m">{page.error?.message}</p>
	<a href="/" class="tag">← Back to homepage</a>
</article>

<style lang="scss">
	article {
		padding: calc(var(--tagHeight) + var(--sp-15)*3) var(--sp-15);

		h1 {
			margin-bottom: var(--sp-6);
		}

		.tag {
			margin-top: var(--sp-10);
		}
	}
</style>