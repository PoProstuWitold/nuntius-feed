'use client'

import {
	ArrowUpLeft,
	CalendarIcon,
	Link2,
	TagsIcon,
	UsersIcon
} from 'lucide-react'
import Link from 'next/link'
import type { Item } from '../types'
import { FavoriteButton } from './FavoriteButton'

function stripImagesFromHTML(html: string) {
	return html.replace(/<img[^>]*>/gi, '')
}

export function FeedItem({
	item,
	showFavorite = false,
	isFavorite = false,
	onFavoriteChange
}: {
	item: Item
	showFavorite?: boolean
	isFavorite?: boolean
	onFavoriteChange?: (val: boolean) => void
}) {
	return (
		<li className='card bg-base-100 shadow-md border border-base-300 p-5 flex flex-col gap-4'>
			{/* Image */}
			{item.image?.url && (
				<img
					src={item.image.url}
					alt={item.image.title || 'Image'}
					className='rounded h-56 w-full object-cover border border-base-300'
				/>
			)}

			{/* Authors & Date */}
			<div className='flex items-center gap-4 text-sm text-base-content/80'>
				<div className='flex items-center gap-2'>
					<CalendarIcon size={16} />
					<span>
						{item.published
							? new Date(item.published).toLocaleString('pl-PL')
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
			{typeof item.feed === 'object' &&
				item.feed !== null &&
				'id' in item.feed && (
					<div className='flex items-center gap-4 text-sm text-base-content/80'>
						<div className='flex items-center gap-2'>
							<span>
								<Link
									href={`/feed/${item.feed.id}`}
									className='btn btn-secondary btn-sm'
								>
									<ArrowUpLeft size={15} /> Visit
								</Link>
							</span>
							{/* Divider */}
							<div className='divider divider-horizontal m-0' />
							<span>
								<a
									href={item.feed.url || '#'}
									target='_blank'
									rel='noopener noreferrer'
									className='link link-hover flex flex-row items-center gap-2'
								>
									<Link2 size={16} />
									{item.feed.title || 'Unknown feed'}
								</a>
							</span>
						</div>
					</div>
				)}
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

			{/* Description */}
			<div
				className='text-base-content/80 prose line-clamp-3'
				// biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized
				dangerouslySetInnerHTML={{
					__html: stripImagesFromHTML(
						item.description ||
							item.content ||
							'<i>No description available.</i>'
					)
				}}
			/>

			{/* Categories + Favorite button */}
			<div className='flex justify-between items-center text-base-content/80'>
				<div className='flex items-center gap-2'>
					<TagsIcon size={16} />
					<span className='line-clamp-1'>
						{item.categories.length > 0
							? item.categories.map((c) => c.term).join(', ')
							: 'No categories'}
					</span>
				</div>
				{showFavorite && (
					<FavoriteButton
						itemId={item.id || ''}
						isFavorite={isFavorite}
						onChange={onFavoriteChange}
					/>
				)}
			</div>
		</li>
	)
}
