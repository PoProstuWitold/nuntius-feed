import type { Metadata } from 'next'
import { AllItemsClientPage } from '../components/AllItemsClientPage'
import { SearchInput } from '../components/SearchInput'
import type { Item } from '../types'
import { client } from '../utils/server-rpc'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Nuntius Feed',
	description:
		'Your personal herald for the digital age. A lightweight web application for subscribing to and reading RSS and Atom feeds.'
}

export default async function AllArticles({
	searchParams
}: {
	searchParams?: Promise<Record<string, string | string[]>>
}) {
	const resolvedParams = await searchParams
	const limit = 24
	const offset = 0

	const sortBy =
		typeof resolvedParams?.sortBy === 'string'
			? resolvedParams.sortBy
			: 'published'
	const sortOrder =
		typeof resolvedParams?.sortOrder === 'string'
			? resolvedParams.sortOrder
			: 'desc'
	const search =
		typeof resolvedParams?.search === 'string'
			? resolvedParams.search.trim()
			: ''

	const res = await client.api.feed.articles.$get({
		query: {
			limit: limit.toString(),
			offset: offset.toString(),
			sortBy,
			sortOrder,
			...(search ? { search } : {})
		}
	})
	const json = await res.json()
	const jsonItems = json.items as Item[]
	const jsonPagination = json.pagination

	return (
		<>
			<div className='flex flex-col justify-center mb-10'>
				<h1 className='text-4xl font-bold lg:text-left text-center'>
					All Articles
				</h1>
			</div>
			<SearchInput path='/articles' />
			<AllItemsClientPage
				initialItems={jsonItems}
				initialPagination={jsonPagination}
			/>
		</>
	)
}
