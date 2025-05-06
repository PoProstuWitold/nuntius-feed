export interface ServiceStatus {
	connected: boolean
}

export interface User {
	id: string
	name: string
	email: string
}

export interface PayloadUser {
	sub: string
	name: string
	email: string
	role: string
}

export interface FeedAuthor {
	email: string | null
	name: string | null
	url: string | null
}

export interface FeedCategory {
	label: string | null
	term: string
	url: string | null
}

export interface FeedGenerator {
	label: string | null
	url: string | null
	version: string | null
}

export interface FeedImage {
	title: string | null
	url: string
}

export interface FeedMedia {
	image: string | null
	length: number | null
	mimetype?: string | null
	title: string | null
	type: string | null
	url: string
}

export interface Item {
	id: string
	feed:
		| string
		| {
				id: string
				title: string | null
				url: string | null
				self: string | null
		  }
	authors: FeedAuthor[]
	categories: FeedCategory[]
	content: string | null
	description: string | null
	guid: string | null
	image: FeedImage | null
	media: FeedMedia[]
	published: string | null
	title: string | null
	updated: string | null
	url: string | null
	createdAt: string
	updatedAt: string
}

export interface FeedMeta {
	type: 'atom' | 'rss'
	version: '0.3' | '0.9' | '1.0' | '2.0'
}

export interface Feed {
	id: string
	authors: FeedAuthor[]
	categories: FeedCategory[]
	copyright: string | null
	description: string | null
	generator: FeedGenerator | null
	image: FeedImage | null
	language: string | null
	meta: FeedMeta
	published: string | null
	self: string | null
	title: string | null
	updated: string | null
	url: string | null
	itemsCount: number
	createdAt: string
	updatedAt: string
}

export interface ItemsPagination {
	totalItems: number
	totalPages: number
	currentPage: number
	hasNextPage: boolean
	hasPreviousPage: boolean
	nextPage: number | null
	previousPage: number | null
}

export interface FeedPagination {
	totalFeeds: number
	totalPages: number
	currentPage: number
	hasNextPage: boolean
	hasPreviousPage: boolean
	nextPage: number | null
	previousPage: number | null
}
