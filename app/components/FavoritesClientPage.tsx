'use client'

import { useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import type { Item, ItemsPagination } from '../types'
import { client } from '../utils/client-rpc'
import { parseSearchParams } from '../utils/functions'
import { FeedItem } from './FeedItem'
import { SearchInput } from './SearchInput'

type Props = {
	initialItems: Item[]
	initialPagination: ItemsPagination
}

export function FavoritesClientPage({
	initialItems,
	initialPagination
}: Props) {
	const searchParams = useSearchParams()
	const resolvedParams = Object.fromEntries(searchParams.entries())
	const { limit, sortBy, sortOrder, search } =
		parseSearchParams(resolvedParams)

	const [items, setItems] = useState<Item[]>(initialItems)
	const [page, setPage] = useState(1)
	const [pagination, setPagination] = useState(initialPagination)
	const [loading, setLoading] = useState(false)

	const loadMore = async () => {
		setLoading(true)
		const res = await client.api.user.favorites.$get({
			query: {
				limit: limit.toString(),
				offset: String(page * limit),
				sortBy,
				sortOrder,
				...(search ? { search } : {})
			}
		})
		const data = (await res.json()) as
			| { message: string }
			| { favorites: Item[]; pagination: ItemsPagination }

		if (!('favorites' in data)) {
			setLoading(false)
			return
		}

		setItems((prev) => [...prev, ...data.favorites])
		setPage((p) => p + 1)
		setPagination(data.pagination)
		setLoading(false)
	}

	const pendingRemovals = useRef<Record<string, NodeJS.Timeout>>({})
	const handleFavoriteChange = (itemId: string, newState: boolean) => {
		if (!newState) {
			if (!pendingRemovals.current[itemId]) {
				const timeout = setTimeout(() => {
					setItems((prev) => prev.filter((i) => i.id !== itemId))
					setPagination((prev) => ({
						...prev,
						totalItems: prev.totalItems - 1
					}))
					delete pendingRemovals.current[itemId]
				}, 4500)

				pendingRemovals.current[itemId] = timeout
			}
		} else {
			const timeout = pendingRemovals.current[itemId]
			if (timeout) {
				clearTimeout(timeout)
				delete pendingRemovals.current[itemId]
			}
		}
	}

	return (
		<>
			<div className='flex flex-col justify-center mb-10'>
				<h1 className='text-4xl font-bold lg:text-left text-center'>
					Favorite Articles
				</h1>
				<p>Articles you have marked as favorite across all channels.</p>
			</div>
			<SearchInput path='/favorites' limit={24} />

			{items.length === 0 ? (
				<p className='text-center'>No favorite articles found.</p>
			) : (
				<>
					<div className='divider'>
						Showing {items.length} of {pagination.totalItems}{' '}
						articles
					</div>
					<ul className='grid grid-cols-1 gap-6'>
						{items.map((item) => (
							<FeedItem
								key={item.id}
								item={item}
								showFavorite={true}
								isFavorite={true}
								onFavoriteChange={(newState) =>
									handleFavoriteChange(
										item.id || '',
										newState
									)
								}
							/>
						))}
					</ul>
					{pagination.hasNextPage && (
						<div className='flex justify-center mt-10'>
							<button
								onClick={loadMore}
								className='btn btn-outline'
								disabled={loading}
								type='button'
							>
								{loading ? 'Loading...' : 'Load more'}
							</button>
						</div>
					)}
				</>
			)}
		</>
	)
}
