import { InfoIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { FeedLandingList } from './components/FeedLandingList'
import { SearchInput } from './components/SearchInput'
import type { Feed } from './types'
import { client } from './utils/server-rpc'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Nuntius Feed',
	description:
		'Your personal herald for the digital age. A lightweight web application for subscribing to and reading RSS and Atom feeds.'
}

export default async function Home({
	searchParams
}: {
	searchParams?: Promise<Record<string, string | string[]>>
}) {
	const resolvedParams = await searchParams
	const limit = 12
	const offset = 0

	const sortBy =
		typeof resolvedParams?.sortBy === 'string'
			? resolvedParams.sortBy
			: 'updatedAt'
	const sortOrder =
		typeof resolvedParams?.sortOrder === 'string'
			? resolvedParams.sortOrder
			: 'desc'
	const search =
		typeof resolvedParams?.search === 'string'
			? resolvedParams.search.trim()
			: ''

	const v1 = await client.api.v1.$get()
	const text = await v1.text()

	const res = await client.api.feed.$get({
		query: {
			limit: limit.toString(),
			offset: offset.toString(),
			sortBy,
			sortOrder,
			...(search ? { search } : {})
		}
	})

	const data = await res.json()

	const subs = await client.api.user.subscriptions.$get()
	const json = await subs.json()
	const subIds = json.subscriptions.map((s: Feed) => s.id)

	return (
		<>
			{/* Info about refreshing feeds every 30 minutes */}
			<div className='flex flex-col justify-center mb-3'>
				<h1 className='text-4xl font-bold lg:text-left text-center'>
					Nuntius Feed
				</h1>
				<p>{text}</p>
			</div>
			<div className='flex flex-col justify-center m-0 p-0'>
				<p className='text-sm bg-accent p-4 text-accent-content items-center flex flex-row gap-2 font-bold mb-10 rounded-full'>
					<InfoIcon size={30} /> Feeds are automatically refreshed
					every 30 minutes. Admin users can refresh them on demand at
					any time.
				</p>
			</div>

			<SearchInput />
			<FeedLandingList
				initialFeeds={data.feeds}
				initialPage={1}
				initialSearch={search}
				initialSubscriptions={subIds}
				initialPagination={data.pagination}
			/>
		</>
	)
}
