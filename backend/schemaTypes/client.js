import {CaseIcon, EyeClosedIcon} from '@sanity/icons'
import {orderRankField} from '@sanity/orderable-document-list'
import {status} from './fields/status'

export default {
	name: 'client',
	type: 'document',
	icon: CaseIcon,
	fields: [
		orderRankField({type: 'client'}),
		{
			name: 'title',
			type: 'string',
			validation: Rule => Rule.required(),
		},
		{
			name: 'slug',
			type: 'slug',
			validation: Rule => Rule.required(),
			options: {source: 'title', maxLength: 96},
		},
		{
			name: 'href',
			title: 'Link',
			type: 'string',
			description: 'Optional: linked from the project details',
			validation: Rule =>
				Rule.custom(href => {
					if (!href) return true
					return /^https?:\/\//.test(href) ? true : 'Must be a valid URL'
				}),
		},
		{...status},
		{
			name: 'works',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: [{type: 'work'}],
					options: {
						filter: ({document}) => ({
							filter: 'client._ref == $clientId',
							params: {clientId: document._id.replace(/^drafts\./, '')},
						}),
					},
				},
			],
			validation: Rule =>
				Rule.unique().custom(async (works, context) => {
					if (!works?.length) return true
					const client = context.getClient({apiVersion: '2025-01-01'})
					const clientId = context.document._id.replace(/^drafts\./, '')
					const ids = works.map(w => w._ref)
					const mismatched = await client.fetch(
						`*[_id in $ids && client._ref != $clientId].title`,
						{ids, clientId},
					)
					return mismatched.length > 0
						? `These works don't list this client: ${mismatched.join(', ')}`
						: true
				}),
		},
	],
	preview: {
		select: {title: 'title', works: 'works', status: 'status'},
		prepare({title, works, status}) {
			const hidden = status === 'hidden'
			const count = works?.length || 0
			let previewTitle = count > 0 ? `${title} (${count})` : title
			if (hidden) previewTitle = `[Hidden] ${previewTitle}`
			return {title: previewTitle, media: hidden ? EyeClosedIcon : undefined}
		},
	},
}
