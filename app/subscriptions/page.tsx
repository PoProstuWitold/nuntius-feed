import type { Metadata } from 'next'
import { SubscriptionsClientPage } from '../components/SubscriptionsClientPage'
import type { Feed, FeedPagination } from '../types'
import { parseSearchParams } from '../utils/functions'
import { client } from '../utils/server-rpc'

export const metadata: Metadata = {
	title: 'Subscribed Channels',
	description: 'List of channels you are subscribed to'
}

export default async function SubscriptionsPage({
	searchParams
}: {
	searchParams?: Promise<Record<string, string | string[]>>
}) {
	const resolvedParams = await searchParams
	const { limit, offset, sortBy, sortOrder, search } = parseSearchParams(
		resolvedParams,
		12
	)

	const res = await client.api.user.subscriptions.$get({
		query: {
			limit,
			offset,
			sortBy,
			sortOrder,
			...(search ? { search } : {})
		}
	})
	const data = (await res.json()) as {
		subscriptions: Feed[]
		pagination: FeedPagination
	}

	return (
		<SubscriptionsClientPage
			initialSubscriptions={data.subscriptions}
			initialPagination={data.pagination}
		/>
	)
}
