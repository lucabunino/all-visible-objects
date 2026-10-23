import {ProjectsIcon, UsersIcon, EyeClosedIcon} from '@sanity/icons'
import {status} from './fields/status'
import wysiwyg from './fields/wysiwyg'
import {media} from './fields/media'
import {workBlock} from './blocks'
import seoFields from './fields/seoFields'

export default {
	name: 'work',
	type: 'document',
	icon: ProjectsIcon,
	orderings: [
		{
			title: 'Title',
			name: 'title',
			by: [{field: 'title', direction: 'asc'}],
		},
		{
			title: 'Client',
			name: 'clientTitle',
			by: [{field: 'client.title', direction: 'asc'}],
		},
	],
	groups: [
		{name: 'Info'},
		{name: 'Media'},
		{name: 'Details'},
		{name: 'Seo'},
		{name: 'Related'},
	],
	fields: [
		{
			name: 'title',
			type: 'string',
			validation: Rule => Rule.required(),
			group: 'Info',
		},
		{
			name: 'client',
			type: 'reference',
			to: [{type: 'client'}],
			validation: Rule => Rule.required(),
			group: 'Info',
		},
		{
			name: 'slug',
			type: 'slug',
			options: {
				source: 'title',
				maxLength: 96,
				isUnique: () => true,
			},
			validation: Rule => Rule.required(),
			group: 'Info',
		},
		{...status, group: 'Info'},
		{...media('thumbnail'), group: 'Media'},
		{
			name: 'blocks',
			type: 'array',
			of: [workBlock],
			group: 'Media',
		},
		{
			name: 'typology',
			type: 'reference',
			to: [{type: 'capability'}],
			group: 'Details',
		},
		{
			name: 'year',
			type: 'date',
			description: 'Select January 1st of the target year',
			group: 'Details',
		},
		{
			name: 'services',
			type: 'array',
			of: [{type: 'reference', to: [{type: 'capability'}]}],
			group: 'Details',
			validation: Rule => Rule.unique(),
		},
		{
			name: 'credits',
			type: 'array',
			group: 'Details',
			of: [
				{
					type: 'object',
					icon: UsersIcon,
					fields: [
						{name: 'role', type: 'string', validation: Rule => Rule.required()},
						{
							name: 'collaborators',
							type: 'array',
							of: [{type: 'reference', to: [{type: 'collaborator'}]}],
						},
					],
					preview: {
						select: {role: 'role', collaborators: 'collaborators'},
						prepare({role, collaborators}) {
							return {title: role, subtitle: `${collaborators?.length || 0} collaborator${collaborators?.length === 1 ? '' : 's'}`}
						},
					},
				},
			],
		},
		wysiwyg('workInformation', 'Details'),
		...seoFields('Seo'),
		{
			name: 'related',
			type: 'array',
			of: [{type: 'reference', to: [{type: 'work'}]}],
			group: 'Related',
			validation: Rule => Rule.unique(),
		},
	],
	preview: {
		select: {title: 'title', clientTitle: 'client.title', status: 'status', coverType: 'thumbnail.type', image: 'thumbnail.image', videoPoster: 'thumbnail.videoPoster'},
		prepare({title, clientTitle, status, coverType, image, videoPoster}) {
			const hidden = status === 'hidden'
			let previewMedia = null
			if (!hidden && coverType === 'image') previewMedia = image
			if (!hidden && coverType === 'video') previewMedia = videoPoster
			if (hidden) previewMedia = EyeClosedIcon
			const previewTitle = hidden ? `[Hidden] ${title}` : title
			return {title: previewTitle, subtitle: clientTitle, media: previewMedia}
		},
	},
}
