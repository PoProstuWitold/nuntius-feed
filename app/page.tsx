import type { Metadata } from 'next'
import Link from 'next/link'
import { FeedCard } from './components/FeedCard'
import type { FeedsResponse } from './types'
import { client } from './utils/server-rpc'

export const metadata: Metadata = {
	title: 'Nuntius Feed',
	description:
		'Your personal herald for the digital age. A lightweight web application for subscribing to and reading RSS and Atom feeds.'
}

export default async function Home({
	searchParams
}: {
	searchParams?: { page?: string }
}) {
	const page = Number(searchParams?.page || '1')
	const limit = 10
	const offset = (page - 1) * limit

	const v1 = await client.api.v1.$get()
	const text = await v1.text()

	const res = await client.api.feed.$get({
		query: {
			limit: limit.toString(),
			offset: offset.toString(),
			sortBy: 'createdAt',
			sortOrder: 'desc'
		}
	})

	const data: FeedsResponse = await res.json()

	return (
		<>
			<div className='flex flex-col justify-center mb-10'>
				<h1 className='text-4xl font-bold lg:text-left text-center'>
					Nuntius Feed
				</h1>
				<p>{text}</p>
			</div>
			{/* Feed list */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
				{data.feeds.map((feed) => (
					<FeedCard key={feed.id} feed={feed} />
				))}
			</div>

			{/* Pagination */}
			<div className='flex justify-center gap-4'>
				{data.pagination.hasPreviousPage && (
					<Link
						href={`/?page=${data.pagination.previousPage}`}
						className='btn btn-outline'
					>
						Previous
					</Link>
				)}
				<span className='btn btn-disabled'>
					Page {data.pagination.currentPage} of{' '}
					{data.pagination.totalPages}
				</span>
				{data.pagination.hasNextPage && (
					<Link
						href={`/?page=${data.pagination.nextPage}`}
						className='btn btn-outline'
					>
						Next
					</Link>
				)}
			</div>
		</>
	)
}
