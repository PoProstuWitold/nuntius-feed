'use client'

import { useRef, useState } from 'react'
import type { Feed } from '../types'
import { FeedCard } from './FeedCard'

type Props = {
	initialSubscriptions: Feed[]
}

export function SubscriptionsClientPage({ initialSubscriptions }: Props) {
	const [subscriptions, setSubscriptions] =
		useState<Feed[]>(initialSubscriptions)

	const pendingRemovals = useRef<Record<string, NodeJS.Timeout>>({})

	const handleFavoriteChange = (
		subscriptionId: string,
		newState: boolean
	) => {
		if (!newState) {
			const timeoutId = setTimeout(() => {
				setSubscriptions((prev) =>
					prev.filter((sub) => sub.id !== subscriptionId)
				)
				delete pendingRemovals.current[subscriptionId]
			}, 5000)

			pendingRemovals.current[subscriptionId] = timeoutId
		} else {
			const timeout = pendingRemovals.current[subscriptionId]
			if (timeout) {
				clearTimeout(timeout)
				delete pendingRemovals.current[subscriptionId]
			}
		}
	}

	return (
		<>
			<h1 className='text-4xl font-bold lg:text-left text-center mb-4'>
				Subscribed Channels
			</h1>

			{subscriptions.length === 0 ? (
				<p className='text-center'>
					You have no subscribed channels yet.
				</p>
			) : (
				<ul className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					{subscriptions.map((subscription) => (
						<FeedCard
							key={subscription.id}
							feed={subscription}
							showFavorite={true}
							isFavorite={true}
							onFavoriteChange={(newState) =>
								handleFavoriteChange(subscription.id, newState)
							}
						/>
					))}
				</ul>
			)}
		</>
	)
}
