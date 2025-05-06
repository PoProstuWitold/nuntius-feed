'use client'

import { client } from '@/app/utils/client-rpc'
import { useState } from 'react'
import type { Item, ItemsPagination } from '../types'
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
	const [items, setItems] = useState(initialItems)
	const [pagination, setPagination] = useState(initialPagination)
	const [loading, setLoading] = useState(false)

	const loadMore = async () => {
		if (!pagination.hasNextPage || loading) return
		setLoading(true)

		const res = await client.api.feed.articles.$get()
		const json = await res.json()
		const jsonItems = json.items as Item[]

		setItems((prev) => [...prev, ...jsonItems])
		setPagination(json.pagination)
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
