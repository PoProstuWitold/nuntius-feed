'use client'

import { useState } from 'react'
import type { Feed } from '../types'

type Props = {
	initialSubscriptions: Feed[]
}

export function SubscriptionsClientPage({ initialSubscriptions }: Props) {
	const [subscriptions, setSubscriptions] =
		useState<Feed[]>(initialSubscriptions)

	const handleFavoriteChange = (
		subscriptionId: string,
		newState: boolean
	) => {
		if (!newState) {
			setSubscriptions((prev) =>
				prev.filter(
					(subscription) => subscription.id !== subscriptionId
				)
			)
		}
	}

	return (
		<>
			<h1 className='text-4xl font-bold lg:text-left text-center mb-4'>
				Favorite Articles
			</h1>

			{subscriptions.length === 0 ? (
				<p className='text-center'>
					You have no favorite articles yet.
				</p>
			) : (
				<ul className='grid grid-cols-1 gap-6'>WIP</ul>
			)}
		</>
	)
}
