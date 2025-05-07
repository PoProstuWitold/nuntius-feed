'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import type { Feed, FeedPagination } from '../types'
import { client } from '../utils/client-rpc'
import { parseSearchParams } from '../utils/functions'
import { FeedCard } from './FeedCard'

export function FeedLandingList({
	userId,
	initialFeeds,
	initialSubscriptions = [],
	initialPagination
}: {
	userId?: string
	initialFeeds: Feed[]
	initialSubscriptions?: string[]
	initialPagination: FeedPagination
}) {
	const searchParams = useSearchParams()
	const resolvedParams = Object.fromEntries(searchParams.entries())
	const { limit, sortBy, sortOrder, search } = parseSearchParams(
		resolvedParams,
		12
	)

	const [feeds, setFeeds] = useState<Feed[]>(initialFeeds)
	const [page, setPage] = useState(1)
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState(initialPagination)

	const [subscriptions, setSubscriptions] =
		useState<string[]>(initialSubscriptions)

	const loadMore = async () => {
		const nextOffset = page * limit
		setLoading(true)
		const res = await client.api.feed.$get({
			query: {
				limit: limit.toString(),
				offset: nextOffset.toString(),
				sortBy,
				sortOrder,
				...(search ? { search } : {})
			}
		})
		const data = await res.json()
		setFeeds((prev) => [...prev, ...data.feeds])
		setPage((p) => p + 1)
		setPagination(data.pagination)
		setLoading(false)
	}

	const handleFavoriteChange = (feedId: string, newState: boolean) => {
		if (newState) {
			setSubscriptions((prev) => [...prev, feedId])
		} else {
			setSubscriptions((prev) => prev.filter((id) => id !== feedId))
		}
	}

	return (
		<>
			<div className='divider'>
				Showing {feeds.length} of {pagination.totalFeeds} feeds
			</div>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
				{feeds.map((feed) => (
					<FeedCard
						key={`${feed.id}`}
						feed={feed}
						showFavorite={!!userId}
						isFavorite={subscriptions.includes(feed.id)}
						onFavoriteChange={(newState) =>
							handleFavoriteChange(feed.id, newState)
						}
					/>
				))}
			</div>

			{pagination.hasNextPage && (
				<div className='flex justify-center'>
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

			{!pagination.hasNextPage && feeds.length === 0 && (
				<p className='text-center text-lg font-semibold'>
					No feeds found
				</p>
			)}
		</>
	)
}
