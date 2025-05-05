'use client'

import { useEffect, useState } from 'react'
import type { Feed } from '../types'
import { client } from '../utils/client-rpc'
import { FeedCard } from './FeedCard'

export function FeedLandingList({
	initialFeeds,
	initialPage,
	initialSearch,
	initialSubscriptions = []
}: {
	initialFeeds: Feed[]
	initialPage: number
	initialSearch: string
	initialSubscriptions?: string[]
}) {
	useEffect(() => {
		console.log('useEffect fired')
	}, [])
	const [feeds, setFeeds] = useState<Feed[]>(initialFeeds)
	const [page, setPage] = useState(initialPage)
	const [search] = useState(initialSearch)
	const [hasMore, setHasMore] = useState(initialFeeds.length === 12)
	const [loading, setLoading] = useState(false)

	const [subscriptions, setSubscriptions] =
		useState<string[]>(initialSubscriptions)

	const loadMore = async () => {
		setLoading(true)
		const res = await client.api.feed.$get({
			query: {
				limit: '12',
				offset: (page * 12).toString(),
				sortBy: 'updatedAt',
				sortOrder: 'desc',
				...(search ? { search } : {})
			}
		})
		const data = await res.json()
		setFeeds((prev) => [...prev, ...data.feeds])
		setPage((p) => p + 1)
		setHasMore(data.feeds.length === 12)
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
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
				{feeds.map((feed) => (
					<FeedCard
						key={feed.id}
						feed={feed}
						showFavorite={true}
						isFavorite={subscriptions.includes(feed.id)}
						onFavoriteChange={(newState) =>
							handleFavoriteChange(feed.id, newState)
						}
					/>
				))}
			</div>

			{hasMore && (
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

			{!hasMore && feeds.length === 0 && (
				<p className='text-center text-lg font-semibold'>
					No feeds found
				</p>
			)}
		</>
	)
}
