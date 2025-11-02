'use client'

import { useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import type { Feed, FeedPagination } from '../types'
import { client } from '../utils/client-rpc'
import { parseSearchParams } from '../utils/functions'
import { FeedCard } from './FeedCard'
import { SearchInput } from './SearchInput'

type Props = {
	initialSubscriptions: Feed[]
	initialPagination: FeedPagination
}

export function SubscriptionsClientPage({
	initialSubscriptions,
	initialPagination
}: Props) {
	const searchParams = useSearchParams()
	const resolvedParams = Object.fromEntries(searchParams.entries())
	const { limit, sortBy, sortOrder, search } = parseSearchParams(
		resolvedParams,
		12
	)

	const [subscriptions, setSubscriptions] =
		useState<Feed[]>(initialSubscriptions)
	const [page, setPage] = useState(1)
	const [pagination, setPagination] = useState(initialPagination)
	const [loading, setLoading] = useState(false)

	const loadMore = async () => {
		setLoading(true)
		const res = await client.api.user.subscriptions.$get({
			query: {
				limit: limit.toString(),
				offset: String(page * limit),
				sortBy,
				sortOrder,
				...(search ? { search } : {})
			}
		})
		const data = await res.json()
		// @ts-expect-error
		setSubscriptions((prev) => [...prev, ...data.subscriptions])
		setPage((p) => p + 1)
		// @ts-expect-error
		setPagination(data.pagination)
		setLoading(false)
	}

	const pendingRemovals = useRef<Record<string, NodeJS.Timeout>>({})
	const handleFavoriteChange = (feedId: string, newState: boolean) => {
		if (!newState) {
			if (!pendingRemovals.current[feedId]) {
				const timeout = setTimeout(() => {
					setSubscriptions((prev) =>
						prev.filter((f) => f.id !== feedId)
					)
					setPagination((prev) => ({
						...prev,
						totalFeeds: prev.totalFeeds - 1
					}))
					delete pendingRemovals.current[feedId]
				}, 4500)

				pendingRemovals.current[feedId] = timeout
			}
		} else {
			const timeout = pendingRemovals.current[feedId]
			if (timeout) {
				clearTimeout(timeout)
				delete pendingRemovals.current[feedId]
			}
		}
	}

	return (
		<>
			<div className='flex flex-col justify-center mb-10'>
				<h1 className='text-4xl font-bold lg:text-left text-center'>
					Subscribed Channels
				</h1>
				<p>RSS and Atom channels you are subscribed to.</p>
			</div>

			<SearchInput path='/subscriptions' limit={12} />

			{subscriptions.length === 0 ? (
				<p className='text-center'>No subscribed channels found.</p>
			) : (
				<>
					<div className='divider'>
						Showing {subscriptions.length} of{' '}
						{pagination.totalFeeds} feeds
					</div>

					<ul className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
						{subscriptions.map((feed) => (
							<FeedCard
								key={feed.id}
								feed={feed}
								showFavorite={true}
								isFavorite={true}
								onFavoriteChange={(newState) =>
									handleFavoriteChange(feed.id, newState)
								}
							/>
						))}
					</ul>

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
				</>
			)}
		</>
	)
}
