import type { Metadata } from 'next'
import { SearchInput } from '@/app/components/SearchInput'
import { SubscriptionArticlesClientPage } from '@/app/components/SubscriptionArticlesClientPage'
import type { Item } from '@/app/types'
import { parseSearchParams } from '@/app/utils/functions'
import { client } from '@/app/utils/server-rpc'

export const metadata: Metadata = {
	title: 'Your Articles',
	description: 'Articles from your subscriptions'
}

export default async function SubscriptionsArticles({
	searchParams
}: {
	searchParams?: Promise<Record<string, string | string[]>>
}) {
	const resolvedParams = await searchParams
	const { limit, offset, sortBy, sortOrder, search } =
		parseSearchParams(resolvedParams)

	const res = await client.api.user.subscriptions.articles.$get({
		query: {
			limit: limit.toString(),
			offset: offset.toString(),
			sortBy,
			sortOrder,
			...(search ? { search } : {})
		}
	})
	const json = (await res.json()) as
		| { message: string }
		| { items: Item[]; pagination: import('@/app/types').ItemsPagination }
	const jsonItems = 'items' in json ? json.items : []
	const jsonPagination =
		'items' in json
			? json.pagination
			: ({
					totalItems: 0,
					totalPages: 0,
					currentPage: 1,
					hasNextPage: false,
					hasPreviousPage: false,
					nextPage: null,
					previousPage: null
				} satisfies import('@/app/types').ItemsPagination)

	const favs = await client.api.user.favorites.$get()
	const favsJson = (await favs.json()) as
		| { message: string }
		| { message: string; favorites: { id: string }[] }
	const favGuids =
		'favorites' in favsJson ? favsJson.favorites.map((fav) => fav.id) : []

	return (
		<>
			<div className='flex flex-col justify-center mb-10'>
				<h1 className='text-4xl font-bold lg:text-left text-center'>
					Your Articles
				</h1>
				<p>Articles from your subscribed feeds.</p>
			</div>
			<SearchInput path='/subscriptions/articles' limit={24} />
			<SubscriptionArticlesClientPage
				initialItems={jsonItems}
				initialPagination={jsonPagination}
				initialFavorites={favGuids}
			/>
		</>
	)
}
