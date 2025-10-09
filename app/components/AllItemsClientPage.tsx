'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { client } from '@/app/utils/client-rpc'
import type { Item, ItemsPagination } from '../types'
import { parseSearchParams } from '../utils/functions'
import { FeedItem } from './FeedItem'

export function AllItemsClientPage({
	userId,
	initialItems,
	initialPagination,
	initialFavorites = []
}: {
	userId?: string
	initialItems: Item[]
	initialPagination: ItemsPagination
	initialFavorites?: string[]
}) {
	const searchParams = useSearchParams()
	const resolvedParams = Object.fromEntries(searchParams.entries())
	const { limit, sortBy, sortOrder, search } =
		parseSearchParams(resolvedParams)

	const [items, setItems] = useState(initialItems)
	const [pagination, setPagination] = useState(initialPagination)
	const [loading, setLoading] = useState(false)
	const [page, setPage] = useState(1)

	const loadMore = async () => {
		if (!pagination.hasNextPage || loading) return
		setLoading(true)

		const nextOffset = page * limit

		const res = await client.api.feed.articles.$get({
			query: {
				limit: limit.toString(),
				offset: nextOffset.toString(),
				sortBy,
				sortOrder,
				...(search ? { search } : {})
			}
		})

		const json = await res.json()
		setItems((prev) => {
			const existingIds = new Set(prev.map((item) => item.id))
			// @ts-expect-error
			const newItems = json.items.filter(
				(item: Item) => !existingIds.has(item.id)
			)
			return [...prev, ...newItems]
		})
		setPagination(json.pagination)
		setPage((prev) => prev + 1)
		setLoading(false)
	}

	return (
		<div>
			<div className='divider'>
				Showing {items.length} of {pagination.totalItems} articles
			</div>
			<ul className='grid grid-cols-1 gap-6'>
				{items.map((item) => (
					<FeedItem
						key={item.id}
						item={item}
						showFavorite={!!userId}
						isFavorite={initialFavorites.includes(item.id || '')}
					/>
				))}
			</ul>

			{/* Load more */}
			{pagination.hasNextPage && (
				<div className='mt-6 text-center'>
					<button
						onClick={loadMore}
						disabled={loading}
						type='button'
						className='btn btn-primary'
					>
						{loading ? 'Loading...' : 'Load more'}
					</button>
				</div>
			)}
		</div>
	)
}
