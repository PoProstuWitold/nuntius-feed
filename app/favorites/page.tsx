import type { Metadata } from 'next'
import { FavoritesClientPage } from '../components/FavoritesClientPage'
import { parseSearchParams } from '../utils/functions'
import { client } from '../utils/server-rpc'

export const metadata: Metadata = {
	title: 'Favorite Articles',
	description: 'List of your favorite articles'
}

export default async function Favorites({
	searchParams
}: {
	searchParams?: Promise<Record<string, string | string[]>>
}) {
	const resolvedParams = await searchParams
	const { limit, offset, sortBy, sortOrder, search } =
		parseSearchParams(resolvedParams)

	const res = await client.api.user.favorites.$get({
		query: {
			limit,
			offset,
			sortBy,
			sortOrder,
			...(search ? { search } : {})
		}
	})
	const data = await res.json()

	return (
		<FavoritesClientPage
			initialItems={data.favorites}
			initialPagination={data.pagination}
		/>
	)
}
