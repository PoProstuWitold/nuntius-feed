export interface ServiceStatus {
	connected: boolean
}

export interface User {
	id: string
	name: string
	email: string
}

export interface Feed {
	id: string
	itemsCount: number
	title: string
	description: string
	url: string
	self: string
	updated: string
	copyright: string | null
	language: string
	generator: {
		label: string | null
		url: string | null
		version: string | null
	} | null
	meta: {
		type: string
		version: string
	}
	authors: { name?: string; email?: string; url?: string }[]
	categories: string[]
	image: string | null
	published: string | null
	createdAt: string
	updatedAt: string
}

export interface Pagination {
	totalFeeds: number
	totalPages: number
	currentPage: number
	hasNextPage: boolean
	hasPreviousPage: boolean
	nextPage: number | null
	previousPage: number | null
}

export interface FeedsResponse {
	success: boolean
	message: string
	feeds: Feed[]
	pagination: Pagination
}
