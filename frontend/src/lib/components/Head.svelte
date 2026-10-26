<script>
	import { page } from '$app/state'
	import { urlFor } from '$lib/utils/image.js'

	const seoBase = $derived(page.data?.seo)
	const seoSingle = $derived(page.data?.seoSingle)
	const canonicalUrl = $derived(page.url.origin + page.url.pathname)
	const siteName = $derived(seoBase?.seoTitle || 'All Visible Objects')
	const displayTitle = $derived(
		seoSingle?.seoTitle ? `${seoSingle.seoTitle} | ${seoBase?.seoTitle || ''}` : seoBase?.seoTitle || ''
	)
	const rawDesc = $derived(seoSingle?.seoDescription || seoBase?.seoDescription || '')
	const displayDesc = $derived(rawDesc.length > 157 ? rawDesc.slice(0, 157) + '...' : rawDesc)
	const work = $derived(page.route.id === '/works/[client]/[work]' ? page.data.work : null)

	/** @param {any} img */
	function resolveImageUrl(img) {
		if (!img) return undefined
		if (typeof img === 'string') return img
		if (img.url) return img.url
		if (img.asset) return urlFor(img)?.width(1200).height(630).fit('crop').quality(70).format('jpg').url()
		return undefined
	}

	const socialImage = $derived(seoSingle?.seoImage || seoBase?.seoImage)
	const socialImageUrl = $derived(resolveImageUrl(socialImage))
	const socialImageAlt = $derived(socialImage?.alt || displayTitle)

	// schema.org JSON-LD for search engines and AI answers: the studio as an
	// Organization + WebSite on every page, plus the page's own entity
	const jsonLd = $derived.by(() => {
		const origin = page.url.origin
		const org = {
			'@type': 'Organization',
			'@id': `${origin}/#organization`,
			name: siteName,
			url: `${origin}/`,
			...(page.data.about?.email && { email: page.data.about.email }),
			...(page.data.about?.instagram?.href && { sameAs: [page.data.about.instagram.href] })
		}
		/** @type {any[]} */
		const graph = [
			org,
			{ '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: siteName, publisher: { '@id': org['@id'] } }
		]
		if (work) {
			graph.push({
				'@type': 'CreativeWork',
				'@id': `${canonicalUrl}#work`,
				name: work.title,
				url: canonicalUrl,
				...(displayDesc && { description: displayDesc }),
				...(socialImageUrl && { image: socialImageUrl }),
				...(work.year && { dateCreated: work.year.slice(0, 4) }),
				...(work.typology?.title && { genre: work.typology.title }),
				...(work.services?.length && { keywords: work.services.map((/** @type {any} */ s) => s.title).join(', ') }),
				creator: { '@id': org['@id'] },
				...(work.client?.title && { funder: { '@type': 'Organization', name: work.client.title } }),
				isPartOf: { '@id': `${origin}/#website` }
			})
		} else if (page.route.id === '/about') {
			graph.push({ '@type': 'AboutPage', url: canonicalUrl, name: displayTitle, mainEntity: { '@id': org['@id'] } })
		}
		// `<` escaped so CMS text can never close the script tag
		return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')
	})
</script>

<svelte:head>
	{#if displayTitle}
		<title>{displayTitle}</title>
		<meta property="og:title" content={displayTitle} />
		<meta name="twitter:title" content={displayTitle} />
		<meta property="og:site_name" content={seoBase?.seoTitle} />
	{/if}
	{#if displayDesc}
		<meta name="description" content={displayDesc} />
		<meta property="og:description" content={displayDesc} />
		<meta name="twitter:description" content={displayDesc} />
	{/if}
	{#if socialImageUrl}
		<meta property="og:image" content={socialImageUrl} />
		<meta property="og:image:secure_url" content={socialImageUrl} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:image:alt" content={socialImageAlt} />
		<meta name="twitter:image" content={socialImageUrl} />
		<meta name="twitter:image:alt" content={socialImageAlt} />
	{/if}
	<meta property="og:type" content={work ? 'article' : 'website'} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:url" content={canonicalUrl} />
	<meta name="twitter:card" content="summary_large_image" />
	<link rel="canonical" href={canonicalUrl} />
	{#if page.data?.hidden || page.status >= 400}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow" />
	{/if}
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>
