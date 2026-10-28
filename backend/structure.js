import {
	EarthGlobeIcon,
	HomeIcon,
	InfoOutlineIcon,
	AccessDeniedIcon,
	SparklesIcon,
	CaseIcon,
	ProjectsIcon,
	UsersIcon,
} from '@sanity/icons'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'

export const myStructure = (S, context) => {
	const entities = [
		S.listItem()
			.title('Homepage')
			.icon(HomeIcon)
			.child(S.document().schemaType('homepage').documentId('homepage')),
		S.divider(),
		orderableDocumentListDeskItem({type: 'client', title: 'Clients', icon: CaseIcon, S, context}),
		S.documentTypeListItem('work').title('Works').icon(ProjectsIcon),
		S.divider(),
		S.listItem()
			.title('About')
			.icon(InfoOutlineIcon)
			.child(S.document().schemaType('about').documentId('about')),
		S.divider(),
		S.documentTypeListItem('capability').title('Capabilities').icon(SparklesIcon),
		S.documentTypeListItem('collaborator').title('Collaborators').icon(UsersIcon),
	]

	const siteSettings = [
		S.divider(),
		S.listItem()
			.title('Seo')
			.icon(EarthGlobeIcon)
			.child(S.document().schemaType('seo').documentId('seo')),
		S.listItem()
			.title('Privacy')
			.icon(AccessDeniedIcon)
			.child(S.document().schemaType('policy').documentId('privacy')),
	]

	return S.list()
		.title('Content')
		.items([...entities, ...siteSettings])
}
