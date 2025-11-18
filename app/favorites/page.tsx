import type { Metadata } from 'next'
import { FavoritesClientPage } from '../components/FavoritesClientPage'
import type { Item, ItemsPagination } from '../types'
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
	const data = (await res.json()) as
		| {
				message: string
		  }
		| {
				message: string
				success: true
				favorites: unknown[]
				pagination: unknown
		  }

	if (!('favorites' in data)) {
		return (
			<FavoritesClientPage
				initialItems={[]}
				initialPagination={{
					totalItems: 0,
					totalPages: 0,
					currentPage: 1,
					hasNextPage: false,
					hasPreviousPage: false,
					nextPage: null,
					previousPage: null
				}}
			/>
		)
	}

	return (
		<FavoritesClientPage
			initialItems={data.favorites as Item[]}
			initialPagination={data.pagination as ItemsPagination}
		/>
	)
}
