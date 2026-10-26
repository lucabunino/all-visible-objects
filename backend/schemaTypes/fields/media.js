const alt = {
	name: 'alt',
	title: 'Alt text',
	description: 'Short description of the image for screen readers and search engines',
	type: 'string',
}

export const mediaFields = [
	{
		name: 'type',
		type: 'string',
		options: {
			list: [
				{title: 'Image', value: 'image'},
				{title: 'Video (mp4 + cover)', value: 'video'},
			],
		},
		initialValue: 'image',
		validation: Rule => Rule.required(),
	},
	{
		name: 'image',
		type: 'image',
		fields: [alt],
		hidden: ({parent}) => parent?.type !== 'image',
		validation: Rule =>
			Rule.custom((v, c) => (c.parent.type === 'image' && !v ? 'Required' : true)),
	},
	{
		name: 'imageMobile',
		title: 'Image (mobile)',
		description: 'Optional',
		type: 'image',
		hidden: ({parent}) => parent?.type !== 'image',
	},
	{
		name: 'video',
		type: 'file',
		options: {accept: 'video/mp4'},
		hidden: ({parent}) => parent?.type !== 'video',
		validation: Rule =>
			Rule.custom((v, c) => (c.parent.type === 'video' && !v ? 'Required' : true)),
	},
	{
		name: 'videoMobile',
		title: 'Video (mobile)',
		description: 'Optional',
		type: 'file',
		options: {accept: 'video/mp4'},
		hidden: ({parent}) => parent?.type !== 'video',
	},
	{
		name: 'videoPoster',
		type: 'image',
		fields: [{...alt, description: 'Short description of the video for screen readers and search engines'}],
		hidden: ({parent}) => parent?.type !== 'video',
		validation: Rule =>
			Rule.custom((v, c) => (c.parent.type === 'video' && !v ? 'Required' : true)),
	},
	{
		name: 'videoPosterMobile',
		title: 'Video poster (mobile)',
		description: 'Optional',
		type: 'image',
		hidden: ({parent}) => parent?.type !== 'video',
	},
]

export function media(name) {
	return {name, type: 'object', fields: mediaFields}
}
