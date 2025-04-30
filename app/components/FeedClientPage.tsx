'use client'

import { client } from '@/app/utils/client-rpc'
import { CalendarIcon, TagsIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import type { Feed, Item, ItemsPagination } from '../types'

function stripImagesFromHTML(html: string) {
	return html.replace(/<img[^>]*>/gi, '')
}

export default function FeedClientPage({
	feed,
	initialItems,
	initialPagination
}: {
	feed: Feed
	initialItems: Item[]
	initialPagination: ItemsPagination
}) {
	const [items, setItems] = useState(initialItems)
	const [pagination, setPagination] = useState(initialPagination)
	const [loading, setLoading] = useState(false)

	const loadMore = async () => {
		if (!pagination.hasNextPage || loading) return
		setLoading(true)

		const res = await client.api.feed[':id'].items.$get({
			param: { id: feed.id },
			query: {
				offset: String(pagination.currentPage * 10),
				limit: '10'
			}
		})
		const json = await res.json()

		setItems((prev) => [...prev, ...json.items])
		setPagination(json.pagination)
		setLoading(false)
	}

	return (
		<div>
			<ul className='grid grid-cols-1 gap-6'>
				{items.map((item) => (
					<li
						key={item.url}
						className='card bg-base-100 shadow-md border border-base-300 p-5 flex flex-col gap-4'
					>
						{/* Image */}
						{item.image?.url && (
							<img
								src={item.image.url}
								alt={item.image.title || 'Image'}
								className='rounded h-56 w-full object-cover border border-base-300'
							/>
						)}

						{/* Authors & Categories */}
						<div className='flex items-center gap-4 text-sm text-base-content/80'>
							<div className='flex items-center gap-2'>
								<CalendarIcon size={16} />
								<span>
									{item.published
										? new Date(
												item.published
											).toLocaleString('pl-PL')
										: 'No publication date'}
								</span>
							</div>
							<div className='divider divider-horizontal m-0' />
							<div className='flex items-center gap-2'>
								<UsersIcon size={16} />
								<span>
									{item.authors.length > 0
										? item.authors
												.map((a) => a.name || 'Unknown')
												.join(', ')
										: 'Unknown authors'}
								</span>
							</div>
						</div>

						{/* Title */}
						<h3 className='text-xl font-bold text-primary'>
							<a
								href={item.url || '#'}
								target='_blank'
								rel='noopener noreferrer'
								className='link link-hover'
							>
								{item.title || 'Untitled item'}
							</a>
						</h3>

						{/* Description / Content */}
						<div
							className='text-base-content/80 prose line-clamp-3'
							// biome-ignore lint/security/noDangerouslySetInnerHtml: this HTML is sanitized manually
							dangerouslySetInnerHTML={{
								__html: stripImagesFromHTML(
									item.description ||
										item.content ||
										'<i>No description available.</i>'
								)
							}}
						/>
						<div className='flex items-center gap-2 text-base-content/80'>
							<TagsIcon size={16} />
							<span className='line-clamp-1'>
								{item.categories.length > 0
									? item.categories
											.map((c) => c.term)
											.join(', ')
									: 'No categories'}
							</span>
						</div>
					</li>
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
