'use client'

import {
	ArrowUpLeft,
	CalendarIcon,
	DatabaseIcon,
	FileTextIcon,
	HistoryIcon,
	LinkIcon,
	ShieldAlertIcon,
	TagsIcon,
	UploadIcon,
	UsersIcon,
	ZapIcon
} from 'lucide-react'
import Link from 'next/link'
import type { Feed } from '../types'
import { getFlagEmoji } from '../utils/functions'
import { FeedImage } from './FeedImage'
import { SubscribeButton } from './SubscribeButton'

export const FeedCard = ({
	feed,
	showFavorite = true,
	isFavorite = false,
	onFavoriteChange
}: {
	feed: Feed
	showFavorite?: boolean
	isFavorite?: boolean
	onFavoriteChange?: (newState: boolean) => void
}) => {
	return (
		<div className='card bg-base-100 shadow-md border border-base-300 relative overflow-hidden'>
			{/* Ribbon / Wstążka */}
			<div className='absolute top-1 right-[-30px] w-[100px] bg-primary text-primary-content text-center font-bold py-1 rotate-45 shadow-md'>
				{getFlagEmoji(feed.language, feed.url).includes('(?') ? (
					<div
						className='tooltip tooltip-bottom cursor-pointer'
						data-tip='Auto-detected'
					>
						<span>{getFlagEmoji(feed.language, feed.url)}</span>
					</div>
				) : (
					<span>{getFlagEmoji(feed.language, feed.url)}</span>
				)}
			</div>

			<div className='card-body flex flex-col justify-between'>
				<div className='flex flex-col gap-4'>
					{/* Feed source + standard info */}
					<div className='flex items-center text-sm text-base-content/70'>
						<span>
							<Link
								href={`/feed/${feed.id}`}
								className='btn btn-secondary'
							>
								<ArrowUpLeft size={15} /> Visit
							</Link>
						</span>
						<div className='divider divider-horizontal' />
						<span className='flex items-center gap-2'>
							<LinkIcon size={16} />
							{feed.self ? (
								<a
									href={feed.self}
									target='_blank'
									rel='noopener noreferrer'
									className='link link-hover'
								>
									Feed Source (
									{feed.meta.type?.toUpperCase() || 'Unknown'}{' '}
									{feed.meta.version || ''})
								</a>
							) : (
								<span>No feed source</span>
							)}
						</span>
						{/* Subscribe Button */}
						{showFavorite && (
							<>
								<div className='divider divider-horizontal ml-0 mr-2' />
								<div className='text-right'>
									<SubscribeButton
										feedId={feed.id}
										isSubscribed={isFavorite}
										onChange={onFavoriteChange}
									/>
								</div>
							</>
						)}
					</div>
					{/* Title */}
					<h2 className='card-title flex flex-row text-primary line-clamp-2 min-h-[4rem] overflow-hidden text-ellipsis'>
						<FeedImage feed={feed} />
						<a
							href={feed.url || '#'}
							target='_blank'
							rel='noopener noreferrer'
							className='link link-hover'
						>
							{feed.title || 'Untitled feed'}
						</a>
					</h2>

					{/* Description */}
					<div
						className='tooltip'
						data-tip={
							feed.description || 'No description available.'
						}
					>
						<p className='cursor-pointer text-sm text-base-content/70 min-h-[2.5rem] line-clamp-2 overflow-hidden text-ellipsis'>
							{feed.description || 'No description available.'}
						</p>
					</div>

					<div className='divider'>Info</div>
					{/* Main Info */}
					<div className='flex flex-col gap-2 text-sm'>
						{/* Items Count */}
						<div className='flex items-center gap-2'>
							<FileTextIcon size={16} />
							<span>
								{feed.itemsCount
									? `${feed.itemsCount} ${feed.itemsCount === 1 ? 'item' : 'items'}`
									: 'No items'}
							</span>
						</div>

						{/* Generator info */}
						<div className='flex items-center gap-2'>
							<ZapIcon size={16} />
							{feed.generator?.label ? (
								<span>
									Generator: {feed.generator.label}{' '}
									{feed.generator.version}
								</span>
							) : (
								<span>Unknown generator</span>
							)}
						</div>

						{/* Authors */}
						<div className='flex items-center gap-2'>
							<UsersIcon size={16} />
							<span>
								{feed.authors.length > 0
									? feed.authors
											.map(
												(author) =>
													author.name || 'Unknown'
											)
											.join(', ')
									: 'Unknown authors'}
							</span>
						</div>

						{/* Categories */}
						<div className='flex items-center gap-2'>
							<TagsIcon size={16} />
							<span>
								{feed.categories.length > 0
									? feed.categories.join(', ')
									: 'No categories'}
							</span>
						</div>

						{/* Published */}
						<div className='flex items-center gap-2'>
							<UploadIcon size={16} />
							<span>
								{feed.published
									? `Published: ${new Date(feed.published).toLocaleString('pl-PL')}`
									: 'Unknown published date'}
							</span>
						</div>

						{/* Last updated */}
						<div className='flex items-center gap-2'>
							<CalendarIcon size={16} />
							<span>
								{feed.updated
									? `Last updated: ${new Date(feed.updated).toLocaleString('pl-PL')}`
									: 'No update date'}
							</span>
						</div>
						{/* Copyright */}
						<div className='flex items-center gap-2'>
							<ShieldAlertIcon size={14} />
							<span>{feed.copyright || 'No copyright info'}</span>
						</div>
					</div>
				</div>
				{/* DB INFO */}
				<div className='divider'>Database</div>
				<div className='flex flex-col gap-2'>
					<div className='flex items-center gap-2'>
						<DatabaseIcon size={16} />
						<span className='break-all'>ID: {feed.id}</span>
					</div>

					<div className='flex items-center gap-2'>
						<UploadIcon size={16} />
						<span>
							Created:{' '}
							{new Date(feed.createdAt).toLocaleString('pl-PL')}
						</span>
					</div>

					<div className='flex items-center gap-2'>
						<HistoryIcon size={16} />
						<span>
							Updated:{' '}
							{new Date(feed.updatedAt).toLocaleString('pl-PL')}
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}
