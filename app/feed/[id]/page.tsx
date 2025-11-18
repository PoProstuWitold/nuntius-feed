import { FileTextIcon, LinkIcon } from 'lucide-react'
import { FeedClientPage } from '@/app/components/FeedClientPage'
import { FeedImage } from '@/app/components/FeedImage'
import { SubscribeButton } from '@/app/components/SubscribeButton'
import type { Item } from '@/app/types'
import { getFlagEmoji } from '@/app/utils/functions'
import { client } from '@/app/utils/server-rpc'
import { getUser } from '@/app/utils/user'

export async function generateMetadata({
	params
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const res = await client.api.feed[':id'].$get({ param: { id } })
	const json = await res.json()

	if (!json.success || !json.feed) {
		return {
			title: 'Feed not found',
			description: 'No feed with that ID'
		}
	}

	return {
		title: json.feed.title || 'Untitled Feed',
		description: json.feed.description || 'No description',
		openGraph: {
			title: json.feed.title || 'Untitled Feed',
			description: json.feed.description || 'No description',
			url: json.feed.url || '',
			siteName: 'NuntiusFeed'
		}
	}
}

export default async function FeedIdPage({
	params
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const feedRes = await client.api.feed[':id'].$get({
		param: {
			id
		}
	})
	const feedJson = await feedRes.json()
	if (!feedJson.feed || !feedJson.success) {
		return (
			<div>
				<h1 className='text-4xl font-bold lg:text-left text-center mb-4'>
					Feed not found
				</h1>
				<p>Feed with ID: {id} not found</p>
			</div>
		)
	}
	const itemsRes = await client.api.feed[':id'].items.$get({
		param: {
			id
		},
		query: {
			limit: '10',
			offset: '0'
		}
	})
	const json = await itemsRes.json()
	const jsonItems = json.items as Item[]

	const feed = feedJson.feed

	const favs = await client.api.user.favorites.$get()
	const favsJson = (await favs.json()) as
		| { message: string }
		| { message: string; favorites: { id: string }[] }
	const favGuids =
		'favorites' in favsJson ? favsJson.favorites.map((fav) => fav.id) : []

	const isSubToFeed = await client.api.user.subscriptions[':id'].$get({
		param: {
			id: feed.id
		}
	})
	const isSubToFeedJson = (await isSubToFeed.json()) as unknown as
		| { success: false }
		| { success: true; isSubscribed: boolean }
	const user = await getUser()

	return (
		<div>
			{/* Feed */}
			<div className='flex flex-col gap-6'>
				{/* Feed source + standard info */}
				<div className='flex items-center text-base-content/70'>
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
					<div className='divider divider-horizontal' />
					<div className='bg-primary text-primary-content text-center font-bold py-2 px-5  rounded-md shadow-md'>
						{getFlagEmoji(feed.language, feed.url).includes(
							'(?)'
						) ? (
							<div
								className='tooltip tooltip-bottom cursor-pointer'
								data-tip='Auto-detected'
							>
								<span>
									{getFlagEmoji(feed.language, feed.url)}
								</span>
							</div>
						) : (
							<span>{getFlagEmoji(feed.language, feed.url)}</span>
						)}
					</div>
					{user && (
						<>
							{/* Subscribe Button */}
							<div className='divider divider-horizontal' />
							<div className='mt-2 mr-2'>
								<SubscribeButton
									feedId={feed.id}
									isSubscribed={
										'success' in isSubToFeedJson &&
										isSubToFeedJson.success === true
											? isSubToFeedJson.isSubscribed
											: false
									}
								/>
							</div>
						</>
					)}
				</div>
				{/* Title */}
				<h2 className='text-primary text-4xl font-bold flex flex-row items-center gap-4'>
					{/* LOGO */}
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
				<div>
					<p className='text-xl text-base-content/70 min-h-[2.5rem] line-clamp-2 overflow-hidden text-ellipsis'>
						{feed.description || 'No description available.'}
					</p>
				</div>
				<div>
					{/* Feed details */}
					<div className='flex flex-col gap-4'>
						<div className='flex items-center gap-2'>
							<FileTextIcon size={16} />
							<span className='text-base-content/70'>
								Refreshed:{' '}
								{new Date(feed.updatedAt).toLocaleString(
									'pl-PL'
								)}
							</span>
						</div>
					</div>
				</div>
			</div>
			<div className='divider'>Items ({feed.itemsCount} in total)</div>
			{/* Items */}
			<FeedClientPage
				userId={user?.sub}
				feed={feedJson.feed}
				initialItems={jsonItems}
				initialPagination={json.pagination}
				initialFavorites={favGuids}
			/>
		</div>
	)
}
