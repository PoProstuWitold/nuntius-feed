'use client'

import { ArrowUpLeft, LinkIcon, RotateCw, TrashIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import type { Feed } from '../types'
import { client } from '../utils/client-rpc'
import { getFlagEmoji } from '../utils/functions'

const FeedRow = ({
	feed,
	onRefresh,
	onDelete
}: {
	feed: Feed
	onRefresh: (feedLink: string | null) => void
	onDelete: (feedLink: string) => void
}) => {
	return (
		<tr>
			<th>
				<span>
					<Link
						href={`/feed/${feed.id}`}
						className='btn btn-secondary btn-sm'
					>
						<ArrowUpLeft size={15} /> Visit
					</Link>
				</span>
			</th>
			<td>
				<div className='tooltip tooltip-bottom' data-tip={feed.url}>
					<a
						href={feed.url || '#'}
						target='_blank'
						rel='noopener noreferrer'
						className='link link-hover font-bold text-primary line-clamp-1 overflow-hidden text-ellipsis'
					>
						{feed.url}
					</a>
				</div>
			</td>
			<td>
				<div
					className='tooltip tooltip-bottom flex items-center gap-2'
					data-tip={feed.self}
				>
					<LinkIcon size={16} />
					{feed.self ? (
						<a
							href={feed.self}
							target='_blank'
							rel='noopener noreferrer'
							className='link link-hover'
						>
							{feed.meta.type?.toUpperCase() || 'Unknown'}{' '}
							{feed.meta.version || ''}
						</a>
					) : (
						<span>No feed source</span>
					)}
				</div>
			</td>
			<td>{getFlagEmoji(feed.language, feed.url)}</td>
			<td>
				<div
					className='tooltip tooltip-bottom'
					data-tip={feed.description || 'No description available.'}
				>
					<p className='cursor-pointer text-sm text-base-content/70 line-clamp-1 overflow-hidden text-ellipsis'>
						{feed.description || 'No description available.'}
					</p>
				</div>
			</td>
			<td className='flex gap-2'>
				<button
					onClick={() => onRefresh(feed.self)}
					className='btn btn-sm btn-primary'
					type='button'
				>
					<RotateCw size={16} />
				</button>
				<button
					onClick={() => onDelete(feed.id)}
					className='btn btn-sm btn-error'
					type='button'
				>
					<TrashIcon size={16} />
				</button>
			</td>
		</tr>
	)
}

export const FeedList = () => {
	const [feeds, setFeeds] = useState<Feed[]>([])
	const [page, setPage] = useState(1)
	const [loading, setLoading] = useState(false)
	const [hasMore, setHasMore] = useState(true)

	const loadFeeds = async (pageToLoad = page, reset = false) => {
		setLoading(true)
		try {
			const res = await client.api.feed.$get({
				query: {
					page: pageToLoad,
					limit: 12,
					offset: (pageToLoad - 1) * 12
				}
			})
			const data = await res.json()
			if (data.feeds.length === 0) {
				setHasMore(false)
			} else {
				setFeeds((prev) => {
					const all = reset ? data.feeds : [...prev, ...data.feeds]
					const seen = new Set<string>()
					return all.filter((f) => {
						if (seen.has(f.id)) return false
						seen.add(f.id)
						return true
					})
				})
				setPage(pageToLoad + 1)
			}
		} catch (_err) {
			toast.error('Failed to load feeds')
		}
		setLoading(false)
	}

	// biome-ignore lint: Needs to be loaded once, so we need empty deps array
	useEffect(() => {
		loadFeeds()
	}, [])

	const handleRefresh = async (feedLink: string | null) => {
		try {
			await client.api.feed.$post({ json: { feedLink } })
			toast.success('Feed refreshed!')
			await loadFeeds(1, true)
		} catch {
			toast.error('Failed to refresh feed')
		}
	}

	const handleDelete = async (id: string) => {
		try {
			await client.api.feed[':id'].$delete({ param: { id } })
			toast.success('Feed deleted!')
			await loadFeeds(1, true)
		} catch {
			toast.error('Failed to delete feed')
		}
	}

	return (
		<div className='mx-auto my-10'>
			<h1 className='text-2xl font-bold'>Feed List</h1>

			<div className='overflow-x-auto'>
				<table className='table table-zebra'>
					<thead>
						<tr>
							<th>Feed</th>
							<th className='min-w-[18rem]'>Title</th>
							<th className='min-w-[8rem]'>Source</th>
							<th className='max-w-[5rem]'>Language</th>
							<th>Description</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{feeds.map((feed) => (
							<FeedRow
								key={feed.id}
								feed={feed}
								onRefresh={handleRefresh}
								onDelete={handleDelete}
							/>
						))}
					</tbody>
				</table>
			</div>

			<div className='flex justify-center'>
				{hasMore && (
					<button
						onClick={() => loadFeeds()}
						className='btn btn-outline'
						disabled={loading}
						type='button'
					>
						{loading ? 'Loading...' : 'Load More'}
					</button>
				)}
				{!hasMore && <p className='text-gray-500'>No more feeds</p>}
			</div>
		</div>
	)
}
