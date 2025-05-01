import type { Metadata } from 'next'
import { FeedLandingList } from './components/FeedLandingList'
import { client } from './utils/server-rpc'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Nuntius Feed',
	description:
		'Your personal herald for the digital age. A lightweight web application for subscribing to and reading RSS and Atom feeds.'
}

export default async function Home() {
	const limit = 12
	const offset = 0
	const sortBy = 'updatedAt'
	const sortOrder = 'desc'

	const v1 = await client.api.v1.$get()
	const text = await v1.text()

	const res = await client.api.feed.$get({
		query: {
			limit: limit.toString(),
			offset: offset.toString(),
			sortBy,
			sortOrder
		}
	})

	const data = await res.json()

	return (
		<>
			<div className='flex flex-col justify-center mb-10'>
				<h1 className='text-4xl font-bold lg:text-left text-center'>
					Nuntius Feed
				</h1>
				<p>{text}</p>
			</div>

			<FeedLandingList initialFeeds={data.feeds} initialPage={1} />
		</>
	)
}
