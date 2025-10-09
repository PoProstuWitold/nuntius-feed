import { InfoIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { FeedLandingList } from './components/FeedLandingList'
import { SearchInput } from './components/SearchInput'
import type { Feed } from './types'
import { parseSearchParams } from './utils/functions'
import { client } from './utils/server-rpc'
import { getUser } from './utils/user'

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
	const { limit, offset, sortBy, sortOrder, search } = parseSearchParams(
		resolvedParams,
		12
	)

	const v1 = await client.api.v1.$get()
	const text = await v1.text()

	const res = await client.api.feed.$get({
		query: {
			limit,
			offset,
			sortBy,
			sortOrder,
			...(search ? { search } : {})
		}
	})

	const data = await res.json()

	const subs = await client.api.user.subscriptions.all.$get()
	const json = await subs.json()
	// @ts-expect-error
	const subIds = json.subscriptions?.map((s: Feed) => s.id) || []

	const user = await getUser()

	return (
		<>
			{/* Info about refreshing feeds every 30 minutes */}
			<div className='flex flex-col justify-center mb-3'>
				<h1 className='text-4xl font-bold lg:text-left text-center'>
					NuntiusFeed
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
				userId={user?.sub}
				initialFeeds={data.feeds}
				initialSubscriptions={subIds}
				initialPagination={data.pagination}
			/>
		</>
	)
}
