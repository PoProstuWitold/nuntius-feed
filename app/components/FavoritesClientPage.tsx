'use client'

import { useState } from 'react'
import type { Item } from '../types'
import { FeedItem } from './FeedItem'

type Props = {
	initialItems: Item[]
}

export function FavoritesClientPage({ initialItems }: Props) {
	const [items, setItems] = useState<Item[]>(initialItems)

	const handleFavoriteChange = (itemId: string, newState: boolean) => {
		if (!newState) {
			setItems((prev) => prev.filter((item) => item.id !== itemId))
		}
	}

	return (
		<>
			<h1 className='text-4xl font-bold lg:text-left text-center mb-4'>
				Favorite Articles
			</h1>

			{items.length === 0 ? (
				<p className='text-center'>
					You have no favorite articles yet.
				</p>
			) : (
				<ul className='grid grid-cols-1 gap-6'>
					{items.map((item) => (
						<FeedItem
							key={item.id}
							item={item}
							showFavorite={true}
							isFavorite={true}
							onFavoriteChange={(newState) =>
								handleFavoriteChange(item.id || '', newState)
							}
						/>
					))}
				</ul>
			)}
		</>
	)
}
