'use client'

import {
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
import type { Feed } from '../types'

// Funkcja pomocnicza do flag emoji na podstawie języka
function getFlagEmoji(language: string | null) {
	if (!language) return '🏳️'
	const lang = language.split('-')[1] || language
	const codePoints = lang
		.toUpperCase()
		.split('')
		.map((char) => 127397 + char.charCodeAt(0))
	return String.fromCodePoint(...codePoints)
}

export const FeedCard = ({ feed }: { feed: Feed }) => {
	return (
		<div className='card bg-base-100 shadow-md border border-base-300 relative overflow-hidden'>
			{/* Ribbon / Wstążka */}
			<div className='absolute top-1 right-[-30px] w-[100px] bg-primary text-primary-content text-center font-bold py-1 rotate-45 shadow-md'>
				{getFlagEmoji(feed.language)}
			</div>

			<div className='card-body flex flex-col justify-between'>
				<div className='flex flex-col gap-4'>
					{/* Title */}
					<h2 className='card-title text-primary'>
						<a
							href={feed.url || '#'}
							target='_blank'
							rel='noopener noreferrer'
							className='link link-hover'
						>
							{feed.title || 'Untitled feed'}
						</a>
					</h2>

					{/* Feed source + standard info */}
					<div className='flex items-center gap-2 text-sm text-base-content/70'>
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
					</div>

					{/* Description */}
					<p className='text-sm text-base-content/70 min-h-[3rem] line-clamp-2 overflow-hidden text-ellipsis'>
						{feed.description || 'No description available.'}
					</p>

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
								<a
									href={
										feed.generator.url ||
										feed.generator.label
									}
									target='_blank'
									rel='noopener noreferrer'
									className='link link-hover'
								>
									Generator: {feed.generator.label}{' '}
									{feed.generator.version}
								</a>
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
									? `Published: ${new Date(feed.published).toLocaleDateString('pl-PL')}`
									: 'Unknown published date'}
							</span>
						</div>

						{/* Last updated */}
						<div className='flex items-center gap-2'>
							<CalendarIcon size={16} />
							<span>
								{feed.updated
									? `Last updated: ${new Date(feed.updated).toLocaleDateString('pl-PL')}`
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
							{new Date(feed.createdAt).toLocaleDateString(
								'pl-PL'
							)}
						</span>
					</div>

					<div className='flex items-center gap-2'>
						<HistoryIcon size={16} />
						<span>
							Updated:{' '}
							{new Date(feed.updatedAt).toLocaleDateString(
								'pl-PL'
							)}
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}
